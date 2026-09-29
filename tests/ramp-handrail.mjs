import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const clipNames = [];
  page.on("console", (message) => {
    if (message.text().includes("[GLB] clip[")) clipNames.push(message.text());
  });

  const origin = process.env.LAYOUT_TEST_URL ?? "http://127.0.0.1:5173";
  await page.goto(`${origin}/#/node/ramp-handrail-01`);
  await page.locator(".node-detail-grid").waitFor();
  await page.locator(".node-diagram img").evaluate((image) => image.decode());
  await page.waitForFunction(() => window.__cameraWrites?.length > 0);
  await page.evaluate(async () => {
    const [{ getModelScene }, { useNodeStore }] = await Promise.all([
      import("/src/utils/modelSceneRef.ts"),
      import("/src/store/nodeStore.ts"),
    ]);
    window.__getModelScene = getModelScene;
    window.__nodeStore = useNodeStore;
  });
  await page.waitForFunction(() => window.__getModelScene() !== null);

  assert(await page.locator(".node-diagram img").evaluate((image) => image.naturalWidth > 0), "diagram loads");
  assert(await page.locator(".node-diagram").getByText("扶手截面及与坡道的安装关系").isVisible(), "diagram has node-specific subtitle");
  assert.equal(await page.locator(".node-knowledge ul > li").count(), 2, "two model components have knowledge cards");
  assert(await page.getByRole("slider", { name: "爆炸程度" }).isEnabled(), "animation slider is enabled");
  assert(clipNames.some((name) => name.includes("扶手Action")), "handrail animation clip is loaded");

  await page.getByRole("button", { name: "播放爆炸" }).click();
  await page.waitForFunction(() => {
    const progress = window.__nodeStore.getState().animationProgress;
    return progress > 0.1 && progress < 0.9;
  });
  await page.waitForFunction(() => {
    return window.__nodeStore.getState().animationProgress >= 0.99;
  }, undefined, { timeout: 15000 });
  await page.waitForTimeout(200);
  const finalProgress = Number(await page.getByRole("slider", { name: "爆炸程度" }).inputValue());
  assert(finalProgress >= 0.99, `animation progress remains at its final frame (${finalProgress})`);
  await page.locator(".node-knowledge ul > li").first().locator("button").first().click();
  assert.equal(await page.evaluate(() => window.__nodeStore.getState().selectedObject), "扶手", "knowledge card links to the GLB mesh");

  assert.equal(errors.length, 0, `browser errors: ${errors.join("; ")}`);
  if (process.env.RAMP_SCREENSHOT) await page.screenshot({ path: process.env.RAMP_SCREENSHOT });
  await page.goto(`${origin}/#/library`);
  assert(await page.getByRole("link", { name: /坡道扶手/ }).isVisible(), "node appears in the library");
  console.log("Ramp handrail node: diagram, model, two knowledge cards and 4-second animation passed");
} finally {
  await browser.close();
}
