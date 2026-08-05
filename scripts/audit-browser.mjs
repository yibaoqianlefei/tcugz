/**
 * Read-only browser audit for the project (1440×900 primary, plus
 * 1920×1080 / 1366×768 / narrow for horizontal-scroll checks).
 *
 * Visits every route, captures console/page errors + 404 network failures,
 * checks for blank pages, screenshots key pages into audit-output/AUDIT_EVIDENCE/,
 * and verifies the 4 3D nodes' control bar + model presence.
 *
 * Usage: node scripts/audit-browser.mjs <baseUrl>
 */
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const baseUrl = process.argv[2] ?? "http://localhost:5174";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "audit-output", "AUDIT_EVIDENCE");
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = [
  ["/", "home"],
  ["/library", "library"],
  ["/curriculum", "curriculum"],
  ["/textbook/wall-construction/1", "textbook"],
  ["/node/wall-damp-proof-course", "node-multi"],
  ["/node/construction-column-01", "node-animated"],
  ["/node/cast-ribbed-floor-01", "node-noanim"],
  ["/node/plaster-plinth-01", "node-plinth"],
  ["/node/does-not-exist-xyz", "node-missing"],
  ["/data", "data-analysis"],
  ["/resources", "resources"],
  ["/games", "games"],
  ["/ai", "ai"],
  ["/tools", "tools"],
  ["/does-not-exist-route", "bad-route"],
];

const browser = await chromium.launch();

function newPage(vp) {
  return browser.newPage({ viewport: vp });
}

// ── Pass 1: 1440×900, all routes, console + network + screenshot ──
{
  const page = await newPage({ width: 1440, height: 900 });
  const errors = [];
  const pageErrors = [];
  const failed = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 200)));
  page.on("requestfailed", (r) => {
    const u = r.url();
    if (!u.startsWith("http://localhost")) return;
    failed.push(`${r.failure()?.errorText} ${u.replace(baseUrl, "")}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && r.status() < 600) {
      failed.push(`${r.status()} ${r.url().replace(baseUrl, "")}`);
    }
  });

  for (const [route, name] of ROUTES) {
    await page.goto(`${baseUrl}/#${route}`, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(route.includes("/node/") ? 3200 : 900);
    const info = await page.evaluate(() => {
      const text = document.body.innerText.trim().slice(0, 60).replace(/\s+/g, " ");
      return {
        bodyLen: text.length,
        canvases: document.querySelectorAll("canvas").length,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        title: document.title,
      };
    });
    const errCount = errors.length;
    const failCount = failed.length;
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log(
      `[${name}] ${route} → body:${info.bodyLen} canvas:${info.canvases} overflow:${info.horizontalOverflow} consoleErr:${errCount} netFail:${failCount}`,
    );
    if (info.bodyLen === 0) console.log(`  ⚠ BLANK page: ${route}`);
    errors.length = 0;
    failed.length = 0;
  }
  console.log(`\nPass1 total accumulated pageerrors: ${pageErrors.length}`);
  if (pageErrors.length) console.log("  ", pageErrors.slice(0, 5));
  await page.close();
}

// ── Pass 2: 3D node detail (1440×900) ──
{
  const page = await newPage({ width: 1440, height: 900 });
  for (const nodeId of ["wall-damp-proof-course", "construction-column-01", "cast-ribbed-floor-01", "plaster-plinth-01"]) {
    await page.goto(`${baseUrl}/#/node/${nodeId}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(3200);
    const t = await page.evaluate(() => {
      const bar = document.querySelector('[role="toolbar"]');
      if (!bar) return { bar: null };
      const forbidden = [];
      for (const el of document.querySelectorAll("button")) {
        const s = `${el.getAttribute("aria-label") || ""} ${el.textContent || ""}`;
        if (/(剖切|锁定|瞄准|反转|X ?轴|Y ?轴|Z ?轴)/.test(s)) forbidden.push(s.slice(0, 20));
      }
      return {
        bar: {
          buttons: bar.querySelectorAll("button").length,
          sliders: bar.querySelectorAll('input[type="range"]').length,
          dividers: bar.querySelectorAll('div[aria-hidden="true"]').length,
          width: Math.round(bar.getBoundingClientRect().width),
        },
        forbidden,
        canvases: document.querySelectorAll("canvas").length,
      };
    });
    console.log(`[3D ${nodeId}] bar:${JSON.stringify(t.bar)} forbidden:${t.forbidden?.length} canvases:${t.canvases}`);
    await page.screenshot({ path: path.join(OUT, `node-${nodeId}.png`) });
  }
  await page.close();
}

// ── Pass 3: horizontal scroll across viewports (home + node) ──
for (const vp of [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }, { width: 800, height: 900 }]) {
  const page = await newPage(vp);
  for (const route of ["/", "/library", "/node/wall-damp-proof-course"]) {
    await page.goto(`${baseUrl}/#${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(route.includes("/node/") ? 3200 : 900);
    const ov = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    console.log(`[vp ${vp.width}×${vp.height}] ${route} overflow:${ov.scrollW > ov.clientW} (scrollW ${ov.scrollW} vs clientW ${ov.clientW})`);
  }
  await page.close();
}

await browser.close();
console.log("\nBrowser audit complete. Evidence in audit-output/AUDIT_EVIDENCE/");
