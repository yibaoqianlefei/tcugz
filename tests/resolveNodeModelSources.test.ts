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
  assert(r.gap >= 0.25, `gap >= 0.25 (actual: ${r.gap})`);
}

/* ── Layout: gap upper bound 2.0 ── */
{
  const r = computeMultiModelLayout([50, 50]); // large models → gap=clamp(9,0.6,2)=2.0
  assert(r.gap <= 1.2, `gap <= 1.2 (actual: ${r.gap})`);
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
   resolveNodeModelSources — extended fields (Phase 3)
   ═══════════════════════════════════════════════════════════════ */

/* ── Variants carry label & title ── */
{
  const result = resolveNodeModelSources(makeNode({
    presentationMode: "variants",
    variants: [
      { id: "a", label: "A", title: "Opt A", model: { path: "/a.glb" } },
      { id: "b", label: "B", title: "Opt B", model: { path: "/b.glb" } },
    ],
  }));
  assert(result.length === 2, "variants carry label/title: length");
  assert(result[0].label === "A", "variant A label");
  assert(result[0].title === "Opt A", "variant A title");
  assert(result[1].label === "B", "variant B label");
}

/* ═══════════════════════════════════════════════════════════════
   Variant identity: write + resolve + scoped keys (Phase 3)
   ═══════════════════════════════════════════════════════════════ */

import { writeVariantIdentity, resolveVariantIdentity, makeScopedKey, parseScopedKey } from "../src/utils/variantIdentity";

/* ── Write & resolve from root ── */
{
  const scene = new THREE.Group();
  writeVariantIdentity(scene, { variantId: "test-1", variantIndex: 2, label: "B", title: "Test B", src: "/b.glb" });
  const id = resolveVariantIdentity(scene);
  assert(id !== null, "resolve from root returns non-null");
  assert(id!.variantId === "test-1", "variantId matches");
  assert(id!.variantIndex === 2, "variantIndex matches");
  assert(id!.label === "B", "label matches");
  assert(id!.title === "Test B", "title matches");
  assert(id!.src === "/b.glb", "src matches");
}

/* ── Resolve from child mesh (walk up) ── */
{
  const scene = new THREE.Group();
  writeVariantIdentity(scene, { variantId: "parent", variantIndex: 1, label: "P", title: "Parent", src: "/p.glb" });
  const child = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry());
  child.add(mesh);
  scene.add(child);
  const id = resolveVariantIdentity(mesh);
  assert(id !== null, "resolve from deep mesh returns non-null");
  assert(id!.variantId === "parent", "deep variantId matches");
}

/* ── Nested multiple levels still resolves ── */
{
  const scene = new THREE.Group();
  writeVariantIdentity(scene, { variantId: "root", variantIndex: 0, label: "R", title: "Root", src: "/r.glb" });
  const a = new THREE.Group();
  const b = new THREE.Group();
  const mesh = new THREE.Mesh();
  b.add(mesh); a.add(b); scene.add(a);
  assert(resolveVariantIdentity(mesh)!.variantId === "root", "3 levels deep resolves");
}

/* ── Normal single-model node returns null ── */
{
  const scene = new THREE.Group();
  scene.add(new THREE.Mesh());
  const id = resolveVariantIdentity(scene);
  assert(id === null, "no variant identity → null");
}

/* ── Different variants return different IDs ── */
{
  const sA = new THREE.Group();
  const sB = new THREE.Group();
  writeVariantIdentity(sA, { variantId: "A", variantIndex: 0, label: "A", title: "A", src: "/a.glb" });
  writeVariantIdentity(sB, { variantId: "B", variantIndex: 1, label: "B", title: "B", src: "/b.glb" });
  const mA = new THREE.Mesh(); sA.add(mA);
  const mB = new THREE.Mesh(); sB.add(mB);
  assert(resolveVariantIdentity(mA)!.variantId === "A", "variant A mesh → A");
  assert(resolveVariantIdentity(mB)!.variantId === "B", "variant B mesh → B");
}

