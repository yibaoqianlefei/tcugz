import assert from 'node:assert/strict';
import { AnimationClip, AnimationMixer, Group, LoopOnce, NumberKeyframeTrack, Object3D } from 'three';
import { animControls, createModelTimelineClips, registerAnimationActions } from '../src/components/viewer/animationController';
import { useNodeStore } from '../src/store/nodeStore';

// Real Three.js sampling: a short movement, delayed movement, long movement
// and fixed base. Six seconds also catches the former four-second scrubber.
const root = new Group();
for (const name of ['short', 'delayed', 'long', 'fixed']) {
  const object = new Object3D(); object.name = name; root.add(object);
}
const sources = [
  new AnimationClip('short', 1, [new NumberKeyframeTrack('short.position[x]', [0, 1], [0, 10])]),
  new AnimationClip('delayed', 3, [new NumberKeyframeTrack('delayed.position[x]', [2, 3], [0, 20])]),
  new AnimationClip('long', 6, [new NumberKeyframeTrack('long.position[x]', [0, 6], [0, 30])]),
  new AnimationClip('fixed', .04, [new NumberKeyframeTrack('fixed.position[x]', [.04], [7])]),
];
const clips = createModelTimelineClips(sources);
assert.deepEqual(sources.map(clip => clip.duration), [1, 3, 6, .04]);
clips.forEach((clip, i) => {
  assert.equal(clip.duration, 6);
  assert.notEqual(clip, sources[i]);
  assert.notEqual(clip.tracks[0], sources[i].tracks[0]);
  assert.deepEqual(clip.tracks[0].times, sources[i].tracks[0].times);
  assert.deepEqual(clip.tracks[0].values, sources[i].tracks[0].values);
});
const mixer = new AnimationMixer(root);
const actions = clips.map(clip => {
  const action = mixer.clipAction(clip);
  action.setLoop(LoopOnce, 1); action.clampWhenFinished = true;
  action.play(); action.paused = true; return action;
});
const unregister = registerAnimationActions(actions);
const pose = () => root.children.map(child => child.position.x);
const close = (a: readonly number[], b: readonly number[]) => {
  a.forEach((value, i) => assert(Math.abs(value - b[i]) < 1e-6, `${value} differs from ${b[i]} at ${i}`));
};
try {
  animControls.rewindToStart();
  animControls.play();
  const forward = [pose()];
  for (let i = 0; i < 24; i++) { mixer.update(.25); forward.push(pose()); }
  close(forward[2], [5, 0, 2.5, 7]); // short clip keeps its original speed
  close(forward[20], [10, 20, 25, 7]); // hold finished tracks, not stretch them
  close(pose(), [10, 20, 30, 7]);
  assert(actions.every(action => action.paused && action.time === 6));
  animControls.playReverse();
  for (let i = 23; i >= 0; i--) {
    mixer.update(.25);
    close(pose(), forward[i]); // same master time => identical pose both ways
    assert(actions.every(action => Math.abs(action.time - i * .25) < 1e-6));
  }
  assert(actions.every(action => action.time === 0));
  animControls.pause(); // viewer's boundary guard holds the exact-zero frame
  assert(actions.every(action => action.paused));

  animControls.setProgress(.75);
  assert(actions.every(action => action.time === 4.5 && action.paused));
  close(pose(), [10, 20, 22.5, 7]);
  animControls.playReverse(); mixer.update(.5);
  const beforeSwitch = pose();
  animControls.play(); close(pose(), beforeSwitch); mixer.update(.5);
  close(pose(), [10, 20, 22.5, 7]);
  animControls.pause(); mixer.update(.5);
  close(pose(), [10, 20, 22.5, 7]);
  animControls.rewindToStart(); mixer.update(.5);
  close(pose(), [0, 0, 0, 7]);
  assert.equal(useNodeStore.getState().isPlaying, false);
  animControls.setProgress(2); assert(actions.every(action => action.time === 6));
  animControls.setProgress(-1); assert(actions.every(action => action.time === 0));

  // Late cleanup from a previous viewer must not unregister a new viewer.
  const unregisterNext = registerAnimationActions(actions);
  unregister(); animControls.setProgress(.5);
  assert(actions.every(action => action.time === 3));
  unregisterNext();
  assert.deepEqual(createModelTimelineClips([]), []);
  console.log('PASS shared timeline: real mixer forward/reverse pose equivalence, short/delayed/fixed tracks, source isolation, six-second scrubber, mid-play switches, pause/reset and stale cleanup');
} finally {
  unregister(); mixer.stopAllAction(); mixer.uncacheRoot(root);
}
