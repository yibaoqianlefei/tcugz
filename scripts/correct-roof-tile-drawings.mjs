import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {roofBatchTwo, renderRoofBatchTwo, roofBatchTwoDefs, roofBatchTwoStyle, escapeXml as esc} from './lib/roof-source-batch-two.mjs';

const root='audit-output/roof-source-redraw-batch-02-2026-11-01';
const out='audit-output/roof-tiles-correction-2026-11-02';
const ids=['steel-batten-tile-roof-01','mortar-bed-tile-roof-01','wood-batten-tile-roof-01'];
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const save=async (p,o)=>writeFile(p,JSON.stringify(o,null,2)+'\n');
const sha=b=>createHash('sha256').update(b).digest('hex');
const baseline=await json(out+'/protected-assets.json');
async function protect(){
 for(const f of baseline)if(sha(await readFile(f.path))!==f.sha256)throw Error('Non-target resource changed: '+f.path);
}
await protect();
const old=await json(out+'/before/evidence.json');
const records=await json(root+'/evidence.json');
for(const dir of ['textbook','node','previews','checks'])await mkdir(out+'/'+dir,{recursive:true});
const changes={
 'steel-batten-tile-roof-01':[
  '恢复原图四组局部可见瓦面与四处L形支承，包含端部截取。',
  '纠正L形短底肢朝向：向下坡伸出，底面落在顺水条顶。',
  '保留瓦端落差、细延伸和小返回；连墨处只重建可见线，不补隐藏挂钩。',
 ],
 'mortar-bed-tile-roof-01':[
  '撤去沿每片瓦底生成的满填锯齿砂浆体，连续砂浆窄带独立表达。',
  '恢复瓦下无纹理带与局部短轮廓；既不把留白定性为空气，也不擅自指定材料。',
  '保留左端截取范围和完整图补核的最薄处20，不添加钢木条或固定件。',
 ],
 'wood-batten-tile-roof-01':[
  '恢复原图四处局部可见瓦身及木条剖切，包含上坡端局部位置。',
  '横向木条改回矩形剖切，取消为贴合斜瓦而人为削斜的顶面。',
  '保持瓦身等厚及上坡瓦叠盖下坡瓦的次序，保留末端可见短线。',
 ],
};
const outputs=[];
for(const id of ids){
 const prior=old.find(r=>r.id===id), def=roofBatchTwo.find(d=>d.id===id), data=def.build();
 if(!def.revision.includes('-r2-source-'))throw Error('Missing selected source correction: '+id);
 if(sha(await readFile(root+'/'+prior.source.path))!==prior.source.sha256)throw Error('Source changed '+id);
 const module='scripts/lib/roof-tile-'+(id.startsWith('steel')?'steel':id.startsWith('mortar')?'mortar':'wood')+'-source-correction.mjs';
 const sourceReviewFile='checks/'+prior.order+'-independent-source-review.json';
 const review=await json(out+'/'+sourceReviewFile);
 if(!review.status.startsWith('passed')||(review.openRedrawIssues??[]).length)throw Error('Independent source issue remains: '+id);
 const inputs=Array.isArray(review.inputs)?review.inputs:Object.entries(review.inputs??{}).map(([path,value])=>({path,...value}));
 if(!inputs.some(f=>f.path.replaceAll('\\','/').endsWith(module)))throw Error('Source review lacks current module binding: '+id);
 for(const f of inputs)if(sha(await readFile(f.path))!==f.sha256)throw Error('Stale independent source review: '+f.path);
 const record={...prior,revision:def.revision,scope:data.view,
  sourceFeatures:def.sourceFeatures,geometryDigests:Object.fromEntries(data.parts.map(p=>[p.id,sha(p.body)])),
  sourceReconstruction:{method:'source-visible-native-contours-and-shared-layer-interfaces',tracedScanContours:false,module,sha256:sha(await readFile(module)),graphicCoordinatesAreEngineeringDimensions:false},
  anchors:data.anchors,interfaces:data.interfaces,dimensions:data.dimensions,orthogonalChecks:data.orthogonalChecks,
  geometryChecks:def.checks,unresolved:def.uncertainties,teaching:def.teaching,
  correction:{checkedOn:'2026-11-02',changes:changes[id],previousRevision:prior.revision,previousSvgHashes:prior.rendered,archive:out+'/before',audit:'audit-output/roof-tiles-focused-review-2026-11-02/index.html#review-'+prior.order,invalidatedAssertions:'旧稿三组范围、砂浆满填、削斜木顶及新增三个配网剖点不再作为原图匹配依据。'},
  technicalReview:{status:'independently-reviewed-source-visible-scope',sourceReview:out+'/'+sourceReviewFile,standards:'audit-output/roof-tiles-focused-review-2026-11-02/standards-review.json',scope:'沿用2026-11-02已查原文与图页的适用范围；本次纠正来源轮廓和材料边界，不新增工程参数、产品固定方式或合规断言。'},
  publication:{status:'draft-local-review-only',formalResourcesChanged:false,humanApprovalRecorded:false},rendered:{},
 };
 for(const mode of ['textbook','node']){
  const rendered=renderRoofBatchTwo(def,data,record,mode);
  await writeFile(out+'/'+mode+'/'+id+'.svg',rendered.svg);
  await writeFile(root+'/'+record.assets[mode],rendered.svg);
  await sharp(Buffer.from(rendered.svg)).png().toFile(out+'/previews/'+mode+'-'+id+'.png');
  await sharp(Buffer.from(rendered.svg)).png().toFile(root+'/previews/'+mode+'-'+id+'.png');
  record.rendered[mode]={sha256:sha(rendered.svg),width:rendered.width,height:rendered.height,geometryPlacement:rendered.geometryPlacement,graphicBox:rendered.graphicBox};
 }
 const [x,y,w,h]=data.parts[0].box;
 const frame=`<svg xmlns="http://www.w3.org/2000/svg" width="${w*2}" height="${h*2}" viewBox="${x} ${y} ${w} ${h}"><title>${esc(def.title)} · 可见构造轮廓</title>${roofBatchTwoDefs}${roofBatchTwoStyle}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="white"/>${data.parts[0].body}</svg>`;
 await writeFile(out+'/checks/'+id+'-geometry.svg',frame);
 await sharp(Buffer.from(frame)).png().toFile(out+'/previews/geometry-'+id+'.png');
 records[records.findIndex(r=>r.id===id)]=record;
 outputs.push(record);
}
await save(root+'/evidence.json',records);await save(out+'/evidence.json',outputs);

