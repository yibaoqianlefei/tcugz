import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {roofBatchTwo,renderRoofBatchTwo,roofBatchTwoDefs,roofBatchTwoStyle} from './lib/roof-source-batch-two.mjs';
const root='audit-output/roof-source-redraw-batch-02-2026-11-01',local='correction-parapet-2026-11-01',out=root+'/'+local,id='water-storage-parapet-drainage-01';
const sha=x=>createHash('sha256').update(x).digest('hex');
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const prior=(await read(out+'/before/evidence.json')).find(r=>r.id===id);
const records=await read(root+'/evidence.json'),definition={...roofBatchTwo.find(d=>d.id===id),revision:'roof-batch2-parapet-r2-source-projection-2026-11-01'},data=definition.build();
for(const dir of ['textbook','node','previews','checks'])await mkdir(out+'/'+dir,{recursive:true});
const changes=[
 {id:'mixed-view-hopper',source:'原PNG左侧雨水斗，x85～235/y365～591',old:'误当双壁剖面，删掉横向实体投影带、将下套箍改成左右L阶。',fixed:'按外形投影恢复上口沿、筒底横沿、下管套箍和管两侧线；不由投影闭合线断言通道封堵。'},
 {id:'short-mouth-ends',source:'原PNG上短口右端、低位外伸口左端',old:'统一用两条开口线，丢失投影端面竖边。',fixed:'恢复原有可见端边；未添加封堵装置、阀件或孔径。'},
 {id:'upper-projection',source:'原PNG≥100上部投影，邻压顶底/墙顶；竖向薄带始点',old:'薄带与上界降到墙顶以下，图形高差缩短。',fixed:'同一绘图高度106恢复原投影关系；材料测界仍未核定。'},
 {id:'board-joint',source:'原PNG第5与第6完整孔之间局部',old:'板体简化成无缝连续矩形。',fixed:'恢复上宽下窄的双侧板缝轮廓；底部连通及填料仍未核定。'},
 {id:'graphic-proportions',source:'原PNG墙厚作为共同图形对照基准',old:'压顶过窄、雨水斗及可见管段缩短。',fixed:'恢复压顶挑出、斗体/管段的相对图形比例，不把像素或SVG坐标变成施工尺寸。'},
 {id:'unknown-material',source:'原PNG墙根外带与板上白色细带',old:'无材料证据仍加入砂浆图例。',fixed:'改用中性白底轮廓；防水路径与原标麻丝嵌缝分别保留。'}
];
const record={...prior,revision:definition.revision,sourceFeatures:definition.sourceFeatures,
 sourceReconstruction:{method:'native-orthogonal-reconstruction-with-source-projection-view-separation',tracedScanContours:false},
 geometryDigests:Object.fromEntries(data.parts.map(p=>[p.id,sha(p.body)])),anchors:data.anchors,interfaces:data.interfaces,dimensions:data.dimensions,orthogonalChecks:data.orthogonalChecks,geometryChecks:definition.checks,
 unresolved:[...prior.unresolved,'雨水斗是外形投影，不是证明其内部流腔开闭的纵剖。','分板接缝上口及双边界可辨，底部墨线混合，未认定缝隙贯通或填料。'],
 correction:{date:'2026-11-01',previousSvgHashes:prior.rendered,changes,invalidatedChecks:'r1原图保真与雨水斗开口断言失效；旧结构/双版同源检查不证明原图准确。'},
 technicalReview:{status:'revised-source-match-awaiting-human-review',scope:'仅修正所点名原图匹配；规范版本与原实例参数沿用，不新增构造技术要求。'},rendered:{}};