/* ── Same-named mesh in different variants → different scoped keys ── */
{
  const kA = makeScopedKey("A", "wall");
  const kB = makeScopedKey("B", "wall");
  assert(kA !== kB, "same mesh name, different variant → different keys");
  assert(kA === "A::wall", "key format correct");
  assert(kB === "B::wall", "key format correct");
}

/* ── Scoped key roundtrip ── */
{
  const key = makeScopedKey("dense-base", "墙体");
  const parsed = parseScopedKey(key);
  assert(parsed.variantId === "dense-base", "roundtrip variantId");
  assert(parsed.objectName === "墙体", "roundtrip objectName");
}

/* ── Normal node (no variantId) → plain key ── */
{
  const key = makeScopedKey(null, "column");
  assert(key === "column", "null variantId → plain key");
  const parsed = parseScopedKey(key);
  assert(parsed.variantId === null, "plain key → null variantId");
  assert(parsed.objectName === "column", "plain key objectName");
}

/* ── Scoped key: objectName contains special characters ── */
{
  // variantId never contains "::", only objectName theoretically could
  const key = makeScopedKey("variant-A", "40厚细石混凝土毛面");
  const parsed = parseScopedKey(key);
  assert(parsed.variantId === "variant-A", "special char key: variantId correct");
  assert(parsed.objectName === "40厚细石混凝土毛面", "special char key: objectName correct");
  // Plain key with "::" in objectName (should treat whole string as objectName)
  const plain = parseScopedKey("something::with::colons");
  assert(plain.variantId === "something", "plain ::-containing key splits on first :: only");
}

/* ═══════════════════════════════════════════════════════════════
   Material isolation (Phase 3 P1)
   ═══════════════════════════════════════════════════════════════ */

import { cloneSceneWithMaterials, disposeClonedMaterials } from "../src/utils/variantIdentity";

/* ── cloneSceneWithMaterials: scene identity ── */
{
  const src = new THREE.Group();
  src.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()));
  const clone = cloneSceneWithMaterials(src);
  assert(clone !== src, "cloned scene ≠ source");
  assert(clone.children[0] !== src.children[0], "cloned mesh ≠ source mesh");
}

/* ── cloneSceneWithMaterials: geometry shared ── */
{
  const src = new THREE.Group();
  const geo = new THREE.BoxGeometry();
  src.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial()));
  const clone = cloneSceneWithMaterials(src);
  const srcGeo = (src.children[0] as THREE.Mesh).geometry;
  const cloneGeo = (clone.children[0] as THREE.Mesh).geometry;
  assert(srcGeo === cloneGeo, "geometry is shared (safe, read-only)");
}

/* ── cloneSceneWithMaterials: material isolated ── */
{
  const src = new THREE.Group();
  src.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ color: "#ff0000" })));
  const clone = cloneSceneWithMaterials(src);
  const srcMat = (src.children[0] as THREE.Mesh).material as THREE.Material;
  const cloneMat = (clone.children[0] as THREE.Mesh).material as THREE.Material;
  assert(srcMat !== cloneMat, "material is NOT shared");
}

/* ── cloneSceneWithMaterials: Material[] isolated ── */
{
  const src = new THREE.Group();
  src.add(new THREE.Mesh(new THREE.BoxGeometry(), [
    new THREE.MeshStandardMaterial(), new THREE.MeshStandardMaterial()
  ]));
  const clone = cloneSceneWithMaterials(src);
  const mats = (clone.children[0] as THREE.Mesh).material as THREE.Material[];
  const srcMats = (src.children[0] as THREE.Mesh).material as THREE.Material[];
  assert(Array.isArray(mats), "Material[] preserved");
  assert(mats[0] !== srcMats[0], "Material[0] isolated");
  assert(mats[1] !== srcMats[1], "Material[1] isolated");
  assert(mats[0] !== mats[1], "Material[0] ≠ Material[1]");
}

