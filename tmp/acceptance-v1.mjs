import { chromium } from 'playwright';

const BASE = 'http://localhost:5200';
const VARIANT_URL = BASE + '/#/node/wall-damp-proof-course';
const NORMAL_NODES = [
  { id: 'flat-roof-01', label: 'flat-roof' },
  { id: 'construction-column-01', label: 'column' },
];

async function testVariantNode() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  let pass = 0, fail = 0;

  console.log('=== Variant Node: wall-damp-proof-course ===\n');

  // 1. Initial navigation (in-app nav from library)
  await page.goto(BASE + '/#/library', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.goto(VARIANT_URL, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);

  let state = await page.evaluate(() => {
    const allCanvas = document.querySelectorAll('canvas');
    const c = allCanvas[0];
    const r = c ? c.getBoundingClientRect() : null;
    let topTag = null;
    if (r && r.width > 0) {
      const els = document.elementsFromPoint(r.left + r.width/2, r.top + r.height/2);
      topTag = els[0]?.tagName;
    }
    return { n: allCanvas.length, sz: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : '0x0', top: topTag };
  });

  console.log(`initial nav: canvas=${state.n}/${state.sz} top=${state.top} errs=${errors.length}`);

  // 2. Check labels exist
  const labels = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button[role="radio"]'));
    return btns.map(b => ({ label: b.textContent?.trim().slice(0, 20), checked: b.getAttribute('aria-checked') }));
  });
  console.log(`labels: ${JSON.stringify(labels)}`);

  // 3. Click label B
  await page.click('button[role="radio"]:nth-child(2)');
  await page.waitForTimeout(1000);
  const afterClick = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const r = c ? c.getBoundingClientRect() : null;
    const infoText = document.body.textContent?.includes('透水材料垫层') ? 'yes' : 'no';
    return { sz: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : '0x0', infoShows: infoText };
  });
  console.log(`click B: canvas=${afterClick.sz} info=${afterClick.infoShows}`);

  // 4. Click "全部展示"
  const showAllBtn = await page.$('button:has-text("全部展示")');
  if (showAllBtn) {
    await showAllBtn.click();
    await page.waitForTimeout(500);
    console.log('showAll: button clicked');
  }

  // 5. Click Reset
  const resetBtn = await page.$('button[title="重置视角"]');
  if (resetBtn) {
    await resetBtn.click();
    await page.waitForTimeout(500);
    console.log('reset: button clicked');
  }

  // 6. 5x page.reload()
  console.log('\n--- 5x page.reload() ---');
  for (let i = 1; i <= 5; i++) {
    errors.length = 0;
    await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(10000);

    state = await page.evaluate(() => {
      const allCanvas = document.querySelectorAll('canvas');
      const c = allCanvas[0];
      const r = c ? c.getBoundingClientRect() : null;
      let topTag = null;
      if (r && r.width > 0) {
        const els = document.elementsFromPoint(r.left + r.width/2, r.top + r.height/2);
        topTag = els[0]?.tagName;
      }
      return { n: allCanvas.length, sz: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : '0x0', top: topTag };
    });

    const ok = state.n === 1 && state.sz !== '0x0' && state.top === 'CANVAS' && errors.length === 0;
    console.log(`${ok ? 'PASS' : 'FAIL'} reload #${i}: canvas=${state.n}/${state.sz} top=${state.top} errs=${errors.length}`);
    ok ? pass++ : fail++;
  }

  await ctx.close();
  await browser.close();
  return { pass, fail };
}

async function testNormalRegression(nodeId, label) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  let pass = 0, fail = 0;

  console.log(`\n--- Normal regression: ${label} ---`);

  await page.goto(BASE + '/#/node/' + nodeId, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(4000);

  for (let i = 1; i <= 5; i++) {
    errors.length = 0;
    await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(5000);

    const state = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      const r = c ? c.getBoundingClientRect() : null;
      let topTag = null;
      if (r && r.width > 0) {
        const els = document.elementsFromPoint(r.left + r.width/2, r.top + r.height/2);
        topTag = els[0]?.tagName;
      }
      return { sz: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : '0x0', top: topTag };
    });

    const ok = state.sz !== '0x0' && state.top === 'CANVAS' && errors.length === 0;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${label} reload #${i}: canvas=${state.sz} top=${state.top} errs=${errors.length}`);
    ok ? pass++ : fail++;
  }

  await ctx.close();
  await browser.close();
  return { pass, fail };
}

async function main() {
  console.log('=== V1 Acceptance Test ===\n');

  const vr = await testVariantNode();
  const nr1 = await testNormalRegression('flat-roof-01', 'flat-roof');
  const nr2 = await testNormalRegression('construction-column-01', 'column');

  const total = vr.pass + vr.fail + nr1.pass + nr1.fail + nr2.pass + nr2.fail;
  const totalPass = vr.pass + nr1.pass + nr2.pass;
  const totalFail = vr.fail + nr1.fail + nr2.fail;

  console.log(`\n=== RESULT: ${totalPass} pass, ${totalFail} fail (total ${total}) ===`);
  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
