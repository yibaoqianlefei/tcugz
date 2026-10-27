import assert from 'node:assert/strict';
import * as THREE from 'three';
import { computeSingleModelCameraFit, computeVisibleGeometryOrbitRadius, computeVisibleGeometryWorldBox } from '../src/utils/cameraFit';
import { cameraFollowTarget, captureCameraDistanceRatio, didCameraGestureChange, stepCameraFollowDistance } from '../src/utils/singleModelCameraFollow';
import { SINGLE_MODEL_FIT_PADDING } from '../src/utils/viewerCamera';

// OrbitControls emits start/end on a click, even if no camera input followed.
assert.equal(didCameraGestureChange(4, 4, 0, 5), false);
assert.equal(didCameraGestureChange(4, 4.00001, 2, 5), false);
assert.equal(didCameraGestureChange(4, 4, 20, 5), true, 'real orbit/pan records a preference');
assert.equal(didCameraGestureChange(4, 3.8, 0, 5), true, 'wheel zoom works without pointer movement');

// Use moving real geometry, actual fitting and the production distance step.
// The upper piece unfolds upward; its geometry and camera must both return.
const model = new THREE.Group();
const base = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1));
const layer = new THREE.Mesh(new THREE.BoxGeometry(2, .3, 1));
model.add(base, layer);
const direction = new THREE.Vector3(.7, .4, 1).normalize();
function fit(progress: number, width: number, height: number) {
  layer.position.y = .65 + progress * 2;
  const bounds = computeVisibleGeometryWorldBox(model);
  return computeSingleModelCameraFit({ boxSize: bounds.getSize(new THREE.Vector3()),
    boxCenter: bounds.getCenter(new THREE.Vector3()),
    horizontalRadius: computeVisibleGeometryOrbitRadius(model, bounds.getCenter(new THREE.Vector3())),
    canvasWidth: width, canvasHeight: height, verticalFovDeg: 40,
    cameraPosition: direction, controlsTarget: new THREE.Vector3(),
    padding: SINGLE_MODEL_FIT_PADDING, compositionFraction: 0, bottomInset: 80 }).finalDistance;
}
for (const fps of [30, 60, 120, 144]) {
  for (const [width, height] of [[647, 596], [400, 900], [1200, 700]]) {
    for (const ratio of [1, 1.8, .85]) {
      const initial = cameraFollowTarget(fit(0, width, height), ratio);
      let distance = initial;
      for (let cycle = 0; cycle < 3; cycle++) {
        for (let frame = 0; frame <= fps * 4; frame++) {
          const target = cameraFollowTarget(fit(frame / (fps * 4), width, height), ratio);
          distance = stepCameraFollowDistance(distance, target, 1 / fps);
          assert(distance >= target - 1e-8, 'growing bounds never wait for camera safety');
        }
        for (let frame = fps * 4; frame >= 0; frame--) {
          distance = stepCameraFollowDistance(distance,
            cameraFollowTarget(fit(frame / (fps * 4), width, height), ratio), 1 / fps);
        }
        // Progress is now frozen at zero: fitting must still converge.
        for (let frame = 0; frame < fps * 2; frame++) {
          distance = stepCameraFollowDistance(distance, initial, 1 / fps);
        }
        assert.equal(distance, initial, 'collapse recovers the same zoom without cumulative shrinkage');
      }
      // Reverse before full expansion; no endpoint event is needed to recover.
      distance = stepCameraFollowDistance(initial, cameraFollowTarget(fit(.6, width, height), ratio), 1 / fps);
      for (let frame = 0; frame < fps * 2; frame++) distance = stepCameraFollowDistance(distance, initial, 1 / fps);
      assert.equal(distance, initial, 'partial reversal / slider reset settles as well');
    }
  }
}
const assembledFit = fit(0, 647, 596), expandedFit = fit(1, 647, 596);
const userRatio = captureCameraDistanceRatio(expandedFit * 1.4, expandedFit);
assert(Math.abs(cameraFollowTarget(assembledFit, userRatio) - assembledFit * 1.4) < 1e-8,
  'zoom chosen while expanded retains only the user ratio, not the temporary pull-back');
assert.equal(cameraFollowTarget(100, 2), 40);
assert.equal(cameraFollowTarget(.1, .5), 1);
assert(stepCameraFollowDistance(8, 4, 1 / 60) > 4, 'return is eased rather than snapping');
base.geometry.dispose(); layer.geometry.dispose();
console.log('PASS single-model camera follow: click vs gesture, orbit/pan/wheel, 3 cycles at 4 frame rates × 3 viewports × 3 zoom levels, endpoint settling, partial reversal and zoom during expansion');
