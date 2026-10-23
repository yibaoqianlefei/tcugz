import assert from 'node:assert/strict';
import { BoxGeometry, Color, Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three';
import { pickLessonPart } from '../src/components/textbook/lessonModelRuntime';
import { applyComponentHighlight } from '../src/utils/componentHighlight';

const root = new Group();
const geometry = new BoxGeometry();
const make = (name: string, partId?: string) => {
  const mesh = new Mesh(geometry, new MeshStandardMaterial());
  mesh.name = name; mesh.userData.lessonPart = partId; root.add(mesh); return mesh;
};
const front = make('前表面');
const target = make('材料层_1', '材料层');
const sameGroup = make('材料层_2', '材料层');
const proxy = make('材料层_hitbox', '材料层');
const hiddenParent = new Group(); hiddenParent.visible = false; root.add(hiddenParent);
const hidden = make('隐藏构件', '隐藏'); hiddenParent.add(hidden);
const collapsed = make('后续混凝土', '混凝土'); collapsed.scale.set(1, 0, 1);
const line = new LineSegments(geometry, new LineBasicMaterial()); root.add(line);
root.updateMatrixWorld(true);
assert.equal(pickLessonPart([{ object: target }]), '材料层');
assert.equal(pickLessonPart([{ object: sameGroup }]), '材料层', 'multi-material submeshes share the teaching identity');
assert.equal(pickLessonPart([{ object: proxy }, { object: target }]), '材料层', 'visible hitbox proxies do not occlude real surfaces');
assert.equal(pickLessonPart([{ object: hidden }, { object: collapsed }, { object: line }, { object: target }]), '材料层', 'hidden ancestors, one-axis-zero construction stages and outlines are ignored');
assert.equal(pickLessonPart([{ object: front }, { object: target }]), undefined, 'an unlabelled front surface blocks through-model picking');
target.visible = false;
assert.equal(pickLessonPart([{ object: target }, { object: sameGroup }]), '材料层');
sameGroup.scale.set(0, 0, 0); root.updateMatrixWorld(true);
assert.equal(pickLessonPart([{ object: sameGroup }]), undefined);

const standard = new MeshStandardMaterial({ color: '#123456', emissive: '#010203', emissiveIntensity: .2 });
applyComponentHighlight(standard, 'hover');
assert(standard.emissive.equals(new Color('#ffffff'))); assert.equal(standard.emissiveIntensity, 1.25);
applyComponentHighlight(standard, 'selected');
assert(standard.emissive.equals(new Color('#d4a843'))); assert.equal(standard.emissiveIntensity, 1.15);
assert(standard.color.equals(new Color('#123456')), 'emissive highlights retain the authored diffuse color');
const basic = new MeshBasicMaterial({ color: '#123456' });
const expected = basic.color.clone().lerp(new Color('#d4a843'), .55);
applyComponentHighlight(basic, 'selected'); assert(basic.color.equals(expected));
const held = basic.color.clone(); applyComponentHighlight(basic, 'clear'); assert(basic.color.equals(held), 'callers own restoration of the original material');
root.traverse(object => {
  if (object instanceof Mesh || object instanceof LineSegments) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose());
});
geometry.dispose(); standard.dispose(); basic.dispose();
console.log('PASS lesson interaction: real mesh visibility/proxy/degenerate/front-surface/group picking and shared node material highlights');
