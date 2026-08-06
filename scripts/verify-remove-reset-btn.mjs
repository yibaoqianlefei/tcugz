/**
 * Browser verification of the removed R reset button UI.
 *
 *  1. The bottom control bar has NO button whose label/title/aria contains
 *     "重置" / "R" — the circular-arrow + "R" button is gone.
 *  2. No empty placeholder / double divider is left: exactly 5 buttons,
 *     exactly 3 dividers between the 4 groups, bar still horizontally centered.
 *  3. Explode slider, rotate, link and lighting still work.
 *  4. R keyboard shortcut still resets (kept — protocol unchanged).
 *  5. No console errors / failed requests, at wide AND narrow viewports.
 *
 * Usage: node scripts/verify-remove-reset-btn.mjs <baseUrl>
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:5173";
const SHOTS = "audit-output/AUDIT_EVIDENCE/remove-reset-btn";

const browser = await chromium.launch();

let failed = 0;
function ok(cond, msg) {
  if (!cond) { failed++; console.log(`  ✗ FAIL: ${msg}`); }
  else console.log(`  ✓ PASS: ${msg}`);
}

async function checkViewport(nodeId, viewport, shotTag) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
  const failedReq = [];
  page.on("requestfailed", (r) => failedReq.push(r.url()));
  page.on("response", (r) => { if (r.status() >= 400) failedReq.push(`${r.status()} ${r.url()}`); });

  console.log(`\n===== ${nodeId} @ ${viewport.width}x${viewport.height} =====`);
  await page.goto(`${baseUrl}/#/node/${nodeId}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(4500);

  // 1 + 2: bar structure — no reset button, no leftover gap.
  const bar = await page.evaluate(() => {
    const el = document.querySelector('[role="toolbar"]');
    if (!el) return null;
    const buttons = Array.from(el.querySelectorAll("button"));
    const sliders = Array.from(el.querySelectorAll('input[type="range"]'));
    const dividers = Array.from(el.querySelectorAll('div[aria-hidden="true"]'));
    const center = el.closest("div.relative") || document.body;
    const cr = center.getBoundingClientRect();
    const br = el.getBoundingClientRect();
    return {
      labels: buttons.map((b) => b.getAttribute("aria-label") || b.getAttribute("title")),
      sliderCount: sliders.length,
      dividerCount: dividers.length,
      width: Math.round(br.width),
      centerDelta: Math.round(br.left + br.width / 2 - (cr.left + cr.width / 2)),
      barText: el.textContent,
    };
  });
  ok(bar !== null, "toolbar rendered");
  if (bar) {
    ok(bar.labels.length === 5, `exactly 5 buttons, no placeholder (got ${bar.labels.length}: ${bar.labels.join(",")})`);
    ok(bar.dividerCount === 3, `3 dividers between 4 groups (got ${bar.dividerCount})`);
    ok(!bar.labels.some((l) => /重置|\(R\)/.test(l)), "no reset (R) button label");
    ok(!/重置|\(R\)/.test(bar.barText), "no '重置' / '(R)' text anywhere in the bar");
    ok(!bar.labels.some((l) => l === "R" || l.startsWith("R")), "no bare-R button");
    ok(Math.abs(bar.centerDelta) < 8, `bar still centered (Δ ${bar.centerDelta}px)`);
    ok(bar.labels.some((l) => l.includes("收起")), "collapse present");
    ok(bar.labels.some((l) => l.includes("播放")), "expand present");
    ok(bar.labels.some((l) => l.includes("旋转")), "rotate present");
    ok(bar.labels.some((l) => l.includes("联动")), "link present");
    ok(bar.labels.some((l) => l.includes("阴影") || l.includes("光照")), "lighting present");
  }

  await page.screenshot({ path: `${SHOTS}-${nodeId}-${viewport.width}.png` });

  // 3. Explode slider still works.
  const slider = page.locator('[role="toolbar"] input[type="range"]');
  const expand = page.locator('[role="toolbar"] button[aria-label="播放爆炸"]');
  if (nodeId === "wall-damp-proof-course") {
    await expand.click();
    await page.waitForTimeout(400);
    ok(Number(await slider.inputValue()) === 1, "multi expand → slider 1");
  } else {
    const disabled = await slider.isDisabled();
    if (disabled) {
      ok(Number(await slider.inputValue()) === 1, "noAnimation slider locked 1 disabled");
    } else {
      await expand.click();
      await page.waitForTimeout(500);
      ok(Number(await slider.inputValue()) > 0, "animated expand → slider > 0");
    }
  }

  // Link + lighting toggles still work.
  const link = page.locator('[role="toolbar"] button[aria-label*="联动"]');
  const beforeLink = await link.getAttribute("aria-pressed");
  await link.click();
  await page.waitForTimeout(200);
  const afterLink = await link.getAttribute("aria-pressed");
  ok(beforeLink !== afterLink, `link toggle works (${beforeLink} → ${afterLink})`);

  const light = page.locator('[role="toolbar"] button[aria-label*="阴影"], [role="toolbar"] button[aria-label*="光照"]');
  const beforeLight = await light.getAttribute("aria-pressed");
  await light.click();
  await page.waitForTimeout(200);
  const afterLight = await light.getAttribute("aria-pressed");
  ok(beforeLight !== afterLight, `lighting toggle works (${beforeLight} → ${afterLight})`);

  // 4. R keyboard shortcut still resets (protocol kept).
  if (nodeId !== "wall-damp-proof-course" && !(await slider.isDisabled())) {
    await expand.click();
    await page.waitForTimeout(600);
    ok(Number(await slider.inputValue()) > 0, "pre-R slider > 0");
    await page.keyboard.press("r");
    await page.waitForTimeout(700);
    ok(Number(await slider.inputValue()) === 0, "R key still resets slider to 0");
  } else {
    await page.keyboard.press("r");
    await page.waitForTimeout(500);
  }

  // 5. Console / network.
  ok(consoleErrors.length === 0, `no console errors (${consoleErrors.length})` +
    (consoleErrors.length ? ` — ${consoleErrors.slice(0, 2).join(" | ")}` : ""));
  ok(failedReq.length === 0, `no failed requests (${failedReq.length})` +
    (failedReq.length ? ` — ${failedReq.slice(0, 2).join(" | ")}` : ""));

  await page.close();
}

await checkViewport("construction-column-01", { width: 1440, height: 900 }, "wide");
await checkViewport("wall-damp-proof-course", { width: 1440, height: 900 }, "wide");
await checkViewport("cast-ribbed-floor-01", { width: 1024, height: 768 }, "narrow");
await checkViewport("block-wall-core-column-01", { width: 900, height: 700 }, "narrow");

console.log(failed === 0 ? "\nALL REMOVE-RESET-BTN CHECKS PASSED" : `\n${failed} CHECK(S) FAILED`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
