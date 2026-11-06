import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PropertyBinding } from 'three';
import { getNodeDefinition } from '../src/data/nodeDefinitions';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';
import { isInteractionAllowed } from '../src/utils/interactionGates';

for (const id of ['roof-truss-timber-01', 'roof-truss-reinforced-concrete-01', 'roof-truss-steel-timber-01']) {
const node = getNodeDefinition(id)!;
assert(node?.status === 'available' && node.category === '屋顶');
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
assert.equal(node.layerConfig!.layers.length, 1, 'one knowledge card matches the single authored mesh');
for (const part of components) {
  const layer = node.layerConfig!.getLayerInfo(PropertyBinding.sanitizeNodeName(part.name));
  assert(layer?.description && layer.material);
  for (const [index, primitive] of gltf.meshes[part.mesh].primitives.entries()) {
    assert.equal(node.layerConfig!.getLayerInfo(`${PropertyBinding.sanitizeNodeName(part.name)}_${index + 1}`), layer,
      'material-split runtime meshes bind to the complete truss');
    const position = gltf.accessors[primitive.attributes.POSITION];
    assert(position.count > 0 && position.min.every(Number.isFinite) && position.max.every(Number.isFinite));
    assert(position.max[0] > position.min[0] && position.max[1] > position.min[1]);
  }
}
assert(isInteractionAllowed(true, 0, 1), 'static model remains pickable after reset');
const drawing=readFileSync(publicUrlToFsPath(node.diagram.path),'utf8');
assert(drawing.includes('data-geometry-id="truss-elevation"')&&!/<image\b|<script\b/.test(drawing));
console.log(`PASS ${node.title}: real geometry, embedded assets, single component/card binding, static picking and source-based SVG diagram`);
}
