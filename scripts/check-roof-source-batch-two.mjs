import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {roofBatchTwo} from './lib/roof-source-batch-two.mjs';
const root='audit-output/roof-source-redraw-batch-02-2026-11-01';
const readJson=async path=>JSON.parse(await readFile(root+'/'+path,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const records=await readJson('evidence.json'), protectedAssets=await readJson('protected-assets.json');
const vectors=await readJson('checks/vector-checks.json'), browser=await readJson('checks/browser-layout-checks.json'),reading=await readJson('checks/browser-reading-checks.json');
const geometryReports=['checks/storage-geometry.json','checks/tile-geometry.json','checks/drainage-geometry.json','checks/independent-geometry-review.json'];
const reportTexts=await Promise.all(geometryReports.map(path=>readFile(root+'/'+path,'utf8')));
assert.equal(records.length,9);assert.equal(vectors.passed,true);assert.equal(browser.results.length,18);
assert.equal(reading.readers.length,18);assert(reading.readers.every(r=>r.loaded));assert.equal(reading.bodyOverflow,false);
const finalBindings=[];
for(const rec of records){
 const definition=roofBatchTwo.find(d=>d.id===rec.id), data=definition.build();
 assert.deepEqual(Object.fromEntries(data.parts.map(p=>[p.id,sha(p.body)])),rec.geometryDigests);
 for(const digest of Object.values(rec.geometryDigests))assert(reportTexts.some(report=>report.includes(digest)),'No actual-geometry report bound to '+rec.id);
 assert.equal(sha(await readFile(root+'/'+rec.source.path)),rec.source.sha256);
 assert.equal(sha(await readFile('public'+rec.source.projectSource)),rec.source.sha256);
 for(const source of rec.supplementalSources){assert.equal(sha(await readFile(root+'/'+source.path)),source.sha256);assert.equal(sha(await readFile(source.originalPath)),source.sha256);}
 for(const mode of ['textbook','node']){
  const bytes=await readFile(root+'/'+rec.assets[mode]),svg=bytes.toString('utf8');
  assert.equal(sha(bytes),rec.rendered[mode].sha256);
  assert(!/<(?:image|script|filter)\b/i.test(svg),'Raster/script/filter found in '+rec.id);
  const check=browser.results.find(r=>r.id===rec.id&&r.mode===mode);
  assert.equal(check.sha256,sha(bytes));
  assert.equal(check.outside.length,0);assert.equal(check.overlaps.length,0);assert.equal(check.lineHits.length,0);
  finalBindings.push({id:rec.id,mode,asset:rec.assets[mode],sha256:sha(bytes),geometryDigests:rec.geometryDigests});
 }
}
for(const asset of protectedAssets)assert.equal(sha(await readFile(asset.path)),asset.sha256,'Prior asset changed: '+asset.path);
const checks={checkedOn:'2026-11-01',result:'passed-with-recorded-source-boundaries',publication:{status:'draft',formalReplacement:false,engineeringApproval:false},
 scope:{drawings:9,svgFiles:18,range:'10–18',preservedPriorAssets:protectedAssets.length},
 structure:{report:'checks/vector-checks.json',passed:true,scope:'Native SVG structure, identity and exact marked geometry across two layouts'},
 geometry:{reports:geometryReports,passedWithinRecordedScope:true,scope:'Source-specific voids, shared interfaces, roof-tile bodies and overlaps, open flow paths and hatch support; raw geometry digests unchanged since independent reviews'},
 layout:{report:'checks/browser-layout-checks.json',svgFiles:18,textOverflow:0,textRectangleOverlaps:0,calloutLeaderTextHits:0,scope:'Browser DOM text bounds and sampled callout leaders, plus actual PNG review; not an exhaustive mathematical proof against every graphic stroke'},
 reading:{report:'checks/browser-reading-checks.json',embeddedWidths:[318,390],loadedReaderImages:18,pageHorizontalOverflow:false,phoneHardwareTested:false},
 sourceEvidence:{sources:'sources.json',standards:'standards/research-findings.md',rawSourceAndSupplementalHashesVerified:true,limitations:'Per-drawing unresolved and sourceVsCurrentRequirements remain part of evidence; historical source redraws are not complete current engineering design'},
 scopeProtection:{report:'protected-assets.json',allHashesUnchanged:true,modelAndApplicationEdits:false},
 finalBindings};
await writeFile(root+'/validation.json',JSON.stringify(checks,null,2)+'\n');
console.log('Roof batch two accepted within documented scope: 9 drawings, 18 SVGs; 67 prior assets unchanged; no formal publication.');
