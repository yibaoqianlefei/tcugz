import { useRef, useEffect, Suspense, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useNodeStore } from "../../store/nodeStore";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { canonicalName } from "../../utils/nameUtils";

/* ── Module-level refs ─────────────────────────────────────── */
let _actions: THREE.AnimationAction[] = [];
let _modelScene: THREE.Group | null = null;
let _controls: OrbitControlsImpl | null = null;
let _isUserDragging = false;
const _scaleCache = new Map<string, number>();

export const animControls = {
  play() {
    _actions.forEach((a) => { a.timeScale = 1; a.paused = false; });
    if (_actions.length > 0) useNodeStore.getState().setIsPlaying(true);
  },

  playReverse() {
    _actions.forEach((a) => { a.timeScale = -1; a.paused = false; });
    if (_actions.length > 0) useNodeStore.getState().setIsPlaying(true);
  },

  pause() {
    _actions.forEach((a) => { a.paused = true; });
    useNodeStore.getState().setIsPlaying(false);
  },

  setTime(t: number) {
    _actions.forEach((a) => {
      a.time = t;
      a.paused = true;
      a.getMixer().update(0);
    });
  },
};

/* ── Renderer setup ───────────────────────────────────────── */
function RendererSetup({ showShadows }: { showShadows: boolean }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.shadowMap.enabled = showShadows;
    gl.shadowMap.type = THREE.PCFShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl, showShadows]);
  return null;
}

