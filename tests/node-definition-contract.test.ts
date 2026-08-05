/**
 * Phase 2 — Test group 1: node definition protocol contract.
 *
 * Verifies every formal node conforms to the REAL node configuration
 * protocol.  Imports the actual single source of truth (`nodeDefinitions`)
 * and the real production readers/types — never a copied node list.
 *
 * Rules that must keep passing as the node set grows (no hard-coded count):
 *   - ids non-empty, unique, lowercase-dash format
 *   - titles present
 *   - the compat layer (`nodesIndex`) is a pure re-export, not a 2nd dataset
 *   - every node is reachable through getNodeDefinition()
 *   - single-model config must not conflict with multi-model config
 *   - multi-model variants have stable, unique ids and valid model paths
 *   - scoped mesh identity round-trips and isolates same-named meshes
 *   - component knowledge structure is valid
 *
 * Run with: npx tsx tests/node-definition-contract.test.ts
 */

import {
  nodeDefinitions,
  getNodeDefinition,
  type NodeDefinition,
} from "../src/data/nodeDefinitions";
import { nodesIndex } from "../src/data/nodesIndex";
import { resolveNodeModelSources } from "../src/utils/resolveNodeModelSources";
import {
  makeScopedKey,
  parseScopedKey,
  matchesVariantScope,
} from "../src/utils/variantIdentity";
import { resolveComponentKnowledge } from "../src/utils/resolveComponentKnowledge";

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

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/* ═══════════════════════════════════════════════════════════════
   Common protocol
   ═══════════════════════════════════════════════════════════════ */

group("All nodes — id/title/status/format protocol");
{
  assert(nodeDefinitions.length >= 1, "node list is non-empty");

  const seen = new Set<string>();
  for (const node of nodeDefinitions) {
    assert(node.id.length > 0, `[${node.id ?? "?"}] id non-empty`);
    assert(ID_PATTERN.test(node.id), `[${node.id}] id matches lowercase-dash format`);
    assert(!seen.has(node.id), `[${node.id}] id unique`);
    seen.add(node.id);
    assert(!!node.title && node.title.trim().length > 0, `[${node.id}] title non-empty`);
    assert(node.status === "available" || node.status === "development",
      `[${node.id}] status is valid (${node.status})`);
  }
}

group("Every node is reachable through getNodeDefinition (single source)");
{
  for (const node of nodeDefinitions) {
    const back = getNodeDefinition(node.id);
    assert(back === node, `[${node.id}] getNodeDefinition returns the same definition`);
  }
}

group("Compat layer nodesIndex is a pure re-export, not a second dataset");
{
  // nodesIndex re-exports nodeDefinitions directly — same array, no duplicates.
  assert(nodesIndex === nodeDefinitions, "nodesIndex === nodeDefinitions (no 2nd dataset)");
  const viaIndex = new Set((nodesIndex as NodeDefinition[]).map((n) => n.id));
  const viaSource = new Set(nodeDefinitions.map((n) => n.id));
  assert(viaIndex.size === viaSource.size && [...viaIndex].every((id) => viaSource.has(id)),
    "compat layer exposes exactly the same id set");
}

/* ═══════════════════════════════════════════════════════════════
   Single-model protocol
   ═══════════════════════════════════════════════════════════════ */

