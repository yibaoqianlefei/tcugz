import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const DEV = 'http://localhost:5200';
const VARIANT_URL = DEV + '/#/node/wall-damp-proof-course';
const SCREEN_DIR = 'tmp/screenshots';

/* ── Collect pixel data via page.evaluate (draws WebGL canvas → 2D canvas → getImageData) ── */

async function collectCanvasPixels(page) {
  return await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c || c.width === 0 || c.height === 0) return null;

    const w = c.width, h = c.height;

    // Create 2D canvas to sample WebGL content
    const c2d = document.createElement('canvas');
    c2d.width = w;
    c2d.height = h;
    const ctx2d = c2d.getContext('2d');
    ctx2d.drawImage(c, 0, 0);

    // Sample pixels at grid positions (full imageData is expensive)
    const imageData = ctx2d.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Analyze
    let nonBgPixels = 0, totalPx = 0, rSum = 0, gSum = 0, bSum = 0;
    const BG_THRESHOLD = 15;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 128) continue;
      totalPx++;
      rSum += r; gSum += g; bSum += b;
      const dist = Math.sqrt((r - 245) ** 2 + (g - 245) ** 2 + (b - 247) ** 2);
      if (dist > BG_THRESHOLD) nonBgPixels++;
    }

    const avgR = rSum / Math.max(1, totalPx), avgG = gSum / Math.max(1, totalPx), avgB = bSum / Math.max(1, totalPx);

    let varSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 128) continue;
      varSum += (r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2;
    }
    const variance = varSum / Math.max(1, totalPx * 3);

    // Also read render info from WebGL
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    let renderer = 'unknown', vendor = 'unknown', contextLost = false;
    if (gl) {
      contextLost = gl.isContextLost();
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
      }
    }

    const rect = c.getBoundingClientRect();

    return {
      cssSize: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
      drawBuf: `${w}x${h}`,
      totalPx,
      nonBgPx: nonBgPixels,
      nonBgRatio: nonBgPixels / Math.max(1, totalPx),
      variance,
      avgColor: [Math.round(avgR), Math.round(avgG), Math.round(avgB)],
      isWhite: nonBgPixels / Math.max(1, totalPx) < 0.02 || variance < 5,
      renderer,
      vendor,
      contextLost,
    };
  });
}

/* ── Test scenarios ──────────────────────────── */

async function testScenario(label, navigateFn) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await navigateFn(page);
  await page.waitForTimeout(10000);

  // Screenshot full page + canvas crop via Playwright
  const fullPath = `${SCREEN_DIR}/${label}-full.png`;
  await page.screenshot({ path: fullPath, fullPage: false });

  // Canvas element screenshot
  const canvasEl = await page.$('canvas');
  let canvasPath = null;
  if (canvasEl) {
    canvasPath = `${SCREEN_DIR}/${label}-canvas.png`;
    try { await canvasEl.screenshot({ path: canvasPath }); } catch {}
  }

  // Pixel analysis
  const pixels = await collectCanvasPixels(page);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`${label}`);
  console.log(`${'='.repeat(60)}`);
  if (pixels) {
    console.log(`  CSS size:     ${pixels.cssSize}`);
    console.log(`  drawBuf:      ${pixels.drawBuf}`);
    console.log(`  renderer:     ${pixels.renderer}`);
    console.log(`  contextLost:  ${pixels.contextLost}`);
    console.log(`  non-bg px:    ${pixels.nonBgPx} / ${pixels.totalPx} (${(pixels.nonBgRatio * 100).toFixed(2)}%)`);
    console.log(`  variance:     ${pixels.variance.toFixed(2)}`);
    console.log(`  avg color:    [${pixels.avgColor}]`);
    console.log(`  IS WHITE:     ${pixels.isWhite}`);
  } else {
    console.log(`  NO CANVAS DATA`);
  }
  console.log(`  errors:       ${errors.length}`);

  await ctx.close(); await browser.close();
  return { label, pixels, errors };
}

async function main() {
  console.log('=== PIXEL-LEVEL CANVAS DIAGNOSTICS ===');

  // A: Click from library (in-app nav)
  const rA = await testScenario('A-lib-click', async (page) => {
    await page.goto(DEV + '/#/library', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.goto(VARIANT_URL, { waitUntil: 'networkidle', timeout: 20000 });
  });

  // B: Direct URL cold load
  const rB = await testScenario('B-direct-url', async (page) => {
    await page.goto(VARIANT_URL, { waitUntil: 'networkidle', timeout: 20000 });
  });

  // C: F5 reload after direct URL
  const rC = await testScenario('C-f5-reload', async (page) => {
    await page.goto(VARIANT_URL, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);
    await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
  });

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(60)}`);
  let anyWhite = false;
  for (const r of [rA, rB, rC]) {
    const p = r.pixels;
    const status = !p ? 'NO CANVAS' : p.isWhite ? '⚠️ WHITE' : '✅ VISIBLE';
    console.log(`  ${r.label}: ${status} | non-bg=${(p?.nonBgRatio * 100 || 0).toFixed(1)}% var=${p?.variance?.toFixed(2) || 'N/A'} renderer=${p?.renderer || 'N/A'}`);
    if (p?.isWhite) anyWhite = true;
  }

  console.log(`\nFinal: ${anyWhite ? 'WHITE SCREEN DETECTED' : 'All scenarios show visible content'}`);
  process.exit(anyWhite ? 1 : 0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
