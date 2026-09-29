import * as THREE from "three";

/**
 * Largest uniform model scale that keeps every corner of a centered model box
 * inside the currently visible perspective viewport. The box is expressed in
 * the model group's local coordinates, before the group's scale/translation.
 */
export function fitHomeSceneScale(
  centeredBounds: THREE.Box3,
  groupPosition: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  viewportWidth: number,
  viewportHeight: number,
  preferredScale = 1.5,
  padding = 0.88,
): number {
  if (centeredBounds.isEmpty() || viewportWidth <= 0 || viewportHeight <= 0) {
    return preferredScale;
  }

  camera.updateMatrixWorld();
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / camera.zoom;
  const tanH = tanV * viewportWidth / viewportHeight;
  const corners = [
    new THREE.Vector3(centeredBounds.min.x, centeredBounds.min.y, centeredBounds.min.z),
    new THREE.Vector3(centeredBounds.min.x, centeredBounds.min.y, centeredBounds.max.z),
    new THREE.Vector3(centeredBounds.min.x, centeredBounds.max.y, centeredBounds.min.z),
    new THREE.Vector3(centeredBounds.min.x, centeredBounds.max.y, centeredBounds.max.z),
    new THREE.Vector3(centeredBounds.max.x, centeredBounds.min.y, centeredBounds.min.z),
    new THREE.Vector3(centeredBounds.max.x, centeredBounds.min.y, centeredBounds.max.z),
    new THREE.Vector3(centeredBounds.max.x, centeredBounds.max.y, centeredBounds.min.z),
    new THREE.Vector3(centeredBounds.max.x, centeredBounds.max.y, centeredBounds.max.z),
  ];
  const point = new THREE.Vector3();

  const fits = (scale: number) => corners.every((corner) => {
    point.copy(corner).multiplyScalar(scale).add(groupPosition).applyMatrix4(camera.matrixWorldInverse);
    const depth = -point.z;
    return depth > camera.near && depth < camera.far &&
      Math.abs(point.x) <= depth * tanH * padding &&
      Math.abs(point.y) <= depth * tanV * padding;
  });

  if (fits(preferredScale)) return preferredScale;
  let low = 0;
  let high = preferredScale;
  for (let i = 0; i < 18; i++) {
    const middle = (low + high) / 2;
    if (fits(middle)) low = middle;
    else high = middle;
  }
  return low;
}
