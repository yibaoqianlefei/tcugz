import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
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

function shell({ title, category, parentUrl, parentLabel, body, kind = 'article', breadcrumb = '建筑构造 / 学习首页' }) {
  return `<!doctype html>\n<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} · 建筑构造</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="stylesheet" href="/previews/curriculum.css"></head>\n<body class="course-page course-page--${kind}"><div class="layout"><div class="page"><header class="topbar"><a class="course-brand" href="${home}"><img src="/brand/logo.svg" width="40" height="40" alt="" aria-hidden="true"><span>${esc(breadcrumb)}</span></a><a class="back" href="${parentUrl}"><span class="back-icon" aria-hidden="true">←</span><span>${esc(parentLabel)}</span></a></header><main class="content"><div class="page-head"><span class="eyebrow">${esc(category)}</span><h1>${esc(title)}</h1></div>${body}</main></div></div><script type="module" src="/styles/directory-motion-entry.js"></script></body></html>`;
}

function homeSectionRedirect(id, title) {
  return `<!doctype html>\n<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} · 建筑构造</title><link rel="canonical" href="${homeSectionUrl(id)}"></head><body><a href="${homeSectionUrl(id)}">返回首页 · ${esc(title)}</a><script>window.location.replace(document.querySelector('a').href);</script></body></html>`;
}

// Card copy comes from the actual lesson, independently of its full reader body.
const directoryTagOverrides = {
  index: ['墙体任务', '剖面层次', '阅读顺序'],
  'intro-course-guide': ['材料与构法', '构造设计', '节点阅读'],
  'intro-classification': ['使用功能', '层数与高度', '结构体系'],
  'intro-grading': ['耐火等级', '设计工作年限', '抗震概念'],
  'intro-composition': ['基本构件', '传力路径', '构造层次'],
  'intro-factors': ['外界作用', '使用需求', '技术与经济'],
  'intro-design-principles': ['安全与耐久', '功能与使用', '选材与施工'],
  'intro-drawing-standards': ['模数协调', '定位轴线', '标高与尺寸'],
  thermal: ['连续保温', '热桥', '湿度与防火'],
  waterproof: ['排水路径', '防水连续性', '节点检查'],
  insulation: ['夏季热作用', '遮阳隔热', '通风构造'],
  acoustic: ['墙窗隔声', '楼板撞击声', '侧向传声'],
  fire: ['耐火构件', '防火分隔', '疏散交通'],
  moisture: ['潮湿来源', '墙脚防潮', '结露与干燥'],
  'construction-brief': ['结构选型', '材料层次', '节点说明'],
  'floor-layout': ['轴网与传力', '楼面标高', '构造层次'],
  'stairs-drawing': ['踏步尺寸', '平剖绘制', '净空校核'],
  'roof-drainage': ['排水分区', '分水线', '落水口'],
  'envelope-detail': ['墙窗交接', '防水连续', '固定收口'],
  'integrated-design': ['场地与空间', '节点整合', '图纸表达'],
  'construction-survey': ['现场记录', '构造比较', '资料核实'],
  'foundation-overview': ['基础与地基', '荷载传递', '天然与人工地基'],
  'foundation-design': ['地基承载', '基础受力', '变形与稳定'],
  'foundation-types': ['浅基础类型', '桩与承台', '材料与传力'],
  'foundation-underground': ['地下空间', '防水与抗浮', '防水连续线'],
  'foundation-depth': ['埋深基准', '持力层', '地下水'],
  'window-door-design': ['功能与尺度', '整樘门窗性能', '框墙连接'],
  'floor-overview': ['楼板与地坪', '水平分隔', '构造层次'],
  'floor-ground-layer': ['面层选择', '面层与基层', '湿区防水'],
  'finish-overview': ['装修功能', '基层与骨架', '构造分类'],
  'floor-ceiling': ['直接式顶棚', '吊挂传力', '设备与检修'],
  'stairs-rc-structure': ['板式与梁式', '受力与支承', '预制梯段连接'],
  'stairs-steps-ramps': ['入口路线', '支承与沉降', '坡度与平台'],
  'stairs-elevator': ['井道与空间', '结构接口', '水火声防护'],
  'roof-flat': ['排水组织', '防水连接', '层次与保护'],
  'roof-slope': ['支承与稳定', '屋脊与天沟', '瓦屋面层次'],
  'roof-deformation-concept': ['变形与约束', '三类变形缝', '材料位移性能'],
  'roof-deformation-location': ['设置条件', '位置与宽度', '系统协调'],
};

