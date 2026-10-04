import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import introSections from '../src/data/sections/introSections.js';
import foundationSections from '../src/data/sections/foundationSections.js';
import wallSections from '../src/data/sections/wallSections.js';
import windowSections from '../src/data/sections/windowSections.js';
import floorSections from '../src/data/sections/floorSections.js';
import stairsSections from '../src/data/sections/stairsSections.js';
import roofSections from '../src/data/sections/roofSections.js';
import deformationJointSections from '../src/data/sections/deformationJointSections.js';

const root = join(process.cwd(), 'public', 'previews');
const home = '/previews/homepage-v1.html#top';
const base = '/previews/curriculum';
const principles = [
  ['thermal', '建筑保温', '理解围护结构的保温做法与热工性能'],
  ['waterproof', '建筑防水', '梳理屋面、墙体与地下空间的防水策略'],
  ['insulation', '建筑隔热', '比较遮阳、通风与隔热构造'],
  ['acoustic', '建筑隔声', '认识空气声与撞击声的控制方式'],
  ['fire', '建筑防火', '理解耐火与防火分隔的构造要求'],
  ['moisture', '建筑防潮', '关注地面、墙脚与围护层的防潮处理'],
].map(([id, title, description]) => ({ id, title, description }));
const groups = {
  introduction: { title: '建筑绪论', description: '认识建筑的分类、组成与基本设计原则。', topics: introSections },
  basics: { title: '构造基础', description: '从建筑的六类核心构件进入章节内容。' },
  principles: { title: '构造原理', description: '从建筑物理与安全要求理解构造设计。', topics: principles },
};
const modules = {
  foundation: { title: '基础与地基', description: '理解建筑与地面的连接方式。', topics: foundationSections },
  wall: { title: '墙体', description: '认识围护、分隔与承重构造。', topics: [{ id: 'index', title: '墙体概述', description: '建立对墙体功能与基本构造的整体认识。' }, ...wallSections] },
  'door-window': { title: '门窗', description: '探索建筑开口的设计与做法。', topics: windowSections },
  floor: { title: '楼地层', description: '了解楼板与地面的构造关系。', topics: floorSections },
  stairs: { title: '楼梯', description: '梳理建筑的竖向交通空间。', topics: stairsSections },
  roof: { title: '屋顶', description: '比较平屋面与坡屋面的构造。', topics: roofSections },
  'deformation-joint': { title: '变形缝', description: '认识建筑变形缝的设置原则与构造做法。', topics: deformationJointSections },
};
const articleSources = {
  'wall/index': 'src/data/textbook/walls/index.md',
  'wall/wall-partition': 'src/data/textbook/walls/partitions.md',
  'wall/wall-design-requirements': 'src/data/textbook/walls/wall-design-requirements.md',
  'roof/roof-overview': 'src/data/textbook/roof/index.md',
};
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const homeSectionUrl = id => `${home.split('#')[0]}${id === 'basics' ? '#modules' : `#${id}`}`;
const moduleUrl = id => id === 'wall' ? '/previews/wall-v1.html' : `${base}/basics/${id}/index.html`;
const topicUrl = (id, topic) => `${base}/${id}/${topic}.html`;
const chapterUrl = (id, topic) => `${base}/basics/${id}/${topic}.html`;
const status = (id, topic) => articleSources[`${id}/${topic}`] ? '可阅读' : '暂无内容';

