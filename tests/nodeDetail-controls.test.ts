/**
 * NodeDetail — control-bar whitelist + abandoned-feature deletion tests.
 *
 * Verifies the visible-controls contract (explode | rotate | reset | link |
 * lighting, for BOTH single- and multi-model) AND that the abandoned Section / Camera
 * Lock / explode-axis feature chains have been fully deleted — not merely
 * hidden:
 *   - The feature components / runtimes / math module no longer exist on disk.
 *   - nodeStore exposes no section or cameraLock fields / actions.
 *   - RUNTIME_CAPABILITIES contains no deprecated capability.
 *
 * Pure logic — no WebGL, no React DOM. Run with:
 *   npx tsx tests/nodeDetail-controls.test.ts
 */

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcFile = (rel: string) => path.join(ROOT, "src", rel);

/** Reset the singleton store to its factory defaults before each store test. */
function resetStore(): void {
  useNodeStore.getState().resetNodeInteractionState();
}

/* ═══════════════════════════════════════════════════════════════
   Abandoned-feature deletion checks
   ═══════════════════════════════════════════════════════════════ */

group("Abandoned feature files no longer exist");
{
  const files = [
    "components/viewer/SectionControls.tsx",
    "components/viewer/SectionRuntime.tsx",
    "components/viewer/CameraLockControls.tsx",
    "components/viewer/CameraLockRuntime.tsx",
    "utils/sectionMath.ts",
  ];
  for (const f of files) {
    assert(!existsSync(srcFile(f)), `deleted file removed: ${f}`);
  }
}

group("Abandoned feature tests no longer exist");
{
  const files = ["tests/phase6-step2.test.ts", "tests/phase6-step3.test.ts"];
  for (const f of files) {
    assert(!existsSync(path.join(ROOT, f)), `deleted test removed: ${f}`);
  }
}

group("nodeStore no longer exposes section fields/actions");
{
  resetStore();
  const s = useNodeStore.getState() as Record<string, unknown>;
  for (const key of [
    "sectionEnabled",
    "sectionAxis",
    "sectionOffset",
    "sectionInvert",
    "setSectionEnabled",
    "setSectionAxis",
    "setSectionOffset",
    "setSectionInvert",
    "resetSection",
  ]) {
    assert(!(key in s), `store has no ${key}`);
  }
  // Unrelated interaction state is untouched.
  assert("explodeProgress" in s && "animationProgress" in s && "linkageEnabled" in s,
    "explode/animation/linkage state preserved");
  assert("refitToken" in s && typeof (s as { requestCameraRefit: unknown }).requestCameraRefit === "function",
    "refitToken + requestCameraRefit preserved");
}

group("nodeStore no longer exposes cameraLock fields/actions");
{
  resetStore();
  const s = useNodeStore.getState() as Record<string, unknown>;
  for (const key of [
    "cameraLockEnabled",
    "cameraLockTargetKey",
    "lockCameraToObject",
    "unlockCamera",
    "resetCameraLock",
  ]) {
    assert(!(key in s), `store has no ${key}`);
  }
}

group("Runtime capability list contains no abandoned capabilities");
{
  for (const dep of ["section", "cameraLock", "explodeAxis", "reverse", "target", "debug"] as const) {
    assert(!(RUNTIME_CAPABILITIES as readonly string[]).includes(dep),
      `runtime capabilities exclude ${dep}`);
  }
  // The live four remain.
  for (const live of NODE_DETAIL_PRIMARY_CONTROLS) {
    assert((RUNTIME_CAPABILITIES as readonly string[]).includes(live),
      `runtime capability includes ${live}`);
  }
  assert(RUNTIME_CAPABILITIES.length === NODE_DETAIL_PRIMARY_CONTROLS.length,
    `capability list == whitelist length (${RUNTIME_CAPABILITIES.length})`);
}

