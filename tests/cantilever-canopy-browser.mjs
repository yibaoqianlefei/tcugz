import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import sharp from 'sharp';

const base = (process.argv[2] ?? 'http://127.0.0.1:5173').replace(/\/$/, '');
const cases = [
  { id: 'cantilever-canopy-slab-01', source: '悬挑雨篷构造-悬挑板式', count: 5, card: '板底抹灰与檐口滴水槽' },
  { id: 'cantilever-canopy-raised-eaves-01', model: 'cantilever-canopy-raised-eaves-01-v2', source: '悬挑雨篷构造-外檐加高', count: 7, card: '出水水舌' },
];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const browser = await chromium.launch();
try {
  for (const item of cases) {
    if (process.argv[3] && process.argv[3] !== item.id) continue;
    const deployed = await readFile(`public/models/floor/cantilever-canopy/${item.model ?? item.id}.glb`);
    assert.equal(digest(deployed), digest(await readFile(`D:/大三下作业/glb构造/${item.source}.glb`)));
    assert.equal(deployed.readUInt32LE(8), deployed.length);
    const gltf = JSON.parse(deployed.subarray(20, 20 + deployed.readUInt32LE(12)).toString());
    assert.equal(gltf.nodes.filter(node => node.mesh !== undefined).length, item.count);
    assert.equal(gltf.animations.length, item.count);
    assert.equal(digest(await readFile(`public/images/floor/${item.id}-diagram.png`)), digest(await readFile(`D:/剖面图/悬挑雨篷构造/${item.source}.png`)));

    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    let timelineUrl;
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    page.on('request', request => {
      if (request.url().includes('/src/components/viewer/animationController.ts')) timelineUrl = request.url();
    });
    await mkdir(`tmp/${item.id}`, { recursive: true });
    await page.goto(`${base}/#/node/${item.id}`);
    const canvas = page.locator('.node-viewport canvas');
    await canvas.waitFor();
    assert(timelineUrl);
    await page.evaluate(async url => { window.__canopyTimeline = await import(url); }, timelineUrl);
    await page.waitForFunction(count => window.__canopyTimeline.getAnimationActions().length === count, item.count);
    await page.getByRole('button', { name: '暂停旋转', exact: true }).click();
    await page.mouse.move(5, 5);
    const slider = page.getByRole('slider', { name: '爆炸程度' });
    assert.equal(await slider.inputValue(), '0');
    assert(!(await slider.isDisabled()));
    assert.equal(await page.locator('.node-knowledge li').count(), item.count);
    assert(await page.locator('.node-diagram img').evaluate(image => image.complete && image.naturalWidth > 0));

    async function snapshot(pause = false) {
      return page.evaluate(pause => {
        const { animControls, getAnimationActions } = window.__canopyTimeline;
        if (pause) animControls.pause();
        const actions = getAnimationActions(), meshes = [];
        actions[0].getMixer().getRoot().traverse(object => {
          if (object.isMesh && !object.userData._isProxy) meshes.push({ name: object.name, position: object.position.toArray(), rotation: object.quaternion.toArray(), scale: object.scale.toArray() });
        });
        return { meshes, actions: actions.map(action => ({ time: action.time, duration: action.getClip().duration })) };
      }, pause);
    }
    const initial = await snapshot(true);
    assert.equal(initial.meshes.length, item.count);
    assert.deepEqual(initial.meshes.map(mesh => mesh.name).sort(), gltf.nodes.map(node => node.name).sort());
    const shot = await page.screenshot({ path: `tmp/${item.id}/assembled.png` });
    const bounds = await canvas.boundingBox();
    const pixels = await sharp(shot).extract({ left: Math.floor(bounds.x), top: Math.floor(bounds.y), width: Math.floor(bounds.width), height: Math.floor(bounds.height * .75) }).removeAlpha().raw().toBuffer();
    let drawn = 0;
    for (let i = 0; i < pixels.length; i += 3) if (pixels[i] < 170 && pixels[i + 1] < 170 && pixels[i + 2] < 170) drawn++;
    assert(drawn > 500, 'Actual model surfaces render');
    await page.getByRole('button', { name: '播放爆炸', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[aria-label="爆炸程度"]').value === '1');
    const expanded = await snapshot(true);
    assert.notDeepEqual(expanded.meshes, initial.meshes, 'Source animation actually moves components');
    assert(expanded.actions.every(action => action.duration === 4 && action.time === 4), 'Short clips hold on the shared four second timeline');

    const card = page.locator('.node-knowledge li').filter({ hasText: new RegExp(`^${item.card}`) });
    await card.getByRole('button').first().click();
    await card.getByText('说明', { exact: true }).waitFor();
    await page.waitForFunction(name => {
      const root = window.__canopyTimeline.getAnimationActions()[0].getMixer().getRoot();
      let highlighted = false;
      root.traverse(object => {
        if (object.isMesh && !object.userData._isProxy && object.name === name) {
          highlighted = (Array.isArray(object.material) ? object.material : [object.material]).some(material => material.emissiveIntensity > 0);
        }
      });
      return highlighted;
    }, item.card);
    await page.screenshot({ path: `tmp/${item.id}/expanded.png` });
    await page.getByRole('button', { name: '收起爆炸', exact: true }).click();
    await page.waitForFunction(() => {
      const value = Number(document.querySelector('[aria-label="爆炸程度"]').value);
      return value > .6 && value < .9;
    });
    const reversing = await snapshot(true);
    assert(reversing.actions.every(action => Math.abs(action.time - reversing.actions[0].time) < 1e-6));
    await page.getByRole('button', { name: '收起爆炸', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[aria-label="爆炸程度"]').value === '0');
    assert.deepEqual((await snapshot(true)).meshes, initial.meshes, 'Reverse restores the complete original pose');

    // Click real geometry, exercising the raycaster-to-knowledge mapping.
    await card.getByRole('button').first().click();
    let picked = false;
    for (const y of [.5, .4, .6, .3]) {
      for (const x of [.5, .4, .6, .3, .7]) {
        await page.mouse.click(bounds.x + bounds.width * x, bounds.y + bounds.height * y);
        await page.waitForTimeout(70);
        if (await page.locator('.node-knowledge li').filter({ hasText: '说明' }).count()) { picked = true; break; }
      }
      if (picked) break;
    }
    assert(picked, 'Real 3D picking opens a knowledge card');
    await slider.focus(); await page.keyboard.press('End');
    await page.waitForFunction(() => document.querySelector('[aria-label="爆炸程度"]').value === '1');
    await page.keyboard.press('r');
    await page.waitForFunction(() => document.querySelector('[aria-label="爆炸程度"]').value === '0');
    assert.deepEqual((await snapshot(true)).meshes, initial.meshes);
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await canvas.isVisible());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: `tmp/${item.id}/mobile.png` });
    await page.goto(`${base}/#/library`);
    await page.locator(`a[href$="/node/${item.id}"]`).first().waitFor();
    assert.deepEqual(errors, []);
    console.log(`PASS ${item.id}: exact source assets, ${item.count} meshes/cards, render, expand/reverse common timeline, highlight, actual picking, R reset, mobile and library`);
    await page.close();
  }
} finally { await browser.close(); }
