import { useRef, useEffect, Suspense, useState, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useNodeStore } from "../../store/nodeStore";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { canonicalName as cnImport, isHitboxName } from "../../utils/nameUtils";
import { registerAnimationActions, getAnimationActions } from "./animationController";
// layoutModels is now inline in MultiModelGroup (edge-gap formula)
import { writeVariantIdentity, makeScopedKey, cloneSceneWithMaterials, disposeClonedMaterials } from "../../utils/variantIdentity";
import { computeExplodedPosition } from "../../utils/explodeLayout";
import type { ResolvedVariantExplodeConfig, ResolvedExplodeComponent } from "../../utils/explodeLayout";
import SectionRuntime from "./SectionRuntime";
import { isPointVisible, type SectionBounds } from "../../utils/sectionMath";

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

import {
  getModelScene,
  setModelScene,
  registerObjects,
  clearObjectRegistry,
  isCameraTrackerPaused,
} from "../../utils/modelSceneRef";
import {
  CAMERA_FIT_PADDING,
  CAMERA_COMPOSITION_FRACTION,
  computeVisibleGeometryWorldBox,
  computeCameraFitTargets,
  shouldSkipFit,
  isSizeChangeSignificant,
  shouldRefitCamera,
  buildFitKey,
  type CameraFitResult,
} from "../../utils/cameraFit";
import CameraLockRuntime from "./CameraLockRuntime";

/* ── Module-level refs (non-animation) ──────────────────────── */
let _controls: OrbitControlsImpl | null = null;
/** Drag detection: suppress click after pointer moved > threshold. */
const CLICK_MOVE_THRESHOLD = 5; // px
let _pointerDownX = 0;
let _pointerDownY = 0;
let _pointerMaxDist = 0;
let _suppressNextClick = false;
const _pointerIdRef = { current: -1 };
const _scaleCache = new Map<string, number>();

/* ── Multi-model initial camera fit (Phase 6 Step 4) ──────── */
/** True once the user has manually orbited / zoomed / panned.  Blocks
 *  responsive re-fits so the user's view is never yanked back.  Reset on
 *  each ModelViewer mount (ModelViewer is keyed by nodeId). */
let _userCameraInteracted = false;
/** True while the user is actively dragging (orbit/pan).  The single-model
 *  target-follow pauses during an active drag so it never fights the user. */
let _isUserDragging = false;

/** DEV-only camera-write log — records every CameraTracker write so a later
 *  overwrite (defaultCamera / preset / reset / another writer) is detectable. */
function logCameraWrite(source: string, payload: Record<string, unknown>): void {
  if (typeof window === "undefined" || !import.meta.env.DEV) return;
  const w = window as unknown as Record<string, unknown>;
  const arr = (w.__cameraWrites as Record<string, unknown>[]) || (w.__cameraWrites = []);
  arr.push({ source, timestamp: Date.now(), ...payload });
  if (arr.length > 60) arr.splice(0, arr.length - 60);
}

/* ── Phase 6 Step 2: Section picking visibility helper ────── */

/**
 * Test whether a world-space intersection point is on the visible
 * side of the current section plane.  Called from pointer event
 * handlers — not per-frame.
 *
 * Returns true when section is disabled (everything visible).
 */
