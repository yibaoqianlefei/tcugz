/**
 * Phase 6 Step 3 — CameraLockRuntime (Canvas-internal).
 *
 * Mounts inside the R3F Canvas.  Manages the camera lock to a
 * selected component:
 *
 *  - Resolves cameraLockTargetKey → Object3D[] via registry
 *  - Computes union world bounding-box centre
 *  - Writes _controls.target (copy, not lerp)
 *  - Syncs on explodeProgress / section state changes via dirty flag
 *  - Detects fully-clipped target → schedules queueMicrotask unlock
 *
 * Does NOT:
 *  - Write camera.position
 *  - Change fov or zoom
 *  - Create OrbitControls / Canvas
 *  - Call Zustand actions in useFrame
 *  - Run per-frame traversal (only when dirtyRef === true)
 */

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNodeStore } from "../../store/nodeStore";
import {
  getModelScene,
  resolveObjects,
  pauseCameraTracker,
} from "../../utils/modelSceneRef";
import {
  isPointVisible,
  type SectionBounds,
} from "../../utils/sectionMath";

/* ═══════════════════════════════════════════════════════════════
   Frame priority (Phase 6 Step 3)
   Camera Lock useFrame runs at priority -90.
   Explode useFrame (in MultiModelGroup) runs at priority -100.
   ═══════════════════════════════════════════════════════════════ */

const CAMERA_LOCK_PRIORITY = -90;

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

function box3ToSectionBounds(box: THREE.Box3): SectionBounds {
  return {
    min: [box.min.x, box.min.y, box.min.z],
    max: [box.max.x, box.max.y, box.max.z],
  };
}

/**
 * Compute the union world bounding box of a set of Object3D instances.
 * Skips objects whose parent chain is broken (removed from scene).
 * Returns isEmpty=true when no valid objects remain.
 */
function computeUnionWorldBox(
  objects: readonly THREE.Object3D[],
  targetBox: THREE.Box3,
): { isEmpty: boolean } {
  targetBox.makeEmpty();
  let validCount = 0;
  for (const obj of objects) {
    if (!obj.parent) continue;
    obj.updateWorldMatrix(true, false);
    targetBox.expandByObject(obj);
    validCount++;
  }
  return { isEmpty: validCount === 0 || targetBox.isEmpty() };
}

/**
 * Test whether a world-space bounding box is fully clipped by the
 * current section plane.  All 8 corners must be on the clipped side.
 * Non-finite values → returns false (safer: don't auto-unlock).
 */
function isObjectCompletelyClipped(
  worldBox: THREE.Box3,
  isEmpty: boolean,
  worldPosition: readonly [number, number, number],
  sectionBounds: SectionBounds,
  axis: "x" | "y" | "z",
  offset: number,
  invert: boolean,
): boolean {
  // Validate numeric inputs
  if (!Number.isFinite(offset)) return false;
  if (
    !Number.isFinite(sectionBounds.min[0]) ||
    !Number.isFinite(sectionBounds.min[1]) ||
    !Number.isFinite(sectionBounds.min[2])
  )
    return false;
  if (
    !Number.isFinite(sectionBounds.max[0]) ||
    !Number.isFinite(sectionBounds.max[1]) ||
    !Number.isFinite(sectionBounds.max[2])
  )
    return false;
  if (
    !Number.isFinite(worldPosition[0]) ||
    !Number.isFinite(worldPosition[1]) ||
    !Number.isFinite(worldPosition[2])
  )
    return false;

  // Empty bounds → fallback to world position
  if (isEmpty) {
    const bMin = worldBox.min;
    const bMax = worldBox.max;
    if (
      !Number.isFinite(bMin.x) || !Number.isFinite(bMin.y) || !Number.isFinite(bMin.z) ||
      !Number.isFinite(bMax.x) || !Number.isFinite(bMax.y) || !Number.isFinite(bMax.z)
    )
      return false;
    return !isPointVisible(worldPosition, sectionBounds, axis, offset, invert, true);
  }

  const min = worldBox.min;
  const max = worldBox.max;
  const corners: readonly (readonly [number, number, number])[] = [
    [min.x, min.y, min.z], [min.x, min.y, max.z],
    [min.x, max.y, min.z], [min.x, max.y, max.z],
    [max.x, min.y, min.z], [max.x, min.y, max.z],
    [max.x, max.y, min.z], [max.x, max.y, max.z],
  ];

  for (const c of corners) {
    if (!Number.isFinite(c[0]) || !Number.isFinite(c[1]) || !Number.isFinite(c[2]))
      return false;
  }

  return corners.every(
    (c) => !isPointVisible(c, sectionBounds, axis, offset, invert, true),
  );
}

/* ═══════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════ */

// _controls is the module-level OrbitControls ref in ModelViewer
declare let _controls: import("three-stdlib").OrbitControls | null;

