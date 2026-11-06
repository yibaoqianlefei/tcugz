import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {nodeDefinitions} from '../src/data/nodeDefinitions.ts';
import {publicUrlToFsPath} from './helpers/resolvePublicAsset.ts';
const root='audit-output/roof-source-redraw-batch-01-2026-10-30',sha=b=>createHash('sha256').update(b).digest('hex');
const approvals=JSON.parse(await readFile(root+'/approvals.json','utf8'));
const receipt=JSON.parse(await readFile(root+'/publication.json','utf8'));
const published=JSON.parse(await readFile('src/data/sourceDrawingEvidence.json','utf8'));
const adoption=JSON.parse(await readFile('audit-output/roof-clean-line-review-2026-11-01/adoption.json','utf8'));
const revision='roof-batch1-r4-clean-lines-2026-11-01';
// Bind the adoption to the ten reviewed r4 drafts, independently of editable receipts.
const adoptedDraftHashes={
 'coating-parapet-flashing-01':{textbook:'b133ba04526212331f0419f89e9f114452e9712172ac91684d8b7ca9b97c3626',node:'85071a555bc790c758a6c8e174cdcf807d44cb50700d2c794899d422f15c610e'},
 'coating-high-low-roof-flashing-01':{textbook:'68dd5e14725577add517958e47e64ea8d5c4f6e4fad218ac766662fc82090fba',node:'3113e114c71a62460fddb18f2acbf82d6fbf89b470a31d42b9bc7d879188f5db'},
 'straight-rainwater-outlet-65-01':{textbook:'e04c125a577508a8cf821f340fdc63571968b8e59cff1d3e8bd1b0a936141163',node:'3c973796c34d2d87a6c369a9edd23325bb42487288b3ac8e744f004e1a8f5bfa'},
 'straight-rainwater-outlet-cast-iron-01':{textbook:'bd1b717cb948889267e5180d9377e6cc988dcb4eb4adc6c12e4bca9692f16ac1',node:'65058153764a3b85f258cfea53232d7e139137dc171496aefa3e81d45b00b2db'},
 'free-fall-ring-beam-eaves-01':{textbook:'23f27377eda93c467dcf502abb6d7e9de0b39a24a4564ee921ffedcbd5a3f3e6',node:'88852f511266fd7e11bf4c210cb2197e3d24c870d607a4fd68e866aaaecfe34b'}
};
const previousPublishedHashes={
 'roof-truss-timber-01':{textbook:'14255ec8925c232b4269cbd96803d940c1a9cc96af0261931e1d850a2a933add',node:'970774fd197c56e0a2b8fb2e8492e3eb22196894f644465d40b4275f0b2c778a'},
 'roof-truss-reinforced-concrete-01':{textbook:'ff2b391915a431ca0e24bd1ee09097737d96b2315c6e0f09d539e53b2c262da7',node:'b5ba9430350c443e0c19b6e508c175bb212cbf5beb0172a5a89394a7090574c1'},
 'roof-truss-steel-timber-01':{textbook:'a1a2399ca1655826a8f23a7a191eff52511868b2ec24b23a7d51daa6bc747699',node:'4eb77d66448b2de793c6f70e15267caa7e9a481afff4482c53c789737aa04cdb'},
 'free-fall-waterproof-eaves-01':{textbook:'0c7a3f2f7abec1afe3ffc0469077ac43f5faa1bd6565ca14e34d5b0f50e307d2',node:'a8d1f22104c99fd2ddaec1654b9426fb1b36df3f27cd9ce73a8b7804e0c81d2b'}
};
const noMetadata=s=>s.replace(/<metadata>[\s\S]*?<\/metadata>/,'');
const metadata=s=>{
 const blocks=[...s.matchAll(/<metadata>([\s\S]*?)<\/metadata>/g)];
 assert.equal(blocks.length,1,'Each published SVG carries one evidence record');
 return JSON.parse(blocks[0][1].replaceAll('&quot;','"').replaceAll('&gt;','>').replaceAll('&lt;','<').replaceAll('&amp;','&'));
};
assert.deepEqual(approvals.map(r=>r.order),[1,2,3,4,5,6,7,8,9]);
assert.deepEqual(receipt.batch.map(r=>r.order),[1,2,3,4,5,6,7,8,9]);
assert.equal(new Set(approvals.map(r=>r.id)).size,9);
assert.deepEqual(receipt.pending,[]);
assert.equal(receipt.totalPublishedSourceDrawings,29);
assert.equal(adoption.userInstruction,'见过这些图更新到教材项目中');
assert.equal(adoption.requestedOn,'2026-11-01');
assert.equal(adoption.sourceRevision,revision);
assert.equal(adoption.assets.length,10);
assert.deepEqual(adoption.newApprovals,approvals.filter(r=>r.order>=4&&r.order<=8));
for(const approval of approvals){
 const record=published[approval.id];assert(record);
 const publication=receipt.batch.find(r=>r.id===approval.id);assert(publication);
 assert.equal(publication.order,approval.order);
 assert.deepEqual(publication.approvedDrafts,approval.assets);
 assert.deepEqual(record.humanApproval,approval);
 assert.equal(record.nodeId,approval.id);
 assert.equal(record.publication.status,'published-teaching-reference');
 assert.equal(record.publication.formalReplacement,true);
 assert.equal(publication.path,record.path);assert.equal(publication.panel,record.panel.path);
 assert.equal(publication.unitId,record.knowledgeContext.unitId);
 const node=nodeDefinitions.find(n=>n.id===approval.id);assert(node?.diagram);
 assert.equal(publicUrlToFsPath(node.diagram.path),publicUrlToFsPath(record.path));
 if(adoptedDraftHashes[approval.id]){
  assert.equal(approval.sourceRevision,revision);assert.equal(record.revision,revision);
  assert.equal(approval.approvedOn,'2026-11-01');assert.equal(record.publishedOn,approval.approvedOn);
  assert.equal(approval.approvalScope,'user-authorized-teaching-integration');
  assert.equal(approval.technicalApproval,false,'Teaching adoption does not claim engineering approval');
  assert.equal(approval.authorization,'用户要求将当前五张新版图更新到教材项目中；这记录教学采用授权，不代替工程技术审定。');
  assert.equal(approval.review,'audit-output/roof-clean-line-review-2026-11-01/independent-review.md');
  assert.equal(record.technicalReview.status,'native-clean-line-awaiting-human-review');
 }else{
  assert(previousPublishedHashes[approval.id]);
  assert.equal(approval.approval,'user-approved');assert.equal(approval.revision,'roof-batch1-r1');
 }
 for(const mode of ['textbook','node']){
  const draft=await readFile(root+'/'+approval.assets[mode].path,'utf8'),asset=await readFile('public'+(mode==='node'?record.panel.path:record.path),'utf8');
  assert.equal(sha(draft),approval.assets[mode].sha256,'Authorized draft is immutable');
  assert.deepEqual(metadata(asset),record,'Both published layouts carry the actual publication evidence');
  assert.equal(noMetadata(draft),noMetadata(asset),'Published geometry, annotations, layout and styles remain exactly approved');
  assert.equal(sha(asset),publication.publishedHashes[mode]);
  if(adoptedDraftHashes[approval.id]){
   assert.equal(sha(draft),adoptedDraftHashes[approval.id][mode],'The exact reviewed r4 draft is adopted');
   const adopted=adoption.assets.filter(a=>a.id===approval.id&&a.mode===mode);assert.equal(adopted.length,1);
   assert.equal(adopted[0].sha256,sha(draft));
  }else assert.equal(sha(asset),previousPublishedHashes[approval.id][mode],'Previously published roof drawings remain byte-identical');
 }
}
console.log('Nine exact authorized roof pairs published; five r4 adoptions, shared evidence, zero pending and four immutable prior pairs passed.');
