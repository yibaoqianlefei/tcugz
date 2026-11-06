import fs from 'node:fs';
import sharp from 'sharp';
const root='audit-output/roof-source-redraw-batch-03-2026-11-03';
const changes=JSON.parse(fs.readFileSync(root+'/checks/nail-correction/changes.json','utf8'));
let html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>25 / 26 水泥钉专项修订</title><style>body{margin:0;background:#f5f6f8;color:#243047;font:16px/1.7 system-ui}main{max-width:1180px;margin:auto;padding:28px}section{background:white;padding:24px;margin:24px 0;border:1px solid #d5dce8;border-radius:10px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:24px}figure{margin:0}img{width:100%;height:420px;object-fit:contain;background:#fff}a{color:#445a94}.note{padding:12px;background:#fff4dc}h1{font-size:30px} @media(max-width:650px){main{padding:16px}.pair{grid-template-columns:1fr}img{height:auto}}</style><main><a href="index.html">← 第三组图纸</a><h1>25 / 26 · 水泥钉专项修订</h1><p>原图局部与本次重绘对照。仅修改这两张的教材版、节点版；未替换正式教材和节点图纸。</p><p class="note">25 槽口处原图线条叠黑，钉头及钉杆方向尚不能可靠核定。当前接触修订保留为待确认稿，不作为工程参数依据。</p>`;
for(const c of changes.changes){
 const crop=c.order===25?{left:275,top:309,width:240,height:230}:{left:385,top:447,width:175,height:155};
 await sharp(root+'/previews/textbook-'+c.id+'.png').extract(crop).resize({width:930}).png().toFile(root+'/checks/nail-correction/'+c.id+'-corrected.png');
 const v=c.after.textbook.sha256.slice(0,12);
 html+=`<section id="drawing-${c.order}"><h2>${c.order} · ${c.order===25?'卷材收头':'混凝土盖板'}</h2><p>${c.correction.description}</p><div class="pair"><figure><figcaption>原图局部（放大后可见扫描像素）</figcaption><img src="checks/nail-correction/${c.id}-source.png" alt="${c.order}原图水泥钉局部"></figure><figure><figcaption>修订局部 r3</figcaption><img src="checks/nail-correction/${c.id}-corrected.png?v=${v}" alt="${c.order}重绘水泥钉局部"></figure></div>${c.correction.unresolved.length?'<p class="note">'+c.correction.unresolved.join(' ')+'</p>':''}<p><a href="textbook/${c.id}.svg?v=${v}">教材版 SVG</a> · <a href="node/${c.id}.svg?v=${c.after.node.sha256.slice(0,12)}">节点版 SVG</a> · <a href="history/r2-before-nail-correction/textbook/${c.id}.svg">修改前 r2</a></p></section>`;
}
html+='<p>钉径、钉长、钉距及锚固深度未在原图给出，本轮未新增这些参数。其他 12 份 SVG 经哈希比对保持不变。</p></main></html>';
fs.writeFileSync(root+'/nail-correction-r3.html',html);
for(const name of ['index.html','correction-r2.html']){
 const file=root+'/'+name;let h=fs.readFileSync(file,'utf8');
 const note='<aside id="nail-review-link" style="padding:16px;background:#fff4dc"><a href="nail-correction-r3.html">25、26 水泥钉专项修订 r3：查看原图对照</a>。25 槽口钉方向仍待确认，原 r2 审核结论不覆盖本次改稿。</aside>';
 h=h.includes('id="nail-review-link"')?h.replace(/<aside id="nail-review-link"[\s\S]*?<\/aside>/,note):h.replace(/<body[^>]*>/,x=>x+note);fs.writeFileSync(file,h);
}
const file=root+'/validation.json',v=JSON.parse(fs.readFileSync(file,'utf8'));
v.status='nail-correction-partial-source-confirmation-awaiting-review';v.current='nail-correction-r3.html';v.nailCorrection={scope:[25,26],changes:'checks/nail-correction/changes.json',sourceReview:'checks/nail-correction/source-review.json',unresolved:'25槽口水泥钉方向受原图叠黑影响未能确认',formalReplacement:false};
v.review.scope='历史 r2 审核；25/26 最新水泥钉修订另见 nailCorrection，历史结果不得作为新稿通过证明。';
fs.writeFileSync(file,JSON.stringify(v,null,2)+'\n');
console.log('Wrote nail-correction-r3.html; no formal replacement.');
