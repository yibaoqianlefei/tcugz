import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Vite development modules expose the real active actions to this regression
// check; no viewer debug API or alternate runtime is added to the application.
const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
async function readTimeline(command) {
  return page.evaluate(async command => {
    const { animControls, getAnimationActions } = await import('/src/components/viewer/animationController.ts');
    if (command === 'pause') animControls.pause();
    const actions = getAnimationActions();
    const pose = [];
    actions[0].getMixer().getRoot().traverse(object => {
      if (object.isMesh && !object.userData._isProxy) pose.push({ name: object.name, position: object.position.toArray(), rotation: object.quaternion.toArray(), scale: object.scale.toArray() });
    });
    if (command === 'reverse') animControls.playReverse();
    if (command === 'forward') animControls.play();
    return { actions: actions.map(action => ({ time: action.time, duration: action.getClip().duration, paused: action.paused })), pose };
  }, command);
}
function synchronized(snapshot) {
  assert(snapshot.actions.length > 1);
  const { time, duration } = snapshot.actions[0];
  assert(snapshot.actions.every(action => Math.abs(action.time - time) < 1e-6 && action.duration === duration));
}
try {
  for (const id of ['high-low-roof-joint-01', 'construction-column-01', 'water-storage-eaves-drainage-01']) {
    // A hash-only goto retains the previous viewer while the next GLB loads.
    // Start a fresh document so readiness cannot match the old node's actions.
    await page.goto('about:blank');
    await page.goto(`${base}/#/node/${id}`);
    await page.locator('canvas:visible').waitFor();
    await page.evaluate(async () => {
      const { getAnimationActions } = await import('/src/components/viewer/animationController.ts');
      window.__timelineAuditActions = getAnimationActions;
    });
    await page.waitForFunction(() => window.__timelineAuditActions().length > 1);
    const slider = page.locator('[aria-label="爆炸程度"]');
    const expand = page.getByRole('button', { name: '播放爆炸', exact: true });
    const collapse = page.getByRole('button', { name: '收起爆炸', exact: true });
    await expand.click();
    await page.waitForFunction(() => Number(document.querySelector('[aria-label="爆炸程度"]').value) === 1);
    synchronized(await readTimeline('pause'));
    await collapse.click();
    await page.waitForFunction(() => {
      const value = Number(document.querySelector('[aria-label="爆炸程度"]').value);
      return value > .75 && value < .98;
    });
    const reverse = await readTimeline('pause');
    synchronized(reverse);
    const switching = await readTimeline('forward');
    assert.deepEqual(switching.pose, reverse.pose, 'changing direction must not jump');
    await page.waitForTimeout(120);
    synchronized(await readTimeline('pause'));
    await collapse.click();
    await page.waitForFunction(() => Number(document.querySelector('[aria-label="爆炸程度"]').value) === 0);
    assert((await readTimeline('pause')).actions.every(action => action.time === 0));

    // Native keyboard interaction exercises the actual React scrubber handler.
    await slider.focus(); await page.keyboard.press('End');
    await page.waitForFunction(() => Number(document.querySelector('[aria-label="爆炸程度"]').value) === 1);
    assert((await readTimeline('pause')).actions.every(action => action.time === action.duration));
    await page.keyboard.press('Home');
    await page.waitForFunction(() => Number(document.querySelector('[aria-label="爆炸程度"]').value) === 0);
    await expand.click();
    await page.waitForFunction(() => Number(document.querySelector('[aria-label="爆炸程度"]').value) > .1);
    await page.keyboard.press('r');
    await page.waitForFunction(() => Number(document.querySelector('[aria-label="爆炸程度"]').value) === 0);
    assert((await readTimeline('pause')).actions.every(action => action.time === 0 && action.paused));
    console.log(`PASS ${id}: common action clock, expand/reverse, no jump on direction switch, collapse, keyboard scrubber and R reset`);
  }
  for (const id of ['cast-ribbed-floor-01', 'wall-damp-proof-course']) {
    await page.goto(`${base}/#/node/${id}`);
    await page.locator('canvas:visible').waitFor();
    await page.keyboard.press('r');
    assert(await page.locator('canvas:visible').isVisible());
  }
  assert.deepEqual(errors, []);
  console.log('PASS static/multi-model pages and no page/resource errors');
} finally { await browser.close(); }
