import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';

const base = (process.argv[2] ?? 'http://127.0.0.1:5187/').replace(/\/?$/, '/');
const output = await mkdtemp(`${tmpdir()}/textbook-scrollbars-`);
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const open = async () => {
  await page.goto(`${base}#/lesson/principles/acoustic.html`);
  await page.waitForFunction(() => document.querySelector('.curriculum-frame')?.contentDocument?.documentElement?.dataset.modelsEmbedded === 'true');
};
const position = () => page.locator('.book-toc-scroll').evaluate(element => element.scrollTop);
const red = 'rgb(227, 75, 54)';
try {
  await open();
  const bar = page.locator('.book-toc-scrollbar');
  const thumb = bar.locator('.book-toc-scrollbar-thumb');
  await bar.waitFor();
  assert((await thumb.boundingBox()).height <= 64, 'directory thumb is capped at 64px');
  assert.equal(await thumb.evaluate(element => getComputedStyle(element).backgroundColor), red);
  await bar.focus();
  await page.keyboard.press('Home');
  await page.waitForFunction(() => document.getElementById('book-toc-scroll').scrollTop === 0);
  await page.keyboard.press('End');
  await page.waitForFunction(() => { const e = document.getElementById('book-toc-scroll'); return Math.abs(e.scrollTop - (e.scrollHeight - e.clientHeight)) < 2; });
  const atEnd = await position();
  assert(atEnd > 0);
  await page.keyboard.press('PageUp');
  assert(await position() < atEnd, 'keyboard paging scrolls the native content');
  await page.keyboard.press('Home');
  await page.waitForTimeout(80);
  const box = await thumb.boundingBox(), rail = await bar.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(rail.x + rail.width / 2, rail.y + rail.height - 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForFunction(() => { const e = document.getElementById('book-toc-scroll'); return Math.abs(e.scrollTop - (e.scrollHeight - e.clientHeight)) < 2; });
  await page.keyboard.press('Home');
  await page.waitForTimeout(60);
  await bar.hover();
  const outerBefore = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 120);
  await page.waitForFunction(() => document.getElementById('book-toc-scroll').scrollTop > 0);
  assert.equal(await page.evaluate(() => scrollY), outerBefore, 'wheel over the thumb does not move the article');

  const search = page.getByRole('searchbox', { name: '搜索教材章节' });
  await search.fill('不存在的章节名称');
  await bar.waitFor({ state: 'hidden' });
  assert.equal(await bar.getAttribute('tabindex'), '-1');
  await search.fill('');
  await bar.waitFor();
  await page.emulateMedia({ forcedColors: 'active' });
  assert.equal(await page.locator('.book-toc-scroll').evaluate(e => getComputedStyle(e).scrollbarWidth), 'auto');
  assert.equal(await bar.evaluate(e => getComputedStyle(e).display), 'none');
  await page.emulateMedia({ forcedColors: 'none' });

  // The same stylesheet reaches the outer app and the isolated chapter document.
  assert((await page.locator('html').evaluate(e => getComputedStyle(e).scrollbarColor)).startsWith(red));
  const frame = page.frameLocator('.curriculum-frame');
  assert((await frame.locator('html').evaluate(e => getComputedStyle(e).scrollbarColor)).startsWith(red));
  const slot = frame.locator('[data-lesson-model]').first();
  await slot.scrollIntoViewIfNeeded();
  await slot.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
  assert.equal(await slot.getByRole('slider', { name: '爆炸程度' }).evaluate(e => getComputedStyle(e).accentColor), red);
  await page.screenshot({ path: `${output}/desktop.png` });

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator('.book-directory-edge-trigger').click();
    await page.getByRole('dialog', { name: '教材目录' }).waitFor();
    await bar.waitFor();
    assert((await thumb.boundingBox()).height <= 64);
    await bar.focus();
    await page.keyboard.press('End');
    await page.waitForFunction(() => { const e = document.getElementById('book-toc-scroll'); return Math.abs(e.scrollTop - (e.scrollHeight - e.clientHeight)) < 2; });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${output}/drawer-${width}.png` });
    await page.keyboard.press('Escape');
    await page.getByRole('dialog', { name: '教材目录' }).waitFor({ state: 'hidden' });
  }
  await page.goto(`${base}#/node/window-wall-gap-sealing-01`);
  const slider = page.locator('.node-explode-slider');
  await slider.waitFor();
  assert.equal(await slider.evaluate(e => getComputedStyle(e).accentColor), red);
  for (const e of await page.locator('html, .node-knowledge, .node-diagram-panel').all()) {
    assert((await e.evaluate(e => getComputedStyle(e).scrollbarColor)).startsWith(red));
  }
  assert.deepEqual(errors, []);
  console.log(`Scrollbar UI checks passed: compact thumb, drag, wheel, keyboard, filtering, forced colors, iframe/node colors and mobile drawers. ${output}`);
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  console.error('Evidence:', output, 'Route:', page.url());
  throw error;
} finally { await browser.close(); }
