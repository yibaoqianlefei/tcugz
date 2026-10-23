import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const base = (process.argv[2] ?? 'http://127.0.0.1:5187/').replace(/\/?$/, '/');
const output = process.env.MODEL_LAYOUT_OUTPUT ?? 'audit-output/model-layout-2026-10-21';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const errors = [];
const results = [];
// Resize fitting waits 100ms for the stage, then eases over 280ms.
const settle = page => page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));
const scrollModel = page => page.evaluate(() => {
  const frame = document.querySelector('.curriculum-frame');
  const slot = frame.contentDocument.querySelector('[data-lesson-model="figure-1"]');
  scrollTo(0, scrollY + frame.getBoundingClientRect().top + slot.getBoundingClientRect().top - 90);
});

async function inspectColumns(viewer, width) {
  const inline = await viewer.locator('.lesson-inline-controls').count() > 0;
  const model = await viewer.locator('.lesson-model-visual').boundingBox();
  const cards = await viewer.locator('.lesson-knowledge-panel').boundingBox();
  if (inline) assert.equal(cards, null, 'inline demonstration begins without the optional names panel');
  else if (width > 600) assert(model.x + model.width <= cards.x + 1 && Math.abs(model.y - cards.y) < 2, 'model and name cards form two adjacent columns');
  else assert(model.y + model.height <= cards.y + 1, 'narrow screens stack name cards below the model');
  assert.equal(await viewer.locator('.lesson-knowledge-card *').count(), 0, 'name cards have no prose or nested content');
  assert.equal(await viewer.getByLabel('更多观察视角', { exact: true }).count(), 0, 'extra-view menu is removed');
  const bar = viewer.getByRole('toolbar', { name: '模型控制栏' });
  assert.equal(await bar.count(), 1, 'all model controls share one toolbar');
  const aligned = await bar.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const controls = [...element.querySelectorAll('button,input,summary')].filter(control => control.getBoundingClientRect().width > 0).map(control => {
      const box = control.getBoundingClientRect();
      return { left: box.left, right: box.right, center: box.y + box.height / 2, width: box.width };
    });
    return { left: rect.left, right: rect.right, controls, grid: getComputedStyle(element).display === 'grid' };
  });
  if (inline) assert(aligned.controls.length >= 2 && aligned.controls.length <= 3, 'inline only shows rotation, optional explosion slider and more tools');
  else assert.equal(aligned.controls.length, 8, 'expanded view keeps reset, zoom, explosion, rotation and X-ray controls');
  assert(aligned.controls.every(control => control.left >= aligned.left - 1 && control.right <= aligned.right + 1 && control.width >= 36), 'every control stays inside the unified toolbar');
  const centers = aligned.controls.map(control => control.center);
  if (!aligned.grid) assert(Math.max(...centers) - Math.min(...centers) < 2, 'wide toolbar aligns all controls on one centerline');
  else {
    assert(Math.max(...[0, 1, 2, 6, 7].map(index => centers[index])) - Math.min(...[0, 1, 2, 6, 7].map(index => centers[index])) < 2, 'compact toolbar aligns reset, zoom, rotation and X-ray in the first row');
    assert(Math.max(...centers.slice(3, 6)) - Math.min(...centers.slice(3, 6)) < 2 && centers[3] > centers[0], 'compact toolbar aligns explosion controls in the second row');
  }
}

