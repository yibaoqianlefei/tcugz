import { useRef, useEffect, Suspense, useState, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useNodeStore } from "../../store/nodeStore";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { canonicalName as cnImport, isHitboxName } from "../../utils/nameUtils";
import { registerAnimationActions, getAnimationActions } from "./animationController";
import { computeMultiModelLayout } from "../../utils/layoutModels";
import { writeVariantIdentity, makeScopedKey, cloneSceneWithMaterials, disposeClonedMaterials } from "../../utils/variantIdentity";
import { computeExplodedPosition } from "../../utils/explodeLayout";
import type { ResolvedVariantExplodeConfig, ResolvedExplodeComponent } from "../../utils/explodeLayout";

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
function SceneModel({ modelPath, containerWidth = 0, modelScale = 2.5, modelGroups, noAnimation = false, nonInteractive, noGlobalRef = false, onReady, variantId, variantIndex, variantLabel, variantTitle }: { modelPath: string; containerWidth?: number; modelScale?: number; modelGroups?: Record<string, string>; noAnimation?: boolean; nonInteractive?: string[]; /** If true, skip setting _modelScene (parent handles it). */ noGlobalRef?: boolean; /** Called when model is loaded + centered, with the scene group. */ onReady?: (scene: THREE.Group) => void; /** Phase 3: variant identity for multi-model isolation. */ variantId?: string; variantIndex?: number; variantLabel?: string; variantTitle?: string }) {
  const { scene: sourceScene, animations } = useGLTF(modelPath, true);
  /** Deep-clone with material isolation — each SceneModel owns independent materials. */
  const scene = useMemo(() => cloneSceneWithMaterials(sourceScene), [sourceScene]);
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
    // Phase 3: write variant identity on the cloned scene root
    if (variantId) {
      writeVariantIdentity(scene, {
        variantId,
        variantIndex: variantIndex ?? 0,
        label: variantLabel ?? "",
        title: variantTitle ?? "",
        src: modelPath,
      });
    }
    if (!noGlobalRef) _modelScene = scene;
    if (onReady) onReady(scene);

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

          const isNonInteractive = nonInteractive && nonInteractive.includes(logicalName);

          if (!isHitbox && !isNonInteractive) {
            if (!meshMapRef.current.has(logicalName)) {
              meshMapRef.current.set(logicalName, []);
            }
            const list = meshMapRef.current.get(logicalName)!;
            if (!list.includes(child)) list.push(child);
          }

          if (isFirstInit) {
            if (isNonInteractive) {
              child.raycast = () => {};
            } else if (isHitbox) {
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

    // ── Save original material state (for highlight restore) ──
    // Material cloning is now done upfront in cloneSceneWithMaterials().
    if (isFirstInit) {
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
    if (animations.length > 0 && !noAnimation) {
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

    // noAnimation: snap to fully-expanded state
    if (noAnimation && isFirstInit) {
      setAnimationProgress(1);
      setIsPlaying(false);
    }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current.uncacheRoot(scene);
      }
      unregister();
      disposeClonedMaterials(scene);
      _modelScene = null;
    };
    // noGlobalRef and onReady are stable callbacks, intentionally excluded from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, animations, setIsPlaying, modelScale, modelPath, resolveName, noAnimation, setAnimationProgress, nonInteractive]);

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
  const hoveredVariantId = useNodeStore((s) => s.hoveredVariantId);
  const selectedVariantId = useNodeStore((s) => s.selectedVariantId);
  const highlightEnabled = useNodeStore((s) => s.animationProgress >= 0.99);

  /** Restore a material to its original GLB state from the WeakMap cache. */
  function restoreMaterial(m: THREE.Material): void {
    const state = materialHighlightStateRef.current.get(m);
    if (!state) return;
    if (state.color && hasColor(m)) m.color.copy(state.color);
    if (state.emissive && hasEmissive(m)) { m.emissive.copy(state.emissive); m.emissiveIntensity = state.emissiveIntensity!; }
    m.needsUpdate = true;
  }

  /** Apply highlight to ALL interactive meshes in this variant. */
  const setAllMeshesHighlight = useCallback(
    (mode: "variant-hover" | "variant-selected" | "clear") => {
      meshMapRef.current.forEach((meshes) => {
        meshes.forEach((mesh) => {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            restoreMaterial(m);
            if (mode === "clear") return;
            if (mode === "variant-hover") {
              if (hasEmissive(m)) {
                m.emissive.set("#e8e4d8");
                m.emissiveIntensity = 0.6;
              }
            } else if (mode === "variant-selected") {
              if (hasEmissive(m)) {
                m.emissive.set("#d4c898");
                m.emissiveIntensity = 0.8;
              } else if (hasColor(m)) {
                m.color.lerp(new THREE.Color("#d4c898"), 0.25);
              }
            }
            m.needsUpdate = true;
          });
        });
      });
    },
    [],
  );

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

  // ── Apply highlights: variant then mesh, priority-based ──
  useEffect(() => {
    const isMyVariant = variantId != null;

    // 1) Clear previous mesh-level highlights
    const namesToReset = new Set<string>();
    if (prevHovered.current) namesToReset.add(prevHovered.current);
    if (prevSelected.current) namesToReset.add(prevSelected.current);
    if (hoveredObject) namesToReset.add(hoveredObject);
    if (selectedObject) namesToReset.add(selectedObject);
    namesToReset.forEach((n) => setGroupHighlight(n, "clear"));

    if (!highlightEnabled) {
      // Also clear variant-level
      setAllMeshesHighlight("clear");
      prevHovered.current = hoveredObject;
      prevSelected.current = selectedObject;
      return;
    }

    // 2) Apply variant-level highlight (lowest priority)
    if (isMyVariant) {
      if (selectedVariantId === variantId) {
        setAllMeshesHighlight("variant-selected");
      } else if (hoveredVariantId === variantId) {
        setAllMeshesHighlight("variant-hover");
      } else {
        setAllMeshesHighlight("clear");
      }
    }

    // 3) Apply mesh-level highlights (highest priority, overrides variant)
    if (hoveredObject && hoveredObject !== selectedObject) {
      setGroupHighlight(hoveredObject, "hover");
    }
    if (selectedObject) {
      setGroupHighlight(selectedObject, "selected");
    }

    prevHovered.current = hoveredObject;
    prevSelected.current = selectedObject;
  }, [highlightEnabled, hoveredObject, selectedObject, hoveredVariantId, selectedVariantId, variantId, setGroupHighlight, setAllMeshesHighlight]);

  // ── Picking (Phase 3: variant-scoped) ──
  const findNamedMesh = (obj: THREE.Object3D): string | null => {
    if (obj.parent && obj.parent.type === "Group" && obj.parent.name && obj.parent.name !== "Scene") {
      return resolveName(obj.parent.name);
    }
    if (obj instanceof THREE.Mesh && obj.name) {
      return resolveName(obj.name);
    }
    return null;
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (useNodeStore.getState().animationProgress < 0.99) return;
    const name = findNamedMesh(e.object);
    if (name) {
      const key = makeScopedKey(variantId ?? null, name);
      setHoveredObject(key);
      if (variantId) useNodeStore.getState().setHoveredVariantId(variantId);
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredObject(null);
    if (variantId) useNodeStore.getState().setHoveredVariantId(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (useNodeStore.getState().animationProgress < 1) return;
    const name = findNamedMesh(e.object);
    if (name) {
      const key = makeScopedKey(variantId ?? null, name);
      const current = useNodeStore.getState().selectedObject;
      if (current === key) {
        // Clicking same mesh → deselect (and clear variant selection)
        setSelectedObject(null);
        if (variantId) useNodeStore.getState().setSelectedVariantId(null);
      } else {
        setSelectedObject(key);
        if (variantId) useNodeStore.getState().setSelectedVariantId(variantId);
      }
    }
  };

  // ── Click on empty canvas → deselect ──
  // Handled via Canvas-level onPointerMissed in the public component

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
    if (_isUserDragging) return;
    const box = boxRef.current;
    box.setFromObject(scene);
    box.getCenter(centerRef.current);
    const alpha = 1 - Math.exp(-8.0 * delta);
    controls.target.lerp(centerRef.current, alpha);
  });

  return null;
}

