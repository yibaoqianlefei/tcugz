import { Box3, MathUtils, PerspectiveCamera, Sphere, Vector3 } from 'three';
import { CAMERA_REFIT_SECONDS } from '../../utils/viewerCamera';

export const LESSON_DEFAULT_VIEW_DIRECTION = new Vector3(1.2, .8, 1.4).normalize();

/** A sphere also covers depth during rotation, unlike a front-face box fit. */
export function computeLessonCameraFit(bounds: Box3, camera: PerspectiveCamera, width: number, height: number) {
  const radius = Math.max(bounds.getBoundingSphere(new Sphere()).radius, .001);
  const vertical = MathUtils.degToRad(camera.fov);
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * width / Math.max(1, height));
  return { center: bounds.getCenter(new Vector3()), radius, distance: radius / Math.sin(Math.min(vertical, horizontal) / 2) * 1.2 };
}

export type LessonCameraTransition = {
  fromTarget: Vector3;
  toTarget: Vector3;
  fromDistance: number;
  toDistance: number;
  fromFitDistance: number;
  toFitDistance: number;
  elapsed: number;
};

/** Translate camera and target together and scale only the live orbit radius.
 * Never interpolate to a saved direction: automatic/manual rotation stays live.
 * OrbitControls already updates once per frame; calling update here would add
 * a second automatic-rotation step during every framing transition. */
export function advanceLessonCameraTransition(transition: LessonCameraTransition, camera: PerspectiveCamera, target: Vector3, delta: number) {
  transition.elapsed = Math.min(CAMERA_REFIT_SECONDS, transition.elapsed + Math.min(delta, .05));
  const time = transition.elapsed / CAMERA_REFIT_SECONDS;
  const eased = time * time * (3 - 2 * time);
  const direction = camera.position.clone().sub(target).normalize();
  if (!direction.lengthSq()) direction.copy(LESSON_DEFAULT_VIEW_DIRECTION);
  target.lerpVectors(transition.fromTarget, transition.toTarget, eased);
  camera.position.copy(target).addScaledVector(direction, MathUtils.lerp(transition.fromDistance, transition.toDistance, eased));
  return { done: time >= 1, fitDistance: MathUtils.lerp(transition.fromFitDistance, transition.toFitDistance, eased) };
}
