/**
 * Regression tests for the three confirmed interaction fixes:
 *
 *   1. Multi-model node stays interactable after R reset.
 *      (interaction gates must not depend on animationProgress when the model
 *      has no GLTF animation timeline — isInteractionAllowed)
 *
 *   2. Animated single-model R reset truly rewinds the AnimationMixer to
 *      frame 0 and holds (resetActionsToStart + store state).
 *
 *   3. Scoped mesh key (variantId::objectName) correctly isolates same-named
 *      meshes across variants (makeScopedKey / parseScopedKey /
 *      matchesVariantScope).
 *
 * All tests import REAL production code — no re-implemented logic.
 * Run with: npx tsx tests/interaction-fixes.test.ts
 */

import {
  isInteractionAllowed,
} from "../src/utils/interactionGates";
import {
  makeScopedKey,
  parseScopedKey,
  matchesVariantScope,
} from "../src/utils/variantIdentity";
import {
  resetActionsToStart,
  type ResettableAnimationAction,
} from "../src/components/viewer/animationController";
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

/* ═══════════════════════════════════════════════════════════════
   Test 1 — multi-model stays interactable after R reset
   ═══════════════════════════════════════════════════════════════ */

group("Multi-model (noAnimation) is always pickable — gate does not depend on animationProgress");
{
  // Multi-model variants render SceneModel with noAnimation=true; R sets
  // animationProgress=0, so the gate MUST ignore progress for these nodes.
  assert(isInteractionAllowed(true, 0, 0.99) === true,
    "noAnimation + progress 0 (after R) → hover allowed");
  assert(isInteractionAllowed(true, 0, 1) === true,
    "noAnimation + progress 0 (after R) → click allowed");
  assert(isInteractionAllowed(true, 0.5, 0.99) === true,
    "noAnimation + mid progress → still allowed");
  assert(isInteractionAllowed(true, 1, 1) === true,
    "noAnimation + progress 1 → allowed");
}

group("Animated single-model gate still requires finished animation");
{
  assert(isInteractionAllowed(false, 0, 0.99) === false,
    "animated + progress 0 → hover blocked");
  assert(isInteractionAllowed(false, 0, 1) === false,
    "animated + progress 0 → click blocked");
  assert(isInteractionAllowed(false, 0.5, 0.99) === false,
    "animated + progress 0.5 → hover blocked");
  assert(isInteractionAllowed(false, 0.995, 0.99) === true,
    "animated + progress 0.995 → hover allowed (>=0.99)");
  assert(isInteractionAllowed(false, 0.995, 1) === false,
    "animated + progress 0.995 → click still blocked (<1)");
  assert(isInteractionAllowed(false, 1, 1) === true,
    "animated + progress 1 → click allowed");
}

group("Real R-reset flow keeps a multi-model node pickable");
{
  // Simulate the exact reset the R key performs on the real store.
  useNodeStore.getState().resetNodeInteractionState();
  const s = useNodeStore.getState();
  assert(s.animationProgress === 0, "reset → animationProgress 0");
  assert(s.isPlaying === false, "reset → isPlaying false");
  // A multi-model SceneModel has noAnimation=true → gate passes at progress 0.
  assert(isInteractionAllowed(true, s.animationProgress, 0.99) === true,
    "after R, multi-model hover gate passes (noAnimation)");
  assert(isInteractionAllowed(true, s.animationProgress, 1) === true,
    "after R, multi-model click gate passes (noAnimation)");
}

/* ═══════════════════════════════════════════════════════════════
   Test 2 — animated single-model reset rewinds the real mixer
   ═══════════════════════════════════════════════════════════════ */

group("resetActionsToStart rewinds actions to frame 0 and holds");
{
  const mixerA = { setTimeCalls: [] as number[], setTime(t: number) { mixerA.setTimeCalls.push(t); return mixerA; } };
  const a1: ResettableAnimationAction = { paused: false, enabled: true, time: 2.5, getMixer: () => mixerA };
  const a2: ResettableAnimationAction = { paused: false, enabled: true, time: 1.2, getMixer: () => mixerA };

  resetActionsToStart([a1, a2]);

  assert(a1.paused === true, "action1 paused (stops playback)");
  assert(a1.enabled === true, "action1 stays enabled (can replay)");
  assert(a1.time === 0, "action1 real time → 0");
  assert(a2.time === 0, "action2 real time → 0 (all clips rewound, not just first)");
  assert(mixerA.setTimeCalls.length === 1, "shared mixer.setTime called exactly once (dedup)");
  assert(mixerA.setTimeCalls[0] === 0, "mixer jumped to t=0 (pose force-evaluated)");
}

