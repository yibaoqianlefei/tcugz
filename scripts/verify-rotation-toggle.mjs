/**
 * Browser verification of the rotation toggle (旋转开关).
 *
 * Two independent signals, because the two node kinds rotate differently:
 *   - single-model: OrbitControls.autoRotate orbits the CAMERA → measure the
 *     azimuth via the DEV diagnostic window.__controls (exposed by
 *     ModelViewer, same pattern as __cameraWrites / __rotDiag).  Immune to the
 *     pre-existing ~7–17s render-settle shimmer that makes raw canvas pixel
 *     diffs unreliable on wall nodes.
 *   - multi-model: the models self-rotate around their pivots (camera static)
 *     → measure the composited page pixels of the center viewport.
 *
 * Checks per node:
 *   1. rotate button rendered, initial aria-pressed=true ("暂停旋转").
 *   2. Model/camera IS rotating (azimuth advances / pixels change).
 *   3. Click → aria-pressed=false; rotation STOPS (azimuth frozen / pixels static).
 *   4. Click again → aria-pressed=true; rotation RESUMES.
 *   5. Manual orbit drag does not break the toggle.
 *   6. Explode slider + R reset still work per node kind.
 *   7. No console errors / failed network requests.
 *
 * Usage: node scripts/verify-rotation-toggle.mjs <baseUrl>
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:5173";
const VIEWPORT = { width: 1440, height: 900 };
const SHOTS = "audit-output/AUDIT_EVIDENCE/rotation-toggle";

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

/** Azimuth change (radians) over `ms` via the DEV controls diagnostic. */
async function azChange(ms) {
  const a = await page.evaluate(() => window.__controls?.getAzimuthalAngle() ?? null);
  await page.waitForTimeout(ms);
  const b = await page.evaluate(() => window.__controls?.getAzimuthalAngle() ?? null);
  if (a === null || b === null) return null;
  return Math.abs(b - a);
}

/** Fraction of the center-viewport composite pixels that changed over `ms`. */
async function pixelChange(ms) {
  const clip = { x: 520, y: 115, width: 560, height: 750 };
  const a = Buffer.from(await page.screenshot({ clip }));
  await page.waitForTimeout(ms);
  const b = Buffer.from(await page.screenshot({ clip }));
  let d = 0;
  for (let i = 0; i < a.length; i += 8) {
    if (Math.abs(a[i] - b[i]) > 12 || Math.abs(a[i + 1] - b[i + 1]) > 12 || Math.abs(a[i + 2] - b[i + 2]) > 12) d++;
  }
  return d / (a.length / 8);
}

async function rotateButtonState() {
  return page.evaluate(() => {
    const btn = document.querySelector('[role="toolbar"] button[aria-label*="旋转"]');
    if (!btn) return null;
    return { label: btn.getAttribute("aria-label"), pressed: btn.getAttribute("aria-pressed") };
  });
}

const NODES = [
  { id: "construction-column-01", kind: "single", type: "animated" },
  { id: "cast-ribbed-floor-01", kind: "single", type: "noAnimation" },
  { id: "block-wall-core-column-01", kind: "single", type: "noAnimation" },
  { id: "wall-damp-proof-course", kind: "multi", type: "multi" },
];

