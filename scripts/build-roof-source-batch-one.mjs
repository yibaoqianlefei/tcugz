import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {roofBatchOne,svgDefs,svgStyle,esc} from './lib/roof-source-batch-one.mjs';
import {roofReviewReferencesById,roofReviewLimitationsById,revisionNotesById} from './lib/roof-review-references-2026-11-01.mjs';
export const root='audit-output/roof-source-redraw-batch-01-2026-10-30';
const sha=s=>createHash('sha256').update(s).digest('hex');
const text=(x,y,s,size=24,attrs='')=>`<text x="${x}" y="${y}" font-size="${size}" ${attrs}>${esc(s)}</text>`;
const line=(d,width=1)=>`<path d="${d}" fill="none" stroke="#67758a" stroke-width="${width}"/>`;
function wrap(s,limit){let rows=[],row='',count=0;for(const ch of s){const w=ch.charCodeAt(0)<128?.55:1;if(count+w>limit&&row){rows.push(row);row='';count=0;}row+=ch;count+=w;}if(row)rows.push(row);return rows;}
const tick=(x,y)=>line(`M${x-5} ${y+5}L${x+5} ${y-5}`,2);
function dims(data,map,mode){return data.dimensions.map(d=>{
 const A=map(d.a),B=map(d.b),isY=d.axis==='y',v=map(isY?[d.offset,0]:[0,d.offset])[isY?0:1];
 const a=isY?[v,A[1]]:[A[0],v],b=isY?[v,B[1]]:[B[0],v];
 const signed=(point,end)=>{const direction=Math.sign(end-point);return [point+direction*6,end+direction*7];};
 const wa=isY?signed(A[0],v):signed(A[1],v),wb=isY?signed(B[0],v):signed(B[1],v);
 let s=line(`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`)+tick(...a)+tick(...b);
 s+=isY?line(`M${wa[0]} ${A[1]}H${wa[1]}M${wb[0]} ${B[1]}H${wb[1]}`):line(`M${A[0]} ${wa[0]}V${wa[1]}M${B[0]} ${wb[0]}V${wb[1]}`);
 if(mode==='node'&&d.labelAtNode){
  const [x,y]=map(d.labelAtNode),mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
  s+=line(`M${mid[0]} ${mid[1]}L${x-28} ${y-8}H${x-8}`)+text(x,y,d.label,23);
 }else if(d.labelSide){
  const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],x=isY?v+20:mid[0]+d.labelSide*40,y=isY?mid[1]+d.labelSide*18:v+40;
  const endX=isY?x-18:x-Math.sign(d.labelSide)*12;
  s+=line(`M${mid[0]} ${mid[1]}L${endX} ${y-8}`)+text(x,y,d.label,23,'text-anchor="middle"');
 }else if(isY){const x=v-12,y=(a[1]+b[1])/2;s+=text(x,y,d.label,23,`text-anchor="middle" transform="rotate(-90 ${x} ${y})"`);}
 else s+=text((a[0]+b[0])/2,v-13,d.label,24,'text-anchor="middle"');
 return `<g data-dimension-id="${d.id}" data-dimension-label="${esc(d.label)}">${s}</g>`;
 }).join('');}
