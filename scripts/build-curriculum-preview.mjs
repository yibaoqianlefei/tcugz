import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { articleSources, groups, modules } from './lib/textbook-catalog.mjs';
import { renderModuleDirectory } from './lib/module-directory.mjs';
import { moduleDirectoryDesigns } from './lib/module-directory-designs.mjs';
import { lessonModelGuidance } from './lib/lesson-model-guidance.mjs';
import { chapterSelection } from './lib/chapter-selection.mjs';

const root = join(process.cwd(), 'public', 'previews');
const home = '/previews/homepage-v1.html#top';
const base = '/previews/curriculum';
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const homeSectionUrl = id => `${home.split('#')[0]}#${id === 'basics' ? 'modules' : id}`;
const moduleUrl = id => id === 'wall' ? '/previews/wall-v1.html' : `${base}/basics/${id}/index.html`;
const topicUrl = (id, topic) => `${base}/${id}/${topic}.html`;
const chapterUrl = (id, topic) => `${base}/basics/${id}/${topic}.html`;
const mediaCatalog = JSON.parse(await readFile('src/data/lessonMedia.json', 'utf8'));
const selection = chapterSelection();
const evidence = JSON.parse(await readFile('src/data/diagramEvidence.json', 'utf8'));
const graph = JSON.parse(await readFile('src/data/curriculumLearning.json', 'utf8'));
const legacyFigures = JSON.parse(await readFile('src/data/legacyLessonFigures.json', 'utf8'));
const enhancement = html => `<!-- textbook-enhancement:start -->${html}<!-- textbook-enhancement:end -->`;

function figureMarkup(figure, lesson) {
  const nodeUrl = '/#/node/' + figure.nodeId + '?' + new URLSearchParams({ lesson: lesson.path, figure: figure.id, unit: figure.knowledgeId });
  return '<figure class="lesson-figure" id="'+figure.id+'" data-textbook-enhancement="figure" data-node-id="'+esc(figure.nodeId)+'">'
    + '<div class="lesson-inline-model-slot" data-lesson-model="'+figure.id+'" data-node-id="'+esc(figure.nodeId)+'" role="group" aria-label="'+esc(figure.title)+'三维模型"><div class="lesson-model-mount"></div><a class="lesson-model-placeholder" href="'+esc(nodeUrl)+'"><strong>'+esc(figure.nodeTitle)+'</strong><span>进入三维模型，观察构造关系 ↗</span></a></div>'
    + '<figcaption><strong>'+esc(figure.nodeTitle)+'</strong><a class="lesson-model-link" href="'+esc(nodeUrl)+'" data-lesson-figure="'+figure.id+'" data-lesson-view="node">打开节点 ↗</a></figcaption></figure>';
}
function courseLink(key, label) {
  const target = mediaCatalog[key];
  if (!target) throw new Error('Missing course relation: ' + key);
  return '<a href="/lesson/'+target.path+'">'+esc(label ?? target.title)+' ↗</a>';
}
function unitMarkup(unit, lesson) {
  const figure = lesson.figures.find(item => item.knowledgeId === unit.id);
  const related = unit.models.filter(model => model.nodeId !== figure?.nodeId);
  const comparisons = related.length ? '<details class="wall-model-comparison"><summary>关联观察与比较 · '+related.length+' 个节点</summary><ul>'+related.map(model => '<li><a href="/#/node/'+model.nodeId+'?'+new URLSearchParams({lesson:lesson.path,unit:unit.id})+'">'+esc(model.title)+' ↗</a><p>'+esc(model.difference)+'</p></li>').join('')+'</ul></details>' : '';
  const prerequisite = [...new Set([...(lesson.learning.prerequisiteIds ?? []), ...unit.prerequisiteIds])].filter(id => graph.units[id]);
  const links = [...new Set([...(lesson.learning.relatedPrinciples ?? []), ...unit.relatedPrinciples, ...(lesson.learning.applications ?? []), ...unit.applications])].filter(key => key !== lesson.key);
  const aliases = Object.entries(legacyFigures[lesson.path] ?? {}).filter(([,old]) => { const target = lesson.learning.units.find(item => old.knowledgeId ? item.id === old.knowledgeId : item.models.some(model => model.nodeId === old.nodeId)) ?? lesson.learning.units[0]; return target?.id === unit.id; }).map(([id]) => '<span id="'+id+'" class="learning-legacy-anchor" aria-hidden="true"></span>').join('');
  return enhancement('<section class="knowledge-unit" id="unit-'+esc(unit.id)+'" data-knowledge-unit="'+esc(unit.id)+'">'+aliases
    + '<div class="wall-model-question"><span>'+ (lesson.learning.kind === 'practice' ? '本次任务' : '学习问题') +'</span><h3>'+esc(unit.title)+'</h3><p>'+esc(unit.question)+'</p></div>'
    + '<p class="knowledge-principle">'+esc(unit.principle)+'</p><div class="knowledge-observe"><strong>'+ (lesson.learning.kind === 'practice' ? '完成步骤与证据' : '观察与推演') +'</strong><ol>'+unit.observe.map(task=>'<li>'+esc(task)+'</li>').join('')+'</ol></div>'
    + (figure ? figureMarkup(figure,lesson) : '')
    + '<div class="wall-model-explanation"><strong>把关系讲清楚</strong><p>'+esc(unit.conclusion)+'</p>'+comparisons
    + '<details><summary>表达范围与条件</summary><p>'+esc(unit.boundary)+'</p></details>'
    + '<details class="knowledge-assessment"><summary>'+ (lesson.learning.kind === 'practice' ? '提交前自评' : '解释与应用 · 先作答再核对') +'</summary><p>'+esc(unit.assessment.question)+'</p><strong>判定要点</strong><ul>'+unit.assessment.criteria.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ul></details>'
    + (prerequisite.length || links.length ? '<details class="knowledge-connections"><summary>接着学 · 原理与应用</summary>' + prerequisite.map(id => '<p>先修：<a href="/#/lesson/'+graph.lessons[graph.units[id].lesson].path+'?unit='+id+'">'+esc(graph.units[id].title)+' ↗</a></p>').join('') + links.map(key=>'<p>'+courseLink(key)+'</p>').join('')+'</details>' : '')
    + '</div></section>');
}
function evidenceMarkup(id) {
  const record = evidence[id];
  if (!record || record.status !== 'reviewed') throw new Error('Unreviewed teaching diagram: '+id);
  return enhancement('<figcaption class="diagram-evidence"><strong>'+esc(record.title)+'</strong><p>'+esc(record.scope)+'</p><details><summary>绘图依据与适用范围</summary><ul>'+record.sources.map(source=>'<li><a href="'+esc(source.url)+'" target="_blank" rel="noopener noreferrer">'+esc(source.standard)+'</a> · '+esc(source.clause)+'；'+esc(source.pages)+'<p>'+esc(source.appliesTo)+'</p></li>').join('')+'</ul><p>'+record.exclusions.map(esc).join('；')+'</p><small>核对日期：'+record.checkedOn+' · 教学原理示意</small></details></figcaption>');
}

