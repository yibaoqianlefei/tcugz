import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { articles, groups as courseGroups, modules } from './lib/textbook-catalog.mjs';
import { nodeDefinitions } from '../src/data/nodeDefinitions.ts';
import { drawingGroups, lessonDrawingPlan, redrawPolicy } from './lib/textbook-drawing-audit-plan.mjs';

const output = 'audit-output/textbook-drawing-audit-2026-10-29';
await mkdir(output, { recursive: true });
const graph = JSON.parse(await readFile('src/data/curriculumLearning.json', 'utf8'));
const existingEvidence = JSON.parse(await readFile('src/data/diagramEvidence.json', 'utf8'));
const plans = new Map(lessonDrawingPlan.map(plan => [plan.lesson, plan]));
const groupMap = new Map(drawingGroups.map(group => [group.id, group]));
assert.equal(plans.size, 54); assert.equal(groupMap.size, 24);
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const courseUrl = lesson => `http://localhost:5173/#/lesson/${lesson.path}`;
const nodeUrl = id => `http://localhost:5173/#/node/${id}`;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

const lessons = [];
for (const article of articles) {
  const key = article.group + '/' + article.id, plan = plans.get(key);
  assert(plan, 'Missing lesson plan: ' + key);
  const text = await readFile(article.source, 'utf8');
  const headings = text.split('\n').filter(line => /^## /.test(line)).map(line => line.slice(3).trim());
  assert(headings.includes(plan.insertAt), `Proposed insertion heading must exist: ${key}/${plan.insertAt}`);
  plan.groups.forEach(id => assert(groupMap.has(id)));
  lessons.push({ key, title: article.title, group: article.group, groupTitle: (courseGroups[article.group] ?? modules[article.group]).title,
    path: article.path, source: article.source, sourceSha256: digest(text), headings,
    markdownImages: [...text.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)].map(match => ({ alt: match[1], src: match[2] })),
    units: graph.lessons[key].units, proposal: plan });
}
const nodes = [];
for (const node of nodeDefinitions.filter(node => node.status === 'available')) {
  let image = null;
  if (node.diagram?.path) {
    const bytes = await readFile('public' + node.diagram.path), metadata = await sharp(bytes).metadata();
    image = { path: node.diagram.path, width: metadata.width, height: metadata.height, format: metadata.format, sha256: digest(bytes),
      smallRasterScreening: metadata.format !== 'svg' && (metadata.width < 600 || metadata.height < 300) };
  }
  nodes.push({ id: node.id, title: node.title, category: node.category, image,
    primary: graph.nodes[node.id].primary, related: graph.nodes[node.id].related,
    variants: node.variants?.map(variant => ({ id: variant.id, title: variant.title })) ?? [] });
}
const nodeMap = new Map(nodes.map(node => [node.id, node]));
for (const lesson of lessons) {
  lesson.relatedNodes = [...new Set(lesson.units.flatMap(unit => unit.models.map(model => model.nodeId)))].map(id => nodeMap.get(id));
  assert(lesson.relatedNodes.every(Boolean));
}
const counts = { lessons: lessons.length, units: Object.keys(graph.units).length, availableNodes: nodes.length,
  nodesWithDiagram: nodes.filter(node => node.image).length, uniqueNodeDiagrams: new Set(nodes.filter(node => node.image).map(node => node.image.path)).size,
  lessonImagePlacements: lessons.reduce((sum, lesson) => sum + lesson.markdownImages.length, 0),
  uniqueLessonImages: new Set(lessons.flatMap(lesson => lesson.markdownImages.map(image => image.src))).size,
  lessonsWithImages: lessons.filter(lesson => lesson.markdownImages.length).length,
  smallRasterScreening: nodes.filter(node => node.image?.smallRasterScreening).length,
  diagramlessNodes: nodes.filter(node => !node.image).map(node => node.id),
  candidateGroups: drawingGroups.length, firstGroups: drawingGroups.filter(group => group.priority === 'P0').length };
