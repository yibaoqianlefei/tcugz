/** A click starts OrbitControls too. Only a drag or an actual dolly records a
 * user camera preference; automatic orbit drift must not turn a click into one. */
export function didCameraGestureChange(
  startDistance: number,
  endDistance: number,
  pointerTravel: number,
  dragThreshold: number,
): boolean {
  return pointerTravel > dragThreshold ||
    Math.abs(endDistance - startDistance) > Math.max(1e-5, startDistance * 1e-4);
}

/** Relative to the live pose's fit, so an expanded model's temporary camera
 * pull-back is never saved as the assembled model's permanent distance. */
export function captureCameraDistanceRatio(distance: number, fitDistance: number): number {
  return Math.max(distance, .001) / Math.max(fitDistance, .001);
}

export function cameraFollowTarget(fitDistance: number, userDistanceRatio: number): number {
  // Match OrbitControls' range, including intentionally chosen close-up views.
  return Math.max(1, Math.min(40, fitDistance * userDistanceRatio));
}

/** Pull out immediately when bounds grow, avoiding a clipped frame. Ease back
 * in as they contract, and keep converging after animation progress stops. */
export function stepCameraFollowDistance(
  distance: number,
  target: number,
  delta: number,
): number {
  if (target >= distance) return target;
  const next = target + (distance - target) * Math.exp(-8 * Math.max(0, delta));
  return Math.abs(next - target) < Math.max(1e-5, target * 1e-4) ? target : next;
}
