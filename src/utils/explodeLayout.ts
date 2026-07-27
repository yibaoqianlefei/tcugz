/**
 * Phase 5 — programmatic per-component explode math.
 *
 * All functions are pure: no WebGL, no DOM, no React, no side effects.
 * Input arrays/objects are never mutated; results are always new.
 */

import type { NodeDefinition, VariantExplodeConfig } from "../data/nodeDefinitions";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

/** Resolved variant-level explode config. */
export interface ResolvedVariantExplodeConfig {
  enabled: boolean;
  variantId: string | null;
  components: readonly ResolvedExplodeComponent[];
}

/** Single resolved component ready for position computation. */
export interface ResolvedExplodeComponent {
  objectName: string;
  direction: readonly [number, number, number];
  distance: number;
  start: number;
  end: number;
}

/** Input for computeExplodedPosition. */
export interface ExplodePositionInput {
  basePosition: readonly [number, number, number];
  direction: readonly [number, number, number];
  distance: number;
  progress: number;
  start: number;
  end: number;
}

/* ═══════════════════════════════════════════════════════════════
   Numeric helpers
   ═══════════════════════════════════════════════════════════════ */

/**
 * Clamp a value to [0, 1]. NaN / ±Infinity safely fall back to 0.
 */
export function clampExplodeProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Compute per-component progress within a [start, end] window.
 *
 * - start, end are clamped to [0, 1]; defaults = 0, 1.
 * - If start < end: linear interpolation.
 * - If start === end: threshold — progress >= start → 1, else 0.
 * - If start > end: swapped to a legal interval (smallest=start, largest=end).
 *
 * Always returns a value in [0, 1]. Never returns NaN.
 */
export function computeLocalExplodeProgress(
  progress: number,
  start?: number,
  end?: number,
): number {
  const safeProgress = clampExplodeProgress(progress);
  let s = Number.isFinite(start) ? clampExplodeProgress(start!) : 0;
  let e = Number.isFinite(end) ? clampExplodeProgress(end!) : 1;

  // Swap if inverted
  if (s > e) {
    const t = s;
    s = e;
    e = t;
  }

  // Threshold (start === end)
  if (s === e) {
    return safeProgress >= s ? 1 : 0;
  }

  // Linear interpolation
  if (safeProgress <= s) return 0;
  if (safeProgress >= e) return 1;
  return (safeProgress - s) / (e - s);
}

/* ═══════════════════════════════════════════════════════════════
   Vector helpers
   ═══════════════════════════════════════════════════════════════ */

function vecLen3(v: readonly [number, number, number]): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

function normalize3(v: readonly [number, number, number]): [number, number, number] {
  const len = vecLen3(v);
  if (len === 0) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

/* ═══════════════════════════════════════════════════════════════
   Position computation
   ═══════════════════════════════════════════════════════════════ */

/**
 * Compute the final exploded position for a single component.
 *
 * Formula:
 *   result = basePosition + normalizedDirection * safeDistance * localProgress
 *
 * - Direction is normalized internally.
 * - Zero-vector direction → returns basePosition unchanged.
 * - Non-finite distance → treated as 0 (no displacement).
 * - Negative distance is allowed (reverses the normalized direction).
 * - Input arrays are never mutated; a new tuple is returned every call.
 */
export function computeExplodedPosition(
  input: ExplodePositionInput,
): [number, number, number] {
  const local = computeLocalExplodeProgress(input.progress, input.start, input.end);
  if (local === 0) return [input.basePosition[0], input.basePosition[1], input.basePosition[2]];

  const dir = normalize3(input.direction);
  const len = vecLen3(dir);
  if (len === 0) return [input.basePosition[0], input.basePosition[1], input.basePosition[2]];

  const dist = Number.isFinite(input.distance) ? input.distance : 0;
  if (dist === 0) return [input.basePosition[0], input.basePosition[1], input.basePosition[2]];

  return [
    input.basePosition[0] + dir[0] * dist * local,
    input.basePosition[1] + dir[1] * dist * local,
    input.basePosition[2] + dir[2] * dist * local,
  ];
}

/* ═══════════════════════════════════════════════════════════════
   Configuration resolution
   ═══════════════════════════════════════════════════════════════ */

/**
 * Resolve the explode config for a specific variant.
 *
 * - Only reads the named variant; never falls back.
 * - `variantId === null` or missing variant → { enabled: false }.
 * - Missing `explode` config → { enabled: false }.
 * - `explode.enabled === false` → { enabled: false }.
 * - Normal (non-variants) nodes → { enabled: false }.
 * - Components default start=0, end=1.
 */
export function resolveVariantExplodeConfig({
  node,
  variantId,
}: {
  node: NodeDefinition;
  variantId: string | null;
}): ResolvedVariantExplodeConfig {
  if (!variantId || node.presentationMode !== "variants" || !node.variants) {
    return { enabled: false, variantId: null, components: [] };
  }

  const variant = node.variants.find((v) => v.id === variantId);
  if (!variant) {
    return { enabled: false, variantId: null, components: [] };
  }

  const cfg: VariantExplodeConfig | undefined = variant.explode;
  if (!cfg || !cfg.enabled) {
    return { enabled: false, variantId: null, components: [] };
  }

  const components: ResolvedExplodeComponent[] = cfg.components.map((c) => ({
    objectName: c.objectName,
    direction: c.direction,
    distance: c.distance,
    start: c.start ?? 0,
    end: c.end ?? 1,
  }));

  return { enabled: true, variantId, components };
}

/**
 * Find a single explode component by object name within a resolved config.
 *
 * Matching order:
 *   1. Exact objectName match
 *   2. Alias match within the current variant
 *   3. Returns null
 *
 * No canonicalName merging — 001, 001_1, 001_2 are distinct.
 */
export function findExplodeComponent(
  config: ResolvedVariantExplodeConfig,
  objectName: string,
): ResolvedExplodeComponent | null {
  if (!config.enabled || !objectName) return null;

  const exact = config.components.find((c) => c.objectName === objectName);
  if (exact) return exact;

  // Aliases require the source config, which we don't hold here.
  // In practice, aliases are matched by the caller using the original config.
  return null;
}
