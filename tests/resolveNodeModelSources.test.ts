/**
 * Pure-logic tests for resolveNodeModelSources.
 * Run with: npx tsx tests/resolveNodeModelSources.test.ts
 */
import { resolveNodeModelSources } from "../src/utils/resolveNodeModelSources";
import { computeMultiModelLayout } from "../src/utils/layoutModels";
import type { NodeDefinition } from "../src/data/nodeDefinitions";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`  PASS: ${msg}`);
}

function makeNode(overrides: Partial<NodeDefinition> = {}): NodeDefinition {
  return {
    id: "test-node",
    title: "Test",
    description: "Test node",
    category: "Test",
    thumbnail: null,
    status: "available",
    ...overrides,
  } as NodeDefinition;
}

/* ── 1. Single model (legacy) ── */
{
  const result = resolveNodeModelSources(makeNode({
    model: { path: "/models/a.glb", scale: 2.5 },
  }));
  assert(result.length === 1, "single model returns length 1");
  assert(result[0].id === "test-node", "id = node id");
  assert(result[0].src === "/models/a.glb", "src correct");
  assert(result[0].scale === 2.5, "scale correct");
  assert(result[0].source === "model", "source = model");
}

/* ── 2. Multi-model via variants ── */
{
  const result = resolveNodeModelSources(makeNode({
    presentationMode: "variants",
    variants: [
      { id: "a", label: "A", title: "A", model: { path: "/a.glb", scale: 2 } },
      { id: "b", label: "B", title: "B", model: { path: "/b.glb" } },
      { id: "c", label: "C", title: "C", model: { path: "/c.glb", scale: 2.5 } },
    ],
  }));
  assert(result.length === 3, "variants returns 3");
  assert(result[0].id === "a", "first id = a");
  assert(result[1].id === "b", "second id = b");
  assert(result[2].id === "c", "third id = c");
  assert(result[0].scale === 2, "scale from variant");
  assert(result[1].scale === 1, "default scale = 1");
  assert(result[0].source === "variants", "source = variants");
}

/* ── 3. Normal node with variants but not presentationMode — legacy wins ── */
{
  const result = resolveNodeModelSources(makeNode({
    model: { path: "/legacy.glb", scale: 2 },
    variants: [{ id: "a", label: "A", title: "A", model: { path: "/a.glb" } }],
  }));
  assert(result.length === 1, "normal node ignores variants");
  assert(result[0].src === "/legacy.glb", "uses legacy model");
}

/* ── 4. Empty config ── */
{
  const result = resolveNodeModelSources(makeNode());
  assert(result.length === 0, "empty config returns empty");
}

/* ── 5. Variants with invalid entries filtered ── */
{
  const result = resolveNodeModelSources(makeNode({
    presentationMode: "variants",
    variants: [
      { id: "", label: "X", title: "X", model: { path: "/bad.glb" } },
      { id: "valid", label: "V", title: "V", model: { path: "/good.glb" } },
      { id: "no-path", label: "N", title: "N", model: { path: "" } },
    ],
  }));
  assert(result.length === 1, "filters invalid, keeps 1");
  assert(result[0].id === "valid", "keeps valid entry");
}

/* ── 6. More than 3 variants truncated ── */
{
  const result = resolveNodeModelSources(makeNode({
    presentationMode: "variants",
    variants: [
      { id: "1", label: "1", title: "1", model: { path: "/1.glb" } },
      { id: "2", label: "2", title: "2", model: { path: "/2.glb" } },
      { id: "3", label: "3", title: "3", model: { path: "/3.glb" } },
      { id: "4", label: "4", title: "4", model: { path: "/4.glb" } },
    ],
  }));
  assert(result.length === 3, "truncated to 3");
}

/* ── Layout: single model stays at origin ── */
{
  const r = computeMultiModelLayout([2.0]);
  assert(r.entries.length === 1, "single model: 1 entry");
  const finalX = r.entries[0].x - r.totalWidth / 2;
  assert(Math.abs(finalX) < 0.001, "single model centered at origin");
}

/* ── Layout: two equal-width models don't overlap ── */
{
  const r = computeMultiModelLayout([2.0, 2.0]);
  assert(r.entries.length === 2, "two models: 2 entries");
  const leftEdge1 = r.entries[0].x + r.entries[0].width / 2 - r.totalWidth / 2;
  const rightEdge0 = r.entries[1].x - r.entries[1].width / 2 - r.totalWidth / 2;
  assert(rightEdge0 - leftEdge1 >= r.gap - 0.001, "two equal models: gap preserved, no overlap");
}

/* ── Layout: three different-width models don't overlap ── */
{
  const r = computeMultiModelLayout([1.0, 2.5, 1.5]);
  assert(r.entries.length === 3, "three models: 3 entries");
  for (let i = 0; i < 2; i++) {
    const rightI = r.entries[i].x + r.entries[i].width / 2 - r.totalWidth / 2;
    const leftJ = r.entries[i + 1].x - r.entries[i + 1].width / 2 - r.totalWidth / 2;
    assert(leftJ - rightI >= r.gap - 0.001, `three models: gap between ${i} and ${i + 1} preserved`);
  }
}

