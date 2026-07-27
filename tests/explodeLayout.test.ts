/**
 * Phase 5 — pure-function tests for explode layout math.
 * Run with: npx tsx tests/explodeLayout.test.ts
 */

import { clampExplodeProgress, computeLocalExplodeProgress, computeExplodedPosition, resolveVariantExplodeConfig, findExplodeComponent } from "../src/utils/explodeLayout";
import type { NodeDefinition } from "../src/data/nodeDefinitions";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`  PASS: ${msg}`);
}

function assertApprox(a: number, b: number, eps: number, msg: string): void {
  if (Math.abs(a - b) > eps) throw new Error(`FAIL: ${msg} (expected≈${b}, got ${a})`);
  console.log(`  PASS: ${msg}`);
}

/* ═══════════════════════════════════════════════════════════════
   clampExplodeProgress
   ═══════════════════════════════════════════════════════════════ */

assert(clampExplodeProgress(0) === 0, "clamp: 0 → 0");
assert(clampExplodeProgress(1) === 1, "clamp: 1 → 1");
assert(clampExplodeProgress(0.5) === 0.5, "clamp: 0.5 → 0.5");
assert(clampExplodeProgress(-0.1) === 0, "clamp: -0.1 → 0");
assert(clampExplodeProgress(1.5) === 1, "clamp: 1.5 → 1");
assert(clampExplodeProgress(NaN) === 0, "clamp: NaN → 0");
assert(clampExplodeProgress(Infinity) === 0, "clamp: Infinity → 0");
assert(clampExplodeProgress(-Infinity) === 0, "clamp: -Infinity → 0");

/* ═══════════════════════════════════════════════════════════════
   computeLocalExplodeProgress
   ═══════════════════════════════════════════════════════════════ */

// Default start/end = 0/1
assert(computeLocalExplodeProgress(0) === 0, "local: progress=0 → 0");
assert(computeLocalExplodeProgress(1) === 1, "local: progress=1 → 1");
assert(computeLocalExplodeProgress(0.5) === 0.5, "local: progress=0.5 → 0.5");

// Progress before start
assert(computeLocalExplodeProgress(0.1, 0.3, 0.8) === 0, "local: before start → 0");

// Progress after end
assert(computeLocalExplodeProgress(0.9, 0.3, 0.8) === 1, "local: after end → 1");

// Progress in middle of window
assertApprox(computeLocalExplodeProgress(0.5, 0.2, 0.8), 0.5, 1e-12, "local: midpoint 0.2-0.8 ≈ 0.5");
assertApprox(computeLocalExplodeProgress(0.35, 0.3, 0.5), 0.25, 1e-12, "local: 0.35 in 0.3-0.5 ≈ 0.25");

// Exotic inputs safe
assert(computeLocalExplodeProgress(NaN) === 0, "local: NaN progress → 0");
assertApprox(computeLocalExplodeProgress(0.5, NaN, 0.8), 0.625, 1e-12, "local: NaN start → default 0");
assertApprox(computeLocalExplodeProgress(0.5, 0.2, NaN), 0.375, 1e-12, "local: NaN end → default 1");

// start === end: threshold
assert(computeLocalExplodeProgress(0.49, 0.5, 0.5) === 0, "local: threshold, below → 0");
assert(computeLocalExplodeProgress(0.5, 0.5, 0.5) === 1, "local: threshold, at → 1");
assert(computeLocalExplodeProgress(0.51, 0.5, 0.5) === 1, "local: threshold, above → 1");
assert(computeLocalExplodeProgress(0, 0, 1) === 0, "local: default threshold: 0→0");

// start > end: swapped
assertApprox(computeLocalExplodeProgress(0.5, 0.8, 0.2), 0.5, 1e-12, "local: start>end swapped, 0.5→0.5");
assert(computeLocalExplodeProgress(0.1, 0.8, 0.2) === 0, "local: start>end swapped, before");
assert(computeLocalExplodeProgress(0.9, 0.8, 0.2) === 1, "local: start>end swapped, after");

