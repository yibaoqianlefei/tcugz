import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {roofBatchThree} from './lib/roof-source-batch-three.mjs';
import {renderRoofBatchThree,escapeXml as esc} from './lib/roof-source-batch-three-render.mjs';

const root='audit-output/roof-source-redraw-batch-03-2026-11-03';
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const dir of ['textbook','node','source','previews','view','checks','standards'])await mkdir(`${root}/${dir}`,{recursive:true});
async function files(path){const list=[];for(const e of await readdir(path,{withFileTypes:true})){const p=path+'/'+e.name;if(e.isDirectory())list.push(...await files(p));else list.push(p);}return list;}
const protectedPaths=[...(await files('public/images/learning')).filter(p=>p.endsWith('.svg')),...(await files('public/models')).filter(p=>p.endsWith('.glb')),'src/data/nodeDefinitions.ts','src/data/sourceDrawingEvidence.json','src/data/nodeDiagramLayouts.json','src/data/curriculumLearning.json','audit-output/roof-source-redraw-batch-02-2026-11-01/publication.json','audit-output/roof-source-redraw-batch-02-2026-11-01/approvals.json'];
let protectedAssets;try{protectedAssets=JSON.parse(await readFile(root+'/protected-assets.json','utf8'));}catch{protectedAssets=await Promise.all(protectedPaths.map(async path=>({path,sha256:sha(await readFile(path))})));await writeFile(root+'/protected-assets.json',JSON.stringify(protectedAssets,null,2));}
// Other work may update the shared course indexes while this isolated drawing batch is open.
// Never reset that work. Published drawings/models remain pinned to the original snapshot.
const concurrentIndexes=new Set(['src/data/nodeDefinitions.ts','src/data/curriculumLearning.json']);
const runSnapshot=[],externalChanges=[];
for(const r of protectedAssets){const current=sha(await readFile(r.path));runSnapshot.push({...r,sha256:current});if(current!==r.sha256){if(!concurrentIndexes.has(r.path))throw Error('Changed protected asset '+r.path);externalChanges.push({path:r.path,before:r.sha256,current,action:'observed external change; file not written by this generator'});}}
await writeFile(root+'/checks/concurrent-index-changes.json',JSON.stringify(externalChanges,null,2));
async function checkProtected(){for(const r of runSnapshot)if(sha(await readFile(r.path))!==r.sha256)throw Error('Protected asset changed during generation '+r.path);}
await checkProtected();
const archive='audit-output/roof-source-redraw-batch-02-2026-11-01/standards/';
const standardFiles=['GB50345-jinan.pdf','GB55030-2022-official.pdf','GBT50001-2017-official.pdf','GB55030-pdf-19.png','GB55030-pdf-20.png','GB55030-pdf-21.png','GBT50001-pdf-49.png','GBT50001-pdf-50.png','GBT50001-pdf-51.png'];
const standardHashes=[];for(const f of standardFiles){await copyFile(archive+f,root+'/standards/'+f);standardHashes.push({file:f,sha256:sha(await readFile(archive+f))});}
await writeFile(root+'/standards/archive-hashes.json',JSON.stringify(standardHashes,null,2));
const checkedOn='2026-11-03';
const refs=d=>[
 {standard:'用户原图实例',kind:'source-instance',officialSource:'../source/'+d.file,clause:d.figure??'局部截图，未含图号',page:null,checkedOn,verification:'原图构造与尺寸保留；原图材料做法不自动等于当前工程适用方案。'},
 {standard:'GB/T 50001—2017',kind:'drawing-expression',officialSource:'https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2018/art_17339_234638.html',clause:'11.1～11.3 尺寸注法',page:'印刷页43～45；PDF第49～51页',checkedOn,verification:'沿用归档的制图依据；图面尺寸数字与绘图坐标分离。'},
 {standard:'GB 55030—2022',kind:'current-system',officialSource:'https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2024/art_17339_768499.html',clause:'4.4.1、4.4.5',page:'印刷页15～17；PDF第19～21页',checkedOn,verification:'本轮核对发布公告与归档正文；防水系统及细部增强要求独立于旧图。全部条文强制，冲突时以本规范为准。'},
 {standard:'GB 50345—2012',kind:d.id.startsWith('rigid')?'context-not-direct-detail':'detail-context',officialSource:'https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=60869',documentSource:'https://jncc.jinan.gov.cn/attach/0/cbe8bbd564d441da855045b991be1fac.pdf',readingSource:'https://gf.cabr-fire.com/article-49282.htm',clause:d.id.startsWith('cast-iron')?'4.11.16':d.id.startsWith('vent')?'4.11.19':'4.11.18',page:d.id.startsWith('vent')?'印刷页37～38；PDF第46～47页':'印刷页36～37；PDF第45～46页',checkedOn,verification:d.id.startsWith('rigid')?'变形缝细部只供比较，不能把屋面分格缝等同结构变形缝，也不能据此认定二布三油旧图为现行系统。':'本轮实际渲染并阅读归档PDF相关图页。用于核对连接与适用条件，不把标准示意参数补成用户原图参数。'}
];
const differences=d=>[
 '本稿为原图实例的矢量表达；未标注的材料厚度、计算条件及施工尺寸仍需设计确定。',
 ...(d.id.startsWith('rigid')?['二布三油、刚性层等为历史教材做法；分格缝是刚性层局部接缝，不能与结构变形缝混为一谈，不能据局部图认定整个屋面设防满足现行要求。']:[]),
 ...(d.id.startsWith('high-low')?['现行变形缝要求需独立核对填充材料的燃烧性能、附加层和变形能力；历史沥青麻丝或原图未示部位不能视为已满足这些条件。']:[]),
 ...(d.id.startsWith('vent')?['原图“一布四涂”只说明实例层次。出屋面管道的泛水、附加层及收头按具体系统核验，图中未标的≥250等现行要求未冒充原图标注。']:[])
];
const graph=JSON.parse(await readFile('src/data/curriculumLearning.json','utf8'));
const records=[];
for(const d of roofBatchThree){
 const bytes=await readFile('public/images/roof/'+d.file),info=await sharp(bytes).metadata(),data=d.build();
 await writeFile(root+'/source/'+d.file,bytes);
 const modelPath='public/models/'+d.model,mb=await readFile(modelPath);
 if(mb.readUInt32LE(0)!==0x46546c67)throw Error('Not GLB '+modelPath);
 const json=JSON.parse(mb.subarray(20,20+mb.readUInt32LE(12)).toString('utf8').trim());
 const meshes=(json.nodes??[]).filter(n=>n.mesh!==undefined).map(n=>({name:n.name??'',mesh:n.mesh,primitives:json.meshes[n.mesh].primitives.map(p=>({positionCount:json.accessors[p.attributes.POSITION].count,indexCount:p.indices===undefined?null:json.accessors[p.indices].count}))}));
 if(!meshes.length)throw Error('Empty model '+d.id);
 const primary=graph.nodes[d.id]?.primary;if(!primary)throw Error('Missing curriculum relation '+d.id);
 const record={id:d.id,title:d.title,order:d.order,revision:d.revision,source:{path:'source/'+d.file,sha256:sha(bytes),width:info.width,height:info.height,figure:d.figure??null},model:{path:modelPath,sha256:sha(mb),meshNodes:meshes,scope:'实际GLB节点/网格库存；不据名称推定未显示的尺寸或内部配筋'},knowledgeContext:{lesson:primary.lessonPath,unitId:primary.knowledgeId},parameters:d.parameters,sourceFeatures:d.sourceFeatures,geometryDigests:Object.fromEntries(data.parts.map(p=>[p.id,sha(p.body)])),interfaces:data.interfaces,dimensions:data.dimensions,teaching:d.teaching,unresolved:d.uncertainties,sourceVsCurrentRequirements:differences(d),references:refs(d),publication:{status:'draft',formalReplacement:false},technicalReview:{status:'source-review-draft',scope:'按原图可辨关系重绘；未完成工程设计审定。模糊项保留在逐图记录中。'},assets:{textbook:'textbook/'+d.id+'.svg',node:'node/'+d.id+'.svg'},rendered:{}};
 for(const mode of ['textbook','node']){const out=renderRoofBatchThree(d,data,record,mode);await writeFile(root+'/'+record.assets[mode],out.svg);await sharp(Buffer.from(out.svg)).png().toFile(root+'/previews/'+mode+'-'+d.id+'.png');record.rendered[mode]={sha256:sha(out.svg),width:out.width,height:out.height,graphicBox:out.graphicBox};}
 records.push(record);
}
await writeFile(root+'/evidence.json',JSON.stringify(records,null,2));
const css=`*{box-sizing:border-box}body{margin:0;background:#f7f8fa;color:#202d46;font:16px/1.75 system-ui}header,main{max-width:1540px;margin:auto;padding:26px}h1{font-size:32px}h2{font-size:22px}h3{font-size:18px}a{color:#455b94;text-decoration:none}nav{display:flex;gap:20px;flex-wrap:wrap}img{display:block;width:100%;height:auto}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.panel,.tile{background:white;border:1px solid #d9dfeb;padding:20px}.tile img{height:290px;object-fit:contain}.num{font-size:28px;color:#455b94}.compare{display:grid;grid-template-columns:minmax(250px,.7fr) minmax(500px,1.4fr);gap:22px;align-items:start}.reader{width:390px;max-width:100%;height:730px;overflow:auto;background:white;border:1px solid #ccd4e2}.readers{display:flex;gap:28px;flex-wrap:wrap}section{margin:26px 0}summary{color:#455b94;cursor:pointer}details{padding:14px 0;border-top:1px solid #d9dfeb}li{margin:9px 0}.sub{color:#66738a}.boundary{border-left:3px solid #e34b35;padding-left:15px}@media(max-width:1000px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.compare{grid-template-columns:1fr}}@media(max-width:650px){header,main{padding:16px}.grid{grid-template-columns:1fr}h1{font-size:26px}}`;
const head=t=>`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t)}</title><style>${css}</style>`;
for(const r of records){await writeFile(root+'/view/'+r.id+'.html',head(r.title+' · 原图对照')+`<header><nav><a href="../index.html#${r.id}">← 第三组</a><a href="../${r.assets.textbook}">教材SVG</a><a href="../${r.assets.node}">节点SVG</a></nav><h1>${r.order} · ${esc(r.title)}</h1><p class="sub">原图重绘稿 · 教材版与节点版共用构造几何</p></header><main><div class="compare"><section class="panel"><h2>用户原图</h2><img src="../${r.source.path}" alt="原图"></section><section class="panel"><h2>教材版</h2><img src="../${r.assets.textbook}?v=${r.rendered.textbook.sha256.slice(0,12)}" alt="教材版重绘"></section></div><section class="panel"><h2>知识联系</h2><p>${esc(r.teaching)}</p><nav><a href="/#/lesson/${r.knowledgeContext.lesson}?unit=${r.knowledgeContext.unitId}">对应教材 ↗</a><a href="/#/node/${r.id}">交互模型 ↗</a></nav><details open><summary>原图参数与仍未确定的信息</summary><ul>${r.parameters.map(p=>`<li>${esc(p.name)}：${esc(p.value)}。${esc(p.conditions)}</li>`).join('')}${r.unresolved.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></details><details><summary>适用边界与规范依据</summary>${r.sourceVsCurrentRequirements.map(s=>`<p class="boundary">${esc(s)}</p>`).join('')}<ul>${r.references.map(s=>`<li><a href="${s.officialSource}">${esc(s.standard)}</a> · ${esc(s.clause)} · ${esc(s.page??'原图')}<p>${esc(s.verification)}</p></li>`).join('')}</ul></details><details><summary>模型构件对应</summary><p>核对实际GLB网格名称；模型未单独提供的配筋、座浆等不由名称补造。</p><ul>${r.model.meshNodes.map(m=>`<li>${esc(m.name)}</li>`).join('')}</ul></details></section><section><h2>节点版 · 390px图纸栏</h2><div class="reader"><img src="../${r.assets.node}?v=${r.rendered.node.sha256.slice(0,12)}" alt="节点版"></div></section></main></html>`);}
await writeFile(root+'/index.html',head('屋顶原图重绘 · 第三组')+`<header><nav><a href="../roof-source-redraw-batch-02-2026-11-01/index.html">← 第二组</a><a href="reading-check.html">窄栏阅读</a><a href="evidence.json">逐图依据</a></nav><h1>屋顶原图重绘 · 第三组</h1><p>19～26 · 铸铁水落口、透气管、四种分格缝、两种高低屋面变形缝。</p><p class="sub">8张原图 · 16份可编辑SVG · 待审阅，尚未替换正式图纸。</p></header><main><div class="grid">${records.map(r=>`<article class="tile" id="${r.id}"><a href="view/${r.id}.html"><img src="previews/textbook-${r.id}.png?v=${r.rendered.textbook.sha256.slice(0,12)}" alt="${esc(r.title)}"></a><span class="num">${r.order}</span><h2>${esc(r.title)}</h2><nav><a href="view/${r.id}.html">原图对照 →</a><a href="${r.assets.textbook}">教材SVG</a><a href="${r.assets.node}">节点SVG</a></nav></article>`).join('')}</div><section class="panel"><h2>依据与检查记录</h2><nav><a href="standards/research-findings.md">标准适用与原图差异</a><a href="validation.json">验证记录</a><a href="protected-assets.json">既有资源保护</a></nav></section></main></html>`);
await writeFile(root+'/reading-check.html',head('第三组窄栏阅读')+`<header><nav><a href="index.html">← 第三组</a></nav><h1>节点图纸窄栏阅读</h1><p>318px / 390px嵌入栏宽；本页不等于手机真机测试。</p></header><main>${records.map(r=>`<section><h2>${r.order} · ${esc(r.title)}</h2><div class="readers">${[318,390].map(w=>`<div><h3>${w}px</h3><div class="reader" style="width:${w}px"><img src="${r.assets.node}" alt="${esc(r.title)}"></div></div>`).join('')}</div></section>`).join('')}</main></html>`);
await checkProtected();
await writeFile(root+'/validation.json',JSON.stringify({generatedOn:checkedOn,drawingCount:records.length,nativeSvgCount:records.length*2,protectedAssetsUnchanged:protectedAssets.length,modelMeshInventories:records.length,visualReview:'pending',structuralChecks:'pending',formalReplacement:false},null,2));
console.log(`Generated ${records.length} source redraws, ${records.length*2} SVGs; ${protectedAssets.length} protected assets unchanged.`);
