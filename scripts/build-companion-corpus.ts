import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { nodeDefinitions } from '../src/data/nodeDefinitions';
import { featuredCase, legacySavoyeCase } from '../src/data/caseStudies';
import { trainingQuestions } from '../src/data/training';
import { canonicalName } from '../src/utils/nameUtils';
import type { CompanionCorpus, KnowledgeSource } from '../src/companion/types';

const sources: KnowledgeSource[] = [];
for (const node of nodeDefinitions.filter(node => node.status === 'available')) {
  const route = `/node/${node.id}`;
  sources.push({ id: `node:${node.id}`, kind: 'node', title: node.title, route, text: node.description, nodeId: node.id });
  for (const layer of node.layerConfig?.layers ?? []) sources.push({
    id: `component:${node.id}:${layer.objectName}`, kind: 'component', title: `${node.title} · ${layer.name}`, route,
    text: `材料：${layer.material}\n厚度或尺寸（卡片记录）：${layer.thickness}\n${layer.description}`,
    nodeId: node.id, objectName: layer.objectName,
    aliases: [...new Set([...(layer.aliases ?? []), canonicalName(layer.objectName, node.model?.groups), ...(layer.aliases ?? []).map(name => canonicalName(name, node.model?.groups))])],
  });
  for (const variant of node.variants ?? []) for (const card of variant.componentKnowledge ?? []) sources.push({
    id: `component:${node.id}:${variant.id}:${card.objectName}`, kind: 'component', route,
    title: `${node.title} · ${variant.title} · ${card.title}`, nodeId: node.id, variantId: variant.id,
    objectName: card.objectName, aliases: [...(card.aliases ?? []), canonicalName(card.objectName)],
    text: [card.material && `材料：${card.material}`, card.construction, card.description].filter(Boolean).join('\n'),
  });
}
for (const study of [featuredCase, legacySavoyeCase]) for (const topic of study.topics) sources.push({
  id: `case:${study.id}:${topic.id}`, kind: 'case', title: `${study.title} · ${topic.title}`,
  route: `/curriculum/cases/${study.id}?topic=${topic.id}`, caseId: study.id, topicId: topic.id,
  text: `${topic.summary}\n${topic.observation}\n${topic.principle}\n模型说明：${study.modelNote}\n原始资料：${study.sources.map(source => source.title).join('；')}`,
});
const documents = JSON.parse(await readFile('src/data/curriculumDocuments.json', 'utf8')).documents as string[];
const strip = (html: string) => html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
for (const path of documents) {
  const html = await readFile(`public/lesson/${path}`, 'utf8');
  const title = strip(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? path);
  const empty = /<section class="empty"/.test(html);
  const body = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
  const clean = body.replace(/<(header|nav|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<div class="page-next">[\s\S]*$/i, '');
  sources.push({ id: `course:${path}`, kind: 'course', title, route: `/lesson/${path}`, empty, text: empty ? '该章节正文尚未提供。' : strip(clean).slice(0, 12000) });
}
const corpus: CompanionCorpus = {
  version: 1, sources,
  // No correct choices, mesh mappings or answers in the help corpus.
  training: trainingQuestions.map(({ id, mode, title, prompt, hint, explanation }) => ({ id, mode, title, prompt, hint, explanation })),
};
await mkdir('public/data', { recursive: true });
await writeFile('public/data/companion-knowledge.json', JSON.stringify(corpus));
console.log(`Companion corpus: ${sources.length} sources, ${corpus.training.length} curated hints`);
