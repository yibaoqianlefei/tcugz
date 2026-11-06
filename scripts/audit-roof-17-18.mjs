import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='audit-output/roof-source-redraw-batch-02-2026-11-01';
const out='audit-output/roof-17-18-focused-review-2026-11-02';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
await mkdir(out,{recursive:true});
const drafts=(await json(root+'/evidence.json')).filter(d=>d.order>=17);
const drainage=await json('audit-output/roof-batch-two-model-audit-2026-11-01/drainage-review.json');
const storage=await json('audit-output/roof-batch-two-model-audit-2026-11-01/storage-review.json');
const issues={
 'eaves-gutter-01':[
  {id:'17-01',priority:'P1',status:'confirmed-source-detail-loss',title:'右上屋面薄带的点状图例丢失',evidence:'原图右上斜薄带内部可见点状纹理；现稿 roof-surface-envelope 为白色填充。原图未说明材料，但不能因此删除图例。',action:'恢复与源图相符的疏密适当的中性点状表达，保留材料未定，不擅自命名为混凝土或找坡层。'},
  {id:'17-02',priority:'P1',status:'confirmed-path-discontinuity-needs-source-resolution',title:'沟底细轮廓在落口肩部悬空结束',evidence:'gutter-bottom-return 左端至(254,270)、右端从(329,270)起；管壁上缘位于 y278。两处存在8个绘图单位的未交代断开。原图此处密黑相接，现稿却把接口表达成敞开的细带端部。8只是SVG坐标差，不是毫米。',action:'放大原图落口左右斜肩，逐条确认沟底轮廓、管壁和连接；对可证的接口共用锚点。材料未核定前，不填三角楔，也不将全部细线认作防水层。'},
  {id:'17-03',priority:'P2',status:'confirmed-model-naming-mismatch',title:'模型“圈梁”网格实际含贯通孔腔',evidence:'既有已解码网格及射线记录显示：名为圈梁的右侧板状构件具有一条纵向贯通孔；墙顶厚支承与檐沟合为另一个网格。当前GLB摘要与该记录一致。',action:'后续建立“源对象名—实际几何—图纸构件”的映射；保留源文件身份，界面名称或讲解单独澄清，不能把图纸空心板改叫圈梁。'},
  {id:'17-04',priority:'P2',status:'scope-condition',title:'尺寸与截面范围需保留实例身份',evidence:'≥120下端在分水线，非最低沟底；≥200保留原水平投影。源图右侧孔腔为截断局部，模型为完整孔腔；两者范围不同不等于模型缺陷。',action:'不把≥120解释为总沟深，不把≥200解释为所有工程的通用净宽；不为了匹配模型补全源图截断端。'}],
 'roof-access-hatch-01':[
  {id:'18-01',priority:'P1',status:'confirmed-drawing-model-scope-mismatch',title:'原图标注不能与模型三片防水逐层等同',evidence:'原图明确标注防水层、附加卷材、混凝土压顶圈和人孔盖。相同摘要的GLB已解码记录中，存在两片全幅主防水与局部附加片，并另有盖缝件、保温和找坡构件。',action:'重绘保持原图范围；教材与节点应单列模型扩展实例，不能用模型SBS命名为原图补定品种、道数或完整层序。'},
  {id:'18-02',priority:'P1',status:'unresolved-source-interpretation',title:'内侧长线被实体化为两道卷材延伸至板底',evidence:'当前四个 membrane 路径均绕过井壁顶部后沿洞口内侧至 y405。原图分辨率仅397×250，内侧相邻细线不能独立证实两道材料均延伸到底。GB50345的垂直出入口条款关注压顶圈下的收头，并不能证明这段下延。',action:'重新追踪原图局部，将井壁内轮廓、板边、卷材收头分别辨认。无法判定的相邻线保持中性线，避免用深色闭合条带制造已确认层次。'},
  {id:'18-03',priority:'P1',status:'unresolved-layer-extent',title:'附加层全幅延伸缺少独立范围依据',evidence:'hatch-additional-membrane-left/right 从图幅水平截断边连续铺至井壁并下返；原图标注说明存在附加卷材，但未提供可用于确定所有端点的清晰范围尺寸。模型实测的附加片是局部范围，不能拿模型反推原图截断边。',action:'复核源图各层终点与截断，区分截取范围和真实材料终止面；不得把已知“附加”身份推演为全屋面必设的一层。'},
  {id:'18-04',priority:'P2',status:'confirmed-knowledge-order-mismatch',title:'知识卡顺序与实际局部层序不一致',evidence:'原有射线样点显示自下向上为附加→第一主片→第二主片；当前 order 为第一7、附加8、第二9，UI倒序显示。模型与卡片摘要已分别核对。',action:'后续明确目录序号不表示施工顺序，或按已核定空间层序调整显示，保留GLB与分解动作。'},
  {id:'18-05',priority:'P2',status:'parameter-boundary',title:'原图250与规范的不同量取对象分开表达',evidence:'原图只有竖向250，不带≥。GB50345-2012第4.11.21条及图4.11.21另说明附加层平立面范围和压顶下收头。原图竖向数值不能直接替代所有这些要求。',action:'原图实例继续保留250及其投影；规范依据放在正文，明确对象与适用条件，不能把原图改写为“现行统一井壁净高”。'}]
};
const records=[];
for(const d of drafts){
 const prior=d.order===17?drainage.records.find(r=>r.id===d.id):storage.nodes.find(r=>r.id===d.id);
 assert.equal(sha(await readFile(prior.model.path)),prior.model.sha256,'Historical mesh evidence no longer matches current model');
 const inputs={};
 for(const p of ['public'+d.source.projectSource,root+'/'+d.assets.textbook,root+'/'+d.assets.node,prior.model.path,d.order===17?'src/data/eavesGutterLayers.ts':'src/data/roofAccessHatchLayers.ts'])inputs[p]=sha(await readFile(p));
 assert.equal(inputs['public'+d.source.projectSource],d.source.sha256);
 for(const mode of ['textbook','node'])assert.equal(inputs[root+'/'+d.assets[mode]],d.rendered[mode].sha256);
 records.push({id:d.id,order:d.order,title:d.title,status:'hold-for-source-correction',inputs,findings:issues[d.id],modelEvidence:{method:'Reuse decoded-mesh and ray evidence only after matching current GLB hash; no new ray run claimed.',path:prior.model.path,sha256:prior.model.sha256,priorRecord:d.order===17?'../roof-batch-two-model-audit-2026-11-01/drainage-review.json':'../roof-batch-two-model-audit-2026-11-01/storage-review.json',roles:prior.actualRoleMap,priorFindings:prior.findings},draft:d});
}
const standards=[
 {standard:'GB 50345—2012',clause:'4.11.21及图4.11.21',page:'印刷39页 / PDF第48页',source:'https://jncc.jinan.gov.cn/api-gateway/jpaas-web-server/front/document/download?fileName=cbe8bbd564d441da855045b991be1fac.pdf&fileUrl=n9s7FT%2FT21J6Ntg6aan3xDmP2b3NP5aKuPuvnTGi6yyYeV2QXwhJRWmsLYRb6%2B1HqvhmPIuKTGUHUXS61eHYYfsEBTls3nvJByyGGlJb%2F%2Bj46EmM5560Tzy95VdbS7JJ',pageImage:'../roof-source-redraw-batch-02-2026-11-01/standards/GB50345-pdf-48.png',finding:'垂直屋面出入口的附加层范围和压顶圈下收头是不同检查项，不能用原图竖向250一项概括。',scope:'实际查看本页正文与图；不将旧教材图直接宣布为完整现行合规设计。'},
 {standard:'GB 55030—2022',clause:'4.4.3、4.4.4',page:'印刷16页 / PDF第20页',source:'https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2024/art_17339_768499.html',pageImage:'../roof-source-redraw-batch-02-2026-11-01/standards/GB55030-pdf-20.png',finding:'排水坡度与排水系统应另行设计；本局部横剖面及≥200/≥120不能证明纵坡与系统能力。',scope:'实际查看已存官方文本页图；公告检索确认实施信息。'}
];
for(const s of standards)s.pageImageSha256=sha(await readFile(out+'/'+s.pageImage));
const report={checkedOn:'2026-11-02',status:'17-18-remain-unpublished',scope:'Source fidelity, SVG path review, same-hash model evidence, knowledge-card consistency and selected standards; not a complete engineering certification.',approvedElsewhere:[10,11,12,13,14,15,16],records,standards};
await writeFile(out+'/audit.json',JSON.stringify(report,null,2)+'\n');
const sections=records.map(r=>`<section id="${r.id}"><h2>${r.order} · ${r.title}</h2><p class="hold">暂不接入：先解决原图保真与图模范围问题</p><div class="comparison"><figure><figcaption>用户原图（保留原始文件）</figcaption><img src="${r.draft.source.projectSource}"></figure><figure><figcaption>当前重绘稿（本轮未修改）</figcaption><img src="../roof-source-redraw-batch-02-2026-11-01/${r.draft.assets.textbook}"></figure><figure><figcaption>模型预渲染 · 实际网格证据另见审计记录</figcaption><img src="/images/node-renders/${r.id}.webp"></figure></div><table><thead><tr><th>优先级 / 判断</th><th>证据与问题</th><th>下一步修正</th></tr></thead><tbody>${r.findings.map(f=>`<tr><td>${f.priority}<br>${escape(f.status)}</td><td><b>${f.title}</b><p>${f.evidence}</p></td><td>${f.action}</td></tr>`).join('')}</tbody></table><details><summary>输入摘要与网格证据范围</summary><pre>${escape(JSON.stringify({inputs:r.inputs,modelEvidence:r.modelEvidence},null,2))}</pre></details></section>`).join('');
await writeFile(out+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>屋顶17、18 · 重点审核</title><style>body{margin:0;background:#f8f8f5;color:#202942;font:16px/1.8 system-ui}main{max-width:1500px;margin:auto;padding:32px}a{color:#46578f}h1{font-size:36px}section{margin:50px 0}figure{margin:0;background:white;padding:16px;border:1px solid #d9deea}img{width:100%;height:480px;object-fit:contain}figcaption{font-weight:600;margin-bottom:16px}.comparison{display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:14px}.hold{color:#ad4337}table{width:100%;border-collapse:collapse;margin-top:24px;background:white}td,th{border:1px solid #d9deea;padding:16px;text-align:left;vertical-align:top}td:first-child{width:150px;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}.notice{border-left:4px solid #46578f;padding:16px;background:#edf0f8}@media(max-width:800px){main{padding:16px}.comparison{grid-template-columns:1fr}img{height:auto}table,tbody,tr,td{display:block}thead{display:none}td:first-child{width:auto}}</style><main><a href="../roof-source-redraw-batch-02-2026-11-01/index.html">← 九张总览</a><h1>17、18 · 原图、重绘与模型重点审核</h1><p>2026-11-02 · 12～16已按用户批准接入。17、18只完成复核，未替换正式图纸。</p><div class="notice">把已确认差异与待核定解释分开：17需补回可见图例、厘清落口细线接口；18需核定卷材终止位置和覆盖范围，并区分原图与模型扩展实例。原模型和当前待审SVG均未改动。</div><nav><a href="#eaves-gutter-01">17 檐沟外排水</a> · <a href="#roof-access-hatch-01">18 屋面检修口</a> · <a href="audit.json">完整证据记录</a></nav>${sections}<h2>本轮查阅的规范页图</h2>${standards.map(s=>`<p><b>${s.standard} · ${s.clause}</b>（${s.page}）<br>${s.finding}<br>${s.scope} <a href="${escape(s.source)}">官方来源</a> · <a href="${s.pageImage}">已查阅页图</a></p>`).join('')}<p>旧网格解码与射线数据经当前GLB摘要复核后引用；本轮未声称重新运行网格射线或完成全套工程审定。250、≥200、≥120继续保持原图实例身份。</p></main></html>`);
let gallery=await readFile(root+'/index.html','utf8');
for(const r of records){const start=gallery.indexOf('id="'+r.id+'"'),end=gallery.indexOf('</article>',start);assert(start>=0&&end>start);let card=gallery.slice(start,end);if(!card.includes('data-focused-hold'))card=card.replace('</nav>',`<a data-focused-hold href="../roof-17-18-focused-review-2026-11-02/index.html#${r.id}">重点审核 · 待修正 →</a></nav>`);gallery=gallery.slice(0,start)+card+gallery.slice(end);}
await writeFile(root+'/index.html',gallery);
const validation=await json(root+'/validation.json');validation.focusedReview17and18={date:'2026-11-02',status:'hold-for-source-correction',report:'../roof-17-18-focused-review-2026-11-02/index.html',supersedesPriorPassFor:[17,18]};validation.currentAdoption={orders:[10,11,12,13,14,15,16],pending:[17,18],receipt:'publication.json'};await writeFile(root+'/validation.json',JSON.stringify(validation,null,2)+'\n');
console.log(JSON.stringify({report:out+'/index.html',findings:records.map(r=>({order:r.order,count:r.findings.length})),modelHashesVerified:true}));