async function inspectCanvas(stage, label) {
  const canvas = stage.locator('canvas');
  await stage.locator('canvas').waitFor();
  const size = await stage.evaluate(element => {
    const canvas = element.querySelector('canvas');
    const bounds = canvas.getBoundingClientRect();
    return { container: [element.clientWidth, element.clientHeight], css: [bounds.width, bounds.height], buffer: [canvas.width, canvas.height] };
  });
  assert(Math.abs(size.css[0] - size.container[0]) < 1.5 && Math.abs(size.css[1] - size.container[1]) < 1.5, `${label}: CSS canvas follows container, independently of DPR: ${JSON.stringify(size)}`);
  const png = await canvas.screenshot({ path: `${output}/${label}.png`, style: '.lesson-model-gesture{visibility:hidden!important}.lesson-model-stage{border-radius:0!important}' });
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // A fractional screenshot edge can include the stage border. Sample inside
  // the existing four-pixel exclusion, beyond its antialiased outline.
  const backgroundOffset = (8 * info.width + 8) * 4;
  const background = [...data.slice(backgroundOffset, backgroundOffset + 3)];
  let left = info.width, right = 0, top = info.height, bottom = 0, pixels = 0;
  // A locator screenshot composites the rounded stage border at fractional
  // CSS pixels. Exclude only that four-pixel rim, never the model area.
  for (let y = 4; y < info.height - 4; y++) for (let x = 4; x < info.width - 4; x++) {
    const i = (y * info.width + x) * 4;
    if (Math.abs(data[i] - background[0]) + Math.abs(data[i + 1] - background[1]) + Math.abs(data[i + 2] - background[2]) < 40) continue;
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); pixels++;
  }
  assert(pixels > info.width * info.height * 0.01, `${label}: actual model is drawn`);
  assert(left > info.width * .015 && right < info.width * .985 && top > info.height * .015 && bottom < info.height * .985, `${label}: whole model has a visible margin`);
  assert(Math.abs((left + right) / 2 / info.width - .5) < .15 && Math.abs((top + bottom) / 2 / info.height - .5) < .15, `${label}: model stays centered`);
  results.push({ label, ...size, modelPixels: pixels, pixelBounds: [left, top, right, bottom], image: [info.width, info.height] });
}

