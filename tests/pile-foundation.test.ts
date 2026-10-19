import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Box3, PropertyBinding, Vector3 } from 'three';
import { getNodeDefinition } from '../src/data/nodeDefinitions';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';
import { isInteractionAllowed } from '../src/utils/interactionGates';

const node = getNodeDefinition('pile-foundation-composition-01')!;
assert(node?.status === 'available' && node.category === '基础');
assert(node.model?.noAnimation && node.diagram && node.thumbnail);
const bytes = readFileSync(publicUrlToFsPath(node.model.path));
assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
assert.equal(bytes.readUInt32LE(8), bytes.length);
const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
assert.equal(gltf.animations?.length ?? 0, 0);
assert(!(gltf.buffers ?? []).some((buffer: { uri?: string }) => buffer.uri));
assert(!(gltf.images ?? []).some((image: { uri?: string }) => image.uri));
const components = gltf.nodes.filter((part: { mesh?: number }) => part.mesh !== undefined);
assert.deepEqual(components.map((part: { name: string }) => part.name), ['桩', '柱', '斜顶承台板', '墙体', '墙下承台梁']);
assert.equal(node.layerConfig!.layers.length, 5);
const bounds = new Box3();
for (const part of components) {
  const name = PropertyBinding.sanitizeNodeName(part.name);
  const layer = node.layerConfig!.getLayerInfo(name);
  assert(layer?.description && layer.material, `missing picking description for ${name}`);
  for (const [index, primitive] of gltf.meshes[part.mesh].primitives.entries()) {
    assert.equal(node.layerConfig!.getLayerInfo(`${name}_${index + 1}`), layer);
    const accessor = gltf.accessors[primitive.attributes.POSITION];
    assert(accessor.count > 0 && accessor.min.every(Number.isFinite) && accessor.max.every(Number.isFinite));
    const box = new Box3(new Vector3().fromArray(accessor.min), new Vector3().fromArray(accessor.max));
    assert(!box.isEmpty()); bounds.union(box);
  }
}
assert(bounds.getSize(new Vector3()).toArray().every(value => value > 0));
assert(isInteractionAllowed(true, 0, 1), 'static model is pickable after reset');
assert.equal(readFileSync(publicUrlToFsPath(node.diagram.path)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
console.log('PASS pile foundation: five real mesh/card bindings, grouped piles, embedded textures, finite bounds, static interaction and PNG diagram');
