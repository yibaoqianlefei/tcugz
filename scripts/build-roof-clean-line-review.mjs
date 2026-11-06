import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {roofBatchOne,esc} from './lib/roof-source-batch-one.mjs';
import {renderRoofDrawingFrame} from './build-roof-source-batch-one.mjs';
import {roofReviewLimitationsById} from './lib/roof-review-references-2026-11-01.mjs';
const batch='audit-output/roof-source-redraw-batch-01-2026-10-30';
const out='audit-output/roof-clean-line-review-2026-11-01';
const ids=['coating-parapet-flashing-01','coating-high-low-roof-flashing-01','straight-rainwater-outlet-65-01','straight-rainwater-outlet-cast-iron-01','free-fall-ring-beam-eaves-01'];
const sha=b=>createHash('sha256').update(b).digest('hex');
const records=JSON.parse(await readFile(batch+'/evidence.json','utf8'));
const approvals=JSON.parse(await readFile(batch+'/approvals.json','utf8'));
const before=structuredClone(records);
for(const dir of ['textbook','node','previews','previous'])await mkdir(out+'/'+dir,{recursive:true});
const exists=p=>readFile(p).then(()=>true).catch(()=>false);
if(!await exists(out+'/previous/evidence.json'))await writeFile(out+'/previous/evidence.json',JSON.stringify(records.filter(r=>ids.includes(r.id)),null,2)+'\n');
if(!await exists(out+'/previous/validation-summary.json'))await copyFile(batch+'/validation-summary.json',out+'/previous/validation-summary.json');
const unchanged=[];
for(const r of records)if(!ids.includes(r.id))for(const mode of ['textbook','node'])unchanged.push({path:batch+'/'+r.assets[mode],sha256:sha(await readFile(batch+'/'+r.assets[mode]))});
for(const id of ids){
 const def=roofBatchOne.find(d=>d.id===id),old=records.find(r=>r.id===id);
 if(!def.sourceReconstruction||def.sourceTracing)throw new Error('Native reconstruction required: '+id);
 for(const mode of ['textbook','node'])if(!await exists(out+'/previous/'+mode+'-'+id+'.svg'))await copyFile(batch+'/'+old.assets[mode],out+'/previous/'+mode+'-'+id+'.svg');
 const data=def.build();
 const record={...old,revision:def.revision,scope:data.view,teaching:def.teaching,sourceReconstruction:def.sourceReconstruction,geometryDigests:Object.fromEntries(data.parts.map(p=>[p.id,sha(p.body)])),anchors:data.anchors,interfaces:data.interfaces,dimensions:data.dimensions,orthogonalChecks:data.orthogonalChecks??[],geometryChecks:def.checks,unresolved:[...new Set([...(roofReviewLimitationsById[id]??old.unresolved??[]),...(def.uncertainties??[])])],publication:{status:'draft',formalReplacement:false},technicalReview:{status:'native-clean-line-awaiting-human-review',checkedOn:'2026-11-01',scope:'原生矢量重建与清晰线型；原图实例、参数和已读规范适用边界分别保留。'},rendered:{}};
 delete record.sourceTracing;
 for(const mode of ['textbook','node']){
  const result=renderRoofDrawingFrame(def,data,record,mode);
  const adopted=approvals.find(a=>a.id===id);
  if(adopted)assert.equal(sha(result.svg),adopted.assets[mode].sha256,'An adopted draft cannot be silently regenerated into a new revision: '+id+' / '+mode);
  await writeFile(batch+'/'+record.assets[mode],result.svg);await writeFile(out+'/'+mode+'/'+id+'.svg',result.svg);
  const png=await sharp(Buffer.from(result.svg)).png().toBuffer();
  await writeFile(batch+'/previews/'+mode+'-'+id+'.png',png);await writeFile(out+'/previews/'+mode+'-'+id+'.png',png);
  record.rendered[mode]={sha256:sha(result.svg),width:result.w,height:result.h,geometryPlacement:result.geometryPlacement,graphicBox:result.graphicBox};
 }
 records[records.findIndex(r=>r.id===id)]=record;
}
const current=records.filter(r=>ids.includes(r.id));
await writeFile(batch+'/evidence.json',JSON.stringify(records,null,2)+'\n');await writeFile(out+'/evidence.json',JSON.stringify(current,null,2)+'\n');
for(const file of ['index.html','geometry-check.html',...ids.map(id=>'view/'+id+'.html'),'correction-2026-11-01/index.html','correction-2026-11-01/reading-check.html']){
 let html=await readFile(batch+'/'+file,'utf8');
 for(const r of current)for(const mode of ['textbook','node'])html=html.replaceAll(before.find(o=>o.id===r.id).rendered[mode].sha256.slice(0,12),r.rendered[mode].sha256.slice(0,12));
 html=html.replace(/<p id="orthogonal-pair-link"[^>]*>[\s\S]*?<\/p>/g,'').replace(/<p id="clean-line-review-link"[^>]*>[\s\S]*?<\/p>/g,'');
 const link=file.startsWith('view/')||file.startsWith('correction-')?'../../roof-clean-line-review-2026-11-01/index.html':'../roof-clean-line-review-2026-11-01/index.html';
 html=html.replace('<main>',`<main><p id="clean-line-review-link" style="padding:16px;border-left:4px solid #465b96;background:white"><strong>04～08已统一更新为r4原生清晰线稿。</strong> 清除扫描毛边、残梗与密黑纹理，重建轮廓、材料与连接件。<a href="${link}">查看五图新版及前后对照 →</a></p>`);
 if(file==='correction-2026-11-01/index.html')html=html.replace('ROOF · 04/05 R3 · 06–08 R2','ROOF · 04–08 / CLEAN LINES R4').replaceAll('r3 · 正交清晰线稿','r4 · 原生清晰线稿').replaceAll('<h3>本轮教材版</h3>','<h3>r4 · 原生清晰线稿</h3>').replaceAll('<summary>关键局部 · 左为原图、右为矢量轮廓</summary>','<summary>历史r2局部记录 · 原图与旧轮廓对照</summary>');
 await writeFile(batch+'/'+file,html);
}
const style=`*{box-sizing:border-box}body{margin:0;color:#202d46;background:#f7f8fa;font:16px/1.75 system-ui}header,main{max-width:1500px;margin:auto;padding:28px}h1{font-size:32px;margin:10px 0}h2{font-size:25px}h3{font-size:19px}p,small{color:#64718a}a{color:#465b96}nav{display:flex;gap:22px;flex-wrap:wrap}.overview{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:16px}.tile,.panel{background:white;border:1px solid #d7deea;padding:16px}.tile img{height:190px;object-fit:contain}img{width:100%;height:auto;display:block}.sheet{padding:15px;border:1px solid #d7deea;background:white;margin:20px 0}.compare{display:grid;grid-template-columns:1fr 1fr;gap:20px}.readers{display:flex;gap:22px;overflow-x:auto;padding-bottom:20px}.reader{width:390px;flex:0 0 390px}.viewport{height:790px;overflow-y:auto;background:white;border:1px solid #ccd5e6}.viewport img{width:100%}section{margin:35px 0}details{border-top:1px solid #d7deea;padding:16px 0}summary{cursor:pointer;color:#465b96}li{margin:8px 0}@media(max-width:800px){header,main{padding:18px}.overview{grid-template-columns:repeat(2,minmax(0,1fr))}.compare{grid-template-columns:1fr}.reader{width:100%;flex-basis:100%}h1{font-size:27px}}`;
await writeFile(out+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>屋顶04～08 · 统一清晰线稿</title><style>${style}</style><header><nav><a href="../roof-source-redraw-batch-01-2026-10-30/correction-2026-11-01/index.html">← 原五图审阅页</a><a href="#reading">390px阅读栏</a><a href="line-quality-checks.json">线条检查</a></nav><h1>屋顶04～08 · 统一清晰线稿</h1><p>r4 · 五张均采用原生矢量轮廓，材料图例、连接件、钢筋与引线分开表达。原图实例参数与适用依据继续保留。</p><p>核对稿 · 未更改正式图纸。01、02、03、09保持已批准版本。</p></header><main><div class="overview">${current.map(r=>`<a class="tile" href="#${r.id}"><img src="textbook/${r.id}.svg?v=${r.rendered.textbook.sha256.slice(0,12)}" alt="${r.order}新版"><strong>${r.order} · ${esc(r.title.split(' · ').at(-1))}</strong></a>`).join('')}</div>${current.map(r=>`<section id="${r.id}"><h2>${String(r.order).padStart(2,'0')} · ${esc(r.title)}</h2><nav><a href="textbook/${r.id}.svg?v=${r.rendered.textbook.sha256.slice(0,12)}">教材版SVG ↗</a><a href="node/${r.id}.svg?v=${r.rendered.node.sha256.slice(0,12)}">节点版SVG ↗</a><a href="${r.source.path}">用户原图 ↗</a></nav><div class="sheet"><img src="textbook/${r.id}.svg?v=${r.rendered.textbook.sha256.slice(0,12)}" alt="${esc(r.title)}r4清晰线稿"></div><details><summary>与上一稿对照</summary><div class="compare"><div class="panel"><h3>上一稿</h3><img loading="lazy" src="previous/textbook-${r.id}.svg" alt="上一稿"></div><div class="panel"><h3>本轮清晰线稿</h3><img loading="lazy" src="textbook/${r.id}.svg?v=${r.rendered.textbook.sha256.slice(0,12)}" alt="本轮清晰线稿"></div></div></details><details><summary>构造关系、原图参数与适用依据</summary><p>${esc(r.teaching)}</p><ul>${r.geometryChecks.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><ul>${r.unresolved.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><ul>${r.references.map(ref=>`<li><a href="${ref.officialSource}">${esc(ref.standard)}</a> · ${esc(ref.clause)} · ${esc(ref.page)}</li>`).join('')}</ul></details></section>`).join('')}<section id="reading"><h2>五张节点版 · 390px图纸栏</h2><p>可横向选择图纸，每栏独立纵向滚动。此处为嵌入栏宽检查。</p><div class="readers">${current.map(r=>`<div class="reader"><h3>${r.order} · ${esc(r.title.split(' · ').at(-1))}</h3><div class="viewport"><img src="node/${r.id}.svg?v=${r.rendered.node.sha256.slice(0,12)}" alt="${r.order}节点版"></div></div>`).join('')}</div></section><nav><a href="evidence.json">逐图依据</a><a href="independent-review.md">独立复核</a><a href="validation.json">验证记录</a></nav></main></html>`);
await writeFile(out+'/geometry-check.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>屋顶五图 · 10份SVG检查</title><a href="index.html">返回五图</a>${current.map(r=>['textbook','node'].map(mode=>`<iframe title="${mode}-${r.id}" src="${mode}/${r.id}.svg?v=${r.rendered[mode].sha256.slice(0,12)}" width="${r.rendered[mode].width}" height="${r.rendered[mode].height}"></iframe>`).join('')).join('')}</html>`);
await writeFile(out+'/line-comparison.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>五张线稿 · 清理前后对照</title><style>*{box-sizing:border-box}body{margin:0;color:#202d46;background:#f7f8fa;font:15px/1.6 system-ui}header{position:sticky;top:0;background:#f7f8fa;border-bottom:1px solid #d7deea;padding:12px 24px;z-index:1}nav{display:flex;gap:22px;flex-wrap:wrap}a{color:#465b96}main{max-width:1200px;margin:auto;padding:15px 20px}section{scroll-margin-top:85px;margin-bottom:35px}h2{font-size:21px;margin:8px 0}h3{font-size:16px;margin:0 0 8px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}.panel{background:white;border:1px solid #d7deea;padding:10px}img{width:100%;height:auto;display:block}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><header><strong>屋顶04～08 · 线条清理前后对照</strong><nav><a href="index.html">查看完整图稿与依据</a>${current.map(r=>`<a href="#${r.id}">${r.order} · ${esc(r.title.split(' · ').at(-1))}</a>`).join('')}</nav></header><main>${current.map(r=>`<section id="${r.id}"><h2>${String(r.order).padStart(2,'0')} · ${esc(r.title)}</h2><div class="pair"><div class="panel"><h3>上一稿</h3><img src="previous/textbook-${r.id}.svg" alt="${r.order}上一稿"></div><div class="panel"><h3>本轮 · 原生清晰线稿</h3><img src="textbook/${r.id}.svg?v=${r.rendered.textbook.sha256.slice(0,12)}" alt="${r.order}本轮清晰线稿"></div></div></section>`).join('')}</main></html>`);
for(const asset of unchanged)if(sha(await readFile(asset.path))!==asset.sha256)throw new Error('Unselected drawing changed: '+asset.path);
await writeFile(out+'/unchanged-assets.json',JSON.stringify(unchanged,null,2)+'\n');
console.log('Built five native line drawings / ten SVG drafts; eight approved SVGs unchanged.');
