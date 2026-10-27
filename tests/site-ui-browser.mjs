import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = (process.argv[2] ?? 'http://127.0.0.1:5173').replace(/\/$/, '');
const output = 'tmp/site-ui-unified-2026-10-14/app';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
const errors = [];
const routes = [
  ['/library', '构造节点', 'library'],
  ['/curriculum/cases', '案例应用', 'cases'],
  ['/curriculum/cases/farnsworth-house', '法恩斯沃斯住宅', 'case-detail'],
  ['/games', '作业训练', 'games'],
  ['/resources', '学习资源', 'resources'],
  ['/ai', '构造伙伴', 'companion'],
  ['/data', '学习数据', 'data'],
  ['/tools', '工具箱', 'tools'],
  ['/contribute', '贡献节点', 'contribute'],
  ['/lesson/missing.html', '未找到该课程章节', 'missing'],
];

try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push({ route: page.url(), message: error.message, stack: error.stack }));
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width > 760 ? 1000 : 844 });
    for (const [route, title, name] of routes) {
      await page.goto(`${base}/#${route}`);
      await page.getByRole('heading', { level: 1, name: title, exact: true }).waitFor();
      const layout = await page.evaluate(() => {
        const heading = document.querySelector('.site-page-title').getBoundingClientRect();
        const logo = document.querySelector('.site-brand-mark').getBoundingClientRect();
        const main = document.querySelector('.site-page main.site-container');
        const mainLeft = main ? main.getBoundingClientRect().x + parseFloat(getComputedStyle(main).paddingLeft) : heading.x;
        const dock = document.querySelector('.companion-dock');
        return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, titleLeft: heading.x, brandLeft: logo.x, mainLeft, dockTop: getComputedStyle(dock).display === 'flex' ? dock.getBoundingClientRect().top : null };
      });
      assert(layout.scrollWidth <= width + 1, `no horizontal overflow: ${route}/${width}`);
      assert(Math.abs(layout.titleLeft - layout.brandLeft) <= 1, `header alignment: ${route}/${width}`);
      assert(Math.abs(layout.titleLeft - layout.mainLeft) <= 1, `content alignment: ${route}/${width}`);
      if (width <= 760) {
        const launcher = await page.locator('.companion-launcher').boundingBox();
        assert(launcher.y >= layout.dockTop && launcher.y + launcher.height <= 845, `launcher stays in dock: ${route}/${width}`);
      }
      results.push({ route, width, ...layout });
      if ([1440, 390].includes(width) && ['library', 'resources', 'data', 'case-detail'].includes(name)) {
        await page.screenshot({ path: `${output}/${name}-${width}.png` });
      }
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/#/resources`);
  const summary = page.locator('summary').first();
  await summary.focus();
  await page.keyboard.press('Enter');
  assert(await page.locator('details').first().evaluate(el => el.open), 'resource group opens from keyboard');
  await page.locator('details[open] a').first().waitFor();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('details').first().evaluate(el => el.open), false, 'resource group closes from keyboard');

  await page.goto(`${base}/#/tools`);
  await page.locator('.site-empty-state a').click();
  await page.getByRole('heading', { level: 1, name: '构造节点', exact: true }).waitFor();
  assert.equal(await page.locator('.library-node-card').count(), 85, 'empty-state action opens complete node catalog');

  // Short embedded documents must not reserve the mobile dock twice.
  await page.setViewportSize({ width: 700, height: 1366 });
  await page.goto(`${base}/#/lesson/basics/door-window/index.html`);
  await page.waitForFunction(() => document.querySelector('.curriculum-frame')?.contentDocument?.documentElement.dataset.embedded === 'true');
  await page.waitForFunction(() => {
    const frame = document.querySelector('.curriculum-frame');
    return Math.abs(parseInt(frame.style.height) - frame.contentDocument.body.getBoundingClientRect().height) < 2;
  });
  const shortDocument = await page.evaluate(() => {
    const frame = document.querySelector('.curriculum-frame');
    return { body: frame.contentDocument.body.getBoundingClientRect().height, frame: frame.getBoundingClientRect().height, page: document.documentElement.scrollHeight, viewport: innerHeight };
  });
  assert(Math.abs(shortDocument.body - shortDocument.frame) < 2, `iframe height matches body: ${JSON.stringify(shortDocument)}`);
  assert(shortDocument.page <= shortDocument.viewport + 2, `short course has no empty overflow: ${JSON.stringify(shortDocument)}`);
  results.push({ route: 'short-embedded-course', width: 700, ...shortDocument });

  await page.getByRole('button', { name: '打开构造伙伴', exact: true }).click();
  await page.getByRole('button', { name: '伙伴设置', exact: true }).click();
  await page.getByRole('button', { name: '隐藏伙伴', exact: true }).click();
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-companion-dock'));
  await page.waitForFunction(() => {
    const frame = document.querySelector('.curriculum-frame');
    return Math.abs(frame.getBoundingClientRect().height - frame.contentDocument.body.getBoundingClientRect().height) < 2;
  });
  assert(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 2), 'hiding companion restores full course viewport');
  await page.goto(`${base}/#/ai`);
  await page.locator('.companion-intro-copy button').click();
  await page.getByRole('button', { name: '关闭问答面板', exact: true }).click();

  for (const width of [1440, 768, 760, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/#/node/construction-column-01`);
    await page.locator('.node-detail-heading').waitFor();
    await page.locator('.node-viewport canvas').waitFor();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    if (width <= 760) await page.waitForFunction(() => {
      const canvas = document.querySelector('.node-viewport canvas').getBoundingClientRect();
      const toolbar = document.querySelector('.node-control-bar').getBoundingClientRect();
      return canvas.height > 0 && canvas.bottom <= toolbar.top + 1;
    });
    const bounds = await page.evaluate(() => {
      const dock = document.querySelector('.companion-dock');
      const bottom = getComputedStyle(dock).display === 'flex' ? dock.getBoundingClientRect().top : innerHeight;
      const controls = [...document.querySelectorAll('.node-control-button')].map(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
      return { bottom, nodeBottom: document.querySelector('.node-detail-page').getBoundingClientRect().bottom, pageHeight: document.documentElement.scrollHeight, canvasBottom: document.querySelector('.node-viewport canvas').getBoundingClientRect().bottom, toolbarTop: document.querySelector('.node-control-bar').getBoundingClientRect().top, controls };
    });
    assert(Math.abs(bounds.nodeBottom - bounds.bottom) <= 2, `node workspace fits above dock: ${width}/${JSON.stringify(bounds)}`);
    assert(bounds.pageHeight <= 902, `node page does not scroll: ${width}`);
    if (width <= 760) assert(bounds.toolbarTop >= bounds.canvasBottom - 1, `mobile toolbar has dedicated space outside model canvas: ${width}`);
    for (const control of bounds.controls) {
      assert(control.x >= 0 && control.x + control.width <= width + 1 && control.y + control.height <= bounds.bottom, `toolbar button stays visible: ${width}`);
      if (width <= 760) assert(control.width >= 44 && control.height >= 44, `mobile control target: ${width}`);
    }
    results.push({ route: 'node-workbench', width, ...bounds });
  }
  await writeFile(`${output}/results.json`, JSON.stringify({ results, errors }, null, 2));
  assert.deepEqual(errors, []);
  console.log(`Shared UI checks passed: ${results.length} layouts, aligned headers, keyboard resources, complete catalog, mobile dock and toolbar.`);
} finally {
  await browser.close();
}
