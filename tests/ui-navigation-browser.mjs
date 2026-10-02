import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const open = path => page.goto(`${base}/#${path}`);
async function readyCourse(path) {
  await page.waitForFunction(expected => {
    const doc = document.querySelector('.curriculum-frame')?.contentDocument;
    return doc?.readyState === 'complete' && doc.location.pathname.endsWith(expected) && doc.querySelector('.page-head h1, .wall-intro h1');
  }, path);
}
try {
  for (const section of ['introduction', 'modules', 'principles']) {
    const coldPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await coldPage.route('**/homepage.css', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });
    await coldPage.goto(`${base}/#/?section=${section}`);
    await coldPage.waitForFunction(id => {
      const target = document.getElementById(id);
      const expected = Math.min(target.getBoundingClientRect().top + scrollY, document.documentElement.scrollHeight - innerHeight);
      return getComputedStyle(target).visibility === 'visible' && scrollY > 0 && Math.abs(scrollY - expected) < 2;
    }, section);
    console.log(`PASS cold section positioning: ${section}`);
    await coldPage.close();
  }
  await open('/lesson/basics/wall/wall-design-requirements.html');
  await readyCourse('wall-design-requirements.html');
  const longHeight = await page.locator('.curriculum-frame').evaluate(e => e.clientHeight);
  await page.frameLocator('.curriculum-frame').locator('.chapter-nav a[href$="wall-role.html"]').click();
  await readyCourse('wall-role.html');
  await page.waitForTimeout(150);
  const shortHeight = await page.locator('.curriculum-frame').evaluate(e => e.clientHeight);
  assert(shortHeight < longHeight - 500, `${longHeight} → ${shortHeight}: course must shrink`);
  await page.frameLocator('.curriculum-frame').locator('.chapter-nav a[href$="wall-design-requirements.html"]').click();
  await readyCourse('wall-design-requirements.html');
  assert(await page.locator('.curriculum-frame').evaluate(e => e.clientHeight) > shortHeight + 500);
  console.log(`PASS course height shrink/grow: ${longHeight} → ${shortHeight}`);

  await open('/library');
  const card = page.locator('.ui-resource-card[href$="/node/organized-drainage-01"]');
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const listY = await page.evaluate(() => scrollY);
  assert(listY > 0);
  await card.click();
  await page.locator('.node-detail-page').waitFor();
  await page.waitForTimeout(100);
  assert(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1));
  await page.locator('.site-back-link').click();
  await page.locator('.site-page-title').filter({ hasText: '构造节点库' }).waitFor();
  await page.waitForTimeout(100);
  const returnedListY = await page.evaluate(() => scrollY);
  assert(Math.abs(returnedListY - listY) < 2, `Explicit library return restores position: ${listY} → ${returnedListY}`);
  await card.click();
  await page.locator('.node-detail-page').waitFor();
  await page.goBack();
  await page.locator('.site-page-title').filter({ hasText: '构造节点库' }).waitFor();
  await page.waitForTimeout(100);
  assert(Math.abs(await page.evaluate(() => scrollY) - listY) < 2, 'Browser back restores position');
  console.log(`PASS node list return: ${listY}px retained by button and browser back`);

  for (const width of [1440, 768, 760, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await open('/node/organized-drainage-01');
    await page.locator('.node-detail-page').waitFor();
    assert(await page.evaluate(() => Math.abs(document.querySelector('.node-detail-page').getBoundingClientRect().bottom - innerHeight) < 2));
    console.log(`PASS workbench height at ${width}px`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await open('/lesson/missing-page.html');
  await page.getByRole('heading', { name: '未找到该课程章节' }).waitFor();
  assert.equal(await page.locator('iframe').count(), 0);
  await page.locator('.site-back-link').click();
  await page.waitForURL(/#\/$/);
  console.log('PASS missing course has an explicit error and return action');

  const brokenSource = '**/curriculum/introduction/intro-classification.html';
  await page.route(brokenSource, route => route.fulfill({ contentType: 'text/html', body: '<html><body><h1>SPA fallback homepage</h1></body></html>' }));
  await open('/lesson/introduction/intro-classification.html');
  await page.getByRole('heading', { name: '课程加载失败' }).waitFor();
  await page.unroute(brokenSource);
  await page.getByRole('button', { name: '重新加载课程' }).click();
  await readyCourse('intro-classification.html');
  console.log('PASS HTTP 200 fallback detected and retry recovers the course');

  const manifest = JSON.parse(await readFile('src/data/curriculumDocuments.json', 'utf8'));
  for (const [oldPath, target] of Object.entries(manifest.legacyRoutes)) {
    if (target.startsWith('/lesson/')) assert(manifest.documents.includes(target.slice('/lesson/'.length)), `Missing legacy target: ${oldPath}`);
  }
  for (const oldPath of ['/curriculum/wall', '/textbook/wall/wall-design-requirements', '/textbook/roof/index', '/textbook/deformation-joint']) {
    await open(oldPath);
    const expected = manifest.legacyRoutes[oldPath.replace('/curriculum/', '/textbook/')];
    await page.waitForURL(url => url.hash === `#${expected}`);
    console.log(`Checking legacy bookmark: ${oldPath} → ${expected}`);
    await readyCourse(expected.slice('/lesson/'.length));
  }
  console.log('PASS legacy course bookmarks resolve to the current UI');

  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/curriculum/cases', '/games', '/resources', '/ai-extend', '/data']) {
      await open(path);
      await page.locator('h1.site-page-title').waitFor();
      assert.equal(await page.getByText('返回主控制台', { exact: true }).count(), 0);
      assert.equal(await page.locator('.site-subpage-topbar .site-back-link').count(), 1);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await open('/resources');
    await page.getByText('空间设计', { exact: true }).click();
    await page.getByRole('link', { name: '建筑学长', exact: true }).waitFor();
    console.log(`PASS adapted UI and resource disclosure at ${width}px`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
