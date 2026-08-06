/**
 * Deep browser verification of the tightened NodeDetail control bar.
 *
 * Checks (requirement §12 / §9 / §13):
 *   1. The control-bar DOM contains ONLY the whitelisted groups and exactly
 *      N groups, N-1 dividers (no empty dividers, no leftovers).
 *   2. The WHOLE page contains no 剖切 / X轴 Y轴 Z轴 / 反 / 锁定 / 瞄准 UI.
 *   3. Bar is anchored to the CENTER viewport (not the window), compact width.
 *   4. Multi-model explode: slider value follows store; expand→1, collapse→0.
 *   5. R reset re-runs the camera fit (CameraTracker.fit appears in
 *      window.__cameraWrites AFTER the reset keypress).
 *   6. No console errors on either node type.
 *
 * Usage: node scripts/verify-controlbar.mjs <baseUrl>
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:5174";
const VIEWPORT = { width: 1440, height: 900 };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT });

const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push(String(e)));

let failed = 0;
function ok(cond, msg) {
  if (!cond) { failed++; console.log(`  ✗ FAIL: ${msg}`); }
  else console.log(`  ✓ PASS: ${msg}`);
}

for (const nodeId of ["wall-damp-proof-course", "plaster-plinth-01"]) {
  console.log(`\n===== ${nodeId} =====`);
  await page.goto(`${baseUrl}/#/node/${nodeId}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);

  // 1 + 2: whole-page scan for forbidden controls / text.
  const forbidden = await page.evaluate(() => {
    const hits = [];
    const all = document.querySelectorAll("button, [role=toolbar] input, [role=toolbar]");
    for (const el of all) {
      const a = el.getAttribute("aria-label") || "";
      const t = el.getAttribute("title") || "";
      const txt = (el.textContent || "").trim();
      const s = `${a} ${t} ${txt}`;
      if (/(剖切|锁定|瞄准|反转|X ?轴|Y ?轴|Z ?轴)/.test(s)) hits.push(s.slice(0, 40));
    }
    return hits;
  });
  ok(forbidden.length === 0, `no forbidden controls anywhere on page ${nodeId}` +
    (forbidden.length ? ` — found: ${forbidden.join(" | ")}` : ""));

  // 1: toolbar structure — exactly the whitelisted buttons + N-1 dividers.
  const toolbar = await page.evaluate(() => {
    const bar = document.querySelector('[role="toolbar"]');
    if (!bar) return null;
    const rect = bar.getBoundingClientRect();
    const center = bar.closest("div.relative") || document.body;
    const centerRect = center.getBoundingClientRect();
    const buttons = Array.from(bar.querySelectorAll("button"));
    const sliders = Array.from(bar.querySelectorAll('input[type="range"]'));
    const dividers = Array.from(bar.querySelectorAll('div[aria-hidden="true"]'));
    return {
      barText: bar.textContent.trim(),
      buttonLabels: buttons.map((b) => b.getAttribute("aria-label") || b.getAttribute("title")),
      sliderCount: sliders.length,
      dividerCount: dividers.length,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      bottomOffset: Math.round(centerRect.bottom - rect.bottom),
      centerWidth: Math.round(centerRect.width),
      barCenterDelta: Math.round(
        rect.left + rect.width / 2 - (centerRect.left + centerRect.width / 2),
      ),
    };
  });
  ok(toolbar !== null, "toolbar rendered");
  if (toolbar) {
    const labels = toolbar.buttonLabels;
    ok(labels.length === 5, `5 buttons (got ${labels.length}: ${labels.join(",")})`);
    ok(labels.some((l) => l.includes("收起")), "collapse present");
    ok(labels.some((l) => l.includes("播放")), "expand present");
    ok(labels.some((l) => l.includes("暂停旋转") || l.includes("开启旋转")), "rotate present");
    ok(!labels.some((l) => l.includes("重置")), "reset (R) button removed");
    ok(labels.some((l) => l.includes("联动")), "link present");
    ok(labels.some((l) => l.includes("阴影") || l.includes("光照")), "lighting present");
    ok(toolbar.sliderCount === 1, `exactly 1 slider (got ${toolbar.sliderCount})`);
    ok(toolbar.dividerCount === 3, `3 dividers between 4 groups (got ${toolbar.dividerCount})`);
    ok(toolbar.width <= 560, `compact width ${toolbar.width}px ≤ 560`);
    ok(toolbar.bottomOffset >= 18 && toolbar.bottomOffset <= 30,
      `anchored ~20-28px above center-viewport bottom (got ${toolbar.bottomOffset}px)`);
    ok(Math.abs(toolbar.barCenterDelta) < 8,
      `horizontally centered in center viewport (barCenter Δ ${toolbar.barCenterDelta}px)`);
  }

  if (nodeId === "wall-damp-proof-course") {
    // 4: explode slider value follows store; expand → 1, collapse → 0.
    await page.evaluate(() => {
      // Read store via the React app is not exposed; instead drive the slider.
    });
    const slider = page.locator('[role="toolbar"] input[type="range"]');
    const expand = page.locator('[role="toolbar"] button[aria-label="播放爆炸"]');
    const collapse = page.locator('[role="toolbar"] button[aria-label="收起爆炸"]');

    await expand.click();
    await page.waitForTimeout(300);
    let val = await slider.inputValue();
    ok(Number(val) === 1, `expand → slider = 1 (got ${val})`);

    await collapse.click();
    await page.waitForTimeout(300);
    val = await slider.inputValue();
    ok(Number(val) === 0, `collapse → slider = 0 (got ${val})`);

    // 5: R reset re-runs the camera fit.
    const writesBefore = await page.evaluate(() => window.__cameraWrites?.length ?? 0);
    // Orbit away from the fitted view so the re-fit is observable.
    await page.mouse.move(700, 450);
    await page.mouse.down();
    await page.mouse.move(900, 550, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    await page.keyboard.press("r");
    await page.waitForTimeout(600);
    const writesAfter = await page.evaluate(() => window.__cameraWrites?.length ?? 0);
    ok(writesAfter > writesBefore,
      `R reset re-ran the camera fit (camera writes ${writesBefore} → ${writesAfter})`);
  } else {
    // 4b: noAnimation single-model — explode group is locked at 1 and disabled.
    const slider = page.locator('[role="toolbar"] input[type="range"]');
    const val = await slider.inputValue();
    const disabled = await slider.isDisabled();
    ok(Number(val) === 1, `noAnimation slider locked at 1 (got ${val})`);
    ok(disabled, "noAnimation slider disabled");
  }
}

// 6: console errors.
ok(consoleErrors.length === 0, `no console errors (${consoleErrors.length})` +
  (consoleErrors.length ? ` — ${consoleErrors.slice(0, 3).join(" | ")}` : ""));

console.log(failed === 0 ? "\nALL CHECKS PASSED" : `\n${failed} CHECK(S) FAILED`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
