import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { trainingModes, trainingQuestions, getTrainingNode, type TrainingAnswer } from '../src/data/training';
import { evaluateTrainingAnswer, initialTrainingAnswer, isAnswerComplete, moveTrainingItem, placeTrainingPart } from '../src/utils/trainingEvaluation';
import { applyTrainingPresentation, createTrainingScene, trainingPartForObject } from '../src/utils/trainingScene';

assert.equal(new Set(trainingQuestions.map(question => question.id)).size, trainingQuestions.length);
for (const mode of trainingModes) assert(trainingQuestions.filter(question => question.mode === mode.id).length >= 2, `${mode.id}: at least two authored questions`);
for (const question of trainingQuestions) {
  const node = getTrainingNode(question)!;
  assert.equal(node.status, 'available');
  const complete: TrainingAnswer = { ...initialTrainingAnswer(question), ...question.answer };
  assert(isAnswerComplete(question, complete), `${question.id}: complete authored answer`);
  assert(evaluateTrainingAnswer(question, complete).correct, `${question.id}: authored solution`);
  const incomplete = { order: [], pairs: {}, placements: {} };
  assert(!evaluateTrainingAnswer(question, incomplete).correct, `${question.id}: empty answer cannot pass`);
  if (question.answer.order) {
    const duplicate = { ...complete, order: question.answer.order.map(() => question.answer.order![0]) };
    assert(!evaluateTrainingAnswer(question, duplicate).correct, `${question.id}: duplicate sequence cannot pass`);
    assert(!evaluateTrainingAnswer(question, { ...complete, order: [...question.answer.order].reverse() }).correct);
  }
  if (question.answer.selection) assert(!evaluateTrainingAnswer(question, { ...complete, selection: 'not-a-part' }).correct);
  if (question.answer.reason) assert(!evaluateTrainingAnswer(question, { ...complete, reason: 'wrong-reason' }).correct);
  const modelFiles = node.model ? [node.model.path] : node.variants!.map(variant => variant.model.path);
  for (const path of modelFiles) {
    const buffer = readFileSync(`public${path}`);
    const json = JSON.parse(buffer.toString('utf8', 20, 20 + buffer.readUInt32LE(12))) as { nodes: Array<{ name?: string; mesh?: number }> };
    const meshObjects = json.nodes.filter(node => node.mesh !== undefined).map(node => { const object = new THREE.Object3D(); object.name = node.name ?? ''; return object; });
    for (const part of question.parts) assert(meshObjects.some(object => trainingPartForObject(object, question.parts, node.model?.groups) === part.id), `${question.id}: ${part.id} exists in ${path}`);
  }
}
assert.deepEqual(placeTrainingPart({ a: 'x', b: 'y' }, 'b', 'x'), { b: 'x' }, 'Moving a part vacates its previous slot');
assert.deepEqual(moveTrainingItem(['a', 'b', 'c'], 1, -1), ['b', 'a', 'c']);
assert.deepEqual(moveTrainingItem(['a', 'b', 'c'], 0, -1), ['a', 'b', 'c']);

const source = new THREE.Group();
const material = new THREE.MeshStandardMaterial({ color: 'white' });
const geometry = new THREE.BoxGeometry();
for (const [name, x] of [['part-a', 0], ['part-b', 2]] as const) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.x = x;
  source.add(mesh);
}
const model = createTrainingScene(source, [{ id: 'a', name: 'A', meshes: ['part-a'] }, { id: 'b', name: 'B', meshes: ['part-b'] }]);
applyTrainingPresentation(model, { selected: ['a'], hidden: ['b'] });
assert.equal(source.children[1].visible, true, 'Training visibility never changes shared scene');
assert.equal(material.emissive.getHex(), 0, 'Training highlight never changes shared material');
assert.notEqual(model.meshes.get('a')![0].material, material);
applyTrainingPresentation(model, { selected: [], placements: { b: 'a' } });
assert.equal(model.meshes.get('a')![0].position.x, 2, 'Placed mesh moves to target center');
assert.equal(source.children[0].position.x, 0, 'Source pose remains unchanged');
applyTrainingPresentation(model, { selected: [], placements: { b: 'a' } });
assert.equal(model.meshes.get('a')![0].position.x, 2, 'Repeated presentation does not accumulate translation');
applyTrainingPresentation(model, { selected: [] });
assert.equal(model.meshes.get('a')![0].position.x, 0, 'Retry restores original pose');
model.materials.forEach(material => material.dispose());
model.edges.forEach(edge => edge.dispose());
geometry.dispose();
material.dispose();

const memory = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) } });
const { useTrainingStore } = await import('../src/store/trainingStore');
const { useNodeStore } = await import('../src/store/nodeStore');
useNodeStore.getState().setSelectedObject('existing-node-selection');
const question = trainingQuestions[0];
const store = useTrainingStore.getState;
store().updateAnswer(question, { ...initialTrainingAnswer(question), selection: 'divider' });
store().submit(question);
store().submit(question);
assert.equal(store().progress.records[question.id].attempts, 1, 'Repeated submit does not create attempts');
assert.equal(store().progress.records[question.id].firstCorrect, false);
store().retry(question);
store().updateAnswer(question, { ...initialTrainingAnswer(question), ...question.answer });
store().submit(question);
assert.equal(store().progress.records[question.id].solved, true);
assert.equal(store().progress.records[question.id].firstCorrect, false, 'Retries cannot inflate initial independent correctness');
assert.equal(store().progress.records[question.id].hadMistake, true);
assert.equal(useNodeStore.getState().selectedObject, 'existing-node-selection', 'Training state cannot change node workbench state');
const hinted = trainingQuestions[1];
store().showHint(hinted);
store().retry(hinted);
assert.equal(store().progress.drafts[hinted.id].hinted, true, 'Retry before submission preserves hint assistance');
store().updateAnswer(hinted, { ...initialTrainingAnswer(hinted), ...hinted.answer });
store().submit(hinted);
assert.equal(store().progress.records[hinted.id].firstCorrect, false, 'Hint-assisted answer is not independent');
assert(memory.size > 0, 'Progress is saved');
console.log(`PASS ${trainingModes.length} modes, ${trainingQuestions.length} question contracts, scene isolation, scoring and persistence`);
