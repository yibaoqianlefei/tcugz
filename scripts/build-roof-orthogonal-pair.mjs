import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {roofBatchOne,esc} from './lib/roof-source-batch-one.mjs';
import {renderRoofDrawingFrame} from './build-roof-source-batch-one.mjs';
const root='audit-output/roof-source-redraw-batch-01-2026-10-30',out='audit-output/roof-orthogonal-redraw-2026-11-01';
const ids=['coating-parapet-flashing-01','coating-high-low-roof-flashing-01'];
const sha=s=>createHash('sha256').update(s).digest('hex');
const records=JSON.parse(await readFile(root+'/evidence.json','utf8'));
const oldRecords=JSON.parse(JSON.stringify(records));
for(const dir of ['textbook','node','previews','previous-r2'])await mkdir(out+'/'+dir,{recursive:true});
const prior=out+'/previous-r2/evidence.json';
if(!await readFile(prior).then(()=>true).catch(()=>false))await writeFile(prior,JSON.stringify(oldRecords.filter(r=>ids.includes(r.id)),null,2)+'\n');
const unchanged=[];
for(const r of records)if(!ids.includes(r.id))for(const mode of ['textbook','node'])unchanged.push({path:root+'/'+r.assets[mode],sha256:sha(await readFile(root+'/'+r.assets[mode]))});
for(const id of ids){
 const def=roofBatchOne.find(d=>d.id===id),old=records.find(r=>r.id===id),data=def.build();
 for(const mode of ['textbook','node']){
  const dest=out+'/previous-r2/'+mode+'-'+id+'.svg';
  if(!await readFile(dest).then(()=>true).catch(()=>false))await copyFile(root+'/'+old.assets[mode],dest);
 }
 const record={...old,revision:def.revision,scope:data.view,teaching:def.teaching,sourceReconstruction:def.sourceReconstruction,geometryDigests:Object.fromEntries(data.parts.map(p=>[p.id,sha(p.body)])),anchors:data.anchors,interfaces:data.interfaces,dimensions:data.dimensions,orthogonalChecks:data.orthogonalChecks,geometryChecks:def.checks,unresolved:[...new Set([...(old.unresolved??[]),...def.uncertainties])],publication:{status:'draft',formalReplacement:false},technicalReview:{status:'orthogonal-redraw-awaiting-human-review',checkedOn:'2026-11-01',scope:'恢复正交主体与清晰语义线稿；原图投影尺寸身份保留，未补造未知工程参数。'},rendered:{}};
 delete record.sourceTracing;
 for(const mode of ['textbook','node']){
  const result=renderRoofDrawingFrame(def,data,record,mode);
  await writeFile(root+'/'+record.assets[mode],result.svg);await writeFile(out+'/'+mode+'/'+id+'.svg',result.svg);
  const png=await sharp(Buffer.from(result.svg)).png().toBuffer();
  await writeFile(root+'/previews/'+mode+'-'+id+'.png',png);await writeFile(out+'/previews/'+mode+'-'+id+'.png',png);
  record.rendered[mode]={sha256:sha(result.svg),width:result.w,height:result.h,geometryPlacement:result.geometryPlacement,graphicBox:result.graphicBox};
 }
 records[records.findIndex(r=>r.id===id)]=record;
}
await writeFile(root+'/evidence.json',JSON.stringify(records,null,2)+'\n');
const current=records.filter(r=>ids.includes(r.id));
await writeFile(out+'/evidence.json',JSON.stringify(current,null,2)+'\n');
// Refresh only the two corrected draft URLs; the seven other sheets stay byte-identical.
for(const file of ['index.html','geometry-check.html','view/'+ids[0]+'.html','view/'+ids[1]+'.html','correction-2026-11-01/index.html','correction-2026-11-01/reading-check.html']){
 let html=await readFile(root+'/'+file,'utf8');
 for(const r of current){const old=oldRecords.find(o=>o.id===r.id);for(const mode of ['textbook','node'])html=html.replaceAll(old.rendered[mode].sha256.slice(0,12),r.rendered[mode].sha256.slice(0,12));}
 html=html.replace(/<div id="high-low-deep-audit-notice">[\s\S]*?<\/div>/g,'').replace(/<p id="high-low-deep-audit-inline"[^>]*>[\s\S]*?<\/p>/g,'').replace(/<p id="high-low-deep-audit-view"[^>]*>[\s\S]*?<\/p>/g,'');
 html=html.replace(/<p id="high-low-deep-audit-link">[\s\S]*?<\/p>/g,'').replace(/<p id="orthogonal-pair-link"[^>]*>[\s\S]*?<\/p>/g,'');
 const link=file.startsWith('correction-')||file.startsWith('view/')?'../../roof-orthogonal-redraw-2026-11-01/index.html':'../roof-orthogonal-redraw-2026-11-01/index.html';
 html=html.replace('<main>',`<main><p id="orthogonal-pair-link" style="padding:16px;border-left:4px solid #465b96;background:white"><strong>04、05已更新为r3正交清晰线稿。</strong> 墙体采用竖直线，旧描摹稿与深审记录保留。<a href="${link}">查看两图新版与依据 →</a></p>`);
 if(file==='correction-2026-11-01/index.html'){
  html=html.replace('ROOF · 04–08 / REVISION 2','ROOF · 04/05 R3 · 06–08 R2');
  for(const id of ids){const re=new RegExp('(<section id="'+id+'">[\\s\\S]*?)(?=<section id=|<section id="reading")');html=html.replace(re,m=>m.replace('关键局部 · 左为原图、右为矢量轮廓','上一版r2局部记录 · 历史对照').replace('本轮教材版','r3 · 正交清晰线稿'));}
 }
 await writeFile(root+'/'+file,html);
}
const style=`*{box-sizing:border-box}body{margin:0;background:#f7f8fa;color:#202d46;font:16px/1.8 system-ui}header,main{max-width:1500px;margin:auto;padding:26px}h1{font-size:32px;margin:10px 0}h2{font-size:25px}h3{font-size:18px}a{color:#465b96}nav{display:flex;gap:20px;flex-wrap:wrap}.panel{padding:20px;background:white;border:1px solid #d8dfeb;margin:22px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:start}img{display:block;width:100%;height:auto}.reader{width:390px;height:790px;overflow-y:auto;border:1px solid #ccd5e6;background:white}.reader img{width:100%;height:auto}.narrow{display:flex;gap:25px;flex-wrap:wrap}small,p{color:#5f6d86}details{border-top:1px solid #d8dfeb;padding:15px 0}summary{color:#465b96;cursor:pointer}li{margin-bottom:7px}@media(max-width:780px){header,main{padding:18px}.pair{display:block}.reader{max-width:100%}h1{font-size:26px}}`;
await writeFile(out+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>女儿墙与高低屋面泛水 · 正交清晰线稿</title><style>${style}</style><header><nav><a href="../roof-source-redraw-batch-01-2026-10-30/correction-2026-11-01/index.html">← 五图审阅页</a><a href="#narrow">390px图纸栏</a><a href="../roof-high-low-deep-audit-2026-11-01/index.html">r2深审记录</a></nav><h1>女儿墙泛水与高低屋面泛水 · 清晰线稿</h1><p>r3 · 墙边竖直、结构板面水平。按构造对象重建原生SVG，材料图例、连接件、薄层和引线分别绘制。</p><p>本轮只更新04、05核对稿，未替换正式教材与节点。已批准的01、02、03、09保持原版本。</p></header><main>${current.map(r=>`<section id="${r.id}"><h2>${r.order} · ${esc(r.title)}</h2><nav><a href="textbook/${r.id}.svg?v=${r.rendered.textbook.sha256.slice(0,12)}">教材版SVG ↗</a><a href="node/${r.id}.svg?v=${r.rendered.node.sha256.slice(0,12)}">节点版SVG ↗</a><a href="${r.source.path}">原图 ↗</a><a href="previous-r2/textbook-${r.id}.svg">旧r2描摹稿</a></nav><div class="panel"><img src="textbook/${r.id}.svg?v=${r.rendered.textbook.sha256.slice(0,12)}" alt="${esc(r.title)}r3清晰线稿"></div><details><summary>保留的构造关系与核对范围</summary><ul>${r.geometryChecks.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><p>${esc(r.teaching)}</p></details><details><summary>原图尺寸、适用依据与未核定项</summary><ul>${r.unresolved.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><ul>${r.references.map(ref=>`<li><a href="${ref.officialSource}">${esc(ref.standard)}</a> · ${esc(ref.clause)} · ${esc(ref.page)}</li>`).join('')}</ul></details></section>`).join('')}<section id="narrow"><h2>节点版 · 390px图纸栏</h2><div class="narrow">${current.map(r=>`<div><h3>${r.order} · ${esc(r.title.split(' · ').at(-1))}</h3><div class="reader"><img src="node/${r.id}.svg?v=${r.rendered.node.sha256.slice(0,12)}" alt="${r.order}节点版"></div></div>`).join('')}</div></section><p><a href="evidence.json">逐图重建依据与几何记录</a> · <a href="independent-review.md">独立构造审查</a> · <a href="validation.json">验证记录</a></p></main></html>`);
await writeFile(out+'/geometry-check.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>两张泛水 · 四份SVG检查</title><a href="index.html">返回新版</a>${current.map(r=>['textbook','node'].map(mode=>`<iframe title="${mode}-${r.id}" src="${mode}/${r.id}.svg?v=${r.rendered[mode].sha256.slice(0,12)}" width="${r.rendered[mode].width}" height="${r.rendered[mode].height}"></iframe>`).join('')).join('')}</html>`);
for(const asset of unchanged)if(sha(await readFile(asset.path))!==asset.sha256)throw new Error('Unselected drawing changed: '+asset.path);
await writeFile(out+'/unchanged-assets.json',JSON.stringify(unchanged,null,2)+'\n');
console.log('Built 04/05 native orthogonal SVGs; 14 unselected SVG files unchanged.');