group("Single-model protocol — no conflicting multi-model config");
{
  const single = nodeDefinitions.filter((n) => n.presentationMode !== "variants");
  assert(single.length > 0, "at least one single-model node exists");

  for (const node of single) {
    // Available single-model nodes MUST declare a model.
    if (node.status === "available") {
      assert(!!node.model?.path && node.model.path.trim().length > 0,
        `[${node.id}] model.path non-empty`);
      assert(node.model!.scale > 0, `[${node.id}] model.scale > 0`);
      assert(!node.variants || node.variants.length === 0,
        `[${node.id}] single-model node must not carry variants`);
      assert(node.presentationMode !== "variants",
        `[${node.id}] not a variants node`);
    }
    // noAnimation is optional; if present it must be a boolean.
    if (node.model?.noAnimation !== undefined) {
      assert(typeof node.model.noAnimation === "boolean",
        `[${node.id}] model.noAnimation is boolean`);
    }
    // nonInteractive optional array of strings.
    if (node.model?.nonInteractive !== undefined) {
      assert(Array.isArray(node.model.nonInteractive),
        `[${node.id}] model.nonInteractive is array`);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   Multi-model protocol
   ═══════════════════════════════════════════════════════════════ */

group("Multi-model protocol — variants valid and scoped");
{
  const multi = nodeDefinitions.filter((n) => n.presentationMode === "variants");
  assert(multi.length >= 1, "at least one variants node exists");

  for (const node of multi) {
    assert(Array.isArray(node.variants) && node.variants.length > 0,
      `[${node.id}] variants non-empty`);
    // A variants node must not ALSO declare a conflicting single-model path.
    assert(!node.model?.path, `[${node.id}] variants node must not have a top-level model.path`);

    const variantIds = new Set<string>();
    for (const v of node.variants!) {
      assert(!!v.id && v.id.trim().length > 0, `[${node.id}] variant id non-empty`);
      assert(!variantIds.has(v.id), `[${node.id}] variant id "${v.id}" unique within node`);
      variantIds.add(v.id);
      assert(!!v.label && v.label.trim().length > 0, `[${node.id}] variant "${v.id}" label non-empty`);
      assert(!!v.title && v.title.trim().length > 0, `[${node.id}] variant "${v.id}" title non-empty`);
      assert(!!v.model?.path && v.model.path.trim().length > 0,
        `[${node.id}] variant "${v.id}" model.path non-empty`);
      if (v.model?.scale !== undefined) assert(v.model.scale > 0,
        `[${node.id}] variant "${v.id}" scale > 0`);
    }

    // resolveNodeModelSources must return one source per variant.
    const sources = resolveNodeModelSources(node);
    assert(sources.length === node.variants!.length,
      `[${node.id}] resolveNodeModelSources returns ${node.variants!.length} sources`);
    for (const s of sources) {
      assert(variantIds.has(s.id), `[${node.id}] resolved source id "${s.id}" is a declared variant`);
      assert(s.source === "variants", `[${node.id}] source kind is "variants"`);
    }
  }
}

group("Scoped mesh identity — round-trip and cross-variant isolation");
{
  const multi = nodeDefinitions.find((n) => n.presentationMode === "variants");
  const a = multi?.variants?.[0]?.id ?? "variant-a";
  const b = multi?.variants?.[1]?.id ?? "variant-b";

  const keyA = makeScopedKey(a, "Wall");
  const keyB = makeScopedKey(b, "Wall");
  assert(keyA !== keyB, "same mesh name yields different scoped keys per variant");

  const parsedA = parseScopedKey(keyA);
  assert(parsedA.variantId === a && parsedA.objectName === "Wall", "scoped key round-trips (A)");
  assert(matchesVariantScope(keyA, a) === true, "keyA matches variant A");
  assert(matchesVariantScope(keyA, b) === false, "keyA does NOT match variant B");
  assert(matchesVariantScope(keyB, b) === true, "keyB matches variant B");
  assert(matchesVariantScope(keyB, a) === false, "keyB does NOT match variant A");
}

group("Component knowledge structure — valid per variant");
{
  for (const node of nodeDefinitions) {
    if (node.presentationMode !== "variants") continue;
    for (const v of node.variants ?? []) {
      const knowledge = v.componentKnowledge ?? [];
      const objectNames = new Set<string>();
      for (const k of knowledge) {
        assert(!!k.objectName && k.objectName.trim().length > 0,
          `[${node.id}/${v.id}] knowledge objectName non-empty`);
        assert(!objectNames.has(k.objectName),
          `[${node.id}/${v.id}] knowledge objectName unique ("${k.objectName}")`);
        objectNames.add(k.objectName);
        assert(!!k.title && k.title.trim().length > 0,
          `[${node.id}/${v.id}] knowledge "${k.objectName}" title non-empty`);
        for (const img of k.images ?? []) {
          assert(!!img.src && img.src.trim().length > 0,
            `[${node.id}/${v.id}] knowledge image src non-empty`);
        }
      }

      // resolveComponentKnowledge must be able to map a scoped key into this
      // variant's knowledge (exact match at least).
      if (knowledge.length > 0) {
        const first = knowledge[0];
        const resolved = resolveComponentKnowledge({
          node,
          selectedObject: makeScopedKey(v.id, first.objectName),
          selectedVariantId: v.id,
        });
        assert(resolved?.variantId === v.id,
          `[${node.id}/${v.id}] scoped key resolves to variant ${v.id}`);
        assert(resolved?.objectName === first.objectName,
          `[${node.id}/${v.id}] scoped key resolves objectName ${first.objectName}`);
      }
    }
  }
}

console.log(`\nAll node-definition-contract tests passed (${testCount} groups).`);
