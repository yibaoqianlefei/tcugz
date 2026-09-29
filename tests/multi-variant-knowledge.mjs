import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const origin = process.env.LAYOUT_TEST_URL ?? "http://127.0.0.1:5173";
const nodes = ["wall-damp-proof-course", "cantilever-slab-01", "independent-foundation-01"];
const comparisonEvidence = {
  "wall-damp-proof-course": "高差范围设置垂直防潮层",
  "cantilever-slab-01": "边梁提高悬挑端刚度与抗扭能力",
  "independent-foundation-01": "适用于装配式预制钢筋混凝土柱",
};

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  for (const nodeId of nodes) {
    await page.goto(`${origin}/#/node/${nodeId}`);
    await page.getByRole("group", { name: "方案选择" }).waitFor();
    const comparison = page.getByRole("region", { name: "方案对比" });
    assert(await comparison.isVisible(), `${nodeId}: comparison is the initial knowledge state`);
    assert.equal(await comparison.locator("article").count(), 3, `${nodeId}: all three schemes are compared`);
    assert(await comparison.getByText(comparisonEvidence[nodeId], { exact: false }).isVisible());

    const mapping = await page.evaluate(async (id) => {
      const [{ GLTFLoader }, { getNodeDefinition }, { interactiveMeshName }] = await Promise.all([
        import("/node_modules/three/examples/jsm/loaders/GLTFLoader.js?import"),
        import("/src/data/nodeDefinitions.ts"),
        import("/src/utils/nameUtils.ts"),
      ]);
      const node = getNodeDefinition(id);
      const loader = new GLTFLoader();
      return Promise.all(node.variants.map(async (variant) => {
        const names = new Set((variant.componentKnowledge ?? []).flatMap((entry) => [entry.objectName, ...(entry.aliases ?? [])]));
        const clickable = new Set();
        const gltf = await loader.loadAsync(variant.model.path);
        gltf.scene.traverse((object) => {
          if (!object.isMesh) return;
          clickable.add(interactiveMeshName(object.name, names));
        });
        return {
          variantId: variant.id,
          clickable: [...clickable],
          configured: [...names],
          unreachable: (variant.componentKnowledge ?? []).filter((entry) =>
            !clickable.has(entry.objectName) && !(entry.aliases ?? []).some((alias) => clickable.has(alias)),
          ).map((entry) => entry.title),
        };
      }));
    }, nodeId);
    for (const variant of mapping) {
      assert.deepEqual(variant.unreachable, [], `${nodeId}/${variant.variantId}: every teaching entry maps to a real mesh; ${JSON.stringify(variant)}`);
    }
    assert.equal(await page.getByRole("group", { name: "方案选择" }).locator("button").count(), 3);
    if (nodeId !== "wall-damp-proof-course") {
      await page.getByRole("group", { name: "方案选择" }).locator("button").first().click();
      assert.equal(await comparison.count(), 0, `${nodeId}: selecting a scheme replaces the initial comparison`);
      assert(await page.getByRole("button", { name: "播放爆炸" }).isDisabled(), `${nodeId}: no explode config keeps the control disabled`);
    }
  }

  await page.goto(`${origin}/#/node/wall-damp-proof-course`);
  await page.waitForFunction(() => window.__multiModelDebug?.variants?.length === 3);
  const expand = page.getByRole("button", { name: "播放爆炸" });
  assert(await expand.isDisabled(), "explode is disabled until a variant is active");
  await page.getByRole("button", { name: "方案 A: 密实材料垫层" }).click();
  assert(await expand.isEnabled(), "A enables its explode control");
  assert(await page.getByRole("region", { name: "当前方案概览" }).getByText("水平防潮层").count() > 0);
  await page.getByRole("button", { name: "查看知识：水平防潮层" }).click();
  assert(await page.getByText("防水砂浆配比").isVisible(), "second mesh knowledge is visible");

  const selectedBeforeUnlink = await page.evaluate(async () => (await import("/src/store/nodeStore.ts")).useNodeStore.getState().selectedObject);
  assert.equal(selectedBeforeUnlink, "dense-base::地面垫层为密实材料001_1");
  await page.getByRole("button", { name: "联动已开启：点击关闭" }).click();
  await page.getByRole("button", { name: "查看知识：密实垫层主体" }).click();
  assert(await page.getByText("密实垫层是防潮构造的基础层", { exact: false }).isVisible());
  assert.equal(await page.evaluate(async () => (await import("/src/store/nodeStore.ts")).useNodeStore.getState().selectedObject), selectedBeforeUnlink,
    "manual knowledge selection does not change 3D selection while unlinked");
  await page.evaluate(async () => (await import("/src/store/nodeStore.ts")).useNodeStore.getState().setSelectedObject("dense-base::地面垫层为密实材料001_1"));
  assert(await page.getByText("密实垫层是防潮构造的基础层", { exact: false }).isVisible(),
    "3D selection does not override manually selected knowledge while unlinked");
  await page.getByRole("button", { name: "联动已关闭：点击开启" }).click();
  assert(await page.getByText("防水砂浆配比").isVisible(), "relink follows the model selection again");

  await page.getByRole("button", { name: "方案 B: 透水材料垫层" }).click();
  assert(await page.getByText("重点阻断垫层中的水分上升").isVisible());
  assert.equal(await page.getByRole("button", { name: "查看知识：抬高防潮层" }).count(), 1);
  await page.getByRole("button", { name: "方案 B: 透水材料垫层" }).click();
  assert(await expand.isDisabled(), "deselecting the active variant disables explode again");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("tab", { name: "构件知识" }).click();
  assert.equal(await page.getByRole("region", { name: "方案对比" }).locator("article").count(), 3);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390, "mobile page has no horizontal overflow");
  assert.deepEqual(errors, [], "no browser errors");
  console.log("Multi-variant mesh knowledge, overview, explode gating and linkage passed");
} finally {
  await browser.close();
}
