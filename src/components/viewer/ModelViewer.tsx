import { useRef, useEffect, Suspense, useState, useCallback } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useNodeStore } from "../../store/nodeStore";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { canonicalName as cnImport, isHitboxName } from "../../utils/nameUtils";
import { registerAnimationActions, getAnimationActions } from "./animationController";

/* ═══════════════════════════════════════════════════════════════
   Material highlight — original-state cache + dual-channel restore
   ═══════════════════════════════════════════════════════════════ */

interface MaterialHighlightState {
  color?: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
}

function hasColor(material: THREE.Material): material is THREE.Material & { color: THREE.Color } {
  return "color" in material && material.color instanceof THREE.Color;
}

function hasEmissive(material: THREE.Material): material is THREE.Material & { emissive: THREE.Color; emissiveIntensity: number } {
  return (
    "emissive" in material &&
    material.emissive instanceof THREE.Color &&
    "emissiveIntensity" in material
  );
}

type HighlightMode = "clear" | "hover" | "selected";

/* ── Module-level refs (non-animation) ──────────────────────── */
let _modelScene: THREE.Group | null = null;
let _controls: OrbitControlsImpl | null = null;
let _isUserDragging = false;
const _scaleCache = new Map<string, number>();

/* ── Renderer setup ───────────────────────────────────────── */
function RendererSetup({ showShadows }: { showShadows: boolean }) {
  const { gl } = useThree();
  useEffect(() => {
    // Three.js WebGLRenderer is an imperative external object managed by R3F.
    // These assignments configure the renderer after Canvas creation — required by Three.js API.
    // eslint-disable-next-line react-hooks/immutability
    gl.shadowMap.enabled = showShadows;
    gl.shadowMap.type = THREE.PCFShadowMap;
    // eslint-disable-next-line react-hooks/immutability
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl, showShadows]);
  return null;
}

