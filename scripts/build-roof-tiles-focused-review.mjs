import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const out='audit-output/roof-tiles-focused-review-2026-11-02',batch='audit-output/roof-source-redraw-batch-02-2026-11-01';
const json=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
await mkdir(out,{recursive:true});
const rows=[
 {order:12,id:'steel-batten-tile-roof-01',title:'钢挂瓦条块瓦屋面',file:'12-steel-review.json',status:'需修正构造几何',
  issues:['原图局部可见4段瓦和4处短支承；现稿简化为3组，旧依据也误将“三段”写成来源事实。','原图L形短底肢朝下坡侧，现稿朝上坡侧；瓦端与角钢的相对关系随之改变。','搭接附近瓦尾、角钢上缘的回转暗线尚未逐条分清，统一瓦模板不足以证明全部细节保真。'],
  keep:'下部层序、基本搭接上下关系，以及L30×4、−25×5/600、C15/35、φ6@500×500、15找平层与防水原注基本对应。',
  action:'先恢复原图局部4组的可见范围，再逐组追踪瓦底—角钢立肢—短底肢—顺水条；不补未经原图证实的钉、焊缝或锚栓。',
  pairs:[['12-source-first-support.png','原图 · 短底肢朝下坡侧'],['12-current-angle-detail.png','现稿 · 短底肢朝上坡侧']],
  extra:'12-source-two-laps.png',extraCaption:'原图多处搭接与支承局部；末端回转仍需区分瓦与角钢。'},
 {order:13,id:'mortar-bed-tile-roof-01',title:'砂浆卧瓦块瓦屋面',file:'13-mortar-review.json',status:'需重判承托与材料边界',
  issues:['原图可见瓦下长条无纹理带、下方连续薄带和搭接附近短竖段；现稿将其整体赋予砂浆填充，改成逐片满贴瓦底的连续锯齿实体。','白色区域本身不能证明空气腔，也不能证明应全部填砂浆；目前的材料归属与接触关系缺少直接依据。','原注“最薄处20”不能据此画成任意均厚层，更不能由“卧瓦”名称反推每处瓦底都与砂浆满贴。'],
  keep:'完整原图可补核最薄处20；15找平层、φ6@500×500、卷材3与括注涂膜≥2等文字保留一致，未混入35厚C15或条材。',
  action:'先追踪原图连续薄带、瓦底和短竖段；未确认区域保持身份未定。待局部承托身份清楚后再重建共界，不以白色或名称代替材料证据。',
  pairs:[['13-source-support-local.png','原图 · 无纹理带与局部短竖段'],['13-current-support-local.png','现稿 · 被整体填成连续砂浆']],
  extra:'13-complete-source-crop.png',extraCaption:'完整图6-47(a)：最薄处20及配网原注，不从被裁断的单图猜数。'},
 {order:14,id:'wood-batten-tile-roof-01',title:'木挂瓦条块瓦屋面',file:'14-wood-review.json',status:'需恢复可见范围并核短条截面',
  issues:['原图有T1～T4四段可见瓦身及B1～B4四处木条剖切位置，含端部截取；现稿只有3组。这里核对的是原图局部范围，不是工程根数。','现稿木挂瓦条顶面按瓦底公式削斜约4°；低清原图短上边与瓦鼻、粗墨相连，尚不足以确认这种削斜。','新增的三处钢筋截点是重绘识读表达；原图配网文字能确认，但不能把三个点当成原图实际根数。'],
  keep:'当前瓦身实际等厚，基本搭接方向与鼻端接触可成立；30×25、35×25h/500、C15/35、15找平层及防水括注对应原图。',
  action:'恢复原图4处可见位置与端部截取；单独重判木条上边和瓦鼻的分界，不为计算贴合而擅自削条，也不把木条判成三角楔。',
  pairs:[['14-source-tile-batten-detail.png','原图 · 木条与瓦鼻局部'],['14-draft-tile-batten-detail.png','现稿 · 按瓦底生成的斜切顶面']],
  extra:'14-source-visible-pieces-numbered.png',extraCaption:'T1～T4、B1～B4仅为本原图可见位置编号，包含末端局部，不代表完整瓦长或工程设计数量。'},
];
const bindingFiles=new Map();
for(const r of rows){
 r.review=await json(out+'/'+r.file);
 const entries=Array.isArray(r.review.inputs)?r.review.inputs:Object.entries(r.review.inputs).map(([path,value])=>({path,...value}));
 for(const input of entries){assert.equal(sha(await readFile(input.path)),input.sha256,'Stale focused review input: '+input.path);bindingFiles.set(input.path,input.sha256);}
}
const layout=await json(out+'/browser-layout.json');
for(const entry of layout.results){entry.sha256=sha(await readFile(batch+'/'+entry.mode+'/'+entry.id+'.svg'));assert(!entry.outside.length&&!entry.overlaps.length&&!entry.lineHits.length);}
await writeFile(out+'/browser-layout.json',JSON.stringify(layout,null,2)+'\n');
const refs=[
 {standard:'GB 50345—2012 屋面工程技术规范',url:'https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=60869',status:'出版方检索仍列现行；本轮读取归档政府公开副本的实际页图。',clauses:'4.8.2、4.8.7、4.8.10～4.8.12',pages:'印刷页20～21 / 归档PDF第29～30页',
  scope:'按瓦种、基层及固定关系核对；对烧结瓦、混凝土瓦须核对干法挂瓦及可靠固定要求。13号只可保留原图历史实例身份，不作现代通用做法推荐。',files:['GB50345-pdf-29.png','GB50345-pdf-30.png','GB50345-jinan.pdf']},
 {standard:'GB 55030—2022 建筑与市政工程防水通用规范',url:'https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=154718',announcement:'https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2024/art_17339_768499.html',status:'出版方检索仍列现行；住建部公告检索可核，正文直连本轮超时。条款取自既有官方PDF归档页图，本轮已实看。',clauses:'4.4.1及表4.4.1-2、4.4.7',pages:'印刷页15～17 / 归档PDF第19～21页',
  scope:'防水做法随等级与系统确定，另需核对抗风揭、抗滑落固定；原图卷材3或括注涂膜≥2不自动证明任何工程的完整设防。',files:['GB55030-pdf-19.png','GB55030-pdf-20.png','GB55030-pdf-21.png','GB55030-2022-official.pdf']},
 {standard:'GB 50693—2011 坡屋面工程技术规范',url:'https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=60350',status:'本轮仅核出版方现行目录及章节，不把目录当作已逐条读取。',clauses:'4.11、7章仅作后续定位',pages:null,scope:'本次没有据此补造瓦钩、固定件、条材截面或工程参数。',files:[]},
];
for(const ref of refs){ref.checkedOn='2026-11-02';ref.archivedInputs=[];for(const name of ref.files){const path=batch+'/standards/'+name;ref.archivedInputs.push({path,sha256:sha(await readFile(path))});}}
await writeFile(out+'/standards-review.json',JSON.stringify(refs,null,2)+'\n');
const protectedAssets=await json(out+'/protected-assets.json');
for(const f of protectedAssets)assert.equal(sha(await readFile(f.path)),f.sha256,'Audit must preserve live/draft/source resources: '+f.path);
const oldModel=await json('audit-output/roof-batch-two-model-audit-2026-11-01/tiles-review.json');
const modelBindings=[];
for(const n of oldModel.nodes){for(const [path,hash]of Object.entries(n.inputHashes)){if(path.endsWith('.glb'))modelBindings.push({id:n.id,path,sha256:sha(await readFile(path)),matchesPrior:sha(await readFile(path))===hash});}}
const summary={checkedOn:'2026-11-02',scope:rows.map(r=>r.order),status:'changes-required-before-adoption',auditOnly:true,drawingsModified:false,formalAssetsModified:false,modelsModified:false,protectedAssetsUnchanged:protectedAssets.length,currentInputBindings:Object.fromEntries(bindingFiles),priorModelGeometryBindings:modelBindings,
 findings:rows.map(({order,id,title,status,issues,keep,action,file})=>({order,id,title,status,issues,keep,action,report:file})),layout,standards:refs,
 rootCause:'三种方案共用概括模板，将固定三段、公式贴合和材料填充当成原图事实；几何不互穿、双版一致与文字检查通过没有覆盖原图可见范围、角钢朝向和砂浆身份。',
 limits:['原图无纹理区不直接定性为空气或砂浆。','局部可见数量不等于工程数量；分析归平角度不等于实际坡度。','旧模型几何分析仅在GLB摘要一致范围引用，本轮未重新解码或修改模型。','本轮完成审核，不等于重绘修正或工程设计审定。']};
