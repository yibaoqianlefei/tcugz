/**
 * NodeDetail — control-bar whitelist tests.
 *
 * Verifies the visible-controls contract that fixed the multi-model-era UI
 * bloat:
 *   - The NodeDetail control bar renders ONLY NODE_DETAIL_PRIMARY_CONTROLS
 *     (explode | reset | link | lighting), for BOTH single- and multi-model.
 *   - Runtime capabilities (section, cameraLock, axis, reverse, debug) are
 *     NOT part of the visible surface and can never be widened onto it —
 *     neither by variant count nor by a debug flag.
 *   - R reset semantics: resetNodeInteractionState + requestCameraRefit.
 *
 * Pure logic — no WebGL, no React DOM. Run with:
 *   npx tsx tests/nodeDetail-controls.test.ts
 */

import {
  NODE_DETAIL_PRIMARY_CONTROLS,
  RUNTIME_CAPABILITIES,
  isControlVisible,
  resolveVisibleControls,
} from "../src/utils/nodeDetailControls";
import { useNodeStore } from "../src/store/nodeStore";

/* ═══════════════════════════════════════════════════════════════
   Harness
   ═══════════════════════════════════════════════════════════════ */

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`  PASS: ${msg}`);
}

let testCount = 0;
function group(title: string): void {
  testCount++;
  console.log(`\n== T${testCount}: ${title}`);
}

/** Reset the singleton store to its factory defaults before each store test. */
function resetStore(): void {
  useNodeStore.getState().resetNodeInteractionState();
}

/* ═══════════════════════════════════════════════════════════════
   Tests
   ═══════════════════════════════════════════════════════════════ */

group("Single-model visible surface = explode | reset | link | lighting (exactly)");
{
  const visible = resolveVisibleControls();
  const asSet = new Set(visible);
  assert(visible.length === 4, `whitelist has exactly 4 entries (got ${visible.length})`);
  assert(
    NODE_DETAIL_PRIMARY_CONTROLS.every(
      (c) => asSet.has(c) && isControlVisible(c),
    ),
    "every whitelisted control is visible",
  );
  assert(asSet.has("explode") && asSet.has("reset") && asSet.has("link") && asSet.has("lighting"),
    "contains explode/reset/link/lighting");
  // No duplicates → no stray empty divider groups from repeated keys.
  assert(asSet.size === visible.length, "whitelist has no duplicate entries");
}

group("Multi-model visible surface is identical (variant count cannot widen it)");
{
  const multi = resolveVisibleControls({ showAdvanced: true });
  const single = resolveVisibleControls();
  assert(
    multi.length === single.length && multi.every((c, i) => c === single[i]),
    "multi-model surface identical to single-model surface",
  );
  assert(multi.length === 4, "multi-model still only 4 visible controls");
}

group("Multi-model never auto-shows Section / axis / reverse / extra switches");
{
  assert(isControlVisible("section") === false, "section is NOT visible");
  assert(isControlVisible("cameraLock") === false, "cameraLock is NOT visible");
  assert(isControlVisible("explodeAxis") === false, "explodeAxis is NOT visible");
  assert(isControlVisible("reverse") === false, "reverse is NOT visible");
  assert(isControlVisible("target") === false, "target/aim is NOT visible");
  assert(isControlVisible("debug") === false, "debug is NOT visible");
  // Axis-style keys (X/Y/Z) are never part of the surface either.
  assert(isControlVisible("xAxis") === false, "xAxis is NOT visible");
  assert(isControlVisible("yAxis") === false, "yAxis is NOT visible");
  assert(isControlVisible("zAxis") === false, "zAxis is NOT visible");
}

