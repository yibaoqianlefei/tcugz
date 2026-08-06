/**
 * HomePage left-nav menu restructure — real-configuration tests.
 *
 * Imports the ACTUAL single source of truth (`src/data/homeMenu.ts`) plus the
 * real sub-section / course-module data it is built from — never a copied
 * array.  Covers the menu restructure contract:
 *
 *   - top-level order: 绪论 构造基础 构造原理 节点库 案例应用 作业训练 AI 拓展
 *   - no 数据分析 entry
 *   - 绪论 promoted to a top-level EXPANDABLE menu (own children), first item
 *   - 绪论 sub-sections unchanged (names + order + routes)
 *   - 构造基础 no longer contains 绪论
 *   - 构造基础 before 构造原理; neither's sub-content swapped
 *   - all three expandable menus share the same config shape (children →
 *     the single expandable render branch in MenuContent)
 *   - other top-level entries' routes unchanged
 *
 * Click-expand/collapse and route-highlighting are React render behaviors —
 * they are covered by browser acceptance; here we assert the real config
 * invariants those behaviors depend on (expandable shape, stable ids, routes).
 *
 * Run with: npx tsx tests/home-menu.test.ts
 */
import { menuItems, getExpandedChildren, sectionMap } from "../src/data/homeMenu";
import introSections from "../src/data/sections/introSections.js";
import courseModules from "../src/data/courseModules";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`  PASS: ${msg}`);
}

let testCount = 0;
function group(title: string): void {
  testCount++;
  console.log(`\n== T${testCount}: ${title}`);
}

const labels = menuItems.map((m) => m.label);
const ids = menuItems.map((m) => m.id);

/* ═══════════════════════════════════════════════════════════════
   Top-level structure
   ═══════════════════════════════════════════════════════════════ */

group("Top-level menu order is exactly the target 7 items");
{
  const expected = ["绪论", "构造基础", "构造原理", "节点库", "案例应用", "作业训练", "AI 拓展"];
  assert(expected.length === labels.length,
    `7 top-level entries (got ${labels.length}: ${labels.join(",")})`);
  assert(expected.every((l, i) => labels[i] === l),
    `order matches (${labels.join(" → ")})`);
}

group("No 数据分析 entry in the top-level menu");
{
  assert(!ids.includes("data"), "no 'data' menu id");
  assert(!labels.includes("数据分析"), "no '数据分析' label");
  assert(!menuItems.some((m) => m.to === "/data"), "no entry routes to /data");
}

group("绪论 appears exactly once, as a top-level expandable item");
{
  assert(labels.filter((l) => l === "绪论").length === 1, "绪论 appears exactly once");
  const intro = menuItems.find((m) => m.label === "绪论");
  assert(!!intro, "绪论 top-level item exists");
  assert(intro!.id === "introduction", "绪论 id = introduction");
  assert(intro!.children && intro!.children.length > 0,
    "绪论 has own children (expandable, NOT a plain link)");
  assert(!intro!.to, "绪论 is not a plain link (no to route)");
}

group("All three expandable menus share the same config shape (same render branch)");
{
  for (const name of ["绪论", "构造基础", "构造原理"]) {
    const m = menuItems.find((x) => x.label === name);
    assert(!!m && !!m.children && m.children.length > 0,
      `${name} has non-empty children → renders via the shared expandable branch`);
    assert(!m!.to, `${name} is expandable (not a direct-jump link)`);
  }
}

/* ═══════════════════════════════════════════════════════════════
   绪论 sub-sections
   ═══════════════════════════════════════════════════════════════ */

group("绪论 sub-sections unchanged (names, order, routes)");
{
  const introChildren = getExpandedChildren("introduction")!;
  assert(!!introChildren, "绪论 children readable via getExpandedChildren");
  assert(introChildren.length === introSections.length,
    `绪论 has ${introSections.length} sub-sections (got ${introChildren.length})`);
  for (let i = 0; i < introSections.length; i++) {
    const sec = introSections[i];
    const child = introChildren[i];
    assert(child.id === sec.id, `[${sec.id}] id preserved`);
    assert(child.label === sec.title, `[${sec.id}] label == section title ("${sec.title}")`);
    assert(child.path === `/textbook/introduction/${sec.id}`,
      `[${sec.id}] route preserved (/textbook/introduction/${sec.id})`);
  }
  assert(
    introChildren.map((c) => c.id).join(",") === introSections.map((s) => s.id).join(","),
    "sub-section ORDER unchanged",
  );
}

group("绪论 sub-section routes exist in the real section data");
{
  const real = sectionMap["introduction"] ?? [];
  const idsFromConfig = getExpandedChildren("introduction")!.map((c) => c.id);
  assert(real.length > 0, "introSections non-empty");
  assert(idsFromConfig.every((id) => real.some((s) => s.id === id)),
    "every 绪论 child id exists in sectionMap.introduction");
}

/* ═══════════════════════════════════════════════════════════════
   构造基础
   ═══════════════════════════════════════════════════════════════ */

group("构造基础 no longer contains 绪论; other modules preserved");
{
  const tb = menuItems.find((m) => m.label === "构造基础")!;
  const tbChildren = tb.children!.map((c) => c.id);
  assert(!tbChildren.includes("introduction"), "构造基础 has no 绪论 (introduction) child");
  const remaining = courseModules.filter((m) => m.id !== "introduction");
  assert(tbChildren.length === remaining.length,
    `构造基础 keeps ${remaining.length} modules (got ${tbChildren.length})`);
  assert(
    tbChildren.join(",") === remaining.map((m) => m.id).join(","),
    "构造基础 module ORDER unchanged after removing 绪论",
  );
  assert(tbChildren.join(",") ===
    ["wall", "door-window", "foundation", "floor", "stairs", "roof", "deformation-joint"].join(","),
    "构造基础 = 墙体/门窗/基础与地基/楼地层/楼梯/屋顶/变形缝",
  );
}

group("构造基础 sits before 构造原理; sub-content not swapped");
{
  const tbIdx = labels.indexOf("构造基础");
  const clIdx = labels.indexOf("构造原理");
  assert(tbIdx !== -1 && clIdx !== -1 && tbIdx < clIdx, "构造基础 before 构造原理");
  // 构造原理 children are the original 6 principle modules.
  const cl = menuItems.find((m) => m.label === "构造原理")!;
  assert(
    cl.children!.map((c) => c.id).join(",") ===
      "thermal,waterproof,insulation,acoustic,fire,moisture",
    "构造原理 children unchanged (thermal/waterproof/insulation/acoustic/fire/moisture)",
  );
}

/* ═══════════════════════════════════════════════════════════════
   Other top-level entries unchanged
   ═══════════════════════════════════════════════════════════════ */

group("Other top-level entries keep their routes");
{
  const expect = {
    library: "/library",
    cases: "/curriculum/cases",
    games: "/games",
    "ai-extend": "/ai-extend",
  };
  for (const [id, to] of Object.entries(expect)) {
    const m = menuItems.find((x) => x.id === id);
    assert(!!m && m.to === to, `${id} → ${to} (${m ? m.to : "missing"})`);
    assert(!m!.children, `${id} remains a plain link`);
  }
}

group("No hidden focusable 数据分析 entry remains in the config");
{
  assert(ids.length === 7, `exactly 7 top-level ids (got ${ids.join(",")})`);
  assert(!ids.includes("data"), "no data id anywhere");
}

console.log(`\nAll home-menu tests passed (${testCount} groups).`);
