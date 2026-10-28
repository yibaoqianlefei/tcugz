import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Box3, Matrix4, PropertyBinding, Quaternion, Vector3 } from 'three';
import { getNodeDefinition, nodeDefinitions } from '../src/data/nodeDefinitions';
import { resolveNodeModelSources } from '../src/utils/resolveNodeModelSources';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';

const members = [
  { key: 'semi-frame', parts: ['楼板', '横向梁', '柱', '墙体'], primitives: 5 },
  { key: 'transverse', parts: ['楼板', '横向梁', '墙体'], primitives: 3 },
  { key: 'two-way', parts: ['楼板', '横向梁', '墙体'], primitives: 3 },
  { key: 'longitudinal', parts: ['楼板', '墙体'], primitives: 2 },
];
const drawings = new Set<string>();
for (const member of members) {
  const id = `wall-bearing-${member.key}-01`;
  const node = getNodeDefinition(id)!;
  assert.equal(nodeDefinitions.filter(n => n.id === id).length, 1);
  assert(node?.status === 'available' && node.category === '墙体');
  assert(node.model?.noAnimation, 'static source must not expose a fabricated explode animation');
  assert.equal(resolveNodeModelSources(node).length, 1, 'one independently routed model per scheme');
  assert(node.diagram && node.thumbnail === node.diagram.path);
  drawings.add(node.diagram.path);
  assert.deepEqual(node.textbookLinks, [{ moduleId: 'wall', chapterId: 'wall-masonry' }]);
  const bytes = readFileSync(publicUrlToFsPath(node.model.path));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
  assert.equal(gltf.animations?.length ?? 0, 0);
  assert(!gltf.buffers.some((buffer: {uri?: string}) => buffer.uri));
  assert(!(gltf.images ?? []).some((image: {uri?: string}) => image.uri));
  assert.deepEqual(gltf.nodes.map((part: {name: string}) => part.name).sort(), [...member.parts].sort());
  assert.equal(node.layerConfig!.layers.length, member.parts.length);
  const bounds = new Box3();
  let primitives = 0;
  for (const part of gltf.nodes) {
    assert(part.mesh !== undefined, `${id}: ${part.name} must contain actual geometry, including the updated transverse walls`);
    const matrix = new Matrix4().compose(new Vector3().fromArray(part.translation ?? [0, 0, 0]), new Quaternion().fromArray(part.rotation ?? [0, 0, 0, 1]), new Vector3().fromArray(part.scale ?? [1, 1, 1]));
    const name = PropertyBinding.sanitizeNodeName(part.name);
    const card = node.layerConfig!.getLayerInfo(name);
    assert(card?.description && card.thickness && card.material);
    for (const [index, primitive] of gltf.meshes[part.mesh].primitives.entries()) {
      primitives++;
      const position = gltf.accessors[primitive.attributes.POSITION];
      assert(position.count > 0 && position.min.every(Number.isFinite) && position.max.every(Number.isFinite));
      bounds.union(new Box3(new Vector3().fromArray(position.min), new Vector3().fromArray(position.max)).applyMatrix4(matrix));
      assert.equal(node.layerConfig!.getLayerInfo(`${name}_${index + 1}`), card, 'material submeshes bind to their actual component');
    }
  }
  assert.equal(primitives, member.primitives);
  const size = bounds.getSize(new Vector3());
  assert(size.x > 10 && size.x < 20 && size.y > 2.9 && size.y < 3.3 && size.z > 6 && size.z < 10, 'authored transforms preserve the full building layout, including the transverse model unit conversion');
  const png = readFileSync(publicUrlToFsPath(node.diagram.path));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert(png.readUInt32BE(16) > 200 && png.readUInt32BE(20) > 100);
  console.log(`${id}: ${member.parts.length} selectable groups, ${primitives} primitives, bounds ${size.toArray().map(n => n.toFixed(2)).join(' × ')}`);
}
assert.equal(drawings.size, 4, 'each scheme has its matching drawing');
console.log('PASS four separate wall-bearing layouts: complete geometry, source transforms, component bindings, static controls and matching drawings.');
