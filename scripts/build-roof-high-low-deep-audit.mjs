// Audit only: no source SVG, model, curriculum or production node content is changed.
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const batch='audit-output/roof-source-redraw-batch-01-2026-10-30';
const out='audit-output/roof-high-low-deep-audit-2026-11-01';
const temporary='tmp/roof-deep-audit-2026-11-01';
const id='coating-high-low-roof-flashing-01';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const sha=s=>createHash('sha256').update(s).digest('hex');
await mkdir(out+'/inputs',{recursive:true});
await mkdir(out+'/evidence',{recursive:true});
const currentRecord=JSON.parse(await readFile(batch+'/evidence.json','utf8')).find(r=>r.id===id);
const measurement=JSON.parse(await readFile(temporary+'/independent-angle-measurements.json','utf8'));
const contours=JSON.parse(await readFile(batch+'/correction-2026-11-01/contour-evidence.json','utf8')).sources.find(s=>s.id===id);
const sources=[
 ['public/images/roof/coating-high-low-roof-flashing-diagram.png','source.png'],
 [batch+'/textbook/'+id+'.svg','textbook-r2.svg'],[batch+'/node/'+id+'.svg','node-r2.svg'],
 [batch+'/previews/textbook-'+id+'.png','textbook-r2.png'],[batch+'/previews/node-'+id+'.png','node-r2.png'],
 [batch+'/correction-2026-11-01/'+id+'-contours.svg','contours-r2.svg']
];
const inputs=[];
for(const [source,name] of sources){const bytes=await readFile(source);await writeFile(out+'/inputs/'+name,bytes);inputs.push({source,archive:'inputs/'+name,sha256:sha(bytes)});}
for(const name of ['independent-angle-measurements.json','independent-high-low-deep-review.md','standards-high-low-technical-conclusions.md','content-crosscheck.md','standards-source05-dimension-crop.png','standards-source05-wall-crop.png','standards-GB50345-high-low-crop.png'])await copyFile(temporary+'/'+name,out+'/evidence/'+name);
await writeFile(out+'/evidence/r2-record.json',JSON.stringify(currentRecord,null,2)+'\n');
const sourceMetrics=measurement.measurements[0].measurements,currentMetrics=measurement.measurements[1].measurements;
const names={'wall-left':'高墙左边','wall-right-lower':'高墙右侧下段','plaster-outer-upper':'抹灰外边','low-upstand-left':'矮墙左边','low-upstand-right':'矮墙右边','slab-top':'结构板上边','slab-bottom':'结构板下边','roof-waterproof-upper':'屋面上部可见薄层线','metal-cover-upper':'钢板跨盖斜边'};
const selected=Object.keys(names);
const metricRows=selected.map(key=>{const a=sourceMetrics.find(m=>m.edge===key),b=currentMetrics.find(m=>m.edge===key);return {edge:key,name:names[key],axis:b.axis,sourceDegrees:a.angleFromAxisDeg,r2Degrees:b.angleFromAxisDeg,sourceEndpoints:a.sourceEndpoints,r2Endpoints:b.sourceEndpoints,uncertainty:'约0.2～0.6°局部拟合不确定性；长结构边更稳定。',classification:key==='metal-cover-upper'?'保留有意斜边；不能按本角度定工程坡值':key==='roof-waterproof-upper'?'不从扫描角度推断工程排水坡度':'主体剖面基准应重新约束'};});
const line=(points,color,width=1.2,dash='')=>`<path d="M${points[0].join(' ')}L${points[1].join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
const overlay=metrics=>['wall-left','wall-right-lower','slab-top','slab-bottom'].map(k=>{
 const m=metrics.find(m=>m.edge===k),p=m.sourceEndpoints;
 const mid=[(p[0][0]+p[1][0])/2,(p[0][1]+p[1][1])/2];
 const orthogonal=m.axis==='vertical'?[[mid[0],p[0][1]],[mid[0],p[1][1]]]:[[p[0][0],mid[1]],[p[1][0],mid[1]]];
 return line(p,'#df4435',1)+line(orthogonal,'#18838e',.7,'3 2');
}).join('');
const originalData=(await readFile(out+'/inputs/source.png')).toString('base64');
const wallDrift=Math.abs(currentMetrics.find(m=>m.edge==='wall-left').previewEndpoints.textbook[1][0]-currentMetrics.find(m=>m.edge==='wall-left').previewEndpoints.textbook[0][0]);
const axes=`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="810" viewBox="0 0 1500 810"><title>05高低屋面泛水：主体方向审计</title><rect width="1500" height="810" fill="white"/><style>text{font-family:'Microsoft YaHei','Noto Sans CJK SC',sans-serif;fill:#22304a}</style><text x="35" y="44" font-size="29" font-weight="700">主体倾斜检测 · 审计叠加图</text><text x="35" y="81" font-size="20">红线：原图／当前矢量暗线拟合　　青虚线：以中点对齐的正交参考　　不从像素换算工程尺寸</text><text x="65" y="131" font-size="25">原图 · 扫描坐标</text><text x="815" y="131" font-size="25">当前r2 · 同源坐标的矢量轮廓</text><defs><clipPath id="drawing-crop"><rect x="0" y="0" width="369" height="312"/></clipPath></defs><g transform="translate(0 155) scale(1.85)" clip-path="url(#drawing-crop)"><image href="data:image/png;base64,${originalData}" width="369" height="408"/>${overlay(sourceMetrics)}</g><g transform="translate(750 155) scale(1.85)">${contours.path}${overlay(currentMetrics)}</g><text x="35" y="756" font-size="22">长墙边约0.9°、结构板边约1.0～1.1°；当前教材图墙边横漂约${wallDrift.toFixed(1)}px。</text><text x="35" y="792" font-size="19">判断：源图倾斜被保留并放大。整体转正只是第一步，还需重建构造直线、层界与标注。</text></svg>`;
await writeFile(out+'/axis-audit.svg',axes);
await sharp(Buffer.from(axes)).png().toFile(out+'/axis-audit.png');
// These are explicitly labelled evidence crops, not deliverable construction drawings.
for(const [name,box] of [['callout-and-cap',{left:245,top:425,width:285,height:245}],['height-datum',{left:380,top:555,width:410,height:235}],['slab-skew',{left:320,top:715,width:380,height:130}]]){
 const native=await sharp(out+'/inputs/textbook-r2.png').extract(box).png().toBuffer();
 await sharp(native).resize({width:1140,kernel:'lanczos3'}).png().toFile(out+'/'+name+'.png');
}
const findings=[
 {id:'F01',priority:'P1',title:'主体偏斜被完整矢量化',confidence:'高：多条跨构件长边共同支持',evidence:'长墙边约0.9°、结构板边约1.0～1.1°；教材版墙边横漂约10.5px、板边落差约5.4～6.0px。',cause:'构造轮廓与扫描墨迹一并描摹，未先建立结构正交基准。',action:'先校正源图共同倾斜，再以平行/垂直约束重建高墙、矮墙和结构板直边；不能把钢板真实斜边、卷材U折一同拉平。'},
 {id:'F02',priority:'P1',title:'03“压条”引线悬空，04/05产生假凸起',confidence:'高：当前SVG和局部成图可直接定位',evidence:'03新引线起于原坐标(141,115)，旧引线止于约(141.6,111～112)，教材版相差约8～10px；不是直接连接到压条。钢板和卷材旧竖引线被保留成粗黑梗，与新灰引线形成假尖角。',cause:'旧引线与构造进入同一复合填充路径，再叠加新引线。文字相交检测不能检出“指错对象”。',action:'剥离旧引线，从真实构件重新引出细线；构造、材料图例、连接件、引线、尺寸各自分层。'},
 {id:'F03',priority:'P1',title:'≥250的材料测点未被真正核定',confidence:'高度所属层级明确，精确界面仍待核定',evidence:'当前端点为(278,220)及(176,160)，却只被定义为“附近界线”；下端低于可见卷材上表面约y211～213。原图尺寸界线与构造离开，低清图不能唯一确定其材料界面。',cause:'把扫描投影近似吻合当成完成面起算已经准确验证。',action:'原图标注与技术解释分开：保留≥250实例身份，重建时明确低屋面表面与有效泛水上界；不能将结构板顶、砂浆面、卷材完成面混称。'},
 {id:'F04',priority:'P1',title:'节点讲解把钢板固定与槽内收头合为一处',confidence:'高：原图与当前文字相互矛盾',evidence:'nodeDefinitions.ts:350及coatingHighLowRoofFlashingLayers.ts:47、53仍称钢板端勾入墙槽并由槽内油膏封住；原图上部水泥钉—竖边—盖板连续，槽内压条/卷材/油膏是另一组关系。',cause:'模型/旧说明未经接口复核直接用于讲解。',action:'图纸重建时同步分开两处固定与收头关系；先按原图核定，再核对模型实际几何，不能反过来用对象名证明原图。'},
 {id:'F05',priority:'P2',title:'材料身份、薄层线宽和未知细线需要重审',confidence:'材料来源混用明确；局部细线性质不确定',evidence:'矮墙的斜线区被文字说成由图例证实的混凝土，带骨料区又被说成砂浆；槽口和矮墙顶薄层已变成密集黑带。约(148,178)→(193,178)横线性质仍不清。',cause:'原图图例、模型命名、扫描粗墨与实际材料关系混用。',action:'材料名称分别注明图纸来源和模型来源；按真实层界重新控制线宽。未知横线先列待定，不删除、不擅称钢筋或支撑。'}
];
const manifest={checkedOn:'2026-11-01',id,revisionReviewed:'roof-batch1-r2-2026-11-01',status:'rejected-needs-geometric-reconstruction',scope:'05高低屋面泛水的教材版、节点版、原图和关联节点文字深度审核；用户重复图名按同一对象处理。',inputs,measurement:measurement.method,metrics:metricRows,findings,previousReview:{path:batch+'/correction-2026-11-01/independent-review.md',decision:'撤回该记录对05“未发现阻断项”的结论；保留历史记录。SVG结构、文字边界等检查仅在原有技术范围内有效，不证明几何或引出对象正确。'},unchanged:'未覆盖图纸SVG、GLB、课程正文、节点生产说明或正式资源；01、02、03、09保持已批准版本。',requiredSequence:['源图共同倾斜校正与可靠基准确认','主体轮廓按对象及正交关系重建','保留钢板真实斜边、卷材U折和材料分界','重新核定尺寸对象并剥离旧引线','关联说明/模型接口交叉核对','双版几何、指向、净空和真实图纸栏复验'],limits:['源图为低分辨率截图，角度仅诊断，不是工程坡度或加工角度。','当前不能断定拍摄透视或镜头畸变，不实施未经证据支持的透视拉伸。','≥250的精确材料界面与矮墙中部细横线仍有歧义，不凭像素补造施工参数。']};
await writeFile(out+'/audit.json',JSON.stringify(manifest,null,2)+'\n');
const styles=`*{box-sizing:border-box}body{margin:0;background:#f7f8fb;color:#202d46;font:16px/1.8 system-ui}header,main{max-width:1500px;margin:auto;padding:28px}header{border-bottom:1px solid #d7dfeb}h1{font-size:34px;margin:8px 0}h2{font-size:25px}h3{font-size:20px}a{color:#465b96}.verdict{border-left:5px solid #e34733;padding:15px 22px;background:white}.panel{padding:22px;border:1px solid #d7dfeb;background:white;margin:24px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}.panel img,.full{display:block;width:100%;height:auto}.tag{color:#c03b2b;font-weight:700}.muted,small{color:#61708a}nav{display:flex;gap:22px;flex-wrap:wrap}table{border-collapse:collapse;width:100%}th,td{border:1px solid #d7dfeb;padding:10px;text-align:left;vertical-align:top}section{scroll-margin-top:20px;margin-bottom:36px}li{margin-bottom:7px}code{font-size:14px;overflow-wrap:anywhere}details{border-top:1px solid #d7dfeb;padding:15px 0}summary{cursor:pointer;color:#465b96}.status{display:inline-block;padding:3px 12px;background:#fff0ed;color:#b93727;border-radius:5px}.rules td:first-child{width:22%}@media(max-width:800px){header,main{padding:18px}h1{font-size:26px}.grid{display:block}.panel{padding:14px}table{font-size:13px}th,td{padding:6px}}`;
await writeFile(out+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>高低屋面泛水 · 几何与技术深审</title><style>${styles}</style><header><nav><a href="../roof-source-redraw-batch-01-2026-10-30/correction-2026-11-01/index.html#${id}">← 返回五图审阅页</a><a href="#findings">五项问题</a><a href="#direction">重建基准</a><a href="#evidence">证据与来源</a></nav><span class="tag">DEEP AUDIT · 05 / 2026-11-01</span><h1>高低屋面泛水：当前稿应退回重绘</h1><p class="verdict"><strong>用户指出的整体倾斜确实存在。</strong>原图约1°的共同偏斜被直接描入SVG；此外存在引线悬空、旧引线变成假凸起、尺寸界面未核定及节点说明冲突。撤回上一轮对05“未发现阻断项”的结论。</p><p class="muted">本轮交付深审结论和定位证据。未覆盖现有SVG、模型、教材正文或节点生产说明；原稿已保留，01、02、03、09的批准版本不变。</p></header><main><section><h2>一、倾斜从哪里来</h2><p>这张图用于局部正投影剖面识读。多个不同材料、不同位置的主体长边共同歪斜，当前矢量又保留相同角度，支持“源图偏斜被继承”的判断。SVG仅等比缩放，版式本身没有对构件施加倾斜变换。</p><img class="full" src="axis-audit.png" alt="原图和r2主体长边拟合与正交参考对照"><div class="panel"><table><thead><tr><th>检测对象</th><th>原图</th><th>当前r2</th><th>判断</th></tr></thead><tbody>${metricRows.map(m=>`<tr><td>${esc(m.name)}</td><td>${m.sourceDegrees.toFixed(2)}°</td><td>${m.r2Degrees.toFixed(2)}°</td><td>${esc(m.classification)}</td></tr>`).join('')}</tbody></table><p class="muted">竖边负值表示向下左偏，横边正值表示向右下偏。拟合仅诊断图像方向；局部不确定性约0.2～0.6°，长边更稳定。上部墙右边受固定竖线、粗墨和交叉影响，不用于推断透视或畸变。角度不作为规范限值、工程坡值或制造尺寸。</p></div></section><section id="findings"><h2>二、深审发现</h2>${findings.map(f=>`<article class="panel" id="${f.id}"><span class="status">${f.priority} · ${esc(f.confidence)}</span><h3>${f.id} · ${esc(f.title)}</h3><p><strong>证据：</strong>${esc(f.evidence)}</p><p><strong>根因：</strong>${esc(f.cause)}</p><p><strong>修复要求：</strong>${esc(f.action)}</p></article>`).join('')}<div class="grid"><div class="panel"><h3>03引线、钢板凸起与薄层黑带</h3><img src="callout-and-cap.png" alt="r2压条引线及钢板局部放大"><p>新灰细线与旧黑线未可靠接续；旧引线和构造不能继续留在同一实心轮廓中。</p></div><div class="panel"><h3>≥250的下部测点</h3><img src="height-datum.png" alt="r2高度尺寸与屋面表面局部放大"><p>当前尺寸下界线接近结构/基层界面，不能直接命名为已核定的防水完成面。原图离体尺寸投影和技术解释应分开。</p></div></div></section><section id="direction"><h2>三、下一版应怎样重建</h2><div class="panel"><table class="rules"><thead><tr><th>分类</th><th>处理要求</th></tr></thead><tbody><tr><td>主体基准</td><td>以多条长结构边确定共同去倾斜方向；高墙、矮墙和抹灰控制边采用竖向平行约束，结构板上下直边采用水平约束，共享交点和材料界面。</td></tr><tr><td>有意斜边与曲线</td><td>保留钢板从墙面向外下降的斜段、跨盖折边、外侧回折及卷材U形余量；45°材料填充也不属于主体倾斜。不能把它们一键拉平。</td></tr><tr><td>屋面坡度</td><td>工程排水坡须有独立设计依据。本截图未给坡度数字、坡向符号或可靠比例，不能用约1°共同歪斜替代排水设计；结构板与找坡层分开识读。</td></tr><tr><td>尺寸</td><td>≥250先保留原图实例身份，明确有效泛水高度的上下对象。低清原图不能唯一支持精确材料测点时，保留歧义，不以“附近界线”宣告验收。</td></tr><tr><td>分层</td><td>分别建立物理轮廓、材料图例、卷材/钢板/钉固、尺寸与引线图层；旧引线不进入构造。薄层按界面重新描线并检查线宽，不能靠二值黑带代替。</td></tr><tr><td>关联讲解</td><td>同步核对两处固定/收头的描述及材料证据来源；模型对象名只说明模型内容，不能证明教材图中的材料或规范要求。</td></tr></tbody></table><ol>${manifest.requiredSequence.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><p>整图反向旋转只能处理共同倾斜，不能同时修复引线误指、材料层粘连、局部粗墨和尺寸语义。当前也没有足够证据认定存在拍摄透视，不做未经依据的透视拉伸。</p></div></section><section id="evidence"><h2>四、依据、检查边界与原件</h2><div class="panel"><p><a href="https://gf.cabr-fire.com/article-49282.htm">GB50345—2012 4.11.18及图4.11.18-2</a>支持高低跨缝的变形与密封关系；其示意图用于辅助条文识读。<a href="https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2022/art_17339_768499.html">GB55030—2022公告与官方原件</a>是当前防水通用要求依据；与旧标准冲突时执行通用规范。本轮重读纸页16～17、GB50345纸页36～37及说明。</p><p>12J201仅实际读取已取得的官方A12、B6和A2更正页。未取得A15～A16完整页，不称已验证该页；不同屋面系统不能相互移植。原图像素方向不等于规范规定的构件角度。</p><nav><a href="evidence/independent-high-low-deep-review.md">独立几何深审</a><a href="evidence/independent-angle-measurements.json">角度端点与方法</a><a href="evidence/standards-high-low-technical-conclusions.md">标准图页与测点分析</a><a href="evidence/content-crosscheck.md">节点图文冲突及代码行号</a><a href="audit.json">全部发现与输入摘要</a></nav><details><summary>尺寸与标准图原文阅读局部</summary><div class="grid"><div><h3>用户原图尺寸局部</h3><img src="evidence/standards-source05-dimension-crop.png" alt="原图高度标注局部"></div><div><h3>GB50345图4.11.18-2</h3><img src="evidence/standards-GB50345-high-low-crop.png" alt="规范高低跨变形缝示意局部"></div></div></details><details><summary>当前r2档案与身份</summary><nav>${inputs.map(i=>`<a href="${i.archive}">${esc(i.archive)}</a>`).join('')}</nav><p>教材版：<code>${currentRecord.rendered.textbook.sha256}</code><br>节点版：<code>${currentRecord.rendered.node.sha256}</code></p></details><p class="muted">SVG结构、双版相同、字框不相交均不能证明构造方向或引出对象正确。上轮这些检查保留各自的有限用途，05技术结论已由本页更新。</p></div></section></main></html>`);
// Visible status override: preserve old artifacts/checks but stop presenting 05 as accepted.
const reportUrl='../roof-high-low-deep-audit-2026-11-01/index.html';
const correctionRoot=batch+'/correction-2026-11-01';
let review=await readFile(correctionRoot+'/index.html','utf8');
review=review.replace(/<div id="high-low-deep-audit-notice">[\s\S]*?<\/div>/g,'');
review=review.replace(/<p id="high-low-deep-audit-inline"[^>]*>[\s\S]*?<\/p>/g,'');
review=review.replace('<main>',`<main><div id="high-low-deep-audit-notice" class="panel"><strong style="color:#b93727">05高低屋面泛水：深审退回，须重建几何和标注。</strong><p>当前所示r2保留供问题对照，上一轮对05“未发现阻断项”的结论已撤回。<a href="../../roof-high-low-deep-audit-2026-11-01/index.html">查看深审证据与修复要求 →</a></p></div>`);
review=review.replace(`<section id="${id}"><h2>05 · 涂膜防水屋面 · 高低屋面泛水</h2>`,`<section id="${id}"><h2>05 · 涂膜防水屋面 · 高低屋面泛水</h2><p id="high-low-deep-audit-inline" class="notice"><strong>本r2稿已退回：须重建主体基准、引线与尺寸对象。</strong> <a href="../../roof-high-low-deep-audit-2026-11-01/index.html">查看深审报告 →</a></p>`);
await writeFile(correctionRoot+'/index.html',review);
let gallery=await readFile(batch+'/index.html','utf8');
gallery=gallery.replace(/<p id="high-low-deep-audit-link">[\s\S]*?<\/p>/g,'');
gallery=gallery.replace('<main>',`<main><p id="high-low-deep-audit-link"><a href="${reportUrl}">05高低屋面泛水：当前稿已退回，查看深审报告 →</a></p>`);
await writeFile(batch+'/index.html',gallery);
let view=await readFile(batch+'/view/'+id+'.html','utf8');
view=view.replace(/<p id="high-low-deep-audit-view">[\s\S]*?<\/p>/g,'');
view=view.replace('<main>',`<main><p id="high-low-deep-audit-view" style="border-left:4px solid #d43b2c;padding:14px;background:#fff0ed"><strong>此r2稿已退回。</strong> 原图倾斜、引线指向和尺寸界面仍有问题。<a href="../../roof-high-low-deep-audit-2026-11-01/index.html">查看深审报告 →</a></p>`);
await writeFile(batch+'/view/'+id+'.html',view);
await writeFile(correctionRoot+'/technical-review-overrides.json',JSON.stringify({checkedOn:'2026-11-01',overrides:[{id,reviewedHashes:currentRecord.rendered,status:manifest.status,invalidatedConclusion:manifest.previousReview.decision,report:'../../roof-high-low-deep-audit-2026-11-01/index.html'}]},null,2)+'\n');
for(const file of [batch+'/validation-summary.json',correctionRoot+'/validation-summary.json']){
 const validation=JSON.parse(await readFile(file,'utf8'));
 validation.technicalReviewOverrides={id,status:manifest.status,report:file.startsWith(correctionRoot)?'../../roof-high-low-deep-audit-2026-11-01/index.html':'../roof-high-low-deep-audit-2026-11-01/index.html',scope:'05的来源保真与几何/引出对象技术结论已被深审撤回；原结构/净空筛查仍只代表其原有限范围。'};
 await writeFile(file,JSON.stringify(validation,null,2)+'\n');
}
const revisionManifest=JSON.parse(await readFile(correctionRoot+'/revision-manifest.json','utf8'));
revisionManifest.reviewPageSha256=sha(await readFile(correctionRoot+'/index.html'));
revisionManifest.technicalReviewOverride={id,status:manifest.status,report:'../../roof-high-low-deep-audit-2026-11-01/index.html'};
await writeFile(correctionRoot+'/revision-manifest.json',JSON.stringify(revisionManifest,null,2)+'\n');
console.log('Built high-low deep audit, archived current r2 inputs, and flagged 05 for geometric reconstruction. Construction SVGs and production resources unchanged.');
