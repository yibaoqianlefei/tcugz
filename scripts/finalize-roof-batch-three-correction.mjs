import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root='audit-output/roof-source-redraw-batch-03-2026-11-03';
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const records=read('evidence.json'), source=read('checks/correction-r2/source-review.json'),visual=read('checks/correction-r2/visual-review.json'),evidence=read('checks/correction-r2/evidence-review.json'),browser=read('checks/correction-r2/browser-text-bounds.json');
assert.equal(records.length,8);
assert.equal(browser.drawings.length,16);
assert.equal(source.summary.openConfirmedP1+source.summary.confirmedNewP1,0);
assert.equal(visual.findings.length,0);
for(const r of records){
 const s=source.drawings.find(d=>d.id===r.id),v=visual.drawings.find(d=>d.id===r.id),e=evidence.records.find(d=>d.id===r.id),structure=read('checks/'+r.id+'-structure.json');
 assert(structure.passed);
 for(const [i,mode] of ['textbook','node'].entries()){
  const hash=sha(path.join(root,r.assets[mode]));
  assert.equal(hash,r.rendered[mode].sha256);assert.equal(hash,s.hashes[mode+'Svg']);assert.equal(hash,v.svg[mode]);assert.equal(hash,e.hashes[mode]);assert.equal(hash,structure.checks[i].sha256);
  const b=browser.drawings.find(d=>d.id===r.id&&d.mode===mode);assert.equal(hash,b.sha256);assert.equal(b.overlaps.length+b.clipped.length,0);assert(b.useReferences.every(u=>u.resolved));
 }
 assert.equal(sha(r.model.path),r.model.sha256);assert.equal(sha(path.join(root,r.source.path)),r.source.sha256);
}
const external=read('checks/concurrent-index-changes.json');
for(const a of read('protected-assets.json'))assert.equal(sha(a.path),external.find(x=>x.path===a.path)?.current??a.sha256,'Protected asset changed '+a.path);
const changes={19:'中心线恢复点画线；节点版将轴测与格栅/侧剖面分行，共同比例；教材版图名重新留出净空。',20:'重建管根圆弧基层实体，取消误画的内部空腔及穿层内弧；保持管腔贯通，中心线恢复点画线。',21:'取消穿过盖缝斜肩的水平顶边，边界随盖缝抬升；补回原图左端可见钢筋剖切点。',22:'补回原图左端钢筋剖切点，按本图记录可见位置，不再共用三点模板。',23:'节点版保留两坡完整总览，增加与主图同源的中央缝口放大。',24:'节点版增加同源缝口放大；保留“单边坐灰固定”原注，不补造尚不明确的坐灰侧。',25:'附加卷材编号引线移到尺寸链内侧；缝宽文字用引线明确接到短尺寸线。',26:'防水层移至矮墙外，补回墙外圆弧基层并分开薄钢板路径；编号避开尺寸链，下端尺寸锚点与新共界对齐。'};
const limits=['20：网罩高度原符号下标仍不清楚，继续以“罩高”代称，不新增数值。','24：单边坐灰的具体侧与接触范围仍未确定，未补绘隐藏支承。','26：配筋原注保留；完整钢筋身份、布置与锚固仍不能由低清原图及GLB确认。'];
const validation={date:'2026-11-03',revision:'roof-batch3-r2-corrected-2026-11-03',status:'corrected-ready-for-user-review-with-disclosed-limits',drawingCount:8,nativeSvgCount:16,formalReplacement:false,review:{source:'checks/correction-r2/source-review.json',visual:'checks/correction-r2/visual-review.json',evidence:'checks/correction-r2/evidence-review.json',scope:'已关闭本轮已确认构造/表达问题，保留原图未定项；不等于工程设计审定'},checks:{geometryRegression:'checks/correction-r2/geometry-regression.json',exactMarkedGeometryPairs:'8 pairs passed',textBounds:'16 SVGs: no detected text overlap or clipping',browser:'checks/correction-r2/browser-text-bounds.json',narrowReading:'318/390px actual browser embeds visually reviewed; not mobile hardware test',protectedAssets:188,formalDrawingsAndModelsUnchanged:true},changes,limits,previous:'history/r1-before-correction/cross-review.html',current:'correction-r2.html',assets:records.map(r=>({id:r.id,source:r.source.sha256,model:r.model.sha256,textbook:r.rendered.textbook.sha256,node:r.rendered.node.sha256}))};
fs.writeFileSync(path.join(root,'validation.json'),JSON.stringify(validation,null,2)+'\n');
fs.writeFileSync(path.join(root,'checks/correction-r2/summary.json'),JSON.stringify(validation,null,2)+'\n');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const css=`*{box-sizing:border-box}body{margin:0;color:#233047;background:#f5f6f9;font:16px/1.8 system-ui}main{max-width:1360px;margin:auto;padding:28px}h1{font-size:32px}h2{font-size:24px}a{color:#435c96}nav{display:flex;flex-wrap:wrap;gap:18px}.panel,section{background:white;border:1px solid #d7deea;padding:24px;margin:24px 0}.panel{border-left:4px solid #455c93}.compare{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(300px,1.3fr);gap:24px}figure{margin:0}img{width:100%;height:auto}figcaption{font-weight:600;margin-bottom:12px;color:#5f6e88}.muted{color:#65738b}.narrow{width:318px;max-width:100%;border:1px solid #ccd5e4}.narrow img{display:block}li{margin:9px 0}details{margin-top:16px}summary{cursor:pointer;color:#435c96}@media(max-width:750px){main{padding:16px}.compare{grid-template-columns:1fr}section{padding:18px}h1{font-size:27px}}`;
const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>屋顶第三组 · r2修订对照</title><style>${css}</style></head><body><main><nav><a href="index.html">← 第三组图纸</a><a href="reading-check.html">318 / 390px阅读</a><a href="history/r1-before-correction/cross-review.html">修订前审核归档</a><a href="validation.json">当前验证</a></nav><h1>屋顶第三组 · r2 修订对照</h1><p class="muted">2026-11-03 · 19–26 · 8张图纸 / 16份原生SVG</p><div class="panel"><b>20、21、26的三处构造错误已修正，经原图、视觉与证据三方复核，进入人工审阅。</b><p>中心线、钢筋剖切点、引线及窄栏阅读已同步调整。教材版与节点版均已重新生成；当前是修订稿，尚未替换正式教材或模型资源。</p><p>16份SVG通过双版几何与实际文字边界检查；318/390px嵌入栏已复看。保留旧稿、旧审计和全部来源。</p></div><section><h2>仍保留的证据边界</h2><ul>${limits.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><p class="muted">本轮恢复原图关系并修正版式，未新增规范尺寸或修改模型。沿用此前核验的规范依据与适用范围，不将历史实例当作现行通用施工图。</p></section>${records.map(r=>`<section id="drawing-${r.order}"><h2>${r.order} · ${esc(r.title)}</h2><p>${esc(changes[r.order])}</p><nav><a href="${r.assets.textbook}?v=${r.rendered.textbook.sha256.slice(0,12)}">教材SVG</a><a href="${r.assets.node}?v=${r.rendered.node.sha256.slice(0,12)}">节点SVG</a><a href="view/${r.id}.html">教材讲解与依据</a></nav><div class="compare"><figure><figcaption>用户原图</figcaption><img loading="lazy" src="${r.source.path}" alt="${esc(r.title)}原图"></figure><figure><figcaption>r2 教材版</figcaption><img loading="lazy" src="${r.assets.textbook}?v=${r.rendered.textbook.sha256.slice(0,12)}" alt="${esc(r.title)}修订教材版"></figure></div><details><summary>展开节点版（318px）</summary><div class="narrow"><img loading="lazy" src="${r.assets.node}?v=${r.rendered.node.sha256.slice(0,12)}" alt="${esc(r.title)}节点窄版"></div></details></section>`).join('')}<section><h2>复核与检查记录</h2><nav>${['source-review','visual-review','evidence-review','geometry-regression','browser-text-bounds','summary'].map(n=>`<a href="checks/correction-r2/${n}.json">${n}</a>`).join('')}</nav><p>所有复核绑定当前SVG摘要。未进行手机真机测试；材料、配筋和未注施工尺寸不由图示像素推算。</p></section></main></body></html>`;
fs.writeFileSync(path.join(root,'correction-r2.html'),html);
let index=fs.readFileSync(path.join(root,'index.html'),'utf8');
index=index.replace(/<section class="panel boundary" id="correction-r2-status">[\s\S]*?<\/section>/,'');
index=index.replace('<main>','<main><section class="panel boundary" id="correction-r2-status"><h2>r2 修订稿已完成</h2><p>20、21、26构造错误及本批线型、剖切点、引线和窄栏排版已修正，三方复核后待人工审阅；未接入正式教材。</p><a href="correction-r2.html">查看逐图修订与原图对照 →</a> · <a href="history/r1-before-correction/cross-review.html">修订前审核归档</a></section>');
fs.writeFileSync(path.join(root,'index.html'),index);
fs.writeFileSync(path.join(root,'cross-review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>交叉审核 · 已有r2修订</title><style>${css}</style><main><h1>此轮审核已有对应修订稿</h1><div class="panel"><p>原审核针对r1，20、21、26等已确认问题已在r2修正。旧记录及对应旧图完整归档，不以新图替代旧证据。</p><nav><a href="correction-r2.html">查看当前r2修订</a><a href="history/r1-before-correction/cross-review.html">查看r1原审核与旧图</a><a href="index.html">第三组总览</a></nav></div></main></html>`);
for(const name of ['index.html','correction-r2.html','cross-review.html']){
 const html=fs.readFileSync(path.join(root,name),'utf8');
 for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){const url=m[1];if(url.startsWith('#')||/^(?:https?:|\/)/.test(url))continue;assert(fs.existsSync(path.join(root,url.split(/[?#]/)[0])),'Broken report link '+url);}
}
console.log('r2: 8 drawings / 16 SVGs verified; 3 independent reviews matched; 188 protected assets unchanged. Draft only.');
