import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Box3, Matrix4, PropertyBinding, Quaternion, Vector3 } from 'three';
import { getNodeDefinition } from '../src/data/nodeDefinitions';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';
import { isInteractionAllowed } from '../src/utils/interactionGates';

const drawings = new Set<string>();
for (const [id, primary] of [
  ['rc-lintel-flush-01', '平墙过梁'],
  ['rc-lintel-window-surround-01', '带窗套过梁'],
  ['rc-lintel-window-hood-01', '带窗楣过梁'],
] as const) {
  const node = getNodeDefinition(id)!;
  assert(node?.status === 'available' && node.category === '墙体');
  assert(node.model?.noAnimation && node.diagram && node.thumbnail);
  const bytes = readFileSync(publicUrlToFsPath(node.model.path));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
  assert.equal(gltf.animations?.length ?? 0, 0);
  assert(!(gltf.buffers ?? []).some((buffer: { uri?: string }) => buffer.uri));
  assert(!(gltf.images ?? []).some((image: { uri?: string }) => image.uri));
  const parts = gltf.nodes.filter((part: { mesh?: number }) => part.mesh !== undefined);
  assert.deepEqual(parts.map((part: { name: string }) => part.name), [primary, '外围包覆层', '墙']);
  assert.equal(node.layerConfig!.layers.length, 3);
  const bounds = new Box3();
  for (const part of parts) {
    const name = PropertyBinding.sanitizeNodeName(part.name);
    const layer = node.layerConfig!.getLayerInfo(name);
    assert(layer?.description && layer.material);
    const matrix = part.matrix ? new Matrix4().fromArray(part.matrix) : new Matrix4().compose(
      new Vector3().fromArray(part.translation ?? [0, 0, 0]),
      new Quaternion().fromArray(part.rotation ?? [0, 0, 0, 1]),
      new Vector3().fromArray(part.scale ?? [1, 1, 1]),
    );
    for (const [index, primitive] of gltf.meshes[part.mesh].primitives.entries()) {
      assert.equal(node.layerConfig!.getLayerInfo(`${name}_${index + 1}`), layer,
        'material-split wall surfaces share their knowledge entry');
      const position = gltf.accessors[primitive.attributes.POSITION];
      assert(position.count > 0 && position.min.every(Number.isFinite) && position.max.every(Number.isFinite));
      const box = new Box3(new Vector3().fromArray(position.min), new Vector3().fromArray(position.max)).applyMatrix4(matrix);
      assert(!box.isEmpty()); bounds.union(box);
    }
  }
  assert(bounds.getSize(new Vector3()).toArray().every(size => Number.isFinite(size) && size > .1 && size < 2),
    'millimetre scale and authored rotations resolve to comparable metre-scale geometry');
  assert(isInteractionAllowed(true, 0, 1), 'static components remain pickable after reset');
  const drawing = readFileSync(publicUrlToFsPath(node.diagram.path));
  assert.equal(drawing.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  drawings.add(createHash('sha256').update(drawing).digest('hex'));
  console.log(`PASS ${node.title}: three real component bindings, material-split wall mapping, authored unit/rotation transforms, static interaction and PNG diagram`);
}
assert.equal(drawings.size, 3, 'each lintel has its own section drawing');
