import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {roofBatchTwo,renderRoofBatchTwo,escapeXml as esc} from './lib/roof-source-batch-two.mjs';
import {roofBatchTwoReferences,roofBatchTwoDifferences} from './lib/roof-batch-two-references.mjs';

export const root='audit-output/roof-source-redraw-batch-02-2026-11-01';
const sha=s=>createHash('sha256').update(s).digest('hex');
for(const dir of ['textbook','node','previews','view','source','standards','checks'])await mkdir(root+'/'+dir,{recursive:true});
async function files(path){const result=[];for(const e of await readdir(path,{withFileTypes:true})){const p=path+'/'+e.name;if(e.isDirectory())result.push(...await files(p));else result.push(p);}return result;}
const protectedPaths=[...(await files('public/images/learning')).filter(p=>p.endsWith('.svg')),
 'src/data/nodeDefinitions.ts','src/data/sourceDrawingEvidence.json','src/data/nodeDiagramLayouts.json','src/data/curriculumLearning.json',
 'audit-output/roof-source-redraw-batch-01-2026-10-30/evidence.json','audit-output/roof-source-redraw-batch-01-2026-10-30/approvals.json'];
const beforePath=root+'/protected-assets.json';
let protectedAssets;
try{protectedAssets=JSON.parse(await readFile(beforePath,'utf8'));}
catch{protectedAssets=await Promise.all(protectedPaths.map(async path=>({path,sha256:sha(await readFile(path))})));
 await writeFile(beforePath,JSON.stringify(protectedAssets,null,2)+'\n');}
for(const p of protectedAssets)if(sha(await readFile(p.path))!==p.sha256)throw new Error('Protected published resource changed: '+p.path);