/* ── Layout: overall X-direction centering ── */
{
  const r = computeMultiModelLayout([1.5, 2.0, 1.0]);
  const leftmost = Math.min(...r.entries.map(e => e.x - e.width / 2 - r.totalWidth / 2));
  const rightmost = Math.max(...r.entries.map(e => e.x + e.width / 2 - r.totalWidth / 2));
  assert(Math.abs(leftmost + rightmost) < 0.001, "overall X-centering: left + right ≈ 0");
}

/* ── Layout: gap lower bound 0.6 ── */
{
  const r = computeMultiModelLayout([0.1, 0.1]); // tiny models → maxW=0.5, gap=clamp(0.09,0.6,2)=0.6
  assert(r.gap >= 0.6, `gap >= 0.6 (actual: ${r.gap})`);
}

/* ── Layout: gap upper bound 2.0 ── */
{
  const r = computeMultiModelLayout([50, 50]); // large models → gap=clamp(9,0.6,2)=2.0
  assert(r.gap <= 2.0, `gap <= 2.0 (actual: ${r.gap})`);
}

/* ── Layout: NaN/Infinity/zero/negative widths don't produce NaN positions ── */
{
  const r = computeMultiModelLayout([NaN, Infinity, -1, 0, 2.0]);
  r.entries.forEach((e, i) => {
    assert(Number.isFinite(e.x), `entry ${i} x is finite: ${e.x}`);
    assert(Number.isFinite(e.width), `entry ${i} width is finite: ${e.width}`);
  });
  assert(Number.isFinite(r.totalWidth), "totalWidth is finite");
  assert(Number.isFinite(r.gap), "gap is finite");
  assert(r.totalWidth > 0, "totalWidth > 0 even with invalid inputs");
}

/* ── Layout: empty array ── */
{
  const r = computeMultiModelLayout([]);
  assert(r.entries.length === 0, "empty input → empty entries");
  assert(Number.isFinite(r.gap), "gap finite for empty");
}

/* ═══════════════════════════════════════════════════════════════
   Instance isolation: SkeletonUtils.clone creates independent copies.
   ═══════════════════════════════════════════════════════════════ */

import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

/* ── Same source → two clones → different UUIDs ── */
{
  const source = new THREE.Group();
  source.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)));
  source.add(new THREE.Mesh(new THREE.SphereGeometry(0.5)));
  const cloneA = SkeletonUtils.clone(source) as THREE.Group;
  const cloneB = SkeletonUtils.clone(source) as THREE.Group;
  assert(cloneA.uuid !== cloneB.uuid, "two clones have different UUIDs");
  assert(cloneA.uuid !== source.uuid, "clone A UUID ≠ source UUID");
  assert(cloneB.uuid !== source.uuid, "clone B UUID ≠ source UUID");
}

/* ── Modify clone A position → clone B unaffected ── */
{
  const source = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  source.add(mesh);
  const cloneA = SkeletonUtils.clone(source) as THREE.Group;
  const cloneB = SkeletonUtils.clone(source) as THREE.Group;
  cloneA.position.set(10, 0, 0);
  assert(cloneA.position.x === 10, "clone A position.x = 10");
  assert(cloneB.position.x === 0, "clone B position.x unaffected");
  assert(source.position.x === 0, "source position.x unaffected");
}

/* ── Modify clone A → source unchanged ── */
{
  const source = new THREE.Group();
  source.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)));
  source.scale.setScalar(2);
  const cloneA = SkeletonUtils.clone(source) as THREE.Group;
  cloneA.scale.setScalar(5);
  cloneA.position.set(3, 4, 5);
  assert(source.scale.x === 2, "source scale unchanged after clone scale change");
  assert(source.position.x === 0, "source position unchanged after clone position change");
  assert(cloneA.scale.x === 5, "clone scale = 5");
  assert(cloneA.position.x === 3, "clone position.x = 3");
}

/* ── Two clones can coexist in same parent group ── */
{
  const source = new THREE.Group();
  source.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)));
  const parent = new THREE.Group();
  const cloneA = SkeletonUtils.clone(source) as THREE.Group;
  const cloneB = SkeletonUtils.clone(source) as THREE.Group;
  parent.add(cloneA);
  parent.add(cloneB);
  assert(parent.children.length === 2, "parent children = 2");
  assert(parent.children[0] === cloneA, "first child = cloneA");
  assert(parent.children[1] === cloneB, "second child = cloneB");
  assert(parent.children[0].uuid !== parent.children[1].uuid, "children have different UUIDs");
}

/* ── Clone preserves mesh hierarchy ── */
{
  const source = new THREE.Group();
  const child = new THREE.Group();
  child.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)));
  source.add(child);
  const clone = SkeletonUtils.clone(source) as THREE.Group;
  assert(clone.children.length === 1, "clone has 1 child group");
  assert(clone.children[0] instanceof THREE.Group, "clone child is Group");
  assert(clone.children[0].children.length === 1, "clone grandchild exists");
  assert(clone.children[0].children[0] instanceof THREE.Mesh, "clone grandchild is Mesh");
}

console.log("\nAll tests passed.");
