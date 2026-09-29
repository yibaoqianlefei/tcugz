import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const origin = process.env.LAYOUT_TEST_URL ?? "http://127.0.0.1:5173";

async function geometry(page) {
  return page.evaluate(() => {
    const rect = (selector) => {
      const box = document.querySelector(selector).getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    };
    return {
      grid: rect(".node-detail-grid"),
      diagram: rect(".node-diagram"),
      viewport: rect(".node-viewport"),
      knowledge: rect(".node-knowledge"),
      toolbar: rect(".node-control-bar"),
    };
  });
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${origin}/#/node/ramp-handrail-01`);
  await page.locator(".node-control-bar").waitFor();
  const single = await geometry(page);
  assert.equal(await page.getByRole("group", { name: "方案选择" }).count(), 0);

  await page.goto(`${origin}/#/node/independent-foundation-01`);
  await page.locator(".node-control-bar").waitFor();
  assert(await page.getByRole("button", { name: "开启阴影" }).isVisible(), "multi-model node enters with shadows off");
  const multi = await geometry(page);
  for (const key of ["grid", "diagram", "viewport", "knowledge"]) {
    for (const dimension of ["x", "y", "width", "height"]) {
      assert(Math.abs(single[key][dimension] - multi[key][dimension]) <= 1,
        `${key}.${dimension} uses the same single/multi layout`);
    }
  }
  assert(Math.abs(single.toolbar.y - multi.toolbar.y) <= 1, "model controls share the same baseline");
  assert(await page.locator(".node-knowledge [role='group'][aria-label='方案选择']").isVisible(),
    "A/B/C selector belongs to the knowledge panel");
  assert.equal(await page.locator(".node-viewport [aria-label='方案选择']").count(), 0,
    "no selector overlays the 3D viewport");

  const optionB = page.getByRole("button", { name: "方案 B: 阶梯形基础" });
  await optionB.click();
  assert.equal(await optionB.getAttribute("aria-pressed"), "true");
  assert(await page.locator(".node-knowledge > div.flex-1").getByRole("heading", { name: "阶梯形基础" }).isVisible(),
    "selected variant knowledge is shown in the same right column");
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.getByRole("button", { name: "专注图纸" }).click();
  await page.waitForFunction(() => Math.round(document.querySelector(".node-diagram")?.getBoundingClientRect().width) === 600);
  const diagramFocus = await geometry(page);
  assert.equal(Math.round(diagramFocus.diagram.width), 600, "multi-model diagram focus uses 600px diagram");
  assert.equal(Math.round(diagramFocus.knowledge.width), 300, "multi-model diagram focus uses 300px knowledge");
  assert.equal(Math.round(diagramFocus.viewport.width), 1020, "multi-model diagram focus leaves 1020px for the model");
  if (process.env.MULTI_LAYOUT_SCREENSHOT) {
    await page.waitForFunction(() => window.__multiModelDebug?.variants?.length === 3 && window.__cameraWrites?.length > 0);
    await page.waitForTimeout(300);
    await page.screenshot({ path: process.env.MULTI_LAYOUT_SCREENSHOT });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("tab", { name: "构件知识" }).click();
  const optionA = page.getByRole("button", { name: "方案 A: 杯形基础" });
  assert(await optionA.isVisible(), "variant selection remains available on mobile knowledge tab");
  await optionA.click();
  assert.equal(await optionA.getAttribute("aria-pressed"), "true");
  await page.getByRole("tab", { name: "3D 模型" }).click();
  assert(await page.locator(".node-viewport").isVisible());
  assert(!(await optionA.isVisible()), "variant controls do not obstruct mobile model view");

  for (const nodeId of ["wall-damp-proof-course", "cantilever-slab-01"]) {
    await page.goto(`${origin}/#/node/${nodeId}`);
    await page.getByRole("tab", { name: "构件知识" }).click();
    const options = page.locator(".node-knowledge [role='group'][aria-label='方案选择'] button");
    assert.equal(await options.count(), 3, `${nodeId}: three choices remain in the knowledge panel`);
    await options.first().click();
    assert.equal(await options.first().getAttribute("aria-pressed"), "true", `${nodeId}: option A selects`);
  }

  console.log("Single and multi node layouts match; A/B/C stays in the knowledge panel");
} finally {
  await browser.close();
}