const drawingRef={standard:'GB/T 50001—2017 房屋建筑制图统一标准',officialSource:'https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2018/art_17339_234638.html',publisherSource:'https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=102879',clause:'11.1.1～11.1.4、11.2.1～11.2.4、11.3.1～11.3.2',page:'印刷页43～45；官方PDF第49～51页',checkedOn:'2026-10-30',verification:'实际阅读官方PDF图页：尺寸线、界线、起止符号、数字和错位排字。屏幕线宽按目标尺寸调整，不冒充纸面打印比例。',localSource:'standards/GBT50001-2017-official.pdf'};
const waterRef={standard:'GB 55030—2022 建筑与市政工程防水通用规范',officialSource:'https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2022/art_17339_768499.html',publisherSource:'https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=154718',clause:'4.4.1、4.4.4、4.4.5',page:'印刷页15～17；官方PDF第19～21页',checkedOn:'2026-10-30',verification:'实际阅读平屋面设防、排水系统、泛水及高低跨变形缝相关原文。历史节点的单层细石混凝土表达不等于现行完整防水设防；原图≥250、60、70等不冒称由本条统一规定。',localSource:'standards/GB55030-2022-official.pdf'};
function frame(def,data,record,mode){
 const narrow=mode==='node',w=narrow?620:1400,isTruss=def.id.startsWith('roof-truss');
 const titleLines=wrap(def.title,narrow?17:39),headerBottom=titleLines.length>1?151:122;
 const part=data.parts[0];let [minX,minY,bw,bh]=part.box,maxX=minX+bw,maxY=minY+bh;
 for(const d of data.dimensions){const a=d.a,b=d.b;minX=Math.min(minX,a[0],b[0],d.axis==='y'?d.offset-20:1e9);maxX=Math.max(maxX,a[0],b[0],d.axis==='y'?d.offset+16:-1e9);minY=Math.min(minY,a[1],b[1],d.axis==='x'?d.offset-18:1e9);maxY=Math.max(maxY,a[1],b[1],d.axis==='x'?d.offset+30:-1e9);}
 const availW=narrow?440:(isTruss?1220:770),availH=narrow?720:(isTruss?550:760);
 const scale=Math.min(availW/(maxX-minX),availH/(maxY-minY));
 const graphicW=(maxX-minX)*scale,graphicH=(maxY-minY)*scale;
 const x=narrow?90+(440-graphicW)/2:85+(isTruss?(1220-graphicW)/2:(770-graphicW)/2),y=headerBottom+70;
 const tx=x-minX*scale,ty=y-minY*scale,map=([X,Y])=>[tx+X*scale,ty+Y*scale];
 let body=`<g data-layout="${mode}-${part.id}" transform="translate(${tx} ${ty}) scale(${scale})">${part.body}</g>`+dims(data,map,mode);
 for(const [i,m] of data.marks.entries()){
  const [ax,ay]=map(m.target),cy=ty+m.row*scale,cx=narrow?(m.side==='left'?30:590):(m.side==='left'?40:900);
  const sign=Math.sign(cx-ax),radius=16,dx=Math.min(Math.abs(cy-ay),Math.max(0,Math.abs(cx-ax)-radius-5));
  const elbow=ax+sign*dx;
  body+=`<g data-callout-id="${i+1}">${line(`M${ax} ${ay}L${elbow} ${cy}H${cx-sign*radius}`)}<circle cx="${cx}" cy="${cy}" r="${radius}" fill="white" stroke="#697992" stroke-width="1"/>${text(cx,cy+8,i+1,24,'text-anchor="middle"')}</g>`;
 }
 const viewY=y+graphicH+45;
 body+=text(narrow?40:85,viewY,data.view,23,'fill="#506593"');
 let legendY=narrow?viewY+61:y+18;
 const legendX=narrow?42:970;
 for(const [i,m] of data.marks.entries()){
  const rows=wrap(m.name,narrow?20:13);
  body+=`<g data-label-id="${i+1}">${text(legendX,legendY,String(i+1).padStart(2,'0'),24,'fill="#465b96"')}${rows.map((row,j)=>text(legendX+46,legendY+j*34,row,26)).join('')}</g>`;
  legendY+=rows.length*34+27;
 }
 let bottom=Math.max(viewY+40,legendY)+(narrow?20:45),noteRows=wrap(def.note,narrow?24:59);
 if(isTruss){bottom=viewY+62;body+=text(narrow?40:85,bottom,'原图跨度示例',24,'font-weight="700"');bottom+=44;}
 const h=Math.max(narrow?680:980,bottom+noteRows.length*30+127),footerY=h-85-noteRows.length*30;
 body+=line(`M${narrow?40:65} ${footerY}H${w-(narrow?40:65)}`);
 body+=noteRows.map((row,i)=>text(narrow?40:65,footerY+37+i*30,row,narrow?21:23)).join('');
 body+=text(narrow?40:65,h-25,narrow?'制图：GB/T 50001—2017；构造依据见配套说明':'制图：GB/T 50001—2017 · 构造适用依据：'+(isTruss?'原图形式与实例跨度；不表示结构设计':'GB 55030—2022 4.4（与原图实例分别记录）'),narrow?19:21,'fill="#68758a"');
 const header=titleLines.map((row,i)=>text(narrow?40:65,52+i*38,row,narrow?29:34,'font-weight="700"')).join('')+text(narrow?40:65,headerBottom-20,(def.figure?def.figure+' · ':'')+'原图实例 · 不按比例'+(isTruss?' · 跨度单位 m':' · 尺寸单位 mm'),narrow?20:23,'fill="#68758a"')+line(`M${narrow?40:65} ${headerBottom}H${w-(narrow?40:65)}`);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="drawing-title drawing-desc"><title id="drawing-title">${esc(def.title)}</title><desc id="drawing-desc">${esc(data.view+'。'+def.note)}</desc><metadata>${esc(JSON.stringify(record))}</metadata>${svgDefs}${svgStyle}<rect width="${w}" height="${h}" fill="white"/>${header}${body}</svg>`;
 return {svg,w,h,geometryPlacement:{tx,ty,scale},graphicBox:[x,y,graphicW,graphicH]};
}
export {frame as renderRoofDrawingFrame};
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
for(const sub of ['textbook','node','previews','view'])await mkdir(root+'/'+sub,{recursive:true});
const records=[];
const approvals=JSON.parse(await readFile(root+'/approvals.json','utf8').catch(()=>'[]'));
const previous=JSON.parse(await readFile(root+'/evidence.json','utf8').catch(()=>'[]'));
const graph=JSON.parse(await readFile('src/data/curriculumLearning.json','utf8'));
for(const [i,def] of roofBatchOne.entries()){
 const approval=approvals.find(a=>a.id===def.id);
 if(approval){
  const existing=previous.find(r=>r.id===def.id);
  if(!existing)throw new Error('Approved drawing record missing: '+def.id);
  for(const mode of ['textbook','node'])if(sha(await readFile(root+'/'+approval.assets[mode].path))!==approval.assets[mode].sha256)throw new Error('Approved asset changed: '+def.id+' / '+mode);
  records.push(existing);continue;
 }
 const original='/images/roof/'+def.file,bytes=await readFile('public'+original),sourceInfo=await sharp(bytes).metadata(),data=def.build();
 const record={id:def.id,title:def.title,order:i+1,revision:def.revision??'roof-batch1-r1',source:{path:original,sha256:sha(bytes),width:sourceInfo.width,height:sourceInfo.height,figure:def.figure??null},scope:data.view,parameters:def.parameters,
  knowledgeContext:{lesson:graph.nodes[def.id].primary.lessonPath,unitId:graph.nodes[def.id].primary.knowledgeId,nodeId:def.id,primary:true},relatedLearningContexts:graph.nodes[def.id].related.map(c=>({lesson:c.lessonPath,unitId:c.knowledgeId})),references:def.id.startsWith('roof-truss')?[drawingRef]:[drawingRef,waterRef],
  geometryDigests:Object.fromEntries(data.parts.map(p=>[p.id,sha(p.body)])),anchors:data.anchors,interfaces:data.interfaces??[],dimensions:data.dimensions,geometryChecks:def.checks,teaching:def.teaching,
  unresolved:def.id.startsWith('roof-truss')?['原图未给出杆件截面、承载力、节点连接和支座设计；不据图推定。']:['原图未示的材料品种、完整设防、厚度或连接参数不补造；实例适用条件须结合工程设计。'],
  assets:{textbook:'textbook/'+def.id+'.svg',node:'node/'+def.id+'.svg'},publication:{status:'draft',formalReplacement:false},technicalReview:{status:'partial',scope:'原图构造关系与已读取规范适用范围；非工程技术审定。'}};
 if(def.sourceTracing){
  const source=def.sourceTracing.source;
  record.sourceTracing={method:def.sourceTracing.method,tool:def.sourceTracing.tool,sourceSha256:source.sourceSha256,contourSha256:source.contourSha256,masks:{polygons:source.polygons,white:source.white},retainedLeaders:source.retainedLeaders,criticalRegions:source.criticalRegions,evidence:'correction-2026-11-01/contour-evidence.json',fidelity:source.fidelity};
  record.references=[{...drawingRef,checkedOn:'2026-11-01'},...(roofReviewReferencesById[def.id]??[])];
  record.unresolved=roofReviewLimitationsById[def.id]??record.unresolved;
  record.revisionNotes=revisionNotesById[def.id]??[];
  record.technicalReview={status:'source-redrawn-awaiting-human-review',checkedOn:'2026-11-01',scope:'原图局部、现行规范原文及实际可读取官方图集样张交叉核对；不等于现代工程节点设计审定。'};
 }
 if(def.sourceReconstruction){
  const existing=previous.find(r=>r.id===def.id);
  record.sourceReconstruction=def.sourceReconstruction;
  record.orthogonalChecks=data.orthogonalChecks??[];
  record.references=existing?.references??[{...drawingRef,checkedOn:'2026-11-01'},...(roofReviewReferencesById[def.id]??[])];
  record.unresolved=[...new Set([...(roofReviewLimitationsById[def.id]??existing?.unresolved??record.unresolved),...(def.uncertainties??[])])];
  record.revisionNotes=existing?.revisionNotes??revisionNotesById[def.id]??[];
  record.technicalReview={status:'native-clean-line-awaiting-human-review',checkedOn:'2026-11-01',scope:'原生矢量重建与清晰线型；原图实例、参数和已读规范适用边界分别保留。'};
 }
 const modes={};
 for(const mode of ['textbook','node']){const result=frame(def,data,record,mode);await writeFile(root+'/'+record.assets[mode],result.svg);await sharp(Buffer.from(result.svg)).resize({width:mode==='node'?620:1400}).png().toFile(`${root}/previews/${mode}-${def.id}.png`);modes[mode]={sha256:sha(result.svg),width:result.w,height:result.h,geometryPlacement:result.geometryPlacement,graphicBox:result.graphicBox};}
 record.rendered=modes;records.push(record);
 const versions={textbook:modes.textbook.sha256.slice(0,12),node:modes.node.sha256.slice(0,12)};
 await writeFile(root+'/view/'+def.id+'.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(def.title)} · 原图与重绘对照</title><style>body{margin:0;background:#f7f8fa;color:#202d46;font:16px/1.8 system-ui}header,main{max-width:1500px;margin:auto;padding:24px}a{color:#465b96}h1{font-size:26px}nav{display:flex;gap:20px}section{margin:30px 0}.compare{display:grid;grid-template-columns:minmax(250px,.7fr) minmax(500px,1.5fr);gap:24px;align-items:start}.sheet{background:white;border:1px solid #d9deea;padding:15px}.sheet img{width:100%;height:auto;display:block}.reader{width:min(390px,100%);height:760px;overflow:auto;border:1px solid #d9deea;background:white}.reader img{width:100%;height:auto;display:block}details{border-top:1px solid #d9deea;padding:15px 0}li{margin-bottom:10px}small{color:#63718b}@media(max-width:800px){header,main{padding:18px}.compare{display:block}.sheet{margin-bottom:18px}h1{font-size:22px}}</style><header><nav><a href="../index.html#${def.id}">← 第一组九张</a><a href="../textbook/${def.id}.svg?v=${versions.textbook}">教材版SVG</a><a href="../node/${def.id}.svg?v=${versions.node}">节点版SVG</a></nav><h1>${String(i+1).padStart(2,'0')} · ${esc(def.title)}</h1><small>按原图实例重绘 · 图纸未替换正式教材与节点</small></header><main><div class="compare"><section class="sheet"><h2>原图</h2><img src="${original}" alt="${esc(def.title)}原图"></section><section class="sheet"><h2>教材版</h2><img src="../${record.assets.textbook}?v=${versions.textbook}" alt="教材版重绘"></section></div><section><h2>节点版 · 390px阅读栏</h2><div class="reader"><img src="../${record.assets.node}?v=${versions.node}" alt="节点版重绘"></div></section><section><h2>教材关联</h2><p>${esc(def.teaching)}</p><p><a href="/#/lesson/${def.lesson}">查看对应课程 ↗</a></p></section><details><summary>原图参数与适用范围</summary><ul>${def.parameters.map(p=>`<li>${esc(p.name)}：${esc(p.value)} · ${esc(p.sourceLocator)}</li>`).join('')}</ul><p>${esc(def.note)}</p></details><details><summary>规范依据与构造核对</summary><ul>${record.references.map(r=>`<li><a href="${r.officialSource}">${esc(r.standard)}</a> · ${esc(r.clause)} · ${esc(r.page)}<p>${esc(r.verification)}</p></li>`).join('')}</ul><ul>${def.checks.map(c=>`<li>${esc(c)}</li>`).join('')}</ul></details></main></html>`);
}
await writeFile(root+'/evidence.json',JSON.stringify(records,null,2)+'\n');
await writeFile(root+'/sources.json',JSON.stringify(records.map(r=>({id:r.id,...r.source})),null,2)+'\n');
await writeFile(root+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>屋顶原图重绘 · 第一组九张</title><style>*{box-sizing:border-box}body{margin:0;background:#f8f9fb;color:#202d46;font:16px/1.75 system-ui}header,main{max-width:1600px;margin:auto;padding:36px}header{border-bottom:1px solid #d9deea}h1{font-size:38px;margin:8px 0 12px}p{color:#5e6d88}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:25px}article{background:white;border:1px solid #d5dced;border-radius:8px;overflow:hidden;transition:transform .2s,box-shadow .2s}article:hover{transform:translateY(-4px);box-shadow:0 12px 30px #24386512}article>div{padding:20px}article img{width:100%;height:310px;object-fit:contain;background:white;border-bottom:1px solid #e4e7ef}h2{font-size:20px;margin:8px 0}a{color:#465b96;text-decoration:none}.num{color:#465b96;font-size:24px}.actions{display:flex;gap:20px;border-top:1px solid #e4e7ef}.tag{display:inline-block;margin-right:14px;color:#465b96}small{color:#64718a}@media(max-width:1050px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:650px){header,main{padding:20px}.grid{grid-template-columns:1fr}h1{font-size:29px}}</style><header><span class="tag">SOURCE DRAWING · 01 / 09</span><h1>屋顶构造 · 第一组重绘</h1><p>沿当前构造节点目录顺序：三种屋架、两种泛水、两种直管式水落口、两种自由落水檐口。</p><small>9张原图 · 18份可编辑SVG · 原图实例与规范要求分开记录 · 本批为图稿交付</small></header><main><div class="grid">${records.map(r=>`<article id="${r.id}"><a href="view/${r.id}.html"><img loading="lazy" src="previews/textbook-${r.id}.png?v=${r.rendered.textbook.sha256.slice(0,12)}" alt="${esc(r.title)}"></a><div><span class="num">${String(r.order).padStart(2,'0')}</span><h2>${esc(r.title)}</h2><p>${esc(r.teaching)}</p></div><div class="actions"><a href="view/${r.id}.html">原图对照 →</a><a href="${r.assets.textbook}?v=${r.rendered.textbook.sha256.slice(0,12)}">教材SVG</a><a href="${r.assets.node}?v=${r.rendered.node.sha256.slice(0,12)}">节点SVG</a></div></article>`).join('')}</div><p><a href="evidence.json">逐图来源与依据记录</a> · <a href="geometry-check.html">双版排版检查页</a></p></main></html>`);
await writeFile(root+'/geometry-check.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>屋顶第一组 · 18份SVG检查</title><style>body{font:16px system-ui;color:#202d46}section{margin-bottom:40px}iframe{border:1px solid #d8dfeb;vertical-align:top}h2{font-size:20px}a{color:#465b96}</style><a href="index.html">← 图稿目录</a>${records.map(r=>`<section><h2>${r.order} · ${esc(r.title)}</h2>${['textbook','node'].map(mode=>`<iframe title="${mode}-${r.id}" src="${r.assets[mode]}?v=${r.rendered[mode].sha256.slice(0,12)}" width="${r.rendered[mode].width}" height="${r.rendered[mode].height}"></iframe>`).join('')}</section>`).join('')}</html>`);
const publication=JSON.parse(await readFile(root+'/publication.json','utf8').catch(()=>'{}'));
let gallery=await readFile(root+'/index.html','utf8');
for(const approved of approvals){
 const isPublished=publication.batch?.some(r=>r.id===approved.id),label=isPublished?'已批准 · 已接入':'人工核对通过';
 gallery=gallery.replace(`<span class="num">${String(approved.order).padStart(2,'0')}</span>`,`<span class="num">${String(approved.order).padStart(2,'0')}</span> <small style="color:#287064">${label}</small>`);
 if(isPublished){
  const viewPath=root+'/view/'+approved.id+'.html',html=await readFile(viewPath,'utf8');
  const updated=html.replace('图纸未替换正式教材与节点','人工核对通过 · 已接入教材与节点');
  await writeFile(viewPath,updated.includes(`href="/#/node/${approved.id}"`)?updated:updated.replace('</nav>',`<a href="/#/node/${approved.id}">正式节点 ↗</a></nav>`));
 }
}
if(publication.batch?.length)gallery=gallery.replace('本批为图稿交付','01、02、03、09已接入；其余五张为核对稿');
await writeFile(root+'/index.html',gallery);
console.log('Built 9 source drawings / 18 SVG drafts with source hashes, geometry, dimensions and evidence.');
}
