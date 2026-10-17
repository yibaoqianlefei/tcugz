import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AnimationClip, AnimationMixer, Group, InterpolateDiscrete, LoopOnce, Object3D, PropertyBinding, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three';
import { getNodeDefinition } from '../src/data/nodeDefinitions';
import { createModelTimelineClips } from '../src/components/viewer/animationController';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';
import { isHitboxName } from '../src/utils/nameUtils';

const node = getNodeDefinition('coating-parapet-flashing-01')!;
assert(node?.status === 'available' && node.category === '屋顶');
assert(node.model && !node.model.noAnimation && node.diagram && node.thumbnail);
const bytes = readFileSync(publicUrlToFsPath(node.model.path));
assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
assert.equal(bytes.readUInt32LE(8), bytes.length);
const jsonLength = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
assert(!gltf.buffers.some((buffer: { uri?: string }) => buffer.uri));
assert(!(gltf.images ?? []).some((image: { uri?: string }) => image.uri));
assert.equal(gltf.nodes.filter((part: { name: string }) => !isHitboxName(part.name)).length, 10);
assert.equal(node.layerConfig!.layers.length, 10);
const root = new Group();
const objects = gltf.nodes.map((part: { name: string; mesh: number; translation: number[] }) => {
  const object = new Object3D();
  object.name = PropertyBinding.sanitizeNodeName(part.name);
  object.position.fromArray(part.translation);
  const layer = node.layerConfig!.getLayerInfo(object.name);
  assert(layer?.description && layer.material, `teaching card resolves ${part.name}`);
  if (!isHitboxName(part.name)) gltf.meshes[part.mesh].primitives.forEach((_: unknown, i: number) => {
    assert.equal(node.layerConfig!.getLayerInfo(`${object.name}_${i + 1}`), layer,
      'multi-material child meshes resolve to the parent teaching card');
  });
  return object;
});
gltf.nodes.forEach((part: { children?: number[] }, i: number) => {
  part.children?.forEach(child => objects[i].add(objects[child]));
});
gltf.scenes[gltf.scene ?? 0].nodes.forEach((index: number) => root.add(objects[index]));
const nailIndex = gltf.nodes.findIndex((part: { name: string }) => part.name === '水泥钉');
const hitboxIndex = gltf.nodes.findIndex((part: { name: string }) => part.name === '水泥钉_hitbox');
assert(hitboxIndex >= 0 && gltf.nodes[nailIndex].children.includes(hitboxIndex));
assert.equal(objects[hitboxIndex].parent, objects[nailIndex]);
const hitboxMesh = gltf.meshes[gltf.nodes[hitboxIndex].mesh];
const hitboxPositions = gltf.accessors[hitboxMesh.primitives[0].attributes.POSITION];
assert(hitboxPositions.max[0] - hitboxPositions.min[0] >= .055);
assert(hitboxPositions.max[1] - hitboxPositions.min[1] >= .08);
assert(hitboxPositions.max[2] - hitboxPositions.min[2] >= .055);
assert.equal(gltf.materials[hitboxMesh.primitives[0].material].pbrMetallicRoughness.baseColorFactor[3], 0);
assert(!gltf.animations.some((animation: { channels: Array<{ target: { node: number } }> }) =>
  animation.channels.some(channel => channel.target.node === hitboxIndex)), 'hitbox follows the nail without separate animation');
function samples(index: number) {
  const accessor = gltf.accessors[index], view = gltf.bufferViews[accessor.bufferView];
  assert.equal(accessor.componentType, 5126);
  const size = { SCALAR: 1, VEC3: 3, VEC4: 4 }[accessor.type as 'SCALAR' | 'VEC3' | 'VEC4'];
  return Array.from({ length: accessor.count * size }, (_, i) => bytes.readFloatLE(
    28 + jsonLength + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
    + Math.floor(i / size) * (view.byteStride ?? size * 4) + (i % size) * 4));
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
assert.equal(clips.length, 10);
assert(clips.every(clip => clip.duration === 4));
assert(sources.some((clip: AnimationClip) => clip.duration < 2), 'source includes the short structural-slab clip');
const mixer = new AnimationMixer(root);
clips.forEach(clip => { const action = mixer.clipAction(clip); action.setLoop(LoopOnce, 1); action.clampWhenFinished = true; action.play(); });
const pose = () => objects.map((object: Object3D) => object.position.clone());
mixer.setTime(0); const assembled = pose();
mixer.setTime(2); const halfway = pose();
mixer.setTime(4); const expanded = pose();
assert.equal(assembled[hitboxIndex].distanceTo(expanded[hitboxIndex]), 0, 'hitbox local offset stays attached during animation');
assert.equal(assembled.filter((position, i) => position.distanceTo(expanded[i]) > .001).length, 10);
const slab = objects.findIndex((object: Object3D) => object.name === '屋面结构板');
assert(halfway[slab].equals(expanded[slab]), 'short slab motion holds while the remaining components finish separating');
assert(objects.every((object: Object3D) => [...object.position, ...object.scale, ...object.quaternion].every(Number.isFinite)));
mixer.stopAllAction(); mixer.uncacheRoot(root);
assert.equal(readFileSync(publicUrlToFsPath(node.diagram.path)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
console.log('PASS coating parapet flashing: 10 real mesh/card bindings, invisible nail child hitbox, four-second timeline and short-clip hold');
