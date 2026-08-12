/**
 * Browser verification of the 独立式基础三种形式 multi-model node.
 *
 * Checks:
 *  1. NodeDetail loads: title, 1 canvas, variant label bar A/B/C
 *     (杯形基础 / 阶梯形基础 / 锥形基础).
 *  2. Three variant models render side-by-side.
 *  3. Clicking each variant (canvas) selects it; knowledge panel shows the
 *     matching form content (杯形/阶梯形/锥形).
 *  4. Diagram (剖面图) renders.
 *  5. No console errors / 404.
 *
 * Usage: node scripts/verify-independent-foundation.mjs <baseUrl>
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:5173";
const NODE_ID = "independent-foundation-01";
const SHOT = "audit-output/AUDIT_EVIDENCE/node-independent-foundation-01.png";

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

await page.goto(`${baseUrl}/#/node/${NODE_ID}`, { waitUntil: "networkidle" });
await page.waitForTimeout(5000);

const heading = await page.evaluate(() => {
  const s = document.querySelector("header span.text-muted.font-medium");
  return s ? s.textContent : "";
});
ok(/独立式基础/.test(heading), `header shows node title ("${heading.trim()}")`);

const canvasCount = await page.locator("canvas").count();
ok(canvasCount === 1, `exactly 1 canvas (got ${canvasCount})`);

// Variant label bar A/B/C
const variantBar = await page.evaluate(() => {
  const bar = document.querySelector('[role="group"][aria-label="方案选择"]');
  return bar ? bar.textContent : null;
});
ok(variantBar !== null && /杯形基础/.test(variantBar) && /阶梯形基础/.test(variantBar) && /锥形基础/.test(variantBar),
  `variant label bar shows all three (${JSON.stringify(variantBar?.slice(0, 40))})`);

// Explode slider disabled (single-mesh variants, no explode config)
const slider = page.locator('[role="toolbar"] input[type="range"]');
if (await slider.count()) {
  ok(await slider.isDisabled(), "explode slider disabled (no explode config)");
} else {
  ok(true, "no explode slider (group hidden)");
}

// Render pixel check: models actually drawn on canvas
const b64 = (await page.screenshot({ type: "png" })).toString("base64");
const px = await page.evaluate(async (imgB64) => {
  const img = new Image();
  img.src = "data:image/png;base64," + imgB64;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  let drawn = 0, total = 0;
  for (let y = 180; y < 820; y += 20) {
    for (let x = 180; x < 1260; x += 20) {
      const d = ctx.getImageData(x, y, 1, 1).data;
      total++;
      if (!(Math.abs(d[0]-250)<18 && Math.abs(d[1]-249)<18 && Math.abs(d[2]-245)<18)) drawn++;
    }
  }
  return { drawn, total, pct: (100 * drawn / total).toFixed(1) };
}, b64);
ok(px && px.pct > 2, `variant models render on canvas (${px?.pct}% pixels drawn)`);

await page.screenshot({ path: SHOT });
console.log(`  [shot] ${SHOT}`);

// 1. Label bar selection → State 2: variant title + "点击模型构件" prompt.
const labelA = page.locator('button[aria-label="方案 A: 杯形基础"]');
ok(await labelA.count() === 1, "variant bar has A 杯形基础 button");
await labelA.click();
await page.waitForTimeout(400);
const state2 = await page.evaluate(() => document.body.innerText);
ok(state2.includes("杯形基础") && state2.includes("点击模型构件"),
  "selecting variant A via label bar → panel shows 杯形基础 + 点击模型构件提示");

// 2. Canvas click → full knowledge (State 4) for each variant. The models
// are single-mesh, laid out left→right; clicking a mesh selects that variant
// and shows its componentKnowledge. Scan a fine grid and collect phrases.
const canvas = page.locator("canvas");
const box = await canvas.boundingBox();
const PHRASES = { "杯口": "A杯形", "台阶": "B阶梯", "斜边": "C锥形" };
const reached = new Set();
for (const yf of [0.4, 0.5, 0.6, 0.7]) {
  for (let i = 1; i <= 20; i++) {
    const xf = i / 21;
    await page.mouse.click(box.x + box.width * xf, box.y + box.height * yf);
    await page.waitForTimeout(120);
    const b = await page.evaluate(() => document.body.innerText);
    for (const [ph, tag] of Object.entries(PHRASES)) {
      if (b.includes(ph)) reached.add(tag);
    }
  }
}
ok(reached.has("A杯形"), "canvas click on 杯形基础 shows full knowledge (杯口)");
ok(reached.has("B阶梯"), "canvas click on 阶梯形基础 shows full knowledge (台阶)");
ok(reached.has("C锥形"), "canvas click on 锥形基础 shows full knowledge (斜边)");

// Diagram renders (剖面图 image present)
const diagramImg = await page.evaluate(() => {
  const imgs = Array.from(document.images).map((i) => i.src);
  return imgs.some((s) => s.includes("independent-foundation-diagram.png"));
});
ok(diagramImg, "diagram (剖面图) rendered");

ok(consoleErrors.length === 0, `no console errors (${consoleErrors.length})` +
  (consoleErrors.length ? ` — ${consoleErrors.slice(0, 3).join(" | ")}` : ""));
ok(failedReq.length === 0, `no failed requests (${failedReq.length})` +
  (failedReq.length ? ` — ${failedReq.slice(0, 3).join(" | ")}` : ""));

console.log(failed === 0 ? "\nALL INDEPENDENT-FOUNDATION CHECKS PASSED" : `\n${failed} CHECK(S) FAILED`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
