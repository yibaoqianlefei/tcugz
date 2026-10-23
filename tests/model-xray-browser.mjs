import assert from 'node:assert/strict';
import { mkdir, writeFile, mkdtemp, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

// Inspect the actual Fiber scene served by Vite, without a product debug API.
const base = (process.argv[2] ?? 'http://127.0.0.1:5187/').replace(/\/?$/, '/');
const destination = process.env.MODEL_XRAY_OUTPUT ?? 'audit-output/model-xray-2026-10-21/browser';
// Vite/Tailwind watches repository outputs too. Stage screenshots/results
// outside that graph so evidence writes cannot hot-reload the page mid-test.
const output = await mkdtemp(join(tmpdir(), 'tcugz-xray-'));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const result = { base, cases: [], layouts: [], errors: [] };
page.on('pageerror', error => result.errors.push(error.message));
let fiberUrl;
let animationUrl;
let storeUrl;
page.on('request', request => { if (request.url().includes('/@react-three_fiber.js')) fiberUrl = request.url(); if (request.url().includes('/animationController.ts')) animationUrl = request.url(); if (request.url().includes('/store/nodeStore.ts')) storeUrl = request.url(); });
const settle = () => page.waitForTimeout(1500);

async function readyNode(id) {
  await page.goto(`${base}#/node/${id}`);
  const scope = page.locator('.node-viewport');
  await scope.getByRole('button', { name: '开启透视', exact: true }).waitFor();
  await scope.getByRole('button', { name: '暂停旋转', exact: true }).click();
  await settle();
  await attach(scope);
  await page.waitForFunction(() => window.__xraySnapshot().materials.filter(m => !m.proxy && m.mesh && m.name).length > 3);
  if (id === 'wall-damp-proof-course') await page.getByRole('button', { name: '方案 A: 密实材料垫层', exact: true }).click();
  return scope;
}
async function readyLesson() {
  await page.goto(`${base}#/lesson/principles/acoustic.html`);
  await page.waitForFunction(() => {
    const frame = document.querySelector('.curriculum-frame');
    return frame?.contentDocument?.documentElement?.dataset.modelsEmbedded === 'true' && frame.contentWindow.location.pathname.endsWith('/lesson/principles/acoustic.html');
  });
  const frame = page.frameLocator('.curriculum-frame');
  const scope = frame.locator('[data-lesson-model="figure-1"]');
  await scope.scrollIntoViewIfNeeded();
  await scope.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
  await scope.getByRole('button', { name: '暂停旋转', exact: true }).click();
  await settle();
  await attach(scope);
  return { frame, scope };
}
async function attach(scope) {
  assert(fiberUrl, 'Vite exposes the existing Fiber module');
  await page.evaluate(async url => { window.__xrayRoots = (await import(url))._roots; }, fiberUrl);
  await page.evaluate(canvas => {
    const root = window.__xrayRoots.get(canvas);
    if (!root) throw new Error('Canvas missing from private Fiber roots');
    window.__xraySnapshot = () => {
      const { scene, camera, controls } = root.store.getState();
      const materials = [];
      scene.traverse(object => {
        if (!object.isMesh && !object.isLineSegments) return;
        let proxy = false;
        for (let current = object; current; current = current.parent) if (current.userData._isProxy || /hitbox/i.test(current.name) || current.name.startsWith('__dev_')) proxy = true;
        for (const material of [object.material].flat()) materials.push({
          id: `${object.uuid}/${material.uuid}`, name: object.name, mesh: Boolean(object.isMesh), line: Boolean(object.isLineSegments), proxy,
          opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite, depthTest: material.depthTest,
          forceSinglePass: material.forceSinglePass, color: material.color?.toArray(), emissive: material.emissive?.toArray(), emissiveIntensity: material.emissiveIntensity,
          map: material.map?.uuid ?? null, visible: object.visible, renderOrder: object.renderOrder, castShadow: object.castShadow,
        });
      });
      return { position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), target: controls?.target.toArray(), fov: camera.fov,
        progress: canvas.closest('.lesson-model-viewer')?.dataset.explodeProgress ?? document.querySelector('.node-explode-slider')?.value, materials };
    };
  }, await scope.locator('canvas').elementHandle());
}
const snapshot = () => page.evaluate(() => window.__xraySnapshot());
const toggle = (scope, enabled) => scope.getByRole('button', { name: enabled ? '开启透视' : '关闭透视', exact: true });
async function setXray(scope, enabled, keyboard = false) {
  const button = toggle(scope, enabled);
  assert(await button.isEnabled(), 'X-ray is available independently of explosion progress');
  if (keyboard) { await button.focus(); await page.keyboard.press('Enter'); }
  else await button.click();
  await page.mouse.move(2, 2);
  const next = toggle(scope, !enabled);
  await next.waitFor();
  assert.equal(await next.getAttribute('aria-pressed'), String(enabled));
  await settle();
}
async function seek(scope, value) {
  const slider = scope.getByRole('slider', { name: '爆炸程度', exact: true });
  if (page.url().includes('#/node/')) {
    // Use the same registered production controller as other timeline tests:
    // choose an exact pose, then test the real UI X-ray toggle independently.
    await page.evaluate(async ({ animationUrl, storeUrl, value }) => {
      const timeline = await import(animationUrl);
      if (timeline.getAnimationActions().length) { timeline.animControls.pause(); timeline.animControls.setProgress(value); }
      else (await import(storeUrl)).useNodeStore.getState().setExplodeProgress(value);
    }, { animationUrl, storeUrl, value });
  } else {
  await slider.focus();
  if (value === .5) { const box = await slider.boundingBox(); await slider.click({ position: { x: box.width / 2, y: box.height / 2 } }); }
  else await slider.press(value === 1 ? 'End' : 'Home');
  }
  await settle();
  assert(Math.abs(Number(await slider.inputValue()) - value) < .001, `${page.url()}: slider expected ${value}, received ${await slider.inputValue()}`);
}
async function pixelDifference(a, b) {
  const left = await sharp(a).removeAlpha().raw().toBuffer();
  const right = await sharp(b).removeAlpha().raw().toBuffer();
  assert.equal(left.length, right.length);
  let changed = 0;
  for (let index = 0; index < left.length; index += 3) if (Math.abs(left[index] - right[index]) + Math.abs(left[index + 1] - right[index + 1]) + Math.abs(left[index + 2] - right[index + 2]) > 30) changed++;
  return changed / (left.length / 3);
}
function sameCamera(a, b, label) {
  // OrbitControls can finish a floating point damping tail after pausing.
  assert(Math.hypot(...b.position.map((value, index) => value - a.position[index])) < 1e-6, `${label}: X-ray must not change the orbit camera`);
  if (a.target) assert(Math.hypot(...b.target.map((value, index) => value - a.target[index])) < 1e-6, `${label}: X-ray must not change the orbit target`);
  assert(Math.hypot(...b.quaternion.map((value, index) => value - a.quaternion[index])) < 1e-6, `${label}: X-ray must not change the viewing direction`);
  assert.equal(b.fov, a.fov);
  assert.equal(b.progress, a.progress, `${label}: X-ray must not seek or restart the explosion`);
}
async function auditCycle(scope, label, progress, selected = false) {
  await page.mouse.move(2, 2); await settle();
  const before = await snapshot();
  const baseline = await scope.locator('canvas').screenshot();
  await setXray(scope, true, progress === .5);
  const active = await snapshot();
  sameCamera(before, active, label);
  const originals = new Map(before.materials.map(material => [material.id, material]));
  const affected = active.materials.filter(material => material.opacity !== originals.get(material.id)?.opacity);
  assert(affected.filter(material => material.mesh && !material.proxy).length > 0, `${label}: actual model materials become translucent`);
  for (const material of active.materials) {
    const original = originals.get(material.id);
    assert(original, `${label}: toggling does not recreate geometry or materials`);
    assert.deepEqual(material.color, original.color, `${label}: authored/selected color preserved`);
    assert.deepEqual(material.emissive, original.emissive, `${label}: highlight color preserved`);
    assert.equal(material.emissiveIntensity, original.emissiveIntensity);
    assert.equal(material.map, original.map, `${label}: authored texture retained`);
    assert.equal(material.visible, original.visible, `${label}: hidden stages/proxies stay hidden`);
    if (material.proxy) assert.deepEqual(material, original, `${label}: hitbox/proxy untouched`);
  }
  assert(affected.filter(material => material.mesh).every(material => material.transparent && !material.depthWrite && material.opacity <= (selected ? .8 : .18) + 1e-8), `${label}: surface alpha and depth writes implement X-ray`);
  const outlines = affected.filter(material => material.line);
  assert(outlines.length > 0 && outlines.every(material => !material.depthTest && !material.depthWrite && material.opacity <= .24 && material.renderOrder === 2), `${label}: existing outlines reveal internal structure`);
  if (selected) assert(affected.some(material => material.mesh && material.opacity >= .49), `${label}: selected component remains more legible than surrounding X-ray surfaces`);
  const activePixels = await scope.locator('canvas').screenshot({ path: `${output}/${label}-${progress}-on.png` });
  const changed = await pixelDifference(baseline, activePixels);
  assert(changed > .001, `${label}: actual rendered pixels show X-ray (${changed})`);
  await setXray(scope, false);
  const restored = await snapshot();
  sameCamera(before, restored, label);
  assert.deepEqual(restored.materials, before.materials, `${label}: disabling restores every original alpha/depth/shadow/color/texture property`);
  const roundtrip = await pixelDifference(baseline, await scope.locator('canvas').screenshot());
  assert(roundtrip < .002, `${label}: original rendering restored (${roundtrip})`);
  const record = { label, progress, selected, affectedSurfaces: affected.filter(material => material.mesh).length, outlines: outlines.length, changed, roundtrip, before, active, restored };
  result.cases.push(record);
  await writeFile(`${output}/xray-result.json`, JSON.stringify(result, null, 2));
  console.log(`PASS ${label}: p=${progress}, surfaces=${record.affectedSurfaces}, outlines=${record.outlines}, pixel roundtrip=${roundtrip}`);
}
async function auditLayout(scope, label, width) {
  const controls = scope.locator('.node-control-button:visible');
  const boxes = await controls.evaluateAll(elements => elements.map(element => { const rect = element.getBoundingClientRect(); return { label: element.getAttribute('aria-label') ?? element.title, x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom }; }));
  const docWidth = await scope.locator('canvas').evaluate(element => element.ownerDocument.documentElement.clientWidth);
  assert(boxes.some(box => /透视/.test(box.label)), `${label}: X-ray control is present`);
  const minimum = width <= 760 ? 43 : 35;
  assert(boxes.every(box => box.width >= minimum && box.height >= minimum && box.x >= -1 && box.right <= docWidth + 1), `${label}: buttons have reachable non-clipped targets`);
  for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
    const overlapX = Math.min(boxes[a].right, boxes[b].right) - Math.max(boxes[a].x, boxes[b].x);
    const overlapY = Math.min(boxes[a].bottom, boxes[b].bottom) - Math.max(boxes[a].y, boxes[b].y);
    assert(overlapX < 1 || overlapY < 1, `${label}: ${boxes[a].label} overlaps ${boxes[b].label}`);
  }
  await scope.getByRole('button', { name: '开启透视', exact: true }).scrollIntoViewIfNeeded();
  await setXray(scope, true, true);
  await scope.screenshot({ path: `${output}/${label}-${width}.png` });
  await setXray(scope, false);
  result.layouts.push({ label, width, docWidth, boxes });
}

