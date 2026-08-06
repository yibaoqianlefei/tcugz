/**
 * Browser verification of the HomePage left-nav restructure.
 *
 * NOTE: MenuContent renders twice — desktop (inside `aside`) and mobile
 * (`flex md:hidden` div).  Selectors scope to the DESKTOP `aside nav` so the
 * hidden mobile duplicate is never matched.
 *
 * Covers:
 *  A. Top-level menu order (绪论…AI 拓展), no 数据分析, 绪论 has arrow.
 *  B. 绪论 click → expands in place; click again → collapses.
 *  C. 绪论 sub-chapter → navigates to #/textbook/introduction/{id}.
 *  D. 构造基础 → expands, panel has no 绪论 module, keeps 7 modules.
 *  E. 构造原理 → expands, 6 modules.
 *  F. 节点库 / 案例应用 / 作业训练 / AI 拓展 still navigate.
 *  G. No console errors, no 404, aria-expanded consistent.
 *
 * Usage: node scripts/verify-home-menu.mjs <baseUrl>
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:5173";
const SHOTS = "audit-output/AUDIT_EVIDENCE/home-menu";

const browser = await chromium.launch();
const consoleErrors = [];
const failedReq = [];

let failed = 0;
function ok(cond, msg) {
  if (!cond) { failed++; console.log(`  ✗ FAIL: ${msg}`); }
  else console.log(`  ✓ PASS: ${msg}`);
}

async function run(viewport, tag) {
  const page = await browser.newPage({ viewport });
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
  page.on("requestfailed", (r) => failedReq.push(r.url()));
  page.on("response", (r) => { if (r.status() >= 400) failedReq.push(`${r.status()} ${r.url()}`); });

  console.log(`\n===== ${tag} (${viewport.width}x${viewport.height}) =====`);
  await page.goto(`${baseUrl}/#/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Desktop menu: expandable buttons + link anchors inside the aside nav.
  const expandBtns = page.locator("aside nav button");
  const linkItems = page.locator("aside nav a");
  const expTexts = await expandBtns.evaluateAll((els) =>
    els.map((el) => (el.textContent || "").replace(/\s+/g, " ").trim()),
  );
  const linkTexts = await linkItems.evaluateAll((els) =>
    els.map((el) => (el.textContent || "").replace(/\s+/g, " ").trim()),
  );
  // Interleave: 3 expandable + 4 links = the 7 top-level items.
  const topLabels = [expTexts[0], expTexts[1], expTexts[2], linkTexts[0], linkTexts[1], linkTexts[2], linkTexts[3]];
  const expectedOrder = ["绪论", "构造基础", "构造原理", "节点库", "案例应用", "作业训练", "AI 拓展"];
  ok(expTexts.length === 3, `3 expandable menus (got ${expTexts.length})`);
  ok(linkTexts.length === 4, `4 link menus (got ${linkTexts.length})`);
  ok(expectedOrder.every((l, i) => topLabels[i] === l),
    `order: ${topLabels.join(" → ")}`);
  ok(!topLabels.some((t) => t.includes("数据分析")), "数据分析 NOT shown");

  const introBtn = expandBtns.nth(0);
  ok((await introBtn.locator("svg").count()) > 0, "绪论 has an arrow (chevron) → expandable");
  ok(await introBtn.getAttribute("aria-expanded") === "false", "绪论 initial aria-expanded=false");
  await page.screenshot({ path: `${SHOTS}-${tag}-initial.png` });

  // B. 绪论 expand / collapse.
  await introBtn.click();
  await page.waitForTimeout(600);
  ok(page.url().includes("#/") && !page.url().includes("/textbook/"),
    "clicking 绪论 does NOT navigate (stays on home)");
  ok(await introBtn.getAttribute("aria-expanded") === "true", "绪论 aria-expanded=true");
  const panelModules = page.locator('aside div[class*="space-y-0.5"] button');
  const panelTexts = await panelModules.evaluateAll((els) =>
    els.map((el) => (el.textContent || "").trim()),
  );
  const introChildren = ["建筑物的分类", "建筑物的分级", "建筑物的构造组成", "影响建筑物的因素", "建筑构造的设计原则", "专题：制图标准与规范"];
  ok(introChildren.every((c) => panelTexts.some((t) => t.includes(c))),
    `绪论 sub-chapters all visible (${introChildren.length})`);
  await page.screenshot({ path: `${SHOTS}-${tag}-intro-expanded.png` });

  await introBtn.click();
  await page.waitForTimeout(600);
  ok(await introBtn.getAttribute("aria-expanded") === "false", "绪论 collapses (aria-expanded=false)");

  // C. 绪论 sub-chapter navigation.
  await introBtn.click();
  await page.waitForTimeout(500);
  await page.locator('aside div[class*="space-y-0.5"] button:has-text("建筑物的分类")').first().click();
  await page.waitForTimeout(1000);
  ok(page.url().includes("#/textbook/introduction/intro-classification"),
    `sub-chapter → #/textbook/introduction/intro-classification (got ${page.url()})`);
  await page.goto(`${baseUrl}/#/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  // D. 构造基础 (expandable index 1).
  const tbBtn = expandBtns.nth(1);
  await tbBtn.click();
  await page.waitForTimeout(600);
  ok(await tbBtn.getAttribute("aria-expanded") === "true", "构造基础 expands");
  const tbPanel = (await page.locator('aside div[class*="space-y-0.5"] button').evaluateAll((els) =>
    els.map((el) => (el.textContent || "").trim()))).join(",");
  for (const c of ["墙体", "门窗", "基础与地基", "楼地层", "楼梯", "屋顶", "变形缝"]) {
    ok(tbPanel.includes(c), `构造基础 shows ${c}`);
  }
  ok(!tbPanel.includes("绪论"), "构造基础 panel does NOT show 绪论");
  await page.screenshot({ path: `${SHOTS}-${tag}-textbook-expanded.png` });
  await tbBtn.click();
  await page.waitForTimeout(400);

  // E. 构造原理 (expandable index 2).
  await expandBtns.nth(2).click();
  await page.waitForTimeout(600);
  const clPanel = (await page.locator('aside div[class*="space-y-0.5"] button').evaluateAll((els) =>
    els.map((el) => (el.textContent || "").trim()))).join(",");
  for (const c of ["建筑保温", "建筑防水", "建筑隔热", "建筑隔声", "建筑防火", "建筑防潮"]) {
    ok(clPanel.includes(c), `构造原理 shows ${c}`);
  }
  await page.screenshot({ path: `${SHOTS}-${tag}-curriculum-expanded.png` });

  // F. Other menus navigate (quick URL check).
  await page.goto(`${baseUrl}/#/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const targets = [
    { label: "节点库", hash: "#/library" },
    { label: "案例应用", hash: "#/curriculum/cases" },
    { label: "作业训练", hash: "#/games" },
    { label: "AI 拓展", hash: "#/ai-extend" },
  ];
  for (const t of targets) {
    await page.locator(`aside nav a:has-text("${t.label}")`).first().click();
    await page.waitForTimeout(600);
    ok(page.url().includes(t.hash), `${t.label} → ${t.hash} (got ${page.url()})`);
    await page.goto(`${baseUrl}/#/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
  }

  await page.close();
}

await run({ width: 1440, height: 900 }, "wide");
await run({ width: 1024, height: 768 }, "narrow");

console.log(`\n=== G. console / network ===`);
ok(consoleErrors.length === 0, `no console errors (${consoleErrors.length})` +
  (consoleErrors.length ? ` — ${consoleErrors.slice(0, 3).join(" | ")}` : ""));
ok(failedReq.length === 0, `no failed requests / 404 (${failedReq.length})` +
  (failedReq.length ? ` — ${failedReq.slice(0, 3).join(" | ")}` : ""));

console.log(failed === 0 ? "\nALL HOME-MENU CHECKS PASSED" : `\n${failed} CHECK(S) FAILED`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
