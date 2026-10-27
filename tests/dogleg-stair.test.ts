import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { AnimationClip, AnimationMixer, Group, InterpolateDiscrete, LoopOnce, Object3D, PropertyBinding, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three';
import { getNodeDefinition } from '../src/data/nodeDefinitions';
import { animControls, createModelTimelineClips, registerAnimationActions } from '../src/components/viewer/animationController';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';

const node = getNodeDefinition('dogleg-stair-01')!;
assert(node?.status === 'available' && node.category === '楼梯');
assert(node.model && !node.model.noAnimation && node.diagram && node.thumbnail);
assert.equal(node.diagram.subtitle?.includes('图5-37'), true, 'diagram cites 图5-37');
const file = publicUrlToFsPath(node.model.path);
const bytes = readFileSync(file);
assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
assert.equal(bytes.readUInt32LE(8), bytes.length);
const jsonLength = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
assert(!gltf.buffers.some((buffer: { uri?: string }) => buffer.uri));
assert(!(gltf.images ?? []).some((image: { uri?: string }) => image.uri));
assert(gltf.extensionsUsed.includes('KHR_draco_mesh_compression'), 'model ships Draco-compressed');
assert(statSync(file).size < 2 * 1024 * 1024, 'compressed payload stays under 2 MB');

// 8 个节点、8 个网格；「墙体」原导出缺失，作者于 2026-10-27 在 Blender 补出后重新导出
// （未压缩原件 9.23 MB，同一节点数，墙体 mesh 已存在），压缩后各网格名称与层级不变。
const meshNodes = gltf.nodes.filter((part: { mesh?: number }) => part.mesh !== undefined);
assert.equal(gltf.nodes.length, 8);
assert.equal(meshNodes.length, 8);
assert(meshNodes.some((part: { name: string }) => part.name === '墙体'), 'wall carries geometry');
assert.equal(node.layerConfig!.layers.length, 8);

// three 的 sanitizeNodeName 会把「临空栏杆与板式木扶手.001」变成
// 「临空栏杆与板式木扶手001」，多图元再追加 _1；node.model.groups 必须把这两个
// 运行时名称映射回组件名，否则点选与独立展示对不上（已实测修复）。
const groups = node.model!.groups ?? {};
assert.equal(groups['临空栏杆与板式木扶手001'], '临空栏杆与板式木扶手');
assert.equal(groups['临空栏杆与板式木扶手001_1'], '临空栏杆与板式木扶手');

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
assert.equal(clips.length, 8);
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

  // 水磨石面层与陶瓷锦砖防滑条只给了恒定的关键帧：整段动画中不动。
  for (const fixed of ['水磨石面层', '陶瓷锦砖防滑条']) {
    const i = objects.findIndex((object: Object3D) => object.name === fixed);
    assert(assembled[i].equals(halfway[i]) && assembled[i].equals(expanded[i]), `${fixed} stays put`);
  }
  const moved = assembled
    .map((position, i) => ({
      name: objects[i].name,
      delta: [expanded[i].x - position.x, expanded[i].y - position.y, expanded[i].z - position.z].map(v => v.toFixed(3)),
    }))
    .filter(entry => entry.delta.some(v => v !== '0.000'));
  // 6 个构件参与分解：结构下移、找平层下移、墙体与扶手分别外移，面层与防滑条不动。
  assert.deepEqual(moved.map(entry => entry.name).sort(), [
    '临空栏杆与板式木扶手', '墙体', '平台支承梁柱', '结合找平层', '靠墙扶手及预埋件', '梯段平台及底层楼板',
  ].sort());
  const delta = Object.fromEntries(moved.map(entry => [entry.name, entry.delta.join(',')]));
  assert.equal(delta['梯段平台及底层楼板'], '0.000,-0.700,0.000');
  assert.equal(delta['结合找平层'], '0.000,-0.500,0.000');
  assert.equal(delta['靠墙扶手及预埋件'], '0.500,0.000,-0.500');
  assert.equal(delta['墙体'], '1.000,0.000,-1.000');

  animControls.playReverse(); mixer.update(2);
  pose().forEach((position, i) => assert(position.distanceTo(halfway[i]) < 1e-6));
  animControls.rewindToStart();
  pose().forEach((position, i) => assert(position.distanceTo(assembled[i]) < 1e-6));
} finally {
  unregister(); mixer.stopAllAction(); mixer.uncacheRoot(root);
}
assert.equal(readFileSync(publicUrlToFsPath(node.diagram.path)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
console.log('PASS dogleg stair: 8 mesh/card bindings including the re-exported 墙体, runtime-name mapping for the railing, Draco payload under 2 MB, 4-second explode with fixed finish layers, scrub/reverse/reset and PNG diagram');
