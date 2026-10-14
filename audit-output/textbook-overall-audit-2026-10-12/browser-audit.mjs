import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const output = 'audit-output/textbook-overall-audit-2026-10-12';
const base = 'http://127.0.0.1:5177/';
const { documents } = JSON.parse(await readFile('src/data/curriculumDocuments.json', 'utf8'));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
const errors = []; const observations = [];
page.on('pageerror', error => errors.push({ type: 'pageerror', message: error.message, route: page.url() }));
await page.exposeFunction('reportOverallAuditError', error => errors.push(error));
await page.addInitScript(() => window.addEventListener('error', event => {
  if (event.message) window.reportOverallAuditError({ type: 'windowerror', message: event.message, route: location.href });
}));
try {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 960 });
    for (const [index, path] of documents.entries()) {
      try {
        await page.goto(`${base}#/lesson/${path}`);
        await page.waitForFunction(expected => {
          const frame = document.querySelector('.curriculum-frame');
          return frame?.contentDocument?.readyState === 'complete' && frame.contentWindow.location.pathname.endsWith(`/lesson/${expected}`)
            && frame.contentDocument.querySelector('.page-head h1, .wall-intro h1') && parseInt(frame.style.height) > 300;
        }, path, { timeout: 15000 });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const reading = await page.evaluate(() => {
          const iframe = document.querySelector('.curriculum-frame');
          const doc = iframe.contentDocument;
          const article = doc.querySelector('.article');
          const table = doc.querySelector('.article-table');
          return { title: doc.querySelector('h1')?.textContent?.trim(), outerWidth: document.documentElement.scrollWidth, viewport: innerWidth,
            frameWidth: doc.documentElement.scrollWidth, frameViewport: doc.documentElement.clientWidth,
            frameHeight: parseInt(iframe.style.height), bodyHeight: Math.ceil(doc.body.getBoundingClientRect().height),
            article: Boolean(article), imagesInArticle: article?.querySelectorAll('img').length ?? 0, linksInArticle: article?.querySelectorAll('a').length ?? 0,
            tableScrollable: table ? table.scrollWidth > table.clientWidth : false, empty: Boolean(doc.querySelector('.empty')),
            keyboardFocusableLinks: doc.querySelectorAll('a[href]').length, namedSections: doc.querySelectorAll('h2[id]').length,
            chapterNavigation: Boolean(doc.querySelector('.chapter-nav')), tableOfContents: Boolean(doc.querySelector('.article-toc')) };
        });
        observations.push({ path, width, ...reading, overflow: reading.outerWidth > width + 2 || reading.frameWidth > reading.frameViewport + 2,
          heightMismatch: Math.abs(reading.frameHeight - reading.bodyHeight) > 3 });
      } catch (error) { observations.push({ path, width, failure: error.message }); }
      if ((index + 1) % 20 === 0) console.log(`Read ${index + 1}/${documents.length} pages at ${width}px`);
    }
  }
  for (const [name, route, width] of [
    ['principles-directory-desktop', '/lesson/principles/index.html', 1440],
    ['drawing-standards-mobile', '/lesson/introduction/intro-drawing-standards.html', 390],
    ['foundation-types-desktop', '/lesson/basics/foundation/foundation-types.html', 1440],
    ['practice-stairs-mobile', '/lesson/practice/stairs-drawing.html', 390],
  ]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto(`${base}#${route}`);
    await page.waitForFunction(() => document.querySelector('.curriculum-frame')?.contentDocument?.querySelector('h1'));
    await page.screenshot({ path: `${output}/${name}.png` });
  }
  const summary = { attempted: observations.length, failures: observations.filter(item => item.failure),
    overflows: observations.filter(item => item.overflow), heightMismatches: observations.filter(item => item.heightMismatch),
    emptyPages: observations.filter(item => item.empty), runtimeErrors: errors, desktopAndMobileWidths: [1440,390,320] };
  await writeFile(`${output}/browser-evidence.json`, JSON.stringify({ summary, observations }, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
} finally { await browser.close(); }