/* ── Multi-model layout ────────────────────────────────────── */
interface ModelEntry { id: string; src: string; scale?: number; label?: string; title?: string }

function MultiModelGroup({ models, containerWidth, explodeConfigs, nodeId }: { models: ModelEntry[]; containerWidth: number; explodeConfigs?: ExplodeVariantConfig[]; nodeId?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const readyRef = useRef(new Map<string, THREE.Group>());
  const [readyCount, setReadyCount] = useState(0);

  const layoutModels = useCallback(() => {
    const widths: number[] = models.map(m => {
      const s = readyRef.current.get(m.id);
      if (!s) return 0;
      const box = new THREE.Box3().setFromObject(s);
      const size = new THREE.Vector3(); box.getSize(size);
      return size.x;
    });

    const layout = computeMultiModelLayout(widths);

    layout.entries.forEach((entry, i) => {
      const s = readyRef.current.get(models[i].id);
      if (!s) return;
      s.position.x = entry.x - layout.totalWidth / 2;
      s.updateMatrixWorld();
    });

    if (groupRef.current) {
      groupRef.current.updateMatrixWorld();
      _modelScene = groupRef.current;
      // Debug hook (DEV-only in production builds this is a no-op)
      if (typeof window !== "undefined" && import.meta.env.DEV) {
        interface MultiModelDebug {
          groupUUID: string;
          childCount: number;
          selectedObject: string | null;
          selectedVariantId: string | null;
          explodeProgress: number;
          variants: Array<{
            variantId: string;
            sceneUUID: string | null;
            positionX: number | null;
            hovered: boolean;
            selected: boolean;
          }>;
        }
        // Deferred read of Zustand state (avoid stale closure)
        const store = useNodeStore.getState();
        (window as { __multiModelDebug?: MultiModelDebug }).__multiModelDebug = {
          // Phase 5: expose selection state for interaction verification
          selectedObject: store.selectedObject,
          selectedVariantId: store.selectedVariantId,
          explodeProgress: store.explodeProgress,
          groupUUID: groupRef.current.uuid,
          childCount: groupRef.current.children.length,
          variants: models.map((m) => {
            const s = readyRef.current.get(m.id);
            return {
              variantId: m.id,
              sceneUUID: s?.uuid ?? null,
              positionX: s ? Math.round(s.position.x * 1000) / 1000 : null,
              hovered: store.hoveredVariantId === m.id,
              selected: store.selectedVariantId === m.id,
            };
          }),
        };
      }
    }
  }, [models]);

  const handleModelReady = useCallback((id: string) => (scene: THREE.Group) => {
    readyRef.current.set(id, scene);
    setReadyCount(readyRef.current.size);
  }, []);

  useEffect(() => {
    if (readyCount === models.length && models.length > 0) {
      layoutModels();
    }
  }, [readyCount, models.length, layoutModels]);

  /* Phase 5: Explode driver — cache targets + update positions */
  const explodeTargetRef = useRef<Map<string, {
    object: THREE.Object3D;
    basePosition: readonly [number, number, number];
    component: ResolvedExplodeComponent;
    variantId: string;
  }>>(new Map());
  const explodeBuilt = useRef(false);

  // Build explode target cache once after all models are ready + laid out
  useEffect(() => {
    if (readyCount !== models.length || models.length === 0) return;
    if (explodeBuilt.current) return;
    if (!explodeConfigs || explodeConfigs.length === 0) return;

    const cache = explodeTargetRef.current;
    cache.clear();

    // For each variant with an enabled explode config, traverse the variant
    // scene to find target meshes by real Object3D.name
    explodeConfigs.forEach(({ variantId, config }) => {
      if (!config.enabled) return;
      const scene = readyRef.current.get(variantId);
      if (!scene) return;

      // Find the variant root Group (has userData.variantId set)
      scene.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        if (!child.name) return;
        // Skip proxy meshes and edge lines
        if (child.userData._isProxy) return;
        if (child instanceof THREE.LineSegments) return;

        const found = config.components.find(
          (c) => c.objectName === child.name,
        );
        if (!found) return;

        // Avoid double displacement: skip meshes whose parent is also
        // a configured target (the parent moves → children follow).
        // Proxy + edge-line children of target meshes are already
        // filtered above by _isProxy / instanceof LineSegments.
        const parentIsTarget =
          child.parent &&
          child.parent instanceof THREE.Mesh &&
          config.components.some((c) => c.objectName === child.parent!.name);
        if (parentIsTarget) return;

        const key = `${nodeId ?? "unknown"}::${variantId}::${child.name}`;
        if (cache.has(key)) return;

        cache.set(key, {
          object: child,
          basePosition: [child.position.x, child.position.y, child.position.z] as const,
          component: found,
          variantId,
        });
      });
    });

    explodeBuilt.current = true;
  }, [readyCount, models.length, explodeConfigs, nodeId]);

  /* Phase 5 useFrame: apply explode positions based on active scope */
  useFrame(() => {
    // Keep debug hook selection state current for acceptance verification
    if (typeof window !== "undefined" && import.meta.env.DEV && (window as unknown as Record<string,unknown>).__multiModelDebug) {
      const s = useNodeStore.getState();
      const dbg = (window as unknown as Record<string,unknown>).__multiModelDebug as Record<string, unknown>;
      dbg.selectedObject = s.selectedObject;
      dbg.selectedVariantId = s.selectedVariantId;
      dbg.explodeProgress = s.explodeProgress;
    }
    if (explodeTargetRef.current.size === 0) return;
    const store = useNodeStore.getState();
    const progress = store.explodeProgress;
    const activeId = store.activeExplodeVariantId;
    const cache = explodeTargetRef.current;
    cache.forEach((target) => {
      const effectiveProgress = target.variantId === activeId ? progress : 0;
      const next = computeExplodedPosition({
        basePosition: target.basePosition,
        direction: target.component.direction,
        distance: target.component.distance,
        progress: effectiveProgress,
        start: target.component.start,
        end: target.component.end,
      });
      target.object.position.set(next[0], next[1], next[2]);
    });
  });


  return (
    <group ref={groupRef}>
      {models.map((m, i) => (
        <SceneModel
          key={m.id}
          modelPath={m.src}
          containerWidth={containerWidth}
          modelScale={m.scale ?? 2.5}
          noAnimation={true}
          nonInteractive={["其余"]}
          noGlobalRef
          onReady={handleModelReady(m.id)}
          variantId={m.id}
          variantIndex={i}
          variantLabel={m.label}
          variantTitle={m.title}
        />
      ))}
    </group>
  );
}

