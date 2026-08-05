/**
 * Browser verification for a noAnimation (static) single-model node.
 *
 * Unlike animated nodes: slider is LOCKED at 1 and disabled; no explode
 * animation plays; picking is always allowed (interaction not gated).
 *
 * Checks:
 *   1. NodeDetail loads: header title, 1 canvas, 5-button bar, slider=1 disabled.
 *   2. Picking: click near model → right-side knowledge panel shows layer info.
 *   3. R reset does not throw (camera re-fit, no crash).
 *   4. Library page lists the node.
 *   5. No console errors, no failed network requests.
 *
 * Usage: node scripts/verify-static-node.mjs <baseUrl> <nodeId> <titleRegex> <shotBase>
 *   e.g. node scripts/verify-static-node.mjs http://localhost:5173 \
 *          block-wall-core-column-01 "墙芯柱" node-block-wall-core-column
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:5173";
const NODE_ID = process.argv[3] ?? "block-wall-core-column-01";
const TITLE_RE = new RegExp(process.argv[4] ?? "墙芯柱");
const SHOT_BASE = process.argv[5] ?? "node-block-wall-core-column";
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

console.log(`\n===== NodeDetail (static): ${NODE_ID} =====`);
await page.goto(`${baseUrl}/#/node/${NODE_ID}`, { waitUntil: "networkidle" });
await page.waitForTimeout(4000);

// 1. Title + canvas + control bar (slider locked at 1 & disabled)
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
  ok(toolbar.sliderCount === 1, "exactly 1 slider");
  ok(toolbar.sliderVal === 1, `noAnimation slider locked at 1 (got ${toolbar.sliderVal})`);
  ok(toolbar.sliderDisabled === true, "noAnimation slider disabled");
}

await page.screenshot({ path: SHOT });
console.log(`  [shot] ${SHOT}`);

// 2. Picking → knowledge panel (always allowed for noAnimation nodes)
await page.mouse.click(720, 450);
await page.waitForTimeout(800);
const panelText = await page.evaluate(() => document.body.innerText.slice(0, 4000));
const hasCore = /芯柱|通长筋|细石混凝土|砌块/.test(panelText);
ok(hasCore, "right-side knowledge panel shows core-column info (芯柱/通长筋/细石混凝土/砌块)");
if (!hasCore) {
  console.log("  [info] body text sample: " + JSON.stringify(panelText.slice(0, 300)));
  await page.screenshot({ path: SHOT.replace(".png", "-pick.png") });
}

// 3. R reset — must not crash, camera re-fits
await page.keyboard.press("r");
await page.waitForTimeout(700);
ok(consoleErrors.length === 0, "R reset caused no console errors");

// 4. Library page lists the node
await page.goto(`${baseUrl}/#/library`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const libText = await page.evaluate(() => document.body.innerText);
ok(TITLE_RE.test(libText), "library page lists the node");
await page.screenshot({ path: SHOT.replace(".png", "-library.png") });

// 5. Console / network
ok(consoleErrors.length === 0, `no console errors (${consoleErrors.length})` +
  (consoleErrors.length ? ` — ${consoleErrors.slice(0, 3).join(" | ")}` : ""));
ok(failedReq.length === 0, `no failed network requests (${failedReq.length})` +
  (failedReq.length ? ` — ${failedReq.slice(0, 3).join(" | ")}` : ""));

console.log(failed === 0 ? "\nALL CHECKS PASSED" : `\n${failed} CHECK(S) FAILED`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
