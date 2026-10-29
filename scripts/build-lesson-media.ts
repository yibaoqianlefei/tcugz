import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { nodeDefinitions } from '../src/data/nodeDefinitions';
import { articles } from './lib/textbook-catalog.mjs';
import { lessonMedia } from './lib/lesson-media-catalog.mjs';
import { lessons as authoredLessons, units as authoredUnits } from './lib/curriculum-learning.mjs';
import { chapterSelection } from './lib/chapter-selection.mjs';
import type { KnowledgeUnit, LessonLearningPlan, NodeLearningContext } from '../src/types/curriculumLearning';

const selection = chapterSelection();
const output: Record<string, any> = selection.scoped ? JSON.parse(await readFile('src/data/lessonMedia.json', 'utf8')) : {};
const nodes = new Map(nodeDefinitions.map(node => [node.id, node]));
const text = node => node.value ?? (node.children ?? []).map(text).join('');
const stableFigure = (id: string) => `model-${id.replace(/\./g, '-')}`;
let count = 0;
for (const article of articles) {
  const key = `${article.group}/${article.id}`;
  if (!selection.includes(key)) continue;
  const plan = authoredLessons[key];
  assert(plan, `Missing authored learning plan: ${key}`);
  const markdown = await readFile(article.source, 'utf8');
  const ast = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const headings = ast.children.filter(node => node.type === 'heading' && node.depth !== 1).map((node, index) => ({ title: text(node), id: `section-${index + 1}` }));
  const units: KnowledgeUnit[] = plan.units.map((id: string) => {
    const unit = authoredUnits.find(item => item.id === id);
    assert(unit && unit.lesson === key, `Incorrect knowledge unit: ${key} / ${id}`);
    const anchors = headings.filter(heading => heading.title.includes(unit.anchor));
    assert.equal(anchors.length, 1, `Unit needs one semantic heading: ${id} → ${unit.anchor}`);
    assert(unit.assessment?.question && unit.assessment.criteria.length >= 2, `Missing matched assessment: ${id}`);
    assert(unit.observe.length >= 2 && unit.principle && unit.boundary, `Incomplete learning path: ${id}`);
    assert(unit.models.filter(model => model.role === 'core').length <= 1, `Too many inline canvases: ${id}`);
    return { prerequisiteIds: [], conceptIds: [], relatedPrinciples: [], applications: [], diagramIds: [], ...unit,
      sectionId: anchors[0].id, models: unit.models.map(model => {
        const definition = nodes.get(model.nodeId);
        assert(definition?.status === 'available', `Unavailable model: ${id} / ${model.nodeId}`);
        for (const object of model.objects) assert(definition.layerConfig?.getLayerInfo(object)
          || definition.variants?.some(variant => variant.componentKnowledge?.some(card => card.objectName === object)), `${model.nodeId} cannot select ${object}`);
        return { ...model, title: definition.title };
      }) };
  });
  const figures = [];
  for (const unit of units) {
    const model = unit.models.find(model => model.role === 'core');
    if (!model) continue;
    const definition = nodes.get(model.nodeId)!;
    for (const path of [definition.diagram?.path, definition.model?.path, ...(definition.variants ?? []).map(variant => variant.model.path)].filter(Boolean)) await access(`public/${path!.replace(/^\/+/, '')}`);
    figures.push({ id: stableFigure(unit.id), number: String(figures.length + 1).padStart(2, '0'), nodeId: model.nodeId, nodeTitle: definition.title,
      knowledgeId: unit.id, anchor: unit.anchor, title: unit.title, caption: unit.principle + unit.boundary,
      focus: unit.observe, imageAlt: unit.title + '的构造示意', image: definition.diagram?.path ?? '', hasModel: Boolean(definition.model || definition.variants?.length),
      sectionId: unit.sectionId, sectionTitle: headings.find(heading => heading.id === unit.sectionId)!.title, layerCount: definition.layerConfig?.layers.length ?? 0 });
  }
  const learning: LessonLearningPlan = { prerequisiteIds: [], diagrams: [], relatedPrinciples: [], applications: [], ...plan, units,
    kind: article.group === 'practice' ? 'practice' : 'reading' };
  output[key] = { key, title: article.title, path: article.path, intro: plan.intro, edition: 'knowledge-2026-10-29', learning,
    readingMinutes: Math.max(2, Math.ceil(markdown.replace(/\s/g, '').length / 450)), figures };
  count++;
}
const contexts: Record<string, { primary?: NodeLearningContext; related: NodeLearningContext[] }> = {};
const knowledge: Record<string, KnowledgeUnit> = {};
const plans: Record<string, any> = {};
for (const [key, lesson] of Object.entries(output)) {
  if (!lesson.learning) continue;
  plans[key] = { key, title: lesson.title, path: lesson.path, ...lesson.learning };
  for (const unit of lesson.learning.units as KnowledgeUnit[]) {
    assert(!knowledge[unit.id], `Duplicate knowledge ID: ${unit.id}`);
    knowledge[unit.id] = unit;
    for (const model of unit.models) {
      const record = contexts[model.nodeId] ??= { related: [] };
      const context: NodeLearningContext = { lessonKey: key, lessonTitle: lesson.title, lessonPath: lesson.path,
        figureId: lesson.figures.find(figure => figure.knowledgeId === unit.id)?.id, knowledgeId: unit.id, question: unit.question,
        principle: unit.principle, task: model.difference, objects: model.objects, boundary: unit.boundary, primary: model.primary,
        relatedPrinciples: [...new Set([...lesson.learning.relatedPrinciples, ...unit.relatedPrinciples])], applications: [...new Set([...lesson.learning.applications, ...unit.applications])] };
      if (model.primary) { assert(!record.primary, `Multiple primary contexts: ${model.nodeId}`); record.primary = context; }
      else record.related.push(context);
    }
  }
}
// Full-book invariants only apply after every batch has been accepted into the catalog.
if (Object.keys(plans).length === articles.length) {
  assert.deepEqual(Object.keys(contexts).sort(), nodeDefinitions.filter(node => node.status === 'available').map(node => node.id).sort());
  for (const [id, record] of Object.entries(contexts)) assert(record.primary, `No primary context: ${id}`);
  for (const unit of Object.values(knowledge)) {
    for (const prerequisite of unit.prerequisiteIds) assert(knowledge[prerequisite], `Missing prerequisite: ${unit.id} → ${prerequisite}`);
    for (const relation of [...unit.relatedPrinciples, ...unit.applications]) assert(plans[relation], `Missing related course: ${unit.id} → ${relation}`);
  }
  const visiting = new Set<string>(), visited = new Set<string>();
  const visit = (id: string) => { assert(!visiting.has(id), `Prerequisite cycle: ${id}`); if (visited.has(id)) return; visiting.add(id); for (const next of knowledge[id].prerequisiteIds) visit(next); visiting.delete(id); visited.add(id); };
  Object.keys(knowledge).forEach(visit);
}
assert.equal(Object.keys(lessonMedia).length, articles.length, 'No stale original lesson registry');
await writeFile('src/data/lessonMedia.json', JSON.stringify(output, null, 2) + '\n');
await writeFile('src/data/curriculumLearning.json', JSON.stringify({ edition: 'knowledge-2026-10-29', lessons: plans, units: knowledge, nodes: contexts }, null, 2) + '\n');
// Compatibility export for existing wall consumers during the migration.
await writeFile('src/data/wallLearning.json', JSON.stringify({ edition: 'knowledge-2026-10-29', lessons: Object.fromEntries(Object.entries(output).filter(([key]) => key.startsWith('wall/'))),
  nodes: Object.fromEntries(Object.entries(contexts).filter(([, record]) => record.primary?.lessonKey.startsWith('wall/')).map(([id, record]) => [id, record.primary])) }, null, 2) + '\n');
console.log(`Learning media: ${count} selected lessons; ${Object.keys(plans).length} upgraded lessons, ${Object.keys(knowledge).length} knowledge units.`);
