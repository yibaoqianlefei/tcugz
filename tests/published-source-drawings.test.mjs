import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {nodeDefinitions} from '../src/data/nodeDefinitions.ts';
import {publicUrlToFsPath} from './helpers/resolvePublicAsset.ts';
import {formalizeCourse} from '../scripts/lib/course-paths.mjs';

const records=JSON.parse(await readFile('src/data/sourceDrawingEvidence.json','utf8'));
const graph=JSON.parse(await readFile('src/data/curriculumLearning.json','utf8'));
assert.equal(Object.keys(records).length,38);
function comparisonHtml(html){
 const start=html.indexOf('<details class="wall-model-comparison">');
 assert(start>=0,'Related drawings have a comparison that is folded by default');
 let depth=0;
 for(const match of html.slice(start).matchAll(/<details\b[^>]*>|<\/details>/g)){
  depth+=match[0].startsWith('</')?-1:1;
  if(depth===0)return html.slice(start,start+match.index+match[0].length);
 }
 assert.fail('The comparison details must close');
}
let comparisons=0;
for(const record of Object.values(records)){
 const node=nodeDefinitions.find(node=>node.id===record.nodeId);
 assert(node?.diagram&&node.status==='available');
 assert.equal(publicUrlToFsPath(node.diagram.path),resolve('public'+record.path),'The node uses the same published vector as its lesson');
 const svg=await readFile('public'+record.path,'utf8');
 assert(svg.includes('<svg')&&!/<image\b|<script\b|<foreignObject\b/.test(svg));
 const embedded=JSON.parse(svg.match(/<metadata>([\s\S]*?)<\/metadata>/)[1].replaceAll('&quot;','"').replaceAll('&gt;','>').replaceAll('&lt;','<').replaceAll('&amp;','&'));
 assert.deepEqual(embedded,record);
 assert.equal(record.status,'source-based');assert.equal(record.usage,'teaching-reference');assert.equal(record.replacesOriginal,true);
 const original=await readFile('public'+record.original.path);
 assert.equal(createHash('sha256').update(original).digest('hex'),record.original.sha256,'Original references remain recoverable');
 const context=graph.nodes[record.nodeId].primary,unit=graph.units[context.knowledgeId];
 assert(unit.diagramIds.includes(record.id));
 assert(graph.lessons[unit.lesson].diagrams.includes(record.id));
 const html=await readFile('public/lesson/'+context.lessonPath,'utf8');
 const start=html.indexOf('data-knowledge-unit="'+unit.id+'"'),next=html.indexOf('class="knowledge-unit"',start+1);
 const unitHtml=html.slice(start,next<0?html.length:next);
 assert.equal([...html.matchAll(new RegExp('data-diagram-id="'+record.id+'"','g'))].length,1,'Each drawing occurs once in its actual teaching unit');
 assert(unitHtml.includes('data-diagram-id="'+record.id+'"')&&unitHtml.includes('src="'+record.path+'"'));
 assert(unitHtml.includes('srcset="'+record.panel.path+'"'),'Narrow textbook screens use the readable portrait layout');
 const model=unit.models.find(model=>model.nodeId===record.nodeId);
 assert(model,'Each published drawing belongs to a model in its knowledge unit');
 if(model.role!=='core'){
  assert(comparisonHtml(unitHtml).includes('data-diagram-id="'+record.id+'"'),'Comparison and extension drawings belong inside the folded comparison');comparisons++;
 }else{
  const modelStart=unitHtml.indexOf('class="lesson-figure"');assert(modelStart>=0);
  assert(unitHtml.indexOf('data-diagram-id="'+record.id+'"')<modelStart,'Core drawing appears beside the inline-model learning sequence');
 }
 assert(formalizeCourse(html,'/textbook/').includes('src="/textbook'+record.path+'"'),'Published drawing URLs support a hosted subdirectory');
 assert(formalizeCourse(html,'/textbook/').includes('srcset="/textbook'+record.panel.path+'"'),'Responsive portrait sources also support a hosted subdirectory');
 assert.equal(html,await readFile('public/curriculum/'+context.lessonPath,'utf8'));
}
assert.equal(comparisons,21);
assert.equal(new Set(Object.values(records).map(record=>graph.nodes[record.nodeId].primary.knowledgeId)).size,19);
assert.equal(new Set(Object.values(records).map(record=>graph.nodes[record.nodeId].primary.lessonKey)).size,10);
for(const id of ['eaves-gutter-01','roof-access-hatch-01']){assert.equal(records[id].humanApproval.approvedOn,'2026-11-03');assert(records[id].revision.includes('-r3-'));assert.equal(records[id].publication.formalReplacement,true);}
console.log('Published drawings: 38 shared node/lesson vectors, 19 knowledge units, 10 courses, 21 folded related drawings, original hashes, evidence identity and hosted URLs passed.');
