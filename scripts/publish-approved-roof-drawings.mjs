import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {esc} from './lib/roof-source-batch-one.mjs';
const root='audit-output/roof-source-redraw-batch-01-2026-10-30',sha=b=>createHash('sha256').update(b).digest('hex');
const approvals=JSON.parse(await readFile(root+'/approvals.json','utf8'));
const drafts=JSON.parse(await readFile(root+'/evidence.json','utf8'));
const browser=JSON.parse(await readFile(root+'/browser-layout-checks.json','utf8'));
const clearance=JSON.parse(await readFile(root+'/clearance-checks.json','utf8')).results;
const vectors=JSON.parse(await readFile(root+'/vector-checks.json','utf8'));
const graph=JSON.parse(await readFile('src/data/curriculumLearning.json','utf8'));
const published=JSON.parse(await readFile('src/data/sourceDrawingEvidence.json','utf8'));
const layouts=JSON.parse(await readFile('src/data/nodeDiagramLayouts.json','utf8'));
const priorReceipt=JSON.parse(await readFile(root+'/publication.json','utf8').catch(()=>'{}'));
assert.equal(new Set(approvals.map(a=>a.id)).size,approvals.length);
assert(approvals.length&&approvals.every(a=>drafts.some(d=>d.id===a.id&&d.order===a.order)));
const prepared=[];
for(const approval of approvals){
 const draft=drafts.find(r=>r.id===approval.id);assert(draft);
 assert.equal(sha(await readFile('public'+draft.source.path)),draft.source.sha256);
 const assets={};
 for(const mode of ['textbook','node']){
  const svg=await readFile(root+'/'+draft.assets[mode],'utf8'),hash=sha(svg);
  assert.equal(hash,approval.assets[mode].sha256,'Only the exact human-approved draft may publish');
  const b=browser.find(r=>r.title===mode+'-'+draft.id);assert(b&&!b.error&&!b.clipped.length&&!b.overlaps.length&&b.observedUrl.endsWith('?v='+hash.slice(0,12)));
  const c=clearance.find(r=>r.id===draft.id&&r.mode===mode);assert(c?.sha256===hash&&!c.textLineIntersections.length&&!c.symbolOcclusions.length);
  const v=vectors.find(r=>r.id===draft.id);assert(v&&!v.comparisonErrors?.length&&v.checks.some(c=>c.sha256===hash&&!c.errors.length));
  assets[mode]=svg;
 }
 const previous=priorReceipt.batch?.find(r=>r.id===draft.id);
 if(previous){
  const current=published[draft.id];assert(current,'Previously published evidence missing');
  for(const mode of ['textbook','node']){
   assert.equal(previous.approvedDrafts[mode].sha256,approval.assets[mode].sha256,'A published revision needs explicit replacement handling');
   const path=mode==='node'?current.panel.path:current.path;
   assert.equal(sha(await readFile('public'+path)),previous.publishedHashes[mode],'Previously published asset changed unexpectedly');
  }
  continue; // Preserve already adopted SVGs and their publication metadata byte-for-byte.
 }
 const context=graph.nodes[draft.id].primary;assert(context);
 const publishedOn=approval.approvedOn??'2026-10-30';
 const record={...draft,nodeId:draft.id,path:`/images/learning/${draft.id}.svg`,width:draft.rendered.textbook.width,height:draft.rendered.textbook.height,
  original:draft.source,status:'source-based',reviewStatus:'user-authorized-teaching-integration-source-and-layout-checked',usage:'teaching-reference',replacesOriginal:true,publishedOn,
  knowledgeContext:{lesson:context.lessonPath,lessonKey:context.lessonKey,unitId:context.knowledgeId,nodeId:draft.id,primary:true},
  learningContexts:[{lesson:context.lessonPath,unitId:context.knowledgeId,primary:true}],
  references:draft.references.map(ref=>({...ref,url:ref.officialSource})),teaching:{summary:draft.teaching,points:draft.geometryChecks},
  panel:{path:`/images/learning/node-panels/${draft.id}.svg`,width:draft.rendered.node.width,height:draft.rendered.node.height,sourceGeometryDigests:draft.geometryDigests},
  humanApproval:approval,publication:{status:'published-teaching-reference',formalReplacement:true,publishedOn}};
 prepared.push({record,assets});
}
// All approval and current-input checks above complete before any formal resource changes.
await mkdir('public/images/learning/node-panels',{recursive:true});
const receipt=[...(priorReceipt.batch??[])];
for(const {record,assets} of prepared){
 const hashes={};
 for(const mode of ['textbook','node']){
  const output=assets[mode].replace(/<metadata>[\s\S]*?<\/metadata>/,`<metadata>${esc(JSON.stringify(record))}</metadata>`),path=mode==='node'?record.panel.path:record.path;
  assert.equal(output.replace(/<metadata>[\s\S]*?<\/metadata>/,''),assets[mode].replace(/<metadata>[\s\S]*?<\/metadata>/,''),'Approved visible content must remain identical');
  await writeFile('public'+path,output);hashes[mode]=sha(output);
 }
 published[record.id]=record;
 const existing=layouts.findIndex(r=>r.path===record.path),mapping={path:record.path,panel:record.panel.path};
 if(existing>=0)layouts[existing]=mapping;else layouts.push(mapping);
 receipt.push({id:record.id,order:record.order,approvedDrafts:record.humanApproval.assets,publishedHashes:hashes,path:record.path,panel:record.panel.path,unitId:record.knowledgeContext.unitId});
}
await writeFile('src/data/sourceDrawingEvidence.json',JSON.stringify(published,null,2)+'\n');
await writeFile('src/data/nodeDiagramLayouts.json',JSON.stringify(layouts,null,2)+'\n');
receipt.sort((a,b)=>a.order-b.order);
await writeFile(root+'/publication.json',JSON.stringify({publishedOn:prepared.length?prepared.at(-1).record.publishedOn:priorReceipt.publishedOn,batch:receipt,pending:drafts.filter(r=>!approvals.some(a=>a.id===r.id)).map(r=>({id:r.id,order:r.order,status:'draft'})),totalPublishedSourceDrawings:Object.keys(published).length},null,2)+'\n');
const cleanRoot='audit-output/roof-clean-line-review-2026-11-01';
const cleanApprovals=approvals.filter(a=>a.sourceRevision==='roof-batch1-r4-clean-lines-2026-11-01');
if(cleanApprovals.length){
 await writeFile(cleanRoot+'/publication.json',JSON.stringify({adoptedOn:'2026-11-01',scope:'user-authorized-teaching-integration',engineeringApproval:false,batch:receipt.filter(r=>cleanApprovals.some(a=>a.id===r.id)),previousVersionsPreserved:true,remoteDeployment:false},null,2)+'\n');
 const cleanIndex=cleanRoot+'/index.html';
 await writeFile(cleanIndex,(await readFile(cleanIndex,'utf8')).replace('核对稿 · 未更改正式图纸。01、02、03、09保持已批准版本。','2026-11-01 · 已按用户要求接入教材与交互节点。01、02、03、09保持原版本；工程技术适用边界仍按图中说明。'));
 let gallery=await readFile(root+'/index.html','utf8');
 for(const a of cleanApprovals){
  const label=`<span class="num">${String(a.order).padStart(2,'0')}</span>`;
  if(!gallery.includes(label+' <small style="color:#287064">已采用 · 已接入</small>'))gallery=gallery.replace(label,label+' <small style="color:#287064">已采用 · 已接入</small>');
  const viewPath=root+'/view/'+a.id+'.html';
  await writeFile(viewPath,(await readFile(viewPath,'utf8')).replace('图纸未替换正式教材与节点','已按用户要求接入教材与交互节点'));
 }
 gallery=gallery.replace('01、02、03、09已接入；其余五张为核对稿','第一组九张均已接入教材与交互节点');
 await writeFile(root+'/index.html',gallery);
}
console.log(`Published ${prepared.length} newly authorized roof drawings; ${receipt.length} total adopted; previous formal assets preserved.`);