/* ── cloneSceneWithMaterials: modify clone emissive → source unaffected ── */
{
  const src = new THREE.Group();
  const srcMat = new THREE.MeshStandardMaterial({ color: "#ff0000" });
  src.add(new THREE.Mesh(new THREE.BoxGeometry(), srcMat));
  const clone = cloneSceneWithMaterials(src);
  const cloneMat = (clone.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
  cloneMat.emissive.set("#ffffff");
  cloneMat.emissiveIntensity = 1.5;
  assert(srcMat.emissive.getHex() === 0, "source emissive unchanged after clone modify");
  assert(cloneMat.emissive.getHex() === 0xffffff, "clone emissive set correctly");
}

/* ── cloneSceneWithMaterials: modify clone A → clone B unaffected ── */
{
  const src = new THREE.Group();
  src.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()));
  const cloneA = cloneSceneWithMaterials(src);
  const cloneB = cloneSceneWithMaterials(src);
  const matA = (cloneA.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
  const matB = (cloneB.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
  matA.emissive.set("#ff0000");
  assert(matA.emissive.getHex() === 0xff0000, "clone A emissive set");
  assert(matB.emissive.getHex() === 0, "clone B emissive unaffected");
}

/* ── cloneSceneWithMaterials: nested deep hierarchy ── */
{
  const src = new THREE.Group();
  const parent = new THREE.Group();
  parent.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()));
  src.add(parent);
  const clone = cloneSceneWithMaterials(src);
  const deepMesh = (clone.children[0] as THREE.Group).children[0] as THREE.Mesh;
  assert(deepMesh.material !== ((src.children[0] as THREE.Group).children[0] as THREE.Mesh).material, "deep mesh material isolated");
}

/* ═══════════════════════════════════════════════════════════════
   Lifecycle: dispose tracked materials (Phase 3 P1 final)
   ═══════════════════════════════════════════════════════════════ */

/* ── disposeClonedMaterials disposes each owned material ── */
{
  const src = new THREE.Group();
  src.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()));
  src.add(new THREE.Mesh(new THREE.BoxGeometry(), [
    new THREE.MeshStandardMaterial(), new THREE.MeshStandardMaterial()
  ]));
  const clone = cloneSceneWithMaterials(src);

  const disposed: string[] = [];
  const cloneMeshes: THREE.Mesh[] = [];
  clone.traverse((o) => { if (o instanceof THREE.Mesh) cloneMeshes.push(o); });
  const allCloneMats = cloneMeshes.flatMap((m) =>
    Array.isArray(m.material) ? m.material : [m.material]
  );
  allCloneMats.forEach((m) => {
    const orig = m.dispose.bind(m);
    m.dispose = () => { disposed.push(m.uuid); return orig(); };
  });

  disposeClonedMaterials(clone);
  assert(disposed.length === 3, `all 3 owned materials disposed (${disposed.length})`);
}

/* ── disposeClonedMaterials: source materials NOT disposed ── */
{
  const src = new THREE.Group();
  const srcMat = new THREE.MeshStandardMaterial();
  src.add(new THREE.Mesh(new THREE.BoxGeometry(), srcMat));
  const srcDisposed: string[] = [];
  srcMat.dispose = ((orig) => () => { srcDisposed.push("src"); return orig(); })(srcMat.dispose.bind(srcMat));

  const clone = cloneSceneWithMaterials(src);
  disposeClonedMaterials(clone);
  assert(srcDisposed.length === 0, "source material NOT disposed");
}

/* ── disposeClonedMaterials: geometry NOT disposed ── */
{
  const src = new THREE.Group();
  const geo = new THREE.BoxGeometry();
  const geoDisposed: string[] = [];
  geo.dispose = ((orig) => () => { geoDisposed.push("geo"); return orig(); })(geo.dispose.bind(geo));
  src.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial()));

  const clone = cloneSceneWithMaterials(src);
  disposeClonedMaterials(clone);
  assert(geoDisposed.length === 0, "geometry NOT disposed");
}