assert.equal(counts.lessons, 54); assert.equal(counts.availableNodes, 93); assert.equal(counts.nodesWithDiagram, 91);
const standards = [
  { title: 'GB/T 50001—2017 房屋建筑制图统一标准', url: 'https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=102879',
    scope: '核对图线、比例、剖切/索引、引出线、轴线、材料图例、剖面画法、尺寸与标高等表达章节。' },
  { title: 'GB/T 50104—2010 建筑制图标准', url: 'https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=57783',
    scope: '核对建筑平面、立面、剖面、图例与尺寸表达；重点为第2、3、4章。' },
  { title: 'GB/T 50105—2010 建筑结构制图标准', url: 'https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=59350',
    scope: '涉及混凝土、钢、木构件连接表达时另查第3～5章；制图表达不替代结构设计依据。' },
];
const generalInformation = [
  ['对象与用途','图名写清对象和适用条件，并标原理示意、实例识读或作业模板。'],
  ['位置与方向','标整体定位、剖切线、观察方向、室内外及高低侧；平剖面使用一致编号。'],
  ['层次与边界','区分实体、面层、腔体和控制层；板边、支座、转角及收头能被逐项指认。'],
  ['作用与路径','按本图问题画水、传力、热湿或声的定性路径，说明必要条件；不假装计算场。'],
  ['连接与连续','说明作用传到哪里、接口如何接续，以及图中尚未表达的连接或设计资料。'],
  ['尺寸与来源','将规范要求、有明确来源的实例值、教学假设、待核查四类分开；不使用旧图数值，无依据不补数值。'],
  ['模型与知识点','同名构件、稳定知识单元、观察任务和对应解释题相互链接；标明图模可比范围。'],
  ['证据与可读性','保留出处、版次、图号/页码、适用条款、复核日期；图注用网页文字，手机可分图放大。'],
];
const findings = [
  '最新执行要求：根据用户原图进行技术重绘，保留真实截面轮廓、材料层次、连接、图号与实例数值的来源身份；不以简单框图或模型投影替代构造图。',
  '54节课程、88个知识单元中，正文直接插图为4处、3个不同文件，分布于4节；节点图纸属于另外的资源层次。',
  '93个可用节点目前91个有配图。该计数是关联范围，不代表93张重绘已完成或已通过规范验收。',
  '已建立首批7张墙体技术重绘稿的原图对照页；需逐图核对专项标准和图模边界后再替换正式教材。',
  '原图实例值、现行要求及待确认信息分别处理；发现冲突需纠正，不原样包装为现行通用做法。',
];
const wallCase = [
  '当前重点为外保温、三类过梁、窗墙缝隙及构造柱的原图技术重绘，停止此前简单原理框图方案。',
  '教材防潮、砌筑和隔墙的原始图应定位到用户提供的教材或图纸，当前网站简化SVG不作为这些图的技术底稿。',
  '保留原图已证实的剖切、层次、转折及标注；未标材料和尺寸不擅自补造。',
  '外保温层厚、窗框缝宽和配筋均保留实例身份；不能由一张原图推导通用选型或系统性能。',
  '芯柱原图C15与GB 55007—2021第3.3.2条的灌孔混凝土要求有冲突，已在模型知识说明及墙体教材标明，模型对象名保留以维持交互。',
];
const nextSteps = [
  '按原图逐张核对首批7张技术重绘稿，检查轮廓、材料图例、引出线、尺寸身份与教材解释。',
  '逐项补齐专项标准、系统资料和原图页码；未证实内容明确待核，不用概念图批量替代。',
  '按24组知识任务与93节点关联范围分批推进；图组不是成图数量，节点盘点不是验收完成数量。',
  '完成原文、几何、图模与桌面/手机四轮复核后再替换正式配图；本审计页保留历史盘点，当前稿件见技术重绘对照页。',
];

const redrawJobs = nodes.map(node => {
  const lesson = lessons.find(item => item.key === node.primary.lessonKey);
  assert(lesson, 'Missing primary lesson: ' + node.id);
  return { id: node.id, title: node.title, category: node.category,
    action: node.image ? 'replace-with-original-drawing' : 'create-original-drawing',
    status: 'brief-only-not-drawn', lessonKey: lesson.key, lessonPath: lesson.path,
    knowledgeId: node.primary.knowledgeId, knowledgeQuestion: node.primary.question,
    modelObjects: node.primary.objects, relatedCourseGroups: lesson.proposal.groups,
    requiredInformation: ['本节点在整体中的定位与观察方向', '可验证的构件、层次与空间联系', '本知识问题对应的关系解释', '模型未表达的连接、尺寸与性能缺项'],
    evidenceStatus: '新图须按用户原图核对构造，同时核验标准原文、模型几何及参数来源',
    oldImageReused: false, oldImageTraced: false, basedOnOriginal: true };
});
assert.equal(redrawJobs.length, 93);
assert(redrawJobs.every(job => !job.oldImageReused && !job.oldImageTraced));
const inventory = { date: '2026-10-29', scope: 'source-based-redraw-audit', redrawPolicy, counts,
  lessons, nodes, redrawJobs, drawingGroups, generalInformation, standards, historicalEvidence: existingEvidence };