/* ── Public component ─────────────────────────────────────── */
export interface ExplodeVariantConfig { variantId: string; config: ResolvedVariantExplodeConfig }

export default function ModelViewer({
  autoRotate = true,
  modelPath,
  modelPaths,
  modelScale = 2.5,
  showShadows = true,
  layoutKey = 0,
  modelGroups,
  noAnimation = false,
  nonInteractive,
  explodeConfigs,
  nodeId,
}: {
  autoRotate?: boolean;
  modelPath?: string;
  modelPaths?: ModelEntry[];
  showShadows?: boolean;
  layoutKey?: number;
  modelScale?: number;
  modelGroups?: Record<string, string>;
  noAnimation?: boolean;
  nonInteractive?: string[];
  /** Phase 5: per-variant explode configs for multi-model nodes. */
  explodeConfigs?: ExplodeVariantConfig[];
  /** Phase 5: nodeId for explode cache key identity. */
  nodeId?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // ── Drag-state callbacks for CameraTracker (declarative via drei onStart/onEnd) ──
  const handleControlsStart = useCallback(() => { _isUserDragging = true; }, []);
  const handleControlsEnd = useCallback(() => { _isUserDragging = false; }, []);

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
        onPointerMissed={() => {
          useNodeStore.getState().setSelectedObject(null);
          useNodeStore.getState().setSelectedVariantId(null);
        }}
      >
        <RendererSetup showShadows={showShadows} />
        <color attach="background" args={["#f5f5f7"]} />
        <SceneLights showShadows={showShadows} />
        {showShadows && <ShadowPlane />}
        <Suspense fallback={<LoadingFallback />}>
          {modelPaths && modelPaths.length >= 1 ? (
            <MultiModelGroup models={modelPaths} containerWidth={containerWidth} explodeConfigs={explodeConfigs} nodeId={nodeId} />
          ) : modelPath ? (
            <SceneModel modelPath={modelPath} containerWidth={containerWidth} modelScale={modelScale} modelGroups={modelGroups} noAnimation={noAnimation} nonInteractive={nonInteractive} />
          ) : null}
        </Suspense>
        <OrbitControls
          ref={(ctrl) => { _controls = ctrl; }}
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
          enableDamping dampingFactor={0.08}
          minDistance={1} maxDistance={40}
          maxPolarAngle={Math.PI / 2.2}
          enablePan
          onStart={handleControlsStart}
          onEnd={handleControlsEnd}
        />
        <CameraTracker layoutKey={layoutKey} containerWidth={containerWidth} />
      </Canvas>
    </div>
  );
}
