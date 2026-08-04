/**
 * Capture the NodeDetail page at a fixed viewport (1440x900) for both a
 * multi-model node and a single-model node, and dump the toolbar DOM.
 *
 * Usage: node scripts/capture-controlbar.mjs <baseUrl> <outPrefix> <nodeId>...
 *   node scripts/capture-controlbar.mjs http://localhost:5174 shot wall-damp-proof-course plaster-plinth-01
 * Writes: <outPrefix>-<nodeId>.png and prints the toolbar button list to stdout.
 */
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const [baseUrl, outPrefix, ...nodeIds] = process.argv.slice(2);
if (!baseUrl || !outPrefix || nodeIds.length === 0) {
  console.error("usage: node scripts/capture-controlbar.mjs <baseUrl> <outPrefix> <nodeId>...");
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VIEWPORT = { width: 1440, height: 900 };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT });

for (const nodeId of nodeIds) {
  await page.goto(`${baseUrl}/#/node/${nodeId}`, { waitUntil: "networkidle" });
  // Give the 3D scene time to load GLB + settle the camera.
  await page.waitForTimeout(3500);

  const out = path.join(root, `${outPrefix}-${nodeId}.png`);
  await page.screenshot({ path: out });

  // Dump every button / input / divider inside the floating control bar
  // (the toolbar anchored to the bottom centre of the 3D viewport).
  // Located by climbing from the first range input to its absolutely
  // positioned ancestor — robust whether or not the bar has role="toolbar".
  const controls = await page.evaluate(() => {
    const slider = document.querySelector(
      'div[class*="relative"] input[type="range"], input[type="range"]',
    );
    let bar = null;
    if (slider) {
      let el = slider.parentElement;
      while (el) {
        const pos = getComputedStyle(el).position;
        if (pos === "absolute" || el.className.includes("absolute")) { bar = el; break; }
        el = el.parentElement;
      }
    }
    if (!bar) return { error: "no toolbar found" };
    const items = Array.from(bar.querySelectorAll("button, input[type=range], div")).map((el) => {
      const tag = el.tagName.toLowerCase();
      const label =
        el.getAttribute("aria-label") ||
        el.getAttribute("title") ||
        el.textContent?.trim().slice(0, 12) ||
        tag;
      const disabled = el.tagName === "INPUT" ? el.disabled : el.hasAttribute("disabled");
      const cls = typeof el.className === "string" ? el.className.slice(0, 40) : "";
      return { tag, label, disabled, cls };
    }).filter((it) => it.tag === "button" || it.tag === "input" || (it.tag === "div" && it.cls.includes("w-px")));
    return { barText: bar.textContent?.trim(), items };
  });
  console.log(`\n=== ${nodeId} ===`);
  console.log(JSON.stringify(controls, null, 2));
  console.log(`screenshot: ${out}`);
}

await browser.close();