try {
  for (const id of ['window-wall-gap-sealing-01', 'wall-damp-proof-course']) {
    const scope = await readyNode(id);
    for (const progress of [0, .5, 1]) { await seek(scope, progress); await auditCycle(scope, id, progress); }
    if (id === 'wall-damp-proof-course') await page.getByRole('button', { name: /^查看知识：/ }).first().click();
    else await page.locator('.node-knowledge .model-knowledge-header').first().click();
    await page.mouse.move(2, 2); await settle();
    await auditCycle(scope, `${id}-selected`, 1, true);
    await page.keyboard.press('Escape');
  }
  let { frame, scope } = await readyLesson();
  for (const progress of [0, .5, 1]) { await seek(scope, progress); await auditCycle(scope, 'lesson-inline', progress); }
  const card = scope.locator('.lesson-knowledge-card:enabled').first();
  await card.click(); await page.mouse.move(2, 2); await settle();
  await auditCycle(scope, 'lesson-inline-selected', 1, true);
  assert.equal(await scope.locator('.lesson-knowledge-card *').count(), 0, 'X-ray keeps name-only cards');
  await card.click(); await page.mouse.move(2, 2);
  await setXray(scope, true);
  await frame.locator('.lesson-model-link').first().click();
  const dialog = page.locator('dialog[open]');
  await dialog.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
  assert(await dialog.getByRole('button', { name: '开启透视', exact: true }).isVisible(), 'fullscreen has private X-ray state');
  await dialog.getByRole('button', { name: '暂停旋转', exact: true }).click();
  await settle(); await attach(dialog);
  for (const progress of [0, .5, 1]) { await seek(dialog, progress); await auditCycle(dialog, 'lesson-fullscreen', progress); }
  await dialog.locator('.lesson-knowledge-card:enabled').first().click(); await page.mouse.move(2, 2); await settle();
  await auditCycle(dialog, 'lesson-fullscreen-selected', 1, true);
  assert.equal(await dialog.locator('.lesson-knowledge-card *').count(), 0);
  await page.keyboard.press('Escape');
  await scope.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
  assert.equal(await scope.getByRole('button', { name: '开启透视', exact: true }).getAttribute('aria-pressed'), 'false', 'closing fullscreen remounts an independent inline session at its default');

  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 960 });
    const node = await readyNode('window-wall-gap-sealing-01');
    await auditLayout(node, 'node-layout', width);
    ({ frame, scope } = await readyLesson());
    await auditLayout(scope, 'lesson-inline-layout', width);
    await frame.locator('.lesson-model-link').first().click();
    await dialog.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
    await auditLayout(dialog, 'lesson-fullscreen-layout', width);
    await page.keyboard.press('Escape');
  }
  assert.deepEqual(result.errors, [], 'No browser runtime errors');
  await writeFile(`${output}/xray-result.json`, JSON.stringify(result, null, 2));
  console.log('PASS X-ray: real node single/multiple and lesson inline/fullscreen scenes at 0/.5/1, exact authored material/camera/pose restoration, selected highlights, isolated sessions, keyboard and 1440/390/320 layouts.');
} catch (error) {
  result.failure = { message: error.message, stack: error.stack, url: page.url() };
  await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  await writeFile(`${output}/xray-result.json`, JSON.stringify(result, null, 2));
  throw error;
} finally { await browser.close(); await mkdir(destination, { recursive: true }); await cp(output, destination, { recursive: true }); }