// Negative start/end clamped
assertApprox(computeLocalExplodeProgress(0.3, -0.5, 2.0), 0.3, 1e-12, "local: out-of-range clamped to 0-1");

/* ═══════════════════════════════════════════════════════════════
   computeExplodedPosition
   ═══════════════════════════════════════════════════════════════ */

function pos(x: number, y: number, z: number): readonly [number, number, number] {
  return [x, y, z];
}

// progress=0 → basePosition
{
  const r = computeExplodedPosition({ basePosition: pos(1, 2, 3), direction: pos(0, 1, 0), distance: 2, progress: 0 });
  assert(r[0] === 1 && r[1] === 2 && r[2] === 3, "pos: progress=0 → basePosition");
}

// progress=1 → full displacement
{
  const r = computeExplodedPosition({ basePosition: pos(0, 0, 0), direction: pos(0, 1, 0), distance: 2, progress: 1 });
  assert(r[0] === 0 && r[1] === 2 && r[2] === 0, "pos: progress=1 → full Y displacement");
}

// progress=0.5 → half displacement
{
  const r = computeExplodedPosition({ basePosition: pos(0, 0, 0), direction: pos(0, 2, 0), distance: 2, progress: 0.5 });
  assert(r[0] === 0 && r[1] === 1 && r[2] === 0, "pos: progress=0.5 → half displacement");
}

// direction normalized (non-unit input)
{
  const r = computeExplodedPosition({ basePosition: pos(0, 0, 0), direction: pos(0, 3, 0), distance: 1, progress: 1 });
  assert(r[0] === 0 && r[1] === 1 && r[2] === 0, "pos: non-unit direction normalized");
}

// zero-vector direction → no move
{
  const r = computeExplodedPosition({ basePosition: pos(5, 5, 5), direction: pos(0, 0, 0), distance: 10, progress: 1 });
  assert(r[0] === 5 && r[1] === 5 && r[2] === 5, "pos: zero direction → no move");
}

// distance=0 → no move
{
  const r = computeExplodedPosition({ basePosition: pos(1, 1, 1), direction: pos(1, 0, 0), distance: 0, progress: 1 });
  assert(r[0] === 1 && r[1] === 1 && r[2] === 1, "pos: distance=0 → no move");
}

// NaN distance → no move
{
  const r = computeExplodedPosition({ basePosition: pos(1, 2, 3), direction: pos(0, 1, 0), distance: NaN, progress: 1 });
  assert(r[0] === 1 && r[1] === 2 && r[2] === 3, "pos: NaN distance → no move");
}

// Infinity distance → no move
{
  const r = computeExplodedPosition({ basePosition: pos(1, 2, 3), direction: pos(0, 1, 0), distance: Infinity, progress: 1 });
  assert(r[0] === 1 && r[1] === 2 && r[2] === 3, "pos: Infinity distance → no move");
}

// negative distance reverses direction
{
  const r = computeExplodedPosition({ basePosition: pos(0, 0, 0), direction: pos(0, 1, 0), distance: -3, progress: 1 });
  assert(r[1] === -3, "pos: negative distance reverses direction → y=-3");
}

// non-finite progress clamped
{
  const r = computeExplodedPosition({ basePosition: pos(0, 0, 0), direction: pos(1, 0, 0), distance: 5, progress: NaN, start: 0, end: 1 });
  assert(r[0] === 0, "pos: NaN progress → no move");
}

// basePosition not modified
{
  const bp: readonly [number, number, number] = [10, 20, 30];
  computeExplodedPosition({ basePosition: bp, direction: pos(0, 1, 0), distance: 5, progress: 1 });
  assert(bp[0] === 10 && bp[1] === 20 && bp[2] === 30, "pos: basePosition not mutated");
}

// direction input not modified
{
  const d: readonly [number, number, number] = [0, 1, 0];
  computeExplodedPosition({ basePosition: pos(0, 0, 0), direction: d, distance: 1, progress: 1 });
  assert(d[0] === 0 && d[1] === 1 && d[2] === 0, "pos: direction input not mutated");
}

