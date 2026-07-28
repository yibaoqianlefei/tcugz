/**
 * Phase 6 Step 2 — SectionRuntime (Canvas-internal).
 *
 * Mounts inside the R3F Canvas.  Manages a single THREE.Plane,
 * enabling/disabling clipping planes on renderable mesh materials.
 *
 * Responsibilities:
 *  - gl.localClippingEnabled = true
 *  - Create + reuse ONE THREE.Plane instance
 *  - Read section state from nodeStore
 *  - Bind/unbind materials on enable/disable
 *  - Update plane normal/constant in-place when params change
 *  - Rebind on model scene change (sceneVersion)
 *  - Full cleanup on unmount
 *
 * Does NOT:
 *  - Operate camera or controls
 *  - Run per-frame (no useFrame, no traverse)
 *  - Hold/store THREE objects in Zustand
 */

import { useEffect, useRef, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useNodeStore } from "../../store/nodeStore";
import {
  getSectionNormal,
  resolveSectionPlaneConstant,
  type SectionBounds,
} from "../../utils/sectionMath";
import { getModelScene } from "../../utils/modelSceneRef";

/**
 * Build a SectionBounds from a Three.js Box3.
 * Never mutates the input.
 */
function box3ToBounds(box: THREE.Box3): SectionBounds {
  return {
    min: [box.min.x, box.min.y, box.min.z],
    max: [box.max.x, box.max.y, box.max.z],
  };
}

export default function SectionRuntime({
  sceneVersion,
}: {
  /** Incremented whenever the model scene identity changes. */
  sceneVersion: number;
}) {
  const { gl } = useThree();

  /* ── Stable plane instance ── */
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  /* ── Material tracking ── */
  // Map from material → original clippingPlanes (null | Plane[])
  const boundMatsRef = useRef<Map<THREE.Material, THREE.Plane[] | null>>(
    new Map(),
  );

  /* ── Bounds cache ── */
  const boundsRef = useRef<SectionBounds>({
    min: [-1, -1, -1],
    max: [1, 1, 1],
  });
  const boundsDirtyRef = useRef(true);

  /* ── Store reads ── */
  const sectionEnabled = useNodeStore((s) => s.sectionEnabled);
  const sectionAxis = useNodeStore((s) => s.sectionAxis);
  const sectionOffset = useNodeStore((s) => s.sectionOffset);
  const sectionInvert = useNodeStore((s) => s.sectionInvert);
  const explodeProgress = useNodeStore((s) => s.explodeProgress);

  /* ── Enable renderer clipping ── */
  useEffect(() => {
    // Save previous state so we don't clobber another system's setting.
    const previous = gl.localClippingEnabled;
    // eslint-disable-next-line react-hooks/immutability
    gl.localClippingEnabled = true;
    return () => {
       
      gl.localClippingEnabled = previous;
    };
  }, [gl]);

  /* ── Mark bounds dirty on scene / explode change ── */
  useEffect(() => {
    boundsDirtyRef.current = true;
  }, [sceneVersion, explodeProgress]);

  /* ── Refresh cached bounds from live scene ── */
  const refreshBounds = useCallback(() => {
    const ms = getModelScene();
    if (!ms) return;
    const box = new THREE.Box3().setFromObject(ms);
    boundsRef.current = box3ToBounds(box);
    boundsDirtyRef.current = false;
  }, []);

  /* ── Update plane normal + constant in-place ── */
  const updatePlane = useCallback(() => {
    if (boundsDirtyRef.current) {
      refreshBounds();
    }
    const normal = getSectionNormal(sectionAxis, sectionInvert);
    planeRef.current.normal.set(normal[0], normal[1], normal[2]);
    planeRef.current.constant = resolveSectionPlaneConstant(
      boundsRef.current,
      sectionAxis,
      sectionOffset,
      sectionInvert,
    );
  }, [sectionAxis, sectionOffset, sectionInvert, refreshBounds]);

  // Update plane whenever section params change
  useEffect(() => {
    updatePlane();
  }, [updatePlane]);

  /* ── Unbind all currently-bound materials ── */
  const unbindAll = useCallback(() => {
    boundMatsRef.current.forEach((original, mat) => {
      mat.clippingPlanes = original;
      mat.needsUpdate = true;
    });
    boundMatsRef.current.clear();
  }, []);

  /* ── Collect & bind materials from current model scene ── */
  const bindAll = useCallback(() => {
    const ms = getModelScene();
    if (!ms) return;

    ms.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      // Skip non-renderable helpers
      if (obj.userData._isProxy) return;
      if (obj instanceof THREE.LineSegments) return;

      const mats: THREE.Material[] = Array.isArray(obj.material)
        ? obj.material
        : [obj.material];

      mats.forEach((mat) => {
        if (!mat) return;
        // Already bound by this system
        if (boundMatsRef.current.has(mat)) return;

        // Save original clippingPlanes (null if unset, or a copied array)
        const original: THREE.Plane[] | null =
          mat.clippingPlanes && mat.clippingPlanes.length > 0
            ? [...mat.clippingPlanes]
            : null;

        boundMatsRef.current.set(mat, original);

        // Append our plane
        const ours = planeRef.current;
        const next = original ? [...original, ours] : [ours];
        mat.clippingPlanes = next;
        mat.needsUpdate = true;
      });
    });
  }, []);

  /* ── Material binding lifecycle ── */
  useEffect(() => {
    // First, unbind whatever we had before
    unbindAll();

    if (!sectionEnabled) return;

    // Bind fresh
    bindAll();

    return () => {
      unbindAll();
    };
  }, [sectionEnabled, sceneVersion, unbindAll, bindAll]);

  /* ── Unmount cleanup ── */
  useEffect(() => {
    return () => {
      unbindAll();
    };
    // Only on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
