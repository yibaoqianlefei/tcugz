import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AnimationClip, AnimationMixer, Group, InterpolateDiscrete, LoopOnce, Object3D, PropertyBinding, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three';
import { getNodeDefinition } from '../src/data/nodeDefinitions';
import { animControls, createModelTimelineClips, registerAnimationActions } from '../src/components/viewer/animationController';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';
import { isHitboxName } from '../src/utils/nameUtils';

const node = getNodeDefinition('profiled-steel-composite-slab-01')!;
assert(node?.status === 'available' && node.category === '楼地层');
assert(node.model && !node.model.noAnimation && node.diagram && node.thumbnail);
const bytes = readFileSync(publicUrlToFsPath(node.model.path));
assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
assert.equal(bytes.readUInt32LE(8), bytes.length);
const jsonLength = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
assert(!gltf.buffers.some((buffer: { uri?: string }) => buffer.uri));
assert(!(gltf.images ?? []).some((image: { uri?: string }) => image.uri));
assert.equal(gltf.nodes.filter((part: { name: string }) => !isHitboxName(part.name)).length, 4);
assert.equal(node.layerConfig!.layers.length, 4);
const root = new Group();
const objects = gltf.nodes.map((part: { name: string; mesh: number; translation: number[] }) => {
  const object = new Object3D(); object.name = PropertyBinding.sanitizeNodeName(part.name);
  if (part.translation) object.position.fromArray(part.translation);
  const layer = node.layerConfig!.getLayerInfo(object.name);
  assert(layer?.description && layer.material);
  gltf.meshes[part.mesh].primitives.forEach((_: unknown, i: number) => {
    const primitive = gltf.meshes[part.mesh].primitives[i];
    const position = gltf.accessors[primitive.attributes.POSITION];
    assert(position.count > 0 && position.min.every(Number.isFinite) && position.max.every(Number.isFinite));
    assert(position.max.every((value: number, axis: number) => value > position.min[axis]));
    if (!isHitboxName(part.name)) {
      assert.equal(node.layerConfig!.getLayerInfo(`${object.name}_${i + 1}`), layer,
        `material-split picking resolves ${part.name}`);
    }
  });
  return object;
});
gltf.nodes.forEach((part: { children?: number[] }, i: number) => {
  part.children?.forEach(child => objects[i].add(objects[child]));
});
gltf.scenes[gltf.scene ?? 0].nodes.forEach((i: number) => root.add(objects[i]));
const studIndex = gltf.nodes.findIndex((part: { name: string }) => part.name === '抗剪栓钉');
const hitboxIndex = gltf.nodes.findIndex((part: { name: string }) => part.name === '抗剪栓钉_hitbox');
assert(hitboxIndex >= 0 && objects[hitboxIndex].parent === objects[studIndex]);
const hitboxMesh = gltf.meshes[gltf.nodes[hitboxIndex].mesh];
const hitboxPositions = gltf.accessors[hitboxMesh.primitives[0].attributes.POSITION];
[.76, .16, .20].forEach((size, axis) => {
  assert(hitboxPositions.max[axis] - hitboxPositions.min[axis] >= size - 1e-6);
});
assert.equal(gltf.materials[hitboxMesh.primitives[0].material].pbrMetallicRoughness.baseColorFactor[3], 0);
assert(!gltf.animations.some((animation: { channels: Array<{ target: { node: number } }> }) =>
  animation.channels.some(channel => channel.target.node === hitboxIndex)));
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
assert.equal(clips.length, 4); assert(clips.every(clip => clip.duration === 4));
assert(sources.some((clip: AnimationClip) => clip.duration < .05), 'fixed steel beam has only its authored initial key');
const mixer = new AnimationMixer(root);
const actions = clips.map(clip => {
  const action = mixer.clipAction(clip); action.setLoop(LoopOnce, 1);
  action.clampWhenFinished = true; action.play(); action.paused = true; return action;
});
const unregister = registerAnimationActions(actions);
const pose = () => objects.map((object: Object3D) => object.position.clone());
try {
  animControls.setProgress(0); const assembled = pose();
  root.updateMatrixWorld(true);
  const initialHitboxWorld = objects[hitboxIndex].matrixWorld.clone();
  animControls.setProgress(.5); const halfway = pose();
  animControls.setProgress(1); const expanded = pose();
  root.updateMatrixWorld(true);
  assert(assembled[hitboxIndex].equals(expanded[hitboxIndex]), 'hitbox retains its local offset');
  assert(!objects[hitboxIndex].matrixWorld.equals(initialHitboxWorld), 'hitbox follows the animated stud group');
  const wall = objects.findIndex((object: Object3D) => object.name === '焊接H形钢梁');
  assert(assembled[wall].equals(halfway[wall]) && assembled[wall].equals(expanded[wall]));
  assert.equal(assembled.filter((position, i) => position.distanceTo(expanded[i]) > .001).length, 3);
  animControls.playReverse(); mixer.update(2);
  pose().forEach((position, i) => assert(position.distanceTo(halfway[i]) < 1e-6));
  animControls.rewindToStart();
  pose().forEach((position, i) => assert(position.distanceTo(assembled[i]) < 1e-6));
} finally {
  unregister(); mixer.stopAllAction(); mixer.uncacheRoot(root);
}
assert.equal(readFileSync(publicUrlToFsPath(node.diagram.path)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
console.log('PASS composite slab: four component bindings, invisible animated stud-group hitbox, embedded assets, three moving parts, fixed steel beam, four-second scrub/reverse/reset and PNG diagram');
