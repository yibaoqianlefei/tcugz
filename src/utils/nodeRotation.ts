/** One full turn takes one minute, shared by previews and interactive nodes. */
export const NODE_ROTATION_PERIOD_SECONDS = 60;
const RADIANS_PER_SECOND = (Math.PI * 2) / NODE_ROTATION_PERIOD_SECONDS;

/** Avoid a large jump on the first frame after returning to a hidden tab. */
export function getNodeAutoRotationAngle(deltaSeconds: number): number {
  return Math.max(0, Math.min(deltaSeconds, 1 / 15)) * RADIANS_PER_SECOND;
}

/** Installed three-stdlib OrbitControls advances 2π / 3600 × speed per update. */
export function getNodeOrbitRotationSpeed(deltaSeconds: number): number {
  return getNodeAutoRotationAngle(deltaSeconds) * 3600 / (Math.PI * 2);
}
