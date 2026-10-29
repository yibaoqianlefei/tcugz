import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { articles } from './lib/textbook-catalog.mjs';
import { units } from './lib/curriculum-learning.mjs';
import { chapterSelection } from './lib/chapter-selection.mjs';

const selection = chapterSelection();
const selectedNodes = new Set(units.filter(unit => selection.includes(unit.lesson)).flatMap(unit => unit.models.map(model => model.nodeId)));
const hash = value => createHash('sha256').update(value).digest('hex');
const json = async path => JSON.parse(await readFile(path, 'utf8'));
async function snapshot() {
  const media = await json('src/data/lessonMedia.json');
  const files = {};
  for (const article of articles.filter(article => !selection.includes(`${article.group}/${article.id}`))) {
    for (const path of [article.source, ...['lesson', 'curriculum', 'previews/curriculum'].map(root => `public/${root}/${article.path}`)]) files[path] = hash(await readFile(path));
    files[`media:${article.group}/${article.id}`] = hash(JSON.stringify(media[`${article.group}/${article.id}`]));
  }
  if (selection.scoped) files['src/data/curriculumDocuments.json'] = hash(await readFile('src/data/curriculumDocuments.json'));
  const corpus = await json('public/data/companion-knowledge.json');
  const outside = source => !selectedNodes.has(source.nodeId)
    && ![...selection.paths].some(path => source.id === `course:${path}`)
    && !(source.id.startsWith('learning:') && units.some(unit => selection.includes(unit.lesson) && unit.id === source.id.slice(9)));
  files['corpus:unselected'] = hash(JSON.stringify(corpus.sources.filter(outside)));
  files['corpus:training'] = hash(JSON.stringify(corpus.training));
  return files;
}
const before = await snapshot();
const args = selection.scoped ? [`--chapters=${[...selection.selected].join(',')}`] : [];
for (const [script, typescript] of [['build-lesson-media.ts', true], ['build-curriculum-preview.mjs', false], ['promote-homepage.mjs', false], ['build-companion-corpus.ts', true]]) {
  const result = spawnSync(process.execPath, [...(typescript ? ['--import', 'tsx'] : []), `scripts/${script}`, ...args], { stdio: 'inherit' });
  assert.equal(result.status, 0, `Batch generation failed: ${script}`);
}
const after = await snapshot();
assert.deepEqual(after, before, 'A selected batch must preserve every unrelated course, media entry, source and training hint');
const graph = await json('src/data/curriculumLearning.json');
const record = { date: '2026-10-29', chapters: [...selection.selected], lessons: [...selection.paths].length,
  units: Object.values(graph.units).filter(unit => selection.includes(unit.lesson)).length,
  primaryNodes: Object.values(graph.nodes).filter(record => record.primary && selection.includes(record.primary.lessonKey)).length,
  unselectedChecks: Object.keys(before).length, status: 'generation-and-scope-passed' };
await mkdir('audit-output/curriculum-integration-2026-10-29/batches', { recursive: true });
await writeFile(`audit-output/curriculum-integration-2026-10-29/batches/${[...selection.selected].join('-')}.json`, JSON.stringify(record, null, 2) + '\n');
console.log(`Batch accepted: ${record.lessons} lessons / ${record.units} units / ${record.primaryNodes} primary nodes; ${record.unselectedChecks} preservation checks.`);
