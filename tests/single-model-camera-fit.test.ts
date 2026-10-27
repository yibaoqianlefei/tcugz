import assert from 'node:assert/strict';
import * as THREE from 'three';
import { computeSingleModelCameraFit, computeVisibleGeometryWorldBox, computeVisibleGeometryOrbitRadius } from '../src/utils/cameraFit';
import { SINGLE_MODEL_FIT_PADDING } from '../src/utils/viewerCamera';

// Hidden interaction geometry must not alter framing; rotating real geometry
// must account for all corners, including the formerly lost depth extent.
const scene = new THREE.Group();
const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
mesh.rotation.y = Math.PI / 4;
scene.add(mesh);
const hitbox = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100));
hitbox.name = 'component_hitbox'; scene.add(hitbox);
const proxy = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100));
proxy.userData._isProxy = true; scene.add(proxy);
const size = computeVisibleGeometryWorldBox(scene).getSize(new THREE.Vector3());
assert(Math.abs(size.x - Math.sqrt(8)) < 1e-5);
assert(Math.abs(size.z - Math.sqrt(8)) < 1e-5);
assert(Math.abs(computeVisibleGeometryOrbitRadius(scene, new THREE.Vector3()) - Math.sqrt(2)) < 1e-5);

const round = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 64));
const roundBounds = computeVisibleGeometryWorldBox(round);
const roundRadius = computeVisibleGeometryOrbitRadius(round, roundBounds.getCenter(new THREE.Vector3()));
assert(Math.abs(roundRadius - 1) < 1e-5, 'round geometry uses its true radius, not the diagonal of its box');
round.geometry.dispose();

// The floating toolbar owns the lower 80px; fitting must keep model geometry
// above it, rather than simply moving a large model into the controls.
const toolbarCamera = new THREE.PerspectiveCamera(40, 647 / 596, .01, 100);
toolbarCamera.position.set(0, 1.14, 7.92);
const toolbarFit = computeSingleModelCameraFit({ boxSize: new THREE.Vector3(2, 2, 2),
  boxCenter: new THREE.Vector3(), canvasWidth: 647, canvasHeight: 596, verticalFovDeg: 40,
  cameraPosition: toolbarCamera.position, controlsTarget: new THREE.Vector3(),
  padding: SINGLE_MODEL_FIT_PADDING, compositionFraction: 0, horizontalRadius: 1, bottomInset: 80 });
toolbarCamera.position.copy(toolbarFit.finalCameraPosition);
toolbarCamera.lookAt(toolbarFit.controlsTarget); toolbarCamera.updateMatrixWorld();
for (let i = 0; i < 360; i++) for (const y of [-1, 1]) {
  const projected = new THREE.Vector3(Math.cos(i * Math.PI / 180), y, Math.sin(i * Math.PI / 180)).project(toolbarCamera);
  assert(projected.y > -1 + 160 / 596 && projected.y < 1, 'complete model stays outside toolbar area');
}

// Verify the complete orbit envelope of shallow, tall, deep and stair-like
// models using actual perspective projection, including near-face depth.
for (const shape of [[1.356, 1.422, 1.458], [4, .2, 3], [.2, 5, .2], [1, 2, 8]]) {
  for (const [width, height] of [[666, 605], [600, 900], [1200, 700], [320, 620]]) {
    for (const elevation of [.143, .6, 1.2]) {
      const camera = new THREE.PerspectiveCamera(40, width / height, .01, 100);
      camera.position.set(0, Math.sin(elevation) * 8, Math.cos(elevation) * 8);
      const bounds = new THREE.Vector3(...shape);
      const fit = computeSingleModelCameraFit({ boxSize: bounds, boxCenter: new THREE.Vector3(),
        canvasWidth: width, canvasHeight: height, verticalFovDeg: 40,
        cameraPosition: camera.position, controlsTarget: new THREE.Vector3(),
        padding: SINGLE_MODEL_FIT_PADDING, compositionFraction: 0 });
      camera.position.copy(fit.finalCameraPosition);
      camera.lookAt(fit.controlsTarget); camera.updateMatrixWorld();
      for (let step = 0; step < 72; step++) {
        const rotation = new THREE.Matrix4().makeRotationY(step * Math.PI * 2 / 72);
        for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
          const projected = new THREE.Vector3(x * shape[0] / 2, y * shape[1] / 2, z * shape[2] / 2)
            .applyMatrix4(rotation).project(camera);
          assert(Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1, 'every corner remains visible during a full orbit');
        }
      }
      const rotatedCamera = new THREE.Vector3(camera.position.z, camera.position.y, -camera.position.x);
      const turned = computeSingleModelCameraFit({ boxSize: bounds, boxCenter: new THREE.Vector3(),
        canvasWidth: width, canvasHeight: height, verticalFovDeg: 40,
        cameraPosition: rotatedCamera, controlsTarget: new THREE.Vector3(), padding: SINGLE_MODEL_FIT_PADDING, compositionFraction: 0 });
      assert(Math.abs(fit.finalDistance - turned.finalDistance) < 1e-6, 'automatic yaw never pumps the camera distance');
      if (shape[0] === 1.356 && width === 666 && elevation === .143) {
        assert(fit.finalDistance < 4, 'small stair is framed closer than the previous fixed distance of eight');
      }
    }
  }
}
mesh.geometry.dispose(); hitbox.geometry.dispose(); proxy.geometry.dispose();
console.log('PASS single-model camera: rotated bounds, helper exclusions, depth-aware framing and complete orbit safety at four viewport shapes');