const directoryDescriptionOverrides = {
  'intro-composition': '从基础、墙柱、楼地层到屋顶，沿典型传力路径认识六类基本构件，区分建筑系统与构造层次。',
  'intro-drawing-standards': '从平面、立面、剖面到节点详图，认识模数协调、轴线、尺寸和标高，把材料层次与连接要求转化为图纸表达。',
  thermal: '沿外墙、屋面、门窗与楼板追踪热工边界，认识连续保温和热桥，协调湿度、防火与空气渗透控制。',
  waterproof: '区分屋面雨水、卫生间用水与地下水的作用条件，沿排水、防水和节点连续性判断整套构造做法。',
  insulation: '从太阳辐射与夏季热作用出发，比较遮阳、隔热和通风措施，检查围护构造与室内环境的配合。',
  acoustic: '分清空气声、撞击声与侧向传声，比较墙、门窗和楼板的隔声措施，沿声音路径检查薄弱连接。',
  fire: '从材料燃烧性能、构件耐火与防火分隔入手，检查洞口封堵、竖向交通和疏散路线的构造关系。',
  'construction-brief': '根据建筑条件选择结构、围护与材料方案，用文字和草图说明构造依据，检查荷载、水与人员通行的路径。',
  'foundation-settlement': '区分总沉降、差异沉降与倾斜，认识地基变形怎样影响上部结构，并结合场地条件理解控制措施。',
  'foundation-types': '区分构造形式、材料和传力方式等分类维度，比较独立、条形、筏形与桩基础，建立不同基础的判断依据。',
  'window-door-overview': '认识门窗的采光、通风与通行任务，区分框、扇、玻璃和洞口连接，理解位置与用途怎样影响构造选择。',
  'window-door-design': '协调开启、通行与采光通风需求，沿框与洞口的连接检查排水、密封、保温、安全及维修条件。',
  'stairs-overview': '从踏步、梯段和平台建立楼梯组成，结合通行与疏散要求认识五组设计参数，校核级数与空间关系。',
  'stairs-rc-structure': '区分板式与梁板式楼梯的传力路线，联系梯段、平台和主体的支承，理解现浇与预制连接做法。',
  'stairs-steps-ramps': '比较台阶与不同用途坡道的高差过渡方式，结合通行、防滑和排水要求，处理入口及室外平台的连接。',
  'finish-overview': '从清洁、耐湿和耐磨等使用需求选择面层，比较实体基层与骨架支承，理解装修层次和连接的职责。',
  'stairs-elevator': '认识井道、底坑与机房等建筑接口，协调设备选型、结构支承和检修空间，检查防水、防火与隔声要求。',
  'roof-deformation-location': '结合结构、地基与环境条件确定缝的位置和活动空间，协调交通、设备及围护层，理解缝宽和间距的依据。',
};

async function directoryTopics(id, topics) {
  return Promise.all(topics.map(async topic => {
    const source = articleSources[`${id}/${topic.id}`];
    if (!source) throw new Error(`Missing directory lesson: ${id}/${topic.id}`);
    const ast = unified().use(remarkParse).use(remarkGfm).parse(await readFile(source, 'utf8'));
    const text = node => node.value ?? (node.children ?? []).map(text).join('');
    const paragraph = ast.children.find(node => node.type === 'paragraph');
    const sentences = text(paragraph ?? { value: topic.description }).match(/[^。！？]+[。！？]?/g) ?? [topic.description];
    let learningDescription = sentences[0];
    for (const sentence of sentences.slice(1)) {
      if (learningDescription.length >= 46 || learningDescription.length + sentence.length > 100) break;
      learningDescription += sentence;
    }
    const headings = ast.children.filter(node => node.type === 'heading' && node.depth === 2)
      .map(text)
      .filter(title => !/自测|练习|参考|教材说明|本章学习目标|建议阅读顺序/.test(title))
      .map(title => title.replace(/^[一二三四五六七八九十\d]+[、.．]\s*/, '').replace(/^学习目标与/, '').split(/[：:，]/)[0]);
    const learningTags = directoryTagOverrides[topic.id] ?? [...new Set(headings)].slice(0, 3);
    return { ...topic, learningDescription: directoryDescriptionOverrides[topic.id] ?? learningDescription, learningTags };
  }));
}

