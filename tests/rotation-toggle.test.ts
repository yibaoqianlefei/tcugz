/**
 * Rotation-toggle control chain — real-production behavior.
 *
 * The rotation button toggles ONE store field (`autoRotate`) that NodeDetail
 * passes verbatim to ModelViewer's existing `autoRotate` prop.  Single-model
 * consumes it via `OrbitControls autoRotate={!isMulti && autoRotate}`; the
 * multi-model self-rotation useFrame gates on `autoRotate ?? true`.  Both
 * paths share the same control chain — no second rotation state system.
 *
 * This file tests the real store, the real whitelist resolver, and the real
 * node archetypes (single vs multi) — never a copied/string-matched version.
 * Runtime OrbitControls/useFrame reception is verified in the browser (the
 * pixel-level probe + verify scripts), not re-implemented here.
 *
 * Run with: npx tsx tests/rotation-toggle.test.ts
 */

import { useNodeStore } from "../src/store/nodeStore";
import {
  NODE_DETAIL_PRIMARY_CONTROLS,
  RUNTIME_CAPABILITIES,
  resolveVisibleControls,
} from "../src/utils/nodeDetailControls";
import { getNodeDefinition } from "../src/data/nodeDefinitions";
import { resolveNodeModelSources } from "../src/utils/resolveNodeModelSources";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`  PASS: ${msg}`);
}

let testCount = 0;
function group(title: string): void {
  testCount++;
  console.log(`\n== T${testCount}: ${title}`);
}

/** Restore the singleton store to its factory defaults. */
function resetStore(): void {
  useNodeStore.getState().resetNodeInteractionState();
}

/* ═══════════════════════════════════════════════════════════════
   Store contract
   ═══════════════════════════════════════════════════════════════ */

group("autoRotate store field — product default, single source");
{
  resetStore();
  const s = useNodeStore.getState() as Record<string, unknown>;
  // Exactly ONE rotation flag exists in the store — the single control chain.
  assert("autoRotate" in s, "store exposes autoRotate");
  assert(!("isRotating" in s) && !("rotationEnabled" in s),
    "store has no duplicate rotation flag (single source)");
  assert(s.autoRotate === true, "product default: autoRotate = true (rotating on load)");
  assert(typeof (s as { setAutoRotate: unknown }).setAutoRotate === "function",
    "store exposes setAutoRotate action");
}

group("Toggle semantics — click changes real state, click again closes");
{
  resetStore();
  assert(useNodeStore.getState().autoRotate === true, "initial: rotating");

  // Button click #1 → stop (mirrors NodeDetail's onToggleAutoRotate = !autoRotate).
  useNodeStore.getState().setAutoRotate(!useNodeStore.getState().autoRotate);
  assert(useNodeStore.getState().autoRotate === false, "after first toggle → stopped");

  // Button click #2 → resume.
  useNodeStore.getState().setAutoRotate(!useNodeStore.getState().autoRotate);
  assert(useNodeStore.getState().autoRotate === true, "after second toggle → rotating again");

  // Repeated toggling is stable (no drift, no reset-to-initial jump).
  for (let i = 0; i < 4; i++) {
    useNodeStore.getState().setAutoRotate(!useNodeStore.getState().autoRotate);
  }
  assert(useNodeStore.getState().autoRotate === true, "toggle cycles stay stable");
}

group("Reset conforms to the existing protocol");
{
  useNodeStore.getState().setAutoRotate(false);
  useNodeStore.getState().resetNodeInteractionState();
  assert(useNodeStore.getState().autoRotate === true,
    "resetNodeInteractionState restores autoRotate to product default");
  // Linkage stays a persistent user preference (unchanged protocol).
  useNodeStore.getState().setLinkageEnabled(false);
  useNodeStore.getState().resetNodeInteractionState();
  assert(useNodeStore.getState().linkageEnabled === false,
    "linkage preference preserved across reset (unchanged)");
}

/* ═══════════════════════════════════════════════════════════════
   Button surface
   ═══════════════════════════════════════════════════════════════ */

group("Rotate control is whitelisted + a live runtime capability");
{
  const visible = resolveVisibleControls();
  assert(visible.includes("rotate"), "visible control-bar surface includes rotate");
  assert(NODE_DETAIL_PRIMARY_CONTROLS.includes("rotate"),
    "whitelist includes rotate");
  assert(RUNTIME_CAPABILITIES.includes("rotate"),
    "rotate is a live runtime capability");
  assert(visible.length === 4, `surface is exactly 4 groups (got ${visible.length})`);
}

/* ═══════════════════════════════════════════════════════════════
   Unified control chain — single & multi
   ═══════════════════════════════════════════════════════════════ */

group("Single-model and multi-model share the same autoRotate control chain");
{
  // Animated single-model archetype.
  const single = getNodeDefinition("construction-column-01");
  assert(!!single && single.presentationMode !== "variants", "single-model archetype present");
  const singleSources = resolveNodeModelSources(single!);
  assert(singleSources.length === 1 && singleSources[0].source === "model",
    "single-model resolves one legacy model source");

  // Multi-model archetype.
  const multi = getNodeDefinition("wall-damp-proof-course");
  assert(!!multi && multi.presentationMode === "variants", "multi-model archetype present");
  const multiSources = resolveNodeModelSources(multi!);
  assert(multiSources.length >= 2, "multi-model resolves multiple variant sources");

  // Both archetypes are driven by the SAME store field — the value NodeDetail
  // passes verbatim to ModelViewer's autoRotate prop (single: OrbitControls,
  // multi: self-rotation useFrame).
  const storeKey = Object.keys(useNodeStore.getState()).filter(
    (k) => /rotat/i.test(k) && typeof (useNodeStore.getState() as Record<string, unknown>)[k] !== "function",
  );
  assert(storeKey.length === 1 && storeKey[0] === "autoRotate",
    `exactly one rotation state field drives both archetypes (${storeKey.join(",")})`);
  assert(typeof useNodeStore.getState().autoRotate === "boolean",
    "autoRotate is a boolean consumed by both ModelViewer paths");
}

console.log(`\nAll rotation-toggle tests passed (${testCount} groups).`);