/* ── Model component (auto-center + highlight + animation) ──── */
function SceneModel({ modelPath, containerWidth = 0 }: { modelPath: string; containerWidth?: number }) {
  const { scene, animations } = useGLTF(modelPath, true);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const clipRef = useRef<THREE.AnimationClip | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const meshMapRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
  const prevHovered = useRef<string | null>(null);
  const prevSelected = useRef<string | null>(null);
  const scaleApplied = useRef(false);

  const setSelectedObject = useNodeStore((s) => s.setSelectedObject);
  const setHoveredObject = useNodeStore((s) => s.setHoveredObject);
  const setIsPlaying = useNodeStore((s) => s.setIsPlaying);
  const setAnimationProgress = useNodeStore((s) => s.setAnimationProgress);

  // ── Standard initialization ──
  useEffect(() => {
    if (!scene) return;

    // Debug: log animation info
    console.log("[GLB] animations:", animations);
    console.log("[GLB] animations.length:", animations.length);
    if (animations.length > 0) {
      console.log("[GLB] clip:", animations[0]);
      console.log("[GLB] clip.name:", animations[0]?.name);
      console.log("[GLB] clip.duration:", animations[0]?.duration);
      console.log("[GLB] tracks:", animations[0]?.tracks);
      console.log("[GLB] tracks.length:", animations[0]?.tracks?.length);
    }

    // ── Auto-size: scale model to fit view (computed once per model) ──
    if (!_scaleCache.has(modelPath)) {
      scene.scale.setScalar(1);
      scene.updateMatrixWorld();
      const rawBox = new THREE.Box3().setFromObject(scene);
      const rawSize = new THREE.Vector3();
      rawBox.getSize(rawSize);
      const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
      if (maxDim > 0.01) {
        const targetSize = 3.5;
        const rawScale = targetSize / maxDim;
        const scale = Math.max(0.3, Math.min(3, rawScale));
        _scaleCache.set(modelPath, scale);
      }
    }
    const cachedScale = _scaleCache.get(modelPath) ?? 1;
    scene.scale.setScalar(cachedScale);
    scene.updateMatrixWorld();
    console.log("[ModelViewer] 最终应用缩放:", cachedScale, "| model:", modelPath);

    // ── Auto-center after scaling ──
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    scene.position.set(-center.x, -center.y, -center.z);

    // Expose scene for camera auto-frame
    _modelScene = scene;

    // Build mesh map + shadow flags + edge lines + hit proxies
    const isFirstInit = !scaleApplied.current;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.userData.isHitProxy) return;

        child.castShadow = true;
        child.receiveShadow = true;

        if (child.name) {
          // ── Logical name (canonical form — matches Three.js runtime) ──
          const par = child.parent;
          const isGrouped = par && par.type === "Group" && par.name && par.name !== "Scene";
          const logicalName = canonicalName(isGrouped ? par!.name : child.name);

          // Always rebuild meshMapRef (needed each mount)
          if (!meshMapRef.current.has(logicalName)) {
            meshMapRef.current.set(logicalName, []);
          }
          meshMapRef.current.get(logicalName)!.push(child);

          // Proxies + raycast disable — only first mount (prevent duplicates)
          if (isFirstInit) {
            const proxy = new THREE.Mesh(child.geometry.clone(), new THREE.MeshBasicMaterial());
            proxy.name = logicalName;
            proxy.visible = false;
            proxy.scale.set(1.03, 1.03, 1.03);
            proxy.userData.isHitProxy = true;
            child.add(proxy);
            child.raycast = () => {};
          }
        }

        // Edge lines — only first mount
        if (isFirstInit) {
          const edges = new THREE.EdgesGeometry(child.geometry, 15);
          const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: "#374151", toneMapped: false }),
          );
          line.raycast = () => {};
          child.add(line);
        }
      }
    });

    // ── Clone shared materials (first mount only) ──
    if (isFirstInit) {
      meshMapRef.current.forEach((meshes) => {
        meshes.forEach((mesh) => {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => m.clone());
          } else {
            mesh.material = mesh.material.clone();
          }
        });
      });
      scaleApplied.current = true;
    }

    // AnimationMixer — play ALL clips simultaneously
    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene);
      const actions: THREE.AnimationAction[] = [];

      animations.forEach((clip, i) => {
        const action = mixer.clipAction(clip);
        action.reset();
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.paused = true; // don't auto-play
        action.play();
        actions.push(action);
        console.log(`[GLB] clip[${i}] "${clip.name}" loaded, duration=${clip.duration}`);
      });

      mixerRef.current = mixer;
      actionRef.current = actions[0];
      clipRef.current = animations.reduce((a, b) => a.duration > b.duration ? a : b);
      _actions = actions;

      // Force mesh transforms to animation time=0 (cached scene may have stale pose)
      // Use tiny delta — mixer.update(0) may be optimized away
      actions.forEach((a) => { a.paused = false; });
      mixer.update(0.001);
      actions.forEach((a) => { a.paused = true; });
      mixer.update(0);
      setIsPlaying(false);
    }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current.uncacheRoot(scene);
      }
      _actions = [];
      _modelScene = null;
    };
  }, [scene, animations, setIsPlaying]);

  // ── Viewport-responsive scale: shrink model when canvas narrows ──
  const initialWidthRef = useRef(0);
  useEffect(() => {
    if (!scene || containerWidth <= 0) return;
    const baseScale = _scaleCache.get(modelPath) ?? 1;
    // Use initial container width as baseline, not a hardcoded value
    if (initialWidthRef.current === 0) initialWidthRef.current = containerWidth;
    const refWidth = initialWidthRef.current;
    const ratio = Math.min(1, Math.max(0.4, containerWidth / refWidth));
    const adjusted = baseScale * ratio;
    scene.scale.setScalar(adjusted);
    scene.updateMatrixWorld();
    console.log("[ModelViewer] containerWidth:", containerWidth, "refWidth:", refWidth, "ratio:", ratio, "adjusted:", adjusted);
    // Re-center camera after scale change
    if (_modelScene && _controls) {
      const box = new THREE.Box3().setFromObject(_modelScene);
      const center = new THREE.Vector3();
      box.getCenter(center);
      _controls.target.copy(center);
      _controls.update();
    }
  }, [containerWidth, modelPath, scene]);

  // ── Per-frame: mixer update + boundary auto-pause ────────
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(Math.min(delta, 0.033));

      if (clipRef.current && actionRef.current) {
        const t = actionRef.current.time;
        const d = clipRef.current.duration;

        // Auto-pause at boundaries
        if (t >= d) {
          actionRef.current.time = d;
          _actions.forEach((a) => { a.paused = true; });
          setIsPlaying(false);
          setAnimationProgress(1);
        } else if (t <= 0) {
          actionRef.current.time = 0;
          _actions.forEach((a) => { a.paused = true; });
          setIsPlaying(false);
          setAnimationProgress(0);
        } else {
          setAnimationProgress(t / d);
        }
      }
    }
  });

  // Subscribe to store changes (threshold-filtered)
  const hoveredObject = useNodeStore((s) => s.hoveredObject);
  const selectedObject = useNodeStore((s) => s.selectedObject);
  const highlightEnabled = useNodeStore((s) => s.animationProgress >= 0.99);
  const setGroupEmissive = (name: string | null, color: string, intensity: number) => {
    if (!name) return;
    const clean = canonicalName(name);
    const meshes = meshMapRef.current.get(clean);
    if (!meshes) return;
    meshes.forEach((mesh) => {
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[];
      mats.forEach((m) => { m.emissive?.set(color); m.emissiveIntensity = intensity; });
    });
  };

  // ── Apply highlights (only after full explosion) ──
  useEffect(() => {
    if (!highlightEnabled) {
      setGroupEmissive(prevHovered.current, "#000000", 0);
      setGroupEmissive(prevSelected.current, "#000000", 0);
      prevHovered.current = null;
      prevSelected.current = null;
      return;
    }

    // Clear previous
    if (prevHovered.current && prevHovered.current !== selectedObject) {
      setGroupEmissive(prevHovered.current, "#000000", 0);
    }
    if (prevSelected.current && prevSelected.current !== selectedObject) {
      if (prevSelected.current !== hoveredObject) {
        setGroupEmissive(prevSelected.current, "#000000", 0);
      }
    }

    // Apply selected (highest priority)
    setGroupEmissive(selectedObject, "#d4a843", 0.5);

    // Apply hover (lower priority, only if not selected)
    if (hoveredObject && hoveredObject !== selectedObject) {
      setGroupEmissive(hoveredObject, "#ffffff", 0.15);
    }

    prevHovered.current = hoveredObject;
    prevSelected.current = selectedObject;
  }, [highlightEnabled, hoveredObject, selectedObject]);

  // ── Helper: resolve logical name from intersection ──
  const findNamedMesh = (obj: THREE.Object3D): string | null => {
    // Parent Group (only if it's a real Group, not Scene root)
    if (obj.parent && obj.parent.type === "Group" && obj.parent.name && obj.parent.name !== "Scene") {
      return canonicalName(obj.parent.name);
    }
    // Direct hit on a named Mesh
    if (obj instanceof THREE.Mesh && obj.name) return canonicalName(obj.name);
    return null;
  };

  // ── R3F native pointer events (only active after full explosion) ──
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (useNodeStore.getState().animationProgress < 0.99) return;
    const name = findNamedMesh(e.object);
    if (name) setHoveredObject(name);
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredObject(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (useNodeStore.getState().animationProgress < 1) return;
    const name = findNamedMesh(e.object);
    if (name) {
      const current = useNodeStore.getState().selectedObject;
      setSelectedObject(current === name ? null : name);
    }
  };

  return (
    <group
      ref={groupRef}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <primitive object={scene} />
    </group>
  );
}

