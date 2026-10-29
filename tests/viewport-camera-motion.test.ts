import assert from 'node:assert/strict';
import { compensateViewportDistance, stepViewportDistance } from '../src/utils/viewportCameraMotion';

// Reproduce the recorded viewport heights: closed → peek → details → peek →
// closed. Projection compensation must not be saved as a permanent zoom choice.
for (const fps of [30, 60, 120]) {
  for (const zoom of [.7, 1, 1.4]) {
    let distance = 8 * zoom, height = 490;
    for (let cycle = 0; cycle < 4; cycle++) {
      for (const endpoint of [377, 215, 377, 490]) {
        const fromHeight = height;
        for (let frame = 1; frame <= Math.round(.42 * fps); frame++) {
          const t = frame / Math.round(.42 * fps);
          const h = fromHeight + (endpoint - fromHeight) * (t * t * (3 - 2 * t));
          const next = compensateViewportDistance(distance, height, h);
          assert(Math.abs(h / next - height / distance) < 1e-10, 'a changing CSS height never introduces a one-frame pixel-scale jump');
          distance = next; height = h;
        }
      }
      assert(Math.abs(distance - 8 * zoom) < 1e-10, 'closing repeatedly restores the same user zoom without cumulative drift');
    }
  }
}
assert.equal(compensateViewportDistance(8, 0, 400), 8, 'hidden or unmeasured surfaces cannot produce infinity');
assert.equal(compensateViewportDistance(8, 400, 0), 8);
assert.equal(compensateViewportDistance(8, 400, NaN), 8);

for (const target of [4, 12]) {
  let distance = 8;
  for (let frame = 0; frame < 120; frame++) {
    const next = stepViewportDistance(distance, target, 1 / 60);
    assert(next >= Math.min(distance, target) && next <= Math.max(distance, target), 'no overshoot in either direction');
    if (!frame) assert(Math.abs(next - distance) < Math.abs(target - distance) * .25, 'neither shrink nor enlarge can snap to the target');
    distance = next;
  }
  assert(Math.abs(distance - target) < 1e-5);
}
const distance = stepViewportDistance(8, 12, .05);
const reversed = stepViewportDistance(distance, 4, 1 / 60);
assert(reversed < distance && reversed > 4, 'rapid reversal continues from the live view');
assert.equal(stepViewportDistance(8, 4, 0), 8);
console.log('PASS viewport camera motion: bidirectional easing, interruption, zero-size guards, projected-size continuity and 4 open/expand/collapse/close cycles at 3 frame rates × 3 zoom levels.');
