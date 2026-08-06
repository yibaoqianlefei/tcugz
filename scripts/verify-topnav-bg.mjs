/**
 * Browser verification of the HomePage top-nav background fix.
 *
 * Checks:
 *  1. Top nav computed background-color is transparent (no white band).
 *  2. No backdrop-filter, no bottom border left on the nav.
 *  3. 贡献节点 / 关于项目 still top-right, with normal text/icon color.
 *  4. Nav pixel row matches the warm-gray page background (#faf9f5) — the
 *     canvas behind renders the same color, so the band is gone.
 *  5. Works with menu collapsed AND expanded, wide + narrow.
 *  6. No console errors / 404.
 *
 * Usage: node scripts/verify-topnav-bg.mjs <baseUrl>
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:5173";
const SHOTS = "audit-output/AUDIT_EVIDENCE/topnav-bg";
const browser = await chromium.launch();

let failed = 0;
function ok(cond, msg) {
  if (!cond) { failed++; console.log(`  ✗ FAIL: ${msg}`); }
  else console.log(`  ✓ PASS: ${msg}`);
}

async function run(viewport, tag, expandMenu) {
  const page = await browser.newPage({ viewport });
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push(String(e)));

  console.log(`\n===== ${tag} (${viewport.width}x${viewport.height}) ${expandMenu ? "[menu expanded]" : ""} =====`);
  await page.goto(`${baseUrl}/#/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  if (expandMenu) {
    await page.locator("aside nav button").nth(0).click(); // 绪论
    await page.waitForTimeout(600);
  }

  const navStyle = await page.evaluate(() => {
    const nav = document.querySelector('div[class*="justify-end"]');
    // the top nav is the absolute container holding 贡献节点/关于项目
    const holder = Array.from(document.querySelectorAll("div")).find((d) =>
      d.classList.contains("absolute") && /贡献节点|关于项目/.test(d.textContent || "") && d.children.length >= 2,
    );
    if (!holder) return null;
    const cs = getComputedStyle(holder);
    return {
      backgroundColor: cs.backgroundColor,
      backdropFilter: cs.backdropFilter,
      borderBottom: cs.borderBottomWidth + " " + cs.borderBottomStyle,
      rect: holder.getBoundingClientRect().toJSON(),
    };
  });
  ok(navStyle !== null, "top nav found");
  if (navStyle) {
    ok(navStyle.backgroundColor === "rgba(0, 0, 0, 0)" || navStyle.backgroundColor === "transparent",
      `nav background transparent (got ${navStyle.backgroundColor})`);
    ok(navStyle.backdropFilter === "none", `no backdrop-filter (got "${navStyle.backdropFilter}")`);
    ok(typeof navStyle.borderBottom === "string" && navStyle.borderBottom.startsWith("0px"),
      `no bottom border (got "${navStyle.borderBottom}")`);
    ok(navStyle.rect.left > 0, "nav exists");
  }

  // 贡献节点 / 关于项目 right-aligned + text/icon visible.
  const rightLinks = await page.evaluate(() => {
    const holder = Array.from(document.querySelectorAll("div")).find((d) =>
      d.classList.contains("absolute") && /贡献节点|关于项目/.test(d.textContent || "") && d.children.length >= 2,
    );
    if (!holder) return null;
    const r = holder.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const children = Array.from(holder.querySelectorAll("a,button")).map((el) => {
      const cs = getComputedStyle(el);
      return { text: (el.textContent || "").trim(), color: cs.color };
    });
    return { right: Math.round(viewportW - r.right), children };
  });
  ok(rightLinks && rightLinks.right >= 0, `nav right-aligned (right gap ${rightLinks?.right}px)`);
  ok(rightLinks?.children.some((c) => c.text.includes("贡献节点")), "贡献节点 present");
  ok(rightLinks?.children.some((c) => c.text.includes("关于项目")), "关于项目 present");
  ok(rightLinks?.children.every((c) => c.color !== "rgba(0, 0, 0, 0)"),
    "text/icon color visible (not transparent)");

  // Pixel continuity: decode the page screenshot INSIDE the browser (real PNG
  // decoder) and sample the nav row (y≈20, far right) vs the main area (y≈220).
  // Both must be near #faf9f5 — the nav is transparent over the canvas bg.
  const b64 = (await page.screenshot({ type: "png" })).toString("base64");
  const px = await page.evaluate(async (imgB64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + imgB64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    const xFar = img.width - 4;
    const nav = ctx.getImageData(xFar, 20, 1, 1).data;
    const main = ctx.getImageData(xFar, 220, 1, 1).data;
    return { nav: [nav[0], nav[1], nav[2]], main: [main[0], main[1], main[2]] };
  }, b64);
  ok(px !== null, "screenshot decoded for pixel sampling");
  if (px) {
    const nearWarmGray = (rgb) =>
      Math.abs(rgb[0] - 250) < 16 && Math.abs(rgb[1] - 249) < 16 && Math.abs(rgb[2] - 245) < 16;
    ok(nearWarmGray(px.nav), `nav row pixel ≈ #faf9f5 (got rgb(${px.nav.join(",")}))`);
    ok(
      Math.abs(px.nav[0] - px.main[0]) < 12 && Math.abs(px.nav[1] - px.main[1]) < 12 && Math.abs(px.nav[2] - px.main[2]) < 12,
      `nav row matches main area (nav rgb(${px.nav.join(",")}) vs main rgb(${px.main.join(",")}))`,
    );
  }

  await page.screenshot({ path: `${SHOTS}-${tag}${expandMenu ? "-expanded" : ""}.png` });
  ok(errs.length === 0, `no console errors (${errs.length})` +
    (errs.length ? ` — ${errs.slice(0, 2).join(" | ")}` : ""));
  await page.close();
}

await run({ width: 1440, height: 900 }, "wide", false);
await run({ width: 1440, height: 900 }, "wide", true);
await run({ width: 1024, height: 768 }, "narrow", false);
await run({ width: 1024, height: 768 }, "narrow", true);

console.log(failed === 0 ? "\nALL TOP-NAV-BG CHECKS PASSED" : `\n${failed} CHECK(S) FAILED`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
