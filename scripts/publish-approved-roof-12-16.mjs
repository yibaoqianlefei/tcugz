import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root='audit-output/roof-source-redraw-batch-02-2026-11-01';
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const visible=s=>s.replace(/<metadata>[\s\S]*?<\/metadata>/,'');
const drafts=await json(root+'/evidence.json');
const selected=drafts.filter(d=>d.order>=12&&d.order<=16);
assert.equal(selected.length,5);
const published=await json('src/data/sourceDrawingEvidence.json');
const layouts=await json('src/data/nodeDiagramLayouts.json');
const graph=await json('src/data/curriculumLearning.json');
const receipt=await json(root+'/publication.json');
const approvals=await json(root+'/approvals.json');
const protectedFiles={};
for(const r of Object.values(published))for(const p of [r.path,r.panel.path])protectedFiles['public'+p]=sha(await readFile('public'+p));
for(const d of drafts){
 protectedFiles['public'+d.source.projectSource]=sha(await readFile('public'+d.source.projectSource));
 for(const mode of ['textbook','node'])protectedFiles[root+'/'+d.assets[mode]]=sha(await readFile(root+'/'+d.assets[mode]));
}
const priorRecords=structuredClone(published);
const prepared=[];
for(const d of selected){
 assert.equal(sha(await readFile('public'+d.source.projectSource)),d.source.sha256);
 const assets={};
 for(const mode of ['textbook','node']){
  const svg=await readFile(root+'/'+d.assets[mode],'utf8');
  assert.equal(sha(svg),d.rendered[mode].sha256,'Draft changed since recorded render: '+d.id);
  assert(!/<image\b|<script\b|<foreignObject\b/i.test(svg));
  if(d.order<=14)assert.equal(svg,await readFile('audit-output/roof-tiles-correction-2026-11-02/'+d.assets[mode],'utf8'));
  assets[mode]=svg;
 }
 const context=graph.nodes[d.id].primary;
 assert.equal(context.knowledgeId,d.order<=14?'roof.tiles':'roof.drainage');
 const approval={id:d.id,order:d.order,approvedOn:'2026-11-02',authorization:'批准12，13，14，15，16接入网站，17，18需要重新重点审核',scope:'user-authorized-teaching-integration',engineeringApproval:false,revision:d.revision,assets:Object.fromEntries(['textbook','node'].map(m=>[m,{path:d.assets[m],sha256:d.rendered[m].sha256}]))};
 if(published[d.id]){assert.deepEqual(published[d.id].humanApproval,approval);continue;}
 const record={...d,nodeId:d.id,path:`/images/learning/${d.id}.svg`,width:d.rendered.textbook.width,height:d.rendered.textbook.height,original:{...d.source,path:d.source.projectSource},status:'source-based',usage:'teaching-reference',replacesOriginal:true,publishedOn:'2026-11-02',reviewStatus:'user-approved-teaching-integration-with-recorded-source-conditions',humanApproval:approval,
  knowledgeContext:{nodeId:d.id,lesson:context.lessonPath,lessonKey:context.lessonKey,unitId:context.knowledgeId,primary:true},learningContexts:[{lesson:context.lessonPath,unitId:context.knowledgeId,primary:true}],references:d.references.map(r=>({...r,url:r.officialSource})),teaching:{summary:d.teaching,points:[context.question,context.task,'原图实例与局部投影不作为通用工程尺寸或完整设计。']},
  panel:{path:`/images/learning/node-panels/${d.id}.svg`,width:d.rendered.node.width,height:d.rendered.node.height,sourceGeometryDigests:d.geometryDigests},publication:{status:'published-teaching-reference',formalReplacement:true,publishedOn:'2026-11-02',remoteDeployment:false}};
 prepared.push({record,assets});
}
let definitions=await readFile('src/data/nodeDefinitions.ts','utf8');
for(const {record:r}of prepared){
 const old='assetPath("'+r.source.projectSource.slice(1)+'")';
 assert.equal(definitions.split(old).length-1,2,'Only the selected diagram and thumbnail paths should change');
 definitions=definitions.replaceAll(old,'assetPath("'+r.path.slice(1)+'")');
}
const archive=root+'/before-publication-12-16';await mkdir(archive,{recursive:true});
for(const p of ['src/data/sourceDrawingEvidence.json','src/data/nodeDiagramLayouts.json','src/data/nodeDefinitions.ts',root+'/publication.json',root+'/approvals.json',root+'/index.html']){
 const dest=archive+'/'+p.split('/').at(-1);try{await readFile(dest);}catch(e){if(e.code!=='ENOENT')throw e;await copyFile(p,dest);}
}
for(const {record:r,assets}of prepared){
 const publishedHashes={};
 for(const mode of ['textbook','node']){
  const output=assets[mode].replace(/<metadata>[\s\S]*?<\/metadata>/,`<metadata>${esc(JSON.stringify(r))}</metadata>`);
  assert.equal(visible(output),visible(assets[mode]));
  await writeFile('public'+(mode==='node'?r.panel.path:r.path),output);publishedHashes[mode]=sha(output);
 }
 published[r.id]=r;layouts.push({path:r.path,panel:r.panel.path});approvals.push(r.humanApproval);
 receipt.batch.push({id:r.id,order:r.order,revision:r.revision,approvedDrafts:r.humanApproval.assets,publishedHashes,path:r.path,panel:r.panel.path,unitId:r.knowledgeContext.unitId});
}
await writeFile('src/data/nodeDefinitions.ts',definitions);
await writeFile('src/data/sourceDrawingEvidence.json',JSON.stringify(published,null,2)+'\n');
await writeFile('src/data/nodeDiagramLayouts.json',JSON.stringify(layouts,null,2)+'\n');
for(const [id,r]of Object.entries(priorRecords))assert.deepEqual(published[id],r);
for(const [p,h]of Object.entries(protectedFiles))assert.equal(sha(await readFile(p)),h,'Protected asset changed: '+p);
receipt.batch.sort((a,b)=>a.order-b.order);
Object.assign(receipt,{authorization:selected.map(d=>published[d.id].humanApproval.authorization)[0],pending:drafts.filter(d=>!published[d.id]).map(d=>({id:d.id,order:d.order,status:'requires-focused-review'})),protectedFileCount:Object.keys(protectedFiles).length,protectedFilesUnchanged:true,totalPublishedSourceDrawings:Object.keys(published).length});
await writeFile(root+'/publication.json',JSON.stringify(receipt,null,2)+'\n');
await writeFile(root+'/approvals.json',JSON.stringify(approvals,null,2)+'\n');
await writeFile(archive+'/protected-assets.json',JSON.stringify(protectedFiles,null,2)+'\n');
let gallery=await readFile(root+'/index.html','utf8');
gallery=gallery.replace('10、11已获用户批准并接入教材和交互节点；12～18保持待审图稿。','10～16已获用户批准并接入教材和交互节点；17、18重新重点审核，尚未接入。');
for(const d of selected){
 const start=gallery.indexOf('id="'+d.id+'"'),end=gallery.indexOf('</article>',start);assert(start>=0&&end>start);
 let card=gallery.slice(start,end).replace('原图修订稿 · 待人工确认','已批准 · 已接入');
 const context=graph.nodes[d.id].primary;
 if(!card.includes('data-published-adoption'))card=card.replace(`<span class="num">${d.order}</span>`,`<span class="num">${d.order}</span><small data-published-adoption> 已批准 · 已接入</small>`).replace('</nav>',`<a href="/#/node/${d.id}?lesson=${encodeURIComponent(context.lessonPath)}&unit=${context.knowledgeId}">网站节点 →</a></nav>`);
 gallery=gallery.slice(0,start)+card+gallery.slice(end);
 const p=root+'/view/'+d.id+'.html';let html=await readFile(p,'utf8');
 if(!html.includes('data-published-adoption'))html=html.replace('</h1>',`</h1><p data-published-adoption>2026-11-02 · 此稿已获用户批准，已接入教材与交互节点。<a href="/#/node/${d.id}">查看节点</a></p>`);
 await writeFile(p,html);
}
await writeFile(root+'/index.html',gallery);
console.log(JSON.stringify({newlyPublished:prepared.length,adopted:receipt.batch.map(d=>d.order),pending:receipt.pending.map(d=>d.order),protectedFiles:Object.keys(protectedFiles).length}));
