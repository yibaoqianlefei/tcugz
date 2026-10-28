import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { AnimationClip, AnimationMixer, Group, InterpolateDiscrete, LoopOnce, Object3D, PropertyBinding, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three';
import { getNodeDefinition } from '../src/data/nodeDefinitions';
import { animControls, createModelTimelineClips, registerAnimationActions } from '../src/components/viewer/animationController';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';

const node = getNodeDefinition('elevator-composition-01')!;
assert(node?.status === 'available' && node.category === '楼梯');
assert(node.model && !node.model.noAnimation && node.diagram && node.thumbnail);
assert.deepEqual(node.textbookLinks, [{ moduleId: 'stairs', chapterId: 'stairs-elevator' }]);
const bytes = readFileSync(publicUrlToFsPath(node.model.path));
assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
assert.equal(bytes.readUInt32LE(8), bytes.length);
const revision = node.model.path.match(/elevator-composition-([a-f\d]{8})\.glb$/)?.[1];
assert(revision && createHash('sha256').update(bytes).digest('hex').startsWith(revision), 'resource address identifies the imported file revision');
const jsonLength = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
const parts = ['电梯轿厢', '楼层平台', '机房结构', '曳引轮组', '底坑与缓冲器', '层门与门框', '导轨和固定架', '对重及悬挂', '井壁', '绳索'];
assert.deepEqual(gltf.nodes.map((part: {name: string}) => part.name).sort(), [...parts].sort());
assert.equal(node.layerConfig!.layers.length, 10);
assert.equal(gltf.animations.length, 10);
assert(!gltf.buffers.some((buffer: {uri?: string}) => buffer.uri));
assert(!(gltf.images ?? []).some((image: {uri?: string}) => image.uri));
const root = new Group();
let primitiveCount = 0;
const objects = gltf.nodes.map((part: {name: string; mesh?: number; translation?: number[]; rotation?: number[]; scale?: number[]}) => {
  assert(part.mesh !== undefined, `${part.name} contains geometry`);
  const object = new Object3D(); object.name = PropertyBinding.sanitizeNodeName(part.name);
  if (part.translation) object.position.fromArray(part.translation);
  if (part.rotation) object.quaternion.fromArray(part.rotation);
  if (part.scale) object.scale.fromArray(part.scale);
  root.add(object);
  const layer = node.layerConfig!.getLayerInfo(object.name);
  assert(layer?.description && layer.material && layer.thickness);
  gltf.meshes[part.mesh!].primitives.forEach((primitive: {attributes: {POSITION: number}}, index: number) => {
    primitiveCount++;
    const position = gltf.accessors[primitive.attributes.POSITION];
    assert(position.count > 0 && position.min.every(Number.isFinite) && position.max.every(Number.isFinite));
    assert(position.max.some((v: number, i: number) => v > position.min[i]));
    assert.equal(node.layerConfig!.getLayerInfo(`${object.name}_${index+1}`), layer, 'material submeshes resolve to the same component');
  });
  return object;
});
assert.equal(primitiveCount, 21);
function samples(index: number): number[] {
  const accessor = gltf.accessors[index], view = gltf.bufferViews[accessor.bufferView];
  assert.equal(accessor.componentType, 5126);
  const size = { SCALAR: 1, VEC3: 3, VEC4: 4 }[accessor.type as 'SCALAR' | 'VEC3' | 'VEC4'];
  return Array.from({ length: accessor.count * size }, (_, i) => bytes.readFloatLE(28 + jsonLength + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0) + Math.floor(i / size) * (view.byteStride ?? size * 4) + i % size * 4));
}
const sourceClips = gltf.animations.map((animation: {name: string; channels: Array<{sampler: number; target: {node: number; path: string}}>; samplers: Array<{input: number; output: number; interpolation?: string}>}) => new AnimationClip(animation.name, -1, animation.channels.map(channel => {
  const sampler = animation.samplers[channel.sampler];
  const property = {translation: 'position', rotation: 'quaternion', scale: 'scale'}[channel.target.path];
  assert(property);
  const name = `${objects[channel.target.node].name}.${property}`;
  const track = property === 'quaternion' ? new QuaternionKeyframeTrack(name, samples(sampler.input), samples(sampler.output)) : new VectorKeyframeTrack(name, samples(sampler.input), samples(sampler.output));
  if (sampler.interpolation === 'STEP') track.setInterpolation(InterpolateDiscrete);
  return track;
})));
assert(sourceClips.some((clip: AnimationClip) => clip.duration < .05), 'fixed guide rail has its authored single-frame track');
const clips = createModelTimelineClips(sourceClips);
assert(clips.every(clip => clip.duration === 4), 'all clips share the four-second timeline, including fixed parts');
const mixer = new AnimationMixer(root);
const actions = clips.map(clip => {const action = mixer.clipAction(clip); action.setLoop(LoopOnce, 1); action.clampWhenFinished = true; action.play(); action.paused = true; return action;});
const unregister = registerAnimationActions(actions);
const pose = () => objects.map((object: Object3D) => object.position.clone());
try {
  animControls.setProgress(0); const start = pose();
  animControls.setProgress(.5); const middle = pose();
  animControls.setProgress(1); const end = pose();
  for (const fixed of ['机房结构', '导轨和固定架']) {
    const index = objects.findIndex((o: Object3D) => o.name === fixed);
    assert(start[index].equals(middle[index]) && start[index].equals(end[index]), `${fixed} remains fixed`);
  }
  assert.equal(start.filter((position, i) => position.distanceTo(end[i]) > .001).length, 8);
  animControls.playReverse(); mixer.update(2);
  pose().forEach((position, i) => assert(position.distanceTo(middle[i]) < 1e-6, 'reverse returns every component to the same intermediate pose'));
  animControls.rewindToStart();
  pose().forEach((position, i) => assert(position.distanceTo(start[i]) < 1e-6, 'reset restores the original assembly'));
} finally {unregister(); mixer.stopAllAction(); mixer.uncacheRoot(root);}
assert.equal(readFileSync(publicUrlToFsPath(node.diagram.path)).subarray(0,8).toString('hex'), '89504e470d0a1a0a');
console.log('PASS elevator composition: latest revision, 10 named components, 21 material primitives, four-second scrub/reverse/reset, fixed machine-room structure and guide rails, matching diagram.');
