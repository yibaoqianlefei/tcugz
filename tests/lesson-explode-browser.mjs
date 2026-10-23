import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const base = (process.argv[2] ?? 'http://127.0.0.1:5187/').replace(/\/?$/, '/');
const output = process.env.LESSON_EXPLODE_OUTPUT ?? 'audit-output/lesson-explode-2026-10-21/browser';
await mkdir(output, { recursive: true });
const catalog = JSON.parse(await readFile('src/data/lessonMedia.json', 'utf8'));
const inventory = JSON.parse(await readFile('audit-output/lesson-explode-2026-10-21/inventory.json', 'utf8'));
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const results = [];
// Wait for the node-aligned 280ms camera easing as well as the drawn frame.
const settle = () => page.waitForTimeout(450);
const dialog = page.locator('dialog[open]');
const viewer = dialog.locator('.lesson-model-viewer');
const cards = dialog.locator('.lesson-knowledge-card');
const stage = dialog.locator('.lesson-model-stage');
const slider = dialog.getByRole('slider', { name: '爆炸程度' });
const seek = async value => {
  await slider.evaluate((input, next) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(next));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
  await viewer.locator(`:scope[data-explode-progress="${value.toFixed(3)}"]`).waitFor();
  await settle();
};
const difference = async (left, right) => {
  const a = await sharp(left).removeAlpha().raw().toBuffer();
  const b = await sharp(right).removeAlpha().raw().toBuffer();
  assert.equal(a.length, b.length);
  let changed = 0;
  for (let i = 0; i < a.length; i += 3) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 30) changed++;
  return changed / (a.length / 3);
};
async function openModel(nodeId) {
  const lesson = Object.values(catalog).find(lesson => lesson.figures.some(figure => figure.nodeId === nodeId));
  const figure = lesson.figures.find(figure => figure.nodeId === nodeId);
  await page.goto(`${base}#/lesson/${lesson.path}`);
  await page.waitForFunction(expected => {
    const frame = document.querySelector('.curriculum-frame');
    return frame?.contentDocument?.documentElement?.dataset.modelsEmbedded === 'true' && frame.contentWindow.location.pathname.endsWith(`/lesson/${expected}`);
  }, lesson.path);
  await page.frameLocator('.curriculum-frame').locator(`#${figure.id} .lesson-model-link`).click();
  await stage.locator(':scope[data-rendered="true"]').waitFor();
  await dialog.getByRole('button', { name: '暂停旋转', exact: true }).click();
  await page.waitForTimeout(1500);
  // Pixel roundtrips compare the same canonical camera, independently of the
  // automatic rotation that ran while the model was loading/presenting.
  await dialog.getByRole('button', { name: '复位视角', exact: true }).click();
  await settle();
  assert.equal(await dialog.locator('.lesson-model-shell').getAttribute('data-node-id'), nodeId);
  assert.equal(await dialog.locator('.lesson-knowledge-card *').count(), 0, 'knowledge cards contain names only');
  const left = await dialog.locator('.lesson-model-visual').boundingBox();
  const right = await dialog.locator('.lesson-knowledge-panel').boundingBox();
  assert(left.x + left.width <= right.x + 1 && Math.abs(left.y - right.y) < 2, 'model and cards are side by side');
  return { lesson: lesson.key, figureId: figure.id };
}
async function checkGatedInteraction() {
  assert.equal(await cards.locator(':scope:enabled').count(), 0, 'animated picking waits for full expansion, matching the node page');
  assert.equal(await cards.locator(':scope[aria-pressed="true"]').count(), 0, 'moving the animation clears the selected card');
  assert.equal(await dialog.locator('.is-hovered,.is-selected').count(), 0, 'closed interaction gate clears hover and selection');
  assert(await cards.evaluateAll(items => items.every(item => getComputedStyle(item).opacity === '1')), 'static names remain fully readable');
  const box = await stage.boundingBox();
  for (const x of [.25, .5, .75]) for (const y of [.25, .5, .75]) {
    await page.mouse.move(box.x + box.width * x, box.y + box.height * y);
    await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
    assert.equal(await dialog.locator('.is-hovered,.is-selected').count(), 0, 'moving geometry does not reactivate highlighting');
    assert.notEqual(await stage.evaluate(element => getComputedStyle(element).cursor), 'pointer');
  }
  const background = await cards.first().evaluate(element => getComputedStyle(element).backgroundColor);
  const cardBox = await cards.first().boundingBox();
  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  assert.equal(await cards.first().evaluate(element => getComputedStyle(element).backgroundColor), background, 'disabled cards have no CSS hover effect');
}

