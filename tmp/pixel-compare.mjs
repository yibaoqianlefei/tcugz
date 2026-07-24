import { chromium } from 'playwright';

const DEV = 'http://localhost:5200';

async function checkNode(url, label) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log(`  ERR: ${e.message}`));

  await page.goto(DEV + url, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(8000);

  /* Method 1: drawImage from WebGL canvas to 2D canvas */
  const m1 = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return { error: 'no canvas' };
    const c2d = document.createElement('canvas');
    c2d.width = c.width; c2d.height = c.height;
    const ctx2d = c2d.getContext('2d');
    ctx2d.drawImage(c, 0, 0);
    const id = ctx2d.getImageData(0, 0, Math.min(c.width, 100), Math.min(c.height, 100));
    let nonZero = 0, total = 0;
    for (let i = 0; i < id.data.length; i += 4) {
      total++;
      if (id.data[i] > 0 || id.data[i+1] > 0 || id.data[i+2] > 0) nonZero++;
    }
    return { method: 'drawImage', w: c.width, h: c.height, cssW: Math.round(c.getBoundingClientRect().width), cssH: Math.round(c.getBoundingClientRect().height), nonZeroPx: nonZero, totalPx: total };
  });
  console.log(`  ${label} drawImage: w=${m1.w} css=${m1.cssW}x${m1.cssH} nonZero=${m1.nonZeroPx}/${m1.totalPx}`);

  /* Method 2: Playwright element screenshot */
  const canvasEl = await page.$('canvas');
  if (canvasEl) {
    const buf = await canvasEl.screenshot();
    // Quick check: is the screenshot mostly one color?
    // Read first 1KB of PNG to check if it's solid
    const hasContent = buf.length > 2000; // empty/white PNGs are tiny
    console.log(`  ${label} elementScreenshot: ${buf.length} bytes`);
  }

  /* Method 3: gl.readPixels */
  const m3 = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return { error: 'no canvas' };
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return { error: 'no gl' };
    const lost = gl.isContextLost();
    // Try to read a pixel
    try {
      const pixel = new Uint8Array(4);
      gl.readPixels(c.width / 2, c.height / 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      return { method: 'readPixels', lost, center: [pixel[0], pixel[1], pixel[2], pixel[3]] };
    } catch (e) {
      return { method: 'readPixels', lost, error: e.message.slice(0, 100) };
    }
  });
  console.log(`  ${label} readPixels: ${JSON.stringify(m3)}`);

  await ctx.close(); await browser.close();
}

(async () => {
  console.log('=== PIXEL COMPARISON: Normal vs Variant ===\n');

  // Normal node (known working)
  console.log('--- Normal node ---');
  await checkNode('/#/node/construction-column-01', 'column');

  // Another normal node
  console.log('\n--- Normal node 2 ---');
  await checkNode('/#/node/flat-roof-01', 'flat-roof');

  // Variant node
  console.log('\n--- Variant node ---');
  await checkNode('/#/node/wall-damp-proof-course', 'variant');

  console.log('\nDone.');
})();
