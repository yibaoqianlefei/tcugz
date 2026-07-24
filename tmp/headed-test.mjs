import { chromium } from 'playwright';

const DEV = 'http://localhost:5200';

(async () => {
  console.log('=== HEADED Chrome Test ===\n');

  // Headed mode
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  // Inject context tracker
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, attrs) {
      const gl = orig.call(this, type, attrs);
      if (gl && (type === 'webgl2' || type === 'webgl')) {
        const cw = this.width, ch = this.height;
        window.__glLog = window.__glLog || [];
        window.__glLog.push(`create ${type} ${cw}x${ch} lost=${gl.isContextLost()}`);
        this.addEventListener('webglcontextlost', (e) => {
          window.__glLog.push(`LOST ${cw}x${ch} preventDefault=${e.defaultPrevented}`);
        });
      }
      return gl;
    };
  });

  // Navigate to variant node
  await page.goto(DEV + '/#/node/wall-damp-proof-course', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('Page loaded, waiting 10s for models...');
  await page.waitForTimeout(10000);

  // Read state
  const state = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const r = c ? c.getBoundingClientRect() : null;
    const gl2 = c ? c.getContext('webgl2') : null;
    const gl1 = c ? c.getContext('webgl') : null;
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
    return {
      canvasCount: document.querySelectorAll('canvas').length,
      cssSize: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : '0x0',
      drawBuf: c ? `${c.width}x${c.height}` : '0x0',
      contextLost: lost,
      renderer,
      vendor,
      glLog: window.__glLog || [],
      errors: window.__errors || [],
    };
  });

  console.log(JSON.stringify(state, null, 2));
  console.log(`\nPage errors: ${errors.length}`);
  errors.forEach(e => console.log(`  ERR: ${e}`));

  // Screenshot
  await page.screenshot({ path: 'tmp/screenshots/headed-variant.png' });
  console.log('Screenshot: tmp/screenshots/headed-variant.png');

  // Reload test
  console.log('\n--- Reload ---');
  window.__glLog = [];
  await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(10000);
  const state2 = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const r = c ? c.getBoundingClientRect() : null;
    const gl2 = c ? c.getContext('webgl2') : null;
    const gl = gl2 || c?.getContext('webgl');
    return {
      cssSize: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : '0x0',
      contextLost: gl ? gl.isContextLost() : null,
      glLog: window.__glLog || [],
    };
  });
  console.log(JSON.stringify(state2, null, 2));

  await page.screenshot({ path: 'tmp/screenshots/headed-variant-reload.png' });

  console.log('\nDone — check screenshots.');
  // Don't close browser so user can see
  // await browser.close();
})();
