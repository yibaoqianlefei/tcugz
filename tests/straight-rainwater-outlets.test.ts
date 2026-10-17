import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AnimationClip, AnimationMixer, Group, LoopOnce, Object3D, PropertyBinding, QuaternionKeyframeTrack, VectorKeyframeTrack, InterpolateDiscrete } from 'three';
import { getNodeDefinition } from '../src/data/nodeDefinitions';
import { canonicalName } from '../src/utils/nameUtils';
import { createModelTimelineClips } from '../src/components/viewer/animationController';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';

for (const id of ['straight-rainwater-outlet-65-01', 'straight-rainwater-outlet-cast-iron-01']) {
  const node = getNodeDefinition(id)!;
  assert(node?.status === 'available' && node.category === '屋顶');
  assert(node.model && !node.model.noAnimation && node.diagram && node.thumbnail);
  const bytes = readFileSync(publicUrlToFsPath(node.model.path));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
  const binaryStart = 20 + jsonLength + 8;
  assert(!gltf.buffers.some((buffer: { uri?: string }) => buffer.uri), 'model has no external buffer dependency');
  assert(!gltf.images.some((image: { uri?: string }) => image.uri), 'textures are embedded');

  const components = gltf.nodes.filter((part: { mesh?: number }) => part.mesh !== undefined);
  const layers = node.layerConfig!.layers;
  assert.equal(components.length, 7);
  assert.equal(layers.length, components.length, 'every actual GLB component has a teaching card');
  for (const part of components) {
    const runtimeName = canonicalName(PropertyBinding.sanitizeNodeName(part.name));
    const original = node.layerConfig!.getLayerInfo(part.name);
    assert(original && original.description && original.material);
    assert.equal(node.layerConfig!.getLayerInfo(runtimeName), original, `runtime picking resolves ${part.name}`);
  }

  const root = new Group();
  const objects = gltf.nodes.map((part: { name: string; translation?: number[]; rotation?: number[]; scale?: number[] }) => {
    const object = new Object3D();
    object.name = PropertyBinding.sanitizeNodeName(part.name);
    if (part.translation) object.position.fromArray(part.translation);
    if (part.rotation) object.quaternion.fromArray(part.rotation);
    if (part.scale) object.scale.fromArray(part.scale);
    root.add(object);
    return object;
  });
  const values = (index: number): number[] => {
    const accessor = gltf.accessors[index];
    const view = gltf.bufferViews[accessor.bufferView];
    assert.equal(accessor.componentType, 5126, 'animation samples use float32');
    const size = { SCALAR: 1, VEC3: 3, VEC4: 4 }[accessor.type as 'SCALAR' | 'VEC3' | 'VEC4'];
    assert(size);
    return Array.from({ length: accessor.count * size }, (_, index) => bytes.readFloatLE(binaryStart + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0) + Math.floor(index / size) * (view.byteStride ?? size * 4) + index % size * 4));
  };
  const clips = gltf.animations.map((animation: { name: string; channels: Array<{ sampler: number; target: { node: number; path: string } }>; samplers: Array<{ input: number; output: number; interpolation: string }> }) => new AnimationClip(animation.name, -1, animation.channels.map(channel => {
    const sampler = animation.samplers[channel.sampler];
    const property = { translation: 'position', rotation: 'quaternion', scale: 'scale' }[channel.target.path];
    assert(property);
    const name = `${objects[channel.target.node].name}.${property}`;
    const track = property === 'quaternion'
      ? new QuaternionKeyframeTrack(name, values(sampler.input), values(sampler.output))
      : new VectorKeyframeTrack(name, values(sampler.input), values(sampler.output));
    if (sampler.interpolation === 'STEP') track.setInterpolation(InterpolateDiscrete);
    return track;
  })));
  const timeline = createModelTimelineClips(clips);
  assert.equal(timeline.length, 7);
  assert(timeline.every(clip => clip.duration === 4));
  const mixer = new AnimationMixer(root);
  timeline.forEach(clip => { const action = mixer.clipAction(clip); action.setLoop(LoopOnce, 1); action.clampWhenFinished = true; action.play(); });
  const pose = () => objects.map((object: Object3D) => object.position.clone());
  mixer.setTime(0);
  const assembled = pose();
  mixer.setTime(2);
  const midway = pose();
  mixer.setTime(4);
  const expanded = pose();
  const moving = components.filter((part: { name: string }, index: number) => assembled[index].distanceTo(expanded[index]) > 0.01);
  assert.equal(moving.length, 6, 'six parts separate while the structural slab remains fixed');
  const slab = objects.findIndex((object: Object3D) => object.name === '钢筋混凝土屋面板');
  assert(assembled[slab].equals(midway[slab]) && assembled[slab].equals(expanded[slab]));
  assert(objects.every((object: Object3D) => [...object.position, ...object.scale, ...object.quaternion].every(Number.isFinite)));
  mixer.stopAllAction();
  mixer.uncacheRoot(root);
  console.log(`PASS ${node.title}: seven mesh/card bindings, embedded assets and real four-second animation sampling`);
}

assert(getNodeDefinition('straight-rainwater-outlet-cast-iron-01')!.model!.outlineExcluded?.includes('镀锌钢丝球'), 'dense wire guard retains its authored geometry without duplicate edge lines');
