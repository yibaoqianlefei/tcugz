import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const open = mode => page.goto(`${base}/#/games${mode ? '/' + mode : ''}`);
const ready = () => page.locator('.training-task .training-status').waitFor({ state: 'detached' });
const submit = () => page.getByRole('button', { name: '提交答案', exact: true }).click();
const passed = () => page.locator('.training-feedback.correct').waitFor();
try {
  await open('');
  await page.locator('.training-mode-card').last().scrollIntoViewIfNeeded();
  const listY = await page.evaluate(() => scrollY);
  await page.getByRole('link', { name: '开始模型构件辨识', exact: true }).scrollIntoViewIfNeeded();
  const actualListY = await page.evaluate(() => scrollY);
  await page.getByRole('link', { name: '开始模型构件辨识', exact: true }).click();
  await ready();
  const canvas = page.locator('.training-model-stage canvas');
  await canvas.evaluate(canvas => { window.__trainingCanvas = canvas; });
  // Use the actual model marker, not an answer setter, to exercise R3F/HTML linkage.
  await page.locator('.training-model-stage').getByRole('button', { name: '选取构件 C', exact: true }).click();
  await submit();
  await page.locator('.training-feedback.incorrect').waitFor();
  await page.getByRole('button', { name: '重新作答', exact: true }).click();
  await page.locator('.training-model-stage').getByRole('button', { name: '选取构件 B', exact: true }).click();
  await submit();
  await passed();
  assert(await canvas.evaluate(canvas => canvas === window.__trainingCanvas), 'Answer/retry retains model canvas');
  await page.reload();
  await passed();
  await page.getByRole('link', { name: '返回训练中心', exact: true }).first().click();
  await page.locator('.training-mode-grid').waitFor();
  assert(Math.abs(await page.evaluate(() => scrollY) - actualListY) < 2, 'Explicit training return restores catalog position');
  assert(await page.locator('.training-mistake-list').getByText('找到檐沟').count());
  console.log(`PASS identification, retry, reload persistence, catalog return (${actualListY}px; page range ${listY}px)`);

  await open('match');
  await ready();
  for (const [name, value] of [['屋面顶', 'roof-flow'], ['檐沟', 'collect'], ['檐沟分水', 'divide'], ['排水口', 'outflow']]) await page.getByRole('combobox', { name: `${name}的作用` }).selectOption(value);
  await submit();
  await passed();
  console.log('PASS functional matching');

  await open('order');
  await ready();
  await page.getByRole('button', { name: '上移结构层', exact: true }).click({ clickCount: 1 });
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: '上移结构层', exact: true }).click();
  await submit();
  await passed();
  console.log('PASS layer sorting by keyboard-accessible controls');

  await open('diagram');
  await ready();
  assert.equal(await page.locator('.training-diagram-image > span').textContent(), '1');
  await page.locator('.training-component-choices').getByRole('button', { name: 'D' }).click();
  await submit();
  await passed();
  console.log('PASS diagram/model correspondence');

  await open('path');
  await ready();
  for (const name of ['A 屋面顶', 'B 檐沟', 'C 排水口']) await page.locator('.training-component-choices').getByRole('button', { name, exact: true }).click();
  await submit();
  await passed();
  await page.getByRole('button', { name: '查看正确路径' }).click();
  console.log('PASS path tracing');

  await open('scenario');
  await ready();
  await page.getByRole('radio', { name: '杯形基础', exact: true }).check();
  await page.getByRole('radio', { name: '顶部设杯口，能容纳插入的预制柱柱脚' }).check();
  await submit();
  await passed();
  await page.getByRole('button', { name: '下一题', exact: true }).click();
  await ready();
  await page.getByRole('radio', { name: '锥形基础', exact: true }).check();
  await ready();
  await page.getByRole('radio', { name: '台身以斜边连续收分，顶面呈斜坡' }).check();
  await submit();
  await passed();
  console.log('PASS scenario comparison with actual model switch');

  await open('diagnose');
  await ready();
  await page.getByRole('radio', { name: '排水口', exact: true }).check();
  await page.getByRole('radio', { name: '檐沟中的雨水缺少对应出口' }).check();
  await submit();
  await passed();
  console.log('PASS missing-component diagnosis');

  await open('assemble');
  await ready();
  for (const [part, slot] of [['屋面顶', '屋面位置'], ['檐沟', '檐口沟槽位置'], ['檐沟分水', '沟内分水位置'], ['排水口', '沟底出口位置']]) {
    await page.getByRole('radio', { name: part, exact: true }).check();
    await page.locator('.training-slot').filter({ hasText: slot }).click();
  }
  await submit();
  await passed();
  console.log('PASS guided 3D assembly');

  await mkdir('tmp/training-audit', { recursive: true });
  await page.screenshot({ path: 'tmp/training-audit/assembly-desktop.png', fullPage: true });
  await open('');
  await page.screenshot({ path: 'tmp/training-audit/catalog-desktop.png', fullPage: true });
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const mode of ['', 'identify', 'order', 'diagram', 'assemble']) {
      await open(mode);
      if (mode) await ready();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${mode} at ${width}: no horizontal overflow`);
    }
    console.log(`PASS training layout at ${width}px`);
  }
  await page.screenshot({ path: 'tmp/training-audit/assembly-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);

  // A failed training asset must be retryable without resetting the answer.
  const retryPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let requests = 0;
  await retryPage.route('**/construction-column.glb', route => ++requests === 1 ? route.abort() : route.continue());
  await retryPage.goto(`${base}/#/games/identify?question=identify-stirrup`);
  await retryPage.locator('.training-model-error').waitFor();
  assert(await retryPage.getByRole('button', { name: '提交答案', exact: true }).isDisabled());
  await retryPage.getByRole('button', { name: '重新加载模型', exact: true }).click();
  await retryPage.locator('.training-task .training-status').waitFor({ state: 'detached' });
  await retryPage.locator('.training-component-choices').getByRole('button', { name: 'B', exact: true }).click();
  await retryPage.getByRole('button', { name: '提交答案', exact: true }).click();
  await retryPage.locator('.training-feedback.correct').waitFor();
  assert.equal(requests, 2);
  await retryPage.close();
  console.log('PASS failed model load, disabled submission, retry and resumed practice');

  // Entering the new module must preserve the existing homepage instance.
  const home = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let homeModelRequests = 0;
  const homeErrors = [];
  home.on('pageerror', error => homeErrors.push(error.message));
  home.on('request', request => { if (request.url().endsWith('/organized-drainage.glb')) homeModelRequests++; });
  await home.goto(`${base}/`);
  const homeCanvas = home.locator('#node-model-root canvas');
  await homeCanvas.scrollIntoViewIfNeeded();
  await home.locator('.node-model-hint').waitFor();
  await homeCanvas.evaluate(canvas => { window.__retainedHomeCanvas = canvas; });
  await home.locator('#sidebar-toggle').click();
  await home.locator('#introduction').scrollIntoViewIfNeeded();
  await home.waitForTimeout(100);
  const homeY = await home.evaluate(() => scrollY);
  await home.locator('a[href$="#/games"]').first().click();
  await home.locator('.training-mode-grid').waitFor();
  await home.getByRole('link', { name: '开始模型构件辨识', exact: true }).click();
  await home.locator('.training-task .training-status').waitFor({ state: 'detached' });
  await home.locator('.site-subpage-brand').click();
  await home.waitForFunction(() => document.body.scrollHeight > 1800);
  const returnedY = await home.evaluate(() => scrollY);
  assert(Math.abs(returnedY - homeY) < 2, `Training return retains homepage scroll: expected ${homeY}, got ${returnedY}`);
  assert(await home.locator('.app').evaluate(element => element.classList.contains('sidebar-collapsed')));
  assert(await homeCanvas.evaluate(canvas => canvas === window.__retainedHomeCanvas && !canvas.getContext('webgl2').isContextLost()));
  assert.equal(homeModelRequests, 1, 'Training must not reload homepage model');
  assert.deepEqual(homeErrors, []);
  await home.close();
  console.log('PASS training return retains homepage canvas, sidebar and content position');
} finally { await browser.close(); }
