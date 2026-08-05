/**
 * Shared model-scene ref.
 *
 * ModelViewer (writer) and CameraTracker (reader) share the current model
 * scene group through this module without coupling via component-file
 * exports (which break react-refresh).
 */

import * as THREE from "three";

let __modelScene: THREE.Group | null = null;

/** Read the current model scene (used by CameraTracker). */
export function getModelScene(): THREE.Group | null {
  return __modelScene;
}

/** Update the model scene ref (called by SceneModel / MultiModelGroup). */
export function setModelScene(scene: THREE.Group | null): void {
  __modelScene = scene;
}
