import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:5200';
const VARIANT_URL = BASE + '/#/node/wall-damp-proof-course';
const SCREENSHOT_DIR = 'tmp/screenshots';
mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function screenshot(page, name) {
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: false });
}

async function testVariantLayout() {
  const browser = await chromium.launch({ headless: true });
  let pass = 0, fail = 0;

  const viewports = [
    { w: 1440, h: 900, label: 'desktop' },
    { w: 1024, h: 768, label: '1024px' },
    { w: 768, h: 1024, label: '768px' },
    { w: 390, h: 844, label: 'mobile' },
  ];

  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    console.log(`\n=== ${vp.label} (${vp.w}x${vp.h}) ===`);

    await page.goto(VARIANT_URL, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(5000);

    // Canvas check
    const state = await page.evaluate(() => {
      const allCanvas = document.querySelectorAll('canvas');
      const c = allCanvas[0];
      const r = c ? c.getBoundingClientRect() : null;
      let topTag = null;
      if (r && r.width > 0) {
        const els = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        topTag = els[0]?.tagName;
      }
      const hasXOverflow = document.documentElement.scrollWidth > window.innerWidth;
      return {
        canvasN: allCanvas.length,
        sz: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : '0x0',
        top: topTag,
        xOverflow: hasXOverflow,
      };
    });

    const canvasOk = state.canvasN === 1 && state.sz !== '0x0' && state.top === 'CANVAS';
    console.log(`  canvas: ${canvasOk ? 'OK' : 'FAIL'} ${state.canvasN}/${state.sz} top=${state.top} xOverflow=${state.xOverflow}`);
    if (canvasOk && !state.xOverflow) pass++; else fail++;

    // Labels check
    const labels = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button[role="radio"]')).length;
    });
    console.log(`  labels: ${labels}`);

    // Click A
    const btnA = await page.$('button[role="radio"]:first-child');
    if (btnA) { await btnA.click(); await page.waitForTimeout(500); }
    const afterA = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return { sz: c ? `${Math.round(c.getBoundingClientRect().width)}x${Math.round(c.getBoundingClientRect().height)}` : '0x0' };
    });
    console.log(`  select A: canvas=${afterA.sz}`);

    // Screenshot
    await screenshot(page, `${vp.label}-selected-A`);

    // Show all
    const showAllBtn = await page.$('button:has-text("全部展示"), button:has-text("返回全部展示")');
    if (showAllBtn) { await showAllBtn.click(); await page.waitForTimeout(500); }

    await screenshot(page, `${vp.label}-all`);

    // Horizontal scroll check
    const noHScroll = !state.xOverflow;
    if (noHScroll) pass++; else fail++;

    await ctx.close();
  }

  await browser.close();
  return { pass, fail };
}

async function testSelectionSync() {
  console.log('\n=== Selection sync: labels + diagram + teaching ===');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(VARIANT_URL, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);

  let pass = 0, fail = 0;

  // Click B label
  const btnB = await page.$('button[role="radio"]:nth-child(2)');
  if (btnB) await btnB.click();
  await page.waitForTimeout(500);
  const hasB = await page.evaluate(() => document.body.textContent?.includes('透水材料垫层'));
  console.log(`  click B label → text "透水材料垫层": ${hasB ? 'yes' : 'NO'}`);

  // Click C via teaching panel overview
  const cards = await page.$$('button:has-text("室内外地面有高差")');
  if (cards.length > 0) { await cards[0].click(); await page.waitForTimeout(500); }
  const hasC = await page.evaluate(() => document.body.textContent?.includes('垂直防潮层'));
  console.log(`  click C card → text "垂直防潮层": ${hasC ? 'yes' : 'NO'}`);

  // Show all
  const showAllBtns = await page.$$('button:has-text("返回全部展示"), button:has-text("全部展示")');
  if (showAllBtns.length > 0) { await showAllBtns[0].click(); await page.waitForTimeout(500); }
  const hasAll = await page.evaluate(() => document.body.textContent?.includes('点击模型、标签或剖面图'));
  console.log(`  showAll → text "点击模型": ${hasAll ? 'yes' : 'NO'}`);

  const canvasOk = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const r = c ? c.getBoundingClientRect() : null;
    return r && r.width > 0 && r.height > 0;
  });
  console.log(`  canvas present: ${canvasOk ? 'yes' : 'FAIL'}`);

  console.log(`  errors: ${errors.length}`);
  if (hasB && hasC && hasAll && canvasOk && errors.length === 0) { pass = 3; } else { fail = 3; }

  await ctx.close();
  await browser.close();
  return { pass, fail };
}

