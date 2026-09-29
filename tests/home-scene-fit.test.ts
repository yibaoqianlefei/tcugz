import assert from "node:assert/strict";
import * as THREE from "three";
import { fitHomeSceneScale } from "../src/utils/homeSceneFit";

const bounds = new THREE.Box3(
  new THREE.Vector3(-2, -0.7, -0.5),
  new THREE.Vector3(2, 0.7, 0.5),
);
const position = new THREE.Vector3(0, 0.5, 0);
const camera = new THREE.PerspectiveCamera(40, 1, 1, 100);
camera.position.set(0, 0.5, 4);
camera.lookAt(position);

const corners = [
  [bounds.min.x, bounds.min.y, bounds.min.z],
  [bounds.min.x, bounds.min.y, bounds.max.z],
  [bounds.min.x, bounds.max.y, bounds.min.z],
  [bounds.min.x, bounds.max.y, bounds.max.z],
  [bounds.max.x, bounds.min.y, bounds.min.z],
  [bounds.max.x, bounds.min.y, bounds.max.z],
  [bounds.max.x, bounds.max.y, bounds.min.z],
  [bounds.max.x, bounds.max.y, bounds.max.z],
] as const;

function assertFits(width: number, height: number): number {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  const scale = fitHomeSceneScale(bounds, position, camera, width, height);
  assert(scale > 0 && scale <= 1.5, `valid scale at ${width}×${height}`);
  for (const corner of corners) {
    const projected = new THREE.Vector3(...corner).multiplyScalar(scale).add(position).project(camera);
    assert(Math.abs(projected.x) <= 0.881, `horizontal fit at ${width}×${height}`);
    assert(Math.abs(projected.y) <= 0.881, `vertical fit at ${width}×${height}`);
    assert(projected.z >= -1 && projected.z <= 1, `depth fit at ${width}×${height}`);
  }
  return scale;
}

const scales = [2200, 900, 500, 124].map((width) => assertFits(width, 900));
assert(scales.every((scale, index) => index === 0 || scale < scales[index - 1]),
  "scale follows available viewport width without a clipping floor");

camera.position.set(1.5, 1.2, 4);
camera.lookAt(position);
assertFits(500, 900);
assert.equal(fitHomeSceneScale(new THREE.Box3(), position, camera, 500, 900), 1.5);
console.log("Home scene perspective fit passed");
