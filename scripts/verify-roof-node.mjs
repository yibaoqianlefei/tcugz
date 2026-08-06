/**
 * Generic browser verification for an animated single-model roof node.
 *
 * Checks:
 *   1. NodeDetail loads: header title, 1 canvas, 5-button whitelist bar, 1 enabled slider.
 *   2. Explosion: 播放爆炸 advances slider (>0, mid-play <1); 收起爆炸 animates back to 0.
 *   3. R reset returns slider to 0.
 *   4. Picking: click near model → right-side knowledge panel shows layer info.
 *   5. Library page lists the node.
 *   6. No console errors, no failed network requests.
 *
 * Usage: node scripts/verify-roof-node.mjs <baseUrl> <nodeId> <titleRegex> <shotBase>
 *   e.g. node scripts/verify-roof-node.mjs http://localhost:5173 \
 *          wood-batten-tile-roof-01 "木挂瓦条" node-wood-batten-tile-roof
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:5173";
const NODE_ID = process.argv[3] ?? "wood-batten-tile-roof-01";
const TITLE_RE = new RegExp(process.argv[4] ?? "木挂瓦条");
const SHOT_BASE = process.argv[5] ?? "node-wood-batten-tile-roof";
const SHOT = `audit-output/AUDIT_EVIDENCE/${SHOT_BASE}.png`;
const VIEWPORT = { width: 1440, height: 900 };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT });

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

console.log(`\n===== NodeDetail: ${NODE_ID} =====`);
await page.goto(`${baseUrl}/#/node/${NODE_ID}`, { waitUntil: "networkidle" });
await page.waitForTimeout(4000);

// 1. Title + canvas + control bar
const heading = await page.evaluate(() => {
  const span = document.querySelector("header span.text-muted.font-medium");
  return span ? span.textContent : "";
});
ok(TITLE_RE.test(heading), `header breadcrumb shows node title ("${heading.trim()}")`);
const canvasCount = await page.locator("canvas").count();
ok(canvasCount === 1, `exactly 1 canvas (got ${canvasCount})`);

const toolbar = await page.evaluate(() => {
  const bar = document.querySelector('[role="toolbar"]');
  if (!bar) return null;
  const buttons = Array.from(bar.querySelectorAll("button"));
  const sliders = Array.from(bar.querySelectorAll('input[type="range"]'));
  return {
    labels: buttons.map((b) => b.getAttribute("aria-label") || b.getAttribute("title")),
    sliderCount: sliders.length,
    sliderVal: sliders[0] ? Number(sliders[0].value) : null,
    sliderDisabled: sliders[0] ? sliders[0].disabled : null,
  };
});
ok(toolbar !== null, "control bar rendered");
if (toolbar) {
  ok(toolbar.labels.length === 5, `5 whitelisted buttons (got ${toolbar.labels.length})`);
  ok(toolbar.labels.some((l) => l.includes("播放")), "expand (播放爆炸) present");
  ok(toolbar.labels.some((l) => l.includes("收起")), "collapse (收起爆炸) present");
  ok(toolbar.sliderCount === 1, "exactly 1 slider");
  ok(toolbar.sliderVal === 0, `slider starts at 0 (got ${toolbar.sliderVal})`);
  ok(toolbar.sliderDisabled === false, "slider enabled (animated single-model)");
}

await page.screenshot({ path: SHOT });
console.log(`  [shot] ${SHOT}`);

// 2. Explosion advance
const slider = page.locator('[role="toolbar"] input[type="range"]');
const expand = page.locator('[role="toolbar"] button[aria-label="播放爆炸"]');
const collapse = page.locator('[role="toolbar"] button[aria-label="收起爆炸"]');

await expand.click();
await page.waitForTimeout(700);
let val = Number(await slider.inputValue());
ok(val > 0, `expand plays animation → slider > 0 (got ${val})`);
ok(val < 1, `animation still advancing mid-play (got ${val})`);

await collapse.click();
// Collapse plays the clips in reverse (animated), so poll until it reaches 0.
let collapsed = false;
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(400);
  const v = Number(await slider.inputValue());
  if (v === 0) { collapsed = true; break; }
}
ok(collapsed, "collapse animates back to 0");

// 3. R reset
await expand.click();
await page.waitForTimeout(700);
val = Number(await slider.inputValue());
ok(val > 0, "pre-reset slider > 0 (animation playing)");
await page.keyboard.press("r");
await page.waitForTimeout(700);
val = Number(await slider.inputValue());
ok(val === 0, `R reset rewinds slider to 0 (got ${val})`);

// 4. Picking → knowledge panel
await page.waitForTimeout(1500);
await page.mouse.click(720, 450);
await page.waitForTimeout(800);
const panelText = await page.evaluate(() => document.body.innerText.slice(0, 4000));
const hasWagon = /挂瓦条|顺水条|块瓦|卧瓦|防水/.test(panelText);
ok(hasWagon, "right-side knowledge panel shows layer info (挂瓦条/顺水条/块瓦/防水)");
if (!hasWagon) {
  console.log("  [info] body text sample: " + JSON.stringify(panelText.slice(0, 300)));
  await page.screenshot({ path: SHOT.replace(".png", "-pick.png") });
}

// 5. Library page lists the node
await page.goto(`${baseUrl}/#/library`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const libText = await page.evaluate(() => document.body.innerText);
ok(TITLE_RE.test(libText), "library page lists the node");
await page.screenshot({ path: SHOT.replace(".png", "-library.png") });

// 6. Console / network
ok(consoleErrors.length === 0, `no console errors (${consoleErrors.length})` +
  (consoleErrors.length ? ` — ${consoleErrors.slice(0, 3).join(" | ")}` : ""));
ok(failedReq.length === 0, `no failed network requests (${failedReq.length})` +
  (failedReq.length ? ` — ${failedReq.slice(0, 3).join(" | ")}` : ""));

console.log(failed === 0 ? "\nALL CHECKS PASSED" : `\n${failed} CHECK(S) FAILED`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
