import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true });
await mkdir('tmp/homepage-training', { recursive: true });
try {
  for (const path of ['/', '/previews/homepage-v1.html']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    let modelRequests = 0;
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.url().endsWith('/eaves-gutter.glb')) modelRequests++; });
    await page.goto(`${base}${path}`);
    const preview = page.locator('.practice-preview');
    await preview.waitFor({ state: 'attached' });
    assert.equal(modelRequests, 0, 'Training model is not requested on the initial homepage slide');
    const originalProgress = await page.evaluate(() => localStorage.getItem('construction-training-v1'));
    await page.locator('#hero-next').click();
    await page.locator('#hero-next').click();
    const choices = preview.locator('.practice-preview-choices');
    await choices.getByRole('button', { name: 'A', exact: true }).waitFor();
    await page.waitForFunction(() => !document.querySelector('.practice-preview-choices button').disabled);
    const canvas = preview.locator('canvas');
    await canvas.scrollIntoViewIfNeeded();
    await canvas.evaluate(element => { window.__practiceCanvas = element; });
    const pixels = await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer();
    let drawn = 0;
    for (let i = 0; i < pixels.length; i += 3) if (pixels[i] < 150 && pixels[i + 1] < 150 && pixels[i + 2] < 150) drawn++;
    assert(drawn > 250, 'Training model must actually render');
    await preview.getByRole('button', { name: '分开观察', exact: true }).click();
    await preview.getByRole('button', { name: '合拢观察', exact: true }).click();
    assert(await preview.getByRole('button', { name: '提交答案', exact: true }).isDisabled());
    await choices.getByRole('button', { name: 'A', exact: true }).click();
    await preview.getByRole('button', { name: '提交答案', exact: true }).click();
    await preview.locator('.practice-preview-feedback.is-incorrect').waitFor();
    await preview.getByRole('button', { name: '再试一次', exact: true }).click();
    await preview.locator('.training-model-markers').getByRole('button', { name: '选取构件 B', exact: true }).click();
    await preview.getByRole('button', { name: '提交答案', exact: true }).click();
    await preview.locator('.practice-preview-feedback.is-correct').waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('construction-training-v1')), originalProgress, 'Homepage trial does not change full training records');
    await page.locator('#hero-prev').click();
    await page.locator('#hero-next').click();
    await page.locator('#sidebar-toggle').click();
    assert(await canvas.evaluate(element => element === window.__practiceCanvas && !element.getContext('webgl2').isContextLost()));
    assert.equal(modelRequests, 1, 'Changing slides and sidebar does not reload the training model');
    await page.screenshot({ path: `tmp/homepage-training/${path === '/' ? 'formal' : 'standalone'}-desktop.png`, fullPage: true });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await canvas.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} at ${width}: no horizontal overflow`);
    }
    await canvas.evaluate(element => {
      const touch = x => new Touch({ identifier: 1, target: element, clientX: x, clientY: 180 });
      element.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, changedTouches: [touch(230)] }));
      element.dispatchEvent(new TouchEvent('touchend', { bubbles: true, changedTouches: [touch(80)] }));
    });
    assert.equal(await preview.locator('xpath=ancestor::article').getAttribute('aria-hidden'), 'false', 'Touching the model must not swipe the homepage carousel');
    await preview.screenshot({ path: `tmp/homepage-training/${path === '/' ? 'formal' : 'standalone'}-mobile.png` });
    if (path === '/') {
      await preview.getByRole('link', { name: '继续这项训练', exact: true }).click();
      await page.locator('.training-workbench-heading h1').filter({ hasText: '找到檐沟' }).waitFor();
      await page.locator('.site-subpage-brand').click();
      await preview.locator('.practice-preview-feedback.is-correct').waitFor();
      assert(await canvas.evaluate(element => element === window.__practiceCanvas && !element.getContext('webgl2').isContextLost()));
      assert.equal(modelRequests, 1, 'Returning from full training retains homepage scene and trial state');
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${path}: shared question, actual model, lazy loading, feedback, canvas/state preservation and responsive layout`);
    await page.close();
  }
  const retryPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  let requests = 0;
  await retryPage.route('**/eaves-gutter.glb', route => ++requests === 1 ? route.abort() : route.continue());
  await retryPage.goto(`${base}/`);
  await retryPage.locator('.practice-preview').waitFor({ state: 'attached' });
  await retryPage.locator('#hero-next').click();
  await retryPage.locator('#hero-next').click();
  await retryPage.locator('.practice-preview .training-model-error').waitFor();
  assert(await retryPage.locator('.practice-preview-choices button').first().isDisabled());
  await retryPage.getByRole('button', { name: '重新加载模型', exact: true }).click();
  await retryPage.waitForFunction(() => !document.querySelector('.practice-preview-choices button').disabled);
  assert.equal(requests, 2);
  console.log('PASS homepage training model error and retry');
  await retryPage.close();
} finally { await browser.close(); }