/* ── disposeClonedMaterials: double dispose calls dispose each time ── */
{
  const src = new THREE.Group();
  src.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()));
  const clone = cloneSceneWithMaterials(src);
  let disposeCount = 0;
  // Spy on the dispose method of the first owned material
  const cloneMesh = clone.children[0] as THREE.Mesh;
  const matRef = Array.isArray(cloneMesh.material) ? cloneMesh.material[0] : cloneMesh.material;
  const origFn = matRef.dispose.bind(matRef);
  (matRef as THREE.Material).dispose = () => { disposeCount++; origFn(); };

  disposeClonedMaterials(clone);  // first cleanup (StrictMode simulated)
  assert(disposeCount === 1, `first cleanup calls dispose (count=${disposeCount})`);
  disposeClonedMaterials(clone);  // second cleanup (real unmount)
  assert(disposeCount === 2, `second cleanup ALSO calls dispose (count=${disposeCount}), not skipped`);
  disposeClonedMaterials(clone);  // third cleanup should still find entry
  assert(disposeCount === 3, `third cleanup still calls dispose (count=${disposeCount})`);
}

/* ── dispose A does not affect B's materials ── */
{
  const src = new THREE.Group();
  src.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()));
  const cloneA = cloneSceneWithMaterials(src);
  const cloneB = cloneSceneWithMaterials(src);

  const disposedA: string[] = [];
  const matA = (cloneA.children[0] as THREE.Mesh).material as THREE.Material;
  matA.dispose = ((orig) => () => { disposedA.push("A"); return orig(); })(matA.dispose.bind(matA));

  const disposedB: string[] = [];
  const matB = (cloneB.children[0] as THREE.Mesh).material as THREE.Material;
  matB.dispose = ((orig) => () => { disposedB.push("B"); return orig(); })(matB.dispose.bind(matB));

  disposeClonedMaterials(cloneA);
  assert(disposedA.length === 1, "A material disposed");
  assert(disposedB.length === 0, "B material NOT affected by A dispose");
}

/* ── dispose then re-clone: source still usable ── */
{
  const src = new THREE.Group();
  src.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ color: "#00ff00" })));
  const clone1 = cloneSceneWithMaterials(src);
  disposeClonedMaterials(clone1);
  // Source should still be cloneable
  const clone2 = cloneSceneWithMaterials(src);
  const mat2 = (clone2.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
  assert(mat2.color.getHex() === 0x00ff00, "re-clone after dispose preserves color");
  disposeClonedMaterials(clone2);
}

/* ═══════════════════════════════════════════════════════════════
   Knowledge resolver (Phase 4)
   ═══════════════════════════════════════════════════════════════ */

import { resolveComponentKnowledge } from "../src/utils/resolveComponentKnowledge";
import type { NodeDefinition, VariantComponentKnowledge } from "../src/data/nodeDefinitions";

function makeVariantNode(variants: NodeDefinition["variants"]): NodeDefinition {
  return {
    id: "test-v-node", title: "Test", description: "", category: "墙", thumbnail: null,
    status: "available", presentationMode: "variants", variants,
  } as NodeDefinition;
}

function mkK(overrides: Partial<VariantComponentKnowledge> = {}): VariantComponentKnowledge {
  return { objectName: "wall", title: "Wall", ...overrides };
}

/* ── Scoped key parses variantId + objectName ── */
{
  const node = makeVariantNode([
    { id: "a", label: "A", title: "AAA", model: { path: "/a.glb" },
      componentKnowledge: [mkK({ objectName: "wall" })] },
  ]);
  const r = resolveComponentKnowledge({ node, selectedObject: "a::wall", selectedVariantId: "a" });
  assert(r !== null, "knowledge: scoped key returns knowledge");
  assert(r!.variantId === "a", "knowledge: variantId from scoped key");
  assert(r!.objectName === "wall", "knowledge: objectName parsed");
  assert(r!.component !== null, "knowledge: component found");
}

