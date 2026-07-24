import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const DEV = process.env.DEV_URL || 'http://localhost:5200';

async function test(url, label, reloads, expectCount) {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  const e = [];
  p.on('pageerror', x => e.push(x.message));
  let ok = true;
  for (let i = 1; i <= reloads; i++) {
    e.length = 0;
    if (i === 1) await p.goto(DEV + url, { waitUntil: 'networkidle', timeout: 20000 });
    else await p.reload({ waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(10000);
    const s = await p.evaluate(() => {
      const c = document.querySelector('canvas');
      const r = c ? c.getBoundingClientRect() : null;
      return { n: document.querySelectorAll('canvas').length, sz: r ? Math.round(r.width) + 'x' + Math.round(r.height) : '0x0' };
    });
    const pass = s.n === expectCount && s.sz !== '0x0' && e.length === 0;
    console.log((pass ? 'PASS' : 'FAIL') + ' ' + label + ' #' + i + ': canvas=' + s.n + '/' + s.sz + ' errs=' + e.length);
    if (!pass) ok = false;
  }
  await p.screenshot({ path: 'tests/screenshots/' + label + '.png' });
  await b.close();
  return ok;
}

const a = await test('/#/node/wall-damp-proof-course', 'variant-multi', 5, 1);
const b = await test('/#/node/construction-column-01', 'normal-column', 3, 1);
const c = await test('/#/node/flat-roof-01', 'normal-flat-roof', 3, 1);

// Route switching
{
  const br = await chromium.launch({ headless: true });
  const p = await br.newPage();
  const e = [];
  p.on('pageerror', x => e.push(x.message));
  let ok = true;
  for (let i = 1; i <= 10; i++) {
    e.length = 0;
    await p.goto(DEV + '/#/node/construction-column-01', { waitUntil: 'networkidle', timeout: 15000 });
    await p.waitForTimeout(2000);
    await p.goto(DEV + '/#/node/wall-damp-proof-course', { waitUntil: 'networkidle', timeout: 15000 });
    await p.waitForTimeout(2000);
    const n = await p.evaluate(() => document.querySelectorAll('canvas').length);
    if (n !== 1 || e.length > 0) { console.log('FAIL route switch #' + i + ': canvas=' + n + ' errs=' + e.length); ok = false; }
  }
  console.log((ok ? 'OK' : 'FAIL') + ' route switch 10x');
  await br.close();
}

console.log('DEV: ' + (a && b && c ? 'PASS' : 'FAIL'));
