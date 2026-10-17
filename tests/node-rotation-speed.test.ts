import assert from 'node:assert/strict';
import { PerspectiveCamera } from 'three';
import { OrbitControls } from 'three-stdlib';
import { getNodeAutoRotationAngle, getNodeOrbitRotationSpeed } from '../src/utils/nodeRotation';

const expectedAngleAfterThirtySeconds = Math.PI; // 180°, i.e. one turn in 60 seconds.

function makeOrbit() {
  const camera = new PerspectiveCamera();
  camera.position.set(0, 2, 8);
  const controls = new OrbitControls(camera);
  controls.enableDamping = false;
  controls.autoRotate = true;
  return controls;
}

for (const fps of [15, 30, 60, 120, 144, 240]) {
  const orbit = makeOrbit();
  const initialAngle = orbit.getAzimuthalAngle();
  let comparisonAngle = 0;
  for (let frame = 0; frame < fps * 30; frame++) {
    orbit.autoRotateSpeed = getNodeOrbitRotationSpeed(1 / fps);
    orbit.update();
    comparisonAngle += getNodeAutoRotationAngle(1 / fps);
  }
  assert.ok(Math.abs(initialAngle - orbit.getAzimuthalAngle() - expectedAngleAfterThirtySeconds) < 1e-9,
    `real OrbitControls must rotate 180° in 30 seconds at ${fps} fps`);
  assert.ok(Math.abs(comparisonAngle - expectedAngleAfterThirtySeconds) < 1e-9,
    `comparison models must share the same pace at ${fps} fps`);
  orbit.dispose();
  console.log(`PASS: previews, single and comparison models share a 60-second turn at ${fps} fps`);
}

const orbit = makeOrbit();
orbit.autoRotateSpeed = getNodeOrbitRotationSpeed(1 / 60);
orbit.update();
orbit.autoRotate = false;
const pausedAngle = orbit.getAzimuthalAngle();
for (let frame = 0; frame < 120; frame++) orbit.update();
assert.ok(Math.abs(orbit.getAzimuthalAngle() - pausedAngle) < 1e-12,
  'pausing must hold the current angle within floating-point precision');
orbit.autoRotate = true;
orbit.update();
assert.ok(orbit.getAzimuthalAngle() < pausedAngle, 'resuming must continue from the paused angle');
orbit.dispose();

assert.equal(getNodeAutoRotationAngle(10), getNodeAutoRotationAngle(1 / 15),
  'returning from a hidden tab must not produce a large rotation jump');
assert.equal(getNodeOrbitRotationSpeed(10), getNodeOrbitRotationSpeed(1 / 15));
assert.equal(getNodeAutoRotationAngle(0), 0);
console.log('PASS: pause/resume and hidden-tab jump protection');
