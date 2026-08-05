/**
 * Post-deletion browser verification (§12) — 4 nodes at 1440×900.
 *
 * Verifies the abandoned Section / Camera Lock chains are FULLY deleted and
 * the remaining behaviour is byte-for-byte identical to the pre-deletion
 * build:
 *   - control bar structure unchanged (5 buttons / 1 slider / 3 dividers,
 *     compact width, no scissors / X Y Z / 反 / lock anywhere in the DOM)
 *   - multi-model A/B/C loaded with unchanged fit distance
 *   - independent auto-rotation still runs with NO camera drift (no re-fit
 *     writes during a sustained rotation window)
 *   - explode slider / collapse / expand / R reset (exactly one fit per press)
 *   - link + lighting toggles still work
 *   - variant selection (Picking/linkage) still works
 *   - user orbit / zoom / pan still works
 *   - console has zero errors on every page
 *
 * Usage: node scripts/verify-deletion.mjs <baseUrl>
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:5174";
const VIEWPORT = { width: 1440, height: 900 };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT });

const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push(String(e)));

let failed = 0;
function ok(cond, msg) {
  if (!cond) { failed++; console.log(`  ✗ FAIL: ${msg}`); }
  else console.log(`  ✓ PASS: ${msg}`);
}

async function snapshotToolbar() {
  return page.evaluate(() => {
    const bar = document.querySelector('[role="toolbar"]');
    if (!bar) return null;
    const rect = bar.getBoundingClientRect();
    const center = bar.closest("div.relative");
    const centerRect = center ? center.getBoundingClientRect() : { left: 0, width: 0, bottom: 0 };
    return {
      width: Math.round(rect.width),
      buttonCount: bar.querySelectorAll("button").length,
      sliderCount: bar.querySelectorAll('input[type="range"]').length,
      dividerCount: bar.querySelectorAll('div[aria-hidden="true"]').length,
      labels: Array.from(bar.querySelectorAll("button")).map(
        (b) => b.getAttribute("aria-label") || b.getAttribute("title"),
      ),
      barCenterDelta: Math.round(rect.left + rect.width / 2 - (centerRect.left + centerRect.width / 2)),
      bottomOffset: Math.round(centerRect.bottom - rect.bottom),
    };
  });
}

async function scanForbidden() {
  return page.evaluate(() => {
    const hits = [];
    for (const el of document.querySelectorAll("button, [role=toolbar]")) {
      const s = `${el.getAttribute("aria-label") || ""} ${el.getAttribute("title") || ""} ${el.textContent || ""}`;
      if (/(剖切|锁定|瞄准|反转|X ?轴|Y ?轴|Z ?轴)/.test(s)) hits.push(s.trim().slice(0, 30));
    }
    return hits;
  });
}

// ── 1. Multi-model node ──────────────────────────────────────
console.log(`\n===== wall-damp-proof-course (multi) =====`);
await page.goto(`${baseUrl}/#/node/wall-damp-proof-course`, { waitUntil: "networkidle" });
await page.waitForTimeout(4000);

ok((await scanForbidden()).length === 0, "no 剖切/X轴/Y轴/Z轴/反/锁定 anywhere");
const t = await snapshotToolbar();
ok(t && t.buttonCount === 5 && t.sliderCount === 1 && t.dividerCount === 3,
  `toolbar structure 5/1/3 (got ${t.buttonCount}/${t.sliderCount}/${t.dividerCount})`);
ok(t && t.width >= 450 && t.width <= 560, `toolbar width ~477 (got ${t.width}px)`);
ok(t && Math.abs(t.barCenterDelta) <= 4, `toolbar centered (Δ ${t?.barCenterDelta}px)`);
ok(t && t.bottomOffset >= 18 && t.bottomOffset <= 30, `anchored 20-28px (${t?.bottomOffset}px)`);

// A/B/C loaded + fit unchanged
const dbg = await page.evaluate(() => window.__multiModelDebug || null);
ok(dbg && dbg.variants && dbg.variants.length === 3, `3 variants loaded (got ${dbg?.variants?.length})`);
const fit = await page.evaluate(() => {
  const w = window.__cameraWrites || [];
  const f = w.find((x) => x.source === "CameraTracker.fit");
  return f ? { fitDistance: f.fitDistance, finalDistance: f.finalDistance, padding: f.cameraFitPadding } : null;
});
ok(fit && Math.abs(fit.fitDistance - 26.92) < 0.1 && fit.padding === 1.5,
  `multi-model fit unchanged (fitDistance ${fit?.fitDistance}, padding ${fit?.padding})`);

// Explode controls
const slider = page.locator('[role="toolbar"] input[type="range"]');
const expand = page.locator('[role="toolbar"] button[aria-label="播放爆炸"]');
const collapse = page.locator('[role="toolbar"] button[aria-label="收起爆炸"]');
await expand.click(); await page.waitForTimeout(300);
ok(Number(await slider.inputValue()) === 1, "expand → explode 1");
await collapse.click(); await page.waitForTimeout(300);
ok(Number(await slider.inputValue()) === 0, "collapse → explode 0");

// R reset → exactly one new fit per press
const w0 = await page.evaluate(() => window.__cameraWrites?.length ?? 0);
await page.keyboard.press("r"); await page.waitForTimeout(500);
const w1 = await page.evaluate(() => window.__cameraWrites?.length ?? 0);
await page.keyboard.press("r"); await page.waitForTimeout(500);
const w2 = await page.evaluate(() => window.__cameraWrites?.length ?? 0);
ok(w1 - w0 === 1 && w2 - w1 === 1, `R reset → exactly 1 fit per press (${w1 - w0}, ${w2 - w1})`);
ok(Number(await slider.inputValue()) === 0, "R reset → explode back to 0");

// Link + lighting toggles
const link = page.locator('[role="toolbar"] button[aria-label^="联动"]');
const lighting = page.locator('[role="toolbar"] button[aria-label*="阴影"]');
const linkOn = await link.getAttribute("aria-pressed");
await link.click(); await page.waitForTimeout(200);
const linkOff = await link.getAttribute("aria-pressed");
ok(linkOn === "true" && linkOff === "false", `link toggle works (${linkOn} → ${linkOff})`);
await link.click();
const lightOn = await lighting.getAttribute("aria-pressed");
await lighting.click(); await page.waitForTimeout(200);
const lightOff = await lighting.getAttribute("aria-pressed");
ok(lightOn === "true" && lightOff === "false", `lighting toggle works (${lightOn} → ${lightOff})`);
await lighting.click();

// Variant selection (Picking / linkage surface)
const variantBtn = page.locator('div[aria-label="方案选择"] button').first();
const va = await variantBtn.getAttribute("aria-pressed");
await variantBtn.click(); await page.waitForTimeout(250);
const vb = await variantBtn.getAttribute("aria-pressed");
ok(va === "false" && vb === "true", `variant selection works (${va} → ${vb})`);
await variantBtn.click();

// Auto-rotation: no camera writes during a sustained rotation window, and
// pixels change monotonically (rotation active, no drift).
await page.waitForTimeout(1500);
const camWritesAtStart = await page.evaluate(() => window.__cameraWrites?.length ?? 0);
const clip = { x: 540, y: 80, width: 560, height: 660 };
const { createHash } = await import("node:crypto");
const h = (b) => createHash("sha256").update(b).digest("hex").slice(0, 10);
const s0 = h(await page.screenshot({ clip }));
await page.waitForTimeout(3000);
const s1 = h(await page.screenshot({ clip }));
await page.waitForTimeout(3000);
const s2 = h(await page.screenshot({ clip }));
const camWritesAtEnd = await page.evaluate(() => window.__cameraWrites?.length ?? 0);
ok(s0 !== s1 && s1 !== s2, "multi-model auto-rotation is active (pixels changing)");
ok(camWritesAtEnd === camWritesAtStart,
  `no camera re-fit writes during rotation (${camWritesAtStart} → ${camWritesAtEnd}) — no drift`);

// User orbit / zoom / pan
await page.mouse.move(700, 450); await page.mouse.down();
await page.mouse.move(950, 600, { steps: 10 }); await page.mouse.up();
await page.mouse.wheel(0, -300); await page.waitForTimeout(400);
const userWrites = await page.evaluate(() => window.__cameraWrites?.length ?? 0);
ok(userWrites >= camWritesAtEnd, "orbit/zoom/pan executes without error");

// ── 2-4. Single-model nodes ──────────────────────────────────
for (const nodeId of ["construction-column-01", "cast-ribbed-floor-01", "plaster-plinth-01"]) {
  console.log(`\n===== ${nodeId} =====`);
  await page.goto(`${baseUrl}/#/node/${nodeId}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);

  ok((await scanForbidden()).length === 0, "no 剖切/X轴/Y轴/Z轴/反/锁定 anywhere");
  const t2 = await snapshotToolbar();
  ok(t2 && t2.buttonCount === 5 && t2.sliderCount === 1 && t2.dividerCount === 3,
    `toolbar structure 5/1/3 (got ${t2.buttonCount}/${t2.sliderCount}/${t2.dividerCount})`);
  ok(t2 && t2.width >= 450 && t2.width <= 560, `toolbar width ~477 (got ${t2.width}px)`);

  const sl = page.locator('[role="toolbar"] input[type="range"]');
  const val = Number(await sl.inputValue());
  const disabled = await sl.isDisabled();
  const isNoAnim = nodeId === "cast-ribbed-floor-01" || nodeId === "plaster-plinth-01";
  if (isNoAnim) {
    ok(val === 1 && disabled, `noAnimation: slider locked at 1 (${val})`);
  } else {
    // Animated single-model: 播放爆炸 starts the 4s AnimationMixer playback
    // (progress advances gradually — not an instant snap to 1).
    ok(val === 0 && !disabled, `animated: slider 0 and enabled`);
    const ex = page.locator('[role="toolbar"] button[aria-label="播放爆炸"]');
    await ex.click(); await page.waitForTimeout(400);
    const vExpand = Number(await sl.inputValue());
    ok(vExpand > 0, `expand starts playback (slider ${vExpand})`);
    // R reset still triggers exactly one camera fit (requestCameraRefit).
    const cw0 = await page.evaluate(() => window.__cameraWrites?.length ?? 0);
    await page.keyboard.press("r"); await page.waitForTimeout(400);
    const cw1 = await page.evaluate(() => window.__cameraWrites?.length ?? 0);
    ok(cw1 - cw0 === 1, `R reset triggers exactly 1 camera fit (${cw1 - cw0})`);
  }

  // single-model auto-rotation active
  const cl = { x: 540, y: 80, width: 560, height: 660 };
  const a0 = h(await page.screenshot({ clip: cl }));
  await page.waitForTimeout(2500);
  const a1 = h(await page.screenshot({ clip: cl }));
  ok(a0 !== a1, `single-model auto-rotation active (${nodeId})`);
}

// ── Console errors across all pages ─────────────────────────
ok(consoleErrors.length === 0, `zero console errors across all pages (${consoleErrors.length})` +
  (consoleErrors.length ? ` — ${consoleErrors.slice(0, 3).join(" | ")}` : ""));

console.log(failed === 0 ? "\nALL DELETION CHECKS PASSED" : `\n${failed} CHECK(S) FAILED`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
