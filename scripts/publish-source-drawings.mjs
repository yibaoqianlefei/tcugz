import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {xml} from './lib/source-wall-details.mjs';
import {wallSourceDetails} from './lib/source-wall-details.mjs';
import {nodePanelSvg} from './lib/node-panel-drawings.mjs';

const draftRoot='audit-output/source-drawing-redraw-2026-10-29';
const drafts=JSON.parse(await readFile(draftRoot+'/evidence.json','utf8'));
const checks=JSON.parse(await readFile(draftRoot+'/browser-geometry-checks.json','utf8'));
// Publishing this batch must not erase subsequently accepted drawing batches.
const published=JSON.parse(await readFile('src/data/sourceDrawingEvidence.json','utf8').catch(()=> '{}'));
let publishedCount=0;
await mkdir('public/images/learning',{recursive:true});
for(const draft of drafts){
 const check=checks.find(item=>item.id===draft.id);
 assert(check&&check.revision===draft.revision&&check.geometryDigest===draft.geometryDigest&&!check.clipped.length,'Only the checked drawing version can be used: '+draft.id);
 const original=await readFile('public'+draft.original.path);
 assert.equal(createHash('sha256').update(original).digest('hex'),draft.original.sha256);
 const svg=await readFile(`${draftRoot}/drawings/${draft.id}.svg`,'utf8');
 assert(!/<image\b|<script\b|<foreignObject\b/i.test(svg));
 const size=svg.match(/<svg\b[^>]*\bwidth="(\d+)"[^>]*\bheight="(\d+)"/);
 assert(size&&Number(size[1])>0&&Number(size[2])>0);
 const record={...draft,nodeId:draft.id,path:`/images/learning/${draft.id}.svg`,
  width:Number(size[1]),height:Number(size[2]),
  status:'source-based',reviewStatus:draft.status,replacesOriginal:true,
  usage:'teaching-reference',publishedOn:'2026-10-29'};
 const def=wallSourceDetails.find(item=>item.nodeId===draft.id);
 assert(def);
 const panel=nodePanelSvg(def,record,svg);
 record.panel={path:`/images/learning/node-panels/${draft.id}.svg`,width:panel.width,height:panel.height,sourceGeometryDigest:panel.sourceGeometryDigest};
 const panelAsset=nodePanelSvg(def,record,svg).svg;
 await mkdir('public/images/learning/node-panels',{recursive:true});
 await writeFile('public'+record.panel.path,panelAsset);
 const asset=svg.replace(/<metadata>[\s\S]*?<\/metadata>/,`<metadata>${xml(JSON.stringify(record))}</metadata>`);
 await writeFile('public'+record.path,asset);
 published[record.id]=record;
 publishedCount++;
}
assert.equal(publishedCount,7);
await writeFile('src/data/sourceDrawingEvidence.json',JSON.stringify(published,null,2)+'\n');
// Keep detailed source/standard records out of the interactive viewer bundle.
await writeFile('src/data/nodeDiagramLayouts.json',JSON.stringify(Object.values(published).map(record=>({path:record.path,panel:record.panel.path})),null,2)+'\n');
console.log('Published 7 source-based teaching drawings and 7 portrait node-panel layouts; original construction paths and full evidence retained.');
