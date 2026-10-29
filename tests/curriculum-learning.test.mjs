import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {articles} from '../scripts/lib/textbook-catalog.mjs';
import {formalizeCourse} from '../scripts/lib/course-paths.mjs';
import {nodeDefinitions} from '../src/data/nodeDefinitions.ts';
import {curriculumLearning as graph,getNodeLearningContext,resolveLearningUnit,learningRoute} from '../src/utils/curriculumLearning.ts';
import {nodeReturnTarget,lessonNodeRoute,validLessonVisit} from '../src/utils/lessonNodeNavigation.ts';
const media=JSON.parse(await readFile('src/data/lessonMedia.json','utf8'));
const corpus=JSON.parse(await readFile('public/data/companion-knowledge.json','utf8'));
const baseline=JSON.parse(await readFile('tests/fixtures/curriculum-model-baseline-2026-10-29.json','utf8'));
const old=JSON.parse(await readFile('src/data/legacyLessonFigures.json','utf8'));
const available=nodeDefinitions.filter(n=>n.status==='available');
assert.equal(articles.length,54);assert.equal(available.length,93);
assert.deepEqual(Object.keys(graph.lessons).sort(),articles.map(a=>a.group+'/'+a.id).sort());
assert.deepEqual(Object.keys(graph.nodes).sort(),available.map(n=>n.id).sort());
let core=0,contexts=0;
for(const a of articles){
 const key=a.group+'/'+a.id,plan=graph.lessons[key],lesson=media[key];
 assert(plan.units.length>0&&plan.outcome&&plan.prerequisite,'every course has a learning path');
 assert.equal(plan.kind,a.group==='practice'?'practice':'reading');
 const html=await readFile('public/lesson/'+a.path,'utf8');
 assert.equal(html,await readFile('public/curriculum/'+a.path,'utf8'));
 const ids=[...html.matchAll(/(?:\s|<)id="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'no duplicate anchors');
 for(const u of plan.units){
  assert.equal(u.lesson,key);assert(u.question&&u.principle&&u.conclusion&&u.boundary&&u.observe.length>=2);
  assert(u.assessment.question&&u.assessment.criteria.length>=2,'corresponding explanation/application rubric');
  assert(html.includes('id="unit-'+u.id+'"')&&html.includes(u.question)&&html.includes(u.assessment.question));
  assert.equal(u.models.filter(m=>m.role==='core').length,lesson.figures.filter(f=>f.knowledgeId===u.id).length);
  for(const m of u.models){
   const node=available.find(n=>n.id===m.nodeId);assert(node);
   for(const name of m.objects)assert(node.layerConfig?.getLayerInfo(name)||node.variants?.some(v=>v.componentKnowledge?.some(c=>c.objectName===name)));
   const route=lessonNodeRoute(m.nodeId,a.path,undefined,u.id);const query=route.slice(route.indexOf('?'));
   assert.equal(nodeReturnTarget('/node/'+m.nodeId,query).to,learningRoute({...graph.nodes[m.nodeId].primary,lessonPath:a.path,knowledgeId:u.id}),'all related model return links reach the source unit');
   assert.equal(getNodeLearningContext(m.nodeId,query)?.knowledgeId,u.id,'source unit wins over primary');contexts++;
  }
  for(const id of u.prerequisiteIds)assert(graph.units[id]);
  for(const key of [...u.relatedPrinciples,...u.applications])assert(graph.lessons[key]);
 }
 for(const f of lesson.figures){assert(f.hasModel);core++;if(f.image)await access('public/'+f.image.replace(/^\//,''));}
 const hosted=formalizeCourse(html,'/textbook/');assert(!/href="\/(?:#\/|lesson\/|styles\/|images\/)/.test(hosted),'hosted base applied');
 assert(corpus.sources.some(s=>s.id==='course:'+a.path&&!s.empty&&s.text.length>300));
}
for(const [id,record]of Object.entries(graph.nodes)){
 assert(record.primary?.primary,'one primary per available node');assert(record.related.every(c=>!c.primary));
 assert(corpus.sources.find(s=>s.id==='node:'+id)?.text.includes(record.primary.question));
 const unrelated=articles.find(a=>![record.primary,...record.related].some(c=>c.lessonPath===a.path));
 if(unrelated)assert.equal(nodeReturnTarget('/node/'+id,'?lesson='+unrelated.path).to,'/library','unrelated source cannot spoof course return');
}
const active=new Set(),visited=new Set();function visit(id){assert(!active.has(id),'acyclic prerequisites');if(visited.has(id))return;active.add(id);for(const p of graph.units[id].prerequisiteIds)visit(p);active.delete(id);visited.add(id)}Object.keys(graph.units).forEach(visit);
for(const [path,figures]of Object.entries(old))for(const id of Object.keys(figures))assert(resolveLearningUnit(path,null,id),'legacy figure retains a semantic target: '+path+'/'+id);
for(const [path,hash]of Object.entries(baseline.files))assert.equal(createHash('sha256').update(await readFile('public/'+path.replace(/^\//,''))).digest('hex'),hash,'original model geometry unchanged: '+path);
const sample={path:articles[0].path,scrollTop:320,viewportWidth:392,directoryOpen:false,unitId:Object.keys(graph.units)[0],openDetails:[1,3]};assert.deepEqual(validLessonVisit(sample,sample.path),sample);assert.equal(validLessonVisit({...sample,scrollTop:-1},sample.path),undefined);
console.log(`Full-book acceptance: 54 lessons, ${Object.keys(graph.units).length} units, 93 primary nodes, ${contexts} contexts, ${core} lazy canvases, ${Object.keys(baseline.files).length} unchanged model files.`);
