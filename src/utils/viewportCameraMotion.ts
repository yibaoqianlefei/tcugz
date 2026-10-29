/** Preserve projected pixel size while the CSS viewport changes height.
 * Perspective projection scales with viewportHeight / cameraDistance. */
export function compensateViewportDistance(distance: number, previousHeight: number, height: number): number {
  if (!(previousHeight > 0 && height > 0) || !Number.isFinite(height + previousHeight)) return distance;
  return distance * height / previousHeight;
}

/** Layout changes can move in either direction or reverse before settling.
 * Unlike explosion safety pull-back, they must never snap to a new distance. */
export function stepViewportDistance(distance: number, target: number, delta: number): number {
  const next = target + (distance - target) * Math.exp(-12 * Math.max(0, Math.min(delta, .05)));
  return Math.abs(next - target) < Math.max(1e-6, target * 1e-5) ? target : next;
}
