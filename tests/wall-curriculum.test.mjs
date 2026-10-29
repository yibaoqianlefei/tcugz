import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {wallUnits} from '../scripts/lib/wall-learning.mjs';
import {nodeReturnTarget} from '../src/utils/lessonNodeNavigation.ts';
const graph=JSON.parse(await readFile('src/data/curriculumLearning.json','utf8'));
const evidence=JSON.parse(await readFile('src/data/diagramEvidence.json','utf8'));
for(const unit of wallUnits)for(const model of unit.models){
 const context=graph.nodes[model.nodeId].primary;
 assert.equal(context.knowledgeId,unit.id,'confirmed wall primary ownership is preserved');
 assert.equal(context.lessonKey,unit.lesson);
 const target=nodeReturnTarget('/node/'+model.nodeId,'?'+new URLSearchParams({lesson:context.lessonPath,unit:unit.id}));
 assert.equal(target.to,'/lesson/'+context.lessonPath+'?unit='+unit.id);
}
assert.equal(Object.keys(graph.lessons).filter(key=>key.startsWith('wall/')).length,8);
assert.equal(Object.values(graph.units).filter(unit=>unit.lesson.startsWith('wall/')).length,13);
assert.equal(graph.lessons['wall/wall-partition'].units[0].models.length,0,'partition retains correct diagram-only teaching');
for(const [id,record] of Object.entries(evidence)){
 const svg=await readFile('public'+record.path,'utf8');
 const embedded=JSON.parse(svg.match(/<metadata>([\s\S]*?)<\/metadata>/)[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<'));
 assert.deepEqual(embedded,record,'SVG and visible evidence use the same record');
 assert.equal(record.reviews.length,4);assert(record.sources.every(s=>s.standard&&s.clause&&s.pages&&s.appliesTo&&s.url.startsWith('https://')));
 assert.equal(record.checkedOn,'2026-10-29');
 const html=await readFile('public/lesson/basics/wall/'+(id==='partition'?'wall-partition':id==='masonry-bond'?'wall-masonry':'wall-details')+'.html','utf8');
 assert(html.includes('绘图依据与适用范围')&&html.includes(record.sources[0].clause));
}
const damp=await readFile('public/images/learning/wall-paths.svg','utf8');
assert(damp.includes('data-panel="external-ground"')&&damp.includes('data-panel="different-indoor-levels"'));
const rects=[...damp.matchAll(/<rect\b([^>]+)>/g)].map(m=>Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]])));
const dpc=rects.filter(r=>/dpc/.test(r.class??''));
assert.equal(dpc.length,4,'three horizontal bands and one vertical connecting band');
for(const r of dpc.filter(r=>Number(r.width)>Number(r.height)))assert.equal(Number(r.width),80,'horizontal DPC spans the full drawn wall thickness');
const vertical=dpc.find(r=>Number(r.height)>Number(r.width));
assert.equal(Number(vertical.x)+Number(vertical.width),298);assert(Number(vertical.y)<=169&&Number(vertical.y)+Number(vertical.height)>=305,'high-side band joins both horizontal layers');
const partition=await readFile('public/images/learning/partition.svg','utf8');
for(const m of partition.matchAll(/<rect\b[^>]*data-role="cavity-filling-section"[^>]*>/g))assert(m[0].includes('stroke="none"'),'fill must not close the C stud opening');
assert(!((await readFile('src/data/textbook/walls/partitions.md','utf8')).includes('图中的顶部留缝')),'deleted geometry is not described in prose');
console.log('Wall acceptance: 8 lessons, 13 units, all 21 primary contexts, 3 evidence records and diagram geometry checks passed.');
