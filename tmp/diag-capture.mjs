import { chromium } from 'playwright';

const URL = 'http://localhost:5200/#/node/wall-damp-proof-course';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const logs = [];
  page.on('console', msg => {
    const t = msg.text();
    if (t.startsWith('[DIAG:') || t.startsWith('[Variant') || t.includes('Error') || t.includes('error')) {
      logs.push(`[${msg.type()}] ${t}`);
    }
  });
  page.on('pageerror', e => logs.push(`[PAGE_ERROR] ${e.message}`));

  // Cold load
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(8000);

  console.log('=== DIAGNOSTIC LOGS (cold load) ===\n');
  logs.forEach(l => console.log(l));

  // Check reality
  const state = await page.evaluate(() => {
    const canvases = document.querySelectorAll('canvas');
    const c = canvases[0];
    const r = c ? c.getBoundingClientRect() : null;
    // Check what's at canvas centre
    let topEl = null;
    if (r && r.width > 0) {
      const cx = r.left + r.width/2;
      const cy = r.top + r.height/2;
      const els = document.elementsFromPoint(cx, cy);
      topEl = { tag: els[0]?.tagName, cls: els[0]?.className?.slice(0, 80), id: els[0]?.id };
    }
    return {
      canvasCount: canvases.length,
      canvasRect: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null,
      topElement: topEl,
      drawingBuffer: c ? { w: c.width, h: c.height } : null,
    };
  });

  console.log('\n=== CANVAS STATE ===');
  console.log(JSON.stringify(state, null, 2));

  // 3x reload
  console.log('\n=== 3x RELOAD ===');
  for (let i = 1; i <= 3; i++) {
    logs.length = 0;
    await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(8000);
    const canvasOk = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return c ? c.getBoundingClientRect().width > 0 && c.getBoundingClientRect().height > 0 : false;
    });
    console.log(`  reload #${i}: canvasOk=${canvasOk}, diagLogs=${logs.filter(l => l.includes('[DIAG:')).length}`);
  }

  await ctx.close();
  await browser.close();
  console.log('\nDone.');
})();
