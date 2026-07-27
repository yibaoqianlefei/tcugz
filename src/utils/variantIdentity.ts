/**
 * Phase 3 — variant identity protocol.
 *
 * Every cloned variant scene root carries userData that identifies
 * which variant it belongs to. Pure functions walk upward from any
 * descendant mesh to resolve the owning variant identity.
 *
 * Normal single-model nodes have no variant userData → functions
 * return null, keeping existing behavior unchanged.
 */

import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

export interface VariantIdentity {
  variantId: string;
  variantIndex: number;
  label: string;
  title: string;
  src: string;
}

/** Key used on userData to mark a variant root. */
export const VARIANT_ROOT_KEY = "__variantIdentity";

/* ═══════════════════════════════════════════════════════════════
   Write
   ═══════════════════════════════════════════════════════════════ */

export function writeVariantIdentity(
  scene: THREE.Object3D,
  identity: VariantIdentity,
): void {
  scene.userData[VARIANT_ROOT_KEY] = identity;
  scene.userData.presentationMode = "variants";
  scene.userData.variantId = identity.variantId;
  scene.userData.variantIndex = identity.variantIndex;
  scene.userData.variantLabel = identity.label;
  scene.userData.variantTitle = identity.title;
}

/* ═══════════════════════════════════════════════════════════════
   Resolve
   ═══════════════════════════════════════════════════════════════ */

/**
 * Walk upward from `obj` looking for a variant root.
 * Returns the identity if found, `null` for normal single-model nodes.
 */
export function resolveVariantIdentity(
  obj: THREE.Object3D,
): VariantIdentity | null {
  let current: THREE.Object3D | null = obj;
  while (current) {
    const id = current.userData[VARIANT_ROOT_KEY];
    if (id) return id as VariantIdentity;
    current = current.parent;
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   Key helpers — scoped per-variant, backward-compatible
   ═══════════════════════════════════════════════════════════════ */

const KEY_SEPARATOR = "::";

/** Build a variant-scoped key from variantId + objectName. */
export function makeScopedKey(
  variantId: string | null,
  objectName: string,
): string {
  if (!variantId) return objectName;
  return `${variantId}${KEY_SEPARATOR}${objectName}`;
}

/** Parse a scoped key back into its parts. */
export function parseScopedKey(
  key: string,
): { variantId: string | null; objectName: string } {
  const idx = key.indexOf(KEY_SEPARATOR);
  if (idx === -1) return { variantId: null, objectName: key };
  return {
    variantId: key.slice(0, idx),
    objectName: key.slice(idx + KEY_SEPARATOR.length),
  };
}

/* ═══════════════════════════════════════════════════════════════
   Scene cloning with material isolation (Phase 3 P1)
   ═══════════════════════════════════════════════════════════════ */

/** Per-clone owned-materials store, keyed on the scene object. */
const _ownedMaterialsStore = new WeakMap<THREE.Object3D, Set<THREE.Material>>();

/**
 * Deep-clone a GLTF scene and replace every mesh material with an
 * independent copy.  Owned materials are tracked so the caller can
 * dispose them when the clone is unmounted.
 *
 * - Scene hierarchy: cloned (SkeletonUtils.clone)
 * - Geometry: shared (read-only, safe)
 * - Material: cloned per-mesh, including Material[] arrays
 * - Owned materials: stored in a module-level WeakMap
 *
 * The source scene (useGLTF cache) is never touched.
 */
export function cloneSceneWithMaterials(
  sourceScene: THREE.Object3D,
): THREE.Group {
  const cloned = SkeletonUtils.clone(sourceScene) as THREE.Group;
  const ownedMaterials = new Set<THREE.Material>();

  cloned.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;

    if (Array.isArray(obj.material)) {
      obj.material = obj.material.map((sourceMat) => {
        const c = sourceMat.clone();
        ownedMaterials.add(c);
        return c;
      });
    } else if (obj.material) {
      const c = obj.material.clone();
      ownedMaterials.add(c);
      obj.material = c;
    }
  });

  _ownedMaterialsStore.set(cloned, ownedMaterials);
  return cloned;
}

/**
 * Dispose all materials that were cloned by {@link cloneSceneWithMaterials}.
 * Safe to call on a scene that was not cloned by that function (no-op).
 * Never disposes geometry or useGLTF-cached source materials.
 */
export function disposeClonedMaterials(scene: THREE.Object3D): void {
  const ownedMaterials = _ownedMaterialsStore.get(scene);
  if (!ownedMaterials) return;

  ownedMaterials.forEach((m) => {
    if (m && typeof m.dispose === "function") m.dispose();
  });
  // NOTE: do NOT clear() or delete() — StrictMode may call cleanup then
  // re-setup with the same scene. The WeakMap entry must survive so the
  // real unmount cleanup can still find and re-dispose the materials.
  // WeakMap auto-releases when the key (scene) is GC'd.
}
