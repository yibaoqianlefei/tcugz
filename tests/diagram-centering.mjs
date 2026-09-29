import assert from "node:assert/strict";
import { chromium } from "playwright";

const origin = process.env.LAYOUT_TEST_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });

async function checkImage(page, label) {
  const result = await page.locator(".node-diagram img").evaluate(async (image) => {
    await image.decode();
    const area = image.closest(".node-diagram").children[1];
    const imageBox = image.getBoundingClientRect();
    const areaBox = area.getBoundingClientRect();
    const scale = Math.min(imageBox.width / image.naturalWidth, imageBox.height / image.naturalHeight);
    const displayedWidth = image.naturalWidth * scale;
    const displayedHeight = image.naturalHeight * scale;
    return {
      fit: getComputedStyle(image).objectFit,
      xOffset: imageBox.x + imageBox.width / 2 - (areaBox.x + areaBox.width / 2),
      yOffset: imageBox.y + imageBox.height / 2 - (areaBox.y + areaBox.height / 2),
      displayedWidth,
      displayedHeight,
      areaWidth: areaBox.width,
      areaHeight: areaBox.height,
    };
  });
  assert.equal(result.fit, "contain", `${label}: preserve the full image`);
  assert(Math.abs(result.xOffset) <= 1 && Math.abs(result.yOffset) <= 1,
    `${label}: image must be centered in both axes (${JSON.stringify(result)})`);
  assert(result.displayedWidth <= result.areaWidth && result.displayedHeight <= result.areaHeight,
    `${label}: image must fit without clipping`);
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Different existing nodes all use the same diagram rule.
  for (const nodeId of ["eaves-gutter-01", "wood-batten-tile-roof-01", "block-wall-core-column-01"]) {
    await page.goto(`${origin}/#/node/${nodeId}`);
    await page.locator(".node-diagram img").waitFor();
    await checkImage(page, nodeId);
  }

  // Future uploads can be extremely wide or tall; their own dimensions must
  // not affect the panel's vertical alignment or crop the drawing.
  for (const [label, width, height] of [["future-wide", 1600, 200], ["future-tall", 200, 1600]]) {
    const source = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"/>`)}`;
    await page.locator(".node-diagram img").evaluate((image, src) => { image.src = src; }, source);
    await checkImage(page, label);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("tab", { name: "图纸" }).click();
  await checkImage(page, "mobile future-tall");

  console.log("Diagram centering passed for current nodes, future aspect ratios, and mobile");
} finally {
  await browser.close();
}
