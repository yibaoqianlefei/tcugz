/**
 * NodeDetail — visible control-bar whitelist.
 *
 * Separates what the runtime CAN do (`RUNTIME_CAPABILITIES`) from what the
 * teaching page is allowed to SHOW (`NODE_DETAIL_PRIMARY_CONTROLS`).  The
 * NodeDetail control bar renders ONLY from the whitelist — it never iterates
 * the runtime capabilities.
 *
 * The abandoned advanced feature chains (Section / Camera Lock / explode-axis
 * / reverse / target / debug) have been fully deleted from the codebase; the
 * runtime capability list below contains only the live capabilities.
 *
 * Rules enforced here:
 *   - A multi-model node must never implicitly flip a whitelisted-off control
 *     to true.
 *   - With no UI config present, the page falls back to this same minimal
 *     default (the e706b641 "图二" surface).
 *   - Debug / advanced flags are ignored: they must not change the formal
 *     page's control bar structure.
 */

/** The ONLY controls shown on the NodeDetail control bar.
 *
 *   1. explode — [collapse] [slider] [expand]  (single: AnimationMixer,
 *      multi: explodeProgress)
 *   2. reset   — circular arrow + R; restores the initial interaction state
 *      (explode/animation back to initial, selection cleared, initial camera
 *      composition re-applied).
 *   3. link    — knowledge-panel linkage toggle.
 *   4. lighting— sun; toggles the shadow/lighting setup.
 */
export const NODE_DETAIL_PRIMARY_CONTROLS = [
  "explode",
  "reset",
  "link",
  "lighting",
] as const;

export type NodeDetailControl = (typeof NODE_DETAIL_PRIMARY_CONTROLS)[number];

/** The live runtime capabilities.  Never rendered directly by the control
 *  bar, and never containing a deprecated capability. */
export const RUNTIME_CAPABILITIES = [
  "explode",      // both single-model AnimationMixer + multi-model explode
  "reset",        // R — store reset + camera re-fit
  "link",         // linkage toggle
  "lighting",     // shadow/lighting toggle
] as const;

export type RuntimeCapability = (typeof RUNTIME_CAPABILITIES)[number];

/** True when a control is part of the visible NodeDetail surface. */
export function isControlVisible(control: string): boolean {
  return (NODE_DETAIL_PRIMARY_CONTROLS as readonly string[]).includes(control);
}

/**
 * Resolve the visible control-bar surface for the NodeDetail page.
 *
 * `config` exists only to mirror the "capabilities vs. visible controls"
 * contract and is intentionally ignored: neither multi-model state nor a
 * debug flag may widen the surface beyond the fixed whitelist.  The function
 * returns the same minimal set for single-model and multi-model nodes.
 */
export function resolveVisibleControls(
  _config?: { showAdvanced?: boolean },
): readonly NodeDetailControl[] {
  void _config; // accepted for API symmetry; deliberately unused
  return NODE_DETAIL_PRIMARY_CONTROLS;
}
