import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {roofBatchTwo,renderRoofBatchTwo,roofBatchTwoDefs,roofBatchTwoStyle} from './lib/roof-source-batch-two.mjs';
const root='audit-output/roof-source-redraw-batch-02-2026-11-01',local='correction-eaves-2026-11-02',out=root+'/'+local,id='water-storage-eaves-drainage-01';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await readFile(p,'utf8'));
const records=await read(root+'/evidence.json'),prior=(await read(out+'/before/evidence.json')).find(n=>n.id===id),def=roofBatchTwo.find(n=>n.id===id),data=def.build();
for(const d of ['textbook','node','previews','checks'])await mkdir(out+'/'+d,{recursive:true});
const changes=[
 {id:'left-thin-pipe-wall',source:'用户指出左侧应为管壁；GLB水落管的内外双面',old:'r3仍将左沟混凝土延伸为斜肩三角楔，管壁内外边又共用上点，造成上口零厚、向下增厚。',fixed:'沟底与漏斗管壁分开；沟底止于起口图示接口，左管壁用内外平行斜边独立成带，分别连续接入竖管双边。接口与壁厚仅作图形整理，不作为原图已注明的施工缝或工程尺寸。'},
 {id:'gutter-outline',source:'原图左侧L形檐沟、立边和底部',old:'沟沿顶部被改成外挑小台阶，内部转角和斜底比例改变。',fixed:'按原图重建L形多带断面、内侧转角、向漏斗斜口延伸的轮廓。'},
 {id:'horizontal-and-lower-lines',source:'沟内y332附近横线及管段y493附近下端横线',old:'独立内水平线丢失，原下端横线被删，管段改成两条敞开长尾。',fixed:'两处投影线均保留；下端横线不被解释为实物封盖或排水堵塞。'},
 {id:'upper-return',source:'墙右上局部收头和暗色座',old:'真实斜边/短折改成直角横台，暗色座改为斜梯形。',fixed:'恢复台阶、上/下斜边和局部暗色座，材料不由外观补定。'},
 {id:'mouths-and-markers',source:'两级穿墙孔、短口端部、水平及竖向短记号',old:'短口简化为双开线，水平四处及竖向三处可见记号未保留。',fixed:'恢复可辨端边及各短记号，未将其命名为钢筋、钉件或固定件。'},
 {id:'graphic-reference',source:'墙、沟、漏斗和空心板共同图形范围',old:'分部使用概括坐标，整体宽高、相对位置及截取范围改变。',fixed:'以原990×571图形框组织几何，墙面/长水平线单独校正，真实斜折与源截取范围保留；不从像素推工程尺寸。'},
 {id:'unidentified-bands',source:'墙侧及屋面上部未名薄带',old:'多处增加砂浆或混凝土图例，超出原图可证范围。',fixed:'未名带使用中性轮廓；仅在源图明确可辨图例区保持相应材料图例。'},
 {id:'source-core-locations',source:'板端肋宽、四完整孔及末端截孔',old:'孔列按近似等距排列，第一孔及第四孔位置偏移，末孔被截成接近半圆。',fixed:'按源白腔和外轮廓共同定位；绘图横坐标606/681/762/836，末孔914，右边界934；仅是图形参考，不是工程孔距。'},
 {id:'source-50-fragment',source:'左侧50文字及可见横/竖尺寸片段',old:'将未完整显示下界的50补成两端闭合尺寸，且改成旋转排字。',fixed:'保留横排50和实际可见线段，不补下端界线、起止斜划或确定测面。'}
];
const record={...prior,revision:def.revision,scope:data.view,sourceFeatures:def.sourceFeatures,parameters:def.parameters,sourceReconstruction:{method:'source-frame-native-reconstruction-with-orthogonal-wall-reference',tracedScanContours:false},geometryDigests:Object.fromEntries(data.parts.map(p=>[p.id,sha(p.body)])),anchors:data.anchors,interfaces:data.interfaces,dimensions:data.dimensions,orthogonalChecks:data.orthogonalChecks,geometryChecks:def.checks,
 unresolved:[...prior.unresolved,'沟内独立水平线、管段下端横线按原投影保留；后者不足以证明实物存在封盖或水路被堵。','水平四记号及竖向三记号物理身份未明，不新增配筋、钉件或材料断言。','50下端界线没有完整显示，保留原横排数值与可见尺寸片段，材料测界不定。'],correction:{date:'2026-11-02',previousSvgHashes:prior.rendered,changes,invalidatedChecks:'r1原图匹配与删除管端横线的判读失效；旧图模抽样不能代替原图逐项核对。'},technicalReview:{status:'revised-source-match-awaiting-independent-review',scope:'本次修正原图保真；沿用既有规范查阅范围，不新增技术要求或工程合规断言。'},rendered:{}};
