import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const id = process.argv[3] ?? 'stair-flight-flush-buried-01';
const titles = {
  'stair-flight-flush-buried-01': /齐步并埋步/,
  'stair-flight-offset-one-01': /错一步/,
  'stair-flight-flush-unburied-01': /齐步不埋步/,
  'stair-flight-offset-multiple-01': /错多步/,
};
const expectedTitle = titles[id];
assert(expectedTitle, `Unsupported stair node: ${id}`);
const modelFile = id === 'stair-flight-offset-one-01' ? `${id}-v2` : id;
const bytes = await readFile(`public/models/stairs/stair-flight-platform/${modelFile}.glb`);
const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
const teachingCount = id === 'stair-flight-offset-multiple-01' ? 3 : 5;
assert.equal(gltf.nodes.filter(node => node.mesh !== undefined).length, teachingCount + 1);
assert.equal(gltf.animations?.length ?? 0, 0);
const displayOnlyNode = gltf.nodes.find(node => node.name === '无需标注');
assert(displayOnlyNode?.mesh !== undefined);
const displayOnlyCount = gltf.meshes[displayOnlyNode.mesh].primitives.length;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  let fiberUrl;
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => { if (request.url().includes('/@react-three_fiber.js')) fiberUrl = request.url(); });
  await mkdir(`tmp/${id}`, { recursive: true });
  await page.goto(`${base}/#/node/${id}`);
  const canvas = page.locator('.node-viewport canvas');
  await canvas.waitFor();
  await page.evaluate(async url => {
    const fiber = await import(url);
    window.__stairAuditRoots = fiber._roots;
  }, fiberUrl);
  await page.waitForFunction(() => window.__stairAuditRoots.has(document.querySelector('.node-viewport canvas')));
  await page.evaluate(() => {
    window.__stairAuditState = window.__stairAuditRoots.get(document.querySelector('.node-viewport canvas')).store.getState;
  });
  await page.waitForFunction(expected => {
    let found = 0;
    window.__stairAuditState().scene.traverse(object => { if (object.isMesh && object.parent?.name === '无需标注') found++; });
    return found === expected;
  }, displayOnlyCount);
  await page.getByRole('button', { name: '暂停旋转', exact: true }).click();
  const slider = page.getByRole('slider', { name: '爆炸程度', exact: true });
  assert.equal(await slider.inputValue(), '1');
  assert(await slider.isDisabled());
  assert(await page.getByRole('button', { name: '播放爆炸', exact: true }).isDisabled());
  assert(await page.getByRole('button', { name: '收起爆炸', exact: true }).isDisabled());
  assert.equal(await page.locator('.node-knowledge li').count(), teachingCount);
  assert.equal(await page.locator('.node-knowledge li').filter({ hasText: '无需标注' }).count(), 0);
  await page.locator('.node-diagram img').evaluate(image => image.decode());

  // Inspect every rendered material primitive, including its actual raycast
  // methods and proxy children. A group-level exclusion alone is insufficient.
  const blocked = await page.evaluate(() => {
    const state = window.__stairAuditState(); const meshes = [];
    state.scene.traverse(object => {
      if (!object.isMesh || object.parent?.name !== '无需标注') return;
      object.geometry.computeBoundingSphere();
      const point = object.geometry.boundingSphere.center.clone().applyMatrix4(object.matrixWorld);
      state.raycaster.ray.origin.copy(state.camera.position);
      state.raycaster.ray.direction.copy(point).sub(state.camera.position).normalize();
      const hits = []; object.raycast(state.raycaster, hits);
      meshes.push({ name: object.name, visible: object.visible, hits: hits.length, proxies: object.children.filter(child => child.userData._isProxy).length });
    }); return meshes;
  });
  assert.equal(blocked.length, displayOnlyCount);
  assert(blocked.every(mesh => mesh.visible && mesh.hits === 0 && mesh.proxies === 0), JSON.stringify(blocked));
  const pixels = await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer();
  let dark = 0; for (let i = 0; i < pixels.length; i += 3) if (pixels[i] < 170 && pixels[i + 1] < 170 && pixels[i + 2] < 170) dark++;
  assert(dark > 500, 'Static model actually renders');
  await page.screenshot({ path: `tmp/${id}/assembled.png` });
  const box = await canvas.boundingBox(); let picked = false;
  for (const y of [.3, .45, .6, .75]) {
    for (const x of [.5, .35, .65, .2, .8]) {
      await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
      await page.waitForTimeout(70);
      if (await page.locator('.node-knowledge li').filter({ hasText: '说明' }).count()) { picked = true; break; }
    }
    if (picked) break;
  }
  assert(picked, 'Teaching components are pickable immediately, without playback');
  await page.keyboard.press('r');
  assert.equal(await slider.inputValue(), '1');
  const flight = page.locator('.node-knowledge li').filter({ hasText: /^梯段/ });
  await flight.getByRole('button').first().click();
  await flight.getByText('说明', { exact: true }).waitFor();
  assert.match(await flight.innerText(), expectedTitle);
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await canvas.isVisible());
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: `tmp/${id}/mobile.png` });
  await page.goto(`${base}/#/library`);
  await page.locator(`.ui-resource-card[href$="/node/${id}"]`).waitFor();
  assert.deepEqual(errors, []);
  console.log(`PASS ${id}: completed progress, disabled animation controls, ${teachingCount} teaching cards, all ${displayOnlyCount} display-only primitives unpickable/no proxies, actual 3D picking, R reset, diagram, mobile and library`);
  console.log(JSON.stringify(blocked));
} finally { await browser.close(); }