for (const { id, kind, type } of NODES) {
  console.log(`\n===== ${id} (${type}) =====`);
  await page.goto(`${baseUrl}/#/node/${id}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(4500);

  const isRotating = kind === "multi" ? () => pixelChange(1400) : () => azChange(1400);
  // Single-model azimuth advance over 1.4s: steady ≈0.09 rad, slower on heavy
  // models ≈0.018 rad; fully stopped ≈0.0000 — 0.01 cleanly separates.
  const isRotatingOk = (v) => (kind === "multi" ? v > 0.01 : v !== null && v > 0.01);
  const isStoppedOk = (v) => (kind === "multi" ? v < 0.005 : v !== null && v < 0.005);

  // 1. Button present, product-default pressed state.
  const init = await rotateButtonState();
  ok(init !== null, "rotate button rendered");
  if (init) {
    ok(init.pressed === "true", `initial aria-pressed=true ("${init.label}")`);
    ok(init.label === "暂停旋转", `initial label 暂停旋转 (got ${init.label})`);
  }

  // 2. Rotating on load.
  const rotOn = await isRotating();
  ok(isRotatingOk(rotOn), `model/camera rotating on load (${kind === "multi" ? (rotOn * 100).toFixed(1) + "% px" : rotOn.toFixed(3) + " rad az"})`);

  // 3. Click → stop.
  await page.locator('[role="toolbar"] button[aria-label*="旋转"]').click();
  await page.waitForTimeout(1200);
  const off = await rotateButtonState();
  ok(off !== null && off.pressed === "false", `after click → aria-pressed=false ("${off?.label}")`);
  // Wait out the single-model OrbitControls damping residual + any render-settle.
  await page.waitForTimeout(kind === "multi" ? 1500 : 5500);
  const rotOff = await isRotating();
  ok(isStoppedOk(rotOff), `rotation stopped (${kind === "multi" ? (rotOff * 100).toFixed(2) + "% px" : rotOff.toFixed(4) + " rad az"})`);

  // 4. Click again → resume.
  await page.locator('[role="toolbar"] button[aria-label*="旋转"]').click();
  await page.waitForTimeout(1200);
  const on2 = await rotateButtonState();
  ok(on2 !== null && on2.pressed === "true", `click again → aria-pressed=true ("${on2?.label}")`);
  const rotOn2 = await isRotating();
  ok(isRotatingOk(rotOn2), `rotation resumed (${kind === "multi" ? (rotOn2 * 100).toFixed(1) + "% px" : rotOn2.toFixed(3) + " rad az"})`);

  // 5. Manual orbit drag → toggle still works.
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(880, 520, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(900);
  await page.locator('[role="toolbar"] button[aria-label*="旋转"]').click();
  await page.waitForTimeout(1000);
  const afterDrag = await rotateButtonState();
  ok(afterDrag !== null && afterDrag.pressed === "false",
    `after drag, click → rotation off (aria-pressed=${afterDrag?.pressed})`);

  // 6. Explode slider + R reset still work per node kind.
  if (type === "multi") {
    const expand = page.locator('[role="toolbar"] button[aria-label="播放爆炸"]');
    const slider = page.locator('[role="toolbar"] input[type="range"]');
    await expand.click();
    await page.waitForTimeout(400);
    const v = Number(await slider.inputValue());
    ok(v > 0, `multi-model expand → slider ${v}`);
    await page.keyboard.press("r");
    await page.waitForTimeout(600);
    ok(Number(await slider.inputValue()) === 0, "multi-model R → slider 0");
  } else if (type === "animated") {
    const slider = page.locator('[role="toolbar"] input[type="range"]');
    await page.keyboard.press("r");
    await page.waitForTimeout(600);
    ok(Number(await slider.inputValue()) === 0, "animated R → slider 0");
  } else {
    const slider = page.locator('[role="toolbar"] input[type="range"]');
    const v = Number(await slider.inputValue());
    const disabled = await slider.isDisabled();
    ok(v === 1 && disabled, "noAnimation slider locked at 1 disabled");
    await page.keyboard.press("r");
    await page.waitForTimeout(600);
  }

  await page.screenshot({ path: `${SHOTS}-${id}.png` });

  const errs = [...consoleErrors];
  const reqs = [...failedReq];
  consoleErrors.length = 0;
  failedReq.length = 0;
  ok(errs.length === 0, `no console errors (${errs.length})` +
    (errs.length ? ` — ${errs.slice(0, 2).join(" | ")}` : ""));
  ok(reqs.length === 0, `no failed network requests (${reqs.length})` +
    (reqs.length ? ` — ${reqs.slice(0, 2).join(" | ")}` : ""));
}

console.log(failed === 0 ? "\nALL ROTATION-TOGGLE CHECKS PASSED" : `\n${failed} CHECK(S) FAILED`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
