import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// Read the real, private R3F roots through Vite's existing module URL. No
// product-only debug API or camera-writing hook is installed by this test.
const base = (process.argv[2] ?? 'http://127.0.0.1:5187/').replace(/\/?$/, '/');
const output = process.env.LESSON_CAMERA_OUTPUT ?? 'audit-output/lesson-camera-2026-10-21/browser';
const nodeId = 'straight-rainwater-outlet-cast-iron-01';
await mkdir(output, { recursive: true });
const catalog = JSON.parse(await readFile('src/data/lessonMedia.json', 'utf8'));
const lesson = Object.values(catalog).find(item => item.figures.some(figure => figure.nodeId === nodeId));
const figure = lesson.figures.find(item => item.nodeId === nodeId);
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const result = { nodeId, lesson: lesson.path, cases: [], errors: [], failures: [] };
const check = (condition, message) => { if (!condition) result.failures.push(message); };
const distance = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]));
const angle = (a, b) => Math.acos(Math.min(1, Math.max(-1, a.reduce((sum, value, index) => sum + value * b[index], 0))));

try {
  for (const mode of ['inline', 'fullscreen']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.on('pageerror', error => result.errors.push(`${mode}: ${error.message}`));
    let fiberUrl;
    page.on('request', request => { if (request.url().includes('/@react-three_fiber.js')) fiberUrl = request.url(); });
    await page.goto(`${base}#/lesson/${lesson.path}`);
    await page.waitForFunction(expected => document.querySelector('.curriculum-frame')?.contentDocument?.documentElement?.dataset.modelsEmbedded === 'true' && document.querySelector('.curriculum-frame').contentWindow.location.pathname.endsWith(`/lesson/${expected}`), lesson.path);
    const frame = page.frameLocator('.curriculum-frame');
    await frame.locator(`#${figure.id}`).scrollIntoViewIfNeeded();
    let scope = frame.locator(`#${figure.id} .lesson-model-shell`);
    if (mode === 'fullscreen') {
      await frame.locator(`#${figure.id} .lesson-model-link`).click();
      scope = page.locator('dialog[open] .lesson-model-shell');
    }
    await scope.locator('.lesson-model-stage[data-rendered="true"]').waitFor();
    await scope.getByRole('button', { name: '暂停旋转', exact: true }).click();
    await page.waitForTimeout(500);
    assert(fiberUrl, 'Vite served the existing Fiber module');
    await page.evaluate(async url => { window.__lessonCameraRoots = (await import(url))._roots; }, fiberUrl);
    const canvas = scope.locator('canvas');
    const handle = await canvas.elementHandle();
    await page.evaluate(canvas => {
      const root = window.__lessonCameraRoots.get(canvas);
      if (!root) throw new Error('The inspected canvas is not registered in Fiber roots');
      window.__lessonCameraState = root.store.getState;
      window.__lessonCameraSnapshot = () => {
        const { camera, controls } = window.__lessonCameraState();
        const target = controls.target.toArray();
        const position = camera.position.toArray();
        const offset = position.map((value, index) => value - target[index]);
        const distance = Math.hypot(...offset);
        return { time: performance.now(), progress: Number(canvas.closest('.lesson-model-viewer').dataset.explodeProgress), position, target, distance, direction: offset.map(value => value / distance), fov: camera.fov, near: camera.near, far: camera.far };
      };
      window.__lessonCameraCollect = milliseconds => new Promise(resolve => {
        const trace = [window.__lessonCameraSnapshot()];
        const started = performance.now();
        function tick() {
          trace.push(window.__lessonCameraSnapshot());
          if (performance.now() - started >= milliseconds) resolve(trace);
          else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, handle);
    const snapshot = () => page.evaluate(() => window.__lessonCameraSnapshot());
    const slider = scope.getByRole('slider', { name: '爆炸程度', exact: true });
    const seek = async value => {
      await slider.evaluate((input, next) => {
        Object.getOwnPropertyDescriptor(input.ownerDocument.defaultView.HTMLInputElement.prototype, 'value').set.call(input, String(next));
        input.dispatchEvent(new input.ownerDocument.defaultView.Event('input', { bubbles: true }));
        input.dispatchEvent(new input.ownerDocument.defaultView.Event('change', { bubbles: true }));
      }, value);
      await scope.locator(`.lesson-model-viewer[data-explode-progress="${value.toFixed(3)}"]`).waitFor();
    };
    async function capture(action, milliseconds = 800) {
      const pending = page.evaluate(milliseconds => window.__lessonCameraCollect(milliseconds), milliseconds);
      await action();
      return pending;
    }
    function audit(trace, label, rotating = false) {
      const baselineDistance = trace[0].distance;
      const steps = trace.slice(1).map((sample, index) => ({
        dt: sample.time - trace[index].time,
        angle: angle(sample.direction, trace[index].direction),
        relativeDistance: Math.abs(sample.distance - trace[index].distance) / baselineDistance,
        relativeTarget: distance(sample.target, trace[index].target) / baselineDistance,
      }));
      const maximum = key => Math.max(0, ...steps.map(step => step[key]));
      // Camera easing takes ~280 ms. Small frame-time based allowances avoid
      // calling an ordinary delayed frame a discontinuity; a complete direct
      // radius/target swap or reset to the canonical angle remains detectable.
      const instant = steps.filter(step => step.dt < 100);
      check(instant.every(step => step.relativeDistance < .09 && step.relativeTarget < .06), `${mode}/${label}: camera distance or target jumps within one animation frame`);
      // Demand rendering can leave <0.3 degrees of normal OrbitControls
      // damping after a drag; starting animation lets that tiny tail finish.
      if (!rotating) check(angle(trace[0].direction, trace.at(-1).direction) < .005 && maximum('angle') < .002, `${mode}/${label}: an animation boundary replaced the manually chosen orbit direction`);
      else check(instant.every(step => step.angle < .003 + step.dt * .0003), `${mode}/${label}: auto rotation angle reset instead of continuing naturally`);
      const settled = trace.filter(sample => sample.time > trace.at(-1).time - 150);
      if (!rotating && settled.length > 1) check(distance(settled[0].position, settled.at(-1).position) / baselineDistance < .001, `${mode}/${label}: camera easing did not settle`);
      return { label, frames: trace.length, first: trace[0], last: trace.at(-1), maxAngle: maximum('angle'), maxRelativeDistance: maximum('relativeDistance'), maxRelativeTarget: maximum('relativeTarget'), trace };
    }
    await scope.getByRole('button', { name: '复位视角', exact: true }).click();
    await page.waitForTimeout(450);
    const initial = await snapshot();
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .7, box.y + box.height * .58, { steps: 20 });
    await page.mouse.up();
    await scope.getByRole('button', { name: '放大模型', exact: true }).click();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(650);
    const manual = await snapshot();
    check(angle(initial.direction, manual.direction) > .1, `${mode}: the real mouse drag changed the orbit angle`);
    check(manual.distance < initial.distance * .9, `${mode}: the zoom button changed the camera distance`);
    const traces = [];
    for (const value of [.001, 1, .001, 0]) traces.push(audit(await capture(() => seek(value)), `seek-${value}`));
    const restored = await snapshot();
    check(Math.abs(restored.distance / manual.distance - 1) < .005, `${mode}: expand/reassemble lost the user's relative zoom`);
    check(angle(restored.direction, manual.direction) < .005, `${mode}: expand/reassemble lost the user's orbit direction`);
    const rapid = await capture(async () => {
      await seek(.001);
      await page.waitForTimeout(60);
      await seek(0);
    }, 950);
    traces.push(audit(rapid, 'rapid-reverse-after-60ms'));
    check(Math.abs(rapid.at(-1).distance / restored.distance - 1) < .005, `${mode}: rapid reversal lost the user's relative zoom`);
    check(distance(rapid.at(-1).target, restored.target) < .001, `${mode}: rapid reversal did not return to the assembly target`);

    // A genuine OrbitControls pointer gesture must interrupt an in-progress
    // camera refit. Inspect the quiet period afterwards separately so the
    // user's deliberate orbit is not mistaken for a camera discontinuity.
    await seek(.001);
    await page.waitForTimeout(60);
    const beforeInterruption = await snapshot();
    const interactionBox = await canvas.boundingBox();
    await page.mouse.move(interactionBox.x + interactionBox.width * .48, interactionBox.y + interactionBox.height * .5);
    await page.mouse.down();
    await page.mouse.move(interactionBox.x + interactionBox.width * .63, interactionBox.y + interactionBox.height * .55, { steps: 12 });
    await page.mouse.up();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(500);
    const afterInterruption = await snapshot();
    check(angle(beforeInterruption.direction, afterInterruption.direction) > .1, `${mode}: the mid-transition real mouse gesture changed the orbit direction`);
    const interruptedTail = await capture(async () => {}, 650);
    traces.push(audit(interruptedTail, 'user-gesture-cancels-framing'));
    check(Math.abs(interruptedTail.at(-1).distance / afterInterruption.distance - 1) < .001, `${mode}: cancelled framing later overwrote the user camera distance`);
    check(distance(interruptedTail.at(-1).target, afterInterruption.target) < .001, `${mode}: cancelled framing later overwrote the user orbit target`);
    await seek(0);
    await page.waitForTimeout(450);

    // Resize after a manual orbit. Responsive fitting may pull the camera
    // back for safety but must preserve its live direction and then settle.
    const resizeBefore = await snapshot();
    const resizeTrace = await capture(() => page.setViewportSize({ width: 1180, height: 860 }), 1050);
    traces.push(audit(resizeTrace, 'manual-orbit-responsive-resize'));
    check(angle(resizeBefore.direction, resizeTrace.at(-1).direction) < .005, `${mode}: responsive refit lost the manually chosen direction`);
    check(resizeTrace.at(-1).distance + .001 >= resizeBefore.distance, `${mode}: safe responsive refit unexpectedly pushed the camera closer`);
    check(resizeTrace.some(sample => sample.time > resizeTrace[0].time + 100 && Math.abs(sample.distance - resizeBefore.distance) > .001), `${mode}: responsive camera fitting actually ran after the size settled`);
    const resizedTail = await capture(async () => {}, 400);
    traces.push(audit(resizedTail, 'responsive-refit-settled'));
    const play = await capture(async () => {
      await scope.getByRole('button', { name: '播放爆炸', exact: true }).click();
    }, 5500);
    check(play.at(-1).progress === 1, `${mode}: actual forward playback reached its endpoint`);
    traces.push(audit(play, 'play-forward'));
    const reverse = await capture(async () => {
      await scope.getByRole('button', { name: '收起爆炸', exact: true }).click();
    }, 5500);
    check(reverse.at(-1).progress === 0, `${mode}: actual reverse playback reached its endpoint`);
    traces.push(audit(reverse, 'play-reverse'));
    await scope.getByRole('button', { name: '开启旋转', exact: true }).click();
    await page.waitForTimeout(500);
    const rotating = await capture(() => seek(.001), 900);
    check(angle(rotating[0].direction, rotating.at(-1).direction) > .005, `${mode}: auto rotation continues across the animation boundary`);
    traces.push(audit(rotating, 'auto-rotate-expand', true));
    const rotateBack = await capture(() => seek(0), 900);
    traces.push(audit(rotateBack, 'auto-rotate-collapse', true));
    await scope.getByRole('button', { name: '暂停旋转', exact: true }).click();
    await page.waitForTimeout(650);
    const paused = await page.evaluate(() => window.__lessonCameraCollect(400));
    check(angle(paused[0].direction, paused.at(-1).direction) < .001, `${mode}: pause stops automatic camera motion`);
    await scope.screenshot({ path: `${output}/${mode}.png` });
    result.cases.push({ mode, initial, manual, restored, traces });
    await writeFile(`${output}/camera-result.json`, JSON.stringify(result, null, 2));
    await page.close();
  }
  check(!result.errors.length, `Browser errors: ${result.errors.join('; ')}`);
  await writeFile(`${output}/camera-result.json`, JSON.stringify(result, null, 2));
  assert.deepEqual(result.failures, [], result.failures.join('\n'));
  console.log('PASS lesson camera: cast-iron inline/fullscreen, actual rAF seek/play/reverse continuity, manual orbit and relative zoom, auto rotation and pause');
} finally { await browser.close(); }