function renderMarkdown(markdown) {
  const ast = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const inline = node => {
    if (node.type === 'text') return esc(node.value);
    if (node.type === 'strong') return `<strong>${node.children.map(inline).join('')}</strong>`;
    if (node.type === 'emphasis') return `<em>${node.children.map(inline).join('')}</em>`;
    if (node.type === 'inlineCode') return `<code>${esc(node.value)}</code>`;
    if (node.type === 'link') return `<a href="${esc(node.url)}">${node.children.map(inline).join('')}</a>`;
    return (node.children || []).map(inline).join('');
  };
  const block = node => {
    if (node.type === 'heading') return `<h${node.depth}>${node.children.map(inline).join('')}</h${node.depth}>`;
    if (node.type === 'paragraph') return `<p>${node.children.map(inline).join('')}</p>`;
    if (node.type === 'list') return `<${node.ordered ? 'ol' : 'ul'}>${node.children.map(block).join('')}</${node.ordered ? 'ol' : 'ul'}>`;
    if (node.type === 'listItem') return `<li>${node.children.map(child => child.type === 'paragraph' ? child.children.map(inline).join('') : block(child)).join('')}</li>`;
    if (node.type === 'table') return `<div class="article-table"><table>${node.children.map((row, i) => `<tr>${row.children.map(cell => `<${i ? 'td' : 'th'}>${cell.children.map(inline).join('')}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</table></div>`;
    return '';
  };
  return ast.children.filter((node, index) => !(index === 0 && node.type === 'heading' && node.depth === 1)).map(block).join('\n');
}

function shell({ title, category, parentUrl, parentLabel, body }) {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} · 建筑构造</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="stylesheet" href="/previews/curriculum.css"></head>
<body><div class="layout"><div class="page"><header class="topbar"><a class="course-brand" href="${home}"><img src="/brand/logo.svg" width="40" height="40" alt="" aria-hidden="true"><span>建筑构造 / 学习首页</span></a><a class="back" href="${parentUrl}"><span class="back-icon" aria-hidden="true">←</span><span>${esc(parentLabel)}</span></a></header><main class="content"><div class="page-head"><span class="eyebrow">${esc(category)}</span><h1>${esc(title)}</h1></div>${body}</main></div></div></body></html>`;
}
function cards(items, url, badge) {
  return `<div class="cards">${items.map((item, index) => `<a class="card" href="${url(item)}"><span class="card-top"><span>${String(index + 1).padStart(2, '0')} / CHAPTER</span><em>${esc(badge(item))}</em></span><strong>${esc(item.title)}</strong><p>${esc(item.description)}</p></a>`).join('')}</div>`;
}
async function save(url, html) {
  const path = join(root, url.replace('/previews/', ''));
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, html, 'utf8');
}

for (const id of ['introduction', 'principles']) {
  const group = groups[id];
  const topics = group.topics.map(topic => ({ ...topic, title: topic.id === 'intro-drawing-standards' ? '制图标准与规范' : topic.title }));
  for (const [index, topic] of topics.entries()) {
    await save(topicUrl(id, topic.id), shell({ title: topic.title, category: `${group.title} / ${String(index + 1).padStart(2, '0')}`, parentUrl: homeSectionUrl(id), parentLabel: `返回${group.title}`, body: `<p class="intro">${esc(topic.description)}</p><section class="empty"><span>本节正文</span><strong>暂无内容</strong></section><div class="page-next">${index > 0 ? `<a href="${topicUrl(id, topics[index - 1].id)}">← ${esc(topics[index - 1].title)}</a>` : '<span></span>'}${index < topics.length - 1 ? `<a href="${topicUrl(id, topics[index + 1].id)}">${esc(topics[index + 1].title)} →</a>` : ''}</div>` }));
  }
}
for (const [id, module] of Object.entries(modules)) {
  if (id !== 'wall') await save(moduleUrl(id), shell({ title: module.title, category: '构造基础 / 章节目录', parentUrl: homeSectionUrl('basics'), parentLabel: '返回构造基础', body: `<p class="intro">${esc(module.description)}</p><h2>${esc(module.title)}章节</h2>${cards(module.topics, item => chapterUrl(id, item.id), item => status(id, item.id))}` }));
  for (const [index, topic] of module.topics.entries()) {
    const source = articleSources[`${id}/${topic.id}`];
    const content = source ? `<article class="article">${renderMarkdown(await readFile(source, 'utf8'))}</article>` : '<section class="empty"><span>本节正文</span><strong>暂无内容</strong></section>';
    await save(chapterUrl(id, topic.id), shell({ title: topic.title, category: `构造基础 / ${module.title} / ${String(index + 1).padStart(2, '0')}`, parentUrl: moduleUrl(id), parentLabel: `返回${module.title}目录`, current: 'basics', body: `<p class="intro">${esc(topic.description)}</p><div class="article-layout"><div>${content}<div class="page-next">${index > 0 ? `<a href="${chapterUrl(id, module.topics[index - 1].id)}">← ${esc(module.topics[index - 1].title)}</a>` : '<span></span>'}${index < module.topics.length - 1 ? `<a href="${chapterUrl(id, module.topics[index + 1].id)}">${esc(module.topics[index + 1].title)} →</a>` : ''}</div></div><nav class="chapter-nav" aria-label="${esc(module.title)}章节"><strong>${esc(module.title)}目录</strong>${module.topics.map(item => `<a href="${chapterUrl(id, item.id)}"${item.id === topic.id ? ' aria-current="page"' : ''}>${esc(item.title)}<small>${status(id, item.id)}</small></a>`).join('')}</nav></div>` }));
  }
}
console.log('Curriculum preview pages generated.');
