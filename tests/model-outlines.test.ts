import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { collectOutlineSources, createFeatureEdges, separateOpaqueSurfaceDepth } from '../src/utils/modelOutlines';

const count = (geometry: THREE.BufferGeometry) => geometry.getAttribute('position').count / 2;
const square = new THREE.BufferGeometry();
square.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], 3));
square.setIndex([0, 1, 2, 0, 3, 2]); // Coplanar, reversed winding on the second face.
assert.equal(count(new THREE.EdgesGeometry(square, 15)), 5);
assert.equal(count(createFeatureEdges([square])), 4, 'False diagonal is removed; outer perimeter survives');

const box = new THREE.BoxGeometry();
assert.equal(count(createFeatureEdges([box])), 12, 'All real right-angle edges survive');
assert.equal(count(createFeatureEdges([box, box])), 12, 'Repeated triangles do not duplicate segments');
const cylinder = new THREE.CylinderGeometry(1, 1, 1, 64);
assert.equal(count(createFeatureEdges([cylinder])), 128, 'Circular rims survive, smooth side tessellation is suppressed');

const shape = new THREE.Shape();
shape.moveTo(0, 0); shape.lineTo(4, 0); shape.lineTo(4, 4); shape.lineTo(0, 4); shape.closePath();
const hole = new THREE.Path();
hole.moveTo(1, 1); hole.lineTo(1, 3); hole.lineTo(3, 3); hole.lineTo(3, 1); hole.closePath();
shape.holes.push(hole);
assert.equal(count(createFeatureEdges([new THREE.ShapeGeometry(shape)])), 8, 'Open perimeter and internal hole perimeter survive');

const first = square.clone(); first.setIndex([0, 1, 2]);
const second = square.clone(); second.setIndex([0, 3, 2]);
assert.equal(count(createFeatureEdges([first, second])), 4, 'Coplanar material split is not a physical edge');
const junction = new THREE.BufferGeometry();
junction.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, -1, 0, 0, 0, 0, -1, 1, 0, 1, 1, 0], 3));
junction.setIndex([0, 1, 2, 0, 3, 4, 3, 1, 5, 0, 1, 3]);
assert.equal(count(createFeatureEdges([junction])), 6, 'One long edge and two short coplanar neighbors are not drawn through the surface');
const root = new THREE.Group();
const object = new THREE.Group(); object.name = 'material-object'; root.add(object);
const a = new THREE.Mesh(first); a.name = 'part_1';
const b = new THREE.Mesh(second); b.name = 'part_2'; object.add(a, b);
assert.equal(collectOutlineSources(root).length, 1);
b.name = 'independent-part';
assert.equal(collectOutlineSources(root).length, 2, 'Distinct component identities never merge');
b.name = 'part_2';
assert.equal(collectOutlineSources(root, [], undefined, new Set(['part_1'])).length, 2, 'Animated submeshes keep independent outlines');
b.position.x = 1;
assert.equal(collectOutlineSources(root).length, 2, 'Distinct local transforms are not merged');
b.position.x = 0;
assert.equal(collectOutlineSources(root, ['material-object'], () => 'material-object').length, 0);
const proxy = new THREE.Mesh(box); proxy.userData._isProxy = true; root.add(proxy);
assert.equal(collectOutlineSources(root).length, 1, 'Picking proxies never receive outlines');

const sourceMaterial = new THREE.MeshStandardMaterial();
const ownedMaterial = sourceMaterial.clone();
separateOpaqueSurfaceDepth(ownedMaterial);
assert(!sourceMaterial.polygonOffset, 'Cached source material remains unchanged');
assert(ownedMaterial.polygonOffset);
const transparent = new THREE.MeshStandardMaterial({ transparent: true });
separateOpaqueSurfaceDepth(transparent);
assert(!transparent.polygonOffset, 'Transparent surfaces retain their own depth policy');

// Actual user GLB: only the four known false side diagonals may disappear.
function loadGeometry(filename: string, meshIndex: number): THREE.BufferGeometry {
  const bytes = readFileSync(filename);
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
  const binaryStart = 20 + jsonLength + 8;
  function values(accessorIndex: number): number[] {
    const accessor = gltf.accessors[accessorIndex];
    const view = gltf.bufferViews[accessor.bufferView];
    const components = accessor.type === 'VEC3' ? 3 : 1;
    const size = accessor.componentType === 5126 || accessor.componentType === 5125 ? 4 : accessor.componentType === 5123 ? 2 : 1;
    const read = accessor.componentType === 5126 ? (offset: number) => bytes.readFloatLE(offset) : accessor.componentType === 5125 ? (offset: number) => bytes.readUInt32LE(offset) : accessor.componentType === 5123 ? (offset: number) => bytes.readUInt16LE(offset) : (offset: number) => bytes.readUInt8(offset);
    return Array.from({ length: accessor.count * components }, (_, i) => read(binaryStart + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0) + Math.floor(i / components) * (view.byteStride ?? components * size) + i % components * size));
  }
  const primitive = gltf.meshes[meshIndex].primitives[0];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(values(primitive.attributes.POSITION), 3));
  geometry.setIndex(values(primitive.indices));
  return geometry;
}
const flight = loadGeometry('public/models/stairs/stair-flight-platform/stair-flight-offset-multiple-01.glb', 0);
const before = new THREE.EdgesGeometry(flight, 15);
const after = createFeatureEdges([flight]);
const lineKeys = (geometry: THREE.BufferGeometry) => {
  const p = geometry.getAttribute('position'); const keys = new Set<string>();
  for (let i = 0; i < p.count; i += 2) {
    const points = [i, i + 1].map(j => [p.getX(j), p.getY(j), p.getZ(j)].map(v => Math.round(v * 1e4)).join(','));
    keys.add(points.sort().join('|'));
  }
  return keys;
};
const oldEdges = lineKeys(before), newEdges = lineKeys(after);
assert.equal([...oldEdges].filter(key => !newEdges.has(key)).length, 4, 'Exactly four false diagonals removed from actual stair flight');
assert.equal([...newEdges].filter(key => !oldEdges.has(key)).length, 0, 'No new invented edges');
for (const meshIndex of [3, 5]) {
  const platform = loadGeometry('public/models/stairs/stair-flight-platform/stair-flight-flush-unburied-01.glb', meshIndex);
  const oldPlatform = new THREE.EdgesGeometry(platform, 15), newPlatform = createFeatureEdges([platform]);
  assert.equal(count(oldPlatform), 258);
  assert.equal(count(newPlatform), 252, 'Actual platform: 12 box edges and 240 circular rim segments remain');
  const oldKeys = lineKeys(oldPlatform), newKeys = lineKeys(newPlatform);
  assert.equal([...oldKeys].filter(key => !newKeys.has(key)).length, 6, 'Exactly six cap-triangulation seams disappear');
  assert.equal([...newKeys].filter(key => !oldKeys.has(key)).length, 0, 'No change to any circular rim segment');
}
console.log(`PASS model outlines: reversed coplanarity, unique segments, box/circular/hole boundaries, material seams, animated/offset ownership, proxies, depth isolation; real flight ${count(before)} → ${count(after)} edges`);
