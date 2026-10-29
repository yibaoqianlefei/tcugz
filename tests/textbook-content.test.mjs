import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { articles, groups, modules } from '../scripts/lib/textbook-catalog.mjs';
import { formalizeCourse } from '../scripts/lib/course-paths.mjs';
import { nodeDefinitions } from '../src/data/nodeDefinitions.ts';

const manifest = JSON.parse(await readFile('src/data/curriculumDocuments.json', 'utf8'));
const documents = new Set(manifest.documents);
const nodes = new Set(nodeDefinitions.map(node => node.id));
assert.equal(documents.size, manifest.documents.length, 'no duplicate course paths');
assert.equal(new Set(articles.map(article => article.path)).size, articles.length);
const cjk = text => [...text.matchAll(/[\u3400-\u9fff]/g)].map(match => match[0]).join('');
const countClass = (html, name) => [...html.matchAll(/class="([^"]+)"/g)].filter(match => match[1].split(/\s+/).includes(name)).length;
const walk = (node, visit) => { visit(node); for (const child of node.children ?? []) walk(child, visit); };

for (const article of articles) {
  assert(documents.has(article.path), `article is routable: ${article.path}`);
  const markdown = await readFile(article.source, 'utf8');
  const ast = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  assert(ast.children[0]?.type === 'heading' && ast.children[0].depth === 1, `source has title: ${article.source}`);
  assert(cjk(markdown).length >= 300, `substantial body: ${article.source}`);
  assert(ast.children.filter(node => node.type === 'heading' && node.depth === 2).length >= 3, `organized sections: ${article.source}`);
  if (article.group === 'practice') assert(/提交物/.test(markdown) && /自评/.test(markdown), `usable task: ${article.source}`);
  else assert(/自测|练习/.test(markdown) && /参考答案/.test(markdown), `self-check and answers: ${article.source}`);
  assert(!/\bP\d{4}\b|暂无内容|TODO|待编写/.test(markdown), `student prose has no internal placeholders: ${article.source}`);
  walk(ast, node => {
    if (node.type !== 'link') return;
    if (node.url.startsWith('/lesson/')) assert(documents.has(node.url.slice('/lesson/'.length).split('#')[0]), `cross-reference exists: ${article.source} → ${node.url}`);
    else if (node.url.startsWith('/#/node/')) assert(nodes.has(node.url.slice('/#/node/'.length)), `model exists: ${node.url}`);
    else assert(/^https?:\/\//.test(node.url) || node.url.startsWith('#') || node.url === '/#/games' || /^\/#\/\?section=(introduction|principles)$/.test(node.url), `recognized link: ${node.url}`);
  });
  const html = await readFile(`public/lesson/${article.path}`, 'utf8');
  const legacy = await readFile(`public/curriculum/${article.path}`, 'utf8');
  assert.equal(html, legacy, `all formal readers are synchronized: ${article.path}`);
  assert(!html.includes('class="empty"'), `body replaced placeholder: ${article.path}`);
  const body = html.match(/<article class="article">([\s\S]*?)<\/article>/)?.[1];
  assert(body, `body rendered: ${article.path}`);
  let expected = '';
  for (const node of ast.children.slice(1)) walk(node, child => { if (child.type === 'text' || child.type === 'inlineCode' || child.type === 'code') expected += child.value; });
  const originalBody = body.replace(/<!-- textbook-enhancement:start -->[\s\S]*?<!-- textbook-enhancement:end -->/g, '');
  assert.equal(cjk(originalBody.replace(/<[^>]+>/g, '')), cjk(expected), `no source text silently lost: ${article.path}`);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  for (const link of html.matchAll(/href="#([^"]+)"/g)) assert(ids.has(link[1]), `in-page index target exists: ${article.path}#${link[1]}`);
}

for (const path of documents) {
  const html = await readFile(`public/lesson/${path}`, 'utf8');
  assert(/class="page-head"|class="wall-intro"/.test(html), `iframe can recognize: ${path}`);
  assert(!html.includes('暂无内容'), `directory status matches open content: ${path}`);
  for (const match of html.matchAll(/href="\/lesson\/([^"#?]+)(?:[^" ]*)"/g)) {
    if (match[1].endsWith('.html')) assert(documents.has(match[1]), `directory link exists: ${path} → ${match[1]}`);
    else await readFile(`public/lesson/${match[1]}`);
  }
}
for (const group of [...Object.values(groups), ...Object.values(modules)]) for (const topic of group.topics) {
  if ('available' in topic) assert.equal(topic.available, true, `content metadata enabled: ${topic.id}`);
}
const wall = await readFile('public/lesson/wall/index.html', 'utf8');
assert.equal(countClass(wall, 'chapter-card'), modules.wall.topics.length, 'custom wall directory includes every topic');
for (const [id, module] of Object.entries(modules)) {
  if (id === 'wall') continue;
  const path = `basics/${id}/index.html`;
  const html = await readFile(`public/lesson/${path}`, 'utf8');
  assert.equal(html, await readFile(`public/curriculum/${path}`, 'utf8'), `chapter directory outputs stay synchronized: ${id}`);
  assert.equal(countClass(html, 'chapter-card'), module.topics.length, `all chapter entries remain available: ${id}`);
  for (const topic of module.topics) assert(html.includes(`href="/lesson/basics/${id}/${topic.id}.html"`), `directory opens real article: ${id}/${topic.id}`);
  assert(html.includes(`>${module.title}</h1>`), `chapter title preserved: ${id}`);
  assert(!html.includes('chapter-sketch'), `chapter directory has no decorative card icons: ${id}`);
  assert(!html.includes('/images/chapters/'), `chapter cover images are removed: ${id}`);
  assert(!html.includes('查看三维节点'), `abstract artwork has no model actions: ${id}`);
}
const homepage = await readFile('previews/homepage-v1.html', 'utf8');
assert(homepage.includes('intro-course-guide.html') && homepage.includes('basics/deformation-joint/index.html'));
assert(!homepage.includes('暂无内容'));
for (const id of ['introduction', 'principles']) {
  assert(!homepage.includes(`/${id}/index.html`), `homepage ${id} opens its lessons directly`);
  assert(!documents.has(`${id}/index.html`), `retired ${id} directory is not a course document`);
  for (const topic of groups[id].topics) {
    const html = await readFile(`public/lesson/${id}/${topic.id}.html`, 'utf8');
    assert(html.includes(`class="back" href="/#/?section=${id}"`), `return to the homepage ${id}: ${topic.id}`);
    assert(html.includes(`返回首页 · ${groups[id].title}`) && html.includes(`建筑构造 / ${groups[id].title}`), `navigation names its destination: ${topic.id}`);
  }
  for (const root of ['lesson', 'curriculum']) {
    const redirect = await readFile(`public/${root}/${id}/index.html`, 'utf8');
    assert(redirect.includes('window.location.replace') && redirect.includes(`href="/#/?section=${id}"`), `old ${root} ${id} directory redirects home`);
    assert(!redirect.includes('directory-card'), 'retired index does not render a second directory');
  }
  for (const route of [`/textbook/${id}`, `/textbook/${id}/index`]) {
    assert.equal(manifest.legacyRoutes[route], `/?section=${id}`, `old bookmark returns to the homepage: ${route}`);
  }
  assert(formalizeCourse(`<a href="/previews/curriculum/${id}/index.html">目录</a>`, '/textbook/').includes(`href="/textbook/#/?section=${id}"`), `retired ${id} directory redirect respects hosted subpaths`);
}
for (const route of ['/textbook/introduction', '/textbook/introduction/index', '/textbook/index']) {
  assert.equal(manifest.legacyRoutes[route], '/?section=introduction', `old bookmark returns to the homepage: ${route}`);
}

const fixture = '<a href="/previews/curriculum/introduction/intro-course-guide.html">课程</a><a href="/lesson/principles/thermal.html">保温</a><a href="/#/node/construction-column-01">节点</a><a href="/previews/homepage-v1.html#modules">首页</a><link href="/previews/curriculum.css"><img src="/brand/logo.svg">';
const subpath = formalizeCourse(fixture, '/textbook/');
for (const href of ['/textbook/lesson/introduction/intro-course-guide.html', '/textbook/lesson/principles/thermal.html', '/textbook/#/node/construction-column-01', '/textbook/#/?section=modules', '/textbook/lesson/curriculum.css']) assert(subpath.includes(`href="${href}"`));
assert(subpath.includes('src="/textbook/brand/logo.svg"'));
const directoryAssets = formalizeCourse('<link href="/lesson/module-directory.css?v=20261013"><img src="/images/chapters/foundation.webp"><link href="/styles/directory-cards.css"><script type="module" src="/styles/directory-motion-entry.js"></script>', '/textbook/');
assert(directoryAssets.includes('href="/textbook/lesson/module-directory.css?v=20261013"'));
assert(directoryAssets.includes('src="/textbook/images/chapters/foundation.webp"'));
assert(directoryAssets.includes('href="/textbook/styles/directory-cards.css"'));
assert(directoryAssets.includes('src="/textbook/styles/directory-motion-entry.js"'));
assert(formalizeCourse('<a href="/images/wall/detail.png">原图</a>', '/textbook/').includes('href="/textbook/images/wall/detail.png"'), 'original drawing links respect hosted subpaths');
assert.throws(() => formalizeCourse(fixture, 'textbook/'));
console.log(`Textbook checks passed: ${articles.length} full articles, ${documents.size} routes, complete rendered text, links, task requirements and hosted subpaths.`);
