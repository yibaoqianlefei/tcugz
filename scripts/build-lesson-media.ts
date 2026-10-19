import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { nodeDefinitions } from '../src/data/nodeDefinitions';
import { articles } from './lib/textbook-catalog.mjs';
import { lessonMedia } from './lib/lesson-media-catalog.mjs';

// Resolve authored teaching connections against the same registry as the node library.
// The generated JSON is consumed by both standalone readers and the React explorer.
const output: Record<string, unknown> = {};
const nodes = new Map(nodeDefinitions.map(node => [node.id, node]));
const text = node => node.value ?? (node.children ?? []).map(text).join('');
let figures = 0;
for (const article of articles) {
  const key = `${article.group}/${article.id}`;
  const entry = lessonMedia[key];
  assert(entry, `Missing lesson media plan: ${key}`);
  const markdown = await readFile(article.source, 'utf8');
  const ast = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const headings = ast.children.filter(node => node.type === 'heading' && node.depth !== 1).map((node, index) => ({ title: text(node), id: `section-${index + 1}` }));
  const resolved = await Promise.all(entry.figures.map(async (figure, index) => {
    const node = nodes.get(figure.nodeId);
    assert(node?.status === 'available', `Unavailable node: ${key} → ${figure.nodeId}`);
    assert(node.diagram?.path, `A textbook figure needs a real diagram: ${key} → ${figure.nodeId}`);
    const anchors = headings.filter(heading => heading.title.includes(figure.anchor));
    assert.equal(anchors.length, 1, `Figure must have one semantic section: ${key} → ${figure.anchor}`);
    const paths = [node.diagram.path, ...(node.model ? [node.model.path] : []), ...(node.variants ?? []).map(variant => variant.model.path)];
    for (const path of paths.filter(Boolean)) await access(`public/${path.replace(/^\/+/, '')}`);
    assert(figure.caption.length > 20 && figure.focus.length >= 2, `Figure needs teaching guidance: ${key}`);
    figures++;
    return {
      ...figure,
      id: `figure-${index + 1}`,
      number: String(index + 1).padStart(2, '0'),
      sectionId: anchors[0].id,
      sectionTitle: anchors[0].title,
      nodeTitle: node.title,
      image: node.diagram.path,
      hasModel: Boolean(node.model || node.variants?.length),
      layerCount: node.layerConfig?.layers.length ?? 0,
    };
  }));
  output[key] = { key, title: article.title, path: article.path, intro: entry.intro, readingMinutes: Math.max(2, Math.ceil(markdown.replace(/\s/g, '').length / 450)), figures: resolved };
}
assert.equal(Object.keys(lessonMedia).length, articles.length, 'No stale lesson plans');
await writeFile('src/data/lessonMedia.json', JSON.stringify(output, null, 2) + '\n', 'utf8');
console.log(`Digital textbook media: ${Object.keys(output).length} lessons, ${figures} contextual figures.`);
