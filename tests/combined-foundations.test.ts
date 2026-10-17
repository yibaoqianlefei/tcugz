import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Box3, Matrix4, PropertyBinding, Quaternion, Vector3 } from 'three';
import { getNodeDefinition } from '../src/data/nodeDefinitions';
import { canonicalName } from '../src/utils/nameUtils';
import { isInteractionAllowed } from '../src/utils/interactionGates';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';

const fixtures = [
  ['combined-foundation-slab-01', ['柱', '平板式筏板']],
  ['combined-foundation-beam-slab-01', ['梁', '柱', '板']],
  ['combined-foundation-box-01', ['顶板及梁', '柱', '板', '内外墙']],
  ['combined-foundation-column-cross-01', ['柱', '十字交叉条基']],
  ['combined-foundation-column-strip-01', ['柱', '条基与近端连接梁']],
] as const;

for (const [id, names] of fixtures) {
  const node = getNodeDefinition(id)!;
  assert(node?.status === 'available' && node.category === '基础');
  assert(node.model?.noAnimation, 'static sources use the always-interactive viewer mode');
  assert(isInteractionAllowed(true, 0, 1), 'picking remains available after resetting a static model');
  const bytes = readFileSync(publicUrlToFsPath(node.model.path));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
  assert.equal(gltf.animations?.length ?? 0, 0, 'source assets contain no animation clips');
  assert(!gltf.buffers.some((buffer: { uri?: string }) => buffer.uri));
  assert(!gltf.images?.some((image: { uri?: string }) => image.uri), 'textures are self-contained');
  const meshNodes = gltf.nodes.filter((part: { mesh?: number }) => part.mesh !== undefined);
  assert.deepEqual(meshNodes.map((part: { name: string }) => part.name), [...names]);
  assert.equal(node.layerConfig!.layers.length, names.length);
  const bounds = new Box3();
  for (const part of meshNodes) {
    const runtimeName = canonicalName(PropertyBinding.sanitizeNodeName(part.name));
    const layer = node.layerConfig!.getLayerInfo(runtimeName);
    assert(layer?.description && layer.material, `actual mesh ${part.name} resolves to its teaching entry`);
    assert.equal(node.layerConfig!.getLayerInfo(part.name), layer);
    const matrix = part.matrix ? new Matrix4().fromArray(part.matrix) : new Matrix4().compose(
      new Vector3().fromArray(part.translation ?? [0, 0, 0]),
      new Quaternion().fromArray(part.rotation ?? [0, 0, 0, 1]),
      new Vector3().fromArray(part.scale ?? [1, 1, 1]),
    );
    for (const primitive of gltf.meshes[part.mesh].primitives) {
      const accessor = gltf.accessors[primitive.attributes.POSITION];
      assert(accessor.count > 0 && accessor.min.length === 3 && accessor.max.length === 3);
      const partBounds = new Box3(new Vector3().fromArray(accessor.min), new Vector3().fromArray(accessor.max)).applyMatrix4(matrix);
      assert(!partBounds.isEmpty() && [...partBounds.min, ...partBounds.max].every(Number.isFinite));
      bounds.union(partBounds);
    }
  }
  const size = bounds.getSize(new Vector3());
  assert(size.x > 0 && size.y > 0 && size.z > 0, 'authored rotation and millimetre-to-metre scales produce a finite 3D model');
  const drawing = readFileSync(publicUrlToFsPath(node.diagram!.path));
  assert.equal(drawing.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(node.thumbnail, node.diagram!.path);
  console.log(`PASS ${node.title}: ${names.length} actual mesh/card bindings, static picking, embedded textures and transformed geometry bounds`);
}
