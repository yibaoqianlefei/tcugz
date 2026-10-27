import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AnimationClip, AnimationMixer, Group, InterpolateDiscrete, LoopOnce, Object3D, PropertyBinding, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three';
import { getNodeDefinition, type NodeDefinition } from '../src/data/nodeDefinitions';
import { animControls, createModelTimelineClips, registerAnimationActions } from '../src/components/viewer/animationController';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';

/* ── Minimal GLB JSON shape (only what this test reads) ────────── */
interface GltfAccessor { componentType: number; count: number; type: string; bufferView: number; byteOffset?: number; min: number[]; max: number[] }
interface GltfBufferView { byteOffset?: number; byteStride?: number }
interface GltfMesh { primitives: Array<{ attributes: { POSITION: number } }> }
interface GltfNode { name: string; mesh?: number; translation?: number[]; rotation?: number[]; scale?: number[] }
interface GltfChannel { sampler: number; target: { node: number; path: string } }
interface GltfSampler { input: number; output: number; interpolation?: string }
interface GltfAnimation { name: string; channels: GltfChannel[]; samplers: GltfSampler[] }
interface Gltf {
  accessors: GltfAccessor[]; bufferViews: GltfBufferView[]; meshes: GltfMesh[]; nodes: GltfNode[];
  animations: GltfAnimation[]; buffers: Array<{ uri?: string }>; images?: Array<{ uri?: string }>;
}

/* 图5-32 扶手与墙面连接 —— 四个节点按同一张剖面图组拆分，各自独立建模。
 * fixed：分解时保持原位、作为锚固基准的墙体构件；
 * lifted：源动画额外给扶手底面留了 50 mm 抬升的构件。 */
interface FamilyMember {
  id: string;
  parts: readonly string[];
  fixed: string;
  lifted?: string;
}

const family: readonly FamilyMember[] = [
  { id: 'handrail-wall-end-plate-01', fixed: '钢筋混凝土墙', parts: ['预埋钢板与弯钩锚脚', '钢筋混凝土墙', '木扶手端部', '墙面抹面层'] },
  { id: 'handrail-wall-bent-bracket-01', fixed: '钢筋混凝土墙', lifted: '木扶手', parts: ['预埋钢板与弯钩锚脚', '镀铬连续弯管', '钢筋混凝土墙', '木扶手', '墙面抹面层'] },
  { id: 'handrail-brick-wall-forked-bar-01', fixed: '砖墙局部', parts: ['细石混凝土', '砖墙局部', '木扶手端部', '墙面抹面层', '入墙分叉扁钢'] },
  {
    id: 'handrail-brick-wall-wood-pad-bracket-01', fixed: '砖墙', lifted: '木扶手',
    parts: ['镀铬连续弯管', '细石混凝土填实', '砖墙', '木扶手', '木垫块', '弯脚连接螺栓', '墙面抹面层', '六角螺母'],
  },
];

function readGlb(node: NodeDefinition) {
  const bytes = readFileSync(publicUrlToFsPath(node.model!.path));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF', `[${node.id}] is a GLB container`);
  assert.equal(bytes.readUInt32LE(8), bytes.length, `[${node.id}] header length matches file`);
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength)) as Gltf;
  return { bytes, gltf, jsonLength };
}

function samples(bytes: Buffer, gltf: Gltf, jsonLength: number, index: number): number[] {
  const accessor = gltf.accessors[index], view = gltf.bufferViews[accessor.bufferView];
  assert.equal(accessor.componentType, 5126);
  const size = { SCALAR: 1, VEC3: 3, VEC4: 4 }[accessor.type as 'SCALAR' | 'VEC3' | 'VEC4'];
  return Array.from({ length: accessor.count * size }, (_, i) => bytes.readFloatLE(
    28 + jsonLength + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
    + Math.floor(i / size) * (view.byteStride ?? size * 4) + i % size * 4));
}

