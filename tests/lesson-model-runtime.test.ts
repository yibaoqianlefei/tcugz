import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three-stdlib';
import { getNodeDefinition, type NodeDefinition } from '../src/data/nodeDefinitions';
import { prepareLessonModel, type LessonModel } from '../src/components/textbook/lessonModelRuntime';
import { getAnimationActions, registerAnimationActions } from '../src/components/viewer/animationController';
import { publicUrlToFsPath } from './helpers/resolvePublicAsset';

type GlbJson = {
  accessors: Array<{ componentType: number; count: number; type: string; min?: number[]; max?: number[] }>;
  meshes: Array<{ primitives: Array<{ attributes: { POSITION: number }; material?: number }> }>;
  materials: object[];
  textures?: object[];
  images?: object[];
  samplers?: object[];
  extensionsRequired?: string[];
  extensionsUsed?: string[];
};

/** Exercise the installed GLTFLoader's real hierarchy, unique/sanitized names,
 * and untouched animation binary without requiring a browser, textures or a
 * Draco decoder. Geometry is a private placeholder; bounds retain the original
 * POSITION accessor extents. These checks do not claim visual geometry QA. */
async function animationFixture(node: NodeDefinition): Promise<GLTF> {
  assert(node.model);
  const bytes = readFileSync(publicUrlToFsPath(node.model.path));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  const sourceJsonLength = bytes.readUInt32LE(12);
  const source = JSON.parse(bytes.toString('utf8', 20, 20 + sourceJsonLength)) as GlbJson;
  const json = structuredClone(source);
  const placeholder = json.accessors.length;
  json.accessors.push({ componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [0, 0, 0] });
  json.meshes.forEach(mesh => {
    mesh.primitives = mesh.primitives.map(() => ({ attributes: { POSITION: placeholder }, material: 0 }));
  });
  json.materials = [{}];
  delete json.textures;
  delete json.images;
  delete json.samplers;
  delete json.extensionsRequired;
  delete json.extensionsUsed;
  const encoded = Buffer.from(JSON.stringify(json));
  const padded = Buffer.concat([encoded, Buffer.alloc((4 - encoded.length % 4) % 4, 32)]);
  const originalBinaryChunk = bytes.subarray(20 + sourceJsonLength);
  const result = Buffer.alloc(20 + padded.length + originalBinaryChunk.length);
  result.writeUInt32LE(0x46546c67, 0);
  result.writeUInt32LE(2, 4);
  result.writeUInt32LE(result.length, 8);
  result.writeUInt32LE(padded.length, 12);
  result.writeUInt32LE(0x4e4f534a, 16);
  padded.copy(result, 20);
  originalBinaryChunk.copy(result, 20 + padded.length);
  const gltf = await new GLTFLoader().parseAsync(
    result.buffer.slice(result.byteOffset, result.byteOffset + result.length) as ArrayBuffer, '',
  );
  gltf.scene.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const association = gltf.parser.associations.get(object);
    assert(association?.meshes !== undefined);
    const primitiveIndex = (association as { primitives?: number }).primitives ?? 0;
    const original = source.meshes[association.meshes].primitives[primitiveIndex];
    const position = source.accessors[original.attributes.POSITION];
    assert(position.min && position.max);
    // Loader can share placeholder geometry across unrelated objects. Give
    // every primitive its own original extents before preparing the runtime.
    object.geometry = object.geometry.clone();
    object.geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3().fromArray(position.min), new THREE.Vector3().fromArray(position.max),
    );
  });
  return gltf;
}

function authoredPose(root: THREE.Object3D) {
  const pose: Array<{ name: string; position: number[]; scale: number[]; quaternion: number[] }> = [];
  root.traverse(object => {
    if (object.userData.name) pose.push({
      name: object.name, position: object.position.toArray(), scale: object.scale.toArray(), quaternion: object.quaternion.toArray(),
    });
  });
  return pose;
}

