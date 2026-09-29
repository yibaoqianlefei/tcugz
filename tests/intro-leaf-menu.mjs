import assert from "node:assert/strict";
import { chromium } from "playwright";
import introSections from "../src/data/sections/introSections.js";

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(process.env.HOME_TEST_URL ?? "http://127.0.0.1:5173/", { waitUntil: "domcontentloaded" });

  for (const width of [1440, 640]) {
    await page.setViewportSize({ width, height: 900 });
    const intro = page.locator("nav button:visible").filter({ hasText: "绪论" }).first();
    await intro.click();
    for (const section of introSections) {
      const leaf = page.getByRole("button", { name: section.title, exact: true });
      assert(await leaf.isVisible(), `${width}px: ${section.title} has no zero count`);
      assert.equal(await leaf.locator("svg").count(), 0, `${width}px: ${section.title} has no expand arrow`);
    }
    if (width === 1440) await intro.click();
  }

  await page.getByRole("button", { name: "建筑物的分类", exact: true }).click();
  await page.waitForURL(/#\/textbook\/introduction\//);
  console.log("Introduction leaves have no zero counts or arrows and still navigate");
} finally {
  await browser.close();
}