for (const member of family) {
  const node = getNodeDefinition(member.id)!;
  assert(node, `[${member.id}] is registered`);
  assert(node.status === 'available' && node.category === '楼梯', `[${member.id}] available stairs node`);
  assert(node.model && !node.model.noAnimation, `[${member.id}] declares an animated model`);
  assert(!!node.diagram?.path && !!node.thumbnail, `[${member.id}] has a diagram and thumbnail`);
  assert.equal(node.layerConfig!.layers.length, member.parts.length, `[${member.id}] one card per mesh`);

  const { bytes, gltf, jsonLength } = readGlb(node);
  assert(!gltf.buffers.some((buffer) => buffer.uri), `[${member.id}] buffers are embedded`);
  assert(!(gltf.images ?? []).some((image) => image.uri), `[${member.id}] textures are embedded`);
  assert.equal(gltf.nodes.length, member.parts.length, `[${member.id}] mesh count matches the card count`);
  assert.deepEqual(
    gltf.nodes.map((part) => part.name).sort(),
    [...member.parts].sort(),
    `[${member.id}] every mesh is one of the declared members`,
  );

  const root = new Group();
  const objects = gltf.nodes.map((part) => {
    const object = new Object3D();
    object.name = PropertyBinding.sanitizeNodeName(part.name);
    if (part.translation) object.position.fromArray(part.translation);
    if (part.rotation) object.quaternion.fromArray(part.rotation);
    if (part.scale) object.scale.fromArray(part.scale);
    root.add(object);
    const layer = node.layerConfig!.getLayerInfo(object.name);
    assert(part.mesh !== undefined, `[${member.id}] ${part.name} carries geometry`);
    assert(layer?.description && layer.material && layer.thickness, `[${member.id}] ${part.name} has a teaching card`);
    gltf.meshes[part.mesh!].primitives.forEach((_, i) => {
      const primitive = gltf.meshes[part.mesh!].primitives[i];
      const position = gltf.accessors[primitive.attributes.POSITION];
      assert(position.count > 0 && position.min.every(Number.isFinite) && position.max.every(Number.isFinite));
      assert(position.max.every((value, axis) => value > position.min[axis]), `[${member.id}] ${part.name} has volume`);
      assert.equal(node.layerConfig!.getLayerInfo(`${object.name}_${i + 1}`), layer,
        `[${member.id}] material-split picking resolves ${part.name}`);
    });
    return object;
  });

  const sources = gltf.animations.map((animation) => new AnimationClip(animation.name, -1, animation.channels.map((channel) => {
    const sampler = animation.samplers[channel.sampler];
    const property = { translation: 'position', rotation: 'quaternion', scale: 'scale' }[channel.target.path as 'translation' | 'rotation' | 'scale'];
    assert(property, `[${member.id}] ${animation.name} tracks ${channel.target.path}`);
    const trackName = `${objects[channel.target.node].name}.${property}`;
    const times = samples(bytes, gltf, jsonLength, sampler.input);
    const values = samples(bytes, gltf, jsonLength, sampler.output);
    const track = property === 'quaternion'
      ? new QuaternionKeyframeTrack(trackName, times, values)
      : new VectorKeyframeTrack(trackName, times, values);
    if (sampler.interpolation === 'STEP') track.setInterpolation(InterpolateDiscrete);
    return track;
  })));
  assert.equal(sources.length, member.parts.length, `[${member.id}] one clip per mesh`);
  const clips = createModelTimelineClips(sources);
  assert.equal(clips.length, member.parts.length);
  assert(clips.every((clip) => clip.duration === 4), `[${member.id}] every clip shares the 4 s timeline`);

  const mixer = new AnimationMixer(root);
  const actions = clips.map((clip) => {
    const action = mixer.clipAction(clip);
    action.setLoop(LoopOnce, 1); action.clampWhenFinished = true; action.play(); action.paused = true;
    return action;
  });
  const unregister = registerAnimationActions(actions);
  const pose = () => objects.map((object) => object.position.clone());
  try {
    animControls.setProgress(0); const assembled = pose();
    animControls.setProgress(.5); const halfway = pose();
    animControls.setProgress(1); const expanded = pose();

    const wall = objects.findIndex((object) => object.name === member.fixed);
    assert(wall >= 0, `[${member.id}] ${member.fixed} exists`);
    assert(assembled[wall].equals(halfway[wall]) && assembled[wall].equals(expanded[wall]),
      `[${member.id}] ${member.fixed} stays fixed as the anchoring base`);

    assembled.forEach((position, i) => {
      if (i === wall) return;
      const delta = expanded[i].clone().sub(position);
      assert(delta.x > .05, `[${member.id}] ${objects[i].name} separates off the wall face`);
      assert(Math.abs(delta.z) < 1e-6, `[${member.id}] ${objects[i].name} keeps its depth while separating`);
      const expectedY = objects[i].name === member.lifted ? .05 : 0;
      assert(Math.abs(delta.y - expectedY) < 1e-6, `[${member.id}] ${objects[i].name} vertical offset is ${expectedY}`);
    });

    animControls.playReverse(); mixer.update(2);
    pose().forEach((position, i) => assert(position.distanceTo(halfway[i]) < 1e-6, `[${member.id}] reverse hits the halfway pose`));
    animControls.rewindToStart();
    pose().forEach((position, i) => assert(position.distanceTo(assembled[i]) < 1e-6, `[${member.id}] rewind restores the assembled pose`));
  } finally {
    unregister(); mixer.stopAllAction(); mixer.uncacheRoot(root);
  }

  assert.equal(readFileSync(publicUrlToFsPath(node.diagram!.path)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a',
    `[${member.id}] diagram is a PNG`);
}

console.log('PASS handrail-wall family: 4 nodes, 22 mesh/card bindings, fixed wall base per node, axis-aligned explode, 4 s scrub/reverse/reset and PNG diagrams');