function assertEnvelopeContainsPose(model: LessonModel, rest = false) {
  const envelope = (rest ? model.restBounds : model.bounds).clone().expandByScalar(1e-6);
  model.meshes.forEach(({ mesh }) => {
    const scale = new THREE.Vector3().setFromMatrixScale(mesh.matrixWorld);
    if (Math.min(scale.x, scale.y, scale.z) <= 1e-8) return;
    assert(mesh.geometry.boundingBox);
    const bounds = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
    assert(envelope.containsBox(bounds), `${mesh.name} remains inside the fitted ${rest ? 'initial' : 'timeline'} envelope`);
  });
}

const owned: LessonModel[] = [];
const keep = (model: LessonModel) => { owned.push(model); return model; };
const sentinelRoot = new THREE.Group();
const sentinelMixer = new THREE.AnimationMixer(sentinelRoot);
const sentinelAction = sentinelMixer.clipAction(new THREE.AnimationClip('node-viewer-sentinel', 2, []));
const unregister = registerAnimationActions([sentinelAction]);

try {
  const columnNode = getNodeDefinition('construction-column-01')!;
  const columnSource = await animationFixture(columnNode);
  const columnClipsBefore = JSON.stringify(columnSource.animations.map(clip => clip.toJSON()));
  const column = keep(prepareLessonModel(columnSource, columnNode));
  assert(column.canExplode);
  assert.equal(column.duration, 4, 'Use the actual longest authored timeline');
  assert.deepEqual(column.sample(0), new Set(['钢筋', '箍筋', '墙体']),
    'Collapsed concrete stages and the [1,0,1] tooth are not observable cards at the initial pose');
  assert.equal(columnSource.scene.getObjectByName('02')!.scale.y, 0,
    'The real asset contains a zero-thickness stage, not only all-zero scales');
  assert.equal(column.parts.length, 7, 'Later-visible teaching parts remain registered');
  const initial = authoredPose(columnSource.scene);
  assertEnvelopeContainsPose(column, true);
  const full = column.sample(1);
  assert.equal(full.size, 7);
  for (const name of ['混凝土柱子', '楼板', '圈梁', '01', '02', '03', '04']) {
    assert.deepEqual(columnSource.scene.getObjectByName(name)!.scale.toArray(), [1, 1, 1], `${name} is present after the authored demonstration`);
  }
  assertEnvelopeContainsPose(column);
  column.sample(.5);
  assertEnvelopeContainsPose(column);
  column.sample(0);
  assert.deepEqual(authoredPose(columnSource.scene), initial, 'Seeking 0 → 1 → 0 restores every original transform');
  assert.equal(JSON.stringify(columnSource.animations.map(clip => clip.toJSON())), columnClipsBefore,
    'Timeline normalization and sampling leave source durations, tracks and keyframes unchanged');

  const flashingNode = getNodeDefinition('coating-parapet-flashing-01')!;
  const sourceA = await animationFixture(flashingNode);
  const sourceB = await animationFixture(flashingNode);
  sourceB.animations = sourceA.animations; // Simulate two viewers receiving cached source clips.
  const sourceClipsBefore = JSON.stringify(sourceA.animations.map(clip => clip.toJSON()));
  assert(sourceA.animations.some(clip => clip.duration < 2), 'The real source includes a short structural-slab clip');
  const modelA = keep(prepareLessonModel(sourceA, flashingNode));
  const modelB = keep(prepareLessonModel(sourceB, flashingNode));
  const bInitial = authoredPose(sourceB.scene);
  modelA.sample(1);
  const aFinal = authoredPose(sourceA.scene);
  assert.deepEqual(authoredPose(sourceB.scene), bInitial, 'Seeking one inline model never seeks another');
  const slabFinal = sourceA.scene.getObjectByName('屋面结构板')!.position.clone();
  modelA.sample(.5);
  assert(sourceA.scene.getObjectByName('屋面结构板')!.position.equals(slabFinal),
    'Short clips hold their endpoint while the longest animation continues');
  modelA.sample(1);
  modelB.sample(.25);
  assert.deepEqual(authoredPose(sourceA.scene), aFinal, 'The second private mixer cannot move the first model');
  modelA.dispose();
  owned.splice(owned.indexOf(modelA), 1);
  modelB.sample(1);
  assert.deepEqual(authoredPose(sourceB.scene), aFinal, 'Disposing another runtime cannot uncache shared clips from this mixer');
  assert.equal(JSON.stringify(sourceA.animations.map(clip => clip.toJSON())), sourceClipsBefore);
  assert.deepEqual(getAnimationActions(), [sentinelAction], 'Lesson runtimes never register with the node page singleton');

  const outletNode = getNodeDefinition('straight-rainwater-outlet-cast-iron-01')!;
  const outletSource = await animationFixture(outletNode);
  const cleanedName = THREE.PropertyBinding.sanitizeNodeName('1：2.5水泥砂浆');
  assert.equal(cleanedName, '1：25水泥砂浆');
  const originalObject = outletSource.scene.getObjectByName(cleanedName)!;
  assert(originalObject);
  assert(outletSource.animations.some(clip => clip.tracks.some(track => track.name.startsWith(`${cleanedName}.`))));
  const outlet = keep(prepareLessonModel(outletSource, outletNode));
  assert.equal(originalObject.name, cleanedName, 'Preparing cards never renames an animation target');
  assert(outlet.meshes.some(entry => entry.partId === '1：2.5水泥砂浆'), 'The authored card identity resolves the loader-sanitized target');
  const outletStart = originalObject.position.clone();
  outlet.sample(1);
  assert(!originalObject.position.equals(outletStart), 'The sanitized target still receives its authored animation');
  outlet.sample(0);
  assert(originalObject.position.equals(outletStart));
  assert(outlet.lines.some(({ line, partId }) => {
    if (partId !== '1：2.5水泥砂浆') return false;
    for (let parent = line.parent; parent; parent = parent.parent) if (parent === originalObject) return true;
    return false;
  }), 'The outline follows the animated component owner');

  const staticNode = getNodeDefinition('roof-truss-timber-01')!;
  const staticModel = keep(prepareLessonModel(await animationFixture(staticNode), staticNode));
  assert.equal(staticModel.canExplode, false, 'An undivided static model receives no invented displacement');
  const staticInitial = authoredPose(staticModel.scene);
  staticModel.sample(1);
  assert.deepEqual(authoredPose(staticModel.scene), staticInitial);

  const disabledSource = await animationFixture(flashingNode);
  const disabledNode: NodeDefinition = { ...flashingNode, model: { ...flashingNode.model!, noAnimation: true } };
  const disabledModel = keep(prepareLessonModel(disabledSource, disabledNode));
  assert.equal(disabledModel.canExplode, false, 'Explicit noAnimation remains authoritative even if clips exist');
  const disabledInitial = authoredPose(disabledSource.scene);
  disabledModel.sample(1);
  assert.deepEqual(authoredPose(disabledSource.scene), disabledInitial);

  const wholeNode = getNodeDefinition('bottom-landing-entrance-01')!;
  assert.equal(wholeNode.layerConfig!.layers.length, 6, 'The data describes six conceptual construction elements');
  const wholeModel = keep(prepareLessonModel(await animationFixture(wholeNode), wholeNode));
  assert.equal(wholeModel.canExplode, false);
  assert.deepEqual(wholeModel.parts.map(part => ({ id: part.id, name: part.name })), [
    { id: '__whole_model__', name: wholeNode.title },
  ], 'The undivided asset gets one honest whole-model card rather than six false picks');
  assert(wholeModel.meshes.every(entry => entry.partId === '__whole_model__'));
} finally {
  owned.forEach(model => model.dispose());
  unregister();
  sentinelMixer.stopAllAction();
  sentinelMixer.uncacheRoot(sentinelRoot);
}

console.log('PASS lesson model runtime: real authored timeline/reverse, zero-thickness stages, private/shared-clip isolation, short-clip hold, sanitized bindings, animated outlines, bounds, static/noAnimation and honest whole-model cards');
