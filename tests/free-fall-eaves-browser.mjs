import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const id = process.argv[3] ?? 'free-fall-waterproof-eaves-01';
const count = { 'free-fall-waterproof-eaves-01': 7, 'free-fall-ring-beam-eaves-01': 9 }[id];
assert(Number.isInteger(count), `Unknown free-fall eaves node: ${id}`);
const steel = '防水层双向钢筋网';
await mkdir(`tmp/${id}`, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [], urls = {};
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/src/components/viewer/animationController.ts')) urls.timeline = url;
    if (url.includes('/@react-three_fiber.js')) urls.fiber = url;
    if (/\/three\.js\?/.test(url)) urls.three = url;
  });
  await page.goto(`${base}/#/node/${id}`);
  const canvas = page.locator('.node-viewport canvas');
  await canvas.waitFor();
  assert(urls.timeline && urls.fiber && urls.three, JSON.stringify(urls));
  await page.evaluate(async urls => {
    window.__eavesTimeline = await import(urls.timeline);
    window.__eavesRoots = (await import(urls.fiber))._roots;
    window.__eavesThree = await import(urls.three);
  }, urls);
  await page.waitForFunction(count => window.__eavesTimeline.getAnimationActions().length === count && window.__eavesRoots.has(document.querySelector('.node-viewport canvas')), count);
  await page.evaluate(() => { window.__eavesState = window.__eavesRoots.get(document.querySelector('.node-viewport canvas')).store.getState; });
  await page.getByRole('button', { name: '暂停旋转', exact: true }).click();
  await page.mouse.move(5, 5);
  assert.equal(await page.locator('.node-knowledge li').count(), count);
  assert(await page.locator('.node-diagram img').evaluate(image => image.complete && image.naturalWidth > 0));
  const slider = page.getByRole('slider', { name: '爆炸程度', exact: true });
  assert.equal(await slider.inputValue(), '0');
  async function snapshot(pause = false) {
    return page.evaluate(({ pause, steel }) => {
      const { getAnimationActions, animControls } = window.__eavesTimeline;
      if (pause) animControls.pause();
      const actions = getAnimationActions(), root = actions[0].getMixer().getRoot();
      const meshes = [];
      root.updateMatrixWorld(true);
      root.traverse(object => {
        if (object.isMesh && !object.userData._isProxy) meshes.push({ name: object.name, visible: object.visible, position: object.position.toArray(), quaternion: object.quaternion.toArray(), scale: object.scale.toArray() });
      });
      const wire = root.getObjectByName(steel), box = root.getObjectByName(`${steel}_hitbox`);
      return { meshes, actions: actions.map(action => ({ time: action.time, duration: action.getClip().duration })), box: {
        parent: box.parent.name, visible: box.visible, outlines: box.children.filter(child => child.userData._isOutline).length,
        steelProxy: wire.children.filter(child => child.userData._isProxy).length,
        localPosition: box.position.toArray(), worldPosition: box.getWorldPosition(new window.__eavesThree.Vector3()).toArray(),
        opacity: box.material.opacity,
      } };
    }, { pause, steel });
  }
  const initial = await snapshot(true);
  assert.equal(initial.meshes.length, count + 1);
  assert.deepEqual(initial.box, { ...initial.box, parent: steel, visible: false, outlines: 0, steelProxy: 0, opacity: 0 });
  await page.screenshot({ path: `tmp/${id}/assembled.png` });
  await page.getByRole('button', { name: '播放爆炸', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[aria-label="爆炸程度"]').value === '1');
  const expanded = await snapshot(true);
  assert(expanded.actions.every(action => action.duration === 4 && action.time === 4));
  assert.deepEqual(expanded.box.localPosition, initial.box.localPosition);
  assert.notDeepEqual(expanded.box.worldPosition, initial.box.worldPosition);
  assert.equal(expanded.box.parent, steel);
  assert.equal(expanded.box.visible, false);
  await page.waitForTimeout(400);
  // Find a genuine gap: the box is the nearest pickable object, while a
  // raycast against the original steel geometry misses every thin bar.
  const gap = await page.evaluate(steel => {
    const T = window.__eavesThree, { scene, camera } = window.__eavesState();
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    const root = window.__eavesTimeline.getAnimationActions()[0].getMixer().getRoot();
    const wire = root.getObjectByName(steel), box = root.getObjectByName(`${steel}_hitbox`);
    const rect = document.querySelector('.node-viewport canvas').getBoundingClientRect();
    const ray = new T.Raycaster(), ndc = new T.Vector2();
    for (let y = 40; y < rect.height - 30; y += 6) {
      for (let x = 30; x < rect.width - 30; x += 6) {
        ndc.set(x / rect.width * 2 - 1, 1 - y / rect.height * 2);
        ray.setFromCamera(ndc, camera);
        const picks = ray.intersectObject(root, true);
        if (picks[0]?.object !== box) continue;
        const actual = [];
        T.Mesh.prototype.raycast.call(wire, ray, actual);
        if (!actual.length) return { x: rect.x + x, y: rect.y + y, target: picks[0].object.name, actualSteelHits: 0 };
      }
    }
    return null;
  }, steel);
  assert(gap, 'A visible gap can be picked through the invisible steel hitbox');
  await page.mouse.click(gap.x, gap.y);
  await page.mouse.move(5, 5);
  const card = page.locator('.node-knowledge li').filter({ hasText: new RegExp(`^${steel}`) });
  await card.getByText('说明', { exact: true }).waitFor();
  await page.waitForFunction(steel => {
    const root = window.__eavesTimeline.getAnimationActions()[0].getMixer().getRoot();
    return [root.getObjectByName(steel).material].flat().some(material => material.emissive.getHex() !== 0 && material.emissiveIntensity === 1.15);
  }, steel);
  assert(await page.evaluate(steel => {
    const box = window.__eavesTimeline.getAnimationActions()[0].getMixer().getRoot().getObjectByName(`${steel}_hitbox`);
    return !box.visible && box.material.opacity === 0 && box.material.emissive.getHex() === 0;
  }, steel));
  await page.screenshot({ path: `tmp/${id}/expanded-steel-selected.png` });
  await page.getByRole('button', { name: '收起爆炸', exact: true }).click();
  await page.waitForFunction(() => {
    const progress = Number(document.querySelector('[aria-label="爆炸程度"]').value);
    return progress > .6 && progress < .9;
  });
  const reversing = await snapshot(true);
  assert(reversing.actions.every(action => Math.abs(action.time - reversing.actions[0].time) < 1e-6));
  assert.equal(reversing.box.parent, steel);
  assert.deepEqual(reversing.box.localPosition, initial.box.localPosition);
  await page.getByRole('button', { name: '收起爆炸', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[aria-label="爆炸程度"]').value === '0');
  assert.deepEqual((await snapshot(true)).meshes, initial.meshes, 'All components, including the child hitbox, restore their original pose');
  await slider.focus(); await page.keyboard.press('End');
  await page.waitForFunction(() => document.querySelector('[aria-label="爆炸程度"]').value === '1');
  await page.keyboard.press('r');
  await page.waitForFunction(() => document.querySelector('[aria-label="爆炸程度"]').value === '0');
  assert.deepEqual((await snapshot(true)).meshes, initial.meshes);
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await canvas.isVisible());
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: `tmp/${id}/mobile.png` });
  await page.goto(`${base}/#/library`);
  await page.locator(`a[href$="/node/${id}"]`).first().waitFor();
  assert.deepEqual(errors, []);
  await writeFile(`tmp/${id}/inspection.json`, JSON.stringify({ initial, expanded, reversing, gap, errors }, null, 2));
  console.log(`PASS ${id}: ${count} teaching components; invisible steel-only child hitbox; actual mouse pick through a steel gap; actual steel highlight; 4s expand/reverse; reset; diagram; mobile; library; no page/resource errors`);
} finally { await browser.close(); }