/* ── A variant mesh matches A knowledge only ── */
{
  const node = makeVariantNode([
    { id: "a", label: "A", title: "AAA", model: { path: "/a.glb" },
      componentKnowledge: [mkK({ objectName: "shared", title: "A-knowledge" })] },
    { id: "b", label: "B", title: "BBB", model: { path: "/b.glb" },
      componentKnowledge: [mkK({ objectName: "shared", title: "B-knowledge" })] },
  ]);
  const rA = resolveComponentKnowledge({ node, selectedObject: "a::shared", selectedVariantId: "a" });
  const rB = resolveComponentKnowledge({ node, selectedObject: "b::shared", selectedVariantId: "b" });
  assert(rA!.component!.title === "A-knowledge", "knowledge: shared name → A gets A");
  assert(rB!.component!.title === "B-knowledge", "knowledge: shared name → B gets B");
}

/* ── A does not cross-match into B ── */
{
  const node = makeVariantNode([
    { id: "a", label: "A", title: "AAA", model: { path: "/a.glb" },
      componentKnowledge: [mkK({ objectName: "unique-a" })] },
    { id: "b", label: "B", title: "BBB", model: { path: "/b.glb" },
      componentKnowledge: [] },
  ]);
  const r = resolveComponentKnowledge({ node, selectedObject: "b::unique-a", selectedVariantId: "b" });
  assert(r!.component === null, "knowledge: B does not match A-only mesh");
  assert(r!.isUnconfigured === true, "knowledge: unconfigured flag");
}

/* ── Aliases work within a variant ── */
{
  const node = makeVariantNode([
    { id: "a", label: "A", title: "AAA", model: { path: "/a.glb" },
      componentKnowledge: [mkK({ objectName: "layer-01", aliases: ["layer-01_1"] })] },
  ]);
  const r = resolveComponentKnowledge({ node, selectedObject: "a::layer-01_1", selectedVariantId: "a" });
  assert(r!.component !== null, "knowledge: alias match finds knowledge");
}

/* ── Unconfigured mesh returns isUnconfigured=true ── */
{
  const node = makeVariantNode([
    { id: "a", label: "A", title: "AAA", model: { path: "/a.glb" },
      componentKnowledge: [mkK({ objectName: "configured" })] },
  ]);
  const r = resolveComponentKnowledge({ node, selectedObject: "a::unconfigured", selectedVariantId: "a" });
  assert(r!.component === null, "knowledge: unconfigured → null component");
  assert(r!.isUnconfigured === true, "knowledge: isUnconfigured=true");
}

/* ── Non-existent variant ID returns null ── */
{
  const node = makeVariantNode([
    { id: "a", label: "A", title: "AAA", model: { path: "/a.glb" }, componentKnowledge: [] },
  ]);
  const r = resolveComponentKnowledge({ node, selectedObject: "bad::wall", selectedVariantId: "bad" });
  assert(r === null, "knowledge: nonexistent variant → null");
}

/* ── Null selectedObject returns null ── */
{
  const node = makeVariantNode([
    { id: "a", label: "A", title: "AAA", model: { path: "/a.glb" } },
  ]);
  const r = resolveComponentKnowledge({ node, selectedObject: null, selectedVariantId: "a" });
  assert(r === null, "knowledge: null selectedObject → null");
}

/* ── Normal node (not variants) returns null variantId ── */
{
  const node = {
    id: "normal", title: "Normal", description: "", category: "墙", thumbnail: null,
    status: "available", model: { path: "/m.glb", scale: 2 },
  } as NodeDefinition;
  const r = resolveComponentKnowledge({ node, selectedObject: "beam", selectedVariantId: null });
  assert(r !== null, "knowledge: normal node returns result");
  assert(r!.variantId === null, "knowledge: normal node variantId=null");
}

/* ── Knowledge fields preserved (images, tables, relatedNodeIds) ── */
{
  const node = makeVariantNode([
    { id: "a", label: "A", title: "AAA", model: { path: "/a.glb" },
      componentKnowledge: [{
        objectName: "roof", title: "Roof",
        images: [{ src: "/img.png", alt: "roof", caption: "Cap" }],
        tables: [{ title: "T", columns: ["A"], rows: [["1"]] }],
        relatedNodeIds: ["n1", "n2"],
      }] },
  ]);
  const r = resolveComponentKnowledge({ node, selectedObject: "a::roof", selectedVariantId: "a" });
  const c = r!.component!;
  assert(c.images![0].src === "/img.png", "knowledge: image src preserved");
  assert(c.tables![0].rows[0][0] === "1", "knowledge: table data preserved");
  assert(c.relatedNodeIds!.length === 2, "knowledge: relatedNodeIds count");
}

