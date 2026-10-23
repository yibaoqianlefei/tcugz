import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const base = (process.argv[2] ?? 'http://127.0.0.1:5187/').replace(/\/?$/, '/');
const output = process.env.LESSON_ROTATION_OUTPUT ?? 'audit-output/lesson-rotation-2026-10-21';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const results = [];
const settle = async () => { await page.mouse.move(1, 1); await page.waitForTimeout(1500); };
const style = locator => locator.evaluate(element => {
  const css = getComputedStyle(element);
  return Object.fromEntries(['backgroundColor', 'color', 'borderTopColor', 'borderTopWidth', 'borderTopLeftRadius', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'paddingTop', 'paddingLeft'].map(name => [name, css[name]]));
});
const buttonStyle = async locator => ({ ...await style(locator), ...await locator.evaluate(element => {
  const css = getComputedStyle(element);
  const icon = getComputedStyle(element.querySelector('svg'));
  return { width: css.width, height: css.height, iconWidth: icon.width, iconStroke: icon.strokeWidth };
}) });
async function difference(left, right) {
  const a = await sharp(left).removeAlpha().raw().toBuffer();
  const b = await sharp(right).removeAlpha().raw().toBuffer();
  assert.equal(a.length, b.length);
  let changed = 0;
  for (let i = 0; i < a.length; i += 3) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 30) changed++;
  return changed / (a.length / 3);
}
async function readyLesson(path = 'principles/acoustic.html') {
  await page.goto(`${base}#/lesson/${path}`);
  await page.waitForFunction(expected => {
    const frame = document.querySelector('.curriculum-frame');
    return frame?.contentDocument?.documentElement?.dataset.modelsEmbedded === 'true' && frame.contentWindow.location.pathname.endsWith(`/lesson/${expected}`);
  }, path);
  return page.frameLocator('.curriculum-frame');
}
async function testMotion(scope, label) {
  const stage = scope.locator('.lesson-model-stage');
  const toggle = scope.getByRole('button', { name: '暂停旋转', exact: true });
  assert.equal(await toggle.getAttribute('aria-pressed'), 'true', 'rotation starts enabled, matching the node page');
  await page.mouse.move(1, 1);
  const initial = await stage.screenshot();
  await page.waitForTimeout(1800);
  const rotating = await stage.screenshot();
  const moving = await difference(initial, rotating);
  assert(moving > .005, `${label}: the actual rendered model rotates (${moving})`);
  await toggle.click();
  const start = scope.getByRole('button', { name: '开启旋转', exact: true });
  assert.equal(await start.getAttribute('aria-pressed'), 'false');
  await settle();
  const paused = await stage.screenshot();
  await page.waitForTimeout(1000);
  const pausedDifference = await difference(paused, await stage.screenshot());
  assert(pausedDifference < .002, `${label}: pause holds the actual view (${pausedDifference})`);
  await start.focus();
  await page.keyboard.press('Enter');
  await scope.getByRole('button', { name: '暂停旋转', exact: true }).waitFor();
  await page.mouse.move(1, 1);
  await page.waitForTimeout(1800);
  const resumedDifference = await difference(paused, await stage.screenshot());
  assert(resumedDifference > .005, `${label}: keyboard resume restores automatic motion`);
  await scope.getByRole('button', { name: '暂停旋转', exact: true }).click();
  await settle();
  results.push({ label, moving, pausedDifference, resumedDifference });
}

