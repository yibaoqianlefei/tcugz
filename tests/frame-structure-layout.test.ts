import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Box3, PropertyBinding, Vector3 } from 'three';
import { getNodeDefinition, nodeDefinitions } from '../src/data/nodeDefinitions';
import { resolveNodeModelSources } from '../src/utils/resolveNodeModelSources';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';

const node = getNodeDefinition('frame-structure-layout-01')!;
assert.equal(nodeDefinitions.filter(n => n.id === node.id).length, 1);
assert(node.status === 'available' && node.category === '墙体');
assert(node.model?.noAnimation && node.diagram && node.thumbnail === node.diagram.path);
assert.equal(resolveNodeModelSources(node).length, 1);
assert.deepEqual(node.textbookLinks, [{ moduleId: 'wall', chapterId: 'wall-role' }]);
const bytes = readFileSync(publicUrlToFsPath(node.model.path));
assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
assert.equal(bytes.readUInt32LE(8), bytes.length);
const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
assert.deepEqual(gltf.nodes.map((part: {name: string}) => part.name).sort(), ['框架柱', '框架梁']);
assert.equal(node.layerConfig!.layers.length, 2);
assert.equal(gltf.animations?.length ?? 0, 0);
assert(!gltf.buffers.some((buffer: {uri?: string}) => buffer.uri));
assert(!(gltf.images ?? []).some((image: {uri?: string}) => image.uri));
const bounds = new Box3();
for (const part of gltf.nodes) {
  assert(part.mesh !== undefined, `${part.name} contains geometry`);
  assert.equal(gltf.meshes[part.mesh].primitives.length, 1);
  const name = PropertyBinding.sanitizeNodeName(part.name);
  const card = node.layerConfig!.getLayerInfo(name);
  assert(card?.description && card.thickness && card.material);
  assert.equal(node.layerConfig!.getLayerInfo(`${name}_1`), card);
  const position = gltf.accessors[gltf.meshes[part.mesh].primitives[0].attributes.POSITION];
  assert(position.count > 0 && position.min.every(Number.isFinite) && position.max.every(Number.isFinite));
  bounds.union(new Box3(new Vector3().fromArray(position.min), new Vector3().fromArray(position.max)).translate(new Vector3().fromArray(part.translation)));
}
const size = bounds.getSize(new Vector3());
assert(size.x > 36 && size.x < 37 && size.y > 3.5 && size.y < 3.7 && size.z > 18 && size.z < 19, 'preserve source building proportions');
const png = readFileSync(publicUrlToFsPath(node.diagram.path));
assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
console.log('PASS frame structure layout: two geometry groups, static controls, original transforms, picking bindings and matching figure 2-7.');
