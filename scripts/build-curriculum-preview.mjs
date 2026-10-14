import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { articleSources, groups, modules } from './lib/textbook-catalog.mjs';
import { renderModuleDirectory } from './lib/module-directory.mjs';
import { moduleDirectoryDesigns } from './lib/module-directory-designs.mjs';

const root = join(process.cwd(), 'public', 'previews');
const home = '/previews/homepage-v1.html#top';
const base = '/previews/curriculum';
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const homeSectionUrl = id => `${home.split('#')[0]}#${id === 'basics' ? 'modules' : id}`;
const moduleUrl = id => id === 'wall' ? '/previews/wall-v1.html' : `${base}/basics/${id}/index.html`;
const topicUrl = (id, topic) => `${base}/${id}/${topic}.html`;
const chapterUrl = (id, topic) => `${base}/basics/${id}/${topic}.html`;

function renderMarkdown(markdown) {
  const ast = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const headings = [];
  const inline = node => {
    if (node.type === 'text') return esc(node.value);
    if (node.type === 'strong') return `<strong>${node.children.map(inline).join('')}</strong>`;
    if (node.type === 'emphasis') return `<em>${node.children.map(inline).join('')}</em>`;
    if (node.type === 'inlineCode') return `<code>${esc(node.value)}</code>`;
    if (node.type === 'break') return '<br>';
    if (node.type === 'link') {
      if (!/^(https?:\/\/|\/|#)/.test(node.url)) throw new Error(`Unsupported article link: ${node.url}`);
      return `<a href="${esc(node.url)}"${/^https?:/.test(node.url) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${node.children.map(inline).join('')}</a>`;
    }
    return (node.children || []).map(inline).join('');
  };
  const block = node => {
    if (node.type === 'heading') {
      const id = `section-${headings.length + 1}`;
      const title = node.children.map(inline).join('');
      headings.push({ id, title, depth: node.depth });
      return `<h${node.depth} id="${id}">${title}</h${node.depth}>`;
    }
    if (node.type === 'paragraph') return `<p>${node.children.map(inline).join('')}</p>`;
    if (node.type === 'list') return `<${node.ordered ? 'ol' : 'ul'}${node.ordered && node.start !== 1 ? ` start="${node.start}"` : ''}>${node.children.map(block).join('')}</${node.ordered ? 'ol' : 'ul'}>`;
    if (node.type === 'listItem') return `<li>${node.children.map(child => child.type === 'paragraph' ? child.children.map(inline).join('') : block(child)).join('')}</li>`;
    if (node.type === 'table') return `<div class="article-table"><table><thead>${node.children.slice(0, 1).map(row => `<tr>${row.children.map(cell => `<th scope="col">${cell.children.map(inline).join('')}</th>`).join('')}</tr>`).join('')}</thead><tbody>${node.children.slice(1).map(row => `<tr>${row.children.map(cell => `<td>${cell.children.map(inline).join('')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    if (node.type === 'blockquote') return `<blockquote>${node.children.map(block).join('')}</blockquote>`;
    if (node.type === 'code') return `<pre><code>${esc(node.value)}</code></pre>`;
    if (node.type === 'thematicBreak') return '<hr>';
    throw new Error(`Unsupported article block: ${node.type}`);
  };
  const html = ast.children.filter((node, index) => !(index === 0 && node.type === 'heading' && node.depth === 1)).map(block).join('\n');
  const toc = `<nav class="article-toc" aria-label="本节内容"><strong>本节内容</strong>${headings.filter(item => item.depth === 2).map(item => `<a href="#${item.id}">${item.title}</a>`).join('')}</nav>`;
  return `${toc}<article class="article">${html}</article>`;
}

function shell({ title, category, parentUrl, parentLabel, body }) {
  return `<!doctype html>\n<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} · 建筑构造</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="stylesheet" href="/previews/curriculum.css"></head>\n<body><div class="layout"><div class="page"><header class="topbar"><a class="course-brand" href="${home}"><img src="/brand/logo.svg" width="40" height="40" alt="" aria-hidden="true"><span>建筑构造 / 学习首页</span></a><a class="back" href="${parentUrl}"><span class="back-icon" aria-hidden="true">←</span><span>${esc(parentLabel)}</span></a></header><main class="content"><div class="page-head"><span class="eyebrow">${esc(category)}</span><h1>${esc(title)}</h1></div>${body}</main></div></div></body></html>`;
}
function cards(items, url) {
  return `<div class="cards">${items.map((item, index) => `<a class="card" href="${url(item)}"><span class="card-top"><span>${String(index + 1).padStart(2, '0')} / CHAPTER</span><em>可阅读</em></span><strong>${esc(item.title)}</strong><p>${esc(item.description)}</p></a>`).join('')}</div>`;
}
async function save(url, html) {
  const path = join(root, url.replace('/previews/', ''));
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, html, 'utf8');
}
async function articleBody(id, group, topic, index, url) {
  const source = articleSources[`${id}/${topic.id}`];
  if (!source) throw new Error(`Unregistered textbook article: ${id}/${topic.id}`);
  const markdown = await readFile(source, 'utf8');
  if (markdown.trim().length < 300) throw new Error(`Textbook article is too short: ${source}`);
  return `<p class="intro">${esc(topic.description)}</p><div class="article-layout"><div>${renderMarkdown(markdown)}<div class="page-next">${index > 0 ? `<a href="${url(group.topics[index - 1].id)}">← ${esc(group.topics[index - 1].title)}</a>` : '<span></span>'}${index < group.topics.length - 1 ? `<a href="${url(group.topics[index + 1].id)}">${esc(group.topics[index + 1].title)} →</a>` : ''}</div></div><nav class="chapter-nav" aria-label="${esc(group.title)}章节"><strong>${esc(group.title)}目录</strong>${group.topics.map(item => `<a href="${url(item.id)}"${item.id === topic.id ? ' aria-current="page"' : ''}>${esc(item.title)}</a>`).join('')}</nav></div>`;
}

for (const [id, group] of Object.entries(groups)) {
  const parentUrl = id === 'practice' ? '/#/games' : homeSectionUrl(id);
  await save(topicUrl(id, 'index'), shell({ title: group.title, category: id === 'practice' ? '实践作业 / 任务目录' : '学习目录', parentUrl, parentLabel: id === 'practice' ? '返回作业训练' : '返回学习首页', body: `<p class="intro">${esc(group.description)}</p>${cards(group.topics, item => topicUrl(id, item.id))}` }));
  for (const [index, topic] of group.topics.entries()) {
    await save(topicUrl(id, topic.id), shell({ title: topic.title, category: `${group.title} / ${String(index + 1).padStart(2, '0')}`, parentUrl: topicUrl(id, 'index'), parentLabel: `返回${group.title}目录`, body: await articleBody(id, group, topic, index, item => topicUrl(id, item)) }));
  }
}
for (const [id, module] of Object.entries(modules)) {
  if (id !== 'wall') {
    const design = moduleDirectoryDesigns[id];
    if (!design) throw new Error(`Missing chapter directory design: ${id}`);
    await save(moduleUrl(id), renderModuleDirectory({ id, module, design }));
  }
  for (const [index, topic] of module.topics.entries()) {
    await save(chapterUrl(id, topic.id), shell({ title: topic.title, category: `构造基础 / ${module.title} / ${String(index + 1).padStart(2, '0')}`, parentUrl: moduleUrl(id), parentLabel: `返回${module.title}目录`, body: await articleBody(id, module, topic, index, item => chapterUrl(id, item)) }));
  }
}
console.log('Textbook articles and directories generated.');
