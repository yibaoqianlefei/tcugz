import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';

const base = (process.argv[2] ?? 'http://127.0.0.1:5187/').replace(/\/?$/, '/');
const output = process.env.BOOK_READER_OUTPUT ?? await mkdtemp(`${tmpdir()}/book-reader-`);
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const errors = [], results = [];
const page = await browser.newPage({ reducedMotion: 'reduce' });
page.on('pageerror', error => errors.push(error.message));
const ready = async (path = 'introduction/intro-composition.html') => {
  await page.goto(`${base}#/lesson/${path}`);
  await page.waitForFunction(path => {
    const frame = document.querySelector('.curriculum-frame');
    return frame?.contentDocument?.documentElement?.dataset.readerLayout === 'book' && frame.contentWindow.location.pathname.endsWith(path);
  }, path);
};
const inspect = () => page.evaluate(() => {
  const frame = document.querySelector('.curriculum-frame'), doc = frame.contentDocument;
  const para = [...doc.querySelectorAll('.article > p')].find(element => element.textContent.length > 50);
  const box = para.getBoundingClientRect();
  return { viewport: innerWidth, outer: document.documentElement.scrollWidth, frame: frame.clientWidth, inner: doc.documentElement.scrollWidth, paragraph: box.width, font: parseFloat(getComputedStyle(para).fontSize), oldSidebar: getComputedStyle(doc.querySelector('.lesson-sidebar')).display, side: document.querySelector('.book-toc--sidebar')?.getBoundingClientRect().width ?? 0 };
});
try {
  for (const width of [2560, 1920, 1440, 1280, 1279, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width > 760 ? 900 : 844 });
    await ready();
    const result = await inspect();
    assert(result.outer <= width + 1 && result.inner <= result.frame + 1, `no overflow ${width}`);
    assert(result.paragraph <= 761 && result.font >= 16, `bounded readable paragraphs ${width}`);
    assert.equal(result.oldSidebar, 'none');
    assert.equal(await page.locator('.book-reader-topbar button[aria-controls="book-toc-content"]').count(), 0, 'directory toggle is not in the top-right header');
    assert.equal(await page.locator('.book-toc a[aria-current="page"]').count(), 1);
    if (width >= 1280) {
      assert.equal(result.side, 280);
      const edge = await page.locator('.book-directory-edge-trigger').boundingBox();
      const side = await page.locator('.book-toc--sidebar').boundingBox();
      assert(Math.abs(edge.x + edge.width / 2 - side.x - side.width) < 1, 'toggle straddles the sidebar edge');
      assert.equal(side.y, 0, 'sidebar brand starts at the page top like the homepage');
      assert.equal(await page.locator('.book-toc-group-copy>svg').count(), 0, 'chapter names contain no decorative icons');
    }
    else {
      assert.equal(result.side, 0);
      assert.equal(await page.locator('.book-toc--drawer').evaluate(element => element.open), false);
      await page.locator('.book-directory-edge-trigger').click();
      const dialog = page.getByRole('dialog', { name: '教材目录' });
      await dialog.waitFor();
      assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
      const bounds = await dialog.boundingBox();
      assert(bounds.x >= 0 && bounds.x + bounds.width <= width + 1, 'drawer fits screen');
      if ([390, 320].includes(width)) {
        const close = dialog.locator('[data-drawer-close]');
        const closeBounds = await close.boundingBox();
        assert(closeBounds.x >= 0 && closeBounds.x + closeBounds.width <= width + 1, 'drawer edge button stays in viewport');
        await close.click();
        await dialog.waitFor({ state: 'hidden' });
        await page.locator('.book-directory-edge-trigger').click();
        await dialog.waitFor();
        await page.screenshot({ path: `${output}/directory-drawer-${width}.png` });
      }
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(await page.evaluate(() => document.body.style.overflow), '');
      assert(await page.locator('.book-directory-edge-trigger').evaluate(element => document.activeElement === element), 'focus returns to trigger');
    }
    results.push(result);
    if ([1440, 390].includes(width)) await page.screenshot({ path: `${output}/reader-${width}.png` });
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await ready('principles/acoustic.html');
  const toc = page.locator('.book-toc--sidebar');
  assert.equal(await toc.locator('a.book-toc-lesson').count(), 54, 'whole textbook is present');
  await toc.getByRole('searchbox', { name: '搜索教材章节' }).fill('钢筋混凝土楼梯');
  assert.equal(await toc.locator('a.book-toc-lesson').count(), 1);
  await toc.locator('a.book-toc-lesson').click();
  await page.waitForURL('**/lesson/basics/stairs/stairs-rc-structure.html');
  await page.waitForFunction(() => document.querySelector('.curriculum-frame')?.contentDocument?.documentElement?.dataset.readerLayout === 'book');
  assert((await page.locator('.book-toc a[aria-current="page"]').innerText()).includes('钢筋混凝土楼梯'));
  await page.locator('.book-toc-sections button').nth(2).click();
  await page.waitForTimeout(500);
  assert.equal(await page.locator('.book-toc-sections button[aria-current="location"]').innerText(), '预制楼梯与连接');
  assert((await page.evaluate(() => scrollY)) > 0);
  assert(page.url().endsWith('stairs-rc-structure.html'), 'section navigation preserves HashRouter route');

  // Collapsing the directory reflows the existing model, keeping its session.
  const frame = page.frameLocator('.curriculum-frame');
  await page.evaluate(() => {
    const f = document.querySelector('.curriculum-frame'), slot = f.contentDocument.querySelector('[data-lesson-model]');
    scrollTo(0, scrollY + f.getBoundingClientRect().top + slot.getBoundingClientRect().top - 90);
  });
  const slot = frame.locator('[data-lesson-model]').first();
  await slot.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
  await slot.getByRole('button', { name: '暂停旋转', exact: true }).click();
  await page.evaluate(() => { window.bookReaderCanvas = document.querySelector('.curriculum-frame').contentDocument.querySelector('canvas'); });
  await page.locator('.book-directory-edge-trigger').click();
  await page.waitForTimeout(500);
  assert.equal((await page.locator('.book-toc--sidebar').boundingBox()).width, 76, 'collapsed sidebar keeps the same narrow rail as the homepage');
  assert(await page.locator('.book-toc--sidebar .site-brand-mark').isVisible(), 'collapsed rail keeps its brand mark');
  assert(await page.locator('.book-toc--sidebar nav').isHidden(), 'collapsed navigation is removed from keyboard order');
  assert(await page.evaluate(() => window.bookReaderCanvas === document.querySelector('.curriculum-frame').contentDocument.querySelector('canvas')), 'model canvas is not remounted');
  // 阅读页只保留旋转与爆炸，构件名称常驻在模型下方。
  assert.equal(await slot.getByLabel('更多模型操作', { exact: true }).count(), 0, 'reading page no longer hides controls behind a more menu');
  assert(await slot.locator('.lesson-knowledge-panel').isVisible(), 'component names stay visible under the model');
  const card = slot.locator('.lesson-knowledge-card:enabled').first();
  await card.click();
  assert.equal(await card.getAttribute('aria-pressed'), 'true');
  assert.equal(await slot.locator('.lesson-inline-selected').innerText(), await card.innerText());
  assert.equal(await slot.locator('.lesson-knowledge-card *').count(), 0, 'component cards remain name-only');
  await page.locator('.book-directory-edge-trigger').click();
  await page.screenshot({ path: `${output}/model-with-directory.png` });

  // Resizing a modal into the desktop sidebar releases the body scroll lock.
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.locator('.book-directory-edge-trigger').click();
  await page.getByRole('dialog', { name: '教材目录' }).waitFor();
  await page.keyboard.press('Tab');
  assert(await page.getByRole('dialog').evaluate(element => element.contains(document.activeElement)), 'native modal keeps keyboard focus inside');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('.book-toc--sidebar').waitFor();
  assert.equal(await page.evaluate(() => document.body.style.overflow), '');
  assert.equal(await page.locator('dialog:modal').count(), 0);
  assert(await page.locator('.book-directory-edge-trigger').evaluate(element => document.activeElement === element), 'focus follows the replacement edge control across the breakpoint');

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await ready('principles/acoustic.html');
    await page.evaluate(() => { const f = document.querySelector('.curriculum-frame'), e = f.contentDocument.querySelector('[data-lesson-model]'); scrollTo(0, scrollY + f.getBoundingClientRect().top + e.getBoundingClientRect().top - 90); });
    const inline = page.frameLocator('.curriculum-frame').locator('[data-lesson-model]').first();
    await inline.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
    const slider = inline.getByRole('slider', { name: '爆炸程度' });
    assert((await slider.boundingBox()).height >= 44, 'thin slider retains a full touch target');
    await slider.focus();
    await page.keyboard.press('End');
    await page.waitForTimeout(500);
    assert.equal(await slider.inputValue(), '1');
    const square = await inline.locator('.lesson-model-stage').boundingBox();
    assert(Math.abs(square.width - square.height) < 1, 'inline canvas uses a square observation area');
    const names = await inline.locator('.lesson-knowledge-panel').boundingBox();
    assert(names.y >= square.y + square.height - 1, 'component names sit under the model');
    assert(names.x >= 0 && names.x + names.width <= width + 1, 'component names fit narrow screen');
    assert.equal(await inline.getByLabel('更多模型操作', { exact: true }).count(), 0, 'narrow reading page keeps only rotate and explode');
    await page.screenshot({ path: `${output}/minimal-model-${width}.png` });
    await ready('basics/stairs/stairs-rc-structure.html');
    await page.evaluate(() => { const f = document.querySelector('.curriculum-frame'), e = f.contentDocument.querySelector('[data-lesson-model]'); scrollTo(0, scrollY + f.getBoundingClientRect().top + e.getBoundingClientRect().top - 90); });
    const staticModel = page.frameLocator('.curriculum-frame').locator('[data-lesson-model]').first();
    await staticModel.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
    assert.equal(await staticModel.getByRole('slider', { name: '爆炸程度' }).count(), 0, 'static model does not show an unusable explode slider');
    assert.equal(await staticModel.getByLabel('更多模型操作', { exact: true }).count(), 0, 'static model has no auxiliary menu either');
  }
  assert.equal(errors.length, 0, JSON.stringify(errors));
  await writeFile(`${output}/result.json`, JSON.stringify({ results, errors }, null, 2));
  console.log(`Book reader checks passed: nine widths, full directory, search, routing, section navigation, model preservation and accessible drawer. ${output}`);
} finally { await browser.close(); }
