import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AnimationClip, AnimationMixer, Group, InterpolateDiscrete, LoopOnce, Object3D, PropertyBinding, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three';
import { getNodeDefinition } from '../src/data/nodeDefinitions';
import { animControls, createModelTimelineClips, registerAnimationActions } from '../src/components/viewer/animationController';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';

const node = getNodeDefinition('window-wall-gap-sealing-01')!;
assert(node?.status === 'available' && node.category === '墙体');
assert(node.model && !node.model.noAnimation && node.diagram && node.thumbnail);
const bytes = readFileSync(publicUrlToFsPath(node.model.path));
assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
assert.equal(bytes.readUInt32LE(8), bytes.length);
const jsonLength = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
assert(!gltf.buffers.some((buffer: { uri?: string }) => buffer.uri));
assert(!(gltf.images ?? []).some((image: { uri?: string }) => image.uri));
assert.equal(gltf.nodes.length, 6);
assert.equal(node.layerConfig!.layers.length, 6);
const root = new Group();
const objects = gltf.nodes.map((part: { name: string; mesh: number; translation: number[] }) => {
  const object = new Object3D(); object.name = PropertyBinding.sanitizeNodeName(part.name);
  object.position.fromArray(part.translation); root.add(object);
  const layer = node.layerConfig!.getLayerInfo(object.name);
  assert(layer?.description && layer.material);
  gltf.meshes[part.mesh].primitives.forEach((_: unknown, i: number) => {
    assert.equal(node.layerConfig!.getLayerInfo(`${object.name}_${i + 1}`), layer,
      `material-split picking resolves ${part.name}`);
  });
  return object;
});
function samples(index: number) {
  const accessor = gltf.accessors[index], view = gltf.bufferViews[accessor.bufferView];
  assert.equal(accessor.componentType, 5126);
  const size = { SCALAR: 1, VEC3: 3, VEC4: 4 }[accessor.type as 'SCALAR' | 'VEC3' | 'VEC4'];
  return Array.from({ length: accessor.count * size }, (_, i) => bytes.readFloatLE(
    28 + jsonLength + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
    + Math.floor(i / size) * (view.byteStride ?? size * 4) + i % size * 4));
}
const sources = gltf.animations.map((animation: { name: string; channels: Array<{ sampler: number; target: { node: number; path: string } }>; samplers: Array<{ input: number; output: number; interpolation: string }> }) => new AnimationClip(animation.name, -1, animation.channels.map(channel => {
  const sampler = animation.samplers[channel.sampler];
  const property = { translation: 'position', rotation: 'quaternion', scale: 'scale' }[channel.target.path];
  assert(property);
  const trackName = `${objects[channel.target.node].name}.${property}`;
  const track = property === 'quaternion'
    ? new QuaternionKeyframeTrack(trackName, samples(sampler.input), samples(sampler.output))
    : new VectorKeyframeTrack(trackName, samples(sampler.input), samples(sampler.output));
  if (sampler.interpolation === 'STEP') track.setInterpolation(InterpolateDiscrete);
  return track;
})));
const clips = createModelTimelineClips(sources);
assert.equal(clips.length, 6); assert(clips.every(clip => clip.duration === 4));

const mixer = new AnimationMixer(root);
const actions = clips.map(clip => {
  const action = mixer.clipAction(clip); action.setLoop(LoopOnce, 1);
  action.clampWhenFinished = true; action.play(); action.paused = true; return action;
});
const unregister = registerAnimationActions(actions);
const pose = () => objects.map((object: Object3D) => object.position.clone());
try {
  animControls.setProgress(0); const assembled = pose();
  animControls.setProgress(.5); const halfway = pose();
  animControls.setProgress(1); const expanded = pose();
  const wall = objects.findIndex((object: Object3D) => object.name === '窗框');
  assert(assembled[wall].equals(halfway[wall]) && assembled[wall].equals(expanded[wall]));
  assert.equal(assembled.filter((position, i) => position.distanceTo(expanded[i]) > .001).length, 5);
  animControls.playReverse(); mixer.update(2);
  pose().forEach((position, i) => assert(position.distanceTo(halfway[i]) < 1e-6));
  animControls.rewindToStart();
  pose().forEach((position, i) => assert(position.distanceTo(assembled[i]) < 1e-6));
} finally {
  unregister(); mixer.stopAllAction(); mixer.uncacheRoot(root);
}
assert.equal(readFileSync(publicUrlToFsPath(node.diagram.path)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
console.log('PASS window-wall gap sealing: six component bindings, embedded assets, five moving parts, fixed window frame, four-second scrub/reverse/reset and PNG diagram');
