import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:5200';
const URL = BASE + '/#/node/wall-damp-proof-course';
const DIR = 'tmp/screenshots';
mkdirSync(DIR, { recursive: true });

async function shot(page, name) {
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: false });
  console.log(`  ${name}.png`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ── Desktop 1440x900 ──
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(5000);
    await shot(page, 'desktop-all');
    // Select A
    await page.click('button[role="radio"]:first-child');
    await page.waitForTimeout(500);
    await shot(page, 'desktop-A');
    // Select B
    await page.click('button[role="radio"]:nth-child(2)');
    await page.waitForTimeout(500);
    await shot(page, 'desktop-B');
    // Select C
    await page.click('button[role="radio"]:nth-child(3)');
    await page.waitForTimeout(500);
    await shot(page, 'desktop-C');
    await ctx.close();
  }

  // ── 1024px ──
  {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(5000);
    await shot(page, '1024-all');
    await ctx.close();
  }

  // ── Mobile 390x844 ──
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(5000);
    await shot(page, 'mobile-all');
    await ctx.close();
  }

  await browser.close();
  console.log('\nDone.');
})();
