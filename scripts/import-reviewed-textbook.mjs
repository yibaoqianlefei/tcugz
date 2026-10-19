import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve, relative, dirname } from 'node:path';
import { articles } from './lib/textbook-catalog.mjs';

// Import the reviewed manuscript, retaining the website's teaching and model affordances.
const project = process.cwd();
const packageRoot = resolve(project, 'deliverables/教材拆分_2026-10-16/网站文本');
const auditRoot = resolve(project, 'audit-output/textbook-import-2026-10-18');
const manifest = JSON.parse(await readFile(resolve(packageRoot, 'manifest.json'), 'utf8'));
const existingArticles = new Map(articles.map(article => [`${article.group}/${article.id}`, article]));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const normalize = text => text.replace(/\r\n/g, '\n').trim();
const paragraphs = text => normalize(text).split(/\n\s*\n/).filter(block => !block.startsWith('#'));
const sections = text => {
  const chunks = normalize(text).split(/^## (.+)\n/gm);
  return Array.from({ length: (chunks.length - 1) / 2 }, (_, index) => ({ title: chunks[index * 2 + 1], body: chunks[index * 2 + 2].trim() }));
};
const section = ({ title, body }) => `## ${title}\n\n${body}`;
const introHeadings = {
  'intro-course-guide': ['构造设计贯穿设计过程', '基础与原理的学习顺序', '从作用路径到图纸表达'],
  'intro-classification': ['按使用功能分类', '按建造数量与规模认识', '按高度与层数认识', '按结构与围护体系分类'],
  'intro-grading': ['不同分级的目的', '设计工作年限与维护', '等级与标准怎样落实'],
  'intro-composition': ['承载围护交通与设备系统', '典型传力路径', '构造层次的分析方法', '环境调节与建筑表达'],
  'intro-factors': ['荷载与其他作用', '气候地形与地质条件', '使用者与使用活动', '技术经济与维护条件'],
  'intro-design-principles': ['安全适用与耐久', '节点中的多项要求', '材料施工与设备的配合'],
  'intro-drawing-standards': ['模数协调', '标志构造与实际尺寸', '轴线层高与净高', '相对标高与绝对高程', '图纸表达与索引'],
};

function adapt(reviewed, previous, article) {
  const reviewedText = normalize(reviewed);
  const previousSections = sections(previous);
  const supplements = [];
  let result;
  if (article.group === 'introduction') {
    const body = paragraphs(reviewedText);
    const titles = introHeadings[article.id];
    assert.equal(body.length, titles.length, `known introduction paragraph boundaries: ${article.id}`);
    result = `# ${article.title}\n\n${body.map((text, index) => section({ title: titles[index], body: text })).join('\n\n')}`;
  } else if (article.group === 'practice') {
    const body = paragraphs(reviewedText);
    const last = body.pop();
    const splitAt = last.indexOf('自查');
    assert(splitAt > 0, `reviewed task includes deliverables and self-check: ${article.id}`);
    const context = previousSections.find(item => /任务目标与前置知识/.test(item.title));
    const steps = previousSections.find(item => /工作步骤/.test(item.title));
    const geometry = previousSections.find(item => /几何参考例/.test(item.title));
    assert(context && steps, `existing task is actionable: ${article.id}`);
    const adapted = [context, { title: '任务内容与条件', body: body.join('\n\n') }, steps];
    if (geometry) adapted.push(geometry);
    adapted.push({ title: '提交物', body: last.slice(0, splitAt).trim() }, { title: '自评与检查', body: last.slice(splitAt).trim() });
    result = `# ${article.title}\n\n${adapted.map(section).join('\n\n')}`;
    supplements.push('保留网站任务的前置阅读和工作步骤', ...(geometry ? ['保留明确假设条件的几何参考例'] : []));
  } else {
    // The package was split at H2 chapter boundaries, so its nested H3s become page H2s.
    result = reviewedText.replace(/^(#{3,6})(?= )/gm, hashes => hashes.slice(1));
    if (article.group === 'wall' && article.id === 'index') {
      result += `\n\n${previousSections.map(section).join('\n\n')}`;
      supplements.push('保留墙体总览的学习目标、阅读顺序和剖面练习');
    }
  }

  // Keep the current, valid 3D entry points next to the imported explanatory prose.
  const modelParagraphs = paragraphs(previous).filter(block => /\]\(\/#\/node\//.test(block) && !result.includes(block));
  if (modelParagraphs.length) {
    result += `\n\n## 配套三维节点\n\n${modelParagraphs.join('\n\n')}`;
    supplements.push('保留已有三维节点及其阅读提示');
  }
  if (article.group !== 'practice' && !/^## .*自测|^## .*练习/gm.test(result)) {
    const quiz = previousSections.find(item => /自测|练习/.test(item.title) && /参考答案/.test(item.body));
    assert(quiz, `existing section has a relevant self-check: ${article.source}`);
    result += `\n\n${section(quiz)}`;
    supplements.push('保留本小节自测与参考答案');
  }
  const references = [...normalize(previous).matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)]
    .filter(match => !result.includes(match[2]));
  if (references.length) {
    result += `\n\n## 参考资料\n\n${[...new Map(references.map(match => [match[2], `- [${match[1]}](${match[2]})`])).values()].join('\n')}`;
    supplements.push('保留已有参考资料链接');
  }
  if (article.group !== 'practice' && !/参考答案/.test(result) && /^## .*自测/m.test(result)) {
    result = result.replace(/^## ([^\n]*自测[^\n]*)$/m, '## $1与参考答案');
    supplements.push('明确标注审定稿自测中已附的参考答案');
  }
  return { markdown: result + '\n', supplements };
}

assert.equal(manifest.articles.length, articles.length, 'the reviewed package covers the current site catalog');
const changes = [];
for (const entry of manifest.articles) {
  const article = existingArticles.get(`${entry.group}/${entry.id}`);
  assert(article && article.source === entry.futureSourceFile && `/lesson/${article.path}` === entry.route, `unchanged article identity: ${entry.id}`);
  const source = resolve(packageRoot, entry.articleMarkdown);
  const target = resolve(project, entry.futureSourceFile);
  assert(!relative(packageRoot, source).startsWith('..') && !relative(resolve(project, 'src/data/textbook'), target).startsWith('..'));
  const reviewedBytes = await readFile(source);
  assert.equal(sha256(reviewedBytes), entry.sha256, `reviewed file integrity: ${entry.id}`);
  const previous = await readFile(target, 'utf8');
  const { markdown, supplements } = adapt(reviewedBytes.toString('utf8'), previous, article);
  changes.push({ source: entry.futureSourceFile, reviewedFile: entry.articleMarkdown, group: entry.group, id: entry.id,
    route: entry.route, reviewedSha256: entry.sha256, beforeSha256: sha256(Buffer.from(previous)),
    importedSha256: sha256(Buffer.from(markdown)), supplements, markdown, previous });
}
if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify({ dryRun: true, articles: changes.length, supplementalSections: changes.filter(item => item.supplements.length).length }, null, 2));
} else {
  // A second run must not overwrite the original site backup or adapt an already-adapted file.
  const provenancePath = resolve(project, 'src/data/reviewedTextbookImport.json');
  try {
    await readFile(provenancePath);
    throw new Error('This reviewed edition is already imported; use the existing sources and provenance rather than importing twice.');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  for (const change of changes) {
    const backup = resolve(auditRoot, 'before', change.source);
    await mkdir(dirname(backup), { recursive: true });
    await copyFile(resolve(project, change.source), backup);
    await writeFile(resolve(project, change.source), change.markdown, 'utf8');
  }
  const records = changes.map(({ markdown, previous, ...record }) => record);
  const provenance = { edition: 'reviewed-2026-10-16', importedOn: '2026-10-18', packageManifest: relative(project, resolve(packageRoot, 'manifest.json')).replaceAll('\\', '/'),
    policy: '审定正文完整保留 仅适配标题和任务结构 保留网站小节自测 三维节点与参考资料', articles: records };
  await writeFile(provenancePath, JSON.stringify(provenance, null, 2) + '\n', 'utf8');
  await writeFile(resolve(auditRoot, 'import-report.json'), JSON.stringify(provenance, null, 2) + '\n', 'utf8');
  console.log(`Imported ${records.length} reviewed textbook articles; original website sources backed up in ${relative(project, auditRoot)}/before.`);
}