for(const mode of ['textbook','node']){
 const r=renderRoofBatchTwo(definition,data,record,mode);await writeFile(out+'/'+mode+'/'+id+'.svg',r.svg);
 await sharp(Buffer.from(r.svg)).png().toFile(out+'/previews/'+mode+'-'+id+'.png');
 record.rendered[mode]={sha256:sha(r.svg),width:r.width,height:r.height,geometryPlacement:r.geometryPlacement,graphicBox:r.graphicBox};
 await writeFile(root+'/'+record.assets[mode],r.svg);
 await sharp(Buffer.from(r.svg)).png().toFile(root+'/previews/'+mode+'-'+id+'.png');
}
records[records.findIndex(r=>r.id===id)]=record;
await writeFile(root+'/evidence.json',JSON.stringify(records,null,2)+'\n');
await writeFile(out+'/evidence.json',JSON.stringify(record,null,2)+'\n');
const versionFile=async p=>{
 let html=await readFile(p,'utf8');
 for(const mode of ['textbook','node'])html=html.replaceAll(prior.rendered[mode].sha256.slice(0,12),record.rendered[mode].sha256.slice(0,12));
 return html;
};
const viewFile=root+'/view/'+id+'.html';
let view=await versionFile(out+'/before/view/'+id+'.html');
view=view.replace('<p>原生矢量重绘稿 · 正式教材与模型未改变</p>',`<p>2026-11-01 原图匹配修订稿 · 正式教材与模型未改变</p><p class="warning">本图已按原图重新修正雨水斗投影、短口端面、顶部锚点和板缝；旧r1原图保真结论已撤回。<a href="../${local}/index.html">查看修改前后对照 →</a></p>`);
view=view.replace(/<details><summary>本稿构造核对记录<\/summary>[\s\S]*?<\/details>/,`<details><summary>本稿构造核对记录</summary><ul>${definition.checks.map(x=>'<li>'+x+'</li>').join('')}</ul></details>`);
await writeFile(viewFile,view);
for(const page of ['index.html','reading-check.html'])await writeFile(root+'/'+page,await versionFile(out+'/before/'+page));
const css=`*{box-sizing:border-box}body{margin:0;color:#24314b;background:#f7f8fa;font:16px/1.8 system-ui}header,main{max-width:1540px;padding:26px;margin:auto}h1{font-size:30px}h2{font-size:22px}a{color:#465b96}nav{display:flex;gap:20px;flex-wrap:wrap}.compare{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.panel{background:white;border:1px solid #d9e0ec;padding:18px}img{width:100%;height:auto;display:block}table{border-collapse:collapse;width:100%;background:white;font-size:14px}th,td{text-align:left;vertical-align:top;border-bottom:1px solid #d9e0ec;padding:13px}section{margin:28px 0}.warning{border-left:3px solid #e94b35;background:#eef1f8;padding:16px}.readers{display:flex;gap:24px;overflow:auto}.reader{flex:0 0 auto;width:390px;height:730px;overflow:auto;background:white;border:1px solid #d9e0ec}.muted{color:#68768e;font-size:14px}@media(max-width:1050px){.compare{grid-template-columns:1fr}header,main{padding:18px}}`;
await writeFile(out+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>女儿墙式蓄水排水 · 原图匹配修正</title><style>${css}</style><header><nav><a href="../view/${id}.html">返回原审阅链接</a><a href="textbook/${id}.svg">修订教材SVG</a><a href="node/${id}.svg">修订节点SVG</a><a href="validation.json">修订验证记录</a></nav><h1>女儿墙式蓄水排水 · 原图匹配修正</h1><p class="warning">旧稿将雨水斗外形投影误解为纵剖，且遗漏孔口端面与板缝。本次只修正第10张，两版同步；另外8张未作本轮原图重新验收。</p></header><main><div class="compare"><section class="panel"><h2>原图</h2><img src="../source/${definition.file}" alt="原图"></section><section class="panel"><h2>旧稿r1 · 已撤回匹配结论</h2><img src="before/previews/textbook-${id}.png" alt="旧稿"></section><section class="panel"><h2>修订稿r2</h2><img src="previews/textbook-${id}.png?v=${record.rendered.textbook.sha256.slice(0,12)}" alt="修订稿"></section></div><section><h2>逐项修正</h2><table><thead><tr><th>原图定位</th><th>旧稿问题</th><th>本次处理</th></tr></thead><tbody>${changes.map(c=>`<tr><td>${c.source}</td><td>${c.old}</td><td>${c.fixed}</td></tr>`).join('')}</tbody></table></section><section><h2>节点栏阅读</h2><p class="muted">318px与390px嵌入栏宽；不是手机真机测试。</p><div class="readers">${[318,390].map(w=>`<div class="reader" style="width:${w}px"><img src="node/${id}.svg?v=${record.rendered.node.sha256.slice(0,12)}" alt="${w}px节点图"></div>`).join('')}</div></section><section class="panel"><h2>依据与保留项</h2><p>沿用已归档GB/T 50001—2017制图依据与本实例的技术适用边界；本次纠正来源表达，不新增材料、规范数值或施工要求。≥100、≤15m及同距仍为原图实例。上部材料测界、板缝底部与填料继续未定。</p><p><a href="evidence.json">本次源图、几何及修改记录</a> · <a href="before/evidence.json">旧批次证据留档</a> · <a href="checks/source-match-review.json">独立原图复核</a></p></section></main></html>`);
const geometryFrame=`<svg xmlns="http://www.w3.org/2000/svg" width="870" height="602" viewBox="0 0 870 602"><title>仅构造几何：用于原图共同图形框对照</title>${roofBatchTwoDefs}${roofBatchTwoStyle}<rect width="870" height="602" fill="white"/>${data.parts[0].body}</svg>`;
await writeFile(out+'/checks/source-frame-geometry.svg',geometryFrame);
await sharp(Buffer.from(geometryFrame)).png().toFile(out+'/previews/source-frame-geometry.png');
let comparison=await readFile(out+'/index.html','utf8');
comparison=comparison.replace('grid-template-columns:repeat(3,1fr)','grid-template-columns:repeat(2,1fr)')
 .replace(`<section class="panel"><h2>旧稿r1 · 已撤回匹配结论</h2><img src="before/previews/textbook-${id}.png" alt="旧稿"></section>`,'')
 .replace(`<h2>修订稿r2</h2><img src="previews/textbook-${id}.png?v=${record.rendered.textbook.sha256.slice(0,12)}" alt="修订稿">`,`<h2>修订几何 · 共用图形框对照</h2><img src="previews/source-frame-geometry.png?v=${sha(geometryFrame).slice(0,12)}" alt="修订几何同框对照"><p class="muted">与左图使用同一图形参考框，便于核对形状与相对比例；标注见完整SVG。不是按像素量取施工尺寸。</p>`)
 .replace('<section><h2>逐项修正</h2>',`<section class="panel"><details><summary>修订完整教材图</summary><img src="previews/textbook-${id}.png?v=${record.rendered.textbook.sha256.slice(0,12)}" alt="修订完整教材图"></details><details><summary>旧稿r1 · 已撤回匹配结论</summary><img src="before/previews/textbook-${id}.png" alt="旧稿"></details></section><section><h2>逐项修正</h2>`);
await writeFile(out+'/index.html',comparison);
const protection=await read(out+'/protected-assets.json');
for(const p of protection)if(sha(await readFile(p.path))!==p.sha256)throw new Error('Unselected/protected resource changed: '+p.path);
const validation={checkedOn:'2026-11-01',status:'correction-generated-awaiting-source-and-browser-review',target:id,revision:record.revision,changedSvgCount:2,nonTargetDrawingsUnchanged:8,protectedAssetsUnchanged:protection.length,oldChecksSupersededForTarget:true,engineeringApproval:false,sourceHashVerified:sha(await readFile(root+'/'+record.source.path))===record.source.sha256,currentSvgHashes:record.rendered,originalDrawingProofRequired:true};
try{validation.independentSourceReview=await read(out+'/checks/source-match-review.json');}catch{}
try{validation.browserReview=await read(out+'/checks/browser-review.json');}catch{}
try{validation.vectorReview=await read(out+'/checks/vector-check.json');}catch{}
if(validation.independentSourceReview&&validation.browserReview&&validation.vectorReview){
 const sourceChecks=await Promise.all(Object.entries(validation.independentSourceReview.inputHashes).map(async([path,expected])=>({path,expected,current:sha(await readFile(path))})));
 validation.sourceReviewInputHashesMatch=sourceChecks.every(c=>c.expected===c.current);
 validation.browserInputHashesMatch=['textbook','node'].every(mode=>validation.browserReview.svgHashes[mode]===record.rendered[mode].sha256);
 validation.currentSvgCopiesMatch=await Promise.all(['textbook','node'].map(async mode=>({mode,matches:sha(await readFile(root+'/'+record.assets[mode]))===record.rendered[mode].sha256})));
 const layout=validation.browserReview.layout;
 const layoutPass=layout.length===2&&layout.every(r=>!r.outside.length&&!r.overlaps.length&&!r.lineHits.length);
 const readers=validation.browserReview.embeddedReaders;
 const readersPass=readers.readers.length===2&&readers.readers.every(r=>r.loaded&&r.scrollWidth<=r.clientWidth)&&readers.documentWidth<=readers.width;
 if(!validation.sourceReviewInputHashesMatch||!validation.browserInputHashesMatch||validation.currentSvgCopiesMatch.some(c=>!c.matches)||!layoutPass||!readersPass||!validation.vectorReview.passed||validation.independentSourceReview.openRedrawIssues.length)throw new Error('Current correction review is stale or failed');
 validation.status='passed-with-recorded-source-uncertainties-awaiting-human-acceptance';
 validation.scope='第10张当前两版源特征、结构和嵌入阅读核对；不扩展为另外8张重新通过或工程规范合规认证。';
}
await writeFile(out+'/validation.json',JSON.stringify(validation,null,2)+'\n');
await writeFile(root+'/validation.json',JSON.stringify({checkedOn:'2026-11-01',status:'partial-revalidation-after-source-mismatch',changedTarget:id,correctionReport:local+'/index.html',currentCorrectionValidation:local+'/validation.json',priorValidation:local+'/before/validation.json',note:'旧批次通过记录保留为历史；第10张r1原图匹配结论撤回。其余8张资源未变，不据此宣称本轮重验通过。'},null,2)+'\n');
// Keep the prior model-audit evidence, but make its old drawing binding visible.
const oldAudit='audit-output/roof-batch-two-model-audit-2026-11-01/index.html';
try{let html=await readFile(oldAudit,'utf8');if(!html.includes('data-source-correction-notice')){html=html.replace('<main>',`<main><p data-source-correction-notice class="focus">更新：第10张女儿墙蓄水排水图r1原图匹配结论已撤回，2026-11-01修订稿见<a href="../roof-source-redraw-batch-02-2026-11-01/${local}/index.html">前后对照</a>。本报告保留原模型分析，但图纸SHA与旧截图只绑定修订前版本。</p>`);await writeFile(oldAudit,html);}}catch{}
console.log(JSON.stringify({target:id,revision:record.revision,svg:record.rendered,protected:protection.length,report:out+'/index.html'}));
