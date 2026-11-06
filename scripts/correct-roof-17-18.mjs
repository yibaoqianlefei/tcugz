import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {roofBatchTwo,renderRoofBatchTwo,roofBatchTwoDefs,roofBatchTwoStyle,escapeXml as esc} from './lib/roof-source-batch-two.mjs';
const root='audit-output/roof-source-redraw-batch-02-2026-11-01',out='audit-output/roof-17-18-correction-2026-11-02';
const ids=['eaves-gutter-01','roof-access-hatch-01'];
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const save=async(p,o)=>writeFile(p,JSON.stringify(o,null,2)+'\n');
for(const d of ['before','before/textbook','before/node','textbook','node','previews','checks'])await mkdir(out+'/'+d,{recursive:true});
async function backup(p,dest){try{await readFile(dest);}catch(e){if(e.code!=='ENOENT')throw e;await copyFile(p,dest);}}
const records=await json(root+'/evidence.json'),formal=await json('src/data/sourceDrawingEvidence.json');
let protectedFiles;
try{protectedFiles=await json(out+'/protected-assets.json');}catch(e){if(e.code!=='ENOENT')throw e;protectedFiles={};for(const r of Object.values(formal))for(const p of [r.path,r.panel.path])protectedFiles['public'+p]=sha(await readFile('public'+p));for(const d of records){protectedFiles['public'+d.source.projectSource]=sha(await readFile('public'+d.source.projectSource));const stem=d.id.replace(/-01$/,'');const p=`public/models/roof/${stem}/${stem}.glb`;protectedFiles[p]=sha(await readFile(p));if(!ids.includes(d.id))for(const mode of ['textbook','node'])protectedFiles[root+'/'+d.assets[mode]]=sha(await readFile(root+'/'+d.assets[mode]));}await save(out+'/protected-assets.json',protectedFiles);}
async function protect(){for(const[p,h]of Object.entries(protectedFiles))assert.equal(sha(await readFile(p)),h,'Protected file changed: '+p);}
await protect();
await backup(root+'/evidence.json',out+'/before/evidence.json');
await backup(root+'/index.html',out+'/before/index.html');
const old=await json(out+'/before/evidence.json');
const changes={
 'eaves-gutter-01':['恢复屋面细点带，保留材料未定。','沟底细轮廓接至管口内缘，消除与管壁封口线的交叉；双侧管壁保持厚度。','原图截断孔腔、分水线与≥200／≥120尺寸投影保持原意。'],
 'roof-access-hatch-01':['恢复附加卷材在图幅内的可见端头，主防水继续延至原图截断边。','井壁顶恢复平直承托，压顶下不再出现大弧形空隙；内侧轮廓连续接至板底，取消悬空短线。','保留盖板、双侧压顶圈、贯通洞口与250投影；标注不加入模型扩展的SBS道数。']
};
const outputs=[];
for(const id of ids){
 const prior=old.find(r=>r.id===id),def=roofBatchTwo.find(d=>d.id===id),data=def.build();
 assert(!formal[id]);assert(def.revision.includes('-r3-'));
 assert.equal(sha(await readFile('public'+prior.source.projectSource)),prior.source.sha256);
 for(const mode of ['textbook','node'])await backup(root+'/'+prior.assets[mode],out+'/before/'+prior.assets[mode]);
 await backup(root+'/view/'+id+'.html',out+'/before/'+id+'-view.html');
 const module='scripts/lib/roof-source-batch-two-'+(id==='eaves-gutter-01'?'drainage':'storage')+'.mjs';
 const record={...prior,revision:def.revision,scope:data.view,anchors:data.anchors,interfaces:data.interfaces,dimensions:data.dimensions,orthogonalChecks:data.orthogonalChecks,geometryDigests:Object.fromEntries(data.parts.map(p=>[p.id,sha(p.body)])),geometryChecks:def.checks,unresolved:[...def.uncertainties,...(id==='roof-access-hatch-01'?['内侧连续轮廓的材料未核定；保留原图面层边界，不将其解释成卷材全高包覆。','局部卷材端头按原图可见范围清绘，绘图坐标不能推算搭接或附加宽度。']:[])],teaching:def.teaching,
  sourceReconstruction:{method:'native-source-contours-local-extents',module,sha256:sha(await readFile(module)),graphicCoordinatesAreEngineeringDimensions:false},correction:{date:'2026-11-02',changes:changes[id],previousRevision:prior.revision,archive:out+'/before',supersededR2:out+'/r2-archive',sourceReview:'checks/source-review.json'},publication:{status:'revised-draft-awaiting-review',formalReplacement:false,humanApprovalRecorded:false},rendered:{}};
 // Render both layouts from the same geometry. The rendered-file hash is kept
 // externally to avoid trying to place a file's own final hash in its metadata.
 for(const mode of ['textbook','node']){const r=renderRoofBatchTwo(def,data,record,mode);await writeFile(out+'/'+mode+'/'+id+'.svg',r.svg);await writeFile(root+'/'+prior.assets[mode],r.svg);await sharp(Buffer.from(r.svg)).png().toFile(out+'/previews/'+mode+'-'+id+'.png');await copyFile(out+'/previews/'+mode+'-'+id+'.png',root+'/previews/'+mode+'-'+id+'.png');record.rendered[mode]={sha256:sha(r.svg),width:r.width,height:r.height};}
 const[x,y,w,h]=data.parts[0].box;const geometry=`<svg xmlns="http://www.w3.org/2000/svg" width="${w*2}" height="${h*2}" viewBox="${x} ${y} ${w} ${h}">${roofBatchTwoDefs}${roofBatchTwoStyle}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="white"/>${data.parts[0].body}</svg>`;
 await writeFile(out+'/checks/'+id+'-geometry.svg',geometry);await sharp(Buffer.from(geometry)).png().toFile(out+'/previews/geometry-'+id+'.png');
 records[records.findIndex(r=>r.id===id)]=record;outputs.push(record);
}
await save(root+'/evidence.json',records);await save(out+'/evidence.json',outputs);
const sourceReview={date:'2026-11-02',method:'Primary agent re-read original and nearest-neighbour enlargement, path boundaries and labels; no independent-agent review claimed.',sourceHatchOriginalMatchesUserPath:'D:/剖面图/屋面检修口.png',standards:{review:'../roof-17-18-focused-review-2026-11-02/audit.json',scope:'沿用已实看GB50345第4.11.21及图、GB55030第4.4.3/4.4.4；本次恢复源轮廓，不以标准图替换原图。',announcement:'https://www.gsjn.gov.cn/zfxxgk/zfbmxxgk/zjj/fdzdgknr/lzyj/art/2022/art_0f0b3ad7fa304c0b961a009b0d8319ca.html'},decisions:[{id:'17-01',result:'已恢复中性点状图例，未指定材料'},{id:'17-02',result:'短折线接管口内缘(265,278)/(318,278)，与管壁上端封口边仅共享端点；r2外缘误接已撤回'},{id:'18-02',result:'恢复平直井壁顶与压顶下薄层承托；原图内侧至板底轮廓连续保留，撤去r2无依据的y158悬空端头'},{id:'18-03',result:'放大原图可见左右局部端头，撤销此前“无法确定是否局部”的泛化判断；实际附加长度仍未知'}],drawings:outputs.map(r=>({id:r.id,revision:r.revision,source:r.source,rendered:r.rendered,unresolved:r.unresolved})),protectedCount:Object.keys(protectedFiles).length};
await save(out+'/checks/source-review.json',sourceReview);
const css=`*{box-sizing:border-box}body{margin:0;background:#f7f8fa;color:#24314b;font:16px/1.8 system-ui}header,main{max-width:1500px;margin:auto;padding:24px}a{color:#465b96}nav{display:flex;gap:18px;flex-wrap:wrap}.notice{border-left:3px solid #e94b35;background:#eef1f7;padding:16px}.compare{display:grid;grid-template-columns:1fr 1.4fr;gap:20px;align-items:start}.panel{background:white;border:1px solid #d8dfeb;padding:20px;min-width:0}.panel img{display:block;width:100%;height:auto}section{margin-bottom:60px}details{margin:20px 0}summary{cursor:pointer;color:#465b96}.readers{display:flex;gap:20px;overflow:auto}.reader{flex:0 0 auto;height:650px;overflow:auto;border:1px solid #ccd4e2}.reader img{width:100%}pre{white-space:pre-wrap;overflow-wrap:anywhere}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccd4e2;padding:12px;text-align:left}@media(max-width:850px){.compare{grid-template-columns:1fr}main,header{padding:16px}}`;
const sections=outputs.map(r=>`<section id="drawing-${r.order}"><h2>${r.order} · ${esc(r.title)}</h2><ul>${changes[r.id].map(x=>'<li>'+esc(x)+'</li>').join('')}</ul><div class="compare"><div class="panel"><h3>用户原图</h3><img src="${r.source.projectSource}" alt="${esc(r.title)}原图"></div><div class="panel"><h3>修订稿 · 构造局部</h3><img src="previews/geometry-${r.id}.png?v=${r.rendered.textbook.sha256.slice(0,12)}" alt="${esc(r.title)}修订轮廓"><nav>${['textbook','node'].map(m=>`<a href="${m}/${r.id}.svg?v=${r.rendered[m].sha256.slice(0,12)}">${m==='node'?'节点版':'教材版'}SVG</a>`).join('')}</nav></div></div><details class="panel"><summary>完整教材图</summary><img src="textbook/${r.id}.svg?v=${r.rendered.textbook.sha256.slice(0,12)}" alt="完整教材图"></details><details class="panel"><summary>318／390像素图纸栏</summary><div class="readers">${[318,390].map(w=>`<div class="reader" style="width:${w}px"><img src="node/${r.id}.svg?v=${r.rendered.node.sha256.slice(0,12)}" alt="${w}像素节点图"></div>`).join('')}</div><p>嵌入窄栏检查，非手机真机测试。</p></details><details class="panel"><summary>旧稿与仍需保留的边界</summary><img src="before/textbook/${r.id}.svg" alt="旧稿"><ul>${r.unresolved.map(x=>'<li>'+esc(x)+'</li>').join('')}</ul></details></section>`).join('');
await writeFile(out+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>屋顶17、18 · 修订对照</title><style>${css}</style><header><nav><a href="../roof-source-redraw-batch-02-2026-11-01/index.html">第二组总览</a><a href="#drawing-17">17 檐沟外排水</a><a href="#drawing-18">18 屋面检修口</a><a href="checks/source-review.json">复核记录</a></nav><h1>17、18 · 原图修订对照</h1><p class="notice">2026-11-02 · 修订教材版与节点版。两张仍为审阅稿，已批准的10～16及模型文件保持不变。节点知识卡同步澄清实际网格身份、局部层序和原图／模型扩展范围。</p></header><main>${sections}<h2>配套文字修正</h2><p>17：保留源对象名“圈梁”，显示名说明其实际为含孔板状构件；撤去“分水构件与檐沟必定同材”的断言。18：按已核样点整理附加片、第一主片、第二主片的列表顺序；明确模型扩展层次不等于原图，并区分原图250与工程量取要求。</p><p>绘图及材料未定项保留在证据记录中，不将细线强行转为新增材料，也不从像素推算施工尺寸。</p></main></html>`);
function versions(html){for(const r of outputs)for(const m of ['textbook','node'])for(const file of [m+'/'+r.id+'.svg','previews/'+m+'-'+r.id+'.png']){const rx=new RegExp('('+file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')(?:\\?v=[a-f0-9]+)?','g');html=html.replace(rx,'$1?v='+r.rendered[m].sha256.slice(0,12));}return html;}
for(const r of outputs){
 const view=root+'/view/'+r.id+'.html';let html=versions(await readFile(out+'/before/'+r.id+'-view.html','utf8'));html=html.replace('</h1>',`</h1><p class="warning">2026-11-02修订稿，待审阅。<a href="../../roof-17-18-correction-2026-11-02/index.html#drawing-${r.order}">当前原图对照与修订记录 →</a></p>`);
 html=html.replace(/<details><summary>本稿构造核对记录<\/summary>[\s\S]*?<\/details>/,'<details><summary>本稿构造核对记录</summary><ul>'+r.geometryChecks.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></details>');
 const prior=old.find(x=>x.id===r.id);html=html.replace('<ul>'+prior.unresolved.map(x=>'<li>'+x+'</li>').join('')+'</ul>','<ul>'+r.unresolved.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>');await writeFile(view,html);
}
let gallery=versions(await readFile(root+'/index.html','utf8'));
for(const r of outputs)gallery=gallery.replace(`../roof-17-18-focused-review-2026-11-02/index.html#${r.id}">重点审核 · 待修正 →`,`../roof-17-18-correction-2026-11-02/index.html#drawing-${r.order}">已修订 · 待审阅 →`);
await writeFile(root+'/index.html',gallery);await writeFile(root+'/reading-check.html',versions(await readFile(root+'/reading-check.html','utf8')));
const auditPage='audit-output/roof-17-18-focused-review-2026-11-02/index.html';await backup(auditPage,out+'/before/focused-review-index.html');let audit=await readFile(out+'/before/focused-review-index.html','utf8');
for(const r of outputs)audit=audit.replace('../roof-source-redraw-batch-02-2026-11-01/'+r.assets.textbook,'../roof-17-18-correction-2026-11-02/before/'+r.assets.textbook);
audit=audit.replace('</h1>','</h1><p class="notice">本页为修订前问题记录，图稿已固定为旧版。<a href="../roof-17-18-correction-2026-11-02/index.html">查看17、18当前修订稿 →</a></p>');await writeFile(auditPage,audit);
const validation=await json(root+'/validation.json');validation.correction17and18={date:'2026-11-02',status:'revised-draft-awaiting-review',report:'../roof-17-18-correction-2026-11-02/index.html',revisions:outputs.map(r=>({id:r.id,revision:r.revision}))};await save(root+'/validation.json',validation);
await protect();console.log(JSON.stringify({drawings:outputs.map(r=>({id:r.id,revision:r.revision})),protected:Object.keys(protectedFiles).length,report:out+'/index.html'}));
