import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PropertyBinding } from 'three';
import { getNodeDefinition } from '../src/data/nodeDefinitions';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';
import { isInteractionAllowed } from '../src/utils/interactionGates';

const node = getNodeDefinition('flat-slab-01')!;
assert(node?.status === 'available' && node.category === '楼地层');
assert(node.model?.noAnimation && node.diagram && node.thumbnail);
const bytes = readFileSync(publicUrlToFsPath(node.model.path));
assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
assert.equal(bytes.readUInt32LE(8), bytes.length);
const jsonLength = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
assert.equal(gltf.animations?.length ?? 0, 0);
assert(!(gltf.buffers ?? []).some((buffer: { uri?: string }) => buffer.uri));
assert(!(gltf.images ?? []).some((image: { uri?: string }) => image.uri));
const components = gltf.nodes.filter((part: { mesh?: number }) => part.mesh !== undefined);
assert.equal(components.length, 1);
assert.equal(node.layerConfig!.layers.length, 1, 'preserve the single authored component');
for (const part of components) {
  const name = PropertyBinding.sanitizeNodeName(part.name);
  const layer = node.layerConfig!.getLayerInfo(name);
  assert(layer?.description && layer.material);
  for (const [index, primitive] of gltf.meshes[part.mesh].primitives.entries()) {
    assert.equal(node.layerConfig!.getLayerInfo(`${name}_${index + 1}`), layer);
    const position = gltf.accessors[primitive.attributes.POSITION];
    assert(position.count > 0 && position.min.every(Number.isFinite) && position.max.every(Number.isFinite));
    assert(position.max.every((value: number, axis: number) => value > position.min[axis]));
  }
}
assert(isInteractionAllowed(true, 0, 1), 'static model is pickable after reset');
assert.equal(readFileSync(publicUrlToFsPath(node.diagram.path)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
console.log('PASS flat slab: real geometry, complete-component picking, embedded assets, static controls and PNG diagram');
