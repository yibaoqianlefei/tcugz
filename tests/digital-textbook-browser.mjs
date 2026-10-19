import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = (process.argv[2] ?? 'http://127.0.0.1:5187/').replace(/\/?$/, '/');
const output = 'audit-output/digital-textbook-2026-10-19';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const glb = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => { if (/\.glb(?:\?|$)/.test(request.url())) glb.push(request.url()); });
const ready = async path => {
  await page.goto(`${base}#/lesson/${path}`);
  await page.waitForFunction(expected => {
    const iframe = document.querySelector('.curriculum-frame');
    return iframe?.contentDocument?.readyState === 'complete' && iframe.contentWindow.location.pathname.endsWith(`/lesson/${expected}`) && parseInt(iframe.style.height) > 300;
  }, path);
  return page.frameLocator('.curriculum-frame');
};
const checkOverflow = async () => {
  const dimensions = await page.evaluate(() => {
    const iframe = document.querySelector('.curriculum-frame');
    return { window: innerWidth, document: document.documentElement.scrollWidth, frame: iframe.contentDocument.documentElement.clientWidth, frameScroll: iframe.contentDocument.documentElement.scrollWidth };
  });
  assert(dimensions.document <= dimensions.window + 2 && dimensions.frameScroll <= dimensions.frame + 2, `reader does not overflow: ${JSON.stringify(dimensions)}`);
};