try {
  let frame = await readyLesson();
  await page.evaluate(() => {
    const frame = document.querySelector('.curriculum-frame');
    const slot = frame.contentDocument.querySelector('[data-lesson-model="figure-1"]');
    scrollTo(0, scrollY + frame.getBoundingClientRect().top + slot.getBoundingClientRect().top - 90);
  });
  let inline = frame.locator('[data-lesson-model="figure-1"]');
  await inline.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
  await testMotion(inline, 'inline');
  await inline.locator('canvas').hover();
  const beforeWheel = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 150);
  await page.waitForFunction(before => scrollY > before + 40, beforeWheel);
  await frame.locator('.lesson-model-link').first().click();
  const dialog = page.locator('dialog[open]');
  await dialog.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
  await testMotion(dialog, 'fullscreen');
  const slider = dialog.getByRole('slider', { name: '爆炸程度' });
  await slider.focus(); await page.keyboard.press('End');
  await dialog.locator('.lesson-model-viewer[data-explode-progress="1.000"]').waitFor();
  await dialog.getByRole('button', { name: '开启旋转', exact: true }).click();
  const expanded = await dialog.locator('.lesson-model-stage').screenshot();
  await page.waitForTimeout(1500);
  assert(await difference(expanded, await dialog.locator('.lesson-model-stage').screenshot()) > .005, 'auto rotation also works while exploded');
  assert(await dialog.locator('.lesson-knowledge-card:enabled').count() > 0, 'expanded model keeps component interaction during rotation');
  assert.equal(await dialog.locator('.lesson-knowledge-card *').count(), 0, 'rotating model still has name-only cards');
  await dialog.getByRole('button', { name: '暂停旋转', exact: true }).click();
  await settle();
  await page.screenshot({ path: `${output}/fullscreen-exploded.png` });
  await page.keyboard.press('Escape');

  for (const width of [1440, 1024, 768, 760, 390, 320]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto(`${base}#/node/window-wall-gap-sealing-01`);
    await page.locator('.node-control-bar').waitFor();
    const nodeToggle = page.getByRole('button', { name: '暂停旋转', exact: true });
    await nodeToggle.waitFor();
    await settle();
    const activeStyle = await buttonStyle(nodeToggle);
    const nodeSliderStyle = await page.locator('.node-explode-slider').evaluate(element => ({ background: getComputedStyle(element).backgroundColor, borderRadius: getComputedStyle(element).borderRadius, appearance: getComputedStyle(element).appearance }));
    await nodeToggle.click();
    await settle();
    const inactiveStyle = await buttonStyle(page.getByRole('button', { name: '开启旋转', exact: true }));
    if (width <= 760) await page.getByRole('tab', { name: '构件知识', exact: true }).click();
    const nodeHeader = page.locator('.node-knowledge .model-knowledge-header').first();
    await nodeHeader.scrollIntoViewIfNeeded();
    await page.mouse.move(1, 1); await page.waitForTimeout(250);
    const headerStyle = await style(nodeHeader);
    const nodeDot = await nodeHeader.locator('.model-component-name').evaluate(element => getComputedStyle(element, '::before').backgroundColor);
    await nodeHeader.click(); await page.mouse.move(1, 1); await page.waitForTimeout(250);
    const selectedHeader = await style(nodeHeader);
    if (width <= 760) await page.getByRole('tab', { name: '3D 模型', exact: true }).click();
    const nodeControls = await page.locator('.node-control-button').evaluateAll(elements => elements.map(element => { const rect = element.getBoundingClientRect(); return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height }; }));
    assert(nodeControls.every(rect => rect.x >= 0 && rect.right <= width + 1 && rect.bottom <= 960), `node controls retain their layout at ${width}`);
    if (width <= 760) assert(nodeControls.every(rect => rect.width >= 44 && rect.height >= 44));

    frame = await readyLesson();
    if ([1440, 390, 320].includes(width)) {
      await page.evaluate(() => {
        const frame = document.querySelector('.curriculum-frame');
        const slot = frame.contentDocument.querySelector('[data-lesson-model="figure-1"]');
        scrollTo(0, scrollY + frame.getBoundingClientRect().top + slot.getBoundingClientRect().top - 90);
      });
      inline = frame.locator('[data-lesson-model="figure-1"]');
      await inline.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
      await page.mouse.move(1, 1); await page.waitForTimeout(250);
      assert.deepEqual(await buttonStyle(inline.getByRole('button', { name: '暂停旋转', exact: true })), activeStyle, `inline rotation UI matches node at ${width}`);
      await inline.getByRole('button', { name: '暂停旋转', exact: true }).click();
      await inline.getByRole('slider', { name: '爆炸程度' }).focus();
      await page.keyboard.press('End');
      await settle();
      assert.deepEqual(await style(inline.locator('.lesson-knowledge-card:enabled').first()), headerStyle, `inline name-card UI matches node at ${width}`);
    }
    await frame.locator('.lesson-model-link').first().click();
    await dialog.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
    await page.mouse.move(1, 1); await page.waitForTimeout(250);
    assert.deepEqual(await buttonStyle(dialog.getByRole('button', { name: '暂停旋转', exact: true })), activeStyle, `active rotation UI matches node at ${width}`);
    await dialog.getByRole('button', { name: '暂停旋转', exact: true }).click();
    await settle();
    assert.deepEqual(await buttonStyle(dialog.getByRole('button', { name: '开启旋转', exact: true })), inactiveStyle, `paused rotation UI matches node at ${width}`);
    assert.deepEqual(await dialog.locator('.model-explode-slider').evaluate(element => ({ background: getComputedStyle(element).backgroundColor, borderRadius: getComputedStyle(element).borderRadius, appearance: getComputedStyle(element).appearance })), nodeSliderStyle, `slider UI matches node at ${width}`);
    await dialog.getByRole('slider', { name: '爆炸程度' }).focus();
    await page.keyboard.press('End');
    const card = dialog.locator('.lesson-knowledge-card:enabled').first();
    await card.scrollIntoViewIfNeeded(); await page.mouse.move(1, 1); await page.waitForTimeout(250);
    const lessonHeader = await style(card);
    // Short-screen horizontal strips adjust spacing to keep controls reachable.
    assert.deepEqual(lessonHeader, headerStyle, `name-card header UI matches node at ${width}`);
    assert.equal(await card.evaluate(element => getComputedStyle(element, '::before').backgroundColor), nodeDot, 'same component marker');
    assert.equal(await dialog.locator('.lesson-knowledge-card *').count(), 0, 'reader cards keep only the name');
    await card.click(); await page.mouse.move(1, 1); await page.waitForTimeout(250);
    assert.deepEqual(await style(card), selectedHeader, `selected card header UI matches node at ${width}`);
    await page.screenshot({ path: `${output}/aligned-${width}.png` });
    results.push({ width, activeStyle, inactiveStyle, headerStyle, selectedHeader, nodeControls });
    await page.keyboard.press('Escape');
  }

  await page.setViewportSize({ width: 1440, height: 960 });
  frame = await readyLesson('introduction/intro-course-guide.html');
  await frame.locator('.lesson-model-link').first().click();
  await dialog.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
  await dialog.getByRole('button', { name: '暂停旋转', exact: true }).click();
  await dialog.locator('.lesson-model-variants select').selectOption({ index: 1 });
  await dialog.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
  assert.equal(await dialog.getByRole('button', { name: '开启旋转', exact: true }).getAttribute('aria-pressed'), 'false', 'changing a model variant preserves pause preference');
  assert(await dialog.getByRole('slider', { name: '爆炸程度' }).isDisabled());
  assert(await dialog.getByRole('button', { name: '开启旋转', exact: true }).isEnabled(), 'static model can still rotate');
  await page.keyboard.press('Escape');
  assert.deepEqual(errors, []);
  await writeFile(`${output}/rotation-ui-result.json`, JSON.stringify({ base, results, verified: ['inline-and-fullscreen-default-motion', 'pause-pixels', 'keyboard-resume', 'rotation-while-exploded', 'interactive-name-only-cards', 'six-width-node-reader-style-parity', 'variant-pause-preference', 'wheel-reading'], errors }, null, 2) + '\n');
  console.log('PASS lesson rotation: actual motion/pause/resume, exploded gate, static/variant models, and shared node/reader controls/cards across six widths.');
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  console.error('At route:', page.url());
  throw error;
} finally { await browser.close(); }
