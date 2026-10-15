import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true });
const featuredNode = ['water-storage-eaves-drainage-01', '蓄水屋面（檐沟式排水）'];
await mkdir('tmp/homepage-models', { recursive: true });
try {
  for (const [path, width] of [['/', 1440], ['/previews/homepage-v1.html', 1440], ['/', 390]]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    let modelRequests = 0;
    page.on('pageerror', error => errors.push(error.message));
    // Exercise a cold asynchronous GLTF load, which used to suspend the Canvas.
    await page.route('**/water-storage-eaves-drainage.glb', async route => {
      modelRequests++;
      await new Promise(resolve => setTimeout(resolve, 800));
      await route.continue();
    });
    await page.goto(`${base}${path}`);
    const canvas = page.locator('#node-model-root canvas');
    await canvas.scrollIntoViewIfNeeded();
    await page.locator('.node-model-stage[data-model-ready=\"true\"]').waitFor();
    assert.equal(await page.locator('.node-model-title').getAttribute('aria-label'), featuredNode[1]);
    assert.equal(await page.locator('.node-model-controls, .node-model-index').count(), 0, 'The single homepage model has no switch controls or counter');
    assert.equal(await page.locator('.node-model-footer a').count(), 0, 'Only the left current-node action remains');
    assert((await page.locator('[data-home-node-link]').getAttribute('href')).endsWith(`#/node/${featuredNode[0]}`));
    const assertInitialView = async () => {
      const direction = await page.evaluate(() => {
        const control = window.__homepageModelControls;
        return control.object.position.clone().sub(control.target).normalize().toArray();
      });
      const expected = [-0.55, 0.33, 1];
      const length = Math.hypot(...expected);
      const similarity = direction.reduce((sum, value, index) => sum + value * expected[index] / length, 0);
      assert(similarity > .9968 && Math.abs(direction[1] - expected[1] / length) < .001,
        `The homepage model starts above the open gutter and roof basin (${direction})`);
    };
    await assertInitialView();
    if (path === '/' && width === 1440) await page.locator('#node-model-root').screenshot({ path: `tmp/homepage-models/initial-${featuredNode[0]}.png` });
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
    await page.screenshot({ path: `tmp/homepage-models/${path === '/' ? 'home' : 'preview'}-${width}.png` });
    const readZoom = () => page.evaluate(() => {
      const control = window.__homepageModelControls;
      const distance = control.object.position.distanceTo(control.target);
      return { distance, min: control.minDistance, max: control.maxDistance, ratio: distance / control.minDistance, zoomEnabled: control.enableZoom };
    });
    await canvas.scrollIntoViewIfNeeded();
    const zoomBox = await canvas.boundingBox();
    await page.mouse.move(zoomBox.x + zoomBox.width / 2, zoomBox.y + zoomBox.height / 2);
    const initialZoom = await readZoom();
    assert.equal(initialZoom.zoomEnabled, false, 'Homepage model zoom is disabled');
    assert(Math.abs(initialZoom.min - initialZoom.max) < 1e-9, 'Orbit distance is fixed');
    assert(Math.abs(initialZoom.distance - initialZoom.min) < 1e-6, 'Camera starts at its fixed distance');
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(100);
    assert(Math.abs((await readZoom()).distance - initialZoom.distance) < 1e-6, 'Wheel cannot enlarge the model');
    await canvas.scrollIntoViewIfNeeded();
    const resizedBox = await canvas.boundingBox();
    await page.mouse.move(resizedBox.x + resizedBox.width / 2, resizedBox.y + resizedBox.height / 2);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(100);
    assert(Math.abs((await readZoom()).distance - initialZoom.distance) < 1e-6, 'Wheel cannot shrink the model');
    await canvas.scrollIntoViewIfNeeded();
    if (width === 390) {
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No mobile horizontal overflow');
    }
    if (width === 1440 && path === '/') {
      const box = await canvas.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2 + 20, { steps: 8 });
      await page.mouse.up();
      const readDirection = () => page.evaluate(() => {
        const control = window.__homepageModelControls;
        return control.object.position.clone().sub(control.target).normalize().toArray();
      });
      const angle = (a, b) => Math.acos(Math.min(1, Math.max(-1, a.reduce((sum, value, index) => sum + value * b[index], 0))));
      const released = await readDirection();
      await page.waitForTimeout(150);
      assert(angle(released, await readDirection()) > .0005, 'Autorotation resumes immediately after releasing drag');
      // Autorotation was verified above. Pause it through the controls event
      // before comparing retained views, so loading time cannot skew angles.
      await page.evaluate(() => window.__homepageModelControls.dispatchEvent({ type: 'start' }));
      // Let drag damping settle before recording the retained view.
      await page.waitForTimeout(600);
      await page.evaluate(() => {
        const control = window.__homepageModelControls;
        control.enableDamping = false;
        control.update();
        control.enableDamping = true;
      });
      const beforeSwitch = await readDirection();
      const zoomBeforeSwitch = await readZoom();
      await page.locator('#hero-next').click();
      await page.locator('#hero-prev').click();
      await page.locator('.hero-slide[aria-hidden="false"] .node-model-stage[data-model-ready="true"]').waitFor();
      await page.waitForTimeout(150);
      const returned = await readDirection();
      assert(angle(beforeSwitch, returned) < .08, `Returning to the node preview retains its latest orbit (${angle(beforeSwitch, returned)} rad; ${beforeSwitch} -> ${returned})`);
      assert(Math.abs((await readZoom()).ratio - zoomBeforeSwitch.ratio) < .001, 'Returning to a model retains fixed scale');
      const beforeResize = await readDirection();
      await page.locator('#sidebar-toggle').click();
      await page.waitForTimeout(500);
      assert(angle(beforeResize, await readDirection()) < .08, 'Sidebar resizing retains orbit direction');
      assert(Math.abs((await readZoom()).ratio - zoomBeforeSwitch.ratio) < .001, 'Sidebar resizing retains fixed relative scale');
      await page.locator('#introduction').scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
      const homeY = await page.evaluate(() => scrollY);
      await page.locator('a[href*="lesson/introduction/intro-classification.html"]').first().click();
      await page.frameLocator('.curriculum-frame').locator('.back').click();
      await page.waitForURL(/section=introduction/);
        // A hash change precedes React's route commit; assert the returned page.
        await page.locator('.curriculum-frame').waitFor({ state: 'detached' });
        await page.locator('.app').waitFor({ state: 'visible' });
      assert(Math.abs(await page.evaluate(() => scrollY) - homeY) < 2, 'Return retains homepage scroll position');
      assert(await page.locator('.app').evaluate(e => e.classList.contains('sidebar-collapsed')), 'Return retains collapsed sidebar');
      await canvas.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      assert(await canvas.evaluate(c => c === window.__homepageModelCanvas && !c.getContext('webgl2').isContextLost()));
      assert.equal(modelRequests, 1, 'Returning home must retain the existing model');
      assert(Math.abs((await readZoom()).ratio - zoomBeforeSwitch.ratio) < .001, 'Returning home retains fixed model scale');
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${path} at ${width}px: visible model, live WebGL context`);
    await page.close();
  }
} finally {
  await browser.close();
}
