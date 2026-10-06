import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Uses Vite's development module to inspect the actual renderer, not a mock.
const base = (process.argv[2] ?? 'http://127.0.0.1:5173').replace(/\/$/, '');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5 });
  const errors = [];
  let fiberUrl;
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (request.url().includes('/@react-three_fiber.js')) fiberUrl = request.url();
  });
  await page.goto(`${base}/#/`);
  const canvas = page.locator('#node-model-root canvas');
  await canvas.scrollIntoViewIfNeeded();
  await page.locator('.node-model-stage[data-model-ready="true"]').waitFor();
  assert(fiberUrl, 'Run this renderer audit against the Vite development server');
  await page.evaluate(async url => {
    const fiber = await import(url);
    window.__homepageAuditState = fiber._roots.get(document.querySelector('#node-model-root canvas')).store.getState;
  }, fiberUrl);
  const inspect = () => page.evaluate(() => {
    const state = window.__homepageAuditState();
    const outlines = [], surfaces = [];
    state.scene.traverse(object => {
      if (object.isLineSegments) outlines.push({ transparent: object.material.transparent, depthWrite: object.material.depthWrite, vertices: object.geometry.attributes.position.count });
      if (object.isMesh && object.visible) for (const material of [object.material].flat()) surfaces.push({ transparent: material.transparent, polygonOffset: material.polygonOffset });
    });
    return { outlines, surfaces, memory: { ...state.gl.info.memory }, dpr: state.viewport.dpr, clipRatio: state.camera.far / state.camera.near, frameloop: state.frameloop };
  });
  const next = async () => {
    const index = await page.locator('.node-model-index-current').innerText();
    await page.getByRole('button', { name: '下一个模型', exact: true }).click();
    await page.waitForFunction(previous => document.querySelector('.node-model-index-current').textContent !== previous, index);
    await page.locator('.node-model-stage[data-model-ready="true"]').waitFor();
    await page.waitForTimeout(100);
  };
  for (let i = 0; i < 5; i++) {
    const state = await inspect();
    assert.equal(state.outlines.length, 1, 'All visible authored outlines share one draw object');
    assert(state.outlines[0].vertices > 0);
    assert(!state.outlines[0].transparent && !state.outlines[0].depthWrite, 'Outlines neither join the transparency sort nor overwrite surface depth');
    assert(state.surfaces.every(surface => surface.transparent || surface.polygonOffset), 'Opaque surfaces are separated from their coplanar outlines');
    assert(state.dpr <= 1.25, 'High DPI pixel workload is capped without resizing each rotation frame');
    assert(state.clipRatio < 20, 'Depth precision covers the fitted model and allowed zoom range');
    await next();
  }
  const warm = await inspect();
  for (let i = 0; i < 10; i++) await next();
  const repeated = await inspect();
  assert(repeated.memory.geometries <= warm.memory.geometries + 1, 'Repeated model switches release owned outline buffers');
  assert(repeated.memory.textures <= warm.memory.textures + 1, 'Repeated switches reuse source textures');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(() => window.__homepageAuditState().frameloop === 'demand');
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(() => window.__homepageAuditState().frameloop === 'always');
  assert(await canvas.evaluate(element => !element.getContext('webgl2').isContextLost()));
  assert.deepEqual(errors, []);
  console.log('PASS all five models: batched non-writing outlines, stable depth, bounded DPR, released switch resources, hidden-page pause and retained WebGL context');
} finally {
  await browser.close();
}