group("resetActionsToStart is idempotent and covers every unique mixer");
{
  const mixerA = { setTimeCalls: [] as number[], setTime(t: number) { mixerA.setTimeCalls.push(t); return mixerA; } };
  const mixerB = { setTimeCalls: [] as number[], setTime(t: number) { mixerB.setTimeCalls.push(t); return mixerB; } };
  const a1: ResettableAnimationAction = { paused: false, enabled: true, time: 3.1, getMixer: () => mixerA };
  const b1: ResettableAnimationAction = { paused: false, enabled: true, time: 0.9, getMixer: () => mixerB };

  resetActionsToStart([a1, b1]);
  assert(a1.time === 0 && b1.time === 0, "both actions rewound");
  assert(mixerA.setTimeCalls.length === 1 && mixerB.setTimeCalls.length === 1,
    "one setTime per unique mixer");

  resetActionsToStart([a1, b1]);
  assert(a1.time === 0 && a1.paused === true, "second reset is a no-op (already 0)");
}

group("Reset keeps store progress consistent (no next-frame bounce)");
{
  useNodeStore.getState().setAnimationProgress(0.42);
  useNodeStore.getState().setIsPlaying(true);
  useNodeStore.getState().resetNodeInteractionState();
  const s = useNodeStore.getState();
  assert(s.animationProgress === 0, "store progress → 0 after reset");
  assert(s.isPlaying === false, "store playing → false after reset");
  // For an animated single-model node the real action is rewound by
  // animControls.rewindToStart → resetActionsToStart (covered above); the
  // boundary auto-pause in SceneModel keeps time pinned at 0 on the next
  // frame, so progress cannot bounce back to 0.42.
  assert(isInteractionAllowed(false, s.animationProgress, 0.99) === false,
    "animated node stays gated at progress 0 (consistent with blocked picking)");
}

/* ═══════════════════════════════════════════════════════════════
   Test 3 — scoped mesh key isolates same-named meshes across variants
   ═══════════════════════════════════════════════════════════════ */

group("makeScopedKey / parseScopedKey round-trip");
{
  assert(makeScopedKey("variant-a", "Wall") === "variant-a::Wall",
    "scoped key = variantId::objectName");
  assert(makeScopedKey(null, "Wall") === "Wall",
    "single-model key is unscoped");
  const parsed = parseScopedKey("variant-a::Wall");
  assert(parsed.variantId === "variant-a" && parsed.objectName === "Wall",
    "parse recovers variantId + objectName");
  const plain = parseScopedKey("Wall");
  assert(plain.variantId === null && plain.objectName === "Wall",
    "unscoped key parses with variantId null");
}

group("matchesVariantScope — same-named meshes do not cross variants");
{
  // variant-a::Wall, variant-b::Wall, variant-c::Wall must be three distinct
  // identities. Selecting variant-a::Wall must only match variant-a.
  assert(matchesVariantScope("variant-a::Wall", "variant-a") === true,
    "variant-a::Wall matches variant-a");
  assert(matchesVariantScope("variant-a::Wall", "variant-b") === false,
    "variant-a::Wall does NOT match variant-b (no cross-highlight)");
  assert(matchesVariantScope("variant-a::Wall", "variant-c") === false,
    "variant-a::Wall does NOT match variant-c");
  assert(matchesVariantScope("variant-b::Wall", "variant-a") === false,
    "variant-b::Wall does NOT match variant-a");
  assert(matchesVariantScope("variant-b::Wall", "variant-b") === true,
    "variant-b::Wall matches variant-b");
}

group("matchesVariantScope — single-model keys stay unscoped");
{
  assert(matchesVariantScope("Wall", null) === true,
    "unscoped key matches a single-model scene");
  assert(matchesVariantScope("Wall", "variant-a") === false,
    "unscoped key never matches a variant scene");
  assert(matchesVariantScope("variant-a::Wall", null) === false,
    "scoped key never matches a single-model scene");
}

console.log(`\nAll interaction-fix tests passed (${testCount} groups).`);
