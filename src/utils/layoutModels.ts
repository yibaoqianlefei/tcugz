/**
 * Phase 2 — pure function to compute multi-model horizontal layout.
 *
 * Extracted from ModelViewer.MultiModelGroup.layoutModels() so the layout
 * math can be tested independently of Three.js / React lifecycle.
 *
 * Input:  array of Box3 X-axis widths
 * Output: entry center-x (left-to-right), gap, totalWidth
 *
 * The caller applies the centering offset to each scene:
 *   scene.position.x = entry.x - result.totalWidth / 2
 */

export interface LayoutEntry {
  /** Center-X before centering offset (left-to-right placement). */
  x: number;
  width: number;
}

export interface LayoutResult {
  entries: LayoutEntry[];
  gap: number;
  totalWidth: number;
}

const MIN_GAP = 0.6;
const MAX_GAP = 2.0;
const GAP_RATIO = 0.18;
const MIN_WIDTH = 0.5;

/**
 * Compute horizontal positions for 1–N models placed side-by-side.
 *
 * - Gap = clamp(maxWidth × 0.18, 0.6, 2.0)
 * - Each entry.x is the center of its model in left-to-right order
 * - totalWidth = sum(widths) + (n−1) × gap
 * - Invalid widths (NaN, ≤0, Infinity) are replaced with MIN_WIDTH (0.5)
 */
export function computeMultiModelLayout(widths: number[]): LayoutResult {
  // Sanitize widths: non-finite or ≤0 → MIN_WIDTH
  const safe = widths.map((w) =>
    Number.isFinite(w) && w > 0 ? w : MIN_WIDTH,
  );

  const maxW = Math.max(...safe, MIN_WIDTH);
  const gap = Math.max(MIN_GAP, Math.min(MAX_GAP, maxW * GAP_RATIO));

  let cursorX = 0;
  const entries: LayoutEntry[] = safe.map((w) => {
    const x = cursorX + w / 2;
    cursorX += w + gap;
    return { x, width: w };
  });

  const totalWidth = cursorX - gap;

  return { entries, gap, totalWidth };
}
