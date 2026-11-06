import {readFile,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='audit-output/roof-source-redraw-batch-01-2026-10-30',out=root+'/correction-2026-11-01';
const sha=b=>createHash('sha256').update(b).digest('hex');
const records=JSON.parse(await readFile(root+'/evidence.json','utf8'));
const changed=records.filter(r=>r.order>=4&&r.order<=8);
const vectors=JSON.parse(await readFile(root+'/vector-checks.json','utf8'));
const browser=JSON.parse(await readFile(root+'/browser-layout-checks.json','utf8'));
const clearance=JSON.parse(await readFile(root+'/clearance-checks.json','utf8'));
const reading=JSON.parse(await readFile(out+'/browser-reading-checks.json','utf8'));
const independent=await readFile(out+'/independent-review.md','utf8');
const approvals=JSON.parse(await readFile(root+'/approvals.json','utf8'));
assert.equal(records.length,9);assert.equal(changed.length,5);assert.equal(browser.length,18);assert.equal(clearance.results.length,18);
for(const r of records){
 for(const mode of ['textbook','node']){
  const hash=sha(await readFile(root+'/'+r.assets[mode]));assert.equal(hash,r.rendered[mode].sha256);
  const b=browser.find(b=>b.title===mode+'-'+r.id),c=clearance.results.find(c=>c.mode===mode&&c.id===r.id);
  assert(b&&!b.clipped.length&&!b.overlaps.length&&b.observedUrl.endsWith('?v='+hash.slice(0,12)));
  assert(c&&c.sha256===hash&&!c.textLineIntersections.length&&!c.symbolOcclusions.length);
  const v=vectors.find(v=>v.id===r.id);assert(v&&v.checks.some(c=>c.sha256===hash&&!c.errors.length));assert(!v.comparisonErrors.length);
  const approved=approvals.find(a=>a.id===r.id);
  if(approved)assert.equal(hash,approved.assets[mode].sha256);
  if(r.order>=4&&r.order<=8)assert(independent.includes(hash),'Independent review must bind current SVG');
 }
}
for(const r of changed)for(const ref of r.references)if(ref.localSource)assert((await stat(root+'/'+ref.localSource)).isFile());
assert.equal(reading.readers.length,5);
for(const v of reading.readers){assert(v.loaded&&v.naturalWidth===620);assert(v.scrollWidth<=v.clientWidth);assert(Math.abs(v.outerWidth-390)<1);assert(v.imageWidth<=v.clientWidth+1);}
const current={date:'2026-11-01',revision:'roof-batch1-r2-2026-11-01',drawingCount:9,svgCount:18,revisedOrders:[4,5,6,7,8],revisedSvgCount:10,approvedAndIntegrated:[1,2,3,9],pending:[4,5,6,7,8],sourceGeometryReview:'current SVG/PNG hashes in correction-2026-11-01/independent-review.md',svgStructure:'18 passed',sharedGeometry:'9 pairs passed',browserTextBounds:'18 current URLs passed',glyphLineAndSymbolClearance:'18 passed',narrowReading:'5 embedded 390px containers; scrollbar width accounted for; no horizontal overflow',sourceFidelityLimit:'二值轮廓保留低分辨率来源的局部不规则性；像素IoU不作为工程正确率。',references:'GB/T50001尺寸表达；GB55030、GB50345实际原文图页及12J201官方公开A12/B6/A2更正页；未读图集页明确未核验。',formalResourcesChanged:false,approvalProtection:'four previously approved pairs remain byte-identical',localProductionBuild:'本轮未重跑；只变更图稿、生成与审阅资料，沿用2026-10-30正式站构建记录。',remoteDeployment:'not-performed',checks:{vector:'vector-checks.json',browser:'browser-layout-checks.json',clearance:'clearance-checks.json',reading:'correction-2026-11-01/browser-reading-checks.json',independent:'correction-2026-11-01/independent-review.md'},screenshots:['correction-2026-11-01/browser-reading-proof.png'],evidenceSha256:sha(await readFile(root+'/evidence.json'))};
await writeFile(root+'/validation-summary.json',JSON.stringify(current,null,2)+'\n');
await writeFile(out+'/validation-summary.json',JSON.stringify(current,null,2)+'\n');
console.log('Current SVG hashes, independent review, 18 layout/clearance checks, five narrow readers and four approval locks agree.');
