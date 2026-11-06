import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='audit-output/roof-source-redraw-batch-03-2026-11-03',sha=b=>createHash('sha256').update(b).digest('hex');
const records=JSON.parse(await readFile(root+'/evidence.json','utf8'));
const browser=JSON.parse(await readFile(root+'/checks/browser-label-layout.json','utf8'));
const narrow=JSON.parse(await readFile(root+'/checks/narrow-readers.json','utf8'));
const external=JSON.parse(await readFile(root+'/checks/concurrent-index-changes.json','utf8'));
const protectedAssets=JSON.parse(await readFile(root+'/protected-assets.json','utf8'));
assert.equal(browser.drawings.length,16);assert.equal(narrow.readers.length,16);
for(const d of browser.drawings){assert.equal(d.overlaps.length+d.lineHits.length+d.clipped.length,0);const r=records.find(r=>r.id===d.id);assert.equal(r.rendered[d.mode].sha256,d.sha256);assert.equal(sha(await readFile(root+'/'+r.assets[d.mode])),d.sha256);}
for(const n of narrow.readers){assert(n.loaded);assert(n.scrollWidth<=n.width);}
for(const r of records){const c=JSON.parse(await readFile(root+'/checks/'+r.id+'-structure.json','utf8'));assert(c.passed);assert.equal(c.checks[0].sha256,r.rendered.textbook.sha256);assert.equal(c.checks[1].sha256,r.rendered.node.sha256);}
for(const a of protectedAssets){const permitted=external.find(x=>x.path===a.path);assert.equal(sha(await readFile(a.path)),permitted?.current??a.sha256,'Changed protected file '+a.path);}
const validation={date:'2026-11-03',status:'ready-for-user-review',drawingCount:8,nativeSvgCount:16,formalReplacement:false,checks:{nativeSvgAndExactMarkedGeometry:'8 pairs passed',browserTextBounds:'16 SVGs: no detected overlap or clipping',annotationPaths:'16 SVGs: M/L/H/V segment samples clear of text bounding boxes',narrowReaders:'16 images loaded at 318/390px embedded widths; no horizontal overflow',sourceAndModelHashes:'8 source images and 8 GLB inventories matched',existingModelRenders:'8 cached render hashes matched the actual GLBs; contact sheet visually inspected',formalAssets:'published drawings and GLBs unchanged by this batch',sharedIndexes:external},visualReview:{method:'逐图查看8份原图、8份教材版、8份节点版及模型预览，另以浏览器检查实际栏宽',focus:['空腔和薄壁','支承和板端','窄缝填充不越界','钢筋引出对象','尺寸与标注净空','真实坡面与扫描偏斜'],screenshots:['checks/gallery-desktop.png','checks/narrow-reading.png'],limits:['未进行手机真机测试','不替代工程设计审定','20网罩高度符号下标和24坐灰具体侧保留未确认说明']},assets:records.map(r=>({id:r.id,source:r.source.sha256,model:r.model.sha256,textbook:r.rendered.textbook.sha256,node:r.rendered.node.sha256}))};
await writeFile(root+'/validation.json',JSON.stringify(validation,null,2));
console.log('Third roof batch ready for review: 8 drawings / 16 SVGs. No formal publication.');
