import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='audit-output/wall-source-redraw-next-2026-10-29';
const records=JSON.parse(await readFile(root+'/evidence.json','utf8'));
assert.equal(records.length,13);
for(const record of records){
 const bytes=await readFile('public'+record.source.path);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),record.source.sha256,'The original drawing remains recoverable');
 assert(record.knowledgeContext.knowledgeId&&record.references.length);
 assert(record.parameters.every(p=>p.kind==='source-example'));
 for(const mode of ['textbook','node']){
  const svg=await readFile(root+'/'+record.assets[mode],'utf8');
  assert(!/<image\b|<script\b|<foreignObject\b/.test(svg));
  for(const id of Object.keys(record.geometryDigests))assert(svg.includes('data-geometry-id="'+id+'"'));
  assert.equal([...svg.matchAll(/data-callout-id="/g)].length,[...svg.matchAll(/data-label-id="/g)].length);
  if(record.id==='frame-structure-layout-01')assert.equal([...svg.matchAll(/data-role="frame-column"/g)].length,28);
  if(record.id==='wall-bearing-semi-frame-01')assert.equal([...svg.matchAll(/data-role="interior-column"/g)].length,7);
  if(record.id==='hollow-block-forms-01')assert.equal([...svg.matchAll(/data-role="block-hole"/g)].length,20,'2+3+4+11 source holes');
  if(record.id==='block-wall-core-column-01'){
   const traced=JSON.parse(await readFile('scripts/lib/core-column-source-contours.json','utf8'));
   assert.equal(traced.sourceSha256,record.source.sha256);
   for(const part of traced.parts){
    assert(svg.includes(part.path),'Source-derived contours are reused without approximate block geometry');
    assert(part.fidelity.intersectionOverUnion>.90,'Contour check is only a source-fidelity check');
   }
   assert.equal([...svg.matchAll(/data-source-annotation=/g)].length,4);
   assert(svg.includes('灌 C15 细石混凝土'));
  }
  if(record.id==='passive-solar-wall-01')assert.equal([...svg.matchAll(/data-role="solar-opening"/g)].length,2);
  if(['faced-plinth-01','plaster-plinth-01'].includes(record.id))assert.equal([...svg.matchAll(/data-role="horizontal-damp-proofing"/g)].length,1);
  if(record.id==='stone-plinth-01')assert(!svg.includes('data-role="horizontal-damp-proofing"'),'No invented DPC geometry where the source has none');
  if(record.id.includes('apron')){
   for(const role of ['joint-sealant','joint-filler','wall-waterproofing','outward-slope'])assert.equal([...svg.matchAll(new RegExp('data-role="'+role+'"','g'))].length,1);
   const a=record.geometryAnchors;
   const tag=role=>svg.match(new RegExp('<(?:path|rect)\\b[^>]*data-role="'+role+'"[^>]*>'))?.[0];
   const attr=(s,k)=>Number(s.match(new RegExp(' '+k+'="([^"]+)"'))?.[1]);
   const points=s=>s.match(/ d="([^"]+)"/)[1].match(/-?\d+(?:\.\d+)?/g).map(Number);
   const close=(x,y)=>assert(Math.abs(x-y)<1e-6,`${x} must meet ${y}`);
   const ground=points(tag('outside-ground'));
   close(ground[0],a.surfaceEdge[0]);close(ground[1],a.outsideGrade[1]);close(ground[3],a.outsideGrade[1]);
   assert(a.outsideGrade[1]>a.surfaceEdge[1],'Outside grade is below the apron edge, not flush with it');
   const seal=tag('joint-sealant'),filler=tag('joint-filler');
   close(attr(seal,'y'),a.surfaceAtWall[1]);
   close(attr(seal,'y')+attr(seal,'height'),attr(filler,'y'));
   close(attr(filler,'y')+attr(filler,'height'),a.surfaceBottomAtStart[1]);
   const cushion=points(tag('apron-cushion'));
   close(cushion[1],a.surfaceBottomAtStart[1]);close(cushion[3],a.baseTopAtEnd[1]);close(cushion[4],a.baseBottomAtEnd[1]);
   const transform=svg.match(/data-layout="[^"]+" transform="translate\(([^ ]+) ([^)]+)\) scale\(([^)]+)\)"/).slice(1).map(Number);
   const chain=record.id==='stone-apron-01'?[a.surfaceEdge[1],a.outsideGrade[1],a.returnFoot[1]]:[a.surfaceEdge[1],a.outsideGrade[1],a.baseTopAtEnd[1],a.baseBottomAtEnd[1]];
   for(let i=0;i<chain.length-1;i++){
    const line=svg.match(new RegExp('<g data-dimension-id="outer-height-'+i+'"[^>]*>(<path[^>]+>)'))[1];
    const p=points(line);close(p[1],transform[1]+chain[i]*transform[2]);close(p[3],transform[1]+chain[i+1]*transform[2]);
   }
  }
 }
}
console.log('13 wall originals and 26 vectors: original hashes, view/component counts, source parameter identity, knowledge mappings and specified construction invariants passed.');
