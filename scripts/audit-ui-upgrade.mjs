import { chromium } from 'playwright';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:5174';
const out = process.argv.find(arg => arg.startsWith('--out='))?.slice('--out='.length) ?? 'audit-output/ui-upgrade-2026-10-02';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const flowsOnly = process.argv.includes('--flows-only');
const result = flowsOnly ? JSON.parse(await readFile(`${out}/results.json`, 'utf8')) : { routes: [], links: [], flows: {} };
async function walk(root) {
  const entries = await readdir(root, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? walk(join(root, entry.name)) : join(root, entry.name)))).flat();
}
const documents = (await walk('public/curriculum')).filter(path => path.endsWith('.html'));
for (const file of documents) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/(?:href|src)="(\/curriculum\/[^"#]+)"/g)) {
    try { await readFile(join('public', match[1])); }
    catch { result.links.push({ file, missing: match[1] }); }
  }
}
result.documentCount = documents.length;
const routes = ['/', '/library', '/curriculum/cases', '/games', '/resources', '/ai-extend', '/node/organized-drainage-01', '/node/wall-damp-proof-course', '/textbook/wall/wall-design-requirements', '/lesson/basics/foundation/index.html', '/lesson/basics/wall/wall-design-requirements.html'];
for (const width of flowsOnly ? [] : [1440, 390, 320]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  let failures = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  for (const route of routes) {
    failures = []; errors = [];
    await page.goto(`${base}/#${route}`);
    if (route.startsWith('/lesson/')) await page.waitForFunction(path => {
      const doc = document.querySelector('.curriculum-frame')?.contentDocument;
      return doc?.readyState === 'complete' && doc.location.pathname.endsWith(path) && doc.querySelector('h1');
    }, route.slice('/lesson/'.length));
    else await page.waitForTimeout(route.startsWith('/node/') ? 1200 : 450);
    const metrics = await page.evaluate(() => {
      const frame = document.querySelector('iframe');
      const doc = frame?.contentDocument ?? document;
      const back = doc.querySelector('.site-back-link, .back, .wall-back');
      const rect = back?.getBoundingClientRect();
      return {
        title: document.title,
        heading: doc.querySelector('h1')?.textContent,
        horizontalOverflow: doc.documentElement.scrollWidth > (frame?.clientWidth ?? innerWidth),
        outerHorizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        documentHeight: document.documentElement.scrollHeight,
        viewportHeight: innerHeight,
        back: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
        canvases: doc.querySelectorAll('canvas').length,
        blank: !doc.body.innerText.trim(),
      };
    });
    result.routes.push({ width, route, ...metrics, failures: [...failures], errors: [...errors] });
    await writeFile(`${out}/results.json`, JSON.stringify(result, null, 2));
    if (width !== 320 && ['/', '/library', '/curriculum/cases', '/games', '/node/organized-drainage-01'].includes(route)) {
      await page.screenshot({ path: `${out}/${width}-${route.replaceAll('/', '_') || 'home'}.png` });
    }
  }
  await page.close();
  console.log(`Viewport ${width}: ${routes.length} routes inspected`);
}
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${base}/#/lesson/basics/wall/wall-design-requirements.html`);
await page.frameLocator('.curriculum-frame').locator('.article').waitFor();
await page.waitForTimeout(300);
const longHeight = await page.locator('.curriculum-frame').evaluate(frame => frame.getBoundingClientRect().height);
await page.frameLocator('.curriculum-frame').locator('.chapter-nav a[href$="wall-role.html"]').click();
await page.frameLocator('.curriculum-frame').locator('.empty').waitFor();
await page.waitForTimeout(300);
result.flows.courseHeight = await page.locator('.curriculum-frame').evaluate(frame => ({
  frameHeight: frame.getBoundingClientRect().height,
  contentBottom: frame.contentDocument.querySelector('.content').getBoundingClientRect().bottom,
  bodyHeight: frame.contentDocument.body.scrollHeight,
}));
result.flows.courseHeight.longHeight = longHeight;
await writeFile(`${out}/results.json`, JSON.stringify(result, null, 2));
await page.screenshot({ path: `${out}/course-short-after-long.png`, fullPage: true });

await page.goto(`${base}/#/library`);
const nodeCard = page.locator('.ui-resource-card[href$="/node/organized-drainage-01"]');
await nodeCard.scrollIntoViewIfNeeded();
const libraryY = await page.evaluate(() => scrollY);
await nodeCard.click();
await page.locator('.node-detail-page').waitFor();
await page.locator('.site-back-link').click();
await page.locator('.site-page-title').filter({ hasText: '构造节点库' }).waitFor();
await page.waitForTimeout(150);
result.flows.libraryReturn = { before: libraryY, after: await page.evaluate(() => scrollY) };
await writeFile(`${out}/results.json`, JSON.stringify(result, null, 2));

await page.goto(`${base}/#/`);
await page.locator('#node-model-root canvas').waitFor({ timeout: 20000 });
await page.locator('#sidebar-toggle').click();
await page.locator('#introduction').scrollIntoViewIfNeeded();
const homeY = await page.evaluate(() => { window.__auditCanvas = document.querySelector('#node-model-root canvas'); return scrollY; });
await page.locator('a[href*="lesson/introduction/intro-classification.html"]').first().click();
await page.frameLocator('.curriculum-frame').locator('.back').click();
await page.waitForURL(/section=introduction/);
result.flows.homeReturn = { before: homeY, ...await page.evaluate(() => ({ after: scrollY, collapsed: document.querySelector('.app').classList.contains('sidebar-collapsed'), canvasSame: window.__auditCanvas === document.querySelector('#node-model-root canvas'), focused: document.activeElement?.tagName })) };

const coldPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await coldPage.goto(`${base}/#/?section=modules`);
await coldPage.locator('#modules').waitFor();
await coldPage.waitForTimeout(500);
result.flows.directSection = await coldPage.evaluate(() => ({ scrollY, sectionTop: document.querySelector('#modules').getBoundingClientRect().top }));
await coldPage.close();

await page.goto(`${base}/#/lesson/missing-page.html`);
await page.getByRole('heading', { name: '未找到该课程章节' }).waitFor();
result.flows.missingCourse = await page.evaluate(() => ({ title: document.title, heading: document.querySelector('h1.site-page-title')?.textContent, frameCount: document.querySelectorAll('.curriculum-frame').length }));
await writeFile(`${out}/results.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ documentCount: result.documentCount, missingLinks: result.links, routeChecks: result.routes.length, routeIssues: result.routes.filter(route => route.horizontalOverflow || route.outerHorizontalOverflow || route.blank || route.failures.length || route.errors.length), flows: result.flows }, null, 2));
await browser.close();