export default function CameraLockRuntime() {
  /* ── Reusable objects ── */
  const boxRef = useRef(new THREE.Box3());
  const sectionBoundsBoxRef = useRef(new THREE.Box3());
  const centerRef = useRef(new THREE.Vector3());

  /* ── Dirty trigger ── */
  const dirtyRef = useRef(true);

  /* ── Microtask gate ── */
  const scheduledRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  /* ── Subscribe to dirty triggers (Zustand v5: single listener) ── */
  useEffect(() => {
    let prevExplode = useNodeStore.getState().explodeProgress;
    let prevActiveId = useNodeStore.getState().activeExplodeVariantId;
    let prevSecEnabled = useNodeStore.getState().sectionEnabled;
    let prevSecAxis = useNodeStore.getState().sectionAxis;
    let prevSecOffset = useNodeStore.getState().sectionOffset;
    let prevSecInvert = useNodeStore.getState().sectionInvert;
    let prevLockEnabled = useNodeStore.getState().cameraLockEnabled;
    let prevLockKey = useNodeStore.getState().cameraLockTargetKey;

    const unsub = useNodeStore.subscribe((state) => {
      if (
        state.explodeProgress !== prevExplode ||
        state.activeExplodeVariantId !== prevActiveId ||
        state.sectionEnabled !== prevSecEnabled ||
        state.sectionAxis !== prevSecAxis ||
        state.sectionOffset !== prevSecOffset ||
        state.sectionInvert !== prevSecInvert ||
        state.cameraLockEnabled !== prevLockEnabled ||
        state.cameraLockTargetKey !== prevLockKey
      ) {
        dirtyRef.current = true;
        prevExplode = state.explodeProgress;
        prevActiveId = state.activeExplodeVariantId;
        prevSecEnabled = state.sectionEnabled;
        prevSecAxis = state.sectionAxis;
        prevSecOffset = state.sectionOffset;
        prevSecInvert = state.sectionInvert;
        prevLockEnabled = state.cameraLockEnabled;
        prevLockKey = state.cameraLockTargetKey;
      }
    });
    return () => unsub();
  }, []);

  /* ── Camera Tracker pause/resume ── */
  useEffect(() => {
    let prevEnabled = useNodeStore.getState().cameraLockEnabled;
    const unsub = useNodeStore.subscribe((state) => {
      if (state.cameraLockEnabled !== prevEnabled) {
        prevEnabled = state.cameraLockEnabled;
        if (state.cameraLockEnabled) pauseCameraTracker();
        // Note: resumeCameraTracker is NOT called here — only
        // resetCameraLock (lifecycle) resumes it.
      }
    });
    return () => unsub();
  }, []);

  /* ═══════════════════════════════════════════════════════════
     Dirty useFrame (priority=-90, after Explode at -100)
     ═══════════════════════════════════════════════════════════ */
  useFrame(() => {
    if (!dirtyRef.current) return;

    const store = useNodeStore.getState();
    if (!store.cameraLockEnabled) { dirtyRef.current = false; return; }

    const targetKey = store.cameraLockTargetKey;
    if (!targetKey) { dirtyRef.current = false; return; }

    const objs = resolveObjects(targetKey);
    if (!objs || objs.length === 0) {
      // Target lost → schedule safe unlock
      if (!scheduledRef.current) {
        scheduledRef.current = true;
        const capturedKey = targetKey;
        queueMicrotask(() => {
          scheduledRef.current = false;
          if (!isMountedRef.current) return;
          const s = useNodeStore.getState();
          if (!s.cameraLockEnabled) return;
          if (s.cameraLockTargetKey !== capturedKey) return;
          s.unlockCamera();
        });
      }
      dirtyRef.current = false;
      return;
    }

    // Compute union world box
    const box = boxRef.current;
    const { isEmpty } = computeUnionWorldBox(objs, box);

    if (isEmpty) {
      // All objects orphaned → schedule safe unlock
      if (!scheduledRef.current) {
        scheduledRef.current = true;
        const capturedKey = targetKey;
        const capturedObjs = objs;
        queueMicrotask(() => {
          scheduledRef.current = false;
          if (!isMountedRef.current) return;
          const s = useNodeStore.getState();
          if (!s.cameraLockEnabled) return;
          if (s.cameraLockTargetKey !== capturedKey) return;
          if (resolveObjects(capturedKey) !== capturedObjs) return;
          s.unlockCamera();
        });
      }
      dirtyRef.current = false;
      return;
    }

    // Update controls.target
    box.getCenter(centerRef.current);
    if (_controls) {
      _controls.target.copy(centerRef.current);
      _controls.update();
    }

    // Section clipping check
    if (store.sectionEnabled) {
      const ms = getModelScene();
      if (ms) {
        const sbBox = sectionBoundsBoxRef.current;
        sbBox.setFromObject(ms);
        const sectionBounds = box3ToSectionBounds(sbBox);
        const wp: readonly [number, number, number] = [
          centerRef.current.x,
          centerRef.current.y,
          centerRef.current.z,
        ];

        const clipped = isObjectCompletelyClipped(
          box,
          isEmpty,
          wp,
          sectionBounds,
          store.sectionAxis,
          store.sectionOffset,
          store.sectionInvert,
        );

        if (clipped && !scheduledRef.current) {
          scheduledRef.current = true;
          const capturedKey = targetKey;
          const capturedObjs = objs;
          const capturedVariantId = store.activeExplodeVariantId;
          queueMicrotask(() => {
            scheduledRef.current = false;
            if (!isMountedRef.current) return;
            const s = useNodeStore.getState();
            if (!s.cameraLockEnabled) return;
            if (s.cameraLockTargetKey !== capturedKey) return;
            if (resolveObjects(capturedKey) !== capturedObjs) return;
            if (s.activeExplodeVariantId !== capturedVariantId) return;
            s.unlockCamera();
          });
        }
      }
    }

    dirtyRef.current = false;
  }, CAMERA_LOCK_PRIORITY);

  // Re-mark dirty on mount
  useEffect(() => { dirtyRef.current = true; }, []);

  return null;
}