function cards(items, url) {
  return `<section class="directory-section" aria-labelledby="directory-heading">
    <div class="directory-section-head"><span class="eyebrow">READ &amp; EXPLORE</span><div class="directory-section-title"><h2 id="directory-heading">章节目录</h2><span class="directory-section-count">${String(items.length).padStart(2, '0')}<span>节</span></span></div></div>
    <div class="cards directory-grid">${items.map((item, index) => `<a class="card directory-card" href="${url(item)}">
      <span class="card-top directory-card-top"><span class="card-number directory-card-number">${String(index + 1).padStart(2, '0')}</span><span class="directory-card-kicker">学习小节</span></span>
      <h3 class="directory-card-title">${esc(item.title)}</h3>
      <p class="directory-card-description">${esc(item.learningDescription ?? item.description)}</p>
      <div class="directory-card-tags">${(item.learningTags ?? []).map(tag => `<span>${esc(tag)}</span>`).join('')}</div>
      <span class="directory-card-footer"><span>开始阅读</span><span class="directory-card-arrow" aria-hidden="true">→</span></span>
    </a>`).join('')}</div>
  </section>`;
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
  return `<p class="intro">${esc(topic.description)}</p><div class="article-layout"><div class="article-column">${renderMarkdown(markdown)}<nav class="page-next" aria-label="前后章节">${index > 0 ? `<a href="${url(group.topics[index - 1].id)}" rel="prev"><span class="page-next-label">← 上一节</span><span>${esc(group.topics[index - 1].title)}</span></a>` : '<span></span>'}${index < group.topics.length - 1 ? `<a href="${url(group.topics[index + 1].id)}" rel="next"><span class="page-next-label">下一节 →</span><span>${esc(group.topics[index + 1].title)}</span></a>` : ''}</nav></div><nav class="chapter-nav" aria-label="${esc(group.title)}章节"><strong>${esc(group.title)}目录</strong><p class="chapter-nav-intro">本章 ${group.topics.length} 节，选择一节继续阅读。</p>${group.topics.map((item, itemIndex) => `<a href="${url(item.id)}"${item.id === topic.id ? ' aria-current="page"' : ''}><span class="chapter-nav-number" aria-hidden="true">${String(itemIndex + 1).padStart(2, '0')}</span><span>${esc(item.title)}</span></a>`).join('')}</nav></div>`;
}

// React and standalone lessons consume the same authored design tokens.
await mkdir(join(process.cwd(), 'public', 'styles'), { recursive: true });
await copyFile(join(process.cwd(), 'src', 'styles', 'site-tokens.css'), join(process.cwd(), 'public', 'styles', 'site-tokens.css'));
await copyFile(join(process.cwd(), 'src', 'styles', 'directory-cards.css'), join(process.cwd(), 'public', 'styles', 'directory-cards.css'));
await copyFile(join(process.cwd(), 'src', 'ui', 'directoryMotion.js'), join(process.cwd(), 'public', 'styles', 'directory-motion.js'));

for (const [id, group] of Object.entries(groups)) {
  const onHomepage = id === 'introduction' || id === 'principles';
  const parentUrl = id === 'practice' ? '/#/games' : homeSectionUrl(id);
  await save(topicUrl(id, 'index'), onHomepage ? homeSectionRedirect(id, group.title) : shell({ title: group.title, category: '实践作业 / 任务目录', parentUrl, parentLabel: '返回作业训练', kind: 'directory', body: `<p class="intro">${esc(group.description)}</p>${cards(await directoryTopics(id, group.topics), item => topicUrl(id, item.id))}` }));
  for (const [index, topic] of group.topics.entries()) {
    await save(topicUrl(id, topic.id), shell({
      title: topic.title,
      category: `${group.title} / ${String(index + 1).padStart(2, '0')}`,
      parentUrl: onHomepage ? homeSectionUrl(id) : topicUrl(id, 'index'),
      parentLabel: onHomepage ? `返回首页 · ${group.title}` : `返回${group.title}目录`,
      breadcrumb: onHomepage ? `建筑构造 / ${group.title}` : undefined,
      body: await articleBody(id, group, topic, index, item => topicUrl(id, item)),
    }));
  }
}
for (const [id, module] of Object.entries(modules)) {
  if (id !== 'wall') {
    const design = moduleDirectoryDesigns[id];
    if (!design) throw new Error(`Missing chapter directory design: ${id}`);
    await save(moduleUrl(id), renderModuleDirectory({ id, module: { ...module, topics: await directoryTopics(id, module.topics) }, design }));
  }
  for (const [index, topic] of module.topics.entries()) {
    await save(chapterUrl(id, topic.id), shell({ title: topic.title, category: `构造基础 / ${module.title} / ${String(index + 1).padStart(2, '0')}`, parentUrl: moduleUrl(id), parentLabel: `返回${module.title}目录`, body: await articleBody(id, module, topic, index, item => chapterUrl(id, item)) }));
  }
}
console.log('Textbook articles and directories generated.');
