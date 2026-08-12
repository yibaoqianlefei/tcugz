/**
 * Browser verification for the 空心砌块的常见形式 node.
 * Single-model, noAnimation (static) node with 4 pickable meshes
 * (多排扁孔 / 单排双孔 / 单排圆孔 / 单排组合孔).
 *
 * Checks:
 *   1. NodeDetail loads: header title, 1 canvas, 5-button control bar,
 *      slider locked at 1 and disabled (noAnimation).
 *   2. Knowledge panel lists all 4 hollow-block forms.
 *   3. Picking a block on the canvas does not throw; no fatal console errors.
 *   4. R reset does not throw (camera re-fit).
 *   5. Library page lists the node; diagram renders; 0 console errors / 404.
 *
 * Usage: node scripts/verify-hollow-block-forms.mjs <baseUrl>
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:5173";
const NODE_ID = "hollow-block-forms-01";
const SHOT = "audit-output/AUDIT_EVIDENCE/node-hollow-block-forms-01.png";
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
await page.waitForTimeout(4500);

// 1. Title + canvas + control bar (slider locked at 1 & disabled)
const heading = await page.evaluate(() => {
  const span = document.querySelector("header span.text-muted.font-medium");
  return span ? span.textContent : "";
});
ok(/空心砌块/.test(heading), `header breadcrumb shows node title ("${heading.trim()}")`);
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

// 2. Knowledge panel lists all 4 forms
const panelText = await page.evaluate(() => document.body.innerText.slice(0, 6000));
const forms = ["多排扁孔", "单排双孔", "单排圆孔", "单排组合孔"];
const missing = forms.filter((f) => !panelText.includes(f));
ok(missing.length === 0, `knowledge panel lists all 4 forms (missing: ${missing.join(",") || "none"})`);
if (missing.length) {
  console.log("  [info] body text sample: " + JSON.stringify(panelText.slice(0, 400)));
}

// 3. Picking — click a few points across the canvas; must not crash.
const canvas = page.locator("canvas");
const box = await canvas.boundingBox();
if (box) {
  for (const frac of [0.3, 0.45, 0.6, 0.75]) {
    await page.mouse.click(box.x + box.width * frac, box.y + box.height * 0.55);
    await page.waitForTimeout(250);
  }
}
ok(consoleErrors.length === 0, "picking blocks caused no console errors");

await page.screenshot({ path: SHOT });
console.log(`  [shot] ${SHOT}`);

// 4. R reset — must not crash
await page.keyboard.press("r");
await page.waitForTimeout(700);
ok(consoleErrors.length === 0, "R reset caused no console errors");

// 5. Diagram renders
const diagramImg = await page.evaluate(() => {
  const imgs = Array.from(document.images).map((i) => i.src);
  return imgs.some((s) => s.includes("hollow-block-forms-diagram.png"));
});
ok(diagramImg, "diagram (剖面图) rendered");

// 6. Library page lists the node
await page.goto(`${baseUrl}/#/library`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const libText = await page.evaluate(() => document.body.innerText);
ok(/空心砌块/.test(libText), "library page lists the node");
await page.screenshot({ path: SHOT.replace(".png", "-library.png") });

// 7. Console / network
ok(consoleErrors.length === 0, `no console errors (${consoleErrors.length})` +
  (consoleErrors.length ? ` — ${consoleErrors.slice(0, 3).join(" | ")}` : ""));
ok(failedReq.length === 0, `no failed network requests (${failedReq.length})` +
  (failedReq.length ? ` — ${failedReq.slice(0, 3).join(" | ")}` : ""));

console.log(failed === 0 ? "\nALL HOLLOW-BLOCK-FORMS CHECKS PASSED" : `\n${failed} CHECK(S) FAILED`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