const previousR2=await read(out+'/before-r3/evidence.json');
record.correction.previousR2={revision:previousR2.revision,rendered:previousR2.rendered,archive:'before-r3/index.html',reason:'用户指出肩部交叉楔线；旧r2接口检查漏检，不能证明r3通过。'};
record.correction.invalidatedChecks+='；r2肩部共界结论撤回，原检查及截图保留于before-r3。';
const previousR3=await read(out+'/before-r4/evidence.json');
record.correction.previousR3={revision:previousR3.revision,rendered:previousR3.rendered,archive:'before-r4/index.html',reason:'用户再次指出管壁身份误判；r3只检查折线共界，未发现实心楔和上口零厚，相关通过结论撤回。'};
record.correction.invalidatedChecks+='；r3管壁身份及构造检查结论撤回，旧稿与检查保留于before-r4。';
record.componentIdentityCorrection={source:'用户2026-11-02明确指出：左侧应该是管壁不应该是三角形截面。',model:{path:'public/models/roof/water-storage-eaves-drainage/water-storage-eaves-drainage.glb',sha256:sha(await readFile('public/models/roof/water-storage-eaves-drainage/water-storage-eaves-drainage.glb')),supports:'水落管为独立网格，漏斗口至竖管具有内外双面，支持连续薄壁身份；不用于推算工程厚度。'},drawingScope:'原图密黑斜肩材料分界不清，本次按用户身份纠正整理接口；保留水平混凝土沟底，不把管壁区域填为混凝土。'};
record.unresolved.push('左沟与管壁图示接口经本轮身份纠正整理，未从原图核得施工缝、连接工艺、管壁材料或厚度。');
record.technicalReview.scope='本次复核管壁身份和连续性，保留原图其余可见信息；不把图形接口、模型尺寸当作原图施工参数，不新增规范要求或工程合规断言。';
for(const mode of ['textbook','node']){const r=renderRoofBatchTwo(def,data,record,mode);await writeFile(out+'/'+mode+'/'+id+'.svg',r.svg);await writeFile(root+'/'+record.assets[mode],r.svg);await sharp(Buffer.from(r.svg)).png().toFile(out+'/previews/'+mode+'-'+id+'.png');await sharp(Buffer.from(r.svg)).png().toFile(root+'/previews/'+mode+'-'+id+'.png');record.rendered[mode]={sha256:sha(r.svg),width:r.width,height:r.height,geometryPlacement:r.geometryPlacement,graphicBox:r.graphicBox};}
records[records.findIndex(n=>n.id===id)]=record;await writeFile(root+'/evidence.json',JSON.stringify(records,null,2)+'\n');await writeFile(out+'/evidence.json',JSON.stringify(record,null,2)+'\n');
function versioned(html){for(const mode of ['textbook','node']){const filename=(mode==='textbook'?'textbook/':'node/')+id+'.svg';const rx=new RegExp('('+filename.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\?v=)[a-f0-9]+','g');html=html.replace(rx,'$1'+record.rendered[mode].sha256.slice(0,12));}const rx=new RegExp('(previews/textbook-'+id+'\\.png\\?v=)[a-f0-9]+','g');return html.replace(rx,'$1'+record.rendered.textbook.sha256.slice(0,12));}
let view=versioned(await readFile(out+'/before/view/'+id+'.html','utf8'));
view=view.replace('<p>原生矢量重绘稿 · 正式教材与模型未改变</p>',`<p>2026-11-02 第11张原图匹配修订稿 · 正式教材与模型未改变</p><p class="warning">旧r1原图匹配结论已撤回；本次恢复沟体、短口端面、内水平线与管端横线。<a href="../${local}/index.html">原图与修订稿同框对照 →</a></p>`).replace(/<details><summary>本稿构造核对记录<\/summary>[\s\S]*?<\/details>/,`<details><summary>本稿构造核对记录</summary><ul>${def.checks.map(c=>'<li>'+c+'</li>').join('')}</ul></details>`);
view=view.replace(/<li>墙外局部竖向投影：50 mm。[^<]*<\/li>/,`<li>墙外局部尺寸片段：50 mm。${def.parameters.find(p=>p.value==='50 mm').conditions}</li>`);
view=view.replace('旧r1原图匹配结论已撤回；本次恢复沟体、短口端面、内水平线与管端横线。','r1～r3相关原图及斜口检查结论已撤回；本次按管壁身份纠正，将左漏斗改为连续平行双边薄壁。');
await writeFile(root+'/view/'+id+'.html',view);
// Merge only this figure's versions into current pages. Never restore a whole
// old index over the already-corrected figure 10 or other batches.
for(const page of ['index.html','reading-check.html'])await writeFile(root+'/'+page,versioned(await readFile(root+'/'+page,'utf8')));
const frame=`<svg xmlns="http://www.w3.org/2000/svg" width="990" height="571" viewBox="0 0 990 571"><title>第11张构造几何共同参考框</title>${roofBatchTwoDefs}${roofBatchTwoStyle}<rect width="990" height="571" fill="white"/>${data.parts[0].body}</svg>`;
await writeFile(out+'/checks/source-frame-geometry.svg',frame);await sharp(Buffer.from(frame)).png().toFile(out+'/previews/source-frame-geometry.png');
const css=`*{box-sizing:border-box}body{margin:0;background:#f7f8fa;color:#24314b;font:16px/1.8 system-ui}header,main{max-width:1540px;margin:auto;padding:26px}h1{font-size:30px}h2{font-size:22px}nav{display:flex;gap:20px;flex-wrap:wrap}a{color:#465b96}.compare{display:grid;grid-template-columns:1fr 1fr;gap:20px}.panel{padding:18px;background:white;border:1px solid #d9e0ec}img{width:100%;height:auto;display:block}.notice{border-left:3px solid #e94b35;background:#edf0f7;padding:15px}section{margin:28px 0}table{width:100%;border-collapse:collapse;background:white;font-size:14px}th,td{padding:12px;border-bottom:1px solid #d9e0ec;text-align:left;vertical-align:top}.readers{display:flex;gap:22px;overflow:auto}.reader{height:720px;overflow:auto;background:white;border:1px solid #d9e0ec;flex:0 0 auto}.muted{font-size:14px;color:#68768e}summary{cursor:pointer;color:#465b96}@media(max-width:900px){.compare{grid-template-columns:1fr}header,main{padding:18px}}`;
await writeFile(out+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>檐沟式蓄水排水 · 原图匹配修正</title><style>${css}</style><header><nav><a href="../view/${id}.html">原审阅链接</a><a href="textbook/${id}.svg">修订教材SVG</a><a href="node/${id}.svg">修订节点SVG</a><a href="validation.json">验证记录</a></nav><h1>11 · 檐沟式蓄水排水 · 原图匹配修正</h1><p class="notice">本次修正第11张。第10张既有修订及其余图稿保持不变；两版同时更新，旧稿与检查留档。</p></header><main><div class="compare"><section class="panel"><h2>原图</h2><img src="../source/${def.file}" alt="第11张原图"></section><section class="panel"><h2>修订几何 · 共用图形框对照</h2><img src="previews/source-frame-geometry.png?v=${sha(frame).slice(0,12)}" alt="修订几何"><p class="muted">同一图形参考框用于比较相对轮廓；墙与长水平线作扫描纠偏，真实斜折保留。标注见完整SVG，不从此框量取施工尺寸。</p></section></div><section class="panel"><details><summary>修订完整教材图</summary><img src="previews/textbook-${id}.png?v=${record.rendered.textbook.sha256.slice(0,12)}" alt="修订完整教材图"></details><details><summary>旧稿r1 · 已撤回匹配结论</summary><img src="before/previews/textbook-${id}.png" alt="旧稿"></details></section><section><h2>逐项修正</h2><table><thead><tr><th>原图定位</th><th>旧稿问题</th><th>本次处理</th></tr></thead><tbody>${changes.map(c=>`<tr><td>${c.source}</td><td>${c.old}</td><td>${c.fixed}</td></tr>`).join('')}</tbody></table></section><section><h2>节点栏阅读</h2><div class="readers">${[318,390].map(w=>`<div class="reader" style="width:${w}px"><img src="node/${id}.svg?v=${record.rendered.node.sha256.slice(0,12)}" alt="${w}px节点图"></div>`).join('')}</div><p class="muted">嵌入图纸栏检查，未冒充手机真机测试。</p></section><section class="panel"><h2>依据与保留项</h2><p>保留50、≥100及原图文字身份；材料测界、薄带及短记号身份未确定。沿用已归档制图及原图适用范围依据，本次不新增规范要求、材料牌号或工程合规结论。</p><nav><a href="evidence.json">本次依据</a><a href="checks/source-match-review.json">独立原图复核</a><a href="before/evidence.json">修订前批次记录</a></nav></section></main></html>`);
// Keep the reported defect visible beside its source and replacement. A whole
// drawing thumbnail can conceal this small but important interface failure.
for(const [name,file] of [['source',root+'/source/'+def.file],['previous',out+'/before-r4/previews/source-frame-geometry.png'],['current',out+'/previews/source-frame-geometry.png']])await sharp(file).extract({left:190,top:345,width:230,height:165}).resize({width:690}).png().toFile(out+'/previews/pipe-wall-'+name+'.png');
const shoulderReview=`<section class="panel" id="shoulder-review"><h2>本次局部修正 · 左侧管壁</h2><p>上一稿仍把斜管壁画成混凝土楔。现按构件身份纠正，管壁独立为内外平行的双边薄带，并连续接入竖管；水平沟底的混凝土保留。</p><div class="compare" style="grid-template-columns:repeat(3,minmax(0,1fr))">${[['source','原图局部'],['previous','上一稿 · 实心楔 / 上口零厚'],['current','本次修正 · 连续薄壁']].map(([n,label])=>`<div><h3>${label}</h3><img src="previews/pipe-wall-${n}.png?v=${record.rendered.textbook.sha256.slice(0,12)}" alt="${label}"></div>`).join('')}</div><p class="muted">左侧接口按用户纠正作图形整理；不作为原图施工缝、连接工艺或工程壁厚标注。</p></section>`;
let reportHtml=await readFile(out+'/index.html','utf8');
reportHtml=reportHtml.replace('<main>','<main>'+shoulderReview).replace('本次修正第11张。','本次修正第11张左侧管壁，r3构造检查结论撤回。');
await writeFile(out+'/index.html',reportHtml);
const protection=await read(out+'/protected-assets.json');for(const f of protection)if(sha(await readFile(f.path))!==f.sha256)throw new Error('Non-target resource changed: '+f.path);
const validation={checkedOn:'2026-11-02',status:'generated-awaiting-independent-source-and-browser-review',id,revision:record.revision,protectedAssetCount:protection.length,protectedAssetsUnchanged:true,sourceHashVerified:sha(await readFile(root+'/'+record.source.path))===record.source.sha256&&sha(await readFile('public'+record.source.projectSource))===record.source.sha256,currentSvgHashes:record.rendered,formalPublication:false,engineeringApproval:false};
if(!validation.sourceHashVerified)throw new Error('Archived source differs from current project source');
for(const [key,file] of [['independentSourceReview','source-match-review.json'],['vectorReview','vector-check.json'],['browserReview','browser-review.json']])try{validation[key]=await read(out+'/checks/'+file);}catch{}
try{validation.sourceCavityComparison=await read(out+'/checks/source-cavity-comparison.json');if(validation.sourceCavityComparison.svgSha256!==record.rendered.textbook.sha256||!validation.sourceCavityComparison.passed)throw new Error('Source cavity comparison stale');}catch(e){if(e.code!=='ENOENT')throw e;}
try{validation.shoulderInterface=await read(out+'/checks/shoulder-interface.json');if(validation.shoulderInterface.sha256!==record.rendered.textbook.sha256||!validation.shoulderInterface.passed)throw new Error('Shoulder interface check stale');}catch(e){if(e.code!=='ENOENT')throw e;}
if(validation.independentSourceReview&&validation.vectorReview&&validation.browserReview){
 const review=validation.independentSourceReview;
 const bindings=review.inputHashes??Object.fromEntries(Object.values(review.inputs).map(f=>[f.path,f.sha256]));
 const mismatches=[];
 for(const [path,digest]of Object.entries(bindings))if(sha(await readFile(path))!==digest)mismatches.push(path);
 for(const mode of ['textbook','node']){
  if(validation.browserReview.svgHashes[mode]!==record.rendered[mode].sha256)mismatches.push(mode+' browser binding');
  if(!validation.vectorReview.checks.some(c=>c.sha256===record.rendered[mode].sha256))mismatches.push(mode+' vector binding');
 }
 const layouts=validation.browserReview.layout,readers=validation.browserReview.embeddedReaders,issues=review.openRedrawIssues??review.issues??[];
 if(mismatches.length||!validation.vectorReview.passed||layouts.length!==2||layouts.some(r=>r.outside.length||r.overlaps.length||r.lineHits.length)||readers.readers.some(r=>!r.loaded||r.scrollWidth>r.clientWidth)||readers.documentWidth>readers.width||issues.length)throw new Error('Current correction evidence stale or failed: '+mismatches.join(','));
 validation.sourceReviewBindingsChecked=Object.keys(bindings).length;
 validation.status='passed-with-recorded-source-uncertainties-awaiting-human-acceptance';
}
await writeFile(out+'/validation.json',JSON.stringify(validation,null,2)+'\n');
await writeFile(root+'/validation.json',JSON.stringify({checkedOn:'2026-11-02',status:'partial-revalidation-after-source-mismatch',corrections:[{id:'water-storage-parapet-drainage-01',report:'correction-parapet-2026-11-01/index.html',validation:'correction-parapet-2026-11-01/validation.json'},{id,report:local+'/index.html',validation:local+'/validation.json'}],note:'第10/11张旧r1原图匹配结论撤回；其余7张未作本轮原图重新验收。历史记录保留，不能用模型关系或结构检查代替来源保真。'},null,2)+'\n');
const oldAudit='audit-output/roof-batch-two-model-audit-2026-11-01/index.html';try{let html=await readFile(oldAudit,'utf8');if(!html.includes('data-eaves-source-correction-notice')){html=html.replace('<main>',`<main><p class="focus" data-eaves-source-correction-notice>2026-11-02更新：第11张檐沟蓄水排水图r1原图匹配结论已撤回，修订见<a href="../roof-source-redraw-batch-02-2026-11-01/${local}/index.html">原图对照</a>。旧截图和SVG摘要不证明当前修订稿。</p>`);await writeFile(oldAudit,html);}}catch{}
console.log(JSON.stringify({id,hashes:record.rendered,protected:protection.length,status:validation.status,report:out+'/index.html'}));
