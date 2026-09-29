import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(process.env.HOME_TEST_URL ?? "http://127.0.0.1:5173/");
  await page.locator("canvas").waitFor();

  async function visibleWidth(selector) {
    return page.locator(selector).first().evaluate((element) => element.getBoundingClientRect().width);
  }

  for (const width of [1440, 1280, 1200, 1199, 1024, 768, 767, 640]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(100);
    const initialCanvas = await visibleWidth("canvas");
    await page.locator("nav button:visible").filter({ hasText: "绪论" }).first().click();
    await page.waitForTimeout(350);
    const openedCanvas = await visibleWidth("canvas");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert(overflow <= 1, `no horizontal page overflow at ${width}px`);

    if (width >= 1200) {
      assert(initialCanvas - openedCanvas > 234 && initialCanvas - openedCanvas < 254,
        `desktop submenu uses its 244px panel at ${width}px`);
      await page.locator("nav button:visible").filter({ hasText: "绪论" }).first().click();
    } else {
      assert(Math.abs(initialCanvas - openedCanvas) <= 1,
        `compact submenu does not shrink 3D viewport at ${width}px`);
      assert(await page.locator('button[aria-label="返回主菜单"]:visible').count() === 1,
        `compact submenu has a usable back button at ${width}px`);
      await page.locator('button[aria-label="返回主菜单"]:visible').click();
    }
    await page.waitForTimeout(350);
  }

  // Compact navigation remains functional rather than becoming a dead end.
  await page.locator("nav button:visible").filter({ hasText: "绪论" }).first().click();
  await page.getByRole("button", { name: /建筑物的分类/ }).click();
  await page.waitForURL(/#\/textbook\/introduction\//);
  assert.deepEqual(errors, [], "no browser exceptions during home layout/navigation checks");
  console.log("Home viewport and compact navigation passed");
} finally {
  await browser.close();
}
