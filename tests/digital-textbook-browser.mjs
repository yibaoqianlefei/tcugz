import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = (process.argv[2] ?? 'http://127.0.0.1:5187/').replace(/\/?$/, '/');
const output = process.env.TEXTBOOK_BROWSER_OUTPUT ?? 'audit-output/model-only-textbook-2026-10-21';
const fullAudit = process.env.MODEL_ONLY_FULL_AUDIT === '1';
await mkdir(`${output}/models`, { recursive: true });
const catalog = JSON.parse(await readFile('src/data/lessonMedia.json', 'utf8'));
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const errors = [];
const drawings = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => { if (/\/images\//.test(request.url()) && new URL(page.url()).hash.startsWith('#/lesson/')) drawings.push(request.url()); });
const ready = async path => {
  await page.goto(`${base}#/lesson/${path}`);
  await page.waitForFunction(expected => {
    const iframe = document.querySelector('.curriculum-frame');
    return iframe?.contentDocument?.readyState === 'complete' && iframe.contentWindow.location.pathname.endsWith(`/lesson/${expected}`) && parseInt(iframe.style.height) > 300 && iframe.contentDocument.documentElement.dataset.modelsEmbedded === 'true';
  }, path);
  return page.frameLocator('.curriculum-frame');
};
const checkOverflow = async () => {
  const widths = await page.evaluate(() => {
    const doc = document.querySelector('.curriculum-frame').contentDocument;
    return { outer: document.documentElement.scrollWidth, viewport: innerWidth, frame: doc.documentElement.scrollWidth, frameWidth: doc.documentElement.clientWidth };
  });
  assert(widths.outer <= widths.viewport + 2 && widths.frame <= widths.frameWidth + 2, `reader fits viewport: ${JSON.stringify(widths)}`);
};
const scrollModel = async (frame, id) => {
  await page.evaluate(id => {
    const iframe = document.querySelector('.curriculum-frame');
    const slot = iframe.contentDocument.querySelector(`[data-lesson-model="${id}"]`);
    const header = document.querySelector('.site-subpage-topbar').getBoundingClientRect().height;
    window.scrollTo({ top: scrollY + iframe.getBoundingClientRect().top + slot.getBoundingClientRect().top - header - 20, behavior: 'instant' });
  }, id);
  const slot = frame.locator(`[data-lesson-model="${id}"]`);
  await slot.locator('.lesson-model-stage[data-rendered="true"]').waitFor({ timeout: 30000 });
  assert.equal(await frame.locator('canvas').count(), 1, 'only the visible inline model has a canvas');
  return slot;
};

try {
  let frame = await ready('introduction/intro-course-guide.html');
  assert.equal(await frame.locator('main img').count(), 0, 'chapter imagery is replaced, including cover and sidebar thumbnails');
  assert.equal(await frame.locator('.lesson-inline-model-slot').count(), 2);
  await page.screenshot({ path: `${output}/reader-desktop.png` });
  const idleButton = frame.locator('[data-lesson-model="figure-2"] [data-model-idle] button');
  await idleButton.focus();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert(await idleButton.evaluate(button => button.isConnected && button.ownerDocument.activeElement === button), 'keyboard focus does not auto-replace an idle button');
  await page.keyboard.press('Enter');
  await frame.locator('[data-lesson-model="figure-2"] .lesson-model-stage[data-rendered="true"]').waitFor();
  assert(await frame.locator('[data-lesson-model="figure-2"]').evaluate(group => group.ownerDocument.activeElement === group), 'activation keeps focus in the named model group');
  await page.keyboard.press('Tab');
  assert(await frame.locator('[data-lesson-model="figure-2"] .lesson-inline-controls button').first().evaluate(button => button.ownerDocument.activeElement === button), 'Tab enters model controls after activation');
  let slot = await scrollModel(frame, 'figure-1');
  assert.equal(await slot.locator('.lesson-model-shell').getAttribute('data-node-id'), 'independent-foundation-01');
  assert.equal(await slot.getByLabel('更多模型操作', { exact: true }).count(), 0, 'reading page keeps only rotate and explode');
  assert(await slot.locator('.lesson-knowledge-panel').isVisible(), 'component names stay under the model without a toggle');
  await slot.locator('.lesson-model-part').first().click();
  assert.equal(await slot.locator('.lesson-model-part').first().getAttribute('aria-pressed'), 'true');
  assert.equal(await slot.locator('.lesson-knowledge-card *').count(), 0, 'cards contain only component names');
  assert.equal(await slot.getByRole('slider', { name: '爆炸程度' }).count(), 0, 'no unusable explosion control for an undivided foundation model');
  assert.equal(await slot.getByLabel('更多观察视角', { exact: true }).count(), 0, 'extra-view menu is removed');
  await slot.locator('.lesson-model-variants select').selectOption({ index: 1 });
  await slot.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
  assert((await slot.locator('.lesson-knowledge-panel').innerText()).includes('阶梯'));
  await checkOverflow();
  await page.screenshot({ path: `${output}/inline-model-desktop.png` });
  // Reading can continue with the wheel even when it is over a live canvas.
  await slot.locator('canvas').hover();
  const wheelBefore = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 180);
  await page.waitForFunction(before => scrollY > before + 50, wheelBefore);

  const trigger = frame.locator('.lesson-model-link').first();
  await trigger.scrollIntoViewIfNeeded();
  const beforeScroll = await page.evaluate(() => scrollY);
  await trigger.focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(/#\/node\/independent-foundation-01\?/);
  await page.locator('.node-detail-page canvas').waitFor();
  assert.equal(await page.locator('.curriculum-frame').count(), 0, 'leaving the reader releases its inline canvas');
  assert.equal(await page.locator('.site-back-link span:last-child').innerText(), '返回教材章节');
  await page.screenshot({ path: `${output}/node-from-textbook-desktop.png` });
  await page.locator('.site-back-link').click();
  await page.waitForFunction(before => document.querySelector('.curriculum-frame')?.contentDocument?.documentElement?.dataset.modelsEmbedded === 'true' && Math.abs(scrollY - before) < 4, beforeScroll);
  frame = page.frameLocator('.curriculum-frame');
  assert(await frame.locator('.lesson-model-link').first().evaluate(element => element.ownerDocument.activeElement === element), 'returning restores keyboard focus');
  await scrollModel(frame, 'figure-2');
  assert.equal(await frame.locator('[data-lesson-model="figure-1"] canvas').count(), 0, 'offscreen model is released');
  await frame.locator('.lesson-answer summary').click();
  assert((await frame.locator('.lesson-answer').innerText()).includes('参考答案：'));
  assert(Number(await page.getByRole('progressbar', { name: '本节阅读进度' }).getAttribute('aria-valuenow')) > 0);

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    frame = await ready('basics/floor/floor-rc-slab.html');
    slot = await scrollModel(frame, 'figure-3');
    await checkOverflow();
    await page.screenshot({ path: `${output}/inline-model-${width}.png` });
    await frame.locator('#figure-3 .lesson-model-link').click();
    await page.locator('.node-detail-page canvas').waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: `${output}/node-from-textbook-${width}.png` });
    await page.locator('.site-back-link').click();
    await page.waitForFunction(() => document.querySelector('.curriculum-frame')?.contentDocument?.documentElement?.dataset.modelsEmbedded === 'true');
  }

  let placements = 0;
  const rendered = new Set();
  const models = [];
  for (const lesson of Object.values(catalog)) {
    frame = await ready(lesson.path);
    await checkOverflow();
    assert.equal(await frame.locator('main img').count(), 0, `no pictures in ${lesson.path}`);
    assert.equal(await frame.locator('.lesson-inline-model-slot').count(), lesson.figures.length);
    for (const figure of lesson.figures) {
      const anchor = frame.locator(`#${figure.id} [data-lesson-model="${figure.id}"]`);
      assert.equal(await anchor.getAttribute('data-node-id'), figure.nodeId, 'same audited node at the same section');
      placements++;
      if (!fullAudit || rendered.has(figure.nodeId)) continue;
      slot = await scrollModel(frame, figure.id);
      if (figure.nodeId === 'construction-column-01') {
        const observable = await slot.locator('.lesson-model-part[data-visible="true"]').allTextContents();
        assert(!observable.some(name => /混凝土柱子|楼板|圈梁|马牙槎/.test(name)), 'collapsed later construction stages are not offered as currently visible parts');
        assert(observable.some(name => /钢筋/.test(name)) && observable.some(name => /墙体/.test(name)), 'exposed reinforcement and masonry remain observable');
        assert.equal(await slot.locator('.lesson-knowledge-card').count(), 7, 'authored future stages retain their name cards');
        assert.equal(await slot.locator('.lesson-model-part:enabled').count(), 0, 'animated picking waits for the fully expanded pose, matching the node page');
      }
      const select = slot.locator('.lesson-model-variants select');
      const variants = await select.count() ? await select.locator('option').evaluateAll(options => options.map(option => ({ id: option.value, title: option.textContent }))) : [{ id: 'single', title: figure.nodeTitle }];
      for (const variant of variants) {
        if (variant.id !== 'single') {
          await select.selectOption(variant.id);
          await slot.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
        }
        const screenshot = `${output}/models/${figure.nodeId}-${variant.id}.png`;
        await slot.locator('.lesson-model-stage').screenshot({ path: screenshot });
        models.push({ nodeId: figure.nodeId, variant: variant.id, title: variant.title, lesson: lesson.key, figureId: figure.id, screenshot, rendered: true });
      }
      rendered.add(figure.nodeId);
      console.log(`Inline model verified: ${figure.nodeId} (${rendered.size}/42)`);
    }
  }
  assert.equal(placements, 85);
  if (fullAudit) { assert.equal(rendered.size, 42); assert.equal(models.length, 46); }
  assert.deepEqual(drawings, [], 'reading chapters never request a construction image');
  assert.deepEqual(errors, [], 'no runtime errors');

  await page.setViewportSize({ width: 1440, height: 900 });
  const firstModel = '**/models/foundation/independent-foundation/**';
  await page.route(firstModel, route => route.abort());
  frame = await ready('introduction/intro-course-guide.html');
  await page.evaluate(() => {
    const iframe = document.querySelector('.curriculum-frame');
    const slot = iframe.contentDocument.querySelector('[data-lesson-model="figure-1"]');
    scrollTo(0, scrollY + iframe.getBoundingClientRect().top + slot.getBoundingClientRect().top - 90);
  });
  await frame.locator('.lesson-model-fallback[role="alert"]').waitFor();
  await page.unroute(firstModel);
  await frame.getByRole('button', { name: '重新加载', exact: true }).click();
  await frame.locator('.lesson-model-stage[data-rendered="true"]').waitFor();

  const fallback = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await fallback.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.startsWith('webgl') ? null : getContext.call(this, type, ...args); };
  });
  await fallback.goto(`${base}#/lesson/introduction/intro-course-guide.html`);
  await fallback.waitForFunction(() => document.querySelector('.curriculum-frame')?.contentDocument?.documentElement.dataset.modelsEmbedded === 'true');
  const fallbackFrame = fallback.frameLocator('.curriculum-frame');
  await fallbackFrame.locator('.lesson-model-link').first().scrollIntoViewIfNeeded();
  await fallbackFrame.getByText('当前设备无法开启三维视图', { exact: true }).waitFor();
  await fallbackFrame.locator('.lesson-model-link').first().click();
  await fallback.locator('.node-detail-page').waitFor();
  await fallback.locator('.site-back-link').click();
  await fallback.waitForFunction(() => document.querySelector('.curriculum-frame')?.contentDocument?.documentElement?.dataset.modelsEmbedded === 'true');
  assert(await fallbackFrame.locator('.article').isVisible(), 'text remains readable without WebGL');
  await fallback.close();

  const brokenModule = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await brokenModule.route('**/LessonModelViewer*', route => route.abort());
  await brokenModule.goto(`${base}#/lesson/introduction/intro-course-guide.html`);
  await brokenModule.waitForFunction(() => document.querySelector('.curriculum-frame')?.contentDocument?.documentElement.dataset.modelsEmbedded === 'true');
  const brokenFrame = brokenModule.frameLocator('.curriculum-frame');
  await brokenFrame.locator('.lesson-model-link').first().scrollIntoViewIfNeeded();
  await brokenFrame.getByText('模型界面暂时无法加载', { exact: true }).waitFor();
  const refresh = brokenFrame.getByRole('button', { name: '刷新页面重试' });
  await refresh.focus();
  await brokenModule.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert(await refresh.evaluate(button => button.ownerDocument.activeElement === button), 'error recovery button retains focus');
  assert(await brokenFrame.locator('.article').isVisible(), 'a failed viewer module does not remove textbook prose');
  await brokenFrame.locator('.lesson-model-link').first().click();
  await brokenModule.locator('.node-detail-page canvas').waitFor();
  await brokenModule.locator('.site-back-link').click();
  await brokenModule.waitForFunction(() => document.querySelector('.curriculum-frame')?.contentDocument?.documentElement?.dataset.modelsEmbedded === 'true');
  await brokenModule.close();

  await writeFile(`${output}/${fullAudit ? 'browser-result' : 'browser-smoke-result'}.json`, JSON.stringify({ lessons: 54, placements, widths: [1440, 390, 320], models, verified: ['inline-canvas', 'single-active-context', 'automatic-viewport-loading', 'model-variants-and-parts', 'wheel-reading', 'keyboard-node-entry', 'idle-keyboard-focus', 'chapter-focus-and-scroll-return', '54-picture-free-readers', 'model-error-retry', 'viewer-module-error-isolation', 'no-webgl-text-fallback'], errors }, null, 2) + '\n');
  console.log(`Model-only textbook browser checks passed: 54 lessons, ${placements} placements${fullAudit ? ', 42 nodes / 46 variants rendered' : ''}, inline controls, node navigation, mobile layouts, retry and text fallback.`);
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  console.error('At route:', page.url());
  throw error;
} finally { await browser.close(); }
