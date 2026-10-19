import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { articles } from '../scripts/lib/textbook-catalog.mjs';

const provenance = JSON.parse(await readFile('src/data/reviewedTextbookImport.json', 'utf8'));
const teachingRevision = JSON.parse(await readFile('src/data/textbookTeachingRevision.json', 'utf8'));
const manifest = JSON.parse(await readFile(provenance.packageManifest, 'utf8'));
const packageRoot = dirname(provenance.packageManifest);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const compact = text => text.replace(/\s/g, '');
const parse = text => unified().use(remarkParse).use(remarkGfm).parse(text);
const plain = node => node.value?.replace(/^\[![^\]]+\]\s*/, '').replace(/\*\*/g, '') ?? (node.children ?? []).map(plain).join('');
const text = node => node.type === 'heading' ? '' : node.value !== undefined ? plain(node) : (node.children ?? []).map(text).join('');
const renderedText = html => html.replace(/<!-- textbook-enhancement:start -->[\s\S]*?<!-- textbook-enhancement:end -->/g, '').replace(/<p class="lesson-callout-label">[\s\S]*?<\/p>/g, '').replace(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/g, '').replace(/<[^>]*>/g, '').replace(/\*\*/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const inOrder = (source, target) => { const chars = [...source]; let i = 0; for (const char of target) if (char === chars[i]) i++; return i === chars.length; };
const sentencesPreserved = (source, target, label) => {
  assert(inOrder(source, target), `${label}: original prose order`);
  for (const sentence of new Set(source.match(/[^。！？]+[。！？]?/g) ?? [])) assert(target.split(sentence).length >= source.split(sentence).length, `${label}: exact original sentence ${sentence.slice(0, 35)}`);
};
const links = ast => { const found = []; const visit = node => { if (node.type === 'link') found.push([plain(node), node.url]); for (const child of node.children ?? []) visit(child); }; visit(ast); return found; };
assert.equal(provenance.articles.length, 54);
assert.equal(new Set(provenance.articles.map(article => article.source)).size, articles.length);
for (const record of provenance.articles) {
  const entry = manifest.articles.find(item => item.group === record.group && item.id === record.id);
  const original = await readFile(join(packageRoot, entry.articleMarkdown));
  const imported = await readFile(record.source);
  assert.equal(digest(original), record.reviewedSha256, `the imported edition is the audited edition: ${record.id}`);
  const revision = teachingRevision.articles.find(item => item.source === record.source);
  assert.equal(digest(imported), revision?.websiteSha256 ?? record.importedSha256, `source and recorded website edition agree: ${record.id}`);
  const reviewedAst = parse(original.toString());
  const websiteAst = parse(imported.toString());
  const visible = compact(text(websiteAst));
  if (revision) {
    assert.equal(revision.importedSha256, record.importedSha256, 'original import provenance remains immutable');
    const baseline = await readFile(revision.baselinePath);
    assert.equal(digest(baseline), record.importedSha256, `frozen original website import: ${record.id}`);
    const baselineAst = parse(baseline.toString());
    assert.deepEqual(websiteAst.children.filter(node => node.type === 'heading').map(node => [node.depth, plain(node)]), baselineAst.children.filter(node => node.type === 'heading').map(node => [node.depth, plain(node)]), `original headings retained: ${record.id}`);
    assert.deepEqual(links(websiteAst), links(baselineAst), `all original links retained: ${record.id}`);
    sentencesPreserved(compact(text(baselineAst)), visible, `teaching revision ${record.id}`);
  }
  const route = record.route.slice('/lesson/'.length);
  const html = await readFile(`public/lesson/${route}`, 'utf8');
  const rendered = compact(renderedText(html.match(/<article class="article">([\s\S]*?)<\/article>/)?.[1] ?? ''));
  for (const block of reviewedAst.children.filter(node => node.type !== 'heading')) {
    const expected = compact(text(block));
    if (revision) {
      sentencesPreserved(expected, visible, `reviewed prose survives teaching layout: ${record.id}`);
      sentencesPreserved(expected, rendered, `reviewed prose reaches the actual reader: ${record.id}`);
    } else {
      assert(visible.includes(expected), `reviewed prose survives website adaptation: ${record.id} ${expected.slice(0, 35)}`);
      assert(rendered.includes(expected), `reviewed prose reaches the actual reader: ${record.id} ${expected.slice(0, 35)}`);
    }
  }
}
console.log('Reviewed textbook import passed: all 54 audited article bodies survive adaptation and reach the generated readers.');
