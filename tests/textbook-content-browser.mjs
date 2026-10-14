import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = (process.argv[2] ?? 'http://127.0.0.1:5177/').replace(/\/?$/, '/');
const output = 'audit-output/textbook-content-2026-10-12';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.exposeFunction('reportTextbookWindowError', details => errors.push(details));
await page.addInitScript(() => {
  window.addEventListener('error', event => {
    if (event.message) window.reportTextbookWindowError({ message: event.message, route: location.href });
  });
});
const ready = async path => {
  await page.waitForFunction(expected => {
    const frame = document.querySelector('.curriculum-frame');
    return frame?.contentDocument?.readyState === 'complete'
      && frame.contentWindow.location.pathname.endsWith(`/lesson/${expected}`)
      && frame.contentDocument.querySelector('.page-head h1, .wall-intro h1');
  }, path);
  await page.waitForFunction(() => parseInt(document.querySelector('.curriculum-frame')?.style.height ?? '') > 300);
  return page.frameLocator('.curriculum-frame');
};
const navigate = async path => { await page.goto(`${base}#/lesson/${path}`); return ready(path); };
const checkOverflow = async () => {
  const widths = await page.evaluate(() => {
    const doc = document.querySelector('.curriculum-frame').contentDocument;
    return { outer: document.documentElement.scrollWidth, viewport: innerWidth, frame: doc.documentElement.scrollWidth, frameWidth: doc.documentElement.clientWidth };
  });
  assert(widths.outer <= widths.viewport + 2, `outer overflow: ${JSON.stringify(widths)}`);
  assert(widths.frame <= widths.frameWidth + 2, `article overflow: ${JSON.stringify(widths)}`);
};

try {
  const { documents } = JSON.parse(await readFile('src/data/curriculumDocuments.json', 'utf8'));
  for (let start = 0; start < documents.length; start += 8) {
    await Promise.all(documents.slice(start, start + 8).map(async path => {
      const response = await page.request.get(`${base}lesson/${path}`);
      assert.equal(response.status(), 200, path);
      const html = await response.text();
      assert(/<h1\b/.test(html) && !html.includes('class="empty"'), `real reader body: ${path}`);
    }));
  }
  await page.goto(`${base}#/?section=introduction`);
  await page.locator('.module-card[href$="intro-course-guide.html"]').click();
  let frame = await ready('introduction/intro-course-guide.html');
  assert.equal(await frame.locator('h1').innerText(), '课程导读');
  const tocTarget = await frame.locator('.article-toc a').nth(2).getAttribute('href');
  await frame.locator('.article-toc a').nth(2).click();
  await page.waitForFunction(id => {
    const iframe = document.querySelector('.curriculum-frame');
    const target = iframe.contentDocument.querySelector(id);
    const top = iframe.getBoundingClientRect().top + target.getBoundingClientRect().top;
    return Math.abs(top - 24) < 12;
  }, tocTarget);
  assert(page.url().endsWith('#/lesson/introduction/intro-course-guide.html'), 'index scroll stays on same route');
  await frame.locator('.chapter-nav a[href$="intro-classification.html"]').click();
  frame = await ready('introduction/intro-classification.html');
  assert.equal(await frame.locator('h1').innerText(), '建筑物的分类');
  assert(await page.evaluate(() => window.scrollY < 5), 'new chapter starts at top');

  frame = await navigate('wall/index.html');
  assert.equal(await frame.locator('.chapter-card').count(), 8);
  await page.screenshot({ path: `${output}/wall-directory-desktop.png` });
  await frame.locator('.chapter-card[href$="wall-details.html"]').click();
  frame = await ready('basics/wall/wall-details.html');
  assert((await frame.locator('.article').innerText()).includes('防潮'));
  await frame.locator('.article a[href^="/#/node/"]').first().click();
  await page.waitForURL(/#\/node\//);

  await page.goto(`${base}#/games`);
  await page.locator('.textbook-practice-entry a').click();
  frame = await ready('practice/index.html');
  assert.equal(await frame.locator('.card').count(), 7);
  await frame.locator('.card[href$="stairs-drawing.html"]').click();
  frame = await ready('practice/stairs-drawing.html');
  assert((await frame.locator('.article').innerText()).includes('1820'));
  await frame.locator('.back').click();
  await ready('practice/index.html');

  frame = await navigate('basics/roof/roof-flat.html');
  await checkOverflow();
  await page.screenshot({ path: `${output}/roof-article-desktop.png` });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ['basics/roof/roof-flat.html', 'basics/floor/floor-rc-slab.html', 'wall/index.html', 'practice/stairs-drawing.html']) {
      await navigate(path);
      await checkOverflow();
    }
    await navigate('basics/roof/roof-flat.html');
    await page.screenshot({ path: `${output}/roof-article-mobile-${width}.png` });
    await page.goto(`${base}#/?section=modules`);
    assert.equal(await page.locator('.module-card[href$="deformation-joint/index.html"]').count(), 1);
    await page.locator('.module-card[href$="deformation-joint/index.html"]').click();
    frame = await ready('basics/deformation-joint/index.html');
    assert.equal(await frame.locator('.card').count(), 3);
  }
  assert.deepEqual(errors, [], 'no browser runtime errors during reading');
  console.log(`Textbook browser checks passed: ${documents.length} readers return content, homepage/chapter/model/practice links, in-page index, desktop and 390/320px mobile layouts.`);
} finally {
  await browser.close();
}