// 0→1→0 round-trip returns base exactly
{
  const bp = pos(3, 4, 5);
  computeExplodedPosition({ basePosition: bp, direction: pos(0, 1, 0), distance: 5, progress: 1 });
  const r = computeExplodedPosition({ basePosition: bp, direction: pos(0, 1, 0), distance: 5, progress: 0 });
  assert(r[0] === 3 && r[1] === 4 && r[2] === 5, "pos: 1→0 round-trip returns base");
}

// multiple calls produce identical results
{
  const bp = pos(0, 0, 0);
  const d = pos(0, 1, 0);
  const r1 = computeExplodedPosition({ basePosition: bp, direction: d, distance: 3, progress: 0.7 });
  const r2 = computeExplodedPosition({ basePosition: bp, direction: d, distance: 3, progress: 0.7 });
  assert(r1[0] === r2[0] && r1[1] === r2[1] && r1[2] === r2[2], "pos: same inputs → same outputs");
  assert(r1 !== r2, "pos: each call returns new array");
}

// start/end window respected
{
  const r = computeExplodedPosition({ basePosition: pos(0, 0, 0), direction: pos(0, 1, 0), distance: 4, progress: 0.5, start: 0.4, end: 0.6 });
  assertApprox(r[1], 2, 1e-12, "pos: start 0.4 end 0.6, progress 0.5 → local=0.5 → y=2");
}

// progress before start → no move
{
  const r = computeExplodedPosition({ basePosition: pos(1, 1, 1), direction: pos(1, 0, 0), distance: 5, progress: 0.2, start: 0.5, end: 0.8 });
  assert(r[0] === 1, "pos: before start window → no move");
}

// X/Z direction, Y remains 0
{
  const r = computeExplodedPosition({ basePosition: pos(0, 0, 0), direction: pos(1, 0, 1), distance: 2, progress: 1 });
  assertApprox(r[1], 0, 1e-12, "pos: XZ direction → Y stays 0");
}

// diagonal direction
{
  const r = computeExplodedPosition({ basePosition: pos(0, 0, 0), direction: pos(0.3, 0.8, 0), distance: 2, progress: 1 });
  assertApprox(r[0], 0.702, 0.01, "pos: diagonal X ≈ 0.702");
  assertApprox(r[1], 1.873, 0.01, "pos: diagonal Y ≈ 1.873");
}

/* ═══════════════════════════════════════════════════════════════
   resolveVariantExplodeConfig
   ═══════════════════════════════════════════════════════════════ */

function makeNode(overrides: Partial<NodeDefinition> = {}): NodeDefinition {
  return {
    id: "test", title: "T", description: "", category: "墙", thumbnail: null,
    status: "available", presentationMode: "variants",
    variants: [
      { id: "a", label: "A", title: "AA", model: { path: "/a.glb" },
        explode: { enabled: true, components: [
          { objectName: "mesh-01", direction: [0, 1, 0], distance: 2 },
          { objectName: "mesh-02", direction: [1, 0, 0], distance: 1, aliases: ["alt-02"] },
        ]} },
      { id: "b", label: "B", title: "BB", model: { path: "/b.glb" },
        explode: { enabled: true, components: [
          { objectName: "mesh-b1", direction: [0, -1, 0], distance: 1.5 },
        ]} },
    ],
    ...overrides,
  } as NodeDefinition;
}

// Resolve A
{
  const r = resolveVariantExplodeConfig({ node: makeNode(), variantId: "a" });
  assert(r.enabled === true, "resolve: A enabled");
  assert(r.variantId === "a", "resolve: A variantId");
  assert(r.components.length === 2, "resolve: A has 2 components");
  assert(r.components[0].objectName === "mesh-01", "resolve: A component[0] name");
}

// Resolve B
{
  const r = resolveVariantExplodeConfig({ node: makeNode(), variantId: "b" });
  assert(r.enabled === true, "resolve: B enabled");
  assert(r.variantId === "b", "resolve: B variantId");
  assert(r.components.length === 1, "resolve: B has 1 component");
}

