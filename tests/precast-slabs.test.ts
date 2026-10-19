import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PropertyBinding } from 'three';
import { getNodeDefinition } from '../src/data/nodeDefinitions';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';
import { isInteractionAllowed } from '../src/utils/interactionGates';

const diagrams = new Set<string>();
for (const [id, primary, count] of [
  ['precast-flat-slab-01', '平板', 4],
  ['precast-hollow-slab-01', '空心板', 4],
  ['precast-upright-channel-slab-01', '正放槽形板', 3],
  ['precast-inverted-channel-slab-01', '倒放槽形板', 5],
] as const) {
  const node = getNodeDefinition(id)!;
  assert(node?.status === 'available' && node.category === '楼地层');
  assert(node.model?.noAnimation && node.diagram && node.thumbnail);
  const bytes = readFileSync(publicUrlToFsPath(node.model.path));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
  assert.equal(gltf.animations?.length ?? 0, 0);
  assert(!(gltf.buffers ?? []).some((buffer: { uri?: string }) => buffer.uri));
  assert(!(gltf.images ?? []).some((image: { uri?: string }) => image.uri));
  const components = gltf.nodes.filter((part: { mesh?: number }) => part.mesh !== undefined);
  assert.equal(components.length, count);
  assert(components.some((part: { name: string }) => part.name === primary), 'model matches its slab type');
  assert.equal(node.layerConfig!.layers.length, count);
  for (const part of components) {
    const name = PropertyBinding.sanitizeNodeName(part.name);
    const layer = node.layerConfig!.getLayerInfo(name);
    assert(layer?.description && layer.material, `missing picking description for ${id}/${name}`);
    for (const [index, primitive] of gltf.meshes[part.mesh].primitives.entries()) {
      assert.equal(node.layerConfig!.getLayerInfo(`${name}_${index + 1}`), layer);
      const position = gltf.accessors[primitive.attributes.POSITION];
      assert(position.count > 0 && position.min.every(Number.isFinite) && position.max.every(Number.isFinite));
      assert(position.max.every((value: number, axis: number) => value > position.min[axis]));
    }
  }
  assert(isInteractionAllowed(true, 0, 1), 'static components remain pickable after reset');
  const diagram = readFileSync(publicUrlToFsPath(node.diagram.path));
  assert.equal(diagram.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  diagrams.add(createHash('sha256').update(diagram).digest('hex'));
  console.log(`PASS ${node.title}: ${count} real mesh/card bindings, embedded assets, static interaction and PNG diagram`);
}
assert.equal(diagrams.size, 4, 'each slab type has its own section drawing');