/* ── Model component (auto-center + highlight + animation) ──── */
function SceneModel({ modelPath, containerWidth = 0, modelScale = 2.5, modelGroups }: { modelPath: string; containerWidth?: number; modelScale?: number; modelGroups?: Record<string, string> }) {
  const { scene, animations } = useGLTF(modelPath, true);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const clipRef = useRef<THREE.AnimationClip | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const meshMapRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
  const resolveName = useCallback(
    (name: string): string => cnImport(name, modelGroups),
    [modelGroups],
  );
  const prevHovered = useRef<string | null>(null);
  const prevSelected = useRef<string | null>(null);
  const scaleApplied = useRef(false);
  const materialHighlightStateRef = useRef(new WeakMap<THREE.Material, MaterialHighlightState>());

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

    // ── Auto-size ──
    const cacheKey = `${modelPath}::ms${modelScale}`;
    if (!_scaleCache.has(cacheKey)) {
      scene.scale.setScalar(1);
      scene.updateMatrixWorld();
      const rawBox = new THREE.Box3().setFromObject(scene);
      const rawSize = new THREE.Vector3();
      rawBox.getSize(rawSize);
      const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
      if (maxDim > 0.01) {
        const rawScale = modelScale / maxDim;
        const scale = Math.max(0.3, Math.min(5, rawScale));
        _scaleCache.set(cacheKey, scale);
      }
    }
    const cachedScale = _scaleCache.get(cacheKey) ?? 1;
    scene.scale.setScalar(cachedScale);
    scene.updateMatrixWorld();
    console.log("[ModelViewer] 最终应用缩放:", cachedScale, "| model:", modelPath);

    // ── Auto-center ──
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    scene.position.set(-center.x, -center.y, -center.z);
    _modelScene = scene;

    const isFirstInit = !scaleApplied.current;

    // ── Pass 1: detect hitboxes ──
    const hasHitbox = new Set<string>();
    if (isFirstInit) {
      scene.traverse((c) => {
        if (c instanceof THREE.Mesh && c.name && isHitboxName(c.name)) {
          hasHitbox.add(resolveName(c.name));
        }
      });
      if (hasHitbox.size > 0) console.log("[V7] hitbox components:", [...hasHitbox]);
    }

    // ── Pass 2: process meshes ──
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.userData._isProxy) return;
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.name) {
          const isHitbox = isHitboxName(child.name);
          const logicalName = resolveName(child.name);

          if (!isHitbox) {
            if (!meshMapRef.current.has(logicalName)) {
              meshMapRef.current.set(logicalName, []);
            }
            const list = meshMapRef.current.get(logicalName)!;
            if (!list.includes(child)) list.push(child);
          }

          if (isFirstInit) {
            if (isHitbox) {
              child.visible = false;
            } else if (hasHitbox.has(logicalName)) {
              child.raycast = () => {};
            } else {
              const proxy = new THREE.Mesh(child.geometry.clone(), new THREE.MeshBasicMaterial());
              proxy.name = logicalName;
              proxy.visible = false;
              proxy.scale.set(1.06, 1.06, 1.06);
              proxy.userData._isProxy = true;
              child.add(proxy);
              child.raycast = () => {};
            }
          }
        }

        if (isFirstInit && !isHitboxName(child.name)) {
          const edges = new THREE.EdgesGeometry(child.geometry, 15);
          const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: "#1a1a1a", toneMapped: false, transparent: true, opacity: 0.85 }),
          );
          line.raycast = () => {};
          child.add(line);
        }
      }
    });

    // ── Clone materials + save original state ──
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
      meshMapRef.current.forEach((meshes) => {
        meshes.forEach((mesh) => {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            if (materialHighlightStateRef.current.has(m)) return;
            materialHighlightStateRef.current.set(m, {
              color: hasColor(m) ? m.color.clone() : undefined,
              emissive: hasEmissive(m) ? m.emissive.clone() : undefined,
              emissiveIntensity: hasEmissive(m) ? m.emissiveIntensity : undefined,
            });
          });
        });
      });
      scaleApplied.current = true;
    }

    // ── AnimationMixer ──
    let unregister = () => {};
    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene);
      const actions: THREE.AnimationAction[] = [];
      animations.forEach((clip, i) => {
        const action = mixer.clipAction(clip);
        action.reset();
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.paused = true;
        action.play();
        actions.push(action);
        console.log(`[GLB] clip[${i}] "${clip.name}" loaded, duration=${clip.duration}`);
      });
      mixerRef.current = mixer;
      actionRef.current = actions[0];
      clipRef.current = animations.reduce((a, b) => a.duration > b.duration ? a : b);
      unregister = registerAnimationActions(actions);

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
      unregister();
      _modelScene = null;
    };
  }, [scene, animations, setIsPlaying, modelScale, modelPath, resolveName]);

  // ── Viewport-responsive scale ──
  const initialWidthRef = useRef(0);
  const targetScaleRef = useRef(0);
  useEffect(() => {
    if (!scene || containerWidth <= 0) return;
    const cacheKey = `${modelPath}::ms${modelScale}`;
    const baseScale = _scaleCache.get(cacheKey) ?? 1;
    if (initialWidthRef.current === 0) initialWidthRef.current = containerWidth;
    const refWidth = initialWidthRef.current;
    const ratio = Math.min(1, Math.max(0.4, containerWidth / refWidth));
    targetScaleRef.current = baseScale * ratio;
  }, [containerWidth, modelPath, modelScale, scene]);

  useFrame((_, delta) => {
    if (!scene || targetScaleRef.current <= 0) return;
    const current = scene.scale.x;
    const target = targetScaleRef.current;
    const next = current + (target - current) * Math.min(delta * 6, 1);
    if (Math.abs(next - current) > 0.0005) {
      scene.scale.setScalar(next);
      if (_modelScene && _controls) {
        const box = new THREE.Box3().setFromObject(_modelScene);
        const center = new THREE.Vector3();
        box.getCenter(center);
        _controls.target.lerp(center, Math.min(delta * 4, 1));
      }
    }
  });

  // ── Per-frame: mixer update + boundary auto-pause ──
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(Math.min(delta, 0.033));
      if (clipRef.current && actionRef.current) {
        const t = actionRef.current.time;
        const d = clipRef.current.duration;
        if (t >= d) {
          actionRef.current.time = d;
          getAnimationActions().forEach((a) => { a.paused = true; });
          setIsPlaying(false);
          setAnimationProgress(1);
        } else if (t <= 0) {
          actionRef.current.time = 0;
          getAnimationActions().forEach((a) => { a.paused = true; });
          setIsPlaying(false);
          setAnimationProgress(0);
        } else {
          setAnimationProgress(t / d);
        }
      }
    }
  });

  // ═══════════════════════════════════════════════════════════
  //  HIGHLIGHT SYSTEM
  // ═══════════════════════════════════════════════════════════

  const hoveredObject = useNodeStore((s) => s.hoveredObject);
  const selectedObject = useNodeStore((s) => s.selectedObject);
  const highlightEnabled = useNodeStore((s) => s.animationProgress >= 0.99);

  /** Restore a material to its original GLB state from the WeakMap cache. */
  function restoreMaterial(m: THREE.Material): void {
    const state = materialHighlightStateRef.current.get(m);
    if (!state) return;
    if (state.color && hasColor(m)) m.color.copy(state.color);
    if (state.emissive && hasEmissive(m)) { m.emissive.copy(state.emissive); m.emissiveIntensity = state.emissiveIntensity!; }
    m.needsUpdate = true;
  }

  const setGroupHighlight = useCallback(
    (name: string | null, mode: HighlightMode) => {
      if (!name) return;
      const clean = resolveName(name);
      const meshes = meshMapRef.current.get(clean);
      if (!meshes) { if (import.meta.env.DEV) console.log("[highlight] MISS:", name, "→", clean); return; }
      meshes.forEach((mesh) => {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          restoreMaterial(m);
          if (mode === "clear") return;

          if (mode === "hover") {
            if (hasEmissive(m)) {
              m.emissive.set("#ffffff");
              m.emissiveIntensity = 1.25;
            } else if (hasColor(m)) {
              m.color.lerp(new THREE.Color("#8fd8ff"), 0.35);
            }
          } else if (mode === "selected") {
            if (hasEmissive(m)) {
              m.emissive.set("#d4a843");
              m.emissiveIntensity = 1.15;
            } else if (hasColor(m)) {
              m.color.lerp(new THREE.Color("#d4a843"), 0.55);
            }
          }

          m.needsUpdate = true;
        });
      });
    },
    [resolveName],
  );

  // ── Apply highlights: deterministic priority-based ──
  useEffect(() => {
    const namesToReset = new Set<string>();
    if (prevHovered.current) namesToReset.add(prevHovered.current);
    if (prevSelected.current) namesToReset.add(prevSelected.current);
    if (hoveredObject) namesToReset.add(hoveredObject);
    if (selectedObject) namesToReset.add(selectedObject);

    namesToReset.forEach((n) => setGroupHighlight(n, "clear"));

    if (highlightEnabled) {
      if (hoveredObject && hoveredObject !== selectedObject) {
        setGroupHighlight(hoveredObject, "hover");
      }
      if (selectedObject) {
        setGroupHighlight(selectedObject, "selected");
      }
    }

    prevHovered.current = hoveredObject;
    prevSelected.current = selectedObject;
  }, [highlightEnabled, hoveredObject, selectedObject, setGroupHighlight]);

  // ── Picking ──
  const findNamedMesh = (obj: THREE.Object3D): string | null => {
    console.log("[hit] obj:", obj.name, "type:", obj.type, "parent:", obj.parent?.name, "parentType:", obj.parent?.type);
    if (obj.parent && obj.parent.type === "Group" && obj.parent.name && obj.parent.name !== "Scene") {
      const result = resolveName(obj.parent.name);
      console.log("[hit] → parent group:", result);
      return result;
    }
    if (obj instanceof THREE.Mesh && obj.name) {
      const result = resolveName(obj.name);
      console.log("[hit] → mesh:", result);
      return result;
    }
    console.log("[hit] → null");
    return null;
  };

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