/* ── Lighting ─────────────────────────────────────────────── */
function SceneLights({ showShadows }: { showShadows: boolean }) {
  return (
    <>
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight
        position={[8, 12, 6]} intensity={2.5} color="#fffdf7"
        castShadow={showShadows}
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-near={0.5} shadow-camera-far={30}
        shadow-camera-left={-6} shadow-camera-right={6}
        shadow-camera-top={6} shadow-camera-bottom={-6}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-5, 3, -3]} intensity={0.6} color="#d4e3f0" />
    </>
  );
}

/* ── Ground shadow ────────────────────────────────────────── */
function ShadowPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <shadowMaterial opacity={0.25} transparent depthWrite={false} />
    </mesh>
  );
}

/* ── Loading fallback ─────────────────────────────────────── */
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#bfb9ae" roughness={0.6} wireframe />
    </mesh>
  );
}

/* ── Camera tracker: 02-2 style explosion target interpolation ── */
function CameraTracker({ layoutKey = 0, containerWidth = 0 }: { layoutKey?: number; containerWidth?: number }) {
  const boxRef = useRef(new THREE.Box3());
  const centerRef = useRef(new THREE.Vector3());
  const listenersAttached = useRef(false);
  const { size } = useThree(); // react to canvas resize

  // Force re-center on viewport resize, container width change, OR layout change
  useEffect(() => {
    const controls = _controls;
    const scene = _modelScene;
    if (!controls || !scene) return;
    // Small delay lets the renderer flush the new size
    const t = setTimeout(() => {
      const box = new THREE.Box3().setFromObject(scene);
      const center = new THREE.Vector3();
      box.getCenter(center);
      controls.target.copy(center);
      controls.update();
    }, 80);
    return () => clearTimeout(t);
  }, [size.width, size.height, containerWidth, layoutKey]);

  useFrame((_, delta) => {
    const controls = _controls;
    const scene = _modelScene;
    if (!controls || !scene) return;

    // Lazy-attach drag listeners
    if (!listenersAttached.current) {
      listenersAttached.current = true;
      controls.addEventListener("start", () => { _isUserDragging = true; });
      controls.addEventListener("end", () => { _isUserDragging = false; });
    }

    // Pause during user drag
    if (_isUserDragging) return;

    // Dynamic Box3 from current animation frame
    const box = boxRef.current;
    box.setFromObject(scene);
    box.getCenter(centerRef.current);

    // Fast lerp orbit target to current center (02-2 style)
    const alpha = 1 - Math.exp(-8.0 * delta);
    controls.target.lerp(centerRef.current, alpha);
  });

  return null;
}

/* ── Public component ─────────────────────────────────────── */
export default function ModelViewer({
  autoRotate = true,
  modelPath,
  showShadows = true,
  layoutKey = 0,
}: {
  autoRotate?: boolean;
  modelPath: string;
  showShadows?: boolean;
  layoutKey?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // ResizeObserver: watch the actual DOM pixel width of the canvas container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex-1 h-full relative bg-[#f5f5f7]">
      <Canvas
        camera={{ near: 0.5, far: 50, position: [0, 0.5, 8], fov: 40 }}
        dpr={[1, 1.5]} shadows
        gl={{ antialias: true, alpha: false }}
      >
        <RendererSetup showShadows={showShadows} />
        <color attach="background" args={["#f5f5f7"]} />
        <SceneLights showShadows={showShadows} />
        {showShadows && <ShadowPlane />}
        <Suspense fallback={<LoadingFallback />}>
          <SceneModel modelPath={modelPath} containerWidth={containerWidth} />
        </Suspense>
        <OrbitControls
          ref={(ctrl) => { _controls = ctrl; }}
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
          enableDamping dampingFactor={0.08}
          minDistance={1} maxDistance={20}
          enablePan
        />
        <CameraTracker layoutKey={layoutKey} containerWidth={containerWidth} />
      </Canvas>
    </div>
  );
}