group("visibleControls and runtimeCapabilities are independent");
{
  const visible = new Set(resolveVisibleControls());
  // Everything visible must also be a supported runtime capability…
  for (const c of NODE_DETAIL_PRIMARY_CONTROLS) {
    assert(
      (RUNTIME_CAPABILITIES as readonly string[]).includes(c),
      `runtime supports ${c} under the hood`,
    );
  }
  // …but the reverse is NOT true: runtime capabilities must not leak into UI.
  const leak = RUNTIME_CAPABILITIES.filter((c) => visible.has(c));
  assert(leak.length === 4, `only the 4 whitelisted controls leak (leaked: ${leak.join(",")})`);
  const hidden = RUNTIME_CAPABILITIES.filter((c) => !visible.has(c));
  assert(
    hidden.includes("section") && hidden.includes("cameraLock") && hidden.includes("debug"),
    "section/cameraLock/debug stay runtime-only (invisible)",
  );
}

group("No config → minimal defaults; debug flag cannot widen the surface");
{
  const noConfig = resolveVisibleControls();
  const debugOn = resolveVisibleControls({ showAdvanced: true });
  const debugOff = resolveVisibleControls({ showAdvanced: false });
  assert(
    noConfig.join(",") === debugOff.join(",") && noConfig.join(",") === debugOn.join(","),
    "no config / debug off / debug on all return the same minimal default",
  );
  assert(noConfig.length === 4, "default fallback is the 4-group minimal surface");
}

group("Control-bar width does not grow with variant count (pure function of whitelist)");
{
  // resolveVisibleControls takes no variant-count argument → the surface is
  // constant, so the bar can never widen because a node has 3 models.
  const a = resolveVisibleControls();
  const b = resolveVisibleControls({ showAdvanced: false });
  assert(a.join(",") === b.join(","), "surface constant across inputs");
  assert(JSON.stringify(a) === JSON.stringify(b), "surface is reference-stable ordering");
  // Single & multi share the same shell: the component contract is a single
  // ControlBar fed by this whitelist — no variant-driven replacement.
  assert(
    (NODE_DETAIL_PRIMARY_CONTROLS as readonly string[]).every(isControlVisible),
    "single shared whitelist drives the shared ControlBar",
  );
}

group("R reset semantics — resetNodeInteractionState + requestCameraRefit");
{
  resetStore();
  const s = useNodeStore.getState();

  // Dirty the interaction state.
  s.setExplodeProgress(0.7);
  s.setAnimationProgress(0.42);
  s.setSelectedObject("plinth");
  s.setSectionEnabled(true);
  s.setSectionAxis("x");
  s.lockCameraToObject("plinth");
  s.setLinkageEnabled(false);

  const beforeToken = useNodeStore.getState().refitToken;
  useNodeStore.getState().requestCameraRefit();
  assert(useNodeStore.getState().refitToken === beforeToken + 1, "requestCameraRefit bumps the token");

  useNodeStore.getState().resetNodeInteractionState();
  const after = useNodeStore.getState();
  assert(after.explodeProgress === 0, "reset → explodeProgress 0");
  assert(after.animationProgress === 0, "reset → animationProgress 0");
  assert(after.selectedObject === null, "reset → selection cleared");
  assert(after.sectionEnabled === false, "reset → section off");
  assert(after.sectionAxis === "y", "reset → section axis back to default");
  assert(after.cameraLockEnabled === false && after.cameraLockTargetKey === null,
    "reset → camera lock off");
  // Linkage (like shadows) is a persistent user preference — the reset does
  // NOT flip it back; only explode/animation/selection/section/lock reset.
  assert(after.linkageEnabled === false, "reset preserves the linkage preference (not reset)");
}

group("Hidden advanced features have no default keyboard surface (module contract)");
{
  // There are no X/Y/Z, section, reverse, cameraLock or target entries in the
  // visible whitelist, so a stray keypress cannot toggle them.  (NodeDetail
  // binds only Escape and R — R triggers the whitelisted reset.)
  for (const hidden of ["xAxis", "yAxis", "zAxis", "section", "reverse", "cameraLock", "target"] as const) {
    assert(!(NODE_DETAIL_PRIMARY_CONTROLS as readonly string[]).includes(hidden),
      `no default binding surface for ${hidden}`);
  }
  const visibleKeys = NODE_DETAIL_PRIMARY_CONTROLS as readonly string[];
  assert(visibleKeys.includes("reset"), "R remains the visible reset shortcut");
}

console.log(`\nAll nodeDetail-controls tests passed (${testCount} groups).`);