/* ── Camera tracker ───────────────────────────────────────── */
function CameraTracker({ layoutKey = 0, containerWidth = 0 }: { layoutKey?: number; containerWidth?: number }) {
  const boxRef = useRef(new THREE.Box3());
  const centerRef = useRef(new THREE.Vector3());
  const listenersAttached = useRef(false);
  const { size } = useThree();

  useEffect(() => {
    const controls = _controls;
    const scene = _modelScene;
    if (!controls || !scene) return;
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
    if (!listenersAttached.current) {
      listenersAttached.current = true;
      controls.addEventListener("start", () => { _isUserDragging = true; });
      controls.addEventListener("end", () => { _isUserDragging = false; });
    }
    if (_isUserDragging) return;
    const box = boxRef.current;
    box.setFromObject(scene);
    box.getCenter(centerRef.current);
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
  modelScale = 2.5,
  modelGroups,
}: {
  autoRotate?: boolean;
  modelPath: string;
  showShadows?: boolean;
  layoutKey?: number;
  modelScale?: number;
  modelGroups?: Record<string, string>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

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
        camera={{ near: 0.5, far: 50, position: [0, 0, 8], fov: 40 }}
        dpr={[1, 1.5]} shadows
        gl={{ antialias: true, alpha: false }}
      >
        <RendererSetup showShadows={showShadows} />
        <color attach="background" args={["#f5f5f7"]} />
        <SceneLights showShadows={showShadows} />
        {showShadows && <ShadowPlane />}
        <Suspense fallback={<LoadingFallback />}>
          <SceneModel modelPath={modelPath} containerWidth={containerWidth} modelScale={modelScale} modelGroups={modelGroups} />
        </Suspense>
        <OrbitControls
          ref={(ctrl) => { _controls = ctrl; }}
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
          enableDamping dampingFactor={0.08}
          minDistance={1} maxDistance={40}
          maxPolarAngle={Math.PI / 2.2}
          enablePan
        />
        <CameraTracker layoutKey={layoutKey} containerWidth={containerWidth} />
      </Canvas>
    </div>
  );
}
