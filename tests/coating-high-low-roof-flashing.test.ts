import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { AnimationClip, AnimationMixer, Group, InterpolateDiscrete, LoopOnce, Object3D, PropertyBinding, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three';
import { getNodeDefinition } from '../src/data/nodeDefinitions';
import { animControls, createModelTimelineClips, registerAnimationActions } from '../src/components/viewer/animationController';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';

const node = getNodeDefinition('coating-high-low-roof-flashing-01')!;
assert(node?.status === 'available' && node.category === '屋顶');
assert(node.model && !node.model.noAnimation && node.diagram && node.thumbnail);
assert.equal(node.diagram.subtitle?.includes('图6-41'), true, 'diagram cites 图6-41');
const file = publicUrlToFsPath(node.model.path);
const bytes = readFileSync(file);
assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
assert.equal(bytes.readUInt32LE(8), bytes.length);
const jsonLength = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
assert(!gltf.buffers.some((buffer: { uri?: string }) => buffer.uri));
assert(!(gltf.images ?? []).some((image: { uri?: string }) => image.uri));
assert(gltf.extensionsUsed.includes('KHR_draco_mesh_compression'), 'model ships Draco-compressed');
assert(statSync(file).size < 0.3 * 1024 * 1024, 'compressed payload stays small');

const meshNodes = gltf.nodes.filter((part: { mesh?: number }) => part.mesh !== undefined);
assert.equal(gltf.nodes.length, 11);
assert.equal(meshNodes.length, 11);
assert.equal(node.layerConfig!.layers.length, 11);

const root = new Group();
const objects = gltf.nodes.map((part: { name: string; mesh?: number; translation: number[] }) => {
  const object = new Object3D();
  object.name = PropertyBinding.sanitizeNodeName(part.name);
  object.position.fromArray(part.translation);
  root.add(object);
  return object;
});
for (const [index, part] of gltf.nodes.entries()) {
  const object = objects[index];
  const layer = node.layerConfig!.getLayerInfo(object.name);
  assert(layer?.description && layer.material && layer.thickness, `[${part.name}] has a selectable teaching card`);
  gltf.meshes[part.mesh].primitives.forEach((primitive: { attributes: { POSITION: number } }, i: number) => {
    const position = gltf.accessors[primitive.attributes.POSITION];
    assert(position.count > 0 && position.min.every(Number.isFinite) && position.max.every(Number.isFinite));
    assert(position.max.every((value: number, axis: number) => value > position.min[axis]));
    assert.equal(node.layerConfig!.getLayerInfo(`${object.name}_${i + 1}`), layer,
      `material-split picking resolves ${part.name}`);
  });
}
// 每张卡片都对应真实几何，避免出现"卡片点了没反应"。
node.layerConfig!.layers.forEach((layer) => {
  assert(meshNodes.some((part: { name: string }) => part.name === layer.objectName), `${layer.objectName} is a real mesh`);
});

function samples(index: number) {
  const accessor = gltf.accessors[index], view = gltf.bufferViews[accessor.bufferView];
  assert.equal(accessor.componentType, 5126);
  const size = { SCALAR: 1, VEC3: 3, VEC4: 4 }[accessor.type as 'SCALAR' | 'VEC3' | 'VEC4'];
  return Array.from({ length: accessor.count * size }, (_, i) => bytes.readFloatLE(
    28 + jsonLength + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
    + Math.floor(i / size) * (view.byteStride ?? size * 4) + i % size * 4));
}
// 原文件里「嵌缝油膏」带 morph weights 通道，本测试只关心构件位移（position），
// 因此只取 translation/rotation/scale 三类通道。
const sources = gltf.animations.map((animation: { name: string; channels: Array<{ sampler: number; target: { node: number; path: string } }>; samplers: Array<{ input: number; output: number; interpolation: string }> }) => new AnimationClip(animation.name, -1, animation.channels
  .filter(channel => ['translation', 'rotation', 'scale'].includes(channel.target.path))
  .map(channel => {
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
// 11 个构件各一条 + 「嵌缝油膏」的 shape-key（morph weights）动作，共 12 条。
assert.equal(gltf.animations.length, 12);
assert.equal(clips.length, 12);
assert(clips.every(clip => clip.duration === 4));

const mixer = new AnimationMixer(root);
const actions = clips.map(clip => {
  const action = mixer.clipAction(clip);
  action.setLoop(LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();
  action.paused = true;
  return action;
});
const unregister = registerAnimationActions(actions);
const pose = () => objects.map((object: Object3D) => object.position.clone());
try {
  animControls.setProgress(0); const assembled = pose();
  animControls.setProgress(.5); const halfway = pose();
  animControls.setProgress(1); const expanded = pose();

  // 两组水泥钉只给了恒定的关键帧：整段动画中不动。
  for (const fixed of ['水泥钉-压条固定', '水泥钉']) {
    const index = objects.findIndex((object: Object3D) => object.name === fixed);
    assert(assembled[index].equals(halfway[index]) && assembled[index].equals(expanded[index]), `${fixed} stays put`);
  }
  const delta = (name: string) => {
    const index = objects.findIndex((object: Object3D) => object.name === name);
    return [expanded[index].x - assembled[index].x, expanded[index].y - assembled[index].y, expanded[index].z - assembled[index].z];
  };
  // 分解方向：墙体与盖缝钢板、油膏向外，卷材与结构、找平层向下，抹灰与压条向上收头。
  const close = (value: number, expected: number) => Math.abs(value - expected) < 5e-3;
  assert(close(delta('高侧墙体')[0], -0.2), 'high wall moves out');
  assert(close(delta('防水卷材及U形跨缝段')[0], 0.2) && close(delta('防水卷材及U形跨缝段')[1], -0.3), 'membrane moves out and down');
  assert(close(delta('镀锌薄钢板盖缝')[0], 0.1), 'sheet metal cover moves out');
  assert(close(delta('收头压条')[1], 0.1), 'batten lifts');
  assert(close(delta('找平找坡砂浆')[1], -0.52), 'leveling mortar drops');
  assert(close(delta('低屋面结构板')[1], -0.777), 'slab drops');
  const moved = assembled.filter((position, i) => position.distanceTo(expanded[i]) > .001).length;
  assert.equal(moved, 9, 'nine components take part in the explode');

  animControls.playReverse(); mixer.update(2);
  pose().forEach((position, i) => assert(position.distanceTo(halfway[i]) < 1e-6));
  animControls.rewindToStart();
  pose().forEach((position, i) => assert(position.distanceTo(assembled[i]) < 1e-6));
} finally {
  unregister(); mixer.stopAllAction(); mixer.uncacheRoot(root);
}
assert.equal(readFileSync(publicUrlToFsPath(node.diagram.path)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
console.log('PASS coating high/low roof flashing: 11 mesh/card bindings, 4-second explode with two fixed nail groups, 图6-41 diagram, scrub/reverse/reset');
