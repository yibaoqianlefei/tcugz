import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await b.newPage();
const errors = [];
p.on('pageerror', e => errors.push(e.message));
p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE:', m.text().slice(0, 300)); });
await p.goto('http://localhost:5200/#/node/wall-damp-proof-course', { waitUntil: 'networkidle', timeout: 20000 });
await p.waitForTimeout(10000);
console.log('errors:', errors.length);
errors.forEach(e => console.log('  ERR:', e.slice(0, 200)));
const c = await p.evaluate(() => {
  const cans = document.querySelectorAll('canvas');
  return { count: cans.length, w0: cans[0]?.width, h0: cans[0]?.height,
    body: document.body?.textContent?.slice(0, 300) };
});
console.log('canvas:', JSON.stringify(c));
await b.close();