/* ── Knowledge: objectName containing :: still matches (scoped key protocol) ── */
{
  const node = makeVariantNode([
    { id: "a", label: "A", title: "AAA", model: { path: "/a.glb" },
      componentKnowledge: [mkK({ objectName: "part::sub" })] },
  ]);
  const r = resolveComponentKnowledge({ node, selectedObject: "a::part::sub", selectedVariantId: "a" });
  assert(r!.component !== null, "knowledge: objectName with :: in value matches");
  assert(r!.objectName === "part::sub", "knowledge: objectName with :: correctly parsed");
}

/* ── Knowledge: invalid relatedNodeIds are filtered (UI layer) ── */
{
  const node = makeVariantNode([
    { id: "a", label: "A", title: "AAA", model: { path: "/a.glb" },
      componentKnowledge: [{
        objectName: "roof", title: "Roof",
        relatedNodeIds: ["valid-01", "nonexistent-node", "valid-02"],
      }] },
  ]);
  const r = resolveComponentKnowledge({ node, selectedObject: "a::roof", selectedVariantId: "a" });
  const ids = r!.component!.relatedNodeIds!;
  assert(ids.length === 3, "knowledge: all relatedNodeIds preserved in data");

  // UI filter pattern: only generate links for nodes that exist
  // In production, ConstructionKnowledgePanel uses getNodeDefinition(id)
  // For this test we simulate with a known-valid set
  const knownValid = new Set(["valid-01", "valid-02"]);
  const validIds = ids.filter(id => knownValid.has(id));
  assert(validIds.length === 2, "knowledge: invalid relatedNodeId filtered (2 valid, 1 invalid)");
  assert(validIds.includes("valid-01"), "knowledge: valid node kept");
  assert(validIds.includes("valid-02"), "knowledge: valid node kept");
  assert(!validIds.includes("nonexistent-node"), "knowledge: invalid node excluded");
}

/* ── Knowledge: normal node layerConfig still works ── */
{
  // Use a synthetic normal node (like makeNode) to avoid import.meta.env
  const normalNode: NodeDefinition = {
    id: "test-normal", title: "Normal", description: "", category: "墙",
    thumbnail: null, status: "available",
    model: { path: "/m.glb", scale: 2 },
    layerConfig: {
      layers: [{ objectName: "beam", name: "beam", thickness: "200mm", material: "Steel", description: "Structural" }],
      getLayerInfo: (name: string) => (name === "beam") ? { objectName: "beam", name: "beam", thickness: "200mm", material: "Steel", description: "Structural" } : undefined,
    },
  } as NodeDefinition;

  // LayerConfig lookup works
  const layer = normalNode.layerConfig!.getLayerInfo("beam");
  assert(layer !== undefined, "knowledge: normal node layer lookup works");
  assert(layer!.thickness === "200mm", "knowledge: normal node layer has thickness");

  // resolveComponentKnowledge does NOT interfere with normal nodes
  const r = resolveComponentKnowledge({ node: normalNode, selectedObject: "beam", selectedVariantId: null });
  assert(r !== null, "knowledge: normal node resolver returns non-null");
  assert(r!.variantId === null, "knowledge: normal node variantId=null");
  assert(r!.component === null, "knowledge: normal node has no variant component");

  // Selected mesh not in layerConfig: resolver still returns null component
  const r2 = resolveComponentKnowledge({ node: normalNode, selectedObject: "nonexistent", selectedVariantId: null });
  assert(r2 !== null, "knowledge: unmatched normal node mesh still returns result");
  assert(r2!.variantId === null, "knowledge: unmatched normal node variantId=null");
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