function versions(html){
 for(const r of outputs)for(const mode of ['textbook','node']){
  const file=mode+'/'+r.id+'.svg', png='previews/'+mode+'-'+r.id+'.png';
  for(const path of [file,png]){
   const rx=new RegExp('('+path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\?v=)[a-f0-9]+','g');
   html=html.replace(rx,'$1'+r.rendered[mode].sha256.slice(0,12));
  }
 }
 return html;
}
for(const record of outputs){
 const def=roofBatchTwo.find(d=>d.id===record.id);
 let html=versions(await readFile(out+'/before/view/'+record.id+'.html','utf8'));
 html=html.replace(/<p class="warning" data-tiles-focused-review>[\s\S]*?<\/p>/,
  `<p class="warning" data-tiles-focused-review>2026-11-02已按重点审核修订。<a href="../../roof-tiles-correction-2026-11-02/index.html#drawing-${record.order}">原图与新版局部对照 →</a> · 当前为本地审阅稿。</p>`);
 html=html.replace(/<details><summary>本稿构造核对记录<\/summary>[\s\S]*?<\/details>/,
  '<details><summary>本稿构造核对记录</summary><ul>'+def.checks.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></details>');
 // Replace the obsolete uncertainty list as a whole; no r1 assertions remain.
 const first=old.find(r=>r.id===record.id).unresolved;
 const legacy='<ul>'+first.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
 html=html.replace(legacy,'<ul>'+def.uncertainties.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>');
 html=html.replace(/<h2>教材讲解<\/h2><p>[\s\S]*?<\/p>/,'<h2>教材讲解</h2><p>'+esc(def.teaching)+'</p>');
 await writeFile(root+'/view/'+record.id+'.html',html);
}
for(const page of ['index.html','reading-check.html']){
 let html=versions(await readFile(root+'/'+page,'utf8'));
 if(page==='index.html')for(const r of outputs){
  const start=html.indexOf('<article class="tile" id="'+r.id+'">'),end=html.indexOf('</article>',start)+10;
  if(start<0||end<10)throw Error('Missing current gallery tile '+r.id);
  const tile=html.slice(start,end).replace('重点审核 · 需修正','原图修订稿 · 待人工确认')
   .replace('href="../roof-tiles-focused-review-2026-11-02/index.html#review-'+r.order+'">本轮审核 →',
    'href="../roof-tiles-correction-2026-11-02/index.html#drawing-'+r.order+'">本轮修订 →');
  html=html.slice(0,start)+tile+html.slice(end);
 }
 await writeFile(root+'/'+page,html);
}
const rootValidation=await json(root+'/validation.json');
rootValidation.selectedTileCorrection={date:'2026-11-02',ids,report:'../roof-tiles-correction-2026-11-02/index.html',validation:'../roof-tiles-correction-2026-11-02/validation.json',status:'source-revised-current-validation-in-separate-record',oldChecksSupersededFor:ids};
rootValidation.note='第10/11张按既有批准记录已接入；第12～14张另见本轮修订验证，其旧r1检查不能证明当前版本；第15～18张未纳入本次修改。历史记录保留。';
await save(root+'/validation.json',rootValidation);

const css=`*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f7f8fa;color:#24314b;font:16px/1.8 system-ui}header,main{max-width:1500px;margin:auto;padding:24px}h1{font-size:32px;margin:12px 0}h2{font-size:25px}h3{font-size:18px}a{color:#465b96}nav{display:flex;gap:20px;flex-wrap:wrap}.notice{border-left:3px solid #e94b35;background:#eef1f7;padding:16px}.compare{display:grid;grid-template-columns:1fr 1.45fr;gap:20px;align-items:start}.panel{background:white;border:1px solid #d8dfeb;padding:20px;min-width:0}.panel img{display:block;width:100%;height:auto}.section{margin:35px 0 65px;scroll-margin-top:20px}.changes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:20px 0}.changes div{padding:18px;background:#eef1f7;border-top:2px solid #465b96}.muted{color:#67758e;font-size:14px}.readers{display:flex;gap:20px;max-width:100%;overflow:auto;padding:4px}.reader{flex:0 0 auto;height:700px;overflow:auto;background:white;border:1px solid #d8dfeb}.reader img{display:block;width:100%;height:auto}details{margin:18px 0}summary{cursor:pointer;color:#465b96}.tag{display:inline-block;color:#465b96;font-size:14px;border-bottom:2px solid #e94b35;margin-bottom:8px}.sourceImage{max-height:780px;object-fit:contain}.geometry{min-height:260px;object-fit:contain}@media(max-width:850px){.compare,.changes{grid-template-columns:1fr}header,main{padding:16px}h1{font-size:26px}}`;
const sections=outputs.map(r=>`<section class="section" id="drawing-${r.order}"><span class="tag">${r.order} · 修订稿</span><h2>${esc(r.title)}</h2><div class="changes">${changes[r.id].map(c=>'<div>'+esc(c)+'</div>').join('')}</div><div class="compare"><div class="panel"><h3>原图 · 局部剖面及原始引注</h3><img class="sourceImage" src="../roof-source-redraw-batch-02-2026-11-01/${r.source.path}" alt="${esc(r.title)}原图"></div><div class="panel"><h3>新稿 · 构造几何</h3><img class="geometry" src="previews/geometry-${r.id}.png?v=${r.rendered.textbook.sha256.slice(0,12)}" alt="${esc(r.title)}新轮廓"><p class="muted">保持原图真实坡向；绘图距离不作为工程尺寸。配网保留原文，不补未经确认的钢筋根数。</p><nav><a href="textbook/${r.id}.svg?v=${r.rendered.textbook.sha256.slice(0,12)}">教材SVG</a><a href="node/${r.id}.svg?v=${r.rendered.node.sha256.slice(0,12)}">节点SVG</a><a href="checks/${r.order}-independent-source-review.json">独立原图复核</a></nav><details><summary>完整教材版</summary><img src="previews/textbook-${r.id}.png?v=${r.rendered.textbook.sha256.slice(0,12)}" alt="${esc(r.title)}教材版"></details><details><summary>旧稿r1 · 已撤回匹配结论</summary><img src="before/previews/textbook-${r.id}.png" alt="${esc(r.title)}旧稿"></details></div></div><details class="panel"><summary>318px / 390px节点栏阅读检查</summary><div class="readers">${[318,390].map(w=>`<div class="reader" style="width:${w}px"><img src="node/${r.id}.svg?v=${r.rendered.node.sha256.slice(0,12)}" alt="${w}px ${esc(r.title)}"></div>`).join('')}</div><p class="muted">这是嵌入窄图纸栏检查，不是手机真机测试。</p></details><details class="panel"><summary>教材讲解、原图参数与证据边界</summary><p>${esc(r.teaching)}</p><ul>${r.parameters.map(p=>`<li>${esc(p.name)}：${esc(p.value)}。${esc(p.conditions)}</li>`).join('')}</ul><ul>${r.unresolved.map(u=>'<li>'+esc(u)+'</li>').join('')}</ul><p>沿用已复核标准的对象及适用条件。砂浆卧瓦按历史原图保留，不能作为当前工程的通用推荐或完整固定、防水设计。</p></details></section>`).join('');
await writeFile(out+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>屋顶12～14 · 原图修订对照</title><style>${css}</style><header><nav><a href="../roof-source-redraw-batch-02-2026-11-01/index.html">第二组总览</a>${outputs.map(r=>`<a href="#drawing-${r.order}">${r.order} ${esc(r.title.split(' · ')[1])}</a>`).join('')}<a href="validation.json">验证记录</a></nav><h1>12～14 · 按原图修订构造与线稿</h1><p class="notice">修正钢条朝向、瓦下材料边界、可见范围与木条断面；仅更新这三张本地审阅稿。10、11及正式教材、节点资源保持原样。</p><p class="muted">原图细部仍有连墨：保留可见投影，不补隐藏产品断面、固定件或工程尺寸。<a href="../roof-tiles-focused-review-2026-11-02/standards-review.json">已核规范与适用条件</a> · <a href="evidence.json">本轮逐图依据</a></p></header><main>${sections}</main></html>`);
await protect();
await save(out+'/render-manifest.json',{date:'2026-11-02',protectedAssets:baseline.length,formalPublication:false,drawings:outputs.map(r=>({id:r.id,revision:r.revision,source:r.source,sourceReconstruction:r.sourceReconstruction,rendered:r.rendered}))});
console.log(JSON.stringify({drawings:outputs.map(r=>({id:r.id,revision:r.revision,hashes:r.rendered})),protected:baseline.length,report:out+'/index.html'}));
