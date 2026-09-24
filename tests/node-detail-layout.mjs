import assert from "node:assert/strict";
import path from "node:path";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (error) => console.error("Browser page error:", error));
  await page.goto(`${process.env.LAYOUT_TEST_URL ?? "http://127.0.0.1:5173"}/#/node/block-wall-core-column-01`);
  await page.locator(".node-detail-grid").waitFor();
  await page.locator(".node-viewport canvas").waitFor();

  async function layout() {
    return page.evaluate(() => {
      const rect = (selector) => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return { x: r.x, width: r.width, height: r.height };
      };
      return {
        left: rect(".node-diagram"), center: rect(".node-viewport"), right: rect(".node-knowledge"),
        toolbar: rect(".node-control-bar"), modelSurface: rect(".node-viewport > div"),
        pageOverflow: document.documentElement.scrollHeight - window.innerHeight,
      };
    });
  }

  for (const width of [1920, 1440, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForFunction(() => document.querySelector(".node-viewport").getBoundingClientRect().width >= 599);
    const value = await layout();
    assert(value.left.width >= 280, `diagram min width at ${width}`);
    assert(value.center.width >= 599, `model min width at ${width}`);
    assert(value.right.width >= 300, `knowledge min width at ${width}`);
    assert(value.toolbar.x >= value.center.x, `toolbar left bound at ${width}`);
    assert(value.toolbar.x + value.toolbar.width <= value.center.x + value.center.width, `toolbar right bound at ${width}`);
    assert(value.pageOverflow <= 1, `page overflow at ${width}: ${value.pageOverflow}`);
    if (width === 1440 && process.env.LAYOUT_SCREENSHOT_DIR) {
      await page.screenshot({ path: path.join(process.env.LAYOUT_SCREENSHOT_DIR, "node-layout-desktop.png") });
    }
  }

  await page.getByRole("button", { name: "专注模型" }).click();
  assert((await layout()).center.width >= 699, "model preset increases viewport");
  await page.locator(".node-divider-left").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator(".node-divider-left").getAttribute("role"), "separator");
  const beforeDrag = (await layout()).left.width;
  const handle = await page.locator(".node-divider-left").boundingBox();
  assert(handle);
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 100);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 + 32, handle.y + 100, { steps: 4 });
  await page.mouse.up();
  assert((await layout()).left.width > beforeDrag, "pointer drag changes diagram width");
  // Simulate a preference left by an older build.  Entry must ignore and
  // remove it, even when the user previously dragged to a custom width.
  await page.evaluate(() => localStorage.setItem("node-detail-panel-layout-v1", JSON.stringify({
    preset: "custom", sizes: { left: 600, right: 600 },
  })));
  await page.reload();
  await page.waitForFunction(() => Math.round(document.querySelector(".node-diagram")?.getBoundingClientRect().width) === 333);
  assert.equal(Math.round((await layout()).right.width), 300, "reload restores balanced layout");
  assert.equal(await page.evaluate(() => localStorage.getItem("node-detail-panel-layout-v1")), null,
    "old saved layout preference is removed");

  // During a desktop drag, cards must follow the panel immediately.  Dragged
  // widths remain temporary and must never be written to local storage.
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.getByRole("button", { name: "均衡", exact: true }).click();
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => localStorage.getItem("node-detail-panel-layout-v1")), null);
  const rightHandle = await page.locator(".node-divider-right").boundingBox();
  assert(rightHandle);
  await page.mouse.move(rightHandle.x + rightHandle.width / 2, rightHandle.y + 100);
  await page.mouse.down();
  await page.mouse.move(rightHandle.x + rightHandle.width / 2 - 260, rightHandle.y + 100, { steps: 12 });
  await page.waitForTimeout(80);
  const duringDrag = await page.evaluate(() => {
    const panel = document.querySelector(".node-knowledge").getBoundingClientRect();
    const list = document.querySelector(".node-knowledge ul");
    return { offset: list.getBoundingClientRect().x - panel.x, transform: getComputedStyle(list).transform };
  });
  assert(Math.abs(duringDrag.offset - 21) < 2, "knowledge cards stay attached to their panel during drag");
  assert.equal(duringDrag.transform, "none", "knowledge list has no drag-time layout transform");
  assert.equal(await page.evaluate(() => localStorage.getItem("node-detail-panel-layout-v1")), null,
    "drag does not write storage per pointer move");
  await page.mouse.up();
  const resizedRight = (await layout()).right.width;
  assert.equal(resizedRight, 600, "right divider stops at its readable maximum width");
  assert.equal(await page.evaluate(() => localStorage.getItem("node-detail-panel-layout-v1")), null,
    "released drag is not persisted");

  await page.getByRole("link", { name: "节点库" }).click();
  await page.locator(".node-detail-grid").waitFor({ state: "detached" });
  await page.goBack();
  await page.waitForFunction(() => Math.round(document.querySelector(".node-knowledge")?.getBoundingClientRect().width) === 380);
  assert.equal(Math.round((await layout()).left.width), 440, "returning to node restores balanced layout");

  await page.getByRole("button", { name: "专注模型" }).click();
  assert.equal(Math.round((await layout()).right.width), 300, "preset still works within a node visit");
  await page.evaluate(() => { location.hash = "#/node/wood-batten-tile-roof-01"; });
  await page.waitForFunction(() => Math.round(document.querySelector(".node-knowledge")?.getBoundingClientRect().width) === 380);
  await page.goBack();
  await page.waitForFunction(() => Math.round(document.querySelector(".node-knowledge")?.getBoundingClientRect().width) === 380);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.locator(".node-detail-grid").waitFor();
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.waitForFunction(() => Math.round(document.querySelector(".node-knowledge").getBoundingClientRect().width) === 380);

  // Even on a very wide monitor, neither side panel should consume the model
  // viewport or stretch teaching cards into excessively long reading lines.
  await page.setViewportSize({ width: 2560, height: 1600 });
  await page.waitForTimeout(120);
  const leftHandleWide = await page.locator(".node-divider-left").boundingBox();
  assert(leftHandleWide);
  await page.mouse.move(leftHandleWide.x + leftHandleWide.width / 2, leftHandleWide.y + 100);
  await page.mouse.down();
  await page.mouse.move(leftHandleWide.x + 1200, leftHandleWide.y + 100, { steps: 8 });
  await page.mouse.up();
  const wideLayout = await layout();
  assert(wideLayout.left.width <= 600, "diagram panel has a maximum width");
  assert(wideLayout.right.width <= 600, "knowledge panel has a maximum width");
  assert(wideLayout.center.width >= 599, "model viewport retains its minimum width");

  for (const width of [1100, 800]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(120);
    const value = await layout();
    assert(value.center.width > 400, `tablet model width at ${width}`);
    await page.getByRole("button", { name: "查看构造剖面图" }).click();
    assert(await page.locator(".node-diagram").isVisible(), `tablet diagram opens at ${width}`);
    await page.keyboard.press("Escape");
    assert(!(await page.locator(".node-diagram").isVisible()), `tablet diagram closes at ${width}`);
    assert(value.pageOverflow <= 1, `page overflow at ${width}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(120);
  for (const name of ["图纸", "3D 模型", "构件知识"]) {
    await page.getByRole("tab", { name }).click();
    assert.equal(await page.getByRole("tab", { name }).getAttribute("aria-selected"), "true");
  }
  const mobile = await layout();
  if (process.env.LAYOUT_DEBUG_CAMERA) console.log("mobile layout", mobile);
  assert(Math.abs(mobile.modelSurface.width - mobile.center.width) <= 1, "3D canvas fills mobile viewport without clipping");
  assert.equal(await page.locator(".node-viewport canvas").count(), 1, "tabs preserve mounted 3D canvas");
  assert(mobile.toolbar.x >= mobile.center.x, "mobile toolbar left bound");
  assert(mobile.toolbar.x + mobile.toolbar.width <= mobile.center.x + mobile.center.width, "mobile toolbar right bound");
  assert(mobile.pageOverflow <= 1, `mobile page overflow: ${mobile.pageOverflow}`);
  if (process.env.LAYOUT_SCREENSHOT_DIR) {
    await page.screenshot({ path: path.join(process.env.LAYOUT_SCREENSHOT_DIR, "node-layout-mobile.png") });
  }
  await page.getByRole("tab", { name: "3D 模型" }).click();
  const rotation = page.getByRole("button", { name: "暂停旋转" });
  await rotation.click();
  assert.equal(await page.getByRole("button", { name: "开启旋转" }).getAttribute("aria-pressed"), "false");
  await page.getByRole("button", { name: "适配模型视图" }).click();
  await page.waitForTimeout(150);
  if (process.env.LAYOUT_DEBUG_CAMERA) console.log(await page.evaluate(() => window.__cameraWrites?.slice(-5)));
  if (process.env.LAYOUT_SCREENSHOT_DIR) {
    await page.screenshot({ path: path.join(process.env.LAYOUT_SCREENSHOT_DIR, "node-layout-mobile-model.png") });
  }

  // A tall desktop viewport has enough pixel width but a narrow aspect ratio;
  // the camera must fit the model instead of relying on a width-only cutoff.
  await page.setViewportSize({ width: 1280, height: 1600 });
  await page.reload();
  await page.waitForFunction(() => window.__cameraWrites?.some((entry) => entry.canvasHeight > 1400));
  const tallCamera = await page.evaluate(() => window.__cameraWrites.at(-1));
  const cameraDistance = Math.hypot(...tallCamera.cameraPosition.map((value, index) => value - tallCamera.controlsTarget[index]));
  assert(cameraDistance > 8, "tall viewport fits the model without changing its scale");

  // A desktop window resize briefly exposes an intermediate CSS-grid width.
  // Camera framing must wait for the canvas to match the settled layout.
  const resizePage = await browser.newPage({ viewport: { width: 2560, height: 1600 } });
  await resizePage.goto(`${process.env.LAYOUT_TEST_URL ?? "http://127.0.0.1:5173"}/#/node/block-wall-core-column-01`);
  await resizePage.waitForFunction(() => window.__controls && document.querySelector(".node-diagram")?.getBoundingClientRect().width === 440);
  await resizePage.setViewportSize({ width: 1280, height: 1600 });
  await resizePage.waitForFunction(() => {
    const canvasWidth = Math.round(document.querySelector(".node-viewport canvas").getBoundingClientRect().width);
    return canvasWidth >= 600 && window.__cameraWrites?.at(-1)?.canvasWidth === canvasWidth;
  }, undefined, { timeout: 10000 });
  const resizeWrites = await resizePage.evaluate(() => window.__cameraWrites);
  assert(!resizeWrites.some((entry) => entry.canvasWidth < 600 && entry.canvasHeight > 1400),
    "camera ignores transient narrow canvas width during window resize");
  await resizePage.close();
  console.log("Node detail responsive layout passed");
} finally {
  await browser.close();
}
