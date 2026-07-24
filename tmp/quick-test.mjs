import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await b.newPage();
const logs = [];
p.on('console', m => { if (m.text().startsWith('[CTX]')) logs.push(m.text()); });
await p.goto('http://localhost:5200/#/node/wall-damp-proof-course', { waitUntil: 'networkidle', timeout: 20000 });
await p.waitForTimeout(10000);
const ctx = await p.evaluate(() => {
  const c = document.querySelector('canvas');
  const gl = c?.getContext('webgl2') || c?.getContext('webgl');
  return { lost: gl?.isContextLost(), w: c?.width, h: c?.height };
});
logs.forEach(l => console.log(l));
console.log('ctx:', JSON.stringify(ctx));
const el = await p.$('canvas');
if (el) console.log('ss:', (await el.screenshot()).length);
await b.close();
