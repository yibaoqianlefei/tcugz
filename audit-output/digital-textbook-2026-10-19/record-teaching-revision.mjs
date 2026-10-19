import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { runInNewContext } from 'node:vm';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { articles } from '../../scripts/lib/textbook-catalog.mjs';

// Freeze the reproducible original import; never overwrite its provenance.
const provenance = JSON.parse(await readFile('src/data/reviewedTextbookImport.json', 'utf8'));
const script = await readFile('scripts/import-reviewed-textbook.mjs', 'utf8');
const { adapt } = runInNewContext(script.slice(script.indexOf('const normalize ='), script.indexOf('assert.equal(manifest.articles.length')) + ';({adapt})', { assert });
const digest = value => createHash('sha256').update(value).digest('hex');
const parse = value => unified().use(remarkParse).use(remarkGfm).parse(value);
const text = node => node.type === 'heading' ? '' : node.value?.replace(/^\[![^\]]+\]\s*/, '').replace(/\*\*/g, '') ?? (node.children ?? []).map(text).join('');
const compact = value => value.replace(/\s/g, '');
const subsequence = (source, target) => { let i = 0; for (const char of target) if (char === source[i]) i++; return i === source.length; };
const entries = [];
for (const record of provenance.articles) {
  const current = await readFile(record.source, 'utf8');
  if (digest(current) === record.importedSha256) continue;
  const reviewed = await readFile(`deliverables/教材拆分_2026-10-16/网站文本/${record.reviewedFile}`, 'utf8');
  const before = await readFile(`audit-output/textbook-import-2026-10-18/before/${record.source}`, 'utf8');
  const baseline = adapt(reviewed, before, articles.find(article => article.source === record.source)).markdown;
  assert.equal(digest(baseline), record.importedSha256, `original import is reproducible: ${record.source}`);
  const baseText = compact(text(parse(baseline)));
  const currentText = compact(text(parse(current)));
  assert(subsequence(baseText, currentText), `original text order preserved: ${record.source}`);
  for (const sentence of new Set(baseText.match(/[^。！？]+[。！？]?/g) ?? [])) {
    assert(currentText.split(sentence).length >= baseText.split(sentence).length, `every exact original sentence retained: ${record.source} ${sentence.slice(0, 25)}`);
  }
  const baselinePath = `audit-output/digital-textbook-2026-10-19/source-baseline/${record.source}`;
  await mkdir(dirname(baselinePath), { recursive: true });
  await writeFile(baselinePath, baseline);
  entries.push({ source: record.source, importedSha256: record.importedSha256, websiteSha256: digest(current), baselinePath, change: '保留工作区教学提示及强调格式调整；原句及其出现次数、顺序完整保留' });
}
await writeFile('src/data/textbookTeachingRevision.json', JSON.stringify({ date: '2026-10-19', originalImport: 'src/data/reviewedTextbookImport.json', policy: '原始导入记录不变；独立记录教学排版版本，不接受原句删除或改写', articles: entries }, null, 2) + '\n');
console.log(`Recorded ${entries.length} teaching-format revisions with exact sentence and order preservation.`);
