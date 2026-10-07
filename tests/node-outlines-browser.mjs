import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const ids = ['stair-flight-offset-multiple-01', 'stair-flight-flush-unburied-01', 'organized-drainage-01', 'vent-pipe-roof-01', 'roof-access-hatch-01', 'cast-ribbed-floor-01', 'water-storage-eaves-drainage-01'];
await mkdir('tmp/outline-fix', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [], results = [];
  let fiberUrl;
  page.on('request', request => { if (request.url().includes('/@react-three_fiber.js')) fiberUrl = request.url(); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  for (const id of ids) {
    await page.goto('about:blank');
    await page.goto(`${base}/#/node/${id}`);
    const canvas = page.locator('.node-viewport canvas');
    await canvas.waitFor();
    await page.evaluate(async url => { window.__outlineRoots = (await import(url))._roots; }, fiberUrl);
    await page.waitForFunction(() => window.__outlineRoots.has(document.querySelector('.node-viewport canvas')));
    await page.evaluate(() => { window.__outlineState = window.__outlineRoots.get(document.querySelector('.node-viewport canvas')).store.getState; });
    await page.waitForFunction(() => {
      let count = 0; window.__outlineState().scene.traverse(object => { if (object.userData._isOutline) count++; }); return count > 0;
    });
    await page.getByRole('button', { name: '暂停旋转', exact: true }).click();
    const slider = page.getByRole('slider', { name: '爆炸程度', exact: true });
    if (await slider.isEnabled()) { await slider.focus(); await page.keyboard.press('Home'); }
    await page.mouse.move(20, 20);
    const inspect = () => page.evaluate(() => {
      const lines = [], meshes = [];
      window.__outlineState().scene.traverse(object => {
        if (object.userData._isOutline) {
          const p = object.geometry.attributes.position; const keys = new Set(); let duplicates = 0;
          for (let i = 0; i < p.count; i += 2) {
            const key = [i, i + 1].map(j => [p.getX(j), p.getY(j), p.getZ(j)].map(v => Math.round(v * 1e4)).join(',')).sort().join('|');
            if (keys.has(key)) duplicates++; keys.add(key);
          }
          lines.push({ owner: object.parent.name, vertices: p.count, duplicates, transparent: object.material.transparent, depthWrite: object.material.depthWrite, depthTest: object.material.depthTest, renderOrder: object.renderOrder, stats: object.geometry.userData.outlineStats });
        }
        if (object.isMesh && object.visible && !object.userData._isProxy) meshes.push({
          name: object.name, vertices: object.geometry.attributes.position.count,
          outlineChildren: object.children.filter(child => child.userData._isOutline).length,
          materials: [object.material].flat().map(material => ({ transparent: material.transparent, polygonOffset: material.polygonOffset })),
        });
      }); return { lines, meshes };
    });
    const assembled = await inspect();
    assert(assembled.lines.every(line => !line.transparent && !line.depthWrite && line.depthTest && line.renderOrder === 1 && line.duplicates === 0), `${id}: stable, unique outlines: ${JSON.stringify(assembled.lines)}`);
    assert(assembled.meshes.every(mesh => mesh.materials.every(material => material.transparent || material.polygonOffset)), `${id}: owned opaque surfaces separated from outline depth`);
    if (id === 'stair-flight-offset-multiple-01') assert.equal(assembled.lines.find(line => line.owner === '梯段').vertices / 2, 552, 'Actual four false diagonals removed');
    if (id === 'stair-flight-flush-unburied-01') {
      for (const name of ['下平台板', '上平台板']) assert.equal(assembled.lines.find(line => line.owner === name).vertices / 2, 252, 'Hole-crossing seams removed; all 240 rim segments and 12 box edges remain');
    }
    if (id === 'vent-pipe-roof-01') {
      const wire = assembled.meshes.find(mesh => mesh.name === '球形镀锌钢丝罩');
      assert(wire?.vertices > 1000, 'Detailed steel mesh still renders');
      assert.equal(wire.outlineChildren, 0, 'Only additional wire outlines omitted');
      await slider.focus(); await page.keyboard.press('End');
      await page.waitForFunction(() => Number(document.querySelector('[aria-label="爆炸程度"]').value) === 1);
      const card = page.locator('.node-knowledge li').filter({ hasText: '球形镀锌钢丝罩' });
      await card.getByRole('button').first().click();
      await card.getByText('说明', { exact: true }).waitFor();
      await page.waitForFunction(() => {
        let found = false; window.__outlineState().scene.traverse(object => {
          if (object.isMesh && !object.userData._isProxy && object.name === '球形镀锌钢丝罩') found = [object.material].flat().some(material => material.emissiveIntensity > 0);
        }); return found;
      });
      await card.getByRole('button').first().click();
      await slider.focus(); await page.keyboard.press('Home');
    }
    await page.screenshot({ path: `tmp/outline-fix/${id}-assembled.png` });
    if (await slider.isEnabled()) {
      await slider.focus(); await page.keyboard.press('End');
      const expanded = await inspect();
      assert.deepEqual(expanded.lines.map(line => [line.owner, line.vertices]), assembled.lines.map(line => [line.owner, line.vertices]), 'Outline buffers remain attached through animation');
      await page.screenshot({ path: `tmp/outline-fix/${id}-expanded.png` });
      await page.keyboard.press('Home');
    }
    const summary = { id, segments: assembled.lines.reduce((sum, line) => sum + line.vertices / 2, 0), objects: assembled.lines.length };
    results.push({ ...summary, ...assembled }); console.log(`PASS ${JSON.stringify(summary)}`);
  }
  assert.deepEqual(errors, []);
  await writeFile('tmp/outline-fix/inspection.json', JSON.stringify(results, null, 2));
  console.log('PASS render states, deduplication, actual stair correction, steel geometry/highlight, animation attachment and resource loading');
} finally { await browser.close(); }