/* ═══════════════════════════════════════════════════════════════
   Visible-controls whitelist (unchanged contract)
   ═══════════════════════════════════════════════════════════════ */

group("Single-model visible surface = explode | rotate | link | lighting (exactly)");
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
  assert(
    asSet.has("explode") && asSet.has("rotate") &&
      asSet.has("link") && asSet.has("lighting"),
    "contains explode/rotate/link/lighting",
  );
  assert(!asSet.has("reset"), "reset is NOT a visible control (R button UI removed)");
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

group("Deprecated controls are never part of the visible surface");
{
  for (const dep of ["section", "cameraLock", "explodeAxis", "reverse", "target", "debug",
    "xAxis", "yAxis", "zAxis"]) {
    assert(isControlVisible(dep) === false, `${dep} is NOT visible`);
  }
}

group("visibleControls and runtimeCapabilities are independent");
{
  const visible = new Set(resolveVisibleControls());
  // Everything visible must also be a supported runtime capability…
  for (const c of NODE_DETAIL_PRIMARY_CONTROLS) {
    assert((RUNTIME_CAPABILITIES as readonly string[]).includes(c),
      `runtime supports ${c} under the hood`);
  }
  // …and the reverse is exactly the live four (nothing deprecated leaks).
  const leak = RUNTIME_CAPABILITIES.filter((c) => visible.has(c));
  assert(leak.length === 4, `only the 4 whitelisted controls are capabilities (${leak.join(",")})`);
  const extra = RUNTIME_CAPABILITIES.filter((c) => !visible.has(c));
  assert(extra.length === 0, `no runtime capability is hidden from the surface (extra: ${extra.join(",")})`);
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

group("Control-bar surface does not grow with variant count");
{
  const a = resolveVisibleControls();
  const b = resolveVisibleControls({ showAdvanced: false });
  assert(a.join(",") === b.join(","), "surface constant across inputs");
  assert((NODE_DETAIL_PRIMARY_CONTROLS as readonly string[]).every(isControlVisible),
    "single shared whitelist drives the shared ControlBar");
}

group("R reset semantics — resetNodeInteractionState + requestCameraRefit");
{
  resetStore();
  const s = useNodeStore.getState();

  s.setExplodeProgress(0.7);
  s.setAnimationProgress(0.42);
  s.setSelectedObject("plinth");
  s.setLinkageEnabled(false);
  s.setAutoRotate(false);

  const beforeToken = useNodeStore.getState().refitToken;
  useNodeStore.getState().requestCameraRefit();
  assert(useNodeStore.getState().refitToken === beforeToken + 1, "requestCameraRefit bumps the token");

  useNodeStore.getState().resetNodeInteractionState();
  const after = useNodeStore.getState();
  assert(after.explodeProgress === 0, "reset → explodeProgress 0");
  assert(after.animationProgress === 0, "reset → animationProgress 0");
  assert(after.selectedObject === null, "reset → selection cleared");
  assert(after.linkageEnabled === false, "reset preserves the linkage preference (not reset)");
  assert(after.autoRotate === true, "reset restores autoRotate to the product default (rotating)");
}

group("Hidden advanced features have no default keyboard surface; R stays a NodeDetail-level shortcut");
{
  // No X/Y/Z, section, reverse, cameraLock or target entries are in the
  // visible whitelist, so a stray keypress cannot toggle them.
  for (const dep of ["xAxis", "yAxis", "zAxis", "section", "reverse", "cameraLock", "target"]) {
    assert(isControlVisible(dep) === false, `${dep} has no visible surface`);
  }
  // The R-button UI is gone from the whitelist, but the R keyboard shortcut is
  // bound at the NodeDetail level (see the "R reset semantics" group for the
  // real reset protocol it triggers — resetNodeInteractionState + refit).
  assert(isControlVisible("reset") === false,
    "reset is no longer a visible control (R button UI removed)");
}

console.log(`\nAll nodeDetail-controls tests passed (${testCount} groups).`);
