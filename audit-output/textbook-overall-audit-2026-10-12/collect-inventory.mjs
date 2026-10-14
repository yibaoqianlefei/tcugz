import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { articles } from '../../scripts/lib/textbook-catalog.mjs';

const output = 'audit-output/textbook-overall-audit-2026-10-12';
await mkdir(output, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await readFile('src/data/curriculumDocuments.json', 'utf8'));
const adoption = JSON.parse(await readFile('audit-output/textbook-content-2026-10-12/内容实施对应表.json', 'utf8'));
const walk = (node, visit) => { visit(node); for (const child of node.children ?? []) walk(child, visit); };
const inventory = [];
for (const article of articles) {
  const markdown = await readFile(article.source, 'utf8');
  const ast = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const counts = {}; const links = []; const headings = [];
  walk(ast, node => {
    counts[node.type] = (counts[node.type] ?? 0) + 1;
    if (node.type === 'link') links.push(node.url);
    if (node.type === 'heading') headings.push({ depth: node.depth, title: node.children.map(item => item.value ?? '').join('') });
  });
  const lesson = await readFile(`public/lesson/${article.path}`, 'utf8');
  const formal = await readFile(`public/curriculum/${article.path}`, 'utf8');
  const adopted = adoption.articles.find(item => item.route === `/lesson/${article.path}`);
  inventory.push({ ...article, chineseCharacters: (markdown.match(/[\u3400-\u9fff]/g) ?? []).length,
    sourceHash: hash(markdown), renderedHash: hash(lesson), formalEqualsLesson: lesson === formal,
    headings, paragraphs: counts.paragraph ?? 0, tables: counts.table ?? 0, images: counts.image ?? 0,
    inlineCode: counts.inlineCode ?? 0, code: counts.code ?? 0,
    links, chapterLinks: links.filter(url => url.startsWith('/lesson/')), modelLinks: links.filter(url => url.startsWith('/#/node/')),
    externalLinks: links.filter(url => /^https?:/.test(url)),
    explicitObjectivesHeading: headings.some(item => /学习目标|任务目标/.test(item.title)),
    selfCheckHeading: headings.some(item => /自测|练习.*参考/.test(item.title)),
    sourceBlocks: adopted?.source_blocks ?? [],
  });
}
async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) result.push(...await files(path));
    else result.push(path);
  }
  return result;
}
const snapshot = {};
for (const directory of ['src', 'scripts', 'previews', 'public/lesson', 'public/curriculum', 'public/data']) {
  for (const path of await files(directory)) snapshot[path] = hash(await readFile(path));
}
const original = hash(await readFile('D:/构造相关内容/建筑构造上册讲义-李峰.doc'));
const groups = Object.fromEntries([...new Set(inventory.map(item => item.group))].map(group => {
  const items = inventory.filter(item => item.group === group);
  return [group, { articles: items.length, chineseCharacters: items.reduce((sum, item) => sum + item.chineseCharacters, 0),
    tables: items.reduce((sum, item) => sum + item.tables, 0), images: items.reduce((sum, item) => sum + item.images, 0),
    pagesWithModelLinks: items.filter(item => item.modelLinks.length).length, pagesWithExternalSources: items.filter(item => item.externalLinks.length).length }];
}));
const data = { date: '2026-10-12', sourceSha256: original, originalMatchesAdoption: original === adoption.original_source_sha256,
  articles: inventory, groups, documents: manifest.documents,
  totals: { articles: inventory.length, routes: manifest.documents.length, chineseCharacters: inventory.reduce((sum, item) => sum + item.chineseCharacters, 0),
    images: inventory.reduce((sum, item) => sum + item.images, 0), tables: inventory.reduce((sum, item) => sum + item.tables, 0),
    pagesWithModelLinks: inventory.filter(item => item.modelLinks.length).length, uniqueLinkedModels: new Set(inventory.flatMap(item => item.modelLinks)).size,
    pagesWithExternalSources: inventory.filter(item => item.externalLinks.length).length, explicitObjectivesHeadings: inventory.filter(item => item.explicitObjectivesHeading).length,
    selfCheckHeadings: inventory.filter(item => item.selfCheckHeading).length, formalEqualsLesson: inventory.every(item => item.formalEqualsLesson) },
};
await writeFile(`${output}/inventory.json`, JSON.stringify(data, null, 2) + '\n');
await writeFile(`${output}/content-snapshot-before.json`, JSON.stringify(snapshot, null, 2) + '\n');
console.log(JSON.stringify({ totals: data.totals, groups: data.groups, originalMatchesAdoption: data.originalMatchesAdoption }, null, 2));
