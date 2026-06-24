import { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useNodeStore } from "../../store/nodeStore";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

/* ── Module-level refs ─────────────────────────────────────── */
let _actions: THREE.AnimationAction[] = [];
let _modelScene: THREE.Group | null = null;
let _controls: OrbitControlsImpl | null = null;
let _isUserDragging = false;

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
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl, showShadows]);
  return null;
}

/* ── Model component (auto-center + highlight + animation) ──── */
function SceneModel({ modelPath }: { modelPath: string }) {
  const { scene, animations } = useGLTF(modelPath, true);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const clipRef = useRef<THREE.AnimationClip | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const meshMapRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
  const prevHovered = useRef<string | null>(null);
  const prevSelected = useRef<string | null>(null);

  const setSelectedObject = useNodeStore((s) => s.setSelectedObject);
  const setHoveredObject = useNodeStore((s) => s.setHoveredObject);
  const setIsPlaying = useNodeStore((s) => s.setIsPlaying);
  const setAnimationProgress = useNodeStore((s) => s.setAnimationProgress);

  // ── Standard initialization (V1.1.1) ──────────────────────
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

    // Auto-center via Box3
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    scene.position.set(-center.x, -center.y, -center.z);

    // Expose scene for camera auto-frame
    _modelScene = scene;

    // Build mesh map + shadow flags + edge lines + hit proxies (one-time)
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.userData.isHitProxy) return; // skip proxies added during this traversal

        child.castShadow = true;
        child.receiveShadow = true;

        if (child.name) {
          // ── Logical name: parent Group for multi-material, child.name otherwise ──
          const par = child.parent;
          const isGrouped = par && par.type === "Group" && par.name && par.name !== "Scene";
          const logicalName = isGrouped ? par!.name : child.name;

          // Group all sub-meshes under the logical name
          if (!meshMapRef.current.has(logicalName)) {
            meshMapRef.current.set(logicalName, []);
          }
          meshMapRef.current.get(logicalName)!.push(child);

          // ── Invisible hit proxy: slightly enlarged for reliable raycasting ──
          // The visible mesh won't catch rays; the proxy handles hits and follows animation.
          const proxy = new THREE.Mesh(
            child.geometry.clone(),
            new THREE.MeshBasicMaterial(),
          );
          proxy.name = logicalName;       // use logical (group) name
          proxy.visible = false;          // invisible to camera, still raycastable
          proxy.scale.set(1.03, 1.03, 1.03); // 3% fat-finger tolerance
          proxy.userData.isHitProxy = true;
          child.add(proxy);

          // Disable raycast on the visible mesh — proxy handles all hits
          child.raycast = () => {};
        }

        // Construction edge lines — attached as child so they animate with the mesh
        // raycast disabled so pointer events pass through to the hit proxy
        const edges = new THREE.EdgesGeometry(child.geometry, 15);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: "#374151", toneMapped: false }),
        );
        line.raycast = () => {};
        child.add(line);
      }
    });

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

  // Subscribe to store changes for highlight updates
  const hoveredObject = useNodeStore((s) => s.hoveredObject);
  const selectedObject = useNodeStore((s) => s.selectedObject);
  const highlightEnabled = useNodeStore((s) => s.animationProgress) >= 0.99;

  // ── Helper: apply emissive to all sub-meshes in a group ──
  const setGroupEmissive = (name: string | null, color: string, intensity: number) => {
    if (!name) return;
    const meshes = meshMapRef.current.get(name);
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
    setGroupEmissive(selectedObject, "#cc785c", 0.4);

    // Apply hover (lower priority, only if not selected)
    if (hoveredObject && hoveredObject !== selectedObject) {
      setGroupEmissive(hoveredObject, "#ffffff", 0.15);
    }

    prevHovered.current = hoveredObject;
    prevSelected.current = selectedObject;
  }, [highlightEnabled, hoveredObject, selectedObject]);

  // ── Strip Three.js auto-suffixes from split meshes ──
  const cleanName = (name: string): string => {
    return name
      .replace(/[_.]\d+$/, "")   // _1, .1, _001, .004
      .replace(/_\d+$/, "");      // _1, _2 (double-pass for nested suffixes)
  };

  // ── Helper: resolve logical name from intersection ──
  const findNamedMesh = (obj: THREE.Object3D): string | null => {
    // Parent Group (only if it's a real Group, not Scene root)
    if (obj.parent && obj.parent.type === "Group" && obj.parent.name && obj.parent.name !== "Scene") {
      return cleanName(obj.parent.name);
    }
    // Direct hit on a named Mesh
    if (obj instanceof THREE.Mesh && obj.name) return cleanName(obj.name);
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
    console.log("[3D点击命中] 实际构件名称:", name, "| e.object.name:", (e.object as any).name, "| e.object.type:", (e.object as any).type);
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
function CameraTracker() {
  const boxRef = useRef(new THREE.Box3());
  const centerRef = useRef(new THREE.Vector3());
  const listenersAttached = useRef(false);

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
export default function ModelViewer({ autoRotate = true, modelPath, showShadows = true }: { autoRotate?: boolean; modelPath: string; showShadows?: boolean }) {
  return (
    <div className="flex-1 h-full relative bg-[#f5f5f7]">
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
          <SceneModel modelPath={modelPath} />
        </Suspense>
        <OrbitControls
          ref={(ctrl) => { _controls = ctrl; }}
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
          enableDamping dampingFactor={0.08}
          minDistance={1} maxDistance={20}
          enablePan
        />
        <CameraTracker />
      </Canvas>
    </div>
  );
}
