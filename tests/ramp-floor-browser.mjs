import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const base = (process.argv[2] ?? 'http://127.0.0.1:5173').replace(/\/$/, '');
const suffix = process.argv[3] ?? '01';
assert(['01', '02'].includes(suffix));
const nodeId = `ramp-floor-${suffix}`;
const count = suffix === '01' ? 5 : 4;
const evidence = `tmp/ramp-floor-${suffix}`;
const bytes = await readFile(`public/models/stairs/ramp-floor/${nodeId}.glb`);
assert.equal(bytes.readUInt32LE(0), 0x46546c67);
assert.equal(bytes.readUInt32LE(4), 2);
assert.equal(bytes.readUInt32LE(8), bytes.length);
const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
assert.equal(gltf.nodes.filter(node => node.mesh !== undefined).length, count);
assert.equal(gltf.animations.length, count);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [], failed = [];
page.on('pageerror', error => errors.push(error.message));
page.on('requestfailed', request => failed.push(request.url()));
page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
await mkdir(evidence, { recursive: true });

try {
  await page.goto(`${base}/#/node/${nodeId}`);
  await page.locator('canvas').waitFor();
  await page.waitForTimeout(1300);
  await page.getByRole('button', { name: '暂停旋转', exact: true }).click();
  await page.mouse.move(5, 5);
  const diagram = page.locator('.node-diagram img');
  await diagram.evaluate(image => image.decode());
  assert.equal(await page.locator('.node-knowledge li').count(), count);
  const canvas = page.locator('canvas');
  const before = await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer();
  let drawn = 0;
  for (let i = 0; i < before.length; i += 3) if (before[i] < 170 && before[i + 1] < 170 && before[i + 2] < 170) drawn++;
  assert(drawn > 500, 'Model surfaces actually render');
  await page.screenshot({ path: `${evidence}/assembled.png` });
  await page.getByRole('button', { name: '播放爆炸', exact: true }).click();
  await page.waitForFunction(() => Number(document.querySelector('[aria-label="爆炸程度"]').value) === 1);
  const after = await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer();
  assert.equal(after.length, before.length);
  let moved = 0;
  for (let i = 0; i < before.length; i += 3) if (Math.abs(before[i] - after[i]) + Math.abs(before[i + 1] - after[i + 1]) + Math.abs(before[i + 2] - after[i + 2]) > 45) moved++;
  assert(moved > 500, 'Source animation visibly separates the layers');
  const box = await canvas.boundingBox();
  let picked = false;
  for (const y of [.2, .35, .5, .65, .8]) {
    for (const x of [.5, .35, .65, .2, .8]) {
      await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
      await page.waitForTimeout(50);
      if (await page.locator('.node-knowledge li').filter({ hasText: '说明' }).count()) { picked = true; break; }
    }
    if (picked) break;
  }
  assert(picked, 'Actual 3D picking opens component knowledge');
  const surface = page.locator('.node-knowledge li').filter({ hasText: suffix === '01' ? /^水泥方砖/ : /^20厚水泥砂浆面层/ });
  if (!(await surface.innerText()).includes('说明')) await surface.getByRole('button').first().click();
  assert.match(await surface.innerText(), suffix === '01' ? /50mm/ : /防滑条/);
  await page.mouse.move(5, 5);
  await page.screenshot({ path: `${evidence}/expanded.png` });
  await page.getByRole('button', { name: '收起爆炸', exact: true }).click();
  await page.waitForFunction(() => Number(document.querySelector('[aria-label="爆炸程度"]').value) === 0);
  await page.getByRole('button', { name: '播放爆炸', exact: true }).click();
  await page.waitForFunction(() => Number(document.querySelector('[aria-label="爆炸程度"]').value) > 0);
  await page.keyboard.press('r');
  await page.waitForFunction(() => Number(document.querySelector('[aria-label="爆炸程度"]').value) === 0);
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await canvas.isVisible());
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: `${evidence}/mobile.png` });
  await page.goto(`${base}/#/library`);
  await page.locator(`a[href$="/node/${nodeId}"]`).first().waitFor();
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  console.log(`PASS ${nodeId}: ${count} meshes, source animations, diagram, 3D picking, component knowledge, collapse/reset, mobile and library`);
} finally { await browser.close(); }