function isIntersectionVisible(point: THREE.Vector3): boolean {
  const store = useNodeStore.getState();
  if (!store.sectionEnabled) return true;
  const ms = getModelScene();
  if (!ms) return true;

  // Compute bounds from live model scene on each pointer event.
  // Pointer events are user-driven (infrequent), so this is NOT
  // a per-frame operation.
  const box = new THREE.Box3().setFromObject(ms);
  const bounds: SectionBounds = {
    min: [box.min.x, box.min.y, box.min.z],
    max: [box.max.x, box.max.y, box.max.z],
  };

  return isPointVisible(
    [point.x, point.y, point.z],
    bounds,
    store.sectionAxis,
    store.sectionOffset,
    store.sectionInvert,
    true,
  );
}

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
function SceneModel({ modelPath, containerWidth = 0, modelScale = 2.5, modelGroups, noAnimation = false, nonInteractive, noGlobalRef = false, onReady, variantId, variantIndex, variantLabel, variantTitle, skipAutoLayout = false }: { modelPath: string; containerWidth?: number; modelScale?: number; modelGroups?: Record<string, string>; noAnimation?: boolean; nonInteractive?: string[]; /** If true, skip setting the global model scene ref (parent handles it). */ noGlobalRef?: boolean; /** Called when model is loaded + centered, with the scene group. */ onReady?: (scene: THREE.Group) => void; /** Phase 3: variant identity for multi-model isolation. */ variantId?: string; variantIndex?: number; variantLabel?: string; variantTitle?: string; /** Phase 6: when true, skip auto-size, auto-center, and viewport-responsive scale. Parent (MultiModelGroup) handles layout via DisplayScale+CenterOffset. */ skipAutoLayout?: boolean }) {
  const { scene: sourceScene, animations } = useGLTF(modelPath, true);
  /** Deep-clone with material isolation — each SceneModel owns independent materials. */
  const scene = useMemo(() => cloneSceneWithMaterials(sourceScene), [sourceScene]);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const clipRef = useRef<THREE.AnimationClip | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const meshMapRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
  /** Phase 6 Step 3: unregister functions for Object3D registry. */
  const unregisterFnsRef = useRef<Array<() => void>>([]);
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
    if (!skipAutoLayout) {
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
    }
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
    if (!noGlobalRef) setModelScene(scene);
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

      // Phase 6 Step 3: register all interactive meshes in Object3D registry
      const newUnregisterFns: Array<() => void> = [];
      meshMapRef.current.forEach((meshes, logicalName) => {
        if (meshes.length === 0) return;
        const key = makeScopedKey(variantId ?? null, logicalName);
        const unreg = registerObjects(key, meshes);
        newUnregisterFns.push(unreg);
      });
      unregisterFnsRef.current = newUnregisterFns;
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

    // Snap to the fully-expanded ("complete") state for models that have NO
    // explode animation to play — the noAnimation flag OR a GLB without clips
    // (e.g. cast-ribbed-floor).  The explode progress bar then reads "done" on
    // load, and hover/click highlight + knowledge-card linkage are active from
    // the first frame (they gate on animationProgress >= 0.99 / 1).
    const hasExplodeAnimation = animations.length > 0 && !noAnimation;
    if (!hasExplodeAnimation && isFirstInit) {
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
      // Only clear the shared model-scene ref when THIS model owns it.  In a
      // multi-model node (noGlobalRef) MultiModelGroup owns the ref, so this
      // cleanup must not null it out — otherwise StrictMode's mount→cleanup→
      // remount cycle leaves getModelScene() null and the initial camera fit
      // never runs.
      if (!noGlobalRef) setModelScene(null);
      // Phase 6 Step 3: unregister all objects from global registry
      unregisterFnsRef.current.forEach((fn) => fn());
      unregisterFnsRef.current = [];
    };
    // noGlobalRef and onReady are stable callbacks, intentionally excluded from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, animations, setIsPlaying, modelScale, modelPath, resolveName, noAnimation, setAnimationProgress, nonInteractive]);

  // ── Viewport-responsive scale ──
  const initialWidthRef = useRef(0);
  const targetScaleRef = useRef(0);
  useEffect(() => {
    if (skipAutoLayout || !scene || containerWidth <= 0) return;
    const cacheKey = `${modelPath}::ms${modelScale}`;
    const baseScale = _scaleCache.get(cacheKey) ?? 1;
    if (initialWidthRef.current === 0) initialWidthRef.current = containerWidth;
    const refWidth = initialWidthRef.current;
    const ratio = Math.min(1, Math.max(0.4, containerWidth / refWidth));
    targetScaleRef.current = baseScale * ratio;
  }, [containerWidth, modelPath, modelScale, scene, skipAutoLayout]);

  useFrame((_, delta) => {
    if (skipAutoLayout || !scene || targetScaleRef.current <= 0) return;
    const current = scene.scale.x;
    const target = targetScaleRef.current;
    const next = current + (target - current) * Math.min(delta * 6, 1);
    if (Math.abs(next - current) > 0.0005) {
      scene.scale.setScalar(next);
      // Scale adjustment does NOT move camera target — user's view is preserved.
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
    // Phase 6 Step 2: skip intersections on the clipped side of section plane
    const vis = e.intersections?.find((ix) => isIntersectionVisible(ix.point));
    if (!vis) {
      setHoveredObject(null);
      if (variantId) useNodeStore.getState().setHoveredVariantId(null);
      return;
    }
    const name = findNamedMesh(vis.object);
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
    // Suppress click if user was dragging (orbit/pan)
    if (_suppressNextClick) { _suppressNextClick = false; return; }
    if (_pointerMaxDist > CLICK_MOVE_THRESHOLD) return;
    if (useNodeStore.getState().animationProgress < 1) return;
    // Phase 6 Step 2: skip intersections on the clipped side of section plane
    const vis = e.intersections?.find((ix) => isIntersectionVisible(ix.point));
    if (!vis) {
      // All intersections clipped → treat as blank click
      setSelectedObject(null);
      if (variantId) useNodeStore.getState().setSelectedVariantId(null);
      return;
    }
    const name = findNamedMesh(vis.object);
    if (name) {
      const key = makeScopedKey(variantId ?? null, name);
      const current = useNodeStore.getState().selectedObject;
      if (current === key) {
        // Clicking same mesh → deselect (and clear variant selection)
        setSelectedObject(null);
        if (variantId) useNodeStore.getState().setSelectedVariantId(null);
        // Keep activeExplodeVariantId — blank-click-like behavior (Phase 6)
      } else if (variantId) {
        // Phase 6 Step 2: this pick may also change the variant.
        // If the variant changes, use the unified selectVariant action
        // (which resets section + explode) but preserve the picked object.
        const prevVariant = useNodeStore.getState().selectedVariantId;
        if (variantId !== prevVariant) {
          // Cross-variant pick → full variant switch protocol
          useNodeStore.getState().selectVariant(variantId, key);
        } else {
          // Same-variant pick → just update selection and sync explode scope
          setSelectedObject(key);
          useNodeStore.getState().setActiveExplodeVariantId(variantId);
        }
      } else {
        // Normal node (no variantId): plain mesh selection
        setSelectedObject(key);
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

/* ── Lighting (dynamic shadow camera for multi-model) ──────── */
function SceneLights({ showShadows }: { showShadows: boolean }) {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (!showShadows || !lightRef.current) return;
    const ms = getModelScene();
    if (!ms) return;
    const ub: THREE.Box3 | undefined = ms.userData._unionBox;
    if (!ub || ub.isEmpty()) return;
    const pad = 1.0;
    const l = lightRef.current;
    // Extend shadow camera frustum to cover the union box + padding
    const halfW = (ub.max.x - ub.min.x) / 2 + pad;
    const halfH = (ub.max.z - ub.min.z) / 2 + pad;
    if (
      Math.abs(l.shadow.camera.left + halfW) > 0.1 ||
      Math.abs(l.shadow.camera.top - halfH) > 0.1
    ) {
      l.shadow.camera.left = -halfW;
      l.shadow.camera.right = halfW;
      l.shadow.camera.top = halfH;
      l.shadow.camera.bottom = -halfH;
      l.shadow.camera.updateProjectionMatrix();
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight
        ref={lightRef}
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

/* ── Ground shadow (dynamic — covers the union bounding box) ── */
function ShadowPlane() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const ms = getModelScene();
    if (!ms || !ref.current) return;
    // Read union box cached by MultiModelGroup.layoutModels
    const ub: THREE.Box3 | undefined = ms.userData._unionBox;
    if (!ub || ub.isEmpty()) return;
    // Position just below the lowest model point
    const py = ub.min.y - 0.05;
    const pw = ub.max.x - ub.min.x + 1.0;
    const pd = ub.max.z - ub.min.z + 1.0;
    if (Math.abs(ref.current.position.y - py) > 0.001) {
      ref.current.position.set((ub.min.x + ub.max.x) / 2, py, (ub.min.z + ub.max.z) / 2);
      ref.current.scale.set(pw / 10, 1, pd / 10);
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <shadowMaterial opacity={0.2} transparent depthWrite={false} />
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

/**
 * Imperative write of the initial framing to the R3F camera/controls.
 * Extracted to a plain (non-hook) function so the direct near/far/aspect
 * assignments are not treated as mutations of a hook-returned value by
 * react-hooks/immutability.  Three.js objects are managed imperatively.
 */
function applyCameraFraming(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControlsImpl,
  result: CameraFitResult,
): void {
  controls.target.copy(result.controlsTarget);
  camera.position.copy(result.finalCameraPosition);
  camera.near = result.near;
  camera.far = result.far;
  camera.aspect = result.aspect;
  camera.updateProjectionMatrix();
  controls.update();
}

function CameraTracker({
  layoutKey = 0,
  containerWidth = 0,
  sceneReady = false,
  variantCount = 0,
  fitKey = "default",
}: {
  layoutKey?: number;
  containerWidth?: number;
  /** True once the model scene is fully loaded AND laid out (onAllReady). */
  sceneReady?: boolean;
  /** Number of variants in a multi-model node (0 = single-model node). */
  variantCount?: number;
  /** Node+variant identity — initial fit runs once per distinct key. */
  fitKey?: string;
}) {
  const { size, camera } = useThree();
  const fittedKeyRef = useRef<string | null>(null);
  const lastSizeRef = useRef<{ w: number; h: number } | null>(null);
  /** Reusable objects for the single-model target-follow. */
  const followBoxRef = useRef(new THREE.Box3());
  const followCenterRef = useRef(new THREE.Vector3());

  // ── One-time initial fit + guarded responsive re-fit (NOT continuous) ──
  useEffect(() => {
    const controls = _controls;
    const scene = getModelScene();
    if (!controls || !scene) return;
    // Strict init order: for multi-model, never fit until A/B/C are ALL
    // loaded AND laid out (sceneReady flips true only after layoutModels).
    if (shouldSkipFit(variantCount, sceneReady)) return;
    // Camera Lock has paused the tracker → never fight it.
    if (isCameraTrackerPaused()) return;
    if (size.width <= 0 || size.height <= 0) return;

    // Framing box = the 3-layoutRoot union stored at layout time (multi),
    // or the visible-geometry box of the single model scene.
    const group = scene as THREE.Group;
    const stored = group.userData._fitBox as THREE.Box3 | undefined;
    const fitBox = stored && !stored.isEmpty()
      ? stored
      : computeVisibleGeometryWorldBox(scene);
    if (fitBox.isEmpty()) return;

    const boxSize = new THREE.Vector3();
    fitBox.getSize(boxSize);
    const boxCenter = new THREE.Vector3();
    fitBox.getCenter(boxCenter);

    const firstFit = fittedKeyRef.current !== fitKey;
    const sizeChanged = isSizeChangeSignificant(
      lastSizeRef.current,
      size.width,
      size.height,
    );

    // Initial framing is mandatory; responsive re-frames are skipped after the
    // user has manually moved the camera (plain re-render / variant switch /
    // auto-rotation do not change size or fitKey → no re-frame).
    if (!shouldRefitCamera({ firstFit, sizeChanged, userInteracted: _userCameraInteracted })) {
      lastSizeRef.current = { w: size.width, h: size.height };
      return;
    }

    // ── Single-model nodes: restore the pre-multi-model sizing contract ──
    // (e706b641).  The model is auto-sized so maxDim = node.model.scale, and
    // the camera keeps its default distance (z=8) — the per-node `scale` value
    // therefore controls the on-screen size exactly as originally designed.
    // We only aim the orbit target at the model centre (no camera.position
    // write), so the model appears centred without changing its size.
    if (variantCount === 0) {
      controls.target.copy(boxCenter);
      controls.update();
      fittedKeyRef.current = fitKey;
      lastSizeRef.current = { w: size.width, h: size.height };
      const perspectiveCam = camera as THREE.PerspectiveCamera;
      logCameraWrite("CameraTracker.singleModelTarget", {
        cameraPosition: [camera.position.x, camera.position.y, camera.position.z],
        cameraQuaternion: [
          camera.quaternion.x,
          camera.quaternion.y,
          camera.quaternion.z,
          camera.quaternion.w,
        ],
        cameraFov: perspectiveCam.fov,
        cameraZoom: perspectiveCam.zoom,
        controlsTarget: [controls.target.x, controls.target.y, controls.target.z],
        unionBoxSize: [boxSize.x, boxSize.y, boxSize.z],
        unionBoxCenter: [boxCenter.x, boxCenter.y, boxCenter.z],
        canvasWidth: size.width,
        canvasHeight: size.height,
        aspect: size.width / Math.max(size.height, 1),
        note: "camera stays at default distance (z=8); target only",
      });
      return;
    }

    // ── Multi-model: distance fit (approved CAMERA_FIT_PADDING) ──
    const perspectiveCam = camera as THREE.PerspectiveCamera;
    const result = computeCameraFitTargets({
      boxSize,
      boxCenter,
      canvasWidth: size.width,
      canvasHeight: size.height,
      verticalFovDeg: perspectiveCam.fov,
      cameraPosition: camera.position,
      controlsTarget: controls.target,
      padding: CAMERA_FIT_PADDING,
      compositionFraction: CAMERA_COMPOSITION_FRACTION,
    });

    // Apply framing (single write to camera.position).
    applyCameraFraming(perspectiveCam, controls, result);

    // Lock this initialization until node/variant combination changes.
    fittedKeyRef.current = fitKey;
    lastSizeRef.current = { w: size.width, h: size.height };

    // DEV: record the write so a later overwrite is detectable.
    logCameraWrite("CameraTracker.fit", {
      cameraPosition: [camera.position.x, camera.position.y, camera.position.z],
      cameraQuaternion: [
        camera.quaternion.x,
        camera.quaternion.y,
        camera.quaternion.z,
        camera.quaternion.w,
      ],
      cameraFov: perspectiveCam.fov,
      cameraZoom: perspectiveCam.zoom,
      controlsTarget: [controls.target.x, controls.target.y, controls.target.z],
      unionBoxSize: [boxSize.x, boxSize.y, boxSize.z],
      unionBoxCenter: [boxCenter.x, boxCenter.y, boxCenter.z],
      canvasWidth: size.width,
      canvasHeight: size.height,
      aspect: result.aspect,
      fitDistance: result.fitDistance,
      finalDistance: result.finalDistance,
      cameraFitPadding: CAMERA_FIT_PADDING,
    });
  }, [sceneReady, variantCount, fitKey, layoutKey, containerWidth, size.width, size.height, camera]);

  // ── Single-model "pull back to view centre" (e706b641 behavior) ──
  // Continuously lerps the orbit target toward the model's world centre so the
  // model stays centred when it moves (animation / explode) and the view eases
  // back to centre after the user pans away.  Paused during an active drag and
  // while Camera Lock owns the target.  Single-model only — multi-model keeps
  // its fixed union-centre target + user-interaction guard.  The per-frame
  // bounding-box read is confined to the small single-model scene (the same
  // cost the pre-multi-model CameraTracker paid every frame).
  useFrame((_, delta) => {
    if (variantCount !== 0) return;
    if (isCameraTrackerPaused()) return;
    if (_isUserDragging) return;
    const controls = _controls;
    const scene = getModelScene();
    if (!controls || !scene) return;
    const box = followBoxRef.current;
    box.setFromObject(scene);
    box.getCenter(followCenterRef.current);
    const alpha = 1 - Math.exp(-8.0 * delta);
    controls.target.lerp(followCenterRef.current, alpha);
  });

  return null;
}

/* ── Multi-model layout ────────────────────────────────────── */
interface ModelEntry { id: string; src: string; scale?: number; label?: string; title?: string }

/** Edge-gap formula constants. */
const EDGE_GAP_RATIO = 0.38;   // wider inter-model spacing
const EDGE_GAP_MIN = 0.28;     // raised proportionally
const EDGE_GAP_MAX = 1.00;     // raised proportionally
const AUTO_ROTATE_SPEED = 0.12; // rad/s — ~52s per full rotation, comfortable for study

function MultiModelGroup({ models, containerWidth, explodeConfigs, nodeId, onAllReady, autoRotate }: { models: ModelEntry[]; containerWidth: number; explodeConfigs?: ExplodeVariantConfig[]; nodeId?: string; onAllReady?: () => void; autoRotate?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const readyRef = useRef(new Map<string, THREE.Group>());
  const [readyCount, setReadyCount] = useState(0);

  /** Per-variant hierarchy */
  const layoutRootRefs = useRef<Map<string, THREE.Group>>(new Map());
  const rotationPivotRefs = useRef<Map<string, THREE.Group>>(new Map());
  const displayScaleRefs = useRef<Map<string, THREE.Group>>(new Map());
  const centerOffsetRefs = useRef<Map<string, THREE.Group>>(new Map());

  /** Immutable layout snapshot */
  interface VariantLayoutSnap { variantId: string; canonicalWidth: number; layoutX: number; centerOffset: readonly [number, number, number]; scene: THREE.Group; }
  const layoutSnapRef = useRef<VariantLayoutSnap[] | null>(null);

  const layoutDoneRef = useRef(false);
  const hierarchyBuiltRef = useRef(false);
  // Reset on unmount so StrictMode double-mount doesn't skip layout
  useEffect(() => () => { layoutDoneRef.current = false; hierarchyBuiltRef.current = false; }, []);
  const autoRotateEnabled = autoRotate ?? true;

  const layoutModels = useCallback(() => {
    if (layoutDoneRef.current) return;

    // Phase 6 — canonical centre + separated display-scale layout.
    //
    // Hierarchy (per variant):
    //   LayoutRoot (position.x) → RotationPivot (rotation.y)
    //     → DisplayScale (scale) → CenterOffset (position = -canonicalCenter)
    //       → SceneModel (scale=1, position=0)
    //
    // Key invariant: geometry centre C maps to S * (C - C) = 0 in DisplayScale
    // space FOR ANY SCALE S.  Changing DisplayScale can never move the centre.

    // ── 1. Reset scenes to scale=1, compute canonical centres/sizes ──
    const rawData: Array<{
      id: string;
      scene: THREE.Group;
      canonicalCenter: THREE.Vector3;
      canonicalHeight: number;
      canonicalWidth: number;
    }> = [];

    for (const m of models) {
      const s = readyRef.current.get(m.id);
      if (!s) return;

      // Reset to canonical state — scale=1, no translation.
      s.scale.setScalar(1);
      s.position.set(0, 0, 0);
      s.updateMatrixWorld();

      // Compute visible-geometry-only bounding box (exclude proxies, edges).
      const visBox = new THREE.Box3();
      s.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        if (child.userData._isProxy) return;
        if (child instanceof THREE.LineSegments) return;
        visBox.expandByObject(child);
      });
      if (visBox.isEmpty()) visBox.setFromObject(s); // fallback

      const canonicalCenter = new THREE.Vector3(); visBox.getCenter(canonicalCenter);
      const canonicalSize = new THREE.Vector3(); visBox.getSize(canonicalSize);

      rawData.push({
        id: m.id,
        scene: s,
        canonicalCenter: canonicalCenter.clone(),
        canonicalHeight: canonicalSize.y,
        canonicalWidth: canonicalSize.x,
      });
    }

    // ── 2. Shared display scale: ONE value for ALL models ──
    // All three GLBs were exported from the same modelling tool with the
    // same units.  A single shared scale preserves physical size relationships —
    // if one model is genuinely taller, it stays taller on screen.
    //
    // The scale is chosen so the tallest model reaches a reasonable display
    // height (~3 units → fits comfortably in viewport at camera z≈8, fov=40).
    const allHeights = rawData.map((d) => d.canonicalHeight);
    const maxCanonicalHeight = Math.max(...allHeights);
    const TARGET_DISPLAY_HEIGHT = 3.0;
    const sharedDisplayScale = maxCanonicalHeight > 0.01
      ? TARGET_DISPLAY_HEIGHT / maxCanonicalHeight
      : 1.0;

    const unifiedScaleMap = new Map<string, number>();
    for (const d of rawData) {
      unifiedScaleMap.set(d.id, sharedDisplayScale);
    }

    // DEV: log canonical measurements for scale audit
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.log("[MultiModelGroup] Canonical sizes at scale=1:");
      for (const d of rawData) {
        console.log(`  ${d.id}: center=(${d.canonicalCenter.x.toFixed(3)}, ${d.canonicalCenter.y.toFixed(3)}, ${d.canonicalCenter.z.toFixed(3)}) size=(${d.canonicalWidth.toFixed(3)}, ${d.canonicalHeight.toFixed(3)})`);
      }
      console.log(`  sharedDisplayScale: ${sharedDisplayScale.toFixed(4)} (targetHeight=${TARGET_DISPLAY_HEIGHT}, maxHeight=${maxCanonicalHeight.toFixed(3)})`);
    }

    // ── 3. Apply to hierarchy: DisplayScale + CenterOffset ──
    for (const d of rawData) {
      const unifiedScale = unifiedScaleMap.get(d.id)!;

      // DisplayScale: unified scale (before centering — invariant holds).
      const ds = displayScaleRefs.current.get(d.id);
      if (ds) ds.scale.setScalar(unifiedScale);

      // CenterOffset: shift geometry centre to RotatonPivot origin.
      const co = centerOffsetRefs.current.get(d.id);
      if (co) co.position.copy(d.canonicalCenter).multiplyScalar(-1);

      // Scene stays at scale=1, position=(0,0,0) — guaranteed by skipAutoLayout.
    }

    // ── 4. Layout X from scaled canonical widths + edge gap ──
    const scaledWidths = rawData.map((d) => d.canonicalWidth * unifiedScaleMap.get(d.id)!);
    const avgW = scaledWidths.reduce((a, b) => a + b, 0) / scaledWidths.length;
    const gap = Math.max(EDGE_GAP_MIN, Math.min(EDGE_GAP_MAX, avgW * EDGE_GAP_RATIO));

    let cursorX = 0;
    const snaps: VariantLayoutSnap[] = rawData.map((d, i) => {
      const cx = cursorX + scaledWidths[i] / 2;
      cursorX += scaledWidths[i] + gap;
      return {
        variantId: d.id,
        canonicalWidth: scaledWidths[i],
        layoutX: cx,
        centerOffset: [d.canonicalCenter.x, d.canonicalCenter.y, d.canonicalCenter.z] as const,
        scene: d.scene,
      };
    });
    const totalW = cursorX - gap;
    const groupCenterX = totalW / 2;
    for (const snap of snaps) snap.layoutX -= groupCenterX;

    // ── 5. Apply layoutX to LayoutRoot ──
    for (const snap of snaps) {
      const lr = layoutRootRefs.current.get(snap.variantId);
      if (lr) lr.position.x = snap.layoutX;
    }

    // ── 6. Static rotation envelope (covers full 360° Y-rotation) ──
    // Force world-matrix update through the full new hierarchy.
    for (const d of rawData) {
      const ds = displayScaleRefs.current.get(d.id);
      if (ds) ds.updateMatrixWorld();
    }

    const unionBox = new THREE.Box3();
    for (const snap of snaps) {
      const lr = layoutRootRefs.current.get(snap.variantId);
      if (!lr) continue;
      const box = new THREE.Box3().setFromObject(lr);
      const sz = new THREE.Vector3(); box.getSize(sz);
      const rXZ = Math.sqrt(sz.x * sz.x + sz.z * sz.z) / 2;
      unionBox.expandByPoint(new THREE.Vector3(snap.layoutX - rXZ, box.min.y, -rXZ));
      unionBox.expandByPoint(new THREE.Vector3(snap.layoutX + rXZ, box.max.y, rXZ));
    }
    if (groupRef.current) {
      groupRef.current.userData._unionBox = unionBox;
      setModelScene(groupRef.current);
    }

    // ── 6b. Static fit box for the initial camera frame ──
    // Union of the three LayoutRoots' visible-geometry world AABBs at the
    // standard pose (before auto-rotation).  Used by CameraTracker as the
    // framing box — it MUST include all three models' final layout positions,
    // never a single/selected model's box.
    if (groupRef.current) groupRef.current.updateMatrixWorld(true);
    const fitBox = new THREE.Box3();
    for (const snap of snaps) {
      const lr = layoutRootRefs.current.get(snap.variantId);
      if (!lr) continue;
      fitBox.union(computeVisibleGeometryWorldBox(lr));
    }
    if (groupRef.current) {
      groupRef.current.userData._fitBox = fitBox;
    }

    layoutSnapRef.current = snaps;
    layoutDoneRef.current = true;

    // DEV debug hook
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      const store = useNodeStore.getState();
      (window as { __multiModelDebug?: Record<string, unknown> }).__multiModelDebug = {
        groupUUID: groupRef.current?.uuid ?? "",
        childCount: groupRef.current?.children.length ?? 0,
        selectedObject: store.selectedObject,
        selectedVariantId: store.selectedVariantId,
        explodeProgress: store.explodeProgress,
        variants: models.map((m) => {
          const sn = snaps.find((s) => s.variantId === m.id);
          const uScale = unifiedScaleMap.get(m.id) ?? null;
          return { variantId: m.id, sceneUUID: sn?.scene.uuid ?? null, layoutX: sn?.layoutX ?? null, unifiedScale: uScale, hovered: store.hoveredVariantId === m.id, selected: store.selectedVariantId === m.id };
        }),
      };
    }
  }, [models]);

  const handleModelReady = useCallback((id: string) => (scene: THREE.Group) => {
    // Guard against re-registration from StrictMode or re-renders
    if (readyRef.current.has(id)) return;
    readyRef.current.set(id, scene);
    setReadyCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (readyCount === models.length && models.length > 0) {
      // Wait one tick for R3F to mount hierarchy groups.
      // Order: layoutModels FIRST (computes correct centering at unified scale),
      // THEN move centering to CenterOffset so the geometry centre sits exactly
      // at the RotationPivot origin.
      // Guard: only run once — StrictMode remount would corrupt the offsets.
      if (hierarchyBuiltRef.current) return;
      hierarchyBuiltRef.current = true;
      queueMicrotask(() => {
        // layoutModels computes canonical centres → DisplayScale + CenterOffset
        // + layoutX → LayoutRoot.  Scene stays at scale=1, position=(0,0,0).
        layoutModels();

        // Force full world-matrix update through the new 5-layer hierarchy
        // so that CameraTracker and ShadowPlane see correct world bounds.
        if (groupRef.current) {
          groupRef.current.updateMatrixWorld();
          setModelScene(groupRef.current);
        }

        // ── DEV: debug visualization spheres ──
        if (typeof window !== "undefined" && import.meta.env.DEV) {
          rotationPivotRefs.current.forEach((pivot, vid) => {
            // Remove stale markers from previous mount
            const oldPivotMarker = pivot.getObjectByName("__dev_pivot_marker");
            if (oldPivotMarker) pivot.remove(oldPivotMarker);
            const oldGeoMarker = pivot.getObjectByName("__dev_geo_marker");
            if (oldGeoMarker) pivot.remove(oldGeoMarker);

            // Red sphere at RotationPivot origin (the rotation centre).
            const pivotMarker = new THREE.Mesh(
              new THREE.SphereGeometry(0.06, 16, 16),
              new THREE.MeshBasicMaterial({ color: 0xff0000, depthTest: false, depthWrite: false }),
            );
            pivotMarker.name = "__dev_pivot_marker";
            pivotMarker.renderOrder = 999;
            pivot.add(pivotMarker);

            // Green sphere at DisplayScale origin (= geometry centre, by hierarchy invariant).
            const ds = displayScaleRefs.current.get(vid);
            if (ds) {
              const existingGeo = ds.getObjectByName("__dev_geo_marker");
              if (existingGeo) ds.remove(existingGeo);
              const geoMarker = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0x00ff00, depthTest: false, depthWrite: false }),
              );
              geoMarker.name = "__dev_geo_marker";
              geoMarker.renderOrder = 999;
              ds.add(geoMarker); // at (0,0,0) in DisplayScale space = geometry centre
            }
          });
          console.log("[MultiModelGroup] Dev markers: red=pivot, green=geometry_center");
        }

        if (onAllReady) onAllReady();
      });
    }
  }, [readyCount, models.length, layoutModels, onAllReady]);

  // ── Self-rotation useFrame (replaces OrbitControls.autoRotate) ──
  // Phase 6 diagnostic: sample world centres at 0°/90°/180°/270°/360°.
  //
  // Measurement principle:
  //   - RotationPivot world origin  = pivot centre
  //   - DisplayScale world origin   = geometry centre (by hierarchy invariant:
  //     geometry centre C in ModelScene → C-C=0 in CenterOffset → S*0=0 in
  //     DisplayScale → Ry*0=0 in RotationPivot → world)
  //   - If centering is correct, both should coincide → distance ≈ 0.
  const diagSampledRef = useRef(new Set<number>());
  useFrame((_, delta) => {
    if (!autoRotateEnabled) return;
    const dt = Math.min(delta, 0.1);
    rotationPivotRefs.current.forEach((pivot) => {
      pivot.rotation.y = THREE.MathUtils.euclideanModulo(
        pivot.rotation.y + dt * AUTO_ROTATE_SPEED,
        Math.PI * 2,
      );
    });

    // Diagnostic: sample at each 90° milestone
    if (typeof window !== "undefined") {
      const w = window as unknown as Record<string, unknown>;
      const samples = (w.__rotDiag as Record<string, unknown>[]) || (w.__rotDiag = []);
      const firstPivot = rotationPivotRefs.current.values().next().value as THREE.Group | undefined;
      if (!firstPivot) return;
      const deg = firstPivot.rotation.y;
      const degNorm = ((deg % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const targets = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
      for (const t of targets) {
        const key = Math.round(t * 100);
        if (Math.abs(degNorm - t) < 0.03 && !diagSampledRef.current.has(key)) {
          diagSampledRef.current.add(key);
          const entry: Record<string, unknown> = { angle: Math.round((t / Math.PI) * 180) + "°", time: Date.now() };
          rotationPivotRefs.current.forEach((piv, vid) => {
            // Pivot world position = RotationPivot origin in world space.
            const pw = new THREE.Vector3(); piv.getWorldPosition(pw);

            // Geometry centre world position = DisplayScale origin in world space.
            // Since DisplayScale has no translation (only scale), its world origin
            // should coincide with RotationPivot origin when centering is correct.
            const ds = displayScaleRefs.current.get(vid);
            let gcw: THREE.Vector3 | null = null;
            if (ds) {
              gcw = new THREE.Vector3();
              ds.getWorldPosition(gcw);
            }

            // LayoutRoot — must not change during rotation.
            const lr = layoutRootRefs.current.get(vid);
            let lrw: THREE.Vector3 | null = null;
            if (lr) { lrw = new THREE.Vector3(); lr.getWorldPosition(lrw); }

            entry[vid] = {
              pivotWorld: [pw.x.toFixed(4), pw.y.toFixed(4), pw.z.toFixed(4)],
              geoCenterWorld: gcw ? [gcw.x.toFixed(4), gcw.y.toFixed(4), gcw.z.toFixed(4)] : null,
              pivotToGeoDist: gcw ? pw.distanceTo(gcw).toFixed(6) : null,
              layoutRootWorld: lrw ? [lrw.x.toFixed(4), lrw.y.toFixed(4), lrw.z.toFixed(4)] : null,
            };
          });
          // Camera state snapshot
          const ctrl = (_controls as OrbitControlsImpl | null);
          if (ctrl) {
            entry.controls = { target: [ctrl.target.x.toFixed(4), ctrl.target.y.toFixed(4), ctrl.target.z.toFixed(4)] };
          }
          samples.push(entry);
          if (samples.length >= 4) w.__rotDiagComplete = true;
        }
      }
    }
  });

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
  // Phase 6 Step 3: priority -100 ensures Explode runs before Camera Lock (-90)
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
  }, -100); // Phase 6 Step 3: run before CameraLockRuntime (-90)


  return (
    <group ref={groupRef}>
      {models.map((m, i) => (
        // Phase 6: 5-layer per-model hierarchy
        // LayoutRoot → RotationPivot → DisplayScale → CenterOffset → SceneModel
        <group
          key={m.id}
          ref={(el) => { if (el) layoutRootRefs.current.set(m.id, el); }}
        >
          <group
            ref={(el) => { if (el) rotationPivotRefs.current.set(m.id, el); }}
          >
            <group
              ref={(el) => { if (el) displayScaleRefs.current.set(m.id, el); }}
            >
              <group
                ref={(el) => { if (el) centerOffsetRefs.current.set(m.id, el); }}
              >
                <SceneModel
                  key={m.id}
                  modelPath={m.src}
                  containerWidth={containerWidth}
                  modelScale={m.scale ?? 2.5}
                  noAnimation={true}
                  nonInteractive={["其余"]}
                  noGlobalRef
                  skipAutoLayout
                  onReady={handleModelReady(m.id)}
                  variantId={m.id}
                  variantIndex={i}
                  variantLabel={m.label}
                  variantTitle={m.title}
                />
              </group>
            </group>
          </group>
        </group>
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

  // ── Phase 6 Step 2: track when model scene is ready for section binding ──
  // Initialized false; ModelViewer remounts on node switch (key={nodeId}).
  const [sceneReady, setSceneReady] = useState(false);
  const isMulti = !!(modelPaths && modelPaths.length >= 1);
  // Initial-fit identity: node + variant list ONLY.  Selection / hover /
  // explode / section state never changes it → no re-fit on those actions.
  const fitKey = useMemo(
    () =>
      isMulti && modelPaths
        ? buildFitKey(nodeId, modelPaths.map((m) => m.id))
        : buildFitKey(nodeId, []),
    [isMulti, modelPaths, nodeId],
  );

  const handleSceneReady = useCallback(() => { setSceneReady(true); }, []);

  // ── Reset the user-interaction guard on each node mount.  ModelViewer is
  // keyed by nodeId, so this runs once per node entry (StrictMode-safe). ──
  useEffect(() => {
    _userCameraInteracted = false;
  }, []);

  // ── Drag-state + pointer tracking ──
  const handleControlsStart = useCallback(() => {
    _suppressNextClick = true; // orbit/pan blocks following click
    _userCameraInteracted = true; // manual orbit/zoom → block responsive re-fit
    _isUserDragging = true;
  }, []);
  const handleControlsEnd = useCallback(() => {
    // _suppressNextClick stays true until next pointerdown clears it
    _isUserDragging = false;
  }, []);

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

  // Phase 6 Step 3: HMR safety net — clear registry on unmount
  useEffect(() => {
    return () => { clearObjectRegistry(); };
  }, []);

  return (
    <div ref={containerRef} className="flex-1 h-full relative bg-[#f5f5f7]">
      <Canvas
        camera={{ near: 0.5, far: 50, position: [0, 0, 8], fov: 40 }}
        dpr={[1, 1.5]} shadows
        gl={{ antialias: true, alpha: false }}
        onPointerDown={(e) => {
          _pointerDownX = e.nativeEvent.clientX;
          _pointerDownY = e.nativeEvent.clientY;
          _pointerMaxDist = 0;
          _pointerIdRef.current = e.nativeEvent.pointerId;
          _suppressNextClick = false;
        }}
        onPointerMove={(e) => {
          if (_pointerIdRef.current !== e.nativeEvent.pointerId) return;
          const dx = e.nativeEvent.clientX - _pointerDownX;
          const dy = e.nativeEvent.clientY - _pointerDownY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > _pointerMaxDist) _pointerMaxDist = dist;
          if (_pointerMaxDist > CLICK_MOVE_THRESHOLD) _suppressNextClick = true;
        }}
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
          {isMulti ? (
            <MultiModelGroup models={modelPaths!} containerWidth={containerWidth} explodeConfigs={explodeConfigs} nodeId={nodeId} onAllReady={handleSceneReady} autoRotate={autoRotate} />
          ) : modelPath ? (
            <SceneModel modelPath={modelPath} containerWidth={containerWidth} modelScale={modelScale} modelGroups={modelGroups} noAnimation={noAnimation} nonInteractive={nonInteractive} onReady={handleSceneReady} />
          ) : null}
        </Suspense>
        <OrbitControls
          ref={(ctrl) => { _controls = ctrl; }}
          autoRotate={!isMulti && autoRotate}
          autoRotateSpeed={0.6}
          enableDamping dampingFactor={0.08}
          minDistance={1} maxDistance={40}
          maxPolarAngle={Math.PI / 2.2}
          enablePan
          onStart={handleControlsStart}
          onEnd={handleControlsEnd}
        />
        <CameraTracker
          layoutKey={layoutKey}
          containerWidth={containerWidth}
          sceneReady={sceneReady}
          variantCount={isMulti && modelPaths ? modelPaths.length : 0}
          fitKey={fitKey}
        />
        {/* Phase 6 Step 2: Section clipping-plane runtime */}
        <SectionRuntime sceneVersion={sceneReady ? 1 : 0} />
        {/* Phase 6 Step 3: Camera Lock runtime */}
        <CameraLockRuntime />
      </Canvas>
    </div>
  );
}