async function testReloads() {
  console.log('\n=== 5x page.reload() ===');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  // Initial navigation
  await page.goto(VARIANT_URL, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);

  let pass = 0, fail = 0;

  for (let i = 1; i <= 5; i++) {
    errors.length = 0;
    await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(10000);

    const state = await page.evaluate(() => {
      const allCanvas = document.querySelectorAll('canvas');
      const c = allCanvas[0];
      const r = c ? c.getBoundingClientRect() : null;
      let topTag = null;
      if (r && r.width > 0) {
        const els = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        topTag = els[0]?.tagName;
      }
      const labels = document.querySelectorAll('button[role="radio"]').length;
      return {
        canvasN: allCanvas.length,
        sz: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : '0x0',
        top: topTag,
        labels,
      };
    });

    const ok = state.canvasN === 1 && state.sz !== '0x0' && state.top === 'CANVAS' && errors.length === 0;
    console.log(`  ${ok ? 'PASS' : 'FAIL'} reload #${i}: canvas=${state.canvasN}/${state.sz} top=${state.top} labels=${state.labels} errs=${errors.length}`);
    ok ? pass++ : fail++;
  }

  await ctx.close();
  await browser.close();
  return { pass, fail };
}

async function testNormalRegression() {
  console.log('\n=== Normal node regression ===');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  let pass = 0, fail = 0;

  // flat-roof-01
  await page.goto(BASE + '/#/node/flat-roof-01', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(4000);
  for (let i = 1; i <= 3; i++) {
    errors.length = 0;
    await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(5000);
    const st = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      const r = c ? c.getBoundingClientRect() : null;
      return { sz: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : '0x0', top: document.elementsFromPoint(r.left + r.width/2, r.top + r.height/2)[0]?.tagName };
    });
    const ok = st.sz !== '0x0' && st.top === 'CANVAS' && errors.length === 0;
    console.log(`  ${ok ? 'PASS' : 'FAIL'} flat-roof reload #${i}: ${st.sz} top=${st.top}`);
    ok ? pass++ : fail++;
  }

  // construction-column-01
  await page.goto(BASE + '/#/node/construction-column-01', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(4000);
  for (let i = 1; i <= 3; i++) {
    errors.length = 0;
    await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(5000);
    const st = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      const r = c ? c.getBoundingClientRect() : null;
      return { sz: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : '0x0', top: document.elementsFromPoint(r.left + r.width/2, r.top + r.height/2)[0]?.tagName };
    });
    const ok = st.sz !== '0x0' && st.top === 'CANVAS' && errors.length === 0;
    console.log(`  ${ok ? 'PASS' : 'FAIL'} column reload #${i}: ${st.sz} top=${st.top}`);
    ok ? pass++ : fail++;
  }

  // Route switching
  console.log('  route switching...');
  for (let i = 1; i <= 5; i++) {
    errors.length = 0;
    await page.goto(BASE + '/#/node/flat-roof-01', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.goto(VARIANT_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    const ok = errors.length === 0;
    if (!ok) console.log(`    switch #${i}: errors=${errors}`);
  }
  const finalCanvas = await page.evaluate(() => document.querySelectorAll('canvas').length);
  console.log(`  route switch 5x: canvas=${finalCanvas} errs=${errors.length}`);
  if (finalCanvas === 1 && errors.length === 0) pass++;

  await ctx.close();
  await browser.close();
  return { pass, fail };
}

async function main() {
  console.log('=== V2 Three-Column Layout Acceptance ===\n');

  const r1 = await testVariantLayout();
  const r2 = await testSelectionSync();
  const r3 = await testReloads();
  const r4 = await testNormalRegression();

  const tp = r1.pass + r2.pass + r3.pass + r4.pass;
  const tf = r1.fail + r2.fail + r3.fail + r4.fail;
  console.log(`\n=== TOTAL: ${tp} pass, ${tf} fail ===`);
  process.exit(tf > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
