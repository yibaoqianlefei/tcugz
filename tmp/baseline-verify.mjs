import { chromium } from 'playwright';

const BASE = 'http://localhost:5200';
const NODES = [
  { id: 'flat-roof-01', label: 'flat-roof' },
  { id: 'construction-column-01', label: 'column' },
  { id: 'plaster-plinth-01', label: 'plaster-plinth' },
];

async function testNode(label, nodeId, reloads) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const errors = [];
  const warns = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'warning') warns.push(msg.text()); });

  let pass = 0, fail = 0;

  // Initial navigation from library (in-app simulation)
  await page.goto(BASE + '/#/library', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.goto(BASE + '/#/node/' + nodeId, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(4000);

  // Check initial state
  const initial = await page.evaluate(() => {
    const allCanvas = document.querySelectorAll('canvas');
    const c = allCanvas[0];
    const r = c ? c.getBoundingClientRect() : null;
    let topTag = null, topClass = null;
    if (r && r.width > 0) {
      const els = document.elementsFromPoint(r.left + r.width/2, r.top + r.height/2);
      topTag = els[0]?.tagName;
      topClass = els[0]?.className?.slice(0, 60);
    }
    return { n: allCanvas.length, sz: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : '0x0', top: topTag, topCls: topClass };
  });

  const initOk = initial.n === 1 && initial.sz !== '0x0' && initial.top === 'CANVAS';
  console.log(`${initOk ? 'PASS' : 'FAIL'} ${label} initial: canvas=${initial.n}/${initial.sz} top=${initial.top}`);

  // 5x page.reload()
  for (let i = 1; i <= reloads; i++) {
    errors.length = 0;
    await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(5000);

    const state = await page.evaluate(() => {
      const allCanvas = document.querySelectorAll('canvas');
      const c = allCanvas[0];
      const r = c ? c.getBoundingClientRect() : null;
      let topTag = null;
      if (r && r.width > 0) {
        const els = document.elementsFromPoint(r.left + r.width/2, r.top + r.height/2);
        topTag = els[0]?.tagName;
      }

      // Check for context loss
      const ctxLost = c ? c.getContext('webgl2')?.isContextLost() : null;

      return {
        n: allCanvas.length,
        sz: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : '0x0',
        top: topTag,
        ctxLost,
      };
    });

    const ok = state.n === 1 && state.sz !== '0x0' && state.top === 'CANVAS' && errors.length === 0;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${label} reload #${i}: canvas=${state.n}/${state.sz} top=${state.top} errs=${errors.length} ctxLost=${state.ctxLost}`);
    ok ? pass++ : fail++;
  }

  // Test rotation (simulate mouse drag)
  await page.goto(BASE + '/#/node/' + nodeId, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  const canvas = await page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width/2 + 100, box.y + box.height/2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    const afterRotate = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return { exists: !!c, sz: c ? `${Math.round(c.getBoundingClientRect().width)}x${Math.round(c.getBoundingClientRect().height)}` : '0x0' };
    });
    console.log(`  rotate: canvas=${afterRotate.exists}/${afterRotate.sz}`);
  }

  // Test zoom (scroll)
  if (box) {
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(500);
    const afterZoom = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return { exists: !!c, sz: c ? `${Math.round(c.getBoundingClientRect().width)}x${Math.round(c.getBoundingClientRect().height)}` : '0x0' };
    });
    console.log(`  zoom: canvas=${afterZoom.exists}/${afterZoom.sz}`);
  }

  await ctx.close();
  await browser.close();
  return { pass, fail };
}

(async () => {
  console.log('=== Normal Node Baseline Verification ===\n');

  let totalPass = 0, totalFail = 0;

  for (const node of NODES) {
    console.log(`\n--- ${node.label} (${node.id}) ---`);
    const r = await testNode(node.label, node.id, 5);
    totalPass += r.pass;
    totalFail += r.fail;
  }

  console.log(`\n=== TOTAL: ${totalPass} pass, ${totalFail} fail ===`);
  process.exit(totalFail > 0 ? 1 : 0);
})();
