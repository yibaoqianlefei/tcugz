import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root='audit-output/roof-source-redraw-batch-02-2026-11-01';
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=async path=>JSON.parse(await readFile(path,'utf8'));
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const visible=svg=>svg.replace(/<metadata>[\s\S]*?<\/metadata>/,'');
// These exact drafts were visible when the user approved figures 10 and 11.
const selected=[
 {order:10,id:'water-storage-parapet-drainage-01',directory:'correction-parapet-2026-11-01',revision:'roof-batch2-parapet-r2-source-projection-2026-11-01',
  hashes:{textbook:'d637effb35853b76015561b9984faaf38b7b46714ca87f714111fce1102180d0',node:'90cc2154456c44e3957ef60c9c199ce90b036bb3b690e22af972ba135e9fe1dc'}},
 {order:11,id:'water-storage-eaves-drainage-01',directory:'correction-eaves-2026-11-02',revision:'roof-batch2-eaves-r4-thin-pipe-wall-2026-11-02',
  hashes:{textbook:'c1d29b0e6e3c17f2938ccdda2216aa1fa8cdb3703c3cfbe7f0cab7c2f79243d2',node:'707c377b36a09b04b6fb4eab17f4e8b313f2d80c5a9e1b94a0581d620dc7aafd'}},
];
const published=await json('src/data/sourceDrawingEvidence.json'),layouts=await json('src/data/nodeDiagramLayouts.json');
const graph=await json('src/data/curriculumLearning.json'),drafts=await json(root+'/evidence.json');
const beforeDefinitions=await readFile('src/data/nodeDefinitions.ts','utf8');
const previousReceipt=await json(root+'/publication.json').catch(()=>null);
const targetIds=new Set(selected.map(s=>s.id));
const protectedFiles=new Map(),protectedRecords=new Map();
for(const record of Object.values(published))if(!targetIds.has(record.id)){
 protectedRecords.set(record.id,sha(JSON.stringify(record)));
 for(const path of [record.path,record.panel.path])protectedFiles.set('public'+path,sha(await readFile('public'+path)));
}
for(const draft of drafts){
 protectedFiles.set('public'+draft.source.projectSource,sha(await readFile('public'+draft.source.projectSource)));
 if(!targetIds.has(draft.id))for(const mode of ['textbook','node'])protectedFiles.set(root+'/'+draft.assets[mode],sha(await readFile(root+'/'+draft.assets[mode])));
}
for(const item of selected){
 const path=`public/models/roof/${item.id.replace(/-01$/,'')}/${item.id.replace(/-01$/,'')}.glb`;
 protectedFiles.set(path,sha(await readFile(path)));
}
const prepared=[];
for(const selection of selected){
 const base=root+'/'+selection.directory,draft=await json(base+'/evidence.json'),validation=await json(base+'/validation.json');
 assert.equal(draft.id,selection.id);assert.equal(draft.revision,selection.revision);
 assert.equal(validation.sourceHashVerified,true);assert(validation.vectorReview.passed);
 const review=validation.independentSourceReview;
 assert.equal((review.issues??review.openRedrawIssues??[]).length,0);
 const bindings=review.inputHashes??Object.fromEntries(Object.values(review.inputs).map(f=>[f.path,f.sha256]));
 for(const [path,hash]of Object.entries(bindings))assert.equal(sha(await readFile(path)),hash,'Independent review binding changed: '+path);
 assert.equal(sha(await readFile('public'+draft.source.projectSource)),draft.source.sha256);
 const context=graph.nodes[draft.id]?.primary;assert.equal(context?.knowledgeId,'roof.storage');
 const assets={};
 for(const mode of ['textbook','node']){
  const svg=await readFile(base+'/'+draft.assets[mode],'utf8');
  assert.equal(sha(svg),selection.hashes[mode],'Only the approved revision may be adopted');
  assert.equal(sha(await readFile(root+'/'+draft.assets[mode])),selection.hashes[mode]);
  assert(validation.vectorReview.checks.some(c=>c.sha256===selection.hashes[mode]&&!c.errors.length));
  assert.equal(validation.browserReview.svgHashes[mode],selection.hashes[mode]);
  assert(!/<image\b|<script\b|<foreignObject\b/i.test(svg));
  assets[mode]=svg;
 }
 assert(validation.browserReview.layout.every(r=>!r.outside.length&&!r.overlaps.length&&!r.lineHits.length));
 if(published[draft.id]){
  const prior=previousReceipt?.batch.find(r=>r.id===draft.id);assert(prior,'Existing adoption requires its original receipt');
  for(const mode of ['textbook','node']){
   assert.equal(prior.approvedDrafts[mode].sha256,selection.hashes[mode]);
   assert.equal(sha(await readFile('public'+(mode==='node'?published[draft.id].panel.path:published[draft.id].path))),prior.publishedHashes[mode]);
  }
  continue;
 }
 const approval={id:draft.id,order:selection.order,approvedOn:'2026-11-02',authorization:'批准将10，11接入网站',scope:'user-authorized-teaching-integration',engineeringApproval:false,revision:selection.revision,
  assets:Object.fromEntries(['textbook','node'].map(mode=>[mode,{path:selection.directory+'/'+draft.assets[mode],sha256:selection.hashes[mode]}]))};
 const record={...draft,nodeId:draft.id,path:`/images/learning/${draft.id}.svg`,width:draft.rendered.textbook.width,height:draft.rendered.textbook.height,
  original:{...draft.source,path:draft.source.projectSource},status:'source-based',usage:'teaching-reference',replacesOriginal:true,publishedOn:'2026-11-02',
  reviewStatus:'user-approved-teaching-integration-with-recorded-source-conditions',humanApproval:approval,
  knowledgeContext:{nodeId:draft.id,lesson:context.lessonPath,lessonKey:context.lessonKey,unitId:context.knowledgeId,primary:true},
  learningContexts:[{lesson:context.lessonPath,unitId:context.knowledgeId,primary:true}],
  references:draft.references.map(ref=>({...ref,url:ref.officialSource})),
  teaching:{summary:draft.teaching,points:['区分高位溢流与低位泄水，追踪到墙外汇水及下接管。','分别辨认墙根泛水、板端嵌缝和屋面空心板。','原图实例和局部图示接口不作为通用工程尺寸或完整设计。']},
  panel:{path:`/images/learning/node-panels/${draft.id}.svg`,width:draft.rendered.node.width,height:draft.rendered.node.height,sourceGeometryDigests:draft.geometryDigests},
  publication:{status:'published-teaching-reference',formalReplacement:true,publishedOn:'2026-11-02',remoteDeployment:false}};
 prepared.push({record,assets});
}
// All source, approval and review bindings pass before formal assets are touched.
await mkdir('public/images/learning/node-panels',{recursive:true});
const receipt=[...(previousReceipt?.batch??[])];
for(const {record,assets}of prepared){
 const publishedHashes={};
 for(const mode of ['textbook','node']){
  const output=assets[mode].replace(/<metadata>[\s\S]*?<\/metadata>/,`<metadata>${esc(JSON.stringify(record))}</metadata>`);
  assert.equal(visible(output),visible(assets[mode]),'Approved visible drawing must remain byte-identical');
  const path=mode==='node'?record.panel.path:record.path;
  await writeFile('public'+path,output);publishedHashes[mode]=sha(output);
 }
 published[record.id]=record;
 const mapping={path:record.path,panel:record.panel.path},index=layouts.findIndex(r=>r.path===record.path);
 if(index<0)layouts.push(mapping);else layouts[index]=mapping;
 receipt.push({id:record.id,order:record.order,revision:record.revision,approvedDrafts:record.humanApproval.assets,publishedHashes,path:record.path,panel:record.panel.path,unitId:record.knowledgeContext.unitId});
}
let definitions=beforeDefinitions;
for(const item of selected){
 const draft=drafts.find(d=>d.id===item.id),old=draft.source.projectSource.slice(1),next='images/learning/'+item.id+'.svg';
 if(definitions.includes('assetPath("'+old+'")')){
  assert.equal(definitions.split('assetPath("'+old+'")').length-1,2,'Only this node thumbnail and diagram may change');
  definitions=definitions.replaceAll('assetPath("'+old+'")','assetPath("'+next+'")');
 }else assert.equal(definitions.split('assetPath("'+next+'")').length-1,2);
}
await writeFile('src/data/nodeDefinitions.ts',definitions);
await writeFile('src/data/sourceDrawingEvidence.json',JSON.stringify(published,null,2)+'\n');
await writeFile('src/data/nodeDiagramLayouts.json',JSON.stringify(layouts,null,2)+'\n');
for(const [path,hash]of protectedFiles)assert.equal(sha(await readFile(path)),hash,'Unrelated or original resource changed: '+path);
for(const [id,hash]of protectedRecords)assert.equal(sha(JSON.stringify(published[id])),hash);
const publication={publishedOn:'2026-11-02',authorization:'批准将10，11接入网站',remoteDeployment:false,engineeringApproval:false,batch:receipt.sort((a,b)=>a.order-b.order),pending:drafts.filter(d=>!targetIds.has(d.id)).map(d=>({id:d.id,order:d.order,status:'draft-not-approved'})),protectedFileCount:protectedFiles.size,protectedFilesUnchanged:true,totalPublishedSourceDrawings:Object.keys(published).length};
await writeFile(root+'/publication.json',JSON.stringify(publication,null,2)+'\n');
await writeFile(root+'/approvals.json',JSON.stringify(selected.map(s=>published[s.id].humanApproval),null,2)+'\n');
// Update review-page adoption status, preserving the pre-publication pages.
const archive=root+'/before-publication-10-11';await mkdir(archive,{recursive:true});
async function keepPage(path,name){try{await readFile(archive+'/'+name);}catch(e){if(e.code!=='ENOENT')throw e;await copyFile(path,archive+'/'+name);}}
await keepPage(root+'/index.html','index.html');
let gallery=await readFile(root+'/index.html','utf8');
gallery=gallery.replace('当前为本批图稿，既有正式资源保持不变。','10、11已获用户批准并接入教材和交互节点；12～18保持待审图稿。');
for(const item of selected){
 const nodeUrl='/#/node/'+item.id+'?lesson=basics%2Froof%2Froof-flat.html&unit=roof.storage';
 const at=gallery.indexOf('id="'+item.id+'"'),end=gallery.indexOf('</article>',at);assert(at>=0&&end>at);
 let tile=gallery.slice(at,end);
 if(!tile.includes('data-published-adoption'))tile=tile.replace(`<span class="num">${item.order}</span>`,`<span class="num">${item.order}</span> <small data-published-adoption style="color:#287064">已批准 · 已接入</small>`).replace('</nav>',`<a href="${nodeUrl}">查看网站节点 →</a></nav>`);
 gallery=gallery.slice(0,at)+tile+gallery.slice(end);
 const view=root+'/view/'+item.id+'.html';await keepPage(view,item.id+'-view.html');
 await writeFile(view,(await readFile(view,'utf8')).replace('正式教材与模型未改变','已按2026-11-02用户批准接入教材与交互节点'));
 const report=root+'/'+item.directory+'/index.html';await keepPage(report,item.id+'-correction.html');
 let html=await readFile(report,'utf8');
 if(!html.includes('data-published-adoption'))html=html.replace('</h1>',`</h1><p class="notice" data-published-adoption>2026-11-02 · 已按用户批准接入教材与交互节点。<a href="${nodeUrl}">查看节点 →</a> · <a href="/#/lesson/basics/roof/roof-flat.html?unit=roof.storage">教材学习位置 →</a></p>`);
 await writeFile(report,html);
}
await writeFile(root+'/index.html',gallery);
console.log(JSON.stringify({published:prepared.length,adopted:receipt.map(r=>r.order),pending:publication.pending.map(r=>r.order),protected:protectedFiles.size,total:publication.totalPublishedSourceDrawings}));
