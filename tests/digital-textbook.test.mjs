import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { articles } from '../scripts/lib/textbook-catalog.mjs';
import { lessonMedia as authored } from '../scripts/lib/lesson-media-catalog.mjs';
import { formalizeCourse } from '../scripts/lib/course-paths.mjs';
import { createHash } from 'node:crypto';

const media = JSON.parse(await readFile('src/data/lessonMedia.json', 'utf8'));
const audit = JSON.parse(await readFile('audit-output/digital-textbook-2026-10-19/mapping-audit-final.json', 'utf8'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(digest(await readFile('src/data/lessonMedia.json')), audit.mediaCatalogSha256, 'the generated media matches the independently reviewed edition');
assert.equal(digest(await readFile('scripts/lib/lesson-media-catalog.mjs')), audit.authoredPlanSha256, 'the authored plan matches the reviewed edition');
assert.equal(Object.keys(media).length, articles.length);
let figureCount = 0;
for (const article of articles) {
  const key = `${article.group}/${article.id}`;
  const lesson = media[key];
  assert.equal(lesson.title, article.title);
  assert.equal(lesson.path, article.path);
  assert.equal(lesson.figures.length, authored[key].figures.length);
  const html = await readFile(`public/lesson/${article.path}`, 'utf8');
  assert(html.includes('lesson-reading-guide'), `lesson has observation guidance: ${key}`);
  assert(html.includes('lesson-outline'), `lesson has navigation: ${key}`);
  const enhancedFigures = [...html.matchAll(/<figure class="lesson-figure"[^>]*>/g)];
  assert.equal(enhancedFigures.length, lesson.figures.length, `every planned figure reaches the reader: ${key}`);
  for (const figure of lesson.figures) {
    figureCount++;
    const reviewed = audit.entries.find(entry => entry.key === key && entry.figureId === figure.id);
    assert.equal(reviewed?.verdict, 'accepted', `each placement was reviewed: ${key} ${figure.id}`);
    assert.equal(digest(JSON.stringify(figure)), reviewed.figureSha256, `reviewed caption and teaching scope: ${key} ${figure.id}`);
    assert.equal(digest(await readFile(article.source)), reviewed.sourceSha256, `reviewed source chapter: ${key}`);
    assert.equal(digest(await readFile(`public${figure.image}`)), reviewed.imageSha256, `reviewed original drawing: ${key}`);
    for (const model of reviewed.modelEvidence) assert.equal(digest(await readFile(`public${model.modelAsset}`)), model.modelSha256, `reviewed real model: ${key} ${model.variant}`);
    await access(`public/${figure.image.replace(/^\/+/, '')}`);
    assert(html.includes(`id="${figure.id}" data-textbook-enhancement="figure" data-node-id="${figure.nodeId}"`));
    const sectionStart = html.indexOf(`id="${figure.sectionId}"`);
    const placement = html.indexOf(`<figure class="lesson-figure" id="${figure.id}"`);
    assert(sectionStart >= 0 && placement > sectionStart, `figure follows its real semantic heading: ${key}`);
    const following = html.slice(sectionStart + figure.sectionId.length + 6, placement);
    assert(!/<h[23]\b/.test(following), `figure remains within its assigned section: ${key}`);
    const subpath = formalizeCourse(html, '/hosted/');
    assert(subpath.includes(`src="/hosted${figure.image}"`), `hosted drawing source: ${key}`);
    assert(subpath.includes(`href="/hosted${figure.image}"`), `hosted original drawing: ${key}`);
  }
}
const corpus = JSON.parse(await readFile('public/data/companion-knowledge.json', 'utf8'));
for (const source of corpus.sources.filter(source => source.kind === 'course')) {
  assert(!/放大图解|图解研读|转动三维模型|查看参考答案 · 先独立作答/.test(source.text), `reading controls do not enter assistant knowledge: ${source.id}`);
}
console.log(`Digital textbook checks passed: ${articles.length} lesson plans, ${figureCount} real figures, contextual placement, hosted assets and clean knowledge sources.`);
