import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { AnimationClip, AnimationMixer, Group, InterpolateDiscrete, LoopOnce, Object3D, PropertyBinding, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three';
import { getNodeDefinition } from '../src/data/nodeDefinitions';
import { animControls, createModelTimelineClips, registerAnimationActions } from '../src/components/viewer/animationController';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';

const node = getNodeDefinition('spiral-stair-01')!;
assert(node?.status === 'available' && node.category === '楼梯');
assert(node.model && !node.model.noAnimation && node.diagram && node.thumbnail);
assert.equal(node.diagram.subtitle?.includes('图5-39'), true, 'diagram cites 图5-39');
const file = publicUrlToFsPath(node.model.path);
const bytes = readFileSync(file);
assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
assert.equal(bytes.readUInt32LE(8), bytes.length);
const jsonLength = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
assert(!gltf.buffers.some((buffer: { uri?: string }) => buffer.uri));
assert(!(gltf.images ?? []).some((image: { uri?: string }) => image.uri));
// Draco 只压图元属性：节点名、层级与动画通道不变，文件 11.75 MB → 0.84 MB。
assert(gltf.extensionsUsed.includes('KHR_draco_mesh_compression'), 'model ships Draco-compressed');
assert(statSync(file).size < 2 * 1024 * 1024, 'compressed payload stays under 2 MB');

// 6 个节点全部带几何（2026-10-27 重新导出后「钢承板及角钢框」不再是空节点；
// 中心套管改用 1 024 面的「圆环」网格，节点名仍为「中心空心套管」）。
const meshNodes = gltf.nodes.filter((part: { mesh?: number }) => part.mesh !== undefined);
assert.equal(gltf.nodes.length, 6);
assert.equal(meshNodes.length, 6);
assert(meshNodes.some((part: { name: string }) => part.name === '钢承板及角钢框'), 'steel deck carries geometry');
assert.equal(node.layerConfig!.layers.length, 6);

const root = new Group();
const objects = gltf.nodes.map((part: { name: string; mesh?: number; translation?: number[] }) => {
  const object = new Object3D();
  object.name = PropertyBinding.sanitizeNodeName(part.name);
  object.position.fromArray(part.translation ?? [0, 0, 0]);
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
// 中心套管不再带动画（重新导出后没有 Action），其余 5 个构件各一条。
assert.equal(clips.length, 5);
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

  // 中心套管与钢承板是固定基准：作者只给了恒定的关键帧，整段动画里不动。
  for (const fixed of ['中心空心套管', '钢承板及角钢框']) {
    const index = objects.findIndex((object: Object3D) => object.name === fixed);
    assert(assembled[index].equals(halfway[index]) && assembled[index].equals(expanded[index]), `${fixed} stays put`);
  }
  // 其余 4 个构件按 500 / 1000 / 1500 / 2000 mm 逐级上移（图纸以 mm 标注，模型为 m）。
  const moved = assembled
    .map((position, i) => ({ name: objects[i].name, dy: expanded[i].y - position.y, dx: expanded[i].x - position.x, dz: expanded[i].z - position.z }))
    .filter(entry => Math.hypot(entry.dx, entry.dy, entry.dz) > .001);
  assert.equal(moved.length, 4);
  assert.deepEqual(
    moved.map(entry => `${entry.name}:${entry.dy.toFixed(3)}`).sort(),
    ['螺钉:0.500', '跨级套管法兰螺帽:1.500', '木踏板及木封边:1.000', '螺旋矩管扶手及方钢栏杆:2.000'].sort(),
  );
  assert(moved.every(entry => Math.abs(entry.dx) < 1e-6 && Math.abs(entry.dz) < 1e-6), 'explode is purely vertical');

  animControls.playReverse(); mixer.update(2);
  pose().forEach((position, i) => assert(position.distanceTo(halfway[i]) < 1e-6));
  animControls.rewindToStart();
  pose().forEach((position, i) => assert(position.distanceTo(assembled[i]) < 1e-6));
} finally {
  unregister(); mixer.stopAllAction(); mixer.uncacheRoot(root);
}
assert.equal(readFileSync(publicUrlToFsPath(node.diagram.path)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
console.log('PASS spiral stair: 6 mesh/card bindings including the re-exported 钢承板及角钢框, Draco payload under 2 MB, 4-second vertical explode with two fixed base components, scrub/reverse/reset and PNG diagram');
