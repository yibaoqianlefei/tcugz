import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const DEV = 'http://localhost:5200';

async function deepDiagnose(url, label) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  // Catch context loss/restore on ALL canvases
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, attrs) {
      const gl = orig.call(this, type, attrs);
      if (gl && (type === 'webgl2' || type === 'webgl')) {
        const canvas = this;
        console.log(`[CTX] create ${type} ${canvas.width}x${canvas.height} attrs=${JSON.stringify(attrs)} lost=${gl.isContextLost()}`);
        canvas.addEventListener('webglcontextlost', (e) => {
          console.log(`[CTX] LOST ${canvas.width}x${canvas.height} preventDefault=${e.defaultPrevented}`);
        });
        canvas.addEventListener('webglcontextrestored', () => {
          console.log(`[CTX] RESTORED ${canvas.width}x${canvas.height}`);
        });
      }
      return gl;
    };
  });

  const ctxLogs = [];
  page.on('console', m => { if (m.text().startsWith('[CTX]')) ctxLogs.push(m.text()); });

  await page.goto(DEV + url, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(10000);

  // Deep state read
  const deep = await page.evaluate(() => {
    const canvases = document.querySelectorAll('canvas');
    const result = [];
    for (const c of canvases) {
      const cssR = c.getBoundingClientRect();
      const gl2 = c.getContext('webgl2');
      const gl1 = !gl2 ? c.getContext('webgl') : null;
      const gl = gl2 || gl1;

      let lost = null, renderer = null, vendor = null;
      if (gl) {
        lost = gl.isContextLost();
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
          vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
        }
      }

      // Count 3D children via r3f
      let r3fStore = null;
      try {
        // r3f stores fiber on canvas
        const fiberKey = Object.keys(c).find(k => k.startsWith('__reactFiber'));
        if (fiberKey) r3fStore = 'has react fiber';
      } catch {}

      result.push({
        cssW: Math.round(cssR.width),
        cssH: Math.round(cssR.height),
        drawW: c.width,
        drawH: c.height,
        gl2: !!gl2,
        gl1: !!gl1,
        contextLost: lost,
        renderer,
        vendor,
        inDOM: document.body.contains(c),
        visible: cssR.width > 0 && cssR.height > 0,
        r3f: r3fStore,
      });
    }
    return result;
  });

  console.log(`\n=== ${label} ===`);
  console.log(`  CTX logs:`);
  ctxLogs.forEach(l => console.log(`    ${l}`));
  console.log(`  Deep state:`);
  deep.forEach((d, i) => console.log(`    canvas[${i}]: ${JSON.stringify(d)}`));
  console.log(`  Errors: ${errors.length}`);

  // Element screenshot
  const cEl = await page.$('canvas:last-of-type');
  if (cEl) {
    const buf = await cEl.screenshot();
    writeFileSync(`tmp/screenshots/${label}-element.png`, buf);
    console.log(`  Screenshot: ${buf.length} bytes`);
  }

  await ctx.close(); await browser.close();
}

(async () => {
  console.log('=== Deep Context Diagnosis ===');

  await deepDiagnose('/#/node/construction-column-01', 'normal-column');
  await deepDiagnose('/#/node/wall-damp-proof-course', 'variant');

  // Also test with preserveDrawingBuffer
  console.log('\n--- Testing variant with preserveDrawingBuffer ---');

  // Quickly patch VariantScene Canvas gl prop
  // Actually, let's just check if the first (300x150) canvas prevents the second from working

  console.log('\nDone.');
})();