async function findHover(scope = dialog) {
  const box = await scope.locator('.lesson-model-stage').boundingBox();
  const steps = [.5, .45, .55, .4, .6, .35, .65, .3, .7, .25, .75, .2, .8];
  for (const y of steps) for (const x of steps) {
    const point = { x: box.x + box.width * x, y: box.y + box.height * y };
    await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(35);
    const card = scope.locator('.lesson-knowledge-card.is-hovered');
    if (await card.count()) return { ...point, id: await card.getAttribute('data-part-id') };
  }
  throw new Error('No actual model surface linked to a name card');
}

async function checkLinkedInteraction(scope = dialog) {
  const localCards = scope.locator('.lesson-knowledge-card');
  const localStage = scope.locator('.lesson-model-stage');
  const panel = scope.locator('.lesson-knowledge-panel');
  const namesBefore = await panel.textContent();
  assert(await localCards.locator(':scope:enabled').count() > 0, 'expanded/static model enables its real component cards');
  await page.mouse.move(2, 2); await settle();
  const baseline = await localStage.screenshot();
  const hit = await findHover(scope);
  const hovered = await localStage.screenshot();
  assert(await difference(baseline, hovered) > .00001, 'hover changes actual rendered material');
  await page.mouse.click(hit.x, hit.y);
  const selectedCard = scope.locator('.lesson-knowledge-card[aria-pressed="true"]');
  await selectedCard.waitFor();
  assert.equal(await selectedCard.getAttribute('data-part-id'), hit.id, 'model click selects exactly the hovered component header');
  await page.mouse.move(2, 2); await settle();
  const selected = await localStage.screenshot();
  const nodeId = await scope.locator('.lesson-model-shell').getAttribute('data-node-id');
  await scope.screenshot({ path: `${output}/${nodeId}-${scope === dialog ? 'full' : 'inline'}-selected.png` });
  assert(await difference(baseline, selected) > .00001, 'selection remains highlighted after pointer leaves');
  assert(await difference(hovered, selected) > .00001, 'node-style hover and selected highlights are distinct');
  await page.mouse.click(hit.x, hit.y); await settle();
  assert.equal(await scope.locator('.lesson-knowledge-card[aria-pressed="true"]').count(), 0, 'clicking the same surface deselects');
  const index = await localCards.evaluateAll((items, id) => items.findIndex(item => item.dataset.partId === id), hit.id);
  const card = localCards.nth(index);
  await card.click(); await page.mouse.move(2, 2); await settle();
  assert.equal(await card.getAttribute('aria-pressed'), 'true', 'card click selects its component');
  assert(await difference(baseline, await localStage.screenshot()) > .00001, 'card-to-model selection changes the rendered material');
  await card.focus(); await page.keyboard.press('Enter'); await settle();
  assert.equal(await card.getAttribute('aria-pressed'), 'false', 'keyboard toggles the name header without opening details');
  await card.click();
  const box = await localStage.boundingBox();
  await page.mouse.click(box.x + 6, box.y + 6); await page.mouse.move(2, 2); await settle();
  assert.equal(await scope.locator('.lesson-knowledge-card[aria-pressed="true"]').count(), 0, 'blank canvas deselects');
  assert.equal(await localCards.locator('*').count(), 0, 'headers contain only text, never expanded details');
  assert.equal(await panel.locator('details,p,dl').count(), 0);
  assert.equal(await panel.textContent(), namesBefore, 'interaction does not add descriptions to the cards');
  assert(await difference(baseline, await localStage.screenshot()) < .001, 'deselect restores original material colors');
  return hit;
}

