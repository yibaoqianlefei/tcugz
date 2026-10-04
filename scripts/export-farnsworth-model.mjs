// Run with the local Vite server available. Export the same geometry as the UI.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(base);
  const data = await page.evaluate(async () => {
    const { createFarnsworthScene } = await import('/src/utils/farnsworthScene.ts');
    const { GLTFExporter } = await import('/node_modules/three/examples/jsm/exporters/GLTFExporter.js');
    const model = createFarnsworthScene();
    // Architecture-only asset; illustrative dressing remains authored in the UI.
    model.scene.remove(model.setting);
    model.scene.traverse(object => { object.userData = {}; });
    const binary = await new GLTFExporter().parseAsync(model.scene, { binary: true, onlyVisible: true });
    const bytes = new Uint8Array(binary);
    let text = '';
    for (let i = 0; i < bytes.length; i += 16384) text += String.fromCharCode(...bytes.subarray(i, i + 16384));
    model.dispose(); return btoa(text);
  });
  await mkdir('public/models/cases', { recursive: true });
  const binary = Buffer.from(data, 'base64');
  await writeFile('public/models/cases/farnsworth-house.glb', binary);
  console.log(`Exported complete building without presentation setting: ${binary.length} bytes`);
} finally { await browser.close(); }
