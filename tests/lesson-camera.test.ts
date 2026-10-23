import assert from 'node:assert/strict';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { advanceLessonCameraTransition, computeLessonCameraFit, type LessonCameraTransition } from '../src/components/textbook/lessonCamera';
import { CAMERA_REFIT_SECONDS, NODE_CAMERA_FOV } from '../src/utils/viewerCamera';

const bounds = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 2, 1));
const camera = new PerspectiveCamera(NODE_CAMERA_FOV);
const wide = computeLessonCameraFit(bounds, camera, 800, 400);
const narrow = computeLessonCameraFit(bounds, camera, 320, 600);
assert(narrow.distance > wide.distance, 'narrow stage fits both horizontal and vertical limits');
for (const [width, height] of [[800, 400], [320, 600]]) {
  const fit = computeLessonCameraFit(bounds, camera, width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  for (const direction of [new Vector3(1.2, .8, 1.4), new Vector3(-2, .3, -1), new Vector3(.01, 2, .01)]) {
    camera.position.copy(fit.center).addScaledVector(direction.normalize(), fit.distance);
    camera.lookAt(fit.center); camera.updateMatrixWorld(true);
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      const projected = new Vector3(x, y, z).project(camera);
      assert(Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1, 'complete rotating envelope remains inside the camera');
    }
  }
}

function exercise(fps: number, reverse = false) {
  const target = new Vector3(0, -1, .3);
  let direction = new Vector3(-.8, .4, 1.1).normalize();
  camera.position.copy(target).addScaledVector(direction, 5);
  const transition: LessonCameraTransition = { fromTarget: target.clone(), toTarget: new Vector3(0, reverse ? -2 : 1, 0), fromDistance: 5, toDistance: reverse ? 3 : 9, fromFitDistance: 10, toFitDistance: reverse ? 6 : 18, elapsed: 0 };
  let result = { done: false, fitDistance: 10 };
  let previousDistance = 5;
  for (let frame = 0; frame < Math.ceil(CAMERA_REFIT_SECONDS * fps) + 2 && !result.done; frame++) {
    // A live rotation halfway through must not be overwritten by a saved view.
    if (frame === 2) {
      direction = new Vector3(.3, .2, -1).normalize();
      camera.position.copy(target).addScaledVector(direction, previousDistance);
    }
    result = advanceLessonCameraTransition(transition, camera, target, 1 / fps);
    const live = camera.position.clone().sub(target);
    assert(live.clone().normalize().distanceTo(direction) < 1e-12, 'framing never resets the live orbit direction');
    assert(Math.abs(live.length() / result.fitDistance - .5) < 1e-12, 'relative user zoom remains unchanged through framing');
    assert(Math.abs(live.length() - previousDistance) < 2, 'no single boundary-frame distance jump');
    previousDistance = live.length();
  }
  assert(result.done);
  assert(target.distanceTo(transition.toTarget) < 1e-12);
  assert(Math.abs(previousDistance - transition.toDistance) < 1e-12);
}
for (const fps of [30, 60, 120, 144]) { exercise(fps); exercise(fps, true); }
console.log('PASS: full-envelope perspective fit, smooth expand/collapse, live direction and relative zoom at 30/60/120/144 fps.');