try {
  for (const model of inventory.models.filter(model => model.mode === 'authored-timeline')) {
    const location = await openModel(model.nodeId);
    assert.equal(await viewer.getAttribute('data-can-explode'), 'true');
    assert(await slider.isEnabled());
    await checkGatedInteraction();
    await page.mouse.move(2, 2);
    await settle();
    const initial = await stage.screenshot({ path: `${output}/${model.nodeId}-assembled.png` });
    await seek(.5);
    await checkGatedInteraction();
    await seek(1);
    await checkLinkedInteraction();
    const expanded = await stage.screenshot({ path: `${output}/${model.nodeId}-exploded.png` });
    const poseChange = await difference(initial, expanded);
    assert(poseChange > .01, `${model.nodeId}: actual rendered geometry changes along the authored timeline`);
    const names = await cards.allTextContents();
    if (model.nodeId === 'construction-column-01') {
      assert.equal(names.length, 7, 'later concrete stages are represented');
      assert(names.some(name => /圈梁/.test(name)) && names.some(name => /楼板/.test(name)));
    }
    await seek(0);
    await page.mouse.move(2, 2);
    await settle();
    const restored = await stage.screenshot();
    const roundtrip = await difference(initial, restored);
    assert(roundtrip < .005, `${model.nodeId}: seeking back restores original geometry/camera/materials (${roundtrip})`);
    assert.equal(await cards.locator(':scope:enabled').count(), 0, 'assembled animated model waits for expansion');
    if (model.nodeId === 'construction-column-01') {
      const names = await cards.locator(':scope[data-visible="true"]').allTextContents();
      assert.equal(names.length, 3, 'zero and one-axis-zero construction stages remain disabled at assembly');
    }
    if (['window-wall-gap-sealing-01', 'coating-parapet-flashing-01', 'construction-column-01'].includes(model.nodeId)) {
      await dialog.getByRole('button', { name: '播放爆炸', exact: true }).click();
      await viewer.locator(':scope[data-can-select="true"]').waitFor({ timeout: 15000 });
      const hit = await findHover();
      await page.mouse.click(hit.x, hit.y);
      const held = await cards.locator(':scope[aria-pressed="true"]').getAttribute('data-part-id');
      await page.mouse.move(hit.x, hit.y); await page.mouse.down();
      await page.mouse.move(hit.x + 60, hit.y + 25, { steps: 6 });
      await page.mouse.move(hit.x, hit.y, { steps: 6 }); await page.mouse.up();
      assert.equal(await cards.locator(':scope[aria-pressed="true"]').getAttribute('data-part-id'), held, 'dragging out and back never toggles selection or triggers blank-click clearing');
      const beforeZoom = await stage.screenshot();
      await dialog.getByRole('button', { name: '放大模型', exact: true }).click();
      await settle();
      assert(await difference(beforeZoom, await stage.screenshot()) > .005, 'zoom stays active after explosion');
      const box = await stage.boundingBox();
      const beforeDrag = await stage.screenshot();
      await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5);
      await page.mouse.down(); await page.mouse.move(box.x + box.width * .65, box.y + box.height * .6, { steps: 12 }); await page.mouse.up();
      await settle();
      assert(await difference(beforeDrag, await stage.screenshot()) > .005, 'drag rotation stays active after explosion');
      await dialog.getByRole('button', { name: '收起爆炸', exact: true }).click();
      await viewer.locator(':scope[data-explode-progress="0.000"]').waitFor({ timeout: 15000 });
    }
    results.push({ nodeId: model.nodeId, ...location, cards: names, poseChange, roundtrip, checked: ['real-timeline-seek', 'visible-surface-hover', 'model-to-header-selection', 'header-to-model-selection', 'deselect-and-material-restore', 'name-only-no-details', 'reassembly-gate'] });
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    console.log(`Lesson explosion verified: ${model.nodeId} (${results.length}/21)`);
  }
  await openModel('bottom-landing-entrance-01');
  assert.equal(await cards.count(), 1, 'undivided source model gets one honest whole-object card');
  assert(await slider.isDisabled(), 'static source geometry does not receive a fabricated explosion');
  await checkLinkedInteraction();
  await page.keyboard.press('Escape');
  await page.goto(`${base}#/lesson/principles/acoustic.html`);
  await page.waitForFunction(() => document.querySelector('.curriculum-frame')?.contentDocument?.documentElement?.dataset.modelsEmbedded === 'true');
  await page.evaluate(() => {
    const frame = document.querySelector('.curriculum-frame');
    const slot = frame.contentDocument.querySelector('[data-lesson-model="figure-1"]');
    scrollTo(0, scrollY + frame.getBoundingClientRect().top + slot.getBoundingClientRect().top - 90);
  });
  const inline = page.frameLocator('.curriculum-frame').locator('[data-lesson-model="figure-1"]');
  await inline.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
  await inline.getByRole('button', { name: '暂停旋转', exact: true }).click();
  await inline.getByRole('slider', { name: '爆炸程度' }).focus(); await page.keyboard.press('End');
  await inline.locator('.lesson-model-viewer[data-can-select="true"]').waitFor();
  await checkLinkedInteraction(inline);
  assert.equal(results.length, 21);
  assert.deepEqual(errors, []);
  await writeFile(`${output}/explode-result.json`, JSON.stringify({ base, results, staticFallbackVerified: true, errors }, null, 2) + '\n');
  console.log('PASS: 21 real timelines with node-style hover/selection, bidirectional name-only cards, material restore, drag guards, static fallback and inline interaction.');
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  console.error('At route:', page.url());
  throw error;
} finally { await browser.close(); }
