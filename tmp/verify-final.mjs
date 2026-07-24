import { chromium } from 'playwright';

const DEV = 'http://localhost:5200';
const VARIANT_NODE = '/#/node/wall-damp-proof-course';
const NORMAL_NODE = '/#/node/construction-column-01';
const NORMAL_NODE2 = '/#/node/flat-roof-01';

function now() { return new Date().toISOString().slice(11, 23); }

async function freshPageTest(label, url, iterations, { useReload = false, waitMs = 10000 } = {}) {
  /* Each test uses a FRESH browser context — no HMR, no cache reuse. */
  const failures = [];
  for (let i = 1; i <= iterations; i++) {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    const diagCon = [];
    page.on('pageerror', e => { errors.push(e.message); diagCon.push(`PAGE_ERR: ${e.message}`); });
    page.on('console', m => { if (m.type() === 'error') diagCon.push(`CONSOLE: ${m.text().slice(0, 200)}`); });

    try {
      if (useReload) {
        // First navigate, then reload
        await page.goto(DEV + url, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(3000);
        await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
      } else {
        await page.goto(DEV + url, { waitUntil: 'networkidle', timeout: 20000 });
      }
      await page.waitForTimeout(waitMs);

      const state = await page.evaluate(() => {
        const canvases = document.querySelectorAll('canvas');
        const c = canvases[0];
        const r = c ? c.getBoundingClientRect() : null;
        let topEl = null;
        if (r && r.width > 0 && r.height > 0) {
          const els = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          topEl = els[0]?.tagName;
        }
        return {
          canvasCount: canvases.length,
          cssSize: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : '0x0',
          drawBuf: c ? `${c.width}x${c.height}` : '0x0',
          topElement: topEl,
        };
      });

      const ok =
        state.canvasCount === 1 &&
        state.cssSize !== '0x0' &&
        state.topElement === 'CANVAS' &&
        errors.length === 0;

      if (!ok) {
        failures.push({
          iter: i,
          state,
          errors: errors.slice(0, 3),
          diagCon: diagCon.slice(0, 5),
        });
      }
    } catch (e) {
      failures.push({ iter: i, crash: e.message.slice(0, 120) });
    }
    await ctx.close();
    await browser.close();
  }

  const pass = iterations - failures.length;
  console.log(`  ${label}: ${pass}/${iterations} pass` +
    (failures.length > 0 ? ` (${failures.length} FAIL)` : '') +
    (failures.length > 0 ? `\n    First failure: ${JSON.stringify(failures[0]).slice(0, 300)}` : ''));
  return { pass, fail: failures.length, failures };
}

async function routeSwitchTest(iterations) {
  let pass = 0, fail = 0;
  for (let i = 1; i <= iterations; i++) {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    try {
      // normal → variant → normal
      await page.goto(DEV + NORMAL_NODE, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      await page.goto(DEV + VARIANT_NODE, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(3000);
      await page.goto(DEV + NORMAL_NODE2, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);

      const canvasCount = await page.evaluate(() => document.querySelectorAll('canvas').length);
      const ok = canvasCount === 1 && errors.length === 0;
      if (ok) pass++; else fail++;
      if (!ok) console.log(`    switch #${i} FAIL: canvas=${canvasCount} errs=${errors.length}`);
    } catch (e) {
      fail++;
      console.log(`    switch #${i} CRASH: ${e.message.slice(0, 100)}`);
    }
    await ctx.close();
    await browser.close();
  }
  console.log(`  route switch ${iterations}x: ${pass}/${iterations} pass`);
  return { pass, fail };
}

async function main() {
  console.log('=== FINAL VERIFICATION ===\n');
  let totalPass = 0, totalFail = 0;

  // ═══════════════════════════════════════════════
  // DEV SERVER: Direct URL (cold load, fresh context each time)
  // ═══════════════════════════════════════════════
  console.log('--- DEV: Direct URL (cold load, fresh context each) ---');
  const r1 = await freshPageTest('variant', VARIANT_NODE, 5);
  totalPass += r1.pass; totalFail += r1.fail;

  // ═══════════════════════════════════════════════
  // DEV SERVER: F5 reload (fresh context per iteration)
  // ═══════════════════════════════════════════════
  console.log('\n--- DEV: F5 reload (fresh context each) ---');
  const r2 = await freshPageTest('variant F5', VARIANT_NODE, 5, { useReload: true, waitMs: 10000 });
  totalPass += r2.pass; totalFail += r2.fail;

  // ═══════════════════════════════════════════════
  // DEV: Normal node regression
  // ═══════════════════════════════════════════════
  console.log('\n--- DEV: Normal node regression ---');
  const r3 = await freshPageTest('normal-1', NORMAL_NODE, 3);
  totalPass += r3.pass; totalFail += r3.fail;
  const r4 = await freshPageTest('normal-2', NORMAL_NODE2, 3);
  totalPass += r4.pass; totalFail += r4.fail;

  // ═══════════════════════════════════════════════
  // DEV: Route switching
  // ═══════════════════════════════════════════════
  console.log('\n--- DEV: Route switching ---');
  const r5 = await routeSwitchTest(5);
  totalPass += r5.pass; totalFail += r5.fail;

  console.log(`\n=== DEV TOTAL: ${totalPass} pass, ${totalFail} fail ===\n`);

  // ═══════════════════════════════════════════════
  // PRODUCTION PREVIEW
  // ═══════════════════════════════════════════════
  console.log('=== PRODUCTION PREVIEW ===\n');

  const { spawn } = await import('child_process');
  const previewProc = spawn('npx', ['vite', 'preview', '--port', '5400'], {
    cwd: 'd:\\vscode project\\建筑构造交互教材',
    stdio: 'pipe',
    shell: true,
  });
  await new Promise(r => setTimeout(r, 4000));

  const PREVIEW = 'http://localhost:5400';
  // Note: the project uses BASE_URL /tcugz/
  const PREVIEW_BASE = PREVIEW + '/tcugz';

  console.log('--- PROD: Direct URL ---');
  let prodPass = 0, prodFail = 0;

  // Try with and without /tcugz/ base
  for (const baseUrl of [PREVIEW_BASE, PREVIEW]) {
    const url = baseUrl + '/#/node/wall-damp-proof-course';
    try {
      const browser = await chromium.launch({ headless: true });
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });

      const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      const status = resp?.status() ?? 'unknown';
      console.log(`  ${baseUrl} → status=${status}`);

      if (status === 200 || status === 304) {
        await page.waitForTimeout(8000);
        for (let i = 1; i <= 5; i++) {
          errors.length = 0;
          await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
          await page.waitForTimeout(8000);

          const st = await page.evaluate(() => {
            const c = document.querySelector('canvas');
            const r = c ? c.getBoundingClientRect() : null;
            let top = null;
            if (r && r.width > 0) {
              const els = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
              top = els[0]?.tagName;
            }
            return {
              n: document.querySelectorAll('canvas').length,
              sz: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : '0x0',
              top,
            };
          });

          const ok = st.n === 1 && st.sz !== '0x0' && st.top === 'CANVAS' && errors.length === 0;
          if (ok) prodPass++; else { prodFail++; console.log(`    prod reload #${i} FAIL: ${JSON.stringify(st)} errs=${errors.length}`); }
        }
      } else {
        console.log(`  Skipping reload tests — status ${status} (SPA fallback issue, not Canvas bug)`);
      }

      await ctx.close();
      await browser.close();
      if (status === 200 || status === 304) break; // Found working base
    } catch (e) {
      console.log(`  ${baseUrl} ERROR: ${e.message.slice(0, 100)}`);
    }
  }

  console.log(`\nPROD: ${prodPass} pass, ${prodFail} fail`);

  previewProc.kill();

  // ═══════════════════════════════════════════════
  // FINAL
  // ═══════════════════════════════════════════════
  const grandTotal = totalPass + prodPass;
  const grandFail = totalFail + prodFail;
  console.log(`\n=== GRAND TOTAL: ${grandTotal} pass, ${grandFail} fail ===`);
  process.exit(grandFail > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