function renderMarkdown(markdown, lesson) {
  const ast = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const headings = [];
  const plainText = node => node.value ?? (node.children ?? []).map(plainText).join('');
  const inline = node => {
    if (node.type === 'text') return esc(node.value);
    if (node.type === 'strong') return `<strong>${node.children.map(inline).join('')}</strong>`;
    if (node.type === 'emphasis') return `<em>${node.children.map(inline).join('')}</em>`;
    if (node.type === 'inlineCode') return `<code>${esc(node.value)}</code>`;
    if (node.type === 'image') {
      if (!/^\/images\/learning\/[\w-]+\.svg$/.test(node.url)) throw new Error(`Unsupported teaching diagram: ${node.url}`);
      return `<a class="wall-learning-diagram" href="${esc(node.url)}?v=20261029" target="_blank" rel="noopener noreferrer" title="查看原理示意大图"><img src="${esc(node.url)}?v=20261029" alt="${esc(node.alt ?? '')}" loading="lazy">${enhancement('<span class="wall-diagram-action" aria-hidden="true">查看原理示意大图 ↗</span>')}</a>`;
    }
    if (node.type === 'break') return '<br>';
    if (node.type === 'link') {
      if (!/^(https?:\/\/|\/|#)/.test(node.url)) throw new Error(`Unsupported article link: ${node.url}`);
      let href = node.url;
      const nodeId = href.match(/^\/#\/node\/([^/?#]+)$/)?.[1];
      const related = lesson.learning?.units.find(unit => unit.models.some(model => model.nodeId === nodeId));
      if (related) href += '?' + new URLSearchParams({lesson:lesson.path,unit:related.id});
      return `<a href="${esc(href)}"${/^https?:/.test(node.url) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${node.children.map(inline).join('')}</a>`;
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
    if (node.type === 'paragraph') {
      if (node.children.length === 1 && node.children[0].type === 'image') {
        const image = node.children[0];
        const id = image.url.split('/').at(-1).replace('.svg', '');
        return '<figure class="teaching-diagram">'+inline(image)+evidenceMarkup(id)+'</figure>';
      }
      const isAnswer = /^参考答案[：:]/.test(plainText(node));
      // The answer label is carried by the summary, so drop it from the revealed body.
      let body = node.children;
      if (isAnswer) {
        const first = body[0];
        const stripped = first?.type === 'text' ? first.value.replace(/^参考答案[：:]\s*/, '') : null;
        if (stripped !== null && stripped !== first.value) body = [{ ...first, value: stripped }, ...body.slice(1)];
        else if (first?.type === 'strong' && /^参考答案[：:]?$/.test(plainText(first))) {
          const next = body[1];
          body = next?.type === 'text' ? [{ ...next, value: next.value.replace(/^[：:]\s*/, '') }, ...body.slice(2)] : body.slice(1);
        }
      }
      const paragraph = `<p>${body.map(inline).join('')}</p>`;
      return isAnswer ? `<details class="lesson-answer"><summary>${esc(plainText(node).match(/^参考答案[：:]/)[0])}${enhancement('先独立作答，展开核对')}</summary>${paragraph}</details>` : paragraph;
    }
    if (node.type === 'list') return `<${node.ordered ? 'ol' : 'ul'}${node.ordered && node.start !== 1 ? ` start="${node.start}"` : ''}>${node.children.map(block).join('')}</${node.ordered ? 'ol' : 'ul'}>`;
    if (node.type === 'listItem') return `<li>${node.children.map(child => child.type === 'paragraph' ? child.children.map(inline).join('') : block(child)).join('')}</li>`;
    if (node.type === 'table') return `<div class="article-table"><table><thead>${node.children.slice(0, 1).map(row => `<tr>${row.children.map(cell => `<th scope="col">${cell.children.map(inline).join('')}</th>`).join('')}</tr>`).join('')}</thead><tbody>${node.children.slice(1).map(row => `<tr>${row.children.map(cell => `<td>${cell.children.map(inline).join('')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    if (node.type === 'blockquote') {
      // `> [!要点] …` authors a teaching callout; a plain quote keeps its default look.
      const lead = node.children[0];
      const label = lead?.type === 'paragraph' ? plainText(lead).match(/^\[!([^\]]{1,8})\]/)?.[1] : null;
      if (label) {
        const opening = lead.children.map(inline).join('').replace(/^\[![^\]]{1,8}\]\s*/, '');
        const tone = /易错|错误|注意|警示/.test(label) ? 'warn' : /要点|关键|重点/.test(label) ? 'key' : 'note';
        const rest = [opening ? `<p>${opening}</p>` : '', ...node.children.slice(1).map(block)].join('');
        return `<aside class="lesson-callout lesson-callout--${tone}"><p class="lesson-callout-label">${esc(label)}</p>${rest}</aside>`;
      }
      return `<blockquote>${node.children.map(block).join('')}</blockquote>`;
    }
    if (node.type === 'code') return `<pre><code>${esc(node.value)}</code></pre>`;
    if (node.type === 'thematicBreak') return '<hr>';
    throw new Error(`Unsupported article block: ${node.type}`);
  };
  let pending = [];
  const pieces = [];
  for (const [index, node] of ast.children.entries()) {
    if (index === 0 && node.type === 'heading' && node.depth === 1) continue;
    if (node.type === 'heading' && pending.length) { pieces.push(...pending.map(unit => unitMarkup(unit, lesson))); pending = []; }
    pieces.push(block(node));
    if (node.type === 'heading') pending = (lesson.learning?.units ?? []).filter(unit => unit.sectionId === headings.at(-1).id);
    else if (pending.length) { pieces.push(...pending.map(unit => unitMarkup(unit, lesson))); pending = []; }
  }
  pieces.push(...pending.map(unit => unitMarkup(unit, lesson)));
  const html = pieces.join('\n');
  const toc = `<nav class="article-toc" aria-label="本节内容"><strong>本节内容</strong>${headings.filter(item => item.depth === 2).map(item => `<a href="#${item.id}">${item.title}</a>`).join('')}</nav>`;
  return { toc, article: `<article class="article">${html}</article>`, sectionCount: headings.filter(item => item.depth === 2).length };
}

function shell({ title, category, parentUrl, parentLabel, body, cover = '', summary = '', metadata = '', learningStyle = false, kind = 'article', breadcrumb = '建筑构造 / 学习首页' }) {
  const head = `<div class="page-head"><span class="eyebrow">${esc(category)}</span><h1>${esc(title)}</h1>${summary ? `<p class="intro">${esc(summary)}</p>` : ''}${metadata}</div>`;
  return `<!doctype html>\n<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} · 建筑构造</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="stylesheet" href="/previews/curriculum.css"><link rel="stylesheet" href="/styles/model-ui.css"><link rel="stylesheet" href="/styles/lesson-model-viewer.css">${learningStyle ? '<link rel="stylesheet" href="/styles/wall-learning.css">' : ''}</head>\n<body class="course-page course-page--${kind}"><div class="layout"><div class="page"><header class="topbar"><a class="course-brand" href="${home}"><img src="/brand/logo.svg" width="40" height="40" alt="" aria-hidden="true"><span>${esc(breadcrumb)}</span></a><a class="back" href="${parentUrl}"><span class="back-icon" aria-hidden="true">←</span><span>${esc(parentLabel)}</span></a></header><main class="content">${kind === 'article' ? `<div class="lesson-opening${cover ? ' lesson-opening--illustrated' : ''}">${head}${cover}</div>` : head}${body}</main></div></div><script type="module" src="/styles/directory-motion-entry.js"></script></body></html>`;
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
  const original = mediaCatalog[`${id}/${topic.id}`];
  const guidance = original?.learning ? original : lessonModelGuidance[`${id}/${topic.id}`];
  if (!original || !guidance || guidance.figures.length !== original.figures.length) throw new Error(`Missing model guidance: ${id}/${topic.id}`);
  const lesson = { ...original, intro: guidance.intro, figures: original.figures.map((figure, index) => {
    const model = guidance.figures[index];
    if (!figure.hasModel || model.nodeId !== figure.nodeId) throw new Error(`Incorrect model binding: ${id}/${topic.id} ${figure.id}`);
    return { ...figure, ...model };
  }) };
  const rendered = renderMarkdown(markdown, lesson);
  const guide = enhancement(`<section class="lesson-reading-guide" data-textbook-enhancement="guide"><span class="lesson-guide-label">本节研读</span><p>${esc(lesson.intro)}</p><div class="lesson-study-steps"><span><b>01</b> 读作用与条件</span><span><b>02</b> ${lesson.learning ? '观察模型与示意' : '转动构造模型'}</span><span><b>03</b> ${lesson.learning ? '解释关系并自测' : '检查构件连接'}</span></div>${lesson.learning ? `<div class="wall-learning-outcome"><strong>学完应能做到</strong><p>${esc(lesson.learning.outcome)}</p><small>${esc(lesson.learning.prerequisite)}</small></div>` : ''}</section>`);
  const figureIndex = lesson.figures.length ? `<div class="lesson-figure-index"><strong>本节模型 <span>${String(lesson.figures.length).padStart(2, '0')}</span></strong>${lesson.figures.map(figure => `<a href="#${figure.id}"><span class="lesson-model-index-number">${figure.number}</span><span><small>${esc(figure.nodeTitle)}</small>${esc(figure.title)}</span></a>`).join('')}</div>` : '';
  return {
    learningStyle: Boolean(lesson.learning),
    cover: '',
    summary: topic.description,
    metadata: enhancement(`<div class="lesson-metadata"><span>约 ${lesson.readingMinutes} 分钟</span><span>${rendered.sectionCount} 个小节</span>${lesson.figures.length ? `<a href="#${lesson.figures[0]?.id}">${lesson.figures.length} 个交互模型 ↗</a>` : '<span>概念与方法</span>'}</div>`),
    body: `<div class="article-layout"><aside class="lesson-sidebar"><div class="lesson-sidebar-inner"><details class="lesson-outline" open><summary>本节阅读导航<span>${String(rendered.sectionCount).padStart(2, '0')}</span></summary>${rendered.toc}</details>${figureIndex}<details class="lesson-chapter-list"><summary>${esc(group.title)}目录 <span>${String(group.topics.length).padStart(2, '0')}</span></summary><nav class="chapter-nav" aria-label="${esc(group.title)}章节">${group.topics.map((item, itemIndex) => `<a href="${url(item.id)}"${item.id === topic.id ? ' aria-current="page"' : ''}><span class="chapter-nav-number" aria-hidden="true">${String(itemIndex + 1).padStart(2, '0')}</span><span>${esc(item.title)}</span></a>`).join('')}</nav></details></div></aside><div class="article-column">${guide}${rendered.article}<nav class="page-next" aria-label="前后章节">${index > 0 ? `<a href="${url(group.topics[index - 1].id)}" rel="prev"><span class="page-next-label">← 上一节</span><span>${esc(group.topics[index - 1].title)}</span></a>` : '<span></span>'}${index < group.topics.length - 1 ? `<a href="${url(group.topics[index + 1].id)}" rel="next"><span class="page-next-label">下一节 →</span><span>${esc(group.topics[index + 1].title)}</span></a>` : ''}</nav></div></div>`,
  };
}

// React and standalone lessons consume the same authored design tokens.
await mkdir(join(process.cwd(), 'public', 'styles'), { recursive: true });
if (!selection.scoped) {
await copyFile(join(process.cwd(), 'src', 'components', 'textbook', 'lesson-model-viewer.css'), join(process.cwd(), 'public', 'styles', 'lesson-model-viewer.css'));
await copyFile(join(process.cwd(), 'src', 'styles', 'site-tokens.css'), join(process.cwd(), 'public', 'styles', 'site-tokens.css'));
await copyFile(join(process.cwd(), 'src', 'styles', 'model-ui.css'), join(process.cwd(), 'public', 'styles', 'model-ui.css'));
await copyFile(join(process.cwd(), 'src', 'styles', 'directory-cards.css'), join(process.cwd(), 'public', 'styles', 'directory-cards.css'));
await copyFile(join(process.cwd(), 'src', 'ui', 'directoryMotion.js'), join(process.cwd(), 'public', 'styles', 'directory-motion.js'));
}
await copyFile(join(process.cwd(), 'src', 'styles', 'wall-learning.css'), join(process.cwd(), 'public', 'styles', 'wall-learning.css'));

for (const [id, group] of Object.entries(groups)) {
  if (!selection.selected.has(id)) continue;
  const onHomepage = id === 'introduction' || id === 'principles';
  const parentUrl = id === 'practice' ? '/#/games' : homeSectionUrl(id);
  if (!selection.scoped) await save(topicUrl(id, 'index'), onHomepage ? homeSectionRedirect(id, group.title) : shell({ title: group.title, category: '实践作业 / 任务目录', parentUrl, parentLabel: '返回作业训练', kind: 'directory', body: `<p class="intro">${esc(group.description)}</p>${cards(await directoryTopics(id, group.topics), item => topicUrl(id, item.id))}` }));
  for (const [index, topic] of group.topics.entries()) {
    await save(topicUrl(id, topic.id), shell({
      title: topic.title,
      category: `${group.title} / ${String(index + 1).padStart(2, '0')}`,
      parentUrl: onHomepage ? homeSectionUrl(id) : topicUrl(id, 'index'),
      parentLabel: onHomepage ? `返回首页 · ${group.title}` : `返回${group.title}目录`,
      breadcrumb: onHomepage ? `建筑构造 / ${group.title}` : undefined,
      ...await articleBody(id, group, topic, index, item => topicUrl(id, item)),
    }));
  }
}
for (const [id, module] of Object.entries(modules)) {
  if (!selection.selected.has(id)) continue;
  if (id !== 'wall' && !selection.scoped) {
    const design = moduleDirectoryDesigns[id];
    if (!design) throw new Error(`Missing chapter directory design: ${id}`);
    await save(moduleUrl(id), renderModuleDirectory({ id, module: { ...module, topics: await directoryTopics(id, module.topics) }, design }));
  }
  for (const [index, topic] of module.topics.entries()) {
    await save(chapterUrl(id, topic.id), shell({ title: topic.title, category: `构造基础 / ${module.title} / ${String(index + 1).padStart(2, '0')}`, parentUrl: moduleUrl(id), parentLabel: `返回${module.title}目录`, ...await articleBody(id, module, topic, index, item => chapterUrl(id, item)) }));
  }
}
console.log('Curriculum pages generated for: ' + [...selection.selected].join(', '));
