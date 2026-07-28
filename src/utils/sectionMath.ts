/**
 * Phase 6 Step 2 — Section math pure functions.
 *
 * All functions are pure: no WebGL, no DOM, no React, no side effects.
 * Input objects are never mutated; results are always new.
 */

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

export type SectionAxis = "x" | "y" | "z";

/** Axis-aligned bounding box represented as [min, max] tuples. */
export interface SectionBounds {
  min: readonly [number, number, number];
  max: readonly [number, number, number];
}

/* ═══════════════════════════════════════════════════════════════
   Offset clamping
   ═══════════════════════════════════════════════════════════════ */

/**
 * Clamp a section offset to [0, 1].
 * NaN / ±Infinity safely fall back to 0.5 (center).
 */
export function clampSectionOffset(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/* ═══════════════════════════════════════════════════════════════
   Normal direction
   ═══════════════════════════════════════════════════════════════ */

const AXIS_NORMALS: Record<SectionAxis, readonly [number, number, number]> = {
  x: [1, 0, 0],
  y: [0, 1, 0],
  z: [0, 0, 1],
};

/**
 * Return the (unnormalized) axis direction vector for the given axis.
 * When `invert` is true the direction is reversed.
 *
 * THREE.Plane equation: normal · point + constant = 0
 * The "visible" side is where normal · point + constant >= 0
 * (i.e. the half-space the plane normal points into).
 *
 * With invert=false the plane normal points in the +axis direction
 * and the visible side is everything above the plane constant.
 */
export function getSectionNormal(
  axis: SectionAxis,
  invert: boolean,
): [number, number, number] {
  const n = AXIS_NORMALS[axis];
  if (invert) return [-n[0], -n[1], -n[2]];
  return [n[0], n[1], n[2]];
}

/* ═══════════════════════════════════════════════════════════════
   Bounds helpers
   ═══════════════════════════════════════════════════════════════ */

/**
 * Extract the per-axis min/max from a bounds object.
 * Returns [min, max] for the given axis.
 * Degenerate bounds (min === max) are handled safely.
 */
export function getAxisRange(
  bounds: SectionBounds,
  axis: SectionAxis,
): [number, number] {
  const idx = axis === "x" ? 0 : axis === "y" ? 1 : 2;
  return [bounds.min[idx], bounds.max[idx]];
}

/**
 * Compute the center of a bounding box.
 */
export function getBoundsCenter(
  bounds: SectionBounds,
): [number, number, number] {
  return [
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2,
  ];
}

/**
 * Compute the size of a bounding box on each axis.
 */
export function getBoundsSize(
  bounds: SectionBounds,
): [number, number, number] {
  return [
    bounds.max[0] - bounds.min[0],
    bounds.max[1] - bounds.min[1],
    bounds.max[2] - bounds.min[2],
  ];
}

/* ═══════════════════════════════════════════════════════════════
   Plane constant computation
   ═══════════════════════════════════════════════════════════════ */

/**
 * Compute the plane constant for THREE.Plane given:
 *   - bounds: the model's world-space bounding box
 *   - axis: which axis the section plane is perpendicular to
 *   - normalizedOffset: [0, 1] where 0 = min edge, 1 = max edge
 *   - invert: whether to flip the plane normal direction
 *
 * THREE.Plane equation: normal · point + constant = 0
 *
 * A point P is on the plane when: normal · P + constant = 0
 * The visible half-space is: normal · P + constant >= 0
 *
 * With normalizedOffset = t ∈ [0, 1]:
 *   planePosition = min + t * (max - min)  (on the chosen axis)
 *
 * The plane passes through this point, so:
 *   normal · planePosition + constant = 0
 *   → constant = -(normal · planePosition)
 *
 * For axis-aligned normals this simplifies to:
 *   constant = -(normal[axis] * planePosition[axis])
 *
 * Returns the plane constant value.
 *
 * Edge cases:
 *   - Degenerate bounds (min === max): returns -normal[axis] * min[axis]
 *   - NaN/infinite bounds: treated as 0
 */
export function resolveSectionPlaneConstant(
  bounds: SectionBounds,
  axis: SectionAxis,
  normalizedOffset: number,
  invert: boolean,
): number {
  const t = clampSectionOffset(normalizedOffset);
  const [axisMin, axisMax] = getAxisRange(bounds, axis);

  // Guard against infinite/degenerate bounds
  const safeMin = Number.isFinite(axisMin) ? axisMin : 0;
  const safeMax = Number.isFinite(axisMax) ? axisMax : 0;

  // World position along the chosen axis
  const planePos = safeMin + t * (safeMax - safeMin);

  // Normal component along the chosen axis
  const n = invert ? -1 : 1;

  // constant = -(normal · point) = -(n * planePos)
  return -(n * planePos);
}

/* ═══════════════════════════════════════════════════════════════
   Visibility test (pure, testable without renderer)
   ═══════════════════════════════════════════════════════════════ */

/**
 * Test whether a world-space point is on the visible side of a
 * section plane defined by axis + offset + invert + bounds.
 *
 * Returns true if the point should be visible (not clipped).
 *
 * This is a pure numeric version — the runtime uses THREE.Plane
 * for actual clipping, but this function allows testing the
 * visibility logic without a WebGL renderer.
 */
export function isPointVisible(
  point: readonly [number, number, number],
  bounds: SectionBounds,
  axis: SectionAxis,
  normalizedOffset: number,
  invert: boolean,
  enabled: boolean,
): boolean {
  if (!enabled) return true;

  const normal = getSectionNormal(axis, invert);
  const constant = resolveSectionPlaneConstant(
    bounds,
    axis,
    normalizedOffset,
    invert,
  );

  // normal · point + constant >= 0 → visible
  const dot = normal[0] * point[0] + normal[1] * point[1] + normal[2] * point[2];
  return dot + constant >= 0;
}

/* ═══════════════════════════════════════════════════════════════
   Defaults
   ═══════════════════════════════════════════════════════════════ */

export const SECTION_DEFAULTS = {
  enabled: false,
  axis: "y" as SectionAxis,
  offset: 0.5,
  invert: false,
} as const;