await writeFile(out+'/summary.json',JSON.stringify(summary,null,2)+'\n');
const css=`*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f7f8fa;color:#202b48;font:16px/1.8 system-ui,sans-serif}header,main{max-width:1500px;margin:auto;padding:28px}h1{font-size:32px;line-height:1.35}h2{font-size:25px}h3{font-size:18px}a{color:#455b99;text-underline-offset:4px}nav{display:flex;gap:22px;flex-wrap:wrap}.notice{padding:18px 22px;border-left:4px solid #e94b35;background:#edf0f7}.panel{background:white;border:1px solid #d6deeb;padding:24px;margin:26px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:22px}.pair>div{min-width:0}img{display:block;width:100%;height:auto;border:1px solid #e3e7ef;background:white}.full-pair img{max-height:660px;object-fit:contain}.detail-image{max-height:650px;object-fit:contain}.muted{font-size:14px;color:#69768b}.status{display:inline-block;border-radius:4px;background:#fff0e9;color:#9c3a29;padding:2px 12px}.pass{color:#28654d;background:#edf6f1}.uncertain{background:#fff7e3;color:#74581c}table{width:100%;border-collapse:collapse}th,td{padding:13px;text-align:left;vertical-align:top;border-bottom:1px solid #dce2eb}th{color:#455b99}summary{cursor:pointer;color:#455b99;padding:9px 0}li{margin:8px 0}.stats{display:flex;gap:18px;flex-wrap:wrap}.stats span{padding:10px 20px;background:white;border:1px solid #d6deeb}.readers{display:flex;gap:18px;overflow:auto}.reader{flex:none;width:318px;height:620px;overflow:auto;background:white;border:1px solid #d6deeb}.reader img{border:0}.technical{font-size:14px}@media(max-width:800px){header,main{padding:16px}.pair{grid-template-columns:1fr}.panel{padding:16px}table{font-size:14px}h1{font-size:26px}}`;
function checklist(report){return'<table class="technical"><thead><tr><th>核对项</th><th>结果</th><th>原图与现稿依据</th></tr></thead><tbody>'+report.checks.map(c=>`<tr><td>${esc(c.key??c.id)}</td><td><span class="status ${c.status==='pass'?'pass':c.status==='fail'?'':'uncertain'}">${esc(c.status)}</span></td><td>${esc(c.sourceEvidence??c.sourceObservation??c.observation??'')}<p>${esc(c.actualDrawingEvidence??c.draftObservation??'')}</p><p>${esc(c.problem??c.whyItMatters??c.limit??c.limits??'')}</p></td></tr>`).join('')+'</tbody></table>';}
function section(r){return`<section class="panel" id="review-${r.order}"><h2>${r.order} · ${esc(r.title)}</h2><p><span class="status">${esc(r.status)}</span></p><ul>${r.issues.map(i=>`<li>${esc(i)}</li>`).join('')}</ul><p><strong>已核对保留：</strong>${esc(r.keep)}</p><p><strong>修正顺序：</strong>${esc(r.action)}</p><div class="pair">${r.pairs.map(([file,label])=>`<div><h3>${esc(label)}</h3><a href="${file}"><img loading="lazy" src="${file}" alt="${esc(label)}"></a></div>`).join('')}</div><p class="muted">局部分析图有裁切、放大或坡向归平，仅辅助识读；两栏不用于比较工程尺寸或推算坡度。</p><details><summary>更多原图定位</summary><img class="detail-image" loading="lazy" src="${r.extra}" alt="${esc(r.extraCaption)}"><p>${esc(r.extraCaption)}</p></details><details><summary>原图与当前教材版全图</summary><div class="pair full-pair"><div><h3>原始单图</h3><img loading="lazy" src="../roof-source-redraw-batch-02-2026-11-01/source/${r.id}.png" alt="${r.order}原图"></div><div><h3>现稿 · 未修改</h3><img loading="lazy" src="../roof-source-redraw-batch-02-2026-11-01/textbook/${r.id}.svg" alt="${r.order}现稿"></div></div></details><details><summary>逐项检查与证据边界</summary>${checklist(r.review)}<a href="${r.file}">完整独立核对JSON</a></details><details><summary>318px节点图纸栏阅读</summary><div class="readers"><div class="reader"><img loading="lazy" src="../roof-source-redraw-batch-02-2026-11-01/node/${r.id}.svg" alt="${r.order}节点窄栏"></div></div><p class="muted">嵌入栏阅读检查，未作手机真机测试。</p></details><nav><a href="../roof-source-redraw-batch-02-2026-11-01/view/${r.id}.html">既有原图对照</a><a href="../roof-source-redraw-batch-02-2026-11-01/textbook/${r.id}.svg">教材SVG</a><a href="../roof-source-redraw-batch-02-2026-11-01/node/${r.id}.svg">节点SVG</a></nav></section>`;}
const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>12～14 · 块瓦屋面原图重点审核</title><style>${css}</style><header><nav><a href="../roof-source-redraw-batch-02-2026-11-01/index.html">← 第二组图纸</a>${rows.map(r=>`<a href="#review-${r.order}">${r.order} · ${esc(r.title)}</a>`).join('')}<a href="summary.json">审核证据</a></nav><h1>12～14 · 块瓦屋面原图重点审核</h1><p class="notice">三张均需进一步修正后再接入。原图参数和下部层序大体保留，但可见范围、角钢朝向、瓦下材料与承托关系仍有问题。本轮只审核，未改动既有图稿、正式教材、模型与已接入的10、11。</p><div class="stats"><span>3 张独立原图对照</span><span>6 份当前版式检查</span><span>${protectedAssets.length} 个资源摘要保护</span></div></header><main><section class="panel"><h2>先看结论</h2><table><thead><tr><th>图号</th><th>重点问题</th><th>本轮结果</th></tr></thead><tbody>${rows.map(r=>`<tr><td><a href="#review-${r.order}">${r.order} · ${esc(r.title)}</a></td><td>${esc(r.issues[0])}</td><td>${esc(r.status)}</td></tr>`).join('')}</tbody></table></section>${rows.map(section).join('')}<section class="panel" id="shared"><h2>三张共同需要纠正的审核方法</h2><p>${esc(summary.rootCause)}</p><ol><li>先按完整图6-47标明每段瓦、每处短条、连续层和截取边，再分别建立三种方案，不能固定用同一三段模板。</li><li>分别核对图面事实与材料身份。白色区不等于空气，文字“砂浆”也不证明所有瓦底均满贴。</li><li>先确定条材截面与端部归属，再处理接触；不为公式相接而削木条、改角钢朝向或填平原图未定区域。</li><li>构造修正后再复查标注。当前六份SVG未检出文字互叠、文字出界或编号引线穿字，仍不能视为构造验收通过。</li></ol><details><summary>绘图问题与模型问题分别记录</summary><p>12号GLB摘要与旧实际几何审计相同，可在相同输入范围引用其“挂瓦条实为薄矩形”和知识卡层序差异。图纸应按原图核对，不能改成平钢条以迁就模型。</p><p>13号原图瓦下区域尚未定性，不能仅凭模型中的空隙断言工程上支承缺失；应先完成图纸身份判读。本轮未重新建模或改变相机、旋转与爆炸行为。</p><a href="../roof-batch-two-model-audit-2026-11-01/tiles-review.json">旧实际模型审计 · 保留历史范围</a></details></section><section class="panel" id="standards"><h2>规范与原图实例的适用边界</h2>${refs.map(r=>`<h3><a href="${esc(r.url)}">${esc(r.standard)}</a></h3><p>${esc(r.status)}</p><p>${esc(r.clauses)}${r.pages?' · '+esc(r.pages):''}</p><p>${esc(r.scope)}</p><nav>${r.files.filter(f=>f.endsWith('.png')).map(f=>`<a href="../roof-source-redraw-batch-02-2026-11-01/standards/${f}">已读页图 ${esc(f)}</a>`).join('')}</nav>`).join('')}<p class="muted">本轮未从标准反推原图未画的连接件、实际厚度、瓦品种和工程根数；未取得更清楚的暗线分界时保留未定，不据此宣称现行合规。</p><a href="standards-review.json">条款、页码、来源与输入摘要</a></section><section class="panel"><h2>来源与验证</h2><nav><a href="../roof-source-redraw-batch-02-2026-11-01/source/block-tile-complete.png">完整图6-47(a/b/c)</a><a href="summary.json">本轮摘要</a><a href="browser-layout.json">六版文字/引线检查</a><a href="protected-assets.json">资源保护记录</a></nav><p class="muted">核对日期：2026-11-02。历史原图、审计、已有SVG、GLB及正式资源均保留。本页的局部图仅作分析对照。</p></section></main></html>`;
await writeFile(out+'/index.html',html.replace('</style>','header{padding-bottom:8px}header h1{margin:16px 0}main{padding-top:0}.notice{margin:14px 0}.panel{margin:20px 0;padding:20px}td,th{padding:10px}#review-12,#review-13,#review-14{scroll-margin-top:14px}</style>'));
// Add audit entry points only; no draft vectors or live node/media indexes change.
await mkdir(out+'/before-gallery-notices',{recursive:true});
const galleryPath=batch+'/index.html';
try{await readFile(out+'/before-gallery-notices/index.html');}catch(e){if(e.code!=='ENOENT')throw e;await copyFile(galleryPath,out+'/before-gallery-notices/index.html');}
let gallery=await readFile(galleryPath,'utf8');
for(const r of rows){const at=gallery.indexOf('id="'+r.id+'"'),end=gallery.indexOf('</article>',at);assert(at>=0&&end>at);let tile=gallery.slice(at,end);if(!tile.includes('data-tiles-focused-review'))tile=tile.replace(`<span class="num">${r.order}</span>`,`<span class="num">${r.order}</span> <small data-tiles-focused-review style="color:#a34431">重点审核 · 需修正</small>`).replace('</nav>',`<a href="../roof-tiles-focused-review-2026-11-02/index.html#review-${r.order}">本轮审核 →</a></nav>`);gallery=gallery.slice(0,at)+tile+gallery.slice(end);}
await writeFile(galleryPath,gallery);
for(const r of rows){
 const path=batch+'/view/'+r.id+'.html',backup=out+'/before-gallery-notices/'+r.id+'.html';
 try{await readFile(backup);}catch(e){if(e.code!=='ENOENT')throw e;await copyFile(path,backup);}
 let page=await readFile(path,'utf8');
 if(!page.includes('data-tiles-focused-review'))page=page.replace('</h1>',`</h1><p class="warning" data-tiles-focused-review>2026-11-02重点审核：${esc(r.status)}。旧构造核对记录中与本轮发现冲突的来源判断不再作为通过依据。<a href="../../roof-tiles-focused-review-2026-11-02/index.html#review-${r.order}">查看原图局部对照与问题清单 →</a></p>`);
 await writeFile(path,page);
}
for(const f of protectedAssets)assert.equal(sha(await readFile(f.path)),f.sha256);
await writeFile(out+'/validation.json',JSON.stringify({checkedOn:'2026-11-02',reportGenerated:true,independentInputBindingsChecked:bindingFiles.size,protectedFilesVerified:protectedAssets.length,protectedFilesUnchanged:true,diagramReplacement:false,formalPublication:false,geometryApproval:false},null,2)+'\n');
console.log(`Focused review generated: 12/13/14; ${bindingFiles.size} input bindings and ${protectedAssets.length} preserved resources; six layout checks passed, geometry adoption remains pending.`);
