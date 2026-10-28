import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PropertyBinding } from 'three';
import { getNodeDefinition, nodeDefinitions } from '../src/data/nodeDefinitions';
import { resolveNodeModelSources } from '../src/utils/resolveNodeModelSources';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';

const members = [
  { id: 'stair-start-rounded-return-handrail-01', parts: ['圆头踏步', '连续回弯扶手'], primitives: 3, source: '楼梯起步处理-圆头踏步与连续回弯扶手' },
  { id: 'stair-start-straight-folded-handrail-01', parts: ['直边踏步', '下折回接扶手'], primitives: 4, source: '楼梯起步处理-直边踏步与下折回接扶手' },
];
for (const member of members) {
  const node = getNodeDefinition(member.id)!;
  assert.equal(nodeDefinitions.filter(n => n.id === member.id).length, 1, 'repeated source path does not duplicate registration');
  assert(node?.status === 'available' && node.category === '楼梯');
  assert(node.model?.noAnimation, 'static source is not advertised as an animated model');
  assert(node.diagram && node.thumbnail === node.diagram.path);
  assert.deepEqual(node.textbookLinks, [{ moduleId: 'stairs', chapterId: 'stairs-details' }]);
  assert.equal(resolveNodeModelSources(node).length, 1);
  const bytes = readFileSync(publicUrlToFsPath(node.model.path));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
  assert.equal(gltf.nodes.length, 2);
  assert.equal(gltf.meshes.length, 2);
  assert.equal(gltf.animations?.length ?? 0, 0);
  assert(!gltf.buffers.some((b: {uri?: string}) => b.uri), 'model has embedded buffers');
  assert(!(gltf.images ?? []).some((image: {uri?: string}) => image.uri), 'textures have no external dependency');
  assert.deepEqual(gltf.nodes.map((part: {name: string}) => part.name).sort(), [...member.parts].sort());
  assert.equal(node.layerConfig!.layers.length, 2);
  let primitives = 0;
  for (const part of gltf.nodes) {
    assert(part.mesh !== undefined, `${part.name} has actual geometry`);
    const name = PropertyBinding.sanitizeNodeName(part.name);
    const layer = node.layerConfig!.getLayerInfo(name);
    assert(layer?.description && layer.material && layer.thickness);
    for (const [index, primitive] of gltf.meshes[part.mesh].primitives.entries()) {
      primitives++;
      const position = gltf.accessors[primitive.attributes.POSITION];
      assert(position.count > 0 && position.min.every(Number.isFinite) && position.max.every(Number.isFinite));
      assert(position.max.every((v: number, i: number) => v > position.min[i]), `${part.name} is not empty or flat`);
      assert.equal(node.layerConfig!.getLayerInfo(`${name}_${index + 1}`), layer, 'material-split geometry resolves to the same selectable card');
    }
  }
  assert.equal(primitives, member.primitives);
  const diagram = readFileSync(publicUrlToFsPath(node.diagram.path));
  assert.equal(diagram.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  console.log(`${member.id}: 2 components, ${primitives} material primitives, static model, PNG ${diagram.length} bytes; model SHA256 ${createHash('sha256').update(bytes).digest('hex')}`);
}
assert.notEqual(getNodeDefinition(members[0].id)!.diagram!.path, getNodeDefinition(members[1].id)!.diagram!.path, 'each model uses its own matching drawing');
console.log('PASS stair-start nodes: original static geometry, component picking bindings, source capabilities and distinct diagrams.');
