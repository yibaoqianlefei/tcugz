import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

function parse(bytes) {
  assert.equal(bytes.readUInt32LE(0), 0x46546c67);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const length = bytes.readUInt32LE(12);
  const doc = JSON.parse(bytes.subarray(20, 20 + length).toString());
  return { doc, bin: bytes.subarray(28 + length, 28 + length + doc.buffers[0].byteLength) };
}

const cases = [
  { id: 'free-fall-waterproof-eaves-01', source: '自由落水檐口-防水层直接悬挑', model: 'free-fall-waterproof-eaves-01', count: 7 },
  { id: 'free-fall-ring-beam-eaves-01', source: '自由落水檐口-圈梁带挑檐板', model: 'free-fall-ring-beam-eaves-01-v2', count: 9 },
];
for (const item of cases) {
const source = parse(await readFile(`D:/大三下作业/glb构造/${item.source}.glb`));
const deployed = parse(await readFile(`public/models/roof/free-fall-eaves/${item.model}.glb`));
assert.equal(source.doc.nodes.filter(node => node.mesh !== undefined).length, item.count);
assert.equal(deployed.doc.nodes.length, source.doc.nodes.length + 1);
const steelIndex = source.doc.nodes.findIndex(node => node.name === '防水层双向钢筋网');
const hitbox = deployed.doc.nodes.at(-1);
assert.equal(hitbox.name, '防水层双向钢筋网_hitbox');
assert.deepEqual(deployed.doc.nodes[steelIndex].children, [deployed.doc.nodes.length - 1]);
assert.equal(deployed.doc.nodes.filter(node => node.name.includes('_hitbox')).length, 1);
for (let i = 0; i < source.doc.nodes.length; i++) {
  const node = structuredClone(deployed.doc.nodes[i]);
  if (i === steelIndex) delete node.children;
  assert.deepEqual(node, source.doc.nodes[i], 'Original transforms and geometry references stay intact');
}
for (const key of ['meshes', 'materials', 'accessors', 'bufferViews']) {
  assert.deepEqual(deployed.doc[key].slice(0, source.doc[key].length), source.doc[key], `Original ${key} unchanged`);
}
for (const key of ['animations', 'scenes', 'scene', 'images', 'textures', 'samplers']) {
  assert.deepEqual(deployed.doc[key], source.doc[key], `${key} unchanged`);
}
assert.deepEqual(deployed.bin.subarray(0, source.bin.length), source.bin, 'Original binary data preserved exactly');
assert(!deployed.doc.animations.some(animation => animation.channels.some(channel => channel.target.node === deployed.doc.nodes.length - 1)), 'The hitbox follows its parent, never a separate animation');
const steelPositions = source.doc.accessors[source.doc.meshes[source.doc.nodes[steelIndex].mesh].primitives[0].attributes.POSITION];
const boxPositions = deployed.doc.accessors[deployed.doc.meshes[hitbox.mesh].primitives[0].attributes.POSITION];
for (let axis = 0; axis < 3; axis++) {
  assert(boxPositions.min[axis] + hitbox.translation[axis] < steelPositions.min[axis]);
  assert(boxPositions.max[axis] + hitbox.translation[axis] > steelPositions.max[axis]);
}
assert(boxPositions.max[1] - boxPositions.min[1] >= .06, 'At least 60mm depth around the thin steel net');
const material = deployed.doc.materials[deployed.doc.meshes[hitbox.mesh].primitives[0].material];
assert.equal(material.pbrMetallicRoughness.baseColorFactor[3], 0, 'Invisible even outside the app');
assert.deepEqual(await readFile(`public/images/roof/${item.id}-diagram.png`), await readFile(`D:/剖面图/自由落水檐口/${item.source}.png`));
console.log(`PASS ${item.id}: original geometry/materials/transforms/animations/binary data preserved; only one enlarged steel child hitbox; invisible material; exact diagram`);
}
