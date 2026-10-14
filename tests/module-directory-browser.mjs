import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { modules } from '../scripts/lib/textbook-catalog.mjs';

const base = (process.argv[2] ?? 'http://127.0.0.1:5173/').replace(/\/?$/, '/');
const output = 'tmp/module-closed-2026-10-13';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.exposeFunction('reportDirectoryError', error => errors.push(error));
await page.addInitScript(() => {
  window.addEventListener('error', event => {
    if (event.message) window.reportDirectoryError({ message: event.message, route: location.href });
  });
});

const ready = async path => {
  await page.waitForFunction(expected => {
    const frame = document.querySelector('.curriculum-frame');
    return frame?.contentDocument?.readyState === 'complete'
      && frame.contentWindow.location.pathname.endsWith(`/lesson/${expected}`)
      && frame.contentDocument.querySelector('h1');
  }, path);
  await page.waitForFunction(() => {
    const iframe = document.querySelector('.curriculum-frame');
    const height = iframe?.contentDocument?.body?.getBoundingClientRect().height;
    return height > 0 && Math.abs(parseInt(iframe.style.height, 10) - Math.ceil(height)) <= 2;
  });
  return page.frameLocator('.curriculum-frame');
};
const navigate = async path => {
  await page.goto(`${base}#/lesson/${path}`);
  return ready(path);
};
const results = [];

try {
  for (const [id, module] of Object.entries(modules)) {
    if (id === 'wall') continue;
    const path = `basics/${id}/index.html`;
    for (const width of [1440, 1000, 701, 700, 600, 390, 320]) {
      await page.setViewportSize({ width, height: 960 });
      const frame = await navigate(path);
      assert.equal(await frame.locator('h1').innerText(), module.title, `chapter title: ${id}`);
      assert.equal(await frame.locator('.chapter-card').count(), module.topics.length, `complete chapters: ${id}`);
      assert.equal(await frame.locator('.chapter-card svg').count(), 0, `no card icons: ${id}`);
      assert.equal(await frame.locator('figure img').count(), 0, `chapter model images removed: ${id}`);
      assert.equal(await frame.locator('figure a').count(), 0, `abstract artwork has no model links: ${id}`);
      assert.equal(await frame.locator('figure svg').count(), 1, `abstract artwork renders: ${id}`);
      await frame.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      const dimensions = await page.evaluate(() => {
        const doc = document.querySelector('.curriculum-frame').contentDocument;
        const heading = doc.querySelector('h1');
        const title = heading.getBoundingClientRect();
        const copy = doc.querySelector('.wall-intro-copy').getBoundingClientRect();
        const svg = doc.querySelector('figure svg');
        const artwork = svg.getBoundingClientRect();
        const rootMatrix = svg.getScreenCTM().inverse();
        const points = [];
        for (const element of svg.querySelectorAll('path,rect,circle,ellipse,polygon,line,polyline')) {
          const matrix = rootMatrix.multiply(element.getScreenCTM());
          const length = element.getTotalLength();
          for (let index = 0; index <= 160; index++) points.push(element.getPointAtLength(length * index / 160).matrixTransform(matrix));
        }
        const left = Math.min(...points.map(point => point.x));
        const top = Math.min(...points.map(point => point.y));
        const right = Math.max(...points.map(point => point.x));
        const bottom = Math.max(...points.map(point => point.y));
        return {
          outer: document.documentElement.scrollWidth,
          viewport: innerWidth,
          frame: doc.documentElement.scrollWidth,
          frameWidth: doc.documentElement.clientWidth,
          titleWidth: title.width,
          copyWidth: copy.width,
          artWidth: artwork.width,
          artHeight: artwork.height,
          artBounds: { x: left, y: top, width: right - left, height: bottom - top },
          grid: getComputedStyle(doc.querySelector('.chapter-grid')).gridTemplateColumns,
        };
      });
      assert(dimensions.outer <= dimensions.viewport + 2, `outer page overflow: ${id}/${width}`);
      assert(dimensions.frame <= dimensions.frameWidth + 2, `iframe overflow: ${id}/${width}`);
      assert(dimensions.titleWidth <= dimensions.copyWidth + 2, `title fits: ${id}/${width}`);
      assert(dimensions.artWidth > 0 && dimensions.artHeight > 0, `abstract artwork visible: ${id}/${width}`);
      const bounds = dimensions.artBounds;
      assert(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= 600 && bounds.y + bounds.height <= 460, `artwork stays inside its canvas: ${id}/${width}`);
      results.push({ id, width, ...dimensions });
      if ([1440, 390].includes(width)) {
        await page.screenshot({ path: `${output}/${id}-${width}.png`, fullPage: true });
      }
    }

    await page.setViewportSize({ width: 1440, height: 960 });
    let frame = await navigate(path);
    const browse = frame.locator('a[href="#chapters"]');
    assert.equal(await browse.count(), 1, `visible chapter anchor: ${id}`);
    const anchorScroll = await page.evaluate(() => {
      const iframe = document.querySelector('.curriculum-frame');
      const target = iframe.contentDocument.getElementById('chapters');
      const destination = scrollY + iframe.getBoundingClientRect().top + target.getBoundingClientRect().top - 24;
      return Math.min(Math.max(destination, 0), Math.max(document.documentElement.scrollHeight - innerHeight, 0));
    });
    await browse.click();
    await page.waitForFunction(expected => Math.abs(scrollY - expected) < 12, anchorScroll);
    for (const topic of [module.topics[0], module.topics.at(-1)]) {
      frame = await navigate(path);
      await frame.locator(`.chapter-card[href$="/${topic.id}.html"]`).click();
      const article = await ready(`basics/${id}/${topic.id}.html`);
      assert.equal(await article.locator('h1').innerText(), topic.title, `chapter opens article: ${id}/${topic.id}`);
      await article.locator('.back').click();
      frame = await ready(path);
      assert.equal(await frame.locator('h1').innerText(), module.title, `article returns to designed directory: ${id}`);
    }
    frame = await navigate(path);
    await frame.locator('.wall-back').click();
    await page.waitForURL(/#\/\?section=modules/);
    await page.locator(`.module-card[href$="/basics/${id}/index.html"]`).click();
    await ready(path);
  }

  const wall = await navigate('wall/index.html');
  assert.equal(await wall.locator('.chapter-card').count(), modules.wall.topics.length);
  assert.equal(await wall.locator('.chapter-card svg').count(), 0, 'wall still has no chapter icons');
  assert.equal(await wall.locator('figure img').count(), 1, 'wall retains its model image');
  await wall.locator('figure img').evaluate(image => image.decode());
  assert.deepEqual(errors, [], 'no runtime errors in chapter directory or navigation');
  await writeFile(`${output}/browser-results.json`, JSON.stringify(results, null, 2));
  console.log('Chapter directory browser checks passed: 6 abstract pages × 7 widths, no model images, complete chapters, homepage/article/return links and chapter anchor; wall model preserved.');
} finally {
  await browser.close();
}