await writeFile(output + '/inventory.json', JSON.stringify(inventory, null, 2) + '\n');
await writeFile(output + '/recommendations.json', JSON.stringify({ date: inventory.date, redrawPolicy, drawingGroups, lessonDrawingPlan, redrawJobs }, null, 2) + '\n');
const sourceBoundary = '本轮核对了制图标准版本目录及相关表达章节，尚未完成新图逐条原文与构造参数验收。制图标准解决表达规则，构造与性能另查相应专项依据；不能因列出标准名称就宣称新图符合全部要求。';
const list = items => '<ul>' + items.map(item => `<li>${escape(item)}</li>`).join('') + '</ul>';
let md = '# 教材配图全量重绘审计\n\n2026-10-29。54节课程、88个知识单元、93个可用节点。**按用户原图进行技术重绘；首批7张稿件已生成，尚未完成全部配图验收。**\n\n';
md += '## 全量重绘边界\n\n' + redrawPolicy.exclusions.map(item => '- ' + item).join('\n') + '\n\n新稿依据：\n\n' + redrawPolicy.sources.map(item => '- ' + item).join('\n') + '\n\n';
md += '## 现状判断\n\n' + findings.map(item => '- ' + item).join('\n') + '\n\n';
md += '## 墙体图重新设计要求\n\n' + wallCase.map(item => '- ' + item).join('\n') + '\n\n';
md += '## 新图必须包含的信息\n\n| 信息 | 内容 |\n|---|---|\n' + generalInformation.map(([name, description]) => `| ${name} | ${description} |`).join('\n') + '\n\n';
md += '## 24组全部新绘，12组优先\n\n24组是知识图组，包含总图、原理图、关联视图与比较图；每组实际子图数待逐图设计。不是24张标准施工详图。\n\n';
for (const group of drawingGroups) {
  md += `### ${group.id} · ${group.priority} · ${group.title}\n\n方式：${group.method}。\n\n` + group.information.map(item => '- ' + item).join('\n') + `\n\n取证任务：${group.evidence}\n\n表达边界：${group.boundary}\n\n关联课程：` + lessons.filter(lesson => lesson.proposal.groups.includes(group.id)).map(lesson => `[${lesson.title}](${courseUrl(lesson)})`).join('、') + '\n\n';
}
md += '## 54课新图位置清单\n\n| 课程 | 图组 | 插入标题与知识目的 |\n|---|---|---|\n' + lessons.map(lesson => `| ${lesson.groupTitle} / [${lesson.title}](${courseUrl(lesson)}) | ${lesson.proposal.groups.join('、')} | “${lesson.proposal.insertAt}”：${lesson.proposal.focus} |`).join('\n') + '\n\n';
md += '## 93节点的新绘任务\n\n91项全新绘制后替换旧图，2项缺图补绘。每项均有主课程和知识问题，详见[全量重绘任务书](recommendations.json)。\n\n| 节点 | 主知识位置 | 行动 |\n|---|---|---|\n' + redrawJobs.map(job => `| ${job.title} | ${job.lessonKey} / ${job.knowledgeId} | ${job.action === 'create-original-drawing' ? '缺图，新绘' : '新绘后替换旧图'} |`).join('\n') + '\n\n';
md += '## 依据与验收\n\n' + standards.map(source => `- [${source.title}](${source.url})：${source.scope}`).join('\n') + '\n\n' + sourceBoundary + '\n\n所有新图独立建立DiagramEvidence，旧图证据只留历史身份。\n\n';
md += '## 后续顺序\n\n' + nextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n') + '\n\n配图嵌入对应知识点旁，比较按需展开，图注保留网页文字、手机支持分图阅读。实践课提供新绘空白模板和核对表，保留独立作答任务。\n';
await writeFile(output + '/report.md', md);
const groupCards = drawingGroups.map(group => `<details id="${group.id}" class="proposal" data-priority="${group.priority}" data-search="${escape(group.id + ' ' + group.title + ' ' + group.information.join(' ') + ' ' + lessons.filter(lesson => lesson.proposal.groups.includes(group.id)).map(lesson => lesson.title).join(' '))}"><summary><span class="badge">${group.priority}</span><strong>${group.id} · ${escape(group.title)}</strong><span class="muted">${escape(group.method)}</span></summary><div class="inside">${list(group.information)}<p><b>取证任务：</b>${escape(group.evidence)}</p><p class="boundary"><b>表达边界：</b>${escape(group.boundary)}</p><p class="links">${lessons.filter(lesson => lesson.proposal.groups.includes(group.id)).map(lesson => `<a href="${courseUrl(lesson)}">${escape(lesson.title)} ↗</a>`).join('')}</p></div></details>`).join('');
const lessonRows = lessons.map((lesson, index) => `<tr data-search="${escape(lesson.title + ' ' + lesson.groupTitle + ' ' + lesson.proposal.focus + ' ' + lesson.proposal.groups.join(' '))}"><td>${String(index + 1).padStart(2, '0')}</td><td><small>${escape(lesson.groupTitle)}</small><a class="course" href="${courseUrl(lesson)}">${escape(lesson.title)} ↗</a><span class="muted">当前正文图 ${lesson.markdownImages.length} 处 · 关联节点 ${lesson.relatedNodes.length}</span></td><td>${lesson.proposal.groups.map(id => `<a href="#${id}">${id}</a>`).join(' ')}<p><b>${escape(lesson.proposal.insertAt)}</b></p><p>${escape(lesson.proposal.focus)}</p><details><summary>对应知识单元与节点</summary>${lesson.units.map(unit => `<p><a href="${courseUrl(lesson)}?unit=${unit.id}"><code>${unit.id}</code> · ${escape(unit.title)}</a></p>`).join('')}${lesson.relatedNodes.map(node => `<p><a href="${nodeUrl(node.id)}">${escape(node.title)}</a> · ${node.image ? '旧图待全部替换' : '缺图，新绘'}</p>`).join('')}</details></td></tr>`).join('');
const nodeRows = redrawJobs.map(job => `<tr><td><a href="${nodeUrl(job.id)}">${escape(job.title)} ↗</a><small>${escape(job.category)} · ${job.id}</small></td><td>${job.action === 'create-original-drawing' ? '缺图：独立新绘' : '全新绘制后替换旧图'}<small>按原图重绘；实例参数单独核验</small></td><td><a href="http://localhost:5173/#/lesson/${job.lessonPath}?unit=${job.knowledgeId}">${escape(job.lessonKey)}</a><small>${job.knowledgeId}</small><p>${escape(job.knowledgeQuestion)}</p></td></tr>`).join('');
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>教材配图全量重绘审计 · 2026-10-29</title><style>
:root{--ink:#1e2747;--blue:#465993;--red:#e84b38;--muted:#65748f;--line:#d8dfed;--paper:#f8f8f5;--soft:#eef1f7}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.8 'Microsoft YaHei',sans-serif}main{max-width:1240px;margin:auto;padding:44px 36px 80px}header{border-bottom:1px solid var(--line);padding:25px 0}h1{font-size:clamp(30px,4vw,46px);line-height:1.4}h2{font-size:25px}.eyebrow{font-size:12px;letter-spacing:.12em;color:var(--blue);font-weight:bold}.eyebrow:before{content:'';display:inline-block;width:25px;height:2px;background:var(--red);margin-right:10px;vertical-align:middle}a{color:var(--blue);text-underline-offset:4px}a:hover{color:var(--red)}nav,.links{display:flex;flex-wrap:wrap;gap:10px 22px}section{margin-top:40px}.metrics{display:grid;grid-template-columns:repeat(6,1fr);border-block:1px solid var(--line);margin:24px 0}.metrics div{padding:18px 8px}.metrics strong{display:block;font-size:30px;color:var(--blue)}.metrics span,small{display:block;font-size:12px;color:var(--muted)}.callout,.boundary{background:var(--soft);padding:18px 22px;border-left:3px solid var(--blue)}.callout{border-color:var(--red)}li{margin:8px 0}.muted{color:var(--muted);font-size:12px}.badge{display:inline-block;padding:2px 8px;color:var(--blue);border:1px solid #c1cde6;border-radius:4px;font:12px/1.6 sans-serif}.table{overflow-x:auto;border:1px solid var(--line)}table{border-collapse:collapse;width:100%;background:white;font-size:14px}td,th{text-align:left;vertical-align:top;padding:14px;border-bottom:1px solid var(--line)}th{background:var(--soft);color:var(--blue);font-size:12px}td p{margin:8px 0}#lesson-table{min-width:750px}#lesson-table td:nth-child(2){width:28%}.course{display:block;font-weight:bold;margin:6px 0}summary{cursor:pointer;color:var(--blue)}details.proposal{background:white;border:1px solid var(--line);margin:12px 0;border-radius:4px;scroll-margin-top:20px}.proposal>summary{display:flex;gap:14px;align-items:center;padding:18px;flex-wrap:wrap}.proposal>summary strong{flex:1}.inside{padding:0 22px 22px}.filter{display:flex;gap:12px;align-items:center;flex-wrap:wrap;background:var(--soft);padding:18px;margin:22px 0}input,select{font:inherit;padding:10px;border:1px solid #bac6df;border-radius:4px;background:white;color:var(--ink)}input{flex:1;min-width:200px}code{font-size:12px;overflow-wrap:anywhere}.note{font-size:13px;color:var(--muted)}footer{border-top:1px solid var(--line);margin-top:45px;padding-top:20px}[hidden]{display:none!important}@media(max-width:650px){main{padding:24px 18px 50px}.metrics{grid-template-columns:repeat(3,1fr)}.metrics strong{font-size:25px}.proposal>summary{gap:8px}.proposal>summary strong{flex-basis:75%}.proposal>summary>.muted{flex-basis:100%;padding-left:45px}h2{font-size:22px}.filter{align-items:stretch}input{width:100%;flex-basis:100%}.callout,.boundary{padding:14px 16px}.inside{padding:0 16px 18px}}a:focus-visible,summary:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--red);outline-offset:3px}</style></head><body><main>
<header><span class="eyebrow">ORIGINAL DRAWINGS × KNOWLEDGE / 2026-10-29</span><h1>以原图为依据重绘，<br>用技术图纸衔接教材知识</h1><p>保留原图构造细节，重新绘制线条、图例、标注和关联说明；旧参数与现行要求分别核验。54课、93节点是盘点与关联范围，并非已完成数量。</p><nav><a href="#status">现状</a><a href="#wall-case">墙体重绘要求</a><a href="#information">信息字段</a><a href="#proposals">新绘图组</a><a href="#lessons">54课清单</a><a href="#assets">93节点任务</a><a href="#standards">依据与验收</a><a href="report.md">文字报告 ↗</a></nav></header>
<div class="metrics">${[[54,'课程'],[88,'知识单元'],[93,'节点新绘任务'],[3,'正文旧图待替换'],[24,'新绘知识图组'],[12,'优先图组']].map(([count,label])=>`<div><strong>${count}</strong><span>${label}</span></div>`).join('')}</div>
<p class="callout"><b>最新要求已改为按原图进行技术重绘。</b>此前简单原理框图不作为本次构件图方案。<a href="../source-drawing-redraw-2026-10-29/index.html">查看首批7张原图与重绘对照 ↗</a>。全部配图尚未验收完成，未批量替换正式教材。</p>
<section id="status"><h2>现状与主要缺口</h2>${list(findings)}<p class="note">全量核对了资产、知识关系与章节标题；历史盘点可以追溯，原始位图不作为重绘成品。</p></section>
<section id="wall-case"><h2>墙体：保留原图构造深度，逐项复核</h2>${list(wallCase)}<div class="boundary"><b>新稿来源</b>${list(redrawPolicy.sources)}<b>素材边界</b>${list(redrawPolicy.exclusions)}</div></section>
<section id="information"><h2>新图必须包含的信息</h2><div class="table"><table><thead><tr><th>信息</th><th>需要表达</th></tr></thead><tbody>${generalInformation.map(([name,description])=>`<tr><td><b>${escape(name)}</b></td><td>${escape(description)}</td></tr>`).join('')}</tbody></table></div></section>
<section id="proposals"><h2>24组全部新绘 · 12组优先</h2><p>P0先讲清关键二维信息，P1扩展比较与专项连接。图面依据原图重建；标准、模型、实例值与教学假设的证据范围分别标识。</p><div class="filter"><label for="filter">查找课程或图组</label><input id="filter" type="search" placeholder="如：墙脚、楼梯、D17"><select id="priority" aria-label="筛选新绘图优先级"><option value="all">全部优先级</option><option value="P0">P0 优先</option><option value="P1">P1 后续</option></select><span id="result" role="status">24组 · 54节</span></div>${groupCards}</section>
<section id="lessons"><h2>54课的新图位置清单</h2><p class="note">插入标题已与当前教材核对。相同对象跨课使用同一新图索引，避免重复绘制和编号混乱。</p><div class="table"><table id="lesson-table"><thead><tr><th>序号</th><th>课程与现状</th><th>新绘图组、位置与知识目的</th></tr></thead><tbody>${lessonRows}</tbody></table></div></section>
<section id="assets"><h2>93节点的新绘任务</h2><p>91项替换已有配图，2项补齐缺图。每个节点均有主课程、知识问题和新绘任务；本清单不提供旧图缩略图与素材链接。</p><details><summary>展开93项任务与主教学位置</summary><div class="table"><table><thead><tr><th>节点</th><th>新绘行动</th><th>主知识位置与学习问题</th></tr></thead><tbody>${nodeRows}</tbody></table></div></details><p><a href="inventory.json">历史盘点与知识关联JSON</a> · <a href="recommendations.json">全量新绘任务书JSON</a></p></section>
<section id="standards"><h2>依据与验收</h2>${standards.map(source=>`<p><a href="${source.url}" target="_blank">${escape(source.title)} ↗</a><br><span class="note">${escape(source.scope)}</span></p>`).join('')}<p class="boundary">${escape(sourceBoundary)}所有新图独立建立DiagramEvidence；旧图证据仅保留历史身份。</p><h3>后续顺序</h3><ol>${nextSteps.map(step=>`<li>${escape(step)}</li>`).join('')}</ol><p>新图嵌入知识点旁，比较按需展开，图注保留网页文字、手机支持分图阅读。实践课提供新绘空白模板与核对表。</p></section>
<footer><p>2026-10-29 · 全量重绘审计。<a href="../curriculum-integration-2026-10-29/index.html">现版课程融合记录</a> · <a href="recommendations.json">逐图任务数据</a></p></footer>
</main><script>const field=document.getElementById('filter'),priority=document.getElementById('priority'),cards=[...document.querySelectorAll('.proposal')],rows=[...document.querySelectorAll('#lesson-table tbody tr')];function update(){const q=field.value.trim().toLocaleLowerCase();for(const card of cards)card.hidden=!card.dataset.search.toLocaleLowerCase().includes(q)||(priority.value!=='all'&&card.dataset.priority!==priority.value);for(const row of rows)row.hidden=!row.dataset.search.toLocaleLowerCase().includes(q);document.getElementById('result').textContent=cards.filter(card=>!card.hidden).length+'组 · '+rows.filter(row=>!row.hidden).length+'节';}field.addEventListener('input',update);priority.addEventListener('change',update);function revealGroup(){const target=document.getElementById(location.hash.slice(1));if(target?.matches('details.proposal')){if(target.hidden){field.value='';priority.value='all';update();}target.open=true;target.scrollIntoView({block:'start'});}}window.addEventListener('hashchange',revealGroup);revealGroup();</script></body></html>`;
const ids = [...html.matchAll(/(?:\s|<)id="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Audit IDs must be unique');
assert.equal((html.match(/class="proposal"/g) ?? []).length, 24);
assert.equal((html.match(/data-search="/g) ?? []).length, 78);
assert(!html.includes('<img'), 'Full-redraw report must not display old drawings');
new Function(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
for (const lesson of lessons) assert.equal(digest(await readFile(lesson.source, 'utf8')), lesson.sourceSha256, 'Curriculum changed during audit: ' + lesson.key);
await writeFile(output + '/index.html', html);
console.log(JSON.stringify({ counts, redrawJobs: redrawJobs.length, policy: redrawPolicy.mode, report: output + '/index.html', validation: '54 headings, 88 units, 24 groups, 93 new drawing tasks, no old image display, unchanged curriculum hashes' }, null, 2));
