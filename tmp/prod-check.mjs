import { chromium } from 'playwright';

const BASE = 'http://localhost:5300/tcugz';
const VARIANT_URL = BASE + '/#/node/wall-damp-proof-course';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  let pass = 0, fail = 0;

  // Direct URL (cold load)
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
  console.log(`prod initial: canvas=${state.n}/${state.sz} top=${state.top}`);

  // 3x reload
  for (let i = 1; i <= 3; i++) {
    errors.length = 0;
    await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(8000);

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
    console.log(`${ok ? 'PASS' : 'FAIL'} prod reload #${i}: canvas=${state.n}/${state.sz} top=${state.top} errs=${errors.length}`);
    ok ? pass++ : fail++;
  }

  // Check labels
  const labels = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button[role="radio"]'));
    return btns.length;
  });
  console.log(`labels: ${labels}`);

  // Check normal node
  await page.goto(BASE + '/#/node/flat-roof-01', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  const normalState = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const r = c ? c.getBoundingClientRect() : null;
    return { sz: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : '0x0' };
  });
  console.log(`prod normal flat-roof: canvas=${normalState.sz}`);

  console.log(`\n=== PROD: ${pass} pass, ${fail} fail ===`);

  await ctx.close();
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})();
