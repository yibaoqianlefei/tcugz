import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { articles } from '../scripts/lib/textbook-catalog.mjs';
import { lessonMedia as authored } from '../scripts/lib/lesson-media-catalog.mjs';
import { lessonModelGuidance } from '../scripts/lib/lesson-model-guidance.mjs';
import { formalizeCourse } from '../scripts/lib/course-paths.mjs';
import { createHash } from 'node:crypto';

const media = JSON.parse(await readFile('src/data/lessonMedia.json', 'utf8'));
const audit = JSON.parse(await readFile('audit-output/digital-textbook-2026-10-19/mapping-audit-final.json', 'utf8'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const modelAudit = JSON.parse(await readFile('audit-output/model-only-textbook-2026-10-21/model-guidance-audit.json', 'utf8'));
assert.equal(digest(JSON.stringify(lessonModelGuidance)), modelAudit.guidanceSha256, 'model-only guidance matches the independently reviewed revision');
assert.equal(digest(await readFile(modelAudit.originalAudit)), modelAudit.originalAuditSha256, 'original model/section evidence remains frozen');
assert.equal(digest(await readFile('src/data/lessonMedia.json')), audit.mediaCatalogSha256, 'the generated media matches the independently reviewed edition');
assert.equal(digest(await readFile('scripts/lib/lesson-media-catalog.mjs')), audit.authoredPlanSha256, 'the authored plan matches the reviewed edition');
assert.equal(Object.keys(media).length, articles.length);
assert.deepEqual(Object.keys(lessonModelGuidance).sort(), Object.keys(media).sort(), 'model teaching guidance covers exactly the same lessons');
let figureCount = 0;
for (const article of articles) {
  const key = `${article.group}/${article.id}`;
  const lesson = media[key];
  const guidance = lessonModelGuidance[key];
  assert.equal(lesson.title, article.title);
  assert.equal(lesson.path, article.path);
  assert.equal(lesson.figures.length, authored[key].figures.length);
  assert.equal(guidance.figures.length, lesson.figures.length);
  const html = await readFile(`public/lesson/${article.path}`, 'utf8');
  assert(html.includes('lesson-reading-guide'), `lesson has observation guidance: ${key}`);
  assert(html.includes('lesson-outline'), `lesson has navigation: ${key}`);
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
  assert(main && !/<img\b/.test(main), `chapter uses models without cover or thumbnail images: ${key}`);
  const enhancedFigures = [...html.matchAll(/<figure class="lesson-figure"[^>]*>/g)];
  assert.equal(enhancedFigures.length, lesson.figures.length, `every planned figure reaches the reader: ${key}`);
  for (const [index, figure] of lesson.figures.entries()) {
    figureCount++;
    const reviewed = audit.entries.find(entry => entry.key === key && entry.figureId === figure.id);
    assert.equal(reviewed?.verdict, 'accepted', `each placement was reviewed: ${key} ${figure.id}`);
    assert.equal(digest(JSON.stringify(figure)), reviewed.figureSha256, `reviewed caption and teaching scope: ${key} ${figure.id}`);
    assert.equal(digest(await readFile(article.source)), reviewed.sourceSha256, `reviewed source chapter: ${key}`);
    assert.equal(digest(await readFile(`public${figure.image}`)), reviewed.imageSha256, `reviewed original drawing: ${key}`);
    for (const model of reviewed.modelEvidence) assert.equal(digest(await readFile(`public${model.modelAsset}`)), model.modelSha256, `reviewed real model: ${key} ${model.variant}`);
    await access(`public/${figure.image.replace(/^\/+/, '')}`);
    const modelGuidance = guidance.figures[index];
    const modelReview = modelAudit.entries.find(entry => entry.key === key && entry.figureId === figure.id);
    assert.equal(modelReview?.guidanceSha256, digest(JSON.stringify(modelGuidance)), `model-only observation scope was independently reviewed: ${key}`);
    assert.equal(modelReview.nodeId, figure.nodeId);
    assert.equal(modelReview.sectionId, figure.sectionId);
    assert.equal(modelGuidance.nodeId, figure.nodeId, `model-only text retains the audited node: ${key}`);
    assert(figure.hasModel && reviewed.modelEvidence.length > 0, `the inline placement has an actual audited model: ${key}`);
    assert(modelGuidance.caption.length > 20 && modelGuidance.focus.length >= 2, `model observation is guided: ${key}`);
    assert(!/原图|图中|图示|此图|这张图|图形|沿图|张节点图/.test(modelGuidance.caption + modelGuidance.focus.join('')), `guidance does not depend on an absent drawing: ${key}`);
    assert(html.includes(`data-lesson-model="${figure.id}" data-node-id="${figure.nodeId}"`));
    assert(html.includes(`id="${figure.id}" data-textbook-enhancement="figure" data-node-id="${figure.nodeId}"`));
    const sectionStart = html.indexOf(`id="${figure.sectionId}"`);
    const placement = html.indexOf(`<figure class="lesson-figure" id="${figure.id}"`);
    assert(sectionStart >= 0 && placement > sectionStart, `figure follows its real semantic heading: ${key}`);
    const following = html.slice(sectionStart + figure.sectionId.length + 6, placement);
    assert(!/<h[23]\b/.test(following), `figure remains within its assigned section: ${key}`);
    const subpath = formalizeCourse(html, '/hosted/');
    assert(subpath.includes('href="/hosted/styles/lesson-model-viewer.css"'), `inline viewer stylesheet works on Pages: ${key}`);
    assert(subpath.includes('href="/hosted/styles/model-ui.css"'), `shared node/reader controls work on Pages: ${key}`);
    const nodeLink = `/hosted/#/node/${figure.nodeId}?${new URLSearchParams({ lesson: lesson.path, figure: figure.id })}`.replaceAll('&', '&amp;');
    assert(subpath.includes(`href="${nodeLink}"`), `standalone node links preserve the audited source on Pages: ${key}`);
    assert(html.includes('data-lesson-view="node">打开节点 ↗</a>'), `inline action opens the node workbench: ${key}`);
  }
}
const corpus = JSON.parse(await readFile('public/data/companion-knowledge.json', 'utf8'));
for (const source of corpus.sources.filter(source => source.kind === 'course')) {
  assert(!/放大图解|图解研读|转动三维模型|展开模型研读|转动构造模型|查看参考答案 · 先独立作答/.test(source.text), `reading controls do not enter assistant knowledge: ${source.id}`);
}
console.log(`Digital textbook checks passed: ${articles.length} lessons, ${figureCount} audited inline model placements, picture-free readers, contextual guidance and hosted paths.`);