try {
  for (const dpr of [1, 1.25, 1.5, 2]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: dpr, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}#/lesson/principles/acoustic.html`);
    await page.waitForFunction(() => document.querySelector('.curriculum-frame')?.contentDocument?.documentElement.dataset.modelsEmbedded === 'true');
    const frame = page.frameLocator('.curriculum-frame');
    const inline = frame.locator('[data-lesson-model="figure-1"]');
    await scrollModel(page);
    await inline.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
    await inline.getByRole('button', { name: '暂停旋转', exact: true }).click();
    await page.waitForTimeout(1500);
    assert.equal(await frame.locator('.lesson-figure-notes[open]').count(), 0, 'long inline guidance is collapsed');
    for (const [width, height] of [[1440, 960], [2560, 1440], [1920, 1080], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await scrollModel(page);
      await settle(page);
      await inspectColumns(inline, width);
      await inspectCanvas(inline.locator('.lesson-model-stage'), `inline-${dpr}-${width}`);
    }
    await frame.locator('.lesson-model-link').first().click();
    const dialog = page.locator('dialog[open]');
    const stage = dialog.locator('.lesson-model-stage[data-rendered="true"]');
    await stage.waitFor();
    await dialog.getByRole('button', { name: '暂停旋转', exact: true }).click();
    await page.waitForTimeout(1500);
    assert.equal(await dialog.locator('.lesson-explorer-notes').count(), 0, 'fullscreen begins with the model, without the prose sidebar');
    for (const [width, height] of [[390, 844], [320, 844], [844, 390], [1920, 1080]]) {
      await page.setViewportSize({ width, height });
      await settle(page);
      const box = await dialog.boundingBox();
      assert(Math.abs(box.width - width) < 2 && Math.abs(box.height - height) < 2, 'expanded viewer uses the full viewport');
      await inspectColumns(dialog, width);
      await inspectCanvas(stage, `fullscreen-${dpr}-${width}`);
      const controls = await dialog.locator('.lesson-model-toolbar').boundingBox();
      assert(controls.y >= 0 && controls.y + controls.height <= height, 'model controls remain inside the viewport');
      if (width <= 390) {
        const panel = await dialog.locator('.lesson-media-panel').boundingBox();
        await dialog.getByRole('button', { name: '复位视角', exact: true }).click();
        const parts = await dialog.locator('.lesson-knowledge-panel').boundingBox();
        assert(parts.x >= panel.x && parts.x + parts.width <= panel.x + panel.width, 'part controls fit the narrow panel');
      }
      await page.screenshot({ path: `${output}/screen-${dpr}-${width}.png` });
    }
    await dialog.getByRole('button', { name: '研读说明', exact: true }).click();
    await dialog.locator('.lesson-explorer-notes').waitFor();
    await settle(page);
    await inspectCanvas(stage, `notes-open-${dpr}`);
    await dialog.getByRole('button', { name: '收起研读说明', exact: true }).click();
    await dialog.getByRole('slider', { name: '爆炸程度' }).focus();
    await page.keyboard.press('End');
    await dialog.locator('.lesson-model-part').first().click();
    assert.equal(await dialog.locator('.lesson-model-part').first().getAttribute('aria-pressed'), 'true');
    await dialog.getByRole('slider', { name: '爆炸程度' }).focus();
    await page.keyboard.press('Home');
    await dialog.getByRole('button', { name: '放大模型', exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 960 });
    await settle(page);
    await inspectCanvas(stage, `resize-after-zoom-${dpr}`);
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    await page.close();
    console.log(`Viewer layout verified: DPR ${dpr}, inline, fullscreen, resize and optional panels.`);
  }
  const variantPage = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1.5 });
  await variantPage.goto(`${base}#/lesson/introduction/intro-course-guide.html`);
  await variantPage.waitForFunction(() => document.querySelector('.curriculum-frame')?.contentDocument?.documentElement.dataset.modelsEmbedded === 'true');
  await variantPage.frameLocator('.curriculum-frame').locator('.lesson-model-link').first().click();
  const variantDialog = variantPage.locator('dialog[open]');
  await variantDialog.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
  await variantDialog.getByRole('button', { name: '暂停旋转', exact: true }).click();
  await variantPage.waitForTimeout(1500);
  await variantDialog.locator('.lesson-model-variant-info summary').click();
  const toolbar = await variantDialog.locator('.lesson-model-toolbar').boundingBox();
  const explanation = await variantDialog.locator('.lesson-model-variant-info p').boundingBox();
  assert(toolbar.y + toolbar.height <= 390 && explanation.y + explanation.height <= 390, 'variant description does not push tools outside a short screen');
  await variantPage.screenshot({ path: `${output}/landscape-variant-description.png` });
  await variantDialog.locator('.lesson-model-variant-info summary').click();
  await inspectCanvas(variantDialog.locator('.lesson-model-stage'), 'landscape-variant');
  await variantPage.close();
  const shortPage = await browser.newPage({ viewport: { width: 390, height: 480 } });
  for (const route of ['principles/acoustic.html', 'introduction/intro-course-guide.html']) {
    await shortPage.goto(`${base}#/lesson/${route}`);
    await shortPage.waitForFunction(expected => {
      const frame = document.querySelector('.curriculum-frame');
      return frame?.contentDocument?.documentElement?.dataset.modelsEmbedded === 'true' && frame.contentWindow.location.pathname.endsWith(`/lesson/${expected}`);
    }, route);
    await shortPage.frameLocator('.curriculum-frame').locator('.lesson-model-link').first().click();
    const shortDialog = shortPage.locator('dialog[open]');
    await shortDialog.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
    for (const [width, height] of [[390, 480], [320, 568], [390, 390]]) {
      await shortPage.setViewportSize({ width, height });
      await settle(shortPage);
      await inspectColumns(shortDialog, width);
      const cards = await shortDialog.locator('.lesson-knowledge-panel').boundingBox();
      const tools = await shortDialog.locator('.lesson-explode-controls').boundingBox();
      assert(tools.y + tools.height <= cards.y + 1, 'short-screen cards never overlap explosion controls');
      await shortDialog.locator('.lesson-explode-controls').scrollIntoViewIfNeeded();
      const reachable = await shortDialog.locator('.lesson-explode-controls').boundingBox();
      assert(reachable.y >= 0 && reachable.y + reachable.height <= height, 'explosion controls stay reachable in short windows');
      await shortPage.screenshot({ path: `${output}/short-${route.startsWith('principles') ? 'acoustic' : 'variant'}-${width}-${height}.png` });
    }
    await shortPage.keyboard.press('Escape');
  }
  await shortPage.close();
  assert.deepEqual(errors, []);
  await writeFile(`${output}/layout-result.json`, JSON.stringify({ base, deviceScaleFactors: [1, 1.25, 1.5, 2], results, errors }, null, 2) + '\n');
  console.log(`Model layout checks passed: ${results.length} rendered views, high-DPI dimensions, centering, clipping, fullscreen and collapsed guidance.`);
} finally { await browser.close(); }
