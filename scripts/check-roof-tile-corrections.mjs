import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {roofBatchTwo} from './lib/roof-source-batch-two.mjs';

const root='audit-output/roof-source-redraw-batch-02-2026-11-01';
const out='audit-output/roof-tiles-correction-2026-11-02';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const expect=(yes,message)=>{if(!yes)throw Error(message);};
const normalize=inputs=>Array.isArray(inputs)?inputs:Object.entries(inputs??{}).map(([path,data])=>({path,...(typeof data==='string'?{sha256:data}:data)}));
async function bindings(review){
 const inputs=normalize(review.inputs);
 expect(inputs.length>0,'Review has no input bindings');
 for(const f of inputs)expect(sha(await readFile(f.path))===f.sha256,'Stale review input '+f.path);
 return inputs.length;
}
const records=await json(out+'/evidence.json'),layouts=await json(out+'/checks/browser-layout.json');
const readers=await json(out+'/checks/browser-readers.json');
const baseline=await json(out+'/protected-assets.json');
for(const f of baseline)expect(sha(await readFile(f.path))===f.sha256,'Protected asset changed '+f.path);
const integration=await json(out+'/checks/integration-review.json');
expect(integration.status.startsWith('passed'),'Integration review not passed');
const integrationBindingCount=await bindings(integration);
const browserBindings=[];const sourceReviews=[];const vectors=[];
for(const record of records){
 const def=roofBatchTwo.find(d=>d.id===record.id),data=def.build();
 expect(record.sourceReconstruction.sha256===sha(await readFile(record.sourceReconstruction.module)),'Module changed '+record.id);
 expect(sha(await readFile(root+'/'+record.source.path))===record.source.sha256,'Archived source changed');
 expect(sha(await readFile('public'+record.source.projectSource))===record.source.sha256,'Project source changed');
 const review=await json(out+'/checks/'+record.order+'-independent-source-review.json');
 expect(review.status.startsWith('passed')&&(review.openRedrawIssues??[]).length===0,'Independent source issues '+record.id);
 sourceReviews.push({id:record.id,status:review.status,inputBindingsChecked:await bindings(review)});
 const vector=await json(out+'/checks/vector-'+record.id+'.json');
 expect(vector.passed&&vector.checks.length===2,'Invalid native vector '+record.id);
 vectors.push({id:record.id,passed:vector.passed,geometryDigests:vector.checks[0].geometryDigests});
 for(const mode of ['textbook','node']){
  const path=out+'/'+mode+'/'+record.id+'.svg',content=await readFile(path,'utf8'),digest=sha(content);
  expect(record.rendered[mode].sha256===digest,'SVG digest mismatch '+path);
  expect(sha(await readFile(root+'/'+record.assets[mode]))===digest,'Root review copy mismatch '+path);
  expect(vector.checks.some(c=>c.sha256===digest),'Stale vector review '+path);
  expect(data.parts.every(p=>content.includes(p.body)),'Final geometry diverges from source-reviewed module '+path);
  const layout=layouts.find(l=>l.id===record.id&&l.mode===mode);
  expect(layout&&layout.url.endsWith('/'+mode+'/'+record.id+'.svg'),'Missing browser layout '+path);
  expect(layout.outside.length===0&&layout.overlaps.length===0&&layout.lineHits.length===0,'Browser layout issue '+path);
  browserBindings.push({path,sha256:digest,mode,id:record.id});
 }
}
expect(layouts.length===6,'Expected six current layouts');
expect(readers.readers.length===6&&readers.readers.every(r=>r.loaded&&r.scrollWidth<=r.width),'Reader loading or overflow');
expect(readers.documentWidth<=readers.width&&readers.images.every(i=>i.loaded),'Report overflow or missing images');
const old=await json(out+'/before/evidence.json'),current=await json(root+'/evidence.json');
for(const record of old.filter(r=>!records.some(n=>n.id===r.id)))expect(JSON.stringify(record)===JSON.stringify(current.find(r=>r.id===record.id)),'Non-target evidence changed '+record.id);

// Resolve local report/view resources without relying on a successful Vite
// fallback response (which could return index.html for a missing SVG).
const pages=[out+'/index.html',...records.map(r=>root+'/view/'+r.id+'.html')];
const links=[];
for(const page of pages){
 const html=await readFile(page,'utf8');
 for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
  const href=match[1];if(/^(https?:|data:|mailto:)/.test(href))continue;
  const clean=href.split(/[?#]/)[0];if(!clean)continue;
  const path=clean.startsWith('/')?resolve('public',clean.slice(1)):resolve(dirname(page),clean);
  // The report links to the validation file produced at the end of this run.
  if(path!==resolve(out,'validation.json'))await access(path);
  links.push({page,href,path});
 }
}
await writeFile(out+'/checks/browser-bindings.json',JSON.stringify({checkedOn:'2026-11-02',scope:'DOM text/leader clearances plus embedded 318/390px readers; not a mobile-device run',svgInputs:browserBindings,layouts,readers},null,2)+'\n');
await writeFile(out+'/checks/local-resources.json',JSON.stringify(links,null,2)+'\n');
const validation={checkedOn:'2026-11-02',status:'passed-with-recorded-source-uncertainties-local-draft',ids:records.map(r=>r.id),protectedAssetCount:baseline.length,protectedAssetsUnchanged:true,sourceReviews,integrationBindingCount,vectors,browserLayoutCount:layouts.length,embeddedReaderCount:readers.readers.length,localResourcesChecked:links.length,sourceReviewedGeometryMatchesFinalSvg:true,currentSvgHashes:browserBindings,formalPublication:false,engineeringApproval:false,note:'本次只修订12～14的原图重绘审阅稿；低清连墨处的隐藏瓦型、短轮廓材料、接触面积与完整固定方式仍未核定。规范沿用同日已读原文的适用范围，不新增现行通用工程做法。'};
await writeFile(out+'/validation.json',JSON.stringify(validation,null,2)+'\n');
for(const link of links)await access(link.path);
console.log(JSON.stringify({status:validation.status,protected:baseline.length,sourceReviews:sourceReviews.length,svg:browserBindings.length,readers:readers.readers.length,resources:links.length}));
