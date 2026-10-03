import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const base = (process.argv[2] ?? 'http://127.0.0.1:5173').replace(/\/$/, '');
const variant = process.argv[3] ?? '01';
assert(['01', '02'].includes(variant));
const nodeId = `rigid-roof-transverse-joint-${variant}`;
const coverName = variant === '01' ? '二布三油' : '折脊盖瓦';
const coverDescription = variant === '01' ? /跨缝覆盖构造/ : /独立的跨缝盖瓦/;
const evidence = `tmp/rigid-roof-joint-${variant}`;
const bytes = await readFile(`public/models/roof/rigid-roof-joint/transverse-joint-${variant}.glb`);
const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
const coverNode = gltf.nodes.find(node => node.name === coverName);
assert(coverNode.mesh !== undefined, 'The animated waterproof cover has real geometry');
assert.equal(gltf.meshes[coverNode.mesh].primitives.length, variant === '01' ? 2 : 1);
assert(gltf.nodes.every(node => node.mesh !== undefined), 'Every component has an actual mesh');
assert.equal(gltf.animations.length, 9);
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
  const image = page.locator('.node-diagram img');
  assert(await image.evaluate(element => element.complete && element.naturalWidth > 0));
  assert.equal(await page.locator('.node-knowledge li').count(), 9);
  const assembled = await page.screenshot({ path: `${evidence}/assembled.png` });
  const canvas = await page.locator('canvas').boundingBox();
  const pixels = await sharp(assembled).extract({ left: Math.floor(canvas.x + canvas.width * .2), top: Math.floor(canvas.y + canvas.height * .15), width: Math.floor(canvas.width * .6), height: Math.floor(canvas.height * .65) }).removeAlpha().raw().toBuffer();
  let drawn = 0;
  for (let index = 0; index < pixels.length; index += 3) if (pixels[index] < 170 && pixels[index + 1] < 170 && pixels[index + 2] < 170) drawn++;
  assert(drawn > 500, 'Geometry and material surfaces actually render');

  const slider = page.getByRole('slider', { name: '爆炸程度' });
  await page.getByRole('button', { name: '播放爆炸', exact: true }).click();
  await page.waitForFunction(() => Number(document.querySelector('[aria-label="爆炸程度"]').value) === 1);
  let selected = false;
  for (const y of [.2, .3, .4, .5, .6, .7, .8, .12]) {
    for (const x of [.5, .4, .6, .3, .7]) {
      await page.mouse.click(canvas.x + canvas.width * x, canvas.y + canvas.height * y);
      await page.waitForTimeout(50);
      const info = page.locator('.node-knowledge li').filter({ hasText: '说明' });
      if (await info.count()) { selected = true; console.log('PASS actual 3D picking:', (await info.innerText()).split('\n')[0]); break; }
    }
    if (selected) break;
  }
  assert(selected, 'Clicking the actual 3D geometry expands mapped teaching information');
  const cover = page.locator('.node-knowledge li').filter({ hasText: new RegExp(`^${coverName}`) });
  if (!((await cover.innerText()).includes('说明'))) await cover.getByRole('button').first().click();
  assert.match(await cover.innerText(), coverDescription);
  await page.mouse.move(5, 5);
  await page.screenshot({ path: `${evidence}/expanded.png` });
  await page.getByRole('button', { name: '收起爆炸', exact: true }).click();
  await page.waitForFunction(() => Number(document.querySelector('[aria-label="爆炸程度"]').value) === 0);
  await page.getByRole('button', { name: '播放爆炸', exact: true }).click();
  await page.waitForFunction(() => Number(document.querySelector('[aria-label="爆炸程度"]').value) > 0);
  await page.keyboard.press('r');
  await page.waitForTimeout(350);
  assert.equal(Number(await slider.inputValue()), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.locator('canvas').isVisible());
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: `${evidence}/mobile.png` });
  await page.goto(`${base}/#/library`);
  await page.locator(`a[href$="/node/${nodeId}"]`).first().waitFor();
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  console.log(`PASS ${base}/${nodeId}: full diagram, 9 components, ${coverName}, render/explode/collapse/reset, knowledge linkage, mobile and library`);
} finally { await browser.close(); }