// A does not read B's components
{
  const r = resolveVariantExplodeConfig({ node: makeNode(), variantId: "a" });
  assert(r.components.every(c => c.objectName !== "mesh-b1"), "resolve: A does not include B-only component");
}

// B does not read A's components
{
  const r = resolveVariantExplodeConfig({ node: makeNode(), variantId: "b" });
  assert(r.components.length === 1, "resolve: B only has its own component");
}

// Non-existent variant → disabled
{
  const r = resolveVariantExplodeConfig({ node: makeNode(), variantId: "nonexistent" });
  assert(r.enabled === false, "resolve: nonexistent variant → disabled");
}

// null variantId → disabled
{
  const r = resolveVariantExplodeConfig({ node: makeNode(), variantId: null });
  assert(r.enabled === false, "resolve: null variantId → disabled");
}

// Normal node → disabled
{
  const normal: NodeDefinition = { id: "n", title: "N", description: "", category: "墙", thumbnail: null, status: "available", model: { path: "/m.glb", scale: 2 } } as NodeDefinition;
  const r = resolveVariantExplodeConfig({ node: normal, variantId: "a" });
  assert(r.enabled === false, "resolve: normal node → disabled");
}

// Missing explode config → disabled
{
  const node = makeNode({ variants: [{ id: "a", label: "A", title: "AA", model: { path: "/a.glb" } }] });
  const r = resolveVariantExplodeConfig({ node, variantId: "a" });
  assert(r.enabled === false, "resolve: missing explode → disabled");
}

// enabled=false → disabled
{
  const node = makeNode({ variants: [{ id: "a", label: "A", title: "AA", model: { path: "/a.glb" }, explode: { enabled: false, components: [] } }] });
  const r = resolveVariantExplodeConfig({ node, variantId: "a" });
  assert(r.enabled === false, "resolve: enabled=false → disabled");
}

// Single illegal component doesn't crash resolution
{
  const node = makeNode({
    variants: [{ id: "a", label: "A", title: "AA", model: { path: "/a.glb" },
      explode: { enabled: true, components: [
        { objectName: "ok", direction: [0, 1, 0], distance: 1 },
      ]} },
    ],
  });
  const r = resolveVariantExplodeConfig({ node, variantId: "a" });
  assert(r.enabled === true, "resolve: single valid component works");
}

// Default start/end
{
  const r = resolveVariantExplodeConfig({ node: makeNode(), variantId: "a" });
  assert(r.components[0].start === 0, "resolve: default start=0");
  assert(r.components[0].end === 1, "resolve: default end=1");
}

// Source config not mutated
{
  const node = makeNode();
  const origLen = node.variants![0].explode!.components.length;
  resolveVariantExplodeConfig({ node, variantId: "a" });
  assert(node.variants![0].explode!.components.length === origLen, "resolve: source config not mutated");
}

/* ═══════════════════════════════════════════════════════════════
   findExplodeComponent
   ═══════════════════════════════════════════════════════════════ */

// Exact match
{
  const r = resolveVariantExplodeConfig({ node: makeNode(), variantId: "a" });
  const c = findExplodeComponent(r, "mesh-01");
  assert(c !== null, "find: exact match returns component");
  assert(c!.objectName === "mesh-01", "find: correct name");
}

// No match → null
{
  const r = resolveVariantExplodeConfig({ node: makeNode(), variantId: "a" });
  const c = findExplodeComponent(r, "nonexistent");
  assert(c === null, "find: no match → null");
}

// Disabled config → null
{
  const r = resolveVariantExplodeConfig({ node: makeNode(), variantId: null });
  const c = findExplodeComponent(r, "mesh-01");
  assert(c === null, "find: disabled config → null");
}

// Empty objectName → null
{
  const r = resolveVariantExplodeConfig({ node: makeNode(), variantId: "a" });
  const c = findExplodeComponent(r, "");
  assert(c === null, "find: empty objectName → null");
}

console.log("\nAll explode layout tests passed.");
