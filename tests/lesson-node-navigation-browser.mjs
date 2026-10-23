import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';

const base = (process.argv[2] ?? 'http://127.0.0.1:5187/').replace(/\/?$/, '/');
const output = await mkdtemp(`${tmpdir()}/lesson-node-return-`);
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
const ready = async (path, target = page) => {
  await target.waitForFunction(path => {
    const frame = document.querySelector('.curriculum-frame');
    return frame?.contentDocument?.documentElement?.dataset.readerLayout === 'book'
      && frame.contentWindow.location.pathname.endsWith(path)
      && Math.abs(frame.clientHeight - frame.contentDocument.body.getBoundingClientRect().height) < 2;
  }, path);
  return target.frameLocator('.curriculum-frame');
};
const open = async path => {
  await page.goto(`${base}#/lesson/${path}`);
  return ready(path);
};
const checkReturn = async (path, before, target = page) => {
  await ready(path, target);
  await target.waitForFunction(before => Math.abs(scrollY - before) < 3, before);
  assert((await target.locator('.book-toc a[aria-current="page"]').getAttribute('href')).includes(path));
};
const enter = async (frame, figureId = 'figure-1', additionalScroll = 0) => {
  const link = frame.locator(`#${figureId} .lesson-model-link`);
  assert.equal(await link.innerText(), '打开节点 ↗');
  await link.scrollIntoViewIfNeeded();
  if (additionalScroll) await page.evaluate(amount => scrollBy(0, amount), additionalScroll);
  await page.waitForTimeout(150);
  const before = await page.evaluate(() => scrollY);
  const nodeId = await frame.locator(`#${figureId}`).getAttribute('data-node-id');
  await link.focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(url => url.hash.startsWith(`#/node/${nodeId}?`));
  await page.locator('.node-detail-page canvas').waitFor();
  assert.equal(await page.locator('.site-back-link span:last-child').innerText(), '返回教材章节');
  assert.equal(await page.locator('.lesson-explorer').count(), 0);
  assert.equal(await page.locator('.node-detail-header a').innerText(), '教材章节');
  return { before, nodeId, href: page.url() };
};
try {
  const path = 'principles/acoustic.html';
  let frame = await open(path);
  await page.locator('.book-directory-edge-trigger').click();
  const first = await enter(frame);
  await page.screenshot({ path: `${output}/node-from-textbook.png` });
  await page.locator('.site-back-link').click();
  await checkReturn(path, first.before);
  assert.equal(await page.locator('.book-reader-shell').getAttribute('data-directory-open'), 'false');
  assert(await page.frameLocator('.curriculum-frame').locator('#figure-1 .lesson-model-link').evaluate(el => el.ownerDocument.activeElement === el));
  checks.push('desktop keyboard entry, actual node workbench, return button, exact reading position, collapsed directory and focus');

  frame = page.frameLocator('.curriculum-frame');
  const second = await enter(frame, 'figure-1', 120);
  assert(Math.abs(second.before - first.before) > 100, 'second visit records a new reading position');
  await page.goBack();
  await checkReturn(path, second.before);
  checks.push('browser Back restores the original chapter history entry');

  frame = page.frameLocator('.curriculum-frame');
  const third = await enter(frame);
  await page.reload();
  await page.locator('.node-detail-page canvas').waitFor();
  await page.locator('.node-detail-header a').click();
  await checkReturn(path, third.before);
  checks.push('node refresh and breadcrumb return preserve chapter and position');

  // A plain href carries origin information without React state (new tab / copied link).
  const newTab = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await newTab.goto(first.href);
  await newTab.locator('.node-detail-page').waitFor();
  await newTab.locator('.site-back-link').click();
  await ready(path, newTab);
  await newTab.waitForFunction(() => {
    const f = document.querySelector('.curriculum-frame');
    const top = f.getBoundingClientRect().top + f.contentDocument.getElementById('figure-1').getBoundingClientRect().top;
    return Math.abs(top - document.querySelector('.site-subpage-topbar').getBoundingClientRect().height - 24) < 3;
  });
  await newTab.close();
  checks.push('source URL works in a fresh tab without state');

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    frame = await open('basics/floor/floor-rc-slab.html');
    await frame.locator('#figure-1 .lesson-figure-notes').evaluate(element => { element.open = true; });
    await frame.locator('#figure-2 .lesson-figure-notes').evaluate(element => { element.open = true; });
    const mobile = await enter(frame, 'figure-3');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.locator('.site-back-link').click();
    await checkReturn('basics/floor/floor-rc-slab.html', mobile.before);
    assert(await page.frameLocator('.curriculum-frame').locator('#figure-1 .lesson-figure-notes').evaluate(element => element.open));
    assert(await page.frameLocator('.curriculum-frame').locator('#figure-2 .lesson-figure-notes').evaluate(element => element.open));
    checks.push(`mobile ${width}px opens its audited node and restores reading position`);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  frame = await open(path);
  await enter(frame);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.site-back-link').click();
  await ready(path);
  await page.waitForFunction(() => {
    const f = document.querySelector('.curriculum-frame');
    const top = f.getBoundingClientRect().top + f.contentDocument.getElementById('figure-1').getBoundingClientRect().top;
    return top > 0 && top < innerHeight / 2;
  });
  checks.push('changed screen width returns to the model anchor instead of an obsolete pixel position');

  // Text links use the same origin, including links outside figure markup.
  frame = await open('basics/wall/wall-details.html');
  await frame.locator('.article a[href*="#/node/"]:not([data-lesson-figure]):not(.lesson-model-placeholder)').first().click();
  await page.locator('.node-detail-page').waitFor();
  assert.equal(await page.locator('.site-back-link').getAttribute('href'), '#/lesson/basics/wall/wall-details.html');
  await page.locator('.site-back-link').click();
  await ready('basics/wall/wall-details.html');
  checks.push('ordinary article node links also return to their source chapter');

  await page.goto(`${base}#/node/${first.nodeId}`);
  await page.locator('.node-detail-page').waitFor();
  assert.equal(await page.locator('.site-back-link').getAttribute('href'), '#/library');
  assert.equal(await page.locator('.node-detail-header a').getAttribute('href'), '#/library');
  checks.push('direct node visit keeps the node-library return');

  await page.goto(`${base}#/library?q=窗`);
  const card = page.locator('.library-node-card[href^="#/node/"]').first();
  await card.waitFor();
  await card.scrollIntoViewIfNeeded();
  const libraryUrl = page.url();
  await card.click();
  await page.locator('.node-detail-page').waitFor();
  assert.equal(await page.locator('.site-back-link span:last-child').innerText(), '返回构造节点');
  assert.equal(await page.locator('.site-back-link').getAttribute('href'), new URL(libraryUrl).hash);
  await page.locator('.site-back-link').click();
  await page.waitForURL(libraryUrl);
  checks.push('library entry preserves the existing filtered library return');

  assert.deepEqual(errors, []);
  await writeFile(`${output}/result.json`, JSON.stringify({ checks, errors }, null, 2));
  console.log(JSON.stringify({ output, checks }, null, 2));
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  console.error('At route:', page.url(), 'Evidence:', output);
  throw error;
} finally { await browser.close(); }