const archive='audit-output/roof-source-redraw-batch-01-2026-10-30/standards/';
for(const [source,target] of [['GBT50001-2017-official.pdf','GBT50001-2017-official.pdf'],['GB55030-2022-official.pdf','GB55030-2022-official.pdf'],['review-2026-11-01/GB50345-jinan.pdf','GB50345-jinan.pdf']])await copyFile(archive+source,root+'/standards/'+target);
const graph=JSON.parse(await readFile('src/data/curriculumLearning.json','utf8'));
const records=[];
for(const def of roofBatchTwo){
 const input='public/images/roof/'+def.file, bytes=await readFile(input),info=await sharp(bytes).metadata(),data=def.build();
 await copyFile(input,root+'/source/'+def.file);
 const supplementalSources=[];
 for(const s of def.supplementalSources??[]){
  const b=await readFile(s.path), target='source/block-tile-complete.png';await writeFile(root+'/'+target,b);
  supplementalSources.push({...s,path:target,originalPath:s.path,sha256:sha(b)});
 }
 const primary=graph.nodes[def.id]?.primary;
 if(!primary)throw new Error('Missing learning context: '+def.id);
 const record={id:def.id,title:def.title,order:def.order,revision:def.revision,
  source:{path:'source/'+def.file,projectSource:'/images/roof/'+def.file,sha256:sha(bytes),width:info.width,height:info.height,figure:def.figure??null},
  supplementalSources,scope:data.view,knowledgeContext:{nodeId:def.id,lesson:primary.lessonPath,unitId:primary.knowledgeId},
  parameters:def.parameters,sourceFeatures:def.sourceFeatures,sourceReconstruction:{method:'native-semantic-vector-reconstruction',tracedScanContours:false},
  geometryDigests:Object.fromEntries(data.parts.map(p=>[p.id,sha(p.body)])),anchors:data.anchors,interfaces:data.interfaces,dimensions:data.dimensions,
  geometryChecks:def.checks,orthogonalChecks:data.orthogonalChecks??[],teaching:def.teaching,references:roofBatchTwoReferences(def),
  unresolved:def.uncertainties,sourceVsCurrentRequirements:roofBatchTwoDifferences(def),
  publication:{status:'draft',formalReplacement:false},technicalReview:{status:'partial',scope:'源图可辨关系、原生线稿、实例参数与已实际阅读标准范围；不作为工程设计审定。'},
  assets:{textbook:'textbook/'+def.id+'.svg',node:'node/'+def.id+'.svg'},rendered:{}};
 for(const mode of ['textbook','node']){
  const result=renderRoofBatchTwo(def,data,record,mode);
  await writeFile(root+'/'+record.assets[mode],result.svg);
  await sharp(Buffer.from(result.svg)).png().toFile(root+'/previews/'+mode+'-'+def.id+'.png');
  record.rendered[mode]={sha256:sha(result.svg),width:result.width,height:result.height,geometryPlacement:result.geometryPlacement,graphicBox:result.graphicBox};
 }
 records.push(record);
}
await writeFile(root+'/evidence.json',JSON.stringify(records,null,2)+'\n');
await writeFile(root+'/sources.json',JSON.stringify(records.map(r=>({id:r.id,...r.source,supplementalSources:r.supplementalSources})),null,2)+'\n');
const css=`*{box-sizing:border-box}body{margin:0;color:#202d46;background:#f7f8fa;font:16px/1.75 system-ui}header,main{max-width:1540px;margin:auto;padding:28px}a{color:#465b96;text-decoration:none}h1{font-size:34px;margin:12px 0}h2{font-size:23px}h3{font-size:18px}p,small{color:#66738a}nav{display:flex;gap:20px;flex-wrap:wrap}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.tile,.panel{background:white;border:1px solid #d9dfeb;padding:18px}.tile img{width:100%;height:280px;object-fit:contain}.num{font-size:25px;color:#465b96}img{display:block;width:100%;height:auto}.compare{display:grid;grid-template-columns:minmax(260px,.7fr) minmax(500px,1.4fr);gap:24px;align-items:start}.reader{width:min(390px,100%);height:760px;overflow:auto;background:white;border:1px solid #d9dfeb}.reader img{width:100%}.reader318{width:318px;height:650px}.readers{display:flex;gap:24px;overflow:auto}.readers>.panel{flex:0 0 430px}summary{cursor:pointer;color:#465b96}details{padding:15px 0;border-top:1px solid #d9dfeb}li{margin:9px 0}.warning{border-left:3px solid #e94b35;padding-left:16px}section{margin:30px 0}code{overflow-wrap:anywhere}@media(max-width:1000px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.compare{grid-template-columns:1fr}}@media(max-width:650px){header,main{padding:18px}.grid{grid-template-columns:1fr}h1{font-size:27px}}`;
const head=(title)=>`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${css}</style>`;
for(const r of records){
 const v=mode=>r.rendered[mode].sha256.slice(0,12);
 await writeFile(root+'/view/'+r.id+'.html',head(r.title+' · 原图对照')+`<header><nav><a href="../index.html#${r.id}">← 第二组九张</a><a href="../${r.assets.textbook}?v=${v('textbook')}">教材SVG</a><a href="../${r.assets.node}?v=${v('node')}">节点SVG</a></nav><h1>${r.order} · ${esc(r.title)}</h1><p>原生矢量重绘稿 · 正式教材与模型未改变</p></header><main><div class="compare"><section class="panel"><h2>所用原图</h2><img src="../${r.source.path}" alt="${esc(r.title)}原图">${r.supplementalSources.map(s=>`<details><summary>补充完整原图 · ${esc(s.figure??'图6-47')}</summary><img src="../${s.path}" alt="完整块瓦原图"></details>`).join('')}</section><section class="panel"><h2>教材版</h2><img src="../${r.assets.textbook}?v=${v('textbook')}" alt="${esc(r.title)}新版"></section></div><section><h2>节点版 · 390px图纸栏</h2><div class="reader"><img src="../${r.assets.node}?v=${v('node')}" alt="节点窄版"></div></section><section class="panel"><h2>教材讲解</h2><p>${esc(r.teaching)}</p><p><a href="/#/lesson/${r.knowledgeContext.lesson}?unit=${r.knowledgeContext.unitId}">对应知识单元 ↗</a> · <a href="/#/node/${r.id}">现有交互模型 ↗</a></p><details><summary>原图参数与适用边界</summary><ul>${r.parameters.map(p=>`<li>${esc(p.name)}：${esc(p.value)}。${esc(p.conditions??'仅为原图实例。')}</li>`).join('')}</ul>${r.sourceVsCurrentRequirements.map(p=>`<p class="warning">${esc(p)}</p>`).join('')}<ul>${r.unresolved.map(p=>`<li>${esc(p)}</li>`).join('')}</ul></details><details><summary>规范依据</summary><ul>${r.references.map(p=>`<li><a href="${p.officialSource}">${esc(p.standard)}</a> · ${esc(p.clause??'')} · ${esc(p.page??'未取得印刷页码')}<p>${esc(p.verification)}</p></li>`).join('')}</ul></details><details><summary>本稿构造核对记录</summary><ul>${r.geometryChecks.map(p=>`<li>${esc(p)}</li>`).join('')}</ul></details></section></main></html>`);
}
await writeFile(root+'/index.html',head('屋顶原图重绘 · 第二组九张')+`<header><nav><a href="../roof-clean-line-review-2026-11-01/index.html">← 第一组已接入图纸</a><a href="reading-check.html">窄栏阅读检查</a><a href="evidence.json">逐图依据</a></nav><h1>屋顶原图重绘 · 第二组</h1><p>10～18 · 两种蓄水排水、三种块瓦屋面、三种排水檐沟及屋面检修口。</p><p>9张原图 · 18份可编辑SVG · 依据原图重建清晰线稿。当前为本批图稿，既有正式资源保持不变。</p><p>平屋面、坡屋顶两个模型没有独立原图，本组不从模型外观补造图纸。</p></header><main><div class="grid">${records.map(r=>`<article class="tile" id="${r.id}"><a href="view/${r.id}.html"><img loading="lazy" src="previews/textbook-${r.id}.png?v=${r.rendered.textbook.sha256.slice(0,12)}" alt="${esc(r.title)}"></a><span class="num">${r.order}</span><h2>${esc(r.title)}</h2><nav><a href="view/${r.id}.html">原图对照 →</a><a href="${r.assets.textbook}">教材SVG</a><a href="${r.assets.node}">节点SVG</a></nav></article>`).join('')}</div><section class="panel"><h2>本批依据与检查</h2><p><a href="standards/research-findings.md">标准适用与原图差异</a> · <a href="validation.json">当前稿验证记录</a> · <a href="protected-assets.json">既有资源保护记录</a></p></section></main></html>`);
await writeFile(root+'/reading-check.html',head('屋顶第二组 · 窄栏阅读')+`<header><nav><a href="index.html">← 第二组</a></nav><h1>节点图纸阅读检查</h1><p>318px与390px嵌入图纸栏；各图独立滚动。本页不是手机真机测试。</p></header><main>${records.map(r=>`<section><h2>${r.order} · ${esc(r.title)}</h2><div class="readers">${[318,390].map(width=>`<div class="panel"><h3>${width}px栏宽</h3><div class="reader" style="width:${width}px"><img src="${r.assets.node}?v=${r.rendered.node.sha256.slice(0,12)}" alt="${esc(r.title)}${width}px"></div></div>`).join('')}</div></section>`).join('')}</main></html>`);
for(const p of protectedAssets)if(sha(await readFile(p.path))!==p.sha256)throw new Error('Protected asset changed after build: '+p.path);
console.log(`Built ${records.length} drawings / ${records.length*2} native SVG drafts; ${protectedAssets.length} prior assets unchanged. No formal publication.`);
