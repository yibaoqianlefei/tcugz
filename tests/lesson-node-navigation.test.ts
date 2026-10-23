import assert from 'node:assert/strict';
import catalog from '../src/data/lessonMedia.json';
import { lessonNodeRoute, nodeReturnTarget, recalledLessonVisit, rememberLessonVisit, validLessonVisit } from '../src/utils/lessonNodeNavigation';

let placements = 0;
for (const lesson of Object.values(catalog)) {
  for (const figure of lesson.figures) {
    const route = new URL(lessonNodeRoute(figure.nodeId, lesson.path, figure.id), 'https://example.test');
    const target = nodeReturnTarget(route.pathname, route.search);
    assert.equal(target.to, `/lesson/${lesson.path}?model=${figure.id}`);
    assert.equal(target.label, '返回教材章节');
    placements++;
  }
}
const path = 'principles/acoustic.html';
const visit = { path, scrollTop: 1250, viewportWidth: 1440, directoryOpen: false, figureId: 'figure-1' };
const figure = catalog['principles/acoustic'].figures[0];
const nodePath = `/node/${figure.nodeId}`;
const search = `?${new URLSearchParams({ lesson: path, figure: figure.id })}`;
assert.deepEqual(nodeReturnTarget(nodePath, search, { lessonVisit: visit }).state, { lessonRestore: visit });
assert.equal(nodeReturnTarget(nodePath, search, { lessonVisit: { ...visit, path: 'wrong.html' } }).state, undefined);
for (const invalid of ['https://evil.test', '../library', 'principles/missing.html']) {
  assert.equal(nodeReturnTarget(nodePath, `?lesson=${encodeURIComponent(invalid)}`).to, '/library');
}
assert.equal(nodeReturnTarget('/node/another-node', search).to, '/library', 'mismatched figure/node cannot claim a model return target');
assert.equal(nodeReturnTarget(nodePath, `?lesson=${path}&figure=missing`).to, '/library');
assert.equal(nodeReturnTarget(nodePath, `?lesson=${path}`).to, `/lesson/${path}`, 'ordinary textbook links also return to the chapter');
assert.equal(nodeReturnTarget(nodePath, '', { libraryReturnTo: '/library?category=stairs&q=预制' }).to, '/library?category=stairs&q=预制');
assert.equal(nodeReturnTarget(nodePath, '').label, '返回构造节点');
assert.equal(nodeReturnTarget(nodePath, '', { libraryReturnTo: '//evil.test' }).to, '/library');
for (const invalid of [{ ...visit, scrollTop: NaN }, { ...visit, scrollTop: -1 }, { ...visit, viewportWidth: 0 }, { ...visit, directoryOpen: 'true' }, { ...visit, openDetails: [NaN] }, { ...visit, openDetails: [-1] }]) {
  assert.equal(validLessonVisit(invalid, path), undefined);
}
rememberLessonVisit('visit-a', visit);
rememberLessonVisit('visit-b', { ...visit, scrollTop: 3000 });
assert.equal(recalledLessonVisit('visit-a', path)?.scrollTop, 1250);
assert.equal(recalledLessonVisit('visit-b', path)?.scrollTop, 3000);
assert.equal(recalledLessonVisit('visit-a', 'introduction/intro-course-guide.html'), undefined);
console.log(`Lesson/node return checks passed: ${placements} audited bindings, library fallback, source validation and separate reading positions.`);
