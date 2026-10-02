import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import sharp from 'sharp';

const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true });
try {
  for (const [path, width] of [['/', 1440], ['/previews/homepage-v1.html', 1440], ['/', 390]]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    let modelRequests = 0;
    page.on('pageerror', error => errors.push(error.message));
    // Exercise a cold asynchronous GLTF load, which used to suspend the Canvas.
    await page.route('**/organized-drainage.glb', async route => {
      modelRequests++;
      await new Promise(resolve => setTimeout(resolve, 800));
      await route.continue();
    });
    await page.goto(`${base}${path}`);
    const canvas = page.locator('#node-model-root canvas');
    await canvas.scrollIntoViewIfNeeded();
    await page.locator('.node-model-hint').waitFor();
    // The cold stylesheet/layout can move the stage after the first scroll.
    await canvas.scrollIntoViewIfNeeded();
    // R3F's delayed teardown loses the context after 500ms in the regression.
    await page.waitForTimeout(1000);
    assert.equal(await canvas.evaluate(c => c.getContext('webgl2').isContextLost()), false);
    const screenshot = await canvas.screenshot();
    const { width: imageWidth, height: imageHeight } = await sharp(screenshot).metadata();
    const pixels = await sharp(screenshot).extract({ left: Math.floor(imageWidth * .15), top: Math.floor(imageHeight * .2), width: Math.floor(imageWidth * .7), height: Math.floor(imageHeight * .55) }).removeAlpha().raw().toBuffer();
    let darkPixels = 0;
    for (let i = 0; i < pixels.length; i += 3) if (pixels[i] < 150 && pixels[i + 1] < 150 && pixels[i + 2] < 150) darkPixels++;
    assert(darkPixels > 250, `Model must actually be drawn: ${path} at ${width}px (${darkPixels} dark pixels)`);
    await canvas.evaluate(c => { window.__homepageModelCanvas = c; });
    if (width === 1440 && path === '/') {
      const box = await canvas.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2 + 20, { steps: 8 });
      await page.mouse.up();
      await page.locator('#sidebar-toggle').click();
      await page.locator('#introduction').scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
      const homeY = await page.evaluate(() => scrollY);
      await page.locator('a[href*="lesson/introduction/intro-classification.html"]').first().click();
      await page.frameLocator('.curriculum-frame').locator('.back').click();
      await page.waitForURL(/section=introduction/);
      assert(Math.abs(await page.evaluate(() => scrollY) - homeY) < 2, 'Return retains homepage scroll position');
      assert(await page.locator('.app').evaluate(e => e.classList.contains('sidebar-collapsed')), 'Return retains collapsed sidebar');
      await canvas.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      assert(await canvas.evaluate(c => c === window.__homepageModelCanvas && !c.getContext('webgl2').isContextLost()));
      assert.equal(modelRequests, 1, 'Returning home must retain the existing model');
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${path} at ${width}px: visible model, live WebGL context`);
    await page.close();
  }
} finally {
  await browser.close();
}
