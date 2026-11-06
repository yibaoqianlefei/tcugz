import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {wallRoundTwo,svgDefs,svgStyle,esc} from './lib/wall-source-round-two.mjs';
const out='audit-output/wall-source-redraw-next-2026-10-29';
const date='2026-10-30',revision='wall-source-r3';
const sources=JSON.parse(await readFile(out+'/sources.json','utf8'));
const text=(x,y,s,size=26,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" ${extra}>${esc(s)}</text>`;
const line=(x,y,X,Y,cls='fine')=>`<path d="M${x} ${y}L${X} ${Y}" class="${cls}" fill="none"/>`;
const labelLeader=(x,y,X,Y)=>{const sign=X>=x?1:-1,dy=Math.abs(Y-y),room=Math.abs(X-x),dx=dy<=room?dy:dy/Math.sqrt(3)<=room?dy/Math.sqrt(3):0;return `<path d="M${x} ${y}L${x+sign*dx} ${Y}H${X}" class="fine" fill="none"/>`;};
function wrap(value,limit){let rows=[],row='',n=0;for(const token of value.match(/[A-Za-z0-9Φφ±≥≤]+(?:[.:∶×～~%+-][A-Za-z0-9Φφ]+)*%?|./gu)??[]){const w=[...token].reduce((s,ch)=>s+(/[\u0020-\u007f]/.test(ch)?.55:1),0);if(row&&n+w>limit){rows.push(row);row='';n=0;}row+=token;n+=w;}if(row)rows.push(row);return rows;}
const references={
 drawing:{standard:'GB/T 50001—2017 房屋建筑制图统一标准',clause:'7.3.1～7.3.3、9.1.1～9.1.4',url:'https://gf.cabr-fire.com/m/article-45613.htm',materialUrl:'https://gf.cabr-fire.com/m/article-45652.htm',statusUrl:'https://ebook.chinabuilding.com.cn/zbooklib/bookpdf/probation?SiteID=1&bookID=102879',checkedOn:date,verification:'读取规范原文中的引出线及图例表达规则；材料图例疏密按阅读尺寸调整，数字图幅不冒充打印比例。'},
 masonry:{standard:'GB 55007—2021 砌体结构通用规范',clause:'3.3.2',url:'https://gf.cabr-fire.com/m/article-39239.htm',officialSource:'https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2021/art_17339_761188.html',checkedOn:date,verification:'原文核对灌孔材料要求；原图C15不能据此转换为现行通用值，Cb与C不擅自换算。'},
 seismic:{standard:'GB 55002—2021 建筑与市政工程抗震通用规范',clause:'5.5.8、5.5.9、5.5.11',url:'https://gf.cabr-fire.com/m/article-39119.htm',checkedOn:date,verification:'读取砌体结构房屋整体联系、楼屋面支承与拉结、相关构件混凝土要求；不以平面示意证明结构计算或实际抗震合规。'},
 solar:{standard:'JGJ/T 267—2012 被动式太阳能建筑技术规范',clause:'4.4、4.6、6.2（范围及相关原文定位）',url:'https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=57523',textSource:'https://pro5323b5d3-pic11.ysjianzhan.cn/upload/2JGJ-T267-2012BDSTYNJZJSGF.pdf',checkedOn:date,verification:'出版目录与标准扫描件章节已定位；原图厚度和孔口为实例，不由本图推定集热量、全年气密或玻璃安全性能。'},
 damp:{standard:'GB 50352—2019 民用建筑设计统一标准',clause:'6.10.3（墙身防潮相关原文）',url:'https://www.fqghj.net/show.aspx?nid=3137&tid=163',statusUrl:'https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=112002',officialSource:'https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2024/art_17339_240715.html',checkedOn:date,verification:'核对砌筑墙身水平防潮的位置与连续性。石砌原图未单列防潮层，不将缺画解释为可取消。'},
 waterproof:{standard:'GB 55030—2022 建筑与市政工程防水通用规范',clause:'整体防水与节点构造适用范围',url:'https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2022/art_17339_768499.html',checkedOn:date,verification:'核对发布及强制规范身份；本批散水材料、厚度、坡度及上翻值仍按原图实例记录，不冒称由该规范统一规定。'}
};
function referencesFor(id){const keys=['drawing'];if(id.includes('bearing'))keys.push('seismic');if(id==='block-wall-core-column-01')keys.push('masonry','seismic');if(id==='hollow-block-forms-01')keys.push('masonry');if(id==='passive-solar-wall-01')keys.push('solar');if(id.includes('plinth'))keys.push('damp');if(id.includes('apron'))keys.push('waterproof');return keys.map(k=>references[k]);}
function layout(def,data,mode){
 const narrow=mode==='node',w=narrow?620:1400;
 let y=140,placements=[];
 if(narrow){const commonScale=540/Math.max(...data.parts.map(p=>p.box[2]));for(const part of data.parts){const scale=data.equalScale?commonScale:540/part.box[2];placements.push({part,scale,x:40+(540-part.box[2]*scale)/2-part.box[0]*scale,y:y-part.box[1]*scale});y+=part.box[3]*scale+65;}}
 else if(data.parts.length===4){for(let i=0;i<4;i++){const part=data.parts[i],scale=550/part.box[2];placements.push({part,scale,x:100+(i%2)*650-part.box[0]*scale,y:180+Math.floor(i/2)*350-part.box[1]*scale});}y=900;}
 else if(data.parts.length===2){const commonScale=Math.min(...data.parts.flatMap(p=>[590/p.box[2],610/p.box[3]]));for(let i=0;i<2;i++){const part=data.parts[i],scale=data.equalScale?commonScale:Math.min(590/part.box[2],610/part.box[3]);placements.push({part,scale,x:70+i*660+(590-part.box[2]*scale)/2-part.box[0]*scale,y:185-part.box[1]*scale});}y=930;}
 else{const part=data.parts[0],scale=Math.min((data.wide?1240:820)/part.box[2],(data.wide?740:790)/part.box[3]);placements.push({part,scale,x:80-part.box[0]*scale,y:180-part.box[1]*scale});y=data.wide?180+part.box[3]*scale+85:180;}
 const diagram=placements.map(place=>{
  const {part,scale,x,y}=place,map=([X,Y])=>[x+X*scale,y+Y*scale];
  let s=`<g data-layout="${mode}-${part.id}" transform="translate(${x} ${y}) scale(${scale})">${part.body}</g>`;
  for(const [i,a] of (data.annotations??[]).entries()){if(a.part!==part.id)continue;const [X,Y]=map([a.x,a.y]);s+=text(X,Y,a.text,a.size*scale,`data-source-annotation="${part.id}-${i}"`);}
  if(part.caption)s+=text(x+(part.box[0]+part.box[2]/2)*scale,y+(part.box[1]+part.box[3])*scale+32,part.caption,narrow?24:25,'text-anchor="middle"');
  for(const [i,mark] of data.marks.entries()){if(mark.part!==part.id)continue;const [ax,ay]=map(mark.target),[X,Y]=map([mark.target[0]+mark.offset[0],mark.target[1]+mark.offset[1]]);const diff=Math.abs(Y-ay),room=Math.abs(X-ax)-18,dx=diff<=room?diff:diff/Math.sqrt(3)<=room?diff/Math.sqrt(3):0,sign=X>=ax?1:-1;
   s+=`<g data-callout-id="${i+1}"><path d="M${ax} ${ay}L${ax+sign*dx} ${Y}H${X-sign*16}" fill="none" class="fine"/><circle cx="${X}" cy="${Y}" r="16" fill="white" stroke="#667482" stroke-width=".8"/>${text(X,Y+8,i+1,24,'text-anchor="middle"')}</g>`;
  }
  for(const [i,dim] of data.dimensions.entries()){if(dim.part!==part.id)continue;const [a,b]=map([dim.x,dim.y]),[A,B]=map([dim.X,dim.Y]);s+=`<g data-dimension-id="${dim.id??'dimension-'+i}" data-dimension-label="${esc(dim.label)}">`+line(a,b,A,B)+line(a-5,b+5,a+5,b-5,'medium')+line(A-5,B+5,A+5,B-5,'medium');if(dim.labelAt){const [X,Y]=map(dim.labelAt);s+=labelLeader((a+A)/2,(b+B)/2,X-7,Y-8)+text(X,Y,dim.label,23);}else s+=dim.axis==='y'?text(a-11,(b+B)/2,dim.label,23,`text-anchor="middle" transform="rotate(-90 ${a-11} ${(b+B)/2})"`):text((a+A)/2,b-10,dim.label,24,'text-anchor="middle"');s+='</g>';}
  if(def.id.includes('plinth')){const inside=def.id==='stone-plinth-01'?270:376,ext=def.id==='stone-plinth-01'?665:650;for(const [X,Y,label] of [[520,inside,'±0.000'],[130,ext,'室外']]){const [a,b]=map([X,Y]);s+=`<path d="M${a-12} ${b-21}H${a+12}L${a} ${b}Z" fill="none" class="medium"/>`+text(a,b-29,label,25,'text-anchor="middle"');}}
  if(def.id.includes('apron')){const [a,b]=map([570,530]);s+=text(a,b,'3%～5%',25,'text-anchor="middle"');}
  return s;
 }).join('');
 let legend='',legendY=narrow?y+12:(!data.wide&&data.parts.length===1?200:y),legendX=narrow?46:(!data.wide&&data.parts.length===1?990:100);
 const columns=!narrow&&(data.wide||data.parts.length>1)?2:1,ys=[legendY,legendY];
 for(let i=0;i<data.marks.length;i++){const mark=data.marks[i],col=i%columns,x=legendX+col*650,row=ys[col],limit=narrow?19:columns===2?20:13;
  const names=wrap(mark.name,limit),details=wrap(mark.detail,limit+1);legend+=`<g data-label-id="${i+1}">${text(x,row,String(i+1).padStart(2,'0'),24,'fill="#465b96"')}`;
  let Y=row;for(const value of names){legend+=text(x+45,Y,value,narrow?27:26);Y+=34;}for(const value of details){legend+=text(x+45,Y,value,narrow?23:23,'fill="#63718a"');Y+=30;}legend+='</g>';ys[col]=Y+22;
 }
 let bottom=Math.max(y,...ys)+45;
 if(!narrow&&!data.wide&&data.parts.length===1)bottom=Math.max(1020,...ys)+30;
 const h=Math.max(narrow?660:1120,bottom+140);
 return {w,h,body:diagram+legend};
}
function render(def,data,record,mode){const a=layout(def,data,mode),title=record.title.replace('墙体承重结构布置方案','承重布置').replace('构造做法','');
 const short=mode==='node',titleLines=wrap(title,short?18:38);
 let header=titleLines.map((s,i)=>text(short?40:65,50+i*34,s,short?30:33,'font-weight="700"')).join('');
 const sub=def.id==='block-wall-core-column-01'?'原图实例 · 轴测示意 · 不按比例':def.parameters.length?'原图实例 · 不按比例':'按原图构造关系重绘 · 不按比例';
 header+=text(short?40:65,titleLines.length>1?115:90,sub,short?21:23,'fill="#63718a"');
 const footerY=a.h-128;
 let footer=line(40,footerY,a.w-40,footerY);
 const note=def.id==='block-wall-core-column-01'?'2Φ12、C15为原图实例；现行材料与配筋另按适用设计确定。':def.id==='hollow-block-forms-01'?'孔型用于识读；构件性能需结合材料、尺寸与检验资料。':def.id==='stone-plinth-01'?'原图未单列防潮层；墙脚防潮仍须结合完整构造核查。':def.id==='passive-solar-wall-01'?'各层厚度与孔口为图示实例，运行性能另行核定。':def.id.includes('apron')?'图中尺寸及坡度为原图实例；B未给数值。':def.id.includes('bearing')?'结构布置示意，不表示完整连接、配筋或结构计算。':'图纸表达范围以原图为准，未给尺寸不由图面量取。';
 wrap(note,short?24:60).forEach((s,i)=>{footer+=text(short?40:65,footerY+33+i*29,s,short?21:22);});
 footer+=text(short?40:65,a.h-25,short?'制图：GB/T 50001—2017 · 构造依据见配套说明':record.references.map(r=>r.standard.split(' ')[0]+' '+r.standard.split(' ')[1]).join('；'),short?18:20,'fill="#63718a"');
 const metadata={...record,presentation:mode,width:a.w,height:a.h};
 return {svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${a.w}" height="${a.h}" viewBox="0 0 ${a.w} ${a.h}" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}</title><desc id="desc">${esc(def.scope)}</desc><metadata>${esc(JSON.stringify(metadata))}</metadata>${svgDefs}${svgStyle}<rect width="${a.w}" height="${a.h}" fill="white"/>${header}${line(40,123,a.w-40,123)}${a.body}${footer}</svg>`,width:a.w,height:a.h};
}
for(const dir of ['textbook','node','previews','view'])await mkdir(out+'/'+dir,{recursive:true});
const records=[];
for(const def of wallRoundTwo){
 const source=sources.find(s=>s.id===def.id);assert(source);
 const bytes=await readFile('public'+source.image.path),sha256=createHash('sha256').update(bytes).digest('hex');assert.equal(sha256,source.image.sha256);
 const data=def.build();assert(data.parts.length&&data.parts.every(p=>p.body.includes('data-geometry-id')));
 const record={id:def.id,title:source.title,revision,createdOn:date,source:{...source.image,sha256},scope:def.scope,parameters:def.parameters.map(value=>({value,kind:'source-example'})),geometryChecks:def.checks,knowledgeContext:source.primary,references:referencesFor(def.id),geometryDigests:Object.fromEntries(data.parts.map(p=>[p.id,createHash('sha256').update(p.body).digest('hex')])),unresolved:['原图及模型不含完整设计条件；本图不构成成套工程设计。'],publication:{status:'review-output',formalReplacement:false},technicalReview:{status:'source-based-teaching-reference',scope:'按原图识读与所列条文范围核对，未作结构或系统性能全项验算。'},assets:{textbook:`textbook/${def.id}.svg`,node:`node/${def.id}.svg`}};
 if(def.id==='block-wall-core-column-01'){
  record.unresolved.push('原图C15为历史实例，与现行灌孔及适用抗震材料要求存在差异；本图未擅自换算Cb与C。');
  record.correction={replaces:'rejected-r1',reason:'旧稿概括砌块轮廓造成孔腔、墙肢连接和错缝失真，已撤回。',method:data.sourceTracing.method,sourceSha256:data.sourceTracing.sourceSha256,contours:data.sourceTracing.parts.map(p=>({id:p.id,crop:p.crop,textMasks:p.textMasks,sha256:p.contourSha256,fidelity:p.fidelity}))};
 }
 if(def.id==='hollow-block-forms-01')record.modelAliases={'单排方孔':'单排双孔','单排异形方孔':'单排组合孔','单排圆孔':'单排圆孔','多排扁孔':'多排扁孔'};
 if(data.geometryAnchors){record.geometryAnchors=data.geometryAnchors;record.dimensionEndpoints=data.dimensions.map(d=>({id:d.id??null,label:d.label,from:[d.x,d.y],to:[d.X,d.Y]}));}
 if(def.id.includes('apron'))record.correction={replaces:'rejected-r2',reason:'原稿室外地坪与20高差标注错位，垫层端部和尺寸界线未共用定位点，墙边嵌缝顶部及底部错位。',method:'对照原图，使地坪低于散水外缘、密封与面层顶齐平、填缝底与面层底相接；各层端点和尺寸界线共用绘图锚点。'};
 record.assetVersions={};
 for(const mode of ['textbook','node']){const result=render(def,data,record,mode);record[mode+'Size']={width:result.width,height:result.height};record.assetVersions[mode]=createHash('sha256').update(result.svg).digest('hex').slice(0,12);await writeFile(`${out}/${mode}/${def.id}.svg`,result.svg);if(mode==='textbook')await sharp(Buffer.from(result.svg)).resize({width:840}).png().toFile(`${out}/previews/${def.id}.png`);}
 records.push(record);
 const standards=record.references.map(r=>`<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.standard)}</a> · ${esc(r.clause)}<p>${esc(r.verification)}</p></li>`).join('');
 await writeFile(`${out}/view/${def.id}.html`,`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(record.title)} · 构造图纸</title><link rel="stylesheet" href="../style.css"><header><a href="../index.html#${def.id}">← 返回图纸目录</a><strong>${esc(record.title)}</strong><a href="../${record.assets.textbook}?v=${record.assetVersions.textbook}" target="_blank">教材完整图 ↗</a><a href="../${record.assets.node}?v=${record.assetVersions.node}" target="_blank">节点纵向图 ↗</a></header><main><div class="comparison"><figure><figcaption>原图</figcaption><img src="${record.source.path}" alt="${esc(record.title)}原图"></figure><figure><figcaption>教材重绘图</figcaption><a href="../${record.assets.textbook}?v=${record.assetVersions.textbook}" target="_blank"><img src="../${record.assets.textbook}?v=${record.assetVersions.textbook}" alt="${esc(record.title)}重绘图" width="1400" height="${record.textbookSize.height}"></a></figure><figure class="node-sheet"><figcaption>节点版 · 340px阅读栏</figcaption><div class="node-scroll"><a href="../${record.assets.node}?v=${record.assetVersions.node}" target="_blank"><img src="../${record.assets.node}?v=${record.assetVersions.node}" alt="节点纵向图" width="620" height="${record.nodeSize.height}"></a></div></figure></div><section><h2>教材对应：${esc(record.knowledgeContext.lessonTitle)} · ${esc(record.knowledgeContext.question)}</h2><p>${esc(record.scope)}</p><p>${esc(record.knowledgeContext.task)}</p><ul>${record.geometryChecks.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>${record.parameters.length?'<p>图示实例参数：'+record.parameters.map(p=>esc(p.value)).join('；')+'。</p>':''}<a href="/#/lesson/${record.knowledgeContext.lessonPath}?unit=${record.knowledgeContext.knowledgeId}">查看对应教材 ↗</a><details><summary>规范依据与适用范围</summary><ul>${standards}</ul></details></section></main></html>`);
}
await writeFile(out+'/evidence.json',JSON.stringify(records,null,2)+'\n');
await writeFile(out+'/geometry-check.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>墙体图纸边界检查</title><style>body{margin:0;background:#eef1f7}iframe{display:block;border:0;margin:16px}</style><iframe title="mobile-reader" width="390" height="844" src="view/apron-flashing-01.html"></iframe>${records.flatMap(record=>['textbook','node'].map(mode=>`<iframe title="${mode}-${record.id}" width="${record[mode+'Size'].width}" height="${record[mode+'Size'].height}" src="${record.assets[mode]}?v=${record.assetVersions[mode]}"></iframe>`)).join('')}</html>`);
await writeFile(out+'/style.css',`*{box-sizing:border-box}body{margin:0;background:#f8f9f7;color:#23304b;font:16px/1.8 'Microsoft YaHei',sans-serif}a{color:#465b96;text-underline-offset:4px}header{position:sticky;top:0;z-index:1;background:#fff;border-bottom:1px solid #d4dbea;padding:12px 24px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 24px}main{max-width:1720px;margin:auto;padding:32px 24px}h1{font-size:34px}h2{font-size:22px}.intro{max-width:1000px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}.card,figure{background:white;border:1px solid #d4dbea;padding:16px;margin:0}.card h2{font-size:18px;margin:0 0 12px}.card img{width:100%;height:330px;object-fit:contain}.card p{font-size:14px;color:#63718a}.comparison{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(0,1.5fr) 340px;gap:20px;align-items:start}.comparison img{width:100%;height:auto}.comparison figure:first-child img{max-height:700px;object-fit:contain}.node-sheet{padding:0!important}.node-sheet figcaption{padding:8px 12px}.node-scroll{height:690px;overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable}.node-scroll img{display:block;width:100%;height:auto}figcaption{font-size:14px;color:#63718a;margin-bottom:12px}section{margin:32px 0;border-top:1px solid #d4dbea;padding-top:20px}details{padding:12px 0}summary{cursor:pointer;color:#465b96}nav{display:flex;flex-wrap:wrap;gap:8px 20px;margin-bottom:28px}footer{font-size:14px;color:#63718a;margin-top:30px}@media(max-width:1150px){.comparison{grid-template-columns:1fr 1.5fr}.node-sheet{grid-column:2;max-width:400px}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:680px){main{padding:20px 14px}header{padding:10px 14px;font-size:14px}.grid,.comparison{grid-template-columns:1fr}.node-sheet{grid-column:auto;width:100%;max-width:400px}.card img{height:auto}.comparison figure:first-child img{max-height:400px}h1{font-size:28px}h2{font-size:20px}}`);
await writeFile(out+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>墙体原图重绘 · 第二批13张</title><link rel="stylesheet" href="style.css"><main><div class="intro"><p>WALL CONSTRUCTION · SOURCE DRAWINGS</p><h1>墙体原图重绘 · 第二批13张</h1><p>对照原图阅读承重布置、砌块与芯柱、太阳房墙体、散水及勒脚。每张提供教材完整图、节点纵向图和规范依据。</p></div><nav>${records.map(r=>`<a href="#${r.id}">${esc(r.title)}</a>`).join('')}</nav><div class="grid">${records.map((r,i)=>`<article class="card" id="${r.id}"><h2>${String(i+1).padStart(2,'0')} · ${esc(r.title)}</h2><a href="view/${r.id}.html"><img src="${r.assets.textbook}?v=${r.assetVersions.textbook}" alt="${esc(r.title)}" loading="lazy" width="1400" height="${r.textbookSize.height}"></a><p>${esc(r.scope)}</p><a href="view/${r.id}.html">原图与双版图纸对照 ↗</a></article>`).join('')}</div><footer>13张来源原图 · 26份SVG · 教学参考图稿。<a href="evidence.json">来源、适用范围及核对记录</a></footer></main></html>`);
console.log(`Generated ${records.length} checked-source drawing pairs: ${out}/index.html`);
