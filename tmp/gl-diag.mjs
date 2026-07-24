import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const DEV = 'http://localhost:5200';

async function diagnose(url, label) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // Inject context loss listener BEFORE navigation
  await page.addInitScript(() => {
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
      const ctx = origGetContext.apply(this, args);
      if (ctx && (args[0] === 'webgl2' || args[0] === 'webgl')) {
        ctx.__diagCreated = Date.now();
        console.log(`[GL_DIAG] ${args[0]} context created, attrs=${JSON.stringify(args[1])}, canvas=${this.width}x${this.height}`);
        this.addEventListener('webglcontextlost', (e) => {
          console.log(`[GL_DIAG] CONTEXT LOST at ${Date.now()}, age=${Date.now() - ctx.__diagCreated}ms`);
        }, { once: true });
        this.addEventListener('webglcontextrestored', () => {
          console.log(`[GL_DIAG] CONTEXT RESTORED at ${Date.now()}`);
        });
      }
      return ctx;
    };
  });

  const glLogs = [];
  const errors = [];
  page.on('console', m => { if (m.text().startsWith('[GL_DIAG]')) glLogs.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(DEV + url, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(10000);

  // Check context + read pixels
  const glState = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return { error: 'no canvas' };
    const w = c.width, h = c.height;

    // Try to read a center pixel to verify rendering
    let pixelData = null;
    try {
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      if (gl && !gl.isContextLost()) {
        const px = new Uint8Array(4);
        gl.readPixels(w / 2, h / 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        pixelData = [px[0], px[1], px[2], px[3]];
      }
    } catch (e) {
      pixelData = { error: e.message };
    }

    // Check for Canvas 2D fallback
    const c2d = document.createElement('canvas');
    c2d.width = w; c2d.height = h;
    const ctx2d = c2d.getContext('2d');
    ctx2d.drawImage(c, 0, 0);

    // Sample top-left 100x100
    const imgData = ctx2d.getImageData(0, 0, Math.min(w, 100), Math.min(h, 100));
    let nonZeroCount = 0;
    const samples = [];
    for (let y = 0; y < Math.min(h, 100) && samples.length < 5; y += 20) {
      for (let x = 0; x < Math.min(w, 100) && samples.length < 5; x += 20) {
        const i = (y * Math.min(w, 100) + x) * 4;
        samples.push(`(${imgData.data[i]},${imgData.data[i+1]},${imgData.data[i+2]})`);
      }
    }
    for (let i = 0; i < imgData.data.length; i += 4) {
      if (imgData.data[i] > 0 || imgData.data[i+1] > 0 || imgData.data[i+2] > 0) nonZeroCount++;
    }

    return { w, h, pixelData, nonZeroCount: `${nonZeroCount}/${imgData.data.length/4}`, samples };
  });

  console.log(`\n=== ${label} ===`);
  console.log(`  GL logs:`);
  glLogs.forEach(l => console.log(`    ${l}`));
  console.log(`  State: ${JSON.stringify(glState, null, 2)}`);
  console.log(`  Errors: ${errors.length}`);

  // Element screenshot
  const cEl = await page.$('canvas');
  if (cEl) {
    const buf = await cEl.screenshot();
    writeFileSync(`tmp/screenshots/${label}-element.png`, buf);
    console.log(`  Screenshot: ${buf.length} bytes`);
  }

  await ctx.close(); await browser.close();
}

(async () => {
  console.log('=== WebGL Context Loss Investigation ===');

  // Normal node (baseline)
  await diagnose('/#/node/construction-column-01', 'normal-column');

  // Variant node
  await diagnose('/#/node/wall-damp-proof-course', 'variant');

  // Variant node: reload
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const glLogs = [];
  page.on('console', m => { if (m.text().startsWith('[GL_DIAG]')) glLogs.push(m.text()); });
  await page.goto(DEV + '/#/node/wall-damp-proof-course', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);
  glLogs.length = 0;
  await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(10000);
  console.log(`\n=== variant-reload ===`);
  console.log(`  GL logs:`);
  glLogs.forEach(l => console.log(`    ${l}`));
  await ctx.close(); await browser.close();

  console.log('\nDone.');
})();