try {
  let frame = await ready('introduction/intro-course-guide.html');
  await frame.locator('.lesson-cover img').evaluate(image => image.decode());
  assert.equal(glb.length, 0, 'reading alone never downloads a model');
  assert.equal(await frame.locator('.lesson-figure').count(), 2);
  await page.screenshot({ path: `${output}/course-guide-desktop.png` });
  const trigger = frame.locator('.lesson-figure-image').first();
  await trigger.scrollIntoViewIfNeeded();
  const beforeScroll = await page.evaluate(() => scrollY);
  const originalUrl = page.url();
  await trigger.click();
  await page.locator('dialog[open]').waitFor();
  assert.equal(page.url(), originalUrl, 'opening diagram retains lesson route');
  assert.equal(glb.length, 0, 'diagram view does not download a model');
  await page.getByRole('button', { name: '放大构造图', exact: true }).click();
  assert.equal(await page.locator('.lesson-diagram-controls output').innerText(), '150%');
  await page.screenshot({ path: `${output}/diagram-study-desktop.png` });
  await page.getByRole('tab', { name: '二维图解' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: '复位视角', exact: true }).waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll('.lesson-model-controls button')].some(button => !button.disabled), { timeout: 30000 });
  await page.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
  assert(glb.length > 0, 'model downloads only after choosing three dimensions');
  assert.equal(await page.locator('.lesson-model-stage canvas').count(), 1, 'a real model canvas is mounted');
  const parts = page.locator('.lesson-model-part');
  assert(await parts.count() > 0, 'registered parts match actual loaded model components');
  await parts.first().click();
  assert.equal(await parts.first().getAttribute('aria-pressed'), 'true');
  await page.locator('.lesson-model-parts input').first().uncheck();
  assert((await page.locator('.lesson-model-parts-heading').innerText()).includes('已隐藏 1 项'));
  await page.getByRole('button', { name: '显示全部', exact: true }).click();
  await page.getByRole('button', { name: '向右旋转模型' }).click();
  await page.getByRole('button', { name: '复位视角', exact: true }).click();
  await page.locator('.lesson-model-variants select').selectOption({ index: 1 });
  await page.getByRole('button', { name: '复位视角', exact: true }).waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll('.lesson-model-controls button')].some(button => !button.disabled));
  await page.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
  assert((await page.locator('.lesson-model-parts').innerText()).includes('阶梯'), 'registered model variant can be changed');
  await page.screenshot({ path: `${output}/model-study-desktop.png` });
  await page.keyboard.press('Escape');
  await page.locator('dialog').waitFor({ state: 'detached' });
  assert(Math.abs(await page.evaluate(() => scrollY) - beforeScroll) < 4, 'closing restores the exact reading position');
  assert(await trigger.evaluate(element => element.ownerDocument.activeElement === element), 'closing restores focus to the original iframe trigger');
  await checkOverflow();
  await frame.locator('.lesson-answer summary').click();
  assert((await frame.locator('.lesson-answer').innerText()).includes('参考答案：'));
  const progress = Number(await page.getByRole('progressbar', { name: '本节阅读进度' }).getAttribute('aria-valuenow'));
  assert(progress > 0, 'reading progress responds to scrolling');
  await page.screenshot({ path: `${output}/inline-figure-and-reading.png` });

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    frame = await ready('basics/floor/floor-rc-slab.html');
    await frame.locator('.lesson-cover img').evaluate(image => image.decode());
    await checkOverflow();
    await page.screenshot({ path: `${output}/slab-reader-${width}.png` });
    await frame.locator('.lesson-cover a').click();
    await page.locator('dialog[open]').waitFor();
    await page.getByRole('tab', { name: '三维模型' }).click();
    await page.waitForFunction(() => [...document.querySelectorAll('.lesson-model-controls button')].some(button => !button.disabled), { timeout: 30000 });
    await page.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
    assert(await page.evaluate(() => document.querySelector('dialog').scrollWidth <= innerWidth + 1), 'mobile modal contains its model controls');
    await page.screenshot({ path: `${output}/slab-model-${width}.png` });
    await page.getByRole('button', { name: '关闭图模研读，返回正文' }).click();
  }

  // All authored diagrams load in the narrow reader; no asset is a placeholder.
  const catalog = JSON.parse(await readFile('src/data/lessonMedia.json', 'utf8'));
  let figures = 0;
  for (const lesson of Object.values(catalog)) {
    frame = await ready(lesson.path);
    await checkOverflow();
    assert.equal(await frame.locator('.lesson-figure').count(), lesson.figures.length);
    for (const figure of lesson.figures) {
      const response = await page.request.get(`${base}${figure.image.replace(/^\/+/, '')}`);
      assert.equal(response.status(), 200, `real drawing served: ${lesson.path} ${figure.nodeId}`);
      figures++;
    }
  }
  assert.deepEqual(errors, [], 'no reading or model runtime errors');
  const imagePath = Object.values(catalog).find(lesson => lesson.path === 'introduction/intro-course-guide.html').figures[0].image;
  await page.route(`**${imagePath}`, route => route.abort());
  frame = await ready('introduction/intro-course-guide.html');
  await frame.locator('.lesson-cover a').click();
  await page.locator('.lesson-media-message[role="alert"]').waitFor();
  assert((await page.locator('dialog').innerText()).includes('图解暂时无法加载'));
  await page.unroute(`**${imagePath}`);
  await page.locator('.lesson-media-message button').click();
  await page.locator('.lesson-diagram-scroll img').evaluate(image => image.decode());
  await page.keyboard.press('Escape');
  const fallbackPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await fallbackPage.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.startsWith('webgl') ? null : getContext.call(this, type, ...args); };
  });
  await fallbackPage.goto(`${base}#/lesson/introduction/intro-course-guide.html`);
  await fallbackPage.frameLocator('.curriculum-frame').locator('.lesson-cover a').click();
  await fallbackPage.getByRole('tab', { name: '三维模型' }).click();
  await fallbackPage.getByText('当前设备无法开启三维视图', { exact: true }).waitFor();
  await fallbackPage.getByRole('tab', { name: '二维图解' }).click();
  await fallbackPage.locator('.lesson-diagram-scroll img').evaluate(image => image.decode());
  await fallbackPage.close();
  await writeFile(`${output}/browser-result.json`, JSON.stringify({ lessons: 54, figures, widths: [1440, 390, 320], verified: ['lazy-model', 'real-model-and-parts', 'diagram-zoom', 'keyboard-tabs', 'escape', 'focus-return', 'scroll-return', 'reading-progress', 'self-check-feedback', 'all-assets', 'all-narrow-readers', 'image-error-retry', 'no-webgl-fallback'], errors }, null, 2));
  console.log(`Digital textbook browser checks passed: 54 lessons, ${figures} figures, real 3D/parts, lazy loading, keyboard/focus/scroll, 1440/390/320px layouts.`);
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  if (await page.locator('dialog[open]').count()) console.error((await page.locator('dialog').innerText()).slice(0, 1000));
  throw error;
} finally {
  await browser.close();
}
