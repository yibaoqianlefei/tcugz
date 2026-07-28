/**
 * Phase 6 Step 2+3 — Shared model-scene ref, Object3D registry,
 * and CameraTracker pause gate.
 *
 * Both ModelViewer (writer) and SectionRuntime / CameraLockRuntime
 * (reader) need access to shared runtime state without coupling via
 * component-file exports (which break react-refresh).
 */

import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════
   Model scene ref
   ═══════════════════════════════════════════════════════════════ */

let __modelScene: THREE.Group | null = null;

/** Read the current model scene (used by SectionRuntime, CameraLockRuntime). */
export function getModelScene(): THREE.Group | null {
  return __modelScene;
}

/** Update the model scene ref (called by SceneModel / MultiModelGroup). */
export function setModelScene(scene: THREE.Group | null): void {
  __modelScene = scene;
}

/* ═══════════════════════════════════════════════════════════════
   Object3D registry (Phase 6 Step 3 — Camera Lock)
   ═══════════════════════════════════════════════════════════════ */

type ObjectRegistryEntry = {
  objects: readonly THREE.Object3D[];
  token: symbol;
};

const _objectRegistry = new Map<string, ObjectRegistryEntry>();

/**
 * Register a group of Object3D instances under a scoped key.
 * All objects share the same logical component identity.
 *
 * @returns An unregister function. Only removes the entry if the
 *          current token matches — prevents stale cleanup from
 *          an old SceneModel instance from deleting new data.
 */
export function registerObjects(
  key: string,
  objects: readonly THREE.Object3D[],
): () => void {
  const token = Symbol("object-reg");
  _objectRegistry.set(key, { objects, token });
  return () => {
    const entry = _objectRegistry.get(key);
    if (entry && entry.token === token) {
      _objectRegistry.delete(key);
    }
  };
}

/** Resolve a scoped key to its registered Object3D collection. */
export function resolveObjects(
  key: string,
): readonly THREE.Object3D[] | undefined {
  return _objectRegistry.get(key)?.objects;
}

/**
 * Clear the entire registry.
 * Only called as an HMR safety net — normal cleanup uses per-key
 * unregister functions returned by registerObjects().
 */
export function clearObjectRegistry(): void {
  _objectRegistry.clear();
}

/* ═══════════════════════════════════════════════════════════════
   CameraTracker pause gate (Phase 6 Step 3)
   ═══════════════════════════════════════════════════════════════ */

let _cameraTrackerPaused = false;

export function isCameraTrackerPaused(): boolean {
  return _cameraTrackerPaused;
}

export function pauseCameraTracker(): void {
  _cameraTrackerPaused = true;
}

export function resumeCameraTracker(): void {
  _cameraTrackerPaused = false;
}
