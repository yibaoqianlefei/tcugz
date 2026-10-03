import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const glb = await readFile('public/models/roof/vent-pipe/vent-pipe.glb');
const source = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

async function inspectScene() {
  return page.evaluate(async () => {
    const { getModelScene } = await import('/src/utils/modelSceneRef.ts');
    const model = getModelScene();
    let scene = model;
    while (scene.parent) scene = scene.parent;
    const materials = new Map();
    model.traverse(child => {
      if (!child.isMesh) return;
      for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
        if (material.isMeshStandardMaterial) materials.set(material.name, {
          name: material.name, color: material.color.toArray(), metalness: material.metalness, roughness: material.roughness,
        });
      }
    });
    return { environment: scene.environment?.uuid, environmentIntensity: scene.environmentIntensity, materials: [...materials.values()] };
  });
}

try {
  await page.goto(`${base}/#/node/vent-pipe-roof-01`);
  await page.waitForFunction(() => window.__controls);
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: '暂停旋转', exact: true }).click();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(250);
  const initial = await inspectScene();
  assert(initial.environment, 'Metals have a reflection environment');
  for (const material of initial.materials) {
    const authored = source.materials.find(item => item.name === material.name).pbrMetallicRoughness ?? {};
    const color = authored.baseColorFactor?.slice(0, 3) ?? [1, 1, 1];
    material.color.forEach((value, index) => assert(Math.abs(value - color[index]) < 1e-6, `${material.name}: preserve base color`));
    assert(Math.abs(material.metalness - (authored.metallicFactor ?? 1)) < 1e-6);
    assert(Math.abs(material.roughness - (authored.roughnessFactor ?? 1)) < 1e-6);
  }

  const canvas = page.locator('canvas');
  const pixels = async () => {
    // Capture the viewport to avoid locator screenshots scrolling a tall Canvas.
    const box = await canvas.boundingBox();
    const screenshot = await page.screenshot();
    return sharp(screenshot).extract({ left: Math.round(box.x + box.width * .3), top: Math.round(box.y + box.height * .2), width: Math.round(box.width * .4), height: Math.round(box.height * .4) }).removeAlpha().raw().toBuffer();
  };
  const silver = await pixels();
  // Compare the previously excessive environment at the same camera pose.
  await page.evaluate(async () => {
    const { getModelScene } = await import('/src/utils/modelSceneRef.ts');
    let scene = getModelScene();
    while (scene.parent) scene = scene.parent;
    window.__balancedIntensity = scene.environmentIntensity;
    scene.environmentIntensity = 0.8;
  });
  await page.waitForTimeout(150);
  const excessive = await pixels();
  await page.evaluate(async () => {
    const { getModelScene } = await import('/src/utils/modelSceneRef.ts');
    let scene = getModelScene();
    while (scene.parent) scene = scene.parent;
    scene.environmentIntensity = window.__balancedIntensity;
  });
  await page.waitForTimeout(150);
  let softened = 0;
  for (let i = 0; i < excessive.length; i += 3) {
    const previous = (excessive[i] + excessive[i + 1] + excessive[i + 2]) / 3;
    const balanced = (silver[i] + silver[i + 1] + silver[i + 2]) / 3;
    if (previous > 225 && balanced < previous - 10) softened++;
  }
  assert(softened > 100, `Pale surfaces regain tonal range (${softened} formerly bright pixels)`);
  // Reproduce the previous missing-reflection scene at the exact same view.
  await page.evaluate(async () => {
    const { getModelScene } = await import('/src/utils/modelSceneRef.ts');
    let scene = getModelScene();
    while (scene.parent) scene = scene.parent;
    window.__metalEnvironment = scene.environment;
    scene.environment = null;
  });
  await page.waitForTimeout(150);
  const unlit = await pixels();
  await page.evaluate(async () => {
    const { getModelScene } = await import('/src/utils/modelSceneRef.ts');
    let scene = getModelScene();
    while (scene.parent) scene = scene.parent;
    scene.environment = window.__metalEnvironment;
  });
  await page.waitForTimeout(150);
  let restored = 0;
  for (let i = 0; i < unlit.length; i += 3) {
    const oldBrightness = (unlit[i] + unlit[i + 1] + unlit[i + 2]) / 3;
    const newBrightness = (silver[i] + silver[i + 1] + silver[i + 2]) / 3;
    if (oldBrightness < 45 && newBrightness > oldBrightness + 60) restored++;
  }
  assert(restored > 150, `Previously black metal surfaces gain reflections (${restored} pixels)`);
  await mkdir('tmp/materials', { recursive: true });
  await page.screenshot({ path: 'tmp/materials/verified.png' });

  await page.getByRole('button', { name: '播放爆炸', exact: true }).click();
  await page.waitForFunction(() => Number(document.querySelector('[aria-label="爆炸程度"]').value) === 1);
  await page.locator('.node-knowledge li').filter({ hasText: /^管根伞形罩/ }).getByRole('button').first().click();
  await page.mouse.move(5, 5);
  await page.keyboard.press('r');
  await page.waitForTimeout(500);
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.waitForTimeout(300);
  assert.deepEqual(await inspectScene(), initial, 'Selection/reset/resize retain lighting and authored materials');
  assert.deepEqual(errors, []);
  console.log(`PASS preserved PBR, reduced excessive brightness (${softened} pixels), silver reflections (${restored} formerly black pixels), animation/reset/resize preserve environment`);
} finally { await browser.close(); }
