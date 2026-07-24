import { chromium } from 'playwright';

const DEV = 'http://localhost:5200';

async function test(label, componentCode) {
  // Write temp test component
  const fs = await import('fs');
  const testContent = componentCode;

  // We'll inject test scenarios by temporarily modifying SceneContent
  // Instead, let's use page.evaluate to observe context during nav
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const logs = [];
  page.on('console', m => { if (m.text().startsWith('[CTX]') || m.text().startsWith('[ISO]')) logs.push(m.text()); });

  await page.goto(DEV + '/#/node/wall-damp-proof-course', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(10000);

  const ctxState = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return null;
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    return { lost: gl?.isContextLost(), w: c?.width, h: c?.height };
  });

  const ss = await page.$('canvas').then(el => el.screenshot());
  console.log(`${label}: lost=${ctxState?.lost} ss=${ss?.length}`);

  await ctx.close(); await browser.close();
}

async function main() {
  console.log('=== ISOLATION TEST ===\n');
  console.log('(Testing with current code on disk — modify VariantModel.tsx between runs)\n');

  // Test with current state (3 full VariantModels)
  await test('current-3models', '');
}

main();
