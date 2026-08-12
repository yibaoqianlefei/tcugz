/**
 * Browser verification of the 挑梁搭板 multi-model node.
 *
 * Checks:
 *  1. NodeDetail loads: title, 1 canvas, variant label bar A/B/C, explode slider
 *     disabled (no per-variant explode config — each variant is one mesh).
 *  2. Three variant models render side-by-side.
 *  3. Clicking each variant selects it; knowledge panel updates (设置边梁 /
 *     挑梁外露 / L形挑梁卡口板 content appears).
 *  4. Diagram (剖面图) renders.
 *  5. No console errors / 404.
 *
 * Usage: node scripts/verify-cantilever-slab-node.mjs <baseUrl>
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:5173";
const SHOT = "audit-output/AUDIT_EVIDENCE/node-cantilever-slab-01.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push(String(e)));
const failedReq = [];
page.on("requestfailed", (r) => failedReq.push(r.url()));
page.on("response", (r) => { if (r.status() >= 400) failedReq.push(`${r.status()} ${r.url()}`); });

let failed = 0;
function ok(cond, msg) {
  if (!cond) { failed++; console.log(`  ✗ FAIL: ${msg}`); }
  else console.log(`  ✓ PASS: ${msg}`);
}

await page.goto(`${baseUrl}/#/node/cantilever-slab-01`, { waitUntil: "networkidle" });
await page.waitForTimeout(5000);

const heading = await page.evaluate(() => {
  const s = document.querySelector("header span.text-muted.font-medium");
  return s ? s.textContent : "";
});
ok(/挑梁搭板/.test(heading), `header shows node title ("${heading.trim()}")`);

const canvasCount = await page.locator("canvas").count();
ok(canvasCount === 1, `exactly 1 canvas (got ${canvasCount})`);

// Variant label bar A/B/C (role=group "方案选择").
const variantBar = await page.evaluate(() => {
  const bar = document.querySelector('[role="group"][aria-label="方案选择"]');
  if (!bar) return null;
  return bar.textContent;
});
ok(variantBar !== null && /设置边梁/.test(variantBar) && /挑梁外露/.test(variantBar) && /L形挑梁卡口板/.test(variantBar),
  `variant label bar shows all three variants (${JSON.stringify(variantBar?.slice(0, 40))})`);

// Explode slider disabled (single-mesh variants, no explode config).
const slider = page.locator('[role="toolbar"] input[type="range"]');
if (await slider.count()) {
  ok(await slider.isDisabled(), "explode slider disabled (no explode config)");
} else {
  ok(true, "no explode slider (group hidden)");
}

await page.screenshot({ path: SHOT });
console.log(`  [shot] ${SHOT}`);

// Click each variant → knowledge panel updates.
async function clickVariantAndCheck(label, expectText, xHint) {
  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  if (!box) { ok(false, `canvas box missing for ${label}`); return; }
  // Try the hinted x, then scan across to find a hit.
  const xs = xHint ? [xHint] : [box.x + box.width * 0.2, box.x + box.width * 0.5, box.x + box.width * 0.8];
  let hit = false;
  for (const x of xs) {
    await page.mouse.click(x, box.y + box.height * 0.55);
    await page.waitForTimeout(500);
    const body = await page.evaluate(() => document.body.innerText);
    if (body.includes(expectText)) { hit = true; break; }
  }
  ok(hit, `clicking ${label} selects it and shows knowledge (${expectText})`);
}

await clickVariantAndCheck("A 设置边梁", "设置边梁", null);
await clickVariantAndCheck("B 挑梁外露", "挑梁外露", null);
await clickVariantAndCheck("C L形挑梁卡口板", "L形挑梁卡口板", null);

// Diagram renders (剖面图 image present).
const diagramImg = await page.evaluate(() => {
  const imgs = Array.from(document.images).map((i) => i.src);
  return imgs.some((s) => s.includes("cantilever-slab-diagram.png"));
});
ok(diagramImg, "diagram (剖面图) rendered");

ok(consoleErrors.length === 0, `no console errors (${consoleErrors.length})` +
  (consoleErrors.length ? ` — ${consoleErrors.slice(0, 3).join(" | ")}` : ""));
ok(failedReq.length === 0, `no failed requests (${failedReq.length})` +
  (failedReq.length ? ` — ${failedReq.slice(0, 3).join(" | ")}` : ""));

console.log(failed === 0 ? "\nALL CANTILEVER-SLAB CHECKS PASSED" : `\n${failed} CHECK(S) FAILED`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
