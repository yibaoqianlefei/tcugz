import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true });
const featured = [
  ['water-storage-eaves-drainage-01', '蓄水屋面（檐沟式排水）'],
  ['organized-drainage-01', '有组织排水'],
  ['vent-pipe-roof-01', '透气管出屋面'],
  ['foam-insulation-01', '粘贴泡沫塑料保温板外保温'],
  ['rc-elevated-steps-01', '钢筋混凝土架空台阶'],
];
await mkdir('tmp/homepage-models', { recursive: true });
async function assertModelDrawn(canvas, label) {
  const screenshot = await canvas.screenshot();
  const { width, height } = await sharp(screenshot).metadata();
  const pixels = await sharp(screenshot).extract({ left: Math.floor(width * .15), top: Math.floor(height * .15), width: Math.floor(width * .7), height: Math.floor(height * .7) }).removeAlpha().raw().toBuffer();
  let dark = 0;
  for (let i = 0; i < pixels.length; i += 3) if (pixels[i] < 150 && pixels[i + 1] < 150 && pixels[i + 2] < 150) dark++;
  assert(dark > 250, `${label} must actually render (${dark} dark pixels)`);
}
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
    assert.equal(await page.locator('.node-model-caption strong').innerText(), featured[0][1]);
    assert.equal(await page.locator('.node-model-index-current').innerText(), '01');
    assert.equal(await page.locator('.node-model-index-total').innerText(), String(featured.length).padStart(2, '0'));
    assert((await page.locator('.node-model-caption a').getAttribute('href')).endsWith(`#/node/${featured[0][0]}`));
    const assertFrontView = async () => {
      const direction = await page.evaluate(() => {
        const control = window.__homepageModelControls;
        return control.object.position.clone().sub(control.target).normalize().toArray();
      });
      assert(Math.abs(direction[0]) < .08 && Math.abs(direction[1]) < .001 && direction[2] > .99,
        `Each new model starts from the front (${direction})`);
    };
    await assertFrontView();
    if (path === '/' && width === 1440) await page.locator('#node-model-root').screenshot({ path: `tmp/homepage-models/front-${featured[0][0]}.png` });
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
    for (let index = 1; index < featured.length; index++) {
      await page.getByRole('button', { name: '下一个模型', exact: true }).click();
      await page.locator('.node-model-caption strong').filter({ hasText: featured[index][1] }).waitFor();
      await page.locator('.node-model-stage[data-model-ready=\"true\"]').waitFor();
      await assertFrontView();
      if (path === '/' && width === 1440) await page.locator('#node-model-root').screenshot({ path: `tmp/homepage-models/front-${featured[index][0]}.png` });
      await page.waitForTimeout(300);
      await assertModelDrawn(canvas, `${path} ${featured[index][1]} at ${width}px`);
      assert((await page.locator('.node-model-caption a').getAttribute('href')).endsWith(`#/node/${featured[index][0]}`));
      assert((await page.locator('[data-home-node-link]').getAttribute('href')).endsWith(`#/node/${featured[index][0]}`));
      const arrows = await page.locator('.node-model-controls').boundingBox();
      const caption = await page.locator('.node-model-caption').boundingBox();
      const summary = page.locator('.node-model-summary');
      const summaryBox = await summary.boundingBox();
      const modelRoot = await page.locator('#node-model-root').boundingBox();
      const summaryText = (await summary.innerText()).trim();
      assert(summaryText.length > 0 && summaryText.length <= 45, 'Each model has a brief introduction');
      assert(caption.y + caption.height <= summaryBox.y, 'Introduction is below the raised model name');
      assert(summaryBox.y + summaryBox.height <= modelRoot.y + modelRoot.height, 'Introduction fits inside the model panel');
      assert(arrows.y + arrows.height <= caption.y, 'Model arrows occupy a separate row above the name');
      const leftArrow = await page.getByRole('button', { name: '上一个模型', exact: true }).boundingBox();
      const rightArrow = await page.getByRole('button', { name: '下一个模型', exact: true }).boundingBox();
      assert(Math.abs((leftArrow.x + rightArrow.x + rightArrow.width) / 2 - (caption.x + caption.width / 2)) < 2, 'Model arrows are centered above the caption');
      assert(rightArrow.x - leftArrow.x - leftArrow.width >= 30, 'Model arrows have a clear gap between them');
      assert.equal(await page.locator('.node-model-root').getByText('拖动查看模型', { exact: true }).count(), 0);
      assert(await canvas.evaluate(c => c === window.__homepageModelCanvas && !c.getContext('webgl2').isContextLost()), 'Switch models without recreating Canvas');
    }
    await page.screenshot({ path: `tmp/homepage-models/${path === '/' ? 'home' : 'preview'}-${width}.png` });
    // Wrap to the default model; previous/next also work with cached models.
    await page.getByRole('button', { name: '下一个模型', exact: true }).click();
    await page.locator('.node-model-caption strong').filter({ hasText: featured[0][1] }).waitFor();
    await page.locator('.node-model-stage[data-model-ready=\"true\"]').waitFor();
    const readZoom = () => page.evaluate(() => {
      const control = window.__homepageModelControls;
      const distance = control.object.position.distanceTo(control.target);
      return { distance, min: control.minDistance, max: control.maxDistance, ratio: distance / (control.minDistance / .75) };
    });
    await canvas.scrollIntoViewIfNeeded();
    const zoomBox = await canvas.boundingBox();
    await page.mouse.move(zoomBox.x + zoomBox.width / 2, zoomBox.y + zoomBox.height / 2);
    const initialZoom = await readZoom();
    const zoomScrollY = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(100);
    assert((await readZoom()).distance < initialZoom.distance, 'Wheel zooms in on homepage model');
    for (let i = 0; i < 24; i++) await page.mouse.wheel(0, -100);
    await page.waitForTimeout(100);
    const nearest = await readZoom();
    assert(Math.abs(nearest.distance - nearest.min) < .001, 'Zoom-in stops at the fitted model limit');
    for (let i = 0; i < 40; i++) await page.mouse.wheel(0, 100);
    await page.waitForTimeout(100);
    const farthest = await readZoom();
    assert(Math.abs(farthest.distance - farthest.max) < .001, 'Zoom-out stops at the fitted model limit');
    assert(Math.abs(await page.evaluate(() => scrollY) - zoomScrollY) < 2, 'Zooming the model does not scroll the page');
    // Leave the model zoomed in for the existing switch/resize/return regressions.
    for (let i = 0; i < 8; i++) await page.mouse.wheel(0, -100);
    await page.waitForTimeout(100);
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
      await page.getByRole('button', { name: '上一个模型', exact: true }).click();
      await page.locator('.node-model-caption strong').filter({ hasText: featured.at(-1)[1] }).waitFor();
      await page.locator('.node-model-stage[data-model-ready=\"true\"]').waitFor();
      await page.getByRole('button', { name: '下一个模型', exact: true }).click();
      await page.locator('.node-model-caption strong').filter({ hasText: featured[0][1] }).waitFor();
      await page.locator('.node-model-stage[data-model-ready=\"true\"]').waitFor();
      await page.waitForTimeout(150);
      const returned = await readDirection();
      assert(angle(beforeSwitch, returned) < .08, `Returning to a model retains its latest orbit (${angle(beforeSwitch, returned)} rad; ${beforeSwitch} -> ${returned})`);
      assert(Math.abs((await readZoom()).ratio - zoomBeforeSwitch.ratio) < .001, 'Returning to a model retains zoom');
      const beforeResize = await readDirection();
      await page.locator('#sidebar-toggle').click();
      await page.waitForTimeout(500);
      assert(angle(beforeResize, await readDirection()) < .08, 'Sidebar resizing retains orbit direction');
      assert(Math.abs((await readZoom()).ratio - zoomBeforeSwitch.ratio) < .001, 'Sidebar resizing retains relative zoom');
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
      assert(Math.abs((await readZoom()).ratio - zoomBeforeSwitch.ratio) < .001, 'Returning home retains model zoom');
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${path} at ${width}px: visible model, live WebGL context`);
    await page.close();
  }
} finally {
  await browser.close();
}
