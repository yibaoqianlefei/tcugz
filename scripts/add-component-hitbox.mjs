import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import * as THREE from 'three';

// Append a local box as an animated component's child. Existing binary data,
// object indices, materials and animation channels remain unchanged.
const [sourcePath, targetPath, componentName] = process.argv.slice(2);
assert(sourcePath && targetPath && componentName, 'Usage: node scripts/add-component-hitbox.mjs <source.glb> <target.glb> <componentName>');
assert(resolve(sourcePath).toLowerCase() !== resolve(targetPath).toLowerCase(), 'Write a separate deployment asset, preserving the source');
const source = await readFile(sourcePath);
assert.equal(source.readUInt32LE(0), 0x46546c67);
assert.equal(source.readUInt32LE(4), 2);
assert.equal(source.readUInt32LE(8), source.length);
assert.equal(source.readUInt32LE(16), 0x4e4f534a);
const jsonLength = source.readUInt32LE(12);
const doc = JSON.parse(source.subarray(20, 20 + jsonLength).toString());
assert.equal(doc.buffers.length, 1, 'Only single-buffer embedded GLB assets are supported');
assert(!doc.buffers[0].uri, 'An embedded buffer is required');
const binHeader = 20 + jsonLength;
assert.equal(source.readUInt32LE(binHeader + 4), 0x004e4942);
const originalBin = source.subarray(binHeader + 8, binHeader + 8 + doc.buffers[0].byteLength);
const matches = doc.nodes.filter(node => node.name === componentName);
assert.equal(matches.length, 1, 'The component name must identify exactly one node');
const component = matches[0];
assert(component.mesh !== undefined, 'The component must have real geometry');
assert(!doc.nodes.some(node => node.name === `${componentName}_hitbox`), 'A component hitbox already exists');
const bounds = new THREE.Box3();
for (const primitive of doc.meshes[component.mesh].primitives) {
  const position = doc.accessors[primitive.attributes.POSITION];
  assert(position.min && position.max, 'Position bounds are required');
  bounds.expandByPoint(new THREE.Vector3(...position.min));
  bounds.expandByPoint(new THREE.Vector3(...position.max));
}
const size = bounds.getSize(new THREE.Vector3()).addScalar(.016);
size.y = Math.max(size.y, .06); // A thin horizontal steel net needs depth for picking.
const center = bounds.getCenter(new THREE.Vector3());
const box = new THREE.BoxGeometry(size.x, size.y, size.z);
const chunks = [originalBin];
let offset = originalBin.length;
function append(data, target) {
  const padding = (4 - offset % 4) % 4;
  if (padding) { chunks.push(Buffer.alloc(padding)); offset += padding; }
  const view = doc.bufferViews.length;
  doc.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: data.length, target });
  chunks.push(data); offset += data.length;
  return view;
}
function attribute(name, min, max) {
  const attr = box.getAttribute(name);
  const index = doc.accessors.length;
  doc.accessors.push({ bufferView: append(Buffer.from(attr.array.buffer, attr.array.byteOffset, attr.array.byteLength), 34962), componentType: 5126, count: attr.count, type: 'VEC3', ...(min ? { min, max } : {}) });
  return index;
}
const position = attribute('position', size.toArray().map(v => -v / 2), size.toArray().map(v => v / 2));
const normal = attribute('normal');
const indices = box.getIndex();
const indexAccessor = doc.accessors.length;
doc.accessors.push({ bufferView: append(Buffer.from(indices.array.buffer, indices.array.byteOffset, indices.array.byteLength), 34963), componentType: 5123, count: indices.count, type: 'SCALAR' });
doc.materials ??= [];
const material = doc.materials.length;
doc.materials.push({ name: `${componentName}_pick_only`, doubleSided: true, alphaMode: 'BLEND', pbrMetallicRoughness: { baseColorFactor: [0, 0, 0, 0], metallicFactor: 0, roughnessFactor: 1 } });
const mesh = doc.meshes.length;
doc.meshes.push({ name: `${componentName}_hitbox`, primitives: [{ attributes: { POSITION: position, NORMAL: normal }, indices: indexAccessor, material }] });
const node = doc.nodes.length;
doc.nodes.push({ name: `${componentName}_hitbox`, mesh, translation: center.toArray(), extras: { pickOnly: true, generatedFor: componentName } });
component.children = [...(component.children ?? []), node];
doc.buffers[0].byteLength = offset;
const json = Buffer.from(JSON.stringify(doc));
const jsonPadding = Buffer.alloc((4 - json.length % 4) % 4, 0x20);
const bin = Buffer.concat([...chunks, Buffer.alloc((4 - offset % 4) % 4)]);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
header.writeUInt32LE(20 + json.length + jsonPadding.length + 8 + bin.length, 8);
header.writeUInt32LE(json.length + jsonPadding.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
const binaryHeader = Buffer.alloc(8);
binaryHeader.writeUInt32LE(bin.length, 0); binaryHeader.writeUInt32LE(0x004e4942, 4);
await writeFile(targetPath, Buffer.concat([header, json, jsonPadding, binaryHeader, bin]));
box.dispose();
console.log(JSON.stringify({ component: componentName, hitbox: `${componentName}_hitbox`, size: size.toArray(), center: center.toArray(), targetPath }));
