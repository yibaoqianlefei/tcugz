/**
 * Phase 2 — Test group 3: real-production behavior of the three archetypes.
 *
 *   - construction-column-01 : animated single-model
 *   - cast-ribbed-floor-01   : static (noAnimation) single-model
 *   - wall-damp-proof-course : multi-model (variants)
 *
 * Every assertion imports REAL production code: the node definition,
 * resolveNodeModelSources, isInteractionAllowed, resetActionsToStart,
 * scoped-key helpers, resolveComponentKnowledge, and the real store.
 * No viewer logic is re-implemented here.  WebGL/pixel-level behavior is NOT
 * claimed by this test (it was browser-verified in Phase 1); this protects
 * the real state and identity protocol.
 *
 * Run with: npx tsx tests/node-behavior-archetypes.test.ts
 */

import { getNodeDefinition } from "../src/data/nodeDefinitions";
import { resolveNodeModelSources } from "../src/utils/resolveNodeModelSources";
import { isInteractionAllowed } from "../src/utils/interactionGates";
import {
  resetActionsToStart,
  type ResettableAnimationAction,
} from "../src/components/viewer/animationController";
import {
  makeScopedKey,
  parseScopedKey,
  matchesVariantScope,
} from "../src/utils/variantIdentity";
import { resolveComponentKnowledge } from "../src/utils/resolveComponentKnowledge";
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
   Archetype 1 — animated single-model
   ═══════════════════════════════════════════════════════════════ */

group("construction-column-01 — animated single-model");
{
  const node = getNodeDefinition("construction-column-01");
  assert(!!node, "node definition readable");
  assert(node?.status === "available", "node is available");
  assert(node?.presentationMode !== "variants", "not a variants node");
  assert(!!node?.model?.path, "model path present");
  assert(!node.model!.noAnimation, "model is animated (noAnimation falsy)");

  const sources = resolveNodeModelSources(node!);
  assert(sources.length === 1 && sources[0].source === "model",
    "resolves to exactly one legacy model source");

  // Interaction gate follows the real animation protocol.
  assert(isInteractionAllowed(false, 0, 0.99) === false,
    "animated node at progress 0 → picking gated");
  assert(isInteractionAllowed(false, 1, 1) === true,
    "animated node finished → picking allowed");

  // R reset must rewind ALL actions to frame 0 and hold (real helper).
  const mixer = { setTimeCalls: [] as number[], setTime(t: number) { mixer.setTimeCalls.push(t); return mixer; } };
  const a1: ResettableAnimationAction = { paused: false, enabled: true, time: 1.6, getMixer: () => mixer };
  const a2: ResettableAnimationAction = { paused: false, enabled: true, time: 2.1, getMixer: () => mixer };
  resetActionsToStart([a1, a2]);
  assert(a1.time === 0 && a2.time === 0, "all actions rewound to time 0");
  assert(a1.paused === true && a2.paused === true, "actions paused (no self-play)");
  assert(a1.enabled === true, "actions stay enabled (can replay)");
  assert(mixer.setTimeCalls.length === 1 && mixer.setTimeCalls[0] === 0,
    "shared mixer jumped to t=0 exactly once");

  // Real store reset state.
  useNodeStore.getState().resetNodeInteractionState();
  const s = useNodeStore.getState();
  assert(s.animationProgress === 0, "store progress → 0 after reset");
  assert(s.isPlaying === false, "store playing → false after reset");
}

/* ═══════════════════════════════════════════════════════════════
   Archetype 2 — static single-model
   ═══════════════════════════════════════════════════════════════ */

group("cast-ribbed-floor-01 — static (noAnimation) single-model");
{
  const node = getNodeDefinition("cast-ribbed-floor-01");
  assert(!!node, "node definition readable");
  assert(node?.status === "available", "node is available");
  assert(node?.presentationMode !== "variants", "not a variants node");
  assert(!!node?.model?.path, "model path present");
  assert(node.model!.noAnimation === true, "model is declared noAnimation");

  const sources = resolveNodeModelSources(node!);
  assert(sources.length === 1 && sources[0].source === "model",
    "resolves to exactly one legacy model source");

  // NoAnimation nodes are ALWAYS interactable, even at progress 0 (after R).
  assert(isInteractionAllowed(true, 0, 0.99) === true,
    "noAnimation + progress 0 → hover allowed (not gated by animation)");
  assert(isInteractionAllowed(true, 0, 1) === true,
    "noAnimation + progress 0 → click allowed");

  // Real reset keeps it interactable, repeatedly.
  for (let i = 0; i < 3; i++) {
    useNodeStore.getState().resetNodeInteractionState();
    const p = useNodeStore.getState().animationProgress;
    assert(isInteractionAllowed(true, p, 0.99) === true,
      `reset #${i + 1} keeps noAnimation node interactable (progress ${p})`);
  }
}

/* ═══════════════════════════════════════════════════════════════
   Archetype 3 — multi-model
   ═══════════════════════════════════════════════════════════════ */

group("wall-damp-proof-course — multi-model (variants)");
{
  const node = getNodeDefinition("wall-damp-proof-course");
  assert(!!node, "node definition readable");
  assert(node?.status === "available", "node is available");
  assert(node?.presentationMode === "variants", "node is a variants node");
  assert(node!.variants && node!.variants!.length >= 2, "has multiple variants");

  const variants = node!.variants!;
  const ids = variants.map((v) => v.id);
  assert(new Set(ids).size === ids.length, "variant ids unique within node");
  for (const v of variants) {
    assert(!!v.model?.path, `[${v.id}] variant model path present`);
  }

  const sources = resolveNodeModelSources(node!);
  assert(sources.length === variants.length, "resolves to one source per variant");
  for (const s of sources) assert(s.source === "variants", `source "${s.id}" is variants kind`);

  // Multi-model variants render with noAnimation → interactivity never gated
  // on animationProgress, so R (progress 0) keeps picking allowed.
  for (let i = 0; i < 3; i++) {
    useNodeStore.getState().resetNodeInteractionState();
    const p = useNodeStore.getState().animationProgress;
    assert(isInteractionAllowed(true, p, 0.99) === true,
      `reset #${i + 1} keeps multi-model pickable (progress ${p})`);
  }

  // Scoped identity round-trip + isolation.
  const [a, b] = [ids[0], ids[1]];
  const keyA = makeScopedKey(a, "Wall");
  assert(parseScopedKey(keyA).variantId === a, "scoped key round-trips");
  assert(matchesVariantScope(keyA, a) === true, "keyA matches variant A");
  assert(matchesVariantScope(keyA, b) === false, "keyA does NOT match variant B");

  // selected identity resolves to the correct variant knowledge.
  const first = variants[0];
  const knowledge = first.componentKnowledge ?? [];
  if (knowledge.length > 0) {
    const k = knowledge[0];
    const resolved = resolveComponentKnowledge({
      node: node!,
      selectedObject: makeScopedKey(first.id, k.objectName),
      selectedVariantId: first.id,
    });
    assert(resolved?.variantId === first.id, `selected ${first.id}::${k.objectName} → variant ${first.id}`);
    assert(resolved?.component === k, "resolved to the exact knowledge entry");
  }

  // Clearing selection restores the identity state via the real reset action.
  useNodeStore.getState().setSelectedObject(keyA);
  assert(useNodeStore.getState().selectedObject === keyA, "selection set");
  useNodeStore.getState().resetNodeInteractionState();
  assert(useNodeStore.getState().selectedObject === null, "reset clears selected identity");
}

console.log(`\nAll node-behavior-archetypes tests passed (${testCount} groups).`);
