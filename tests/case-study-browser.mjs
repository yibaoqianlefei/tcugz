import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const base = (process.argv[2] ?? 'http://127.0.0.1:5173').replace(/\/$/, '');
const browser = await chromium.launch({ headless: true });
await mkdir('tmp/case-study', { recursive: true });
try {
  for (const path of ['/', '/previews/homepage-v1.html']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}${path}`);
    const experience = page.locator('#case-preview-root .case-experience');
    await experience.waitFor({ state: 'attached' });
    assert.equal(await experience.locator('canvas').count(), 0, 'The case canvas is deferred until its slide is visited');
    await page.locator('#hero-next').click();
    const canvas = experience.locator('canvas'); await canvas.waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('.case-model-markers button')].some(button => button.style.left));
    const before = await sharp(await canvas.screenshot()).raw().toBuffer();
    let dark = 0; for (const channel of before) if (channel < 160) dark++;
    assert(dark > 500, 'The building must render real geometry');
    await canvas.evaluate(element => { window.__caseCanvas = element; });
    const tabs = experience.locator('.case-topic-tabs');
    await tabs.getByRole('button', { name: '02 水平长窗' }).click();
    await experience.locator('.case-experience-caption').getByText('结构与围护分离').waitFor();
    assert(await experience.getByRole('button', { name: '观察水平长窗' }).getAttribute('aria-pressed') === 'true');
    assert(!before.equals(await sharp(await canvas.screenshot()).raw().toBuffer()), 'Selecting the window changes the model highlight');
    await experience.getByRole('button', { name: '观察屋顶露台' }).click();
    await experience.locator('.case-experience-caption').getByText('屋顶与室外生活').waitFor();
    await page.locator('#sidebar-toggle').click();
    await page.waitForFunction(() => document.querySelector('.app').classList.contains('sidebar-collapsed'));
    await page.waitForTimeout(800);
    await page.locator('#hero-next').click(); await page.locator('#hero-prev').click();
    assert(await canvas.evaluate(element => element === window.__caseCanvas && !element.getContext('webgl2').isContextLost()));
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.6);
    await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.42, box.y + box.height * 0.54, { steps: 15 }); await page.mouse.up();
    await page.waitForTimeout(700);
    await experience.screenshot({ path: `tmp/case-study/${path === '/' ? 'home' : 'preview'}-desktop.png` });
    if (path === '/') {
      await canvas.scrollIntoViewIfNeeded();
      const originalScroll = await page.evaluate(() => scrollY);
      const originalPixels = await canvas.screenshot();
      await sharp(originalPixels).toFile('tmp/case-study/camera-before.png');
      await experience.getByRole('link', { name: '查看分析', exact: true }).click();
      await page.locator('.case-study-reading h2').filter({ hasText: '屋顶露台' }).waitFor();
      assert(page.url().includes('topic=roof'));
      await page.locator('.case-study-viewer .case-topic-tabs').getByRole('button', { name: '01 架空柱' }).click();
      await page.locator('.case-study-reading h2').filter({ hasText: '架空柱' }).waitFor();
      assert(page.url().includes('topic=pilotis'));
      const quiz = page.locator('.case-reflection');
      await quiz.getByRole('button', { name: '水平长窗', exact: true }).click(); await quiz.getByRole('status').filter({ hasText: '再想一想' }).waitFor();
      await quiz.getByRole('button', { name: '架空柱', exact: true }).click(); await quiz.getByRole('status').filter({ hasText: '理解正确' }).waitFor();
      await page.locator('.site-subpage-brand').click();
      await experience.locator('.case-experience-caption').getByText('屋顶与室外生活').waitFor();
      await page.locator('.app').waitFor({ state: 'visible' });
      assert(await canvas.evaluate(element => element === window.__caseCanvas && !element.getContext('webgl2').isContextLost()));
      assert(await page.locator('.app').evaluate(element => element.classList.contains('sidebar-collapsed')));
      assert(Math.abs(await page.evaluate(() => scrollY) - originalScroll) < 4);
      const returned = await sharp(await canvas.screenshot()).raw().toBuffer();
      await canvas.screenshot({ path: 'tmp/case-study/camera-returned.png' });
      const original = await sharp(originalPixels).raw().toBuffer();
      let difference = 0; for (let i = 0; i < original.length; i++) difference += Math.abs(original[i] - returned[i]);
      assert(difference / original.length < 3, `Returning home retains the camera pose (mean pixel difference ${difference / original.length})`);
    }
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 1000 }); await canvas.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
      await tabs.getByRole('button', { name: '01 架空柱' }).click();
      await experience.locator('.case-experience-caption').getByText('结构与地面空间').waitFor();
    }
    await canvas.evaluate(element => {
      const touch = x => new Touch({ identifier: 1, target: element, clientX: x, clientY: 180 });
      element.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, changedTouches: [touch(230)] }));
      element.dispatchEvent(new TouchEvent('touchend', { bubbles: true, changedTouches: [touch(80)] }));
    });
    assert.equal(await experience.locator('xpath=ancestor::article').getAttribute('aria-hidden'), 'false');
    await experience.screenshot({ path: `tmp/case-study/${path === '/' ? 'home' : 'preview'}-mobile.png` });
    assert.deepEqual(errors, []); await page.close();
    console.log(`PASS ${path}: model, hotspots, camera/state preservation and responsive interaction`);
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/#/curriculum/cases`);
  const cover = page.locator('.case-project-cover img');
  await cover.waitFor(); await page.waitForFunction(() => document.querySelector('.case-project-cover img').naturalWidth > 0);
  await page.getByRole('link', { name: '进入案例分析' }).click();
  const reading = page.locator('.case-study-reading'); await reading.getByRole('heading', { name: '架空柱', exact: true }).waitFor();
  for (const [label, topic, course] of [['01 架空柱', 'pilotis', '楼地层章节目录'], ['02 水平长窗', 'windows', '门窗章节目录'], ['03 屋顶露台', 'roof', '阅读屋顶概述']]) {
    await page.locator('.case-study-viewer .case-topic-tabs').getByRole('button', { name: label }).click();
    assert(page.url().includes(`topic=${topic}`));
    const href = await reading.getByRole('link', { name: course }).getAttribute('href');
    const coursePath = href.split('#/lesson/')[1];
    assert.equal((await page.request.get(`${base}/curriculum/${coursePath}`)).status(), 200);
  }
  await page.reload(); await reading.getByRole('heading', { name: '屋顶露台', exact: true }).waitFor();
  await page.screenshot({ path: 'tmp/case-study/detail-desktop.png', fullPage: true });
  await reading.getByRole('link', { name: '练习辨识檐沟' }).click();
  await page.locator('.training-workbench-heading h1').filter({ hasText: '找到檐沟' }).waitFor();
  await page.goBack(); await reading.getByRole('heading', { name: '屋顶露台', exact: true }).waitFor();
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
  }
  await page.screenshot({ path: 'tmp/case-study/detail-mobile.png', fullPage: true });
  await page.getByRole('link', { name: '返回案例应用', exact: true }).click(); await cover.waitFor();
  await page.goto(`${base}/#/curriculum/cases/missing`); await page.getByRole('heading', { name: '未找到该建筑案例' }).waitFor();
  assert.deepEqual(errors, []); await page.close();
  console.log('PASS case catalogue, deep links, self-check, courses, training, mobile and unknown case fallback');
  const fallback = await browser.newPage();
  await fallback.addInitScript(() => {
    window.__originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type === 'webgl' || type === 'webgl2' ? null : window.__originalGetContext.call(this, type, ...args);
    };
  });
  await fallback.goto(`${base}/#/curriculum/cases/villa-savoye`);
  await fallback.locator('.case-model-fallback').waitFor();
  await fallback.locator('.case-study-viewer .case-topic-tabs').getByRole('button', { name: '02 水平长窗' }).click();
  await fallback.locator('.case-study-reading h2').filter({ hasText: '水平长窗' }).waitFor();
  await fallback.evaluate(() => { HTMLCanvasElement.prototype.getContext = window.__originalGetContext; });
  await fallback.getByRole('button', { name: '重试三维视图' }).click();
  await fallback.locator('.case-study-viewer canvas').waitFor();
  await fallback.waitForFunction(() => document.querySelector('.case-model-markers button').style.left);
  assert.equal(await fallback.locator('.case-model-fallback').count(), 0);
  await fallback.close(); console.log('PASS unavailable WebGL keeps analysis usable and the model can retry');
} finally { await browser.close(); }
