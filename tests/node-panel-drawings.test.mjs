import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {wallSourceDetails} from '../scripts/lib/source-wall-details.mjs';
import {panelGeometry} from '../scripts/lib/node-panel-drawings.mjs';

const records=JSON.parse(await readFile('src/data/sourceDrawingEvidence.json','utf8'));
const layouts=JSON.parse(await readFile('src/data/nodeDiagramLayouts.json','utf8'));
const expectedLabels={'construction-column-01':6,'window-wall-gap-sealing-01':5,'foam-insulation-01':7,'rockwool-insulation-01':7};
for(const def of wallSourceDetails){
 const record=records[def.nodeId],panel=record.panel;
 assert.deepEqual(layouts.find(item=>item.path===record.path),{path:record.path,panel:panel.path});
 const svg=await readFile('public'+panel.path,'utf8');
 const parts=panelGeometry(def);
 assert.equal(createHash('sha256').update(JSON.stringify(parts)).digest('hex'),panel.sourceGeometryDigest);
 // Every construction path is reused byte-for-byte, including the corrected
 // four cut bars, hoop and the two tie bars in each wall direction.
 for(const part of Object.values(parts))assert(svg.includes(part));
 assert(!/<image\b|<script\b|<foreignObject\b/i.test(svg));
 assert.equal(panel.width,620);assert(panel.height>panel.width);
 const labels=[...svg.matchAll(/data-panel-label="(\d+)"/g)].map(match=>+match[1]);
 const callouts=[...svg.matchAll(/data-panel-callout="(\d+)"/g)].map(match=>+match[1]);
 const n=expectedLabels[def.nodeId]??4;
 assert.deepEqual(labels.sort((a,b)=>a-b),Array.from({length:n},(_,i)=>i+1));
 assert.deepEqual(callouts.sort((a,b)=>a-b),labels,'Every construction label has one matching drawing callout');
 const canonical=await readFile('public'+record.path,'utf8');
 assert(canonical.includes('width="1400"')&&canonical.includes('height="1120"'),'Textbook full sheets keep their established layout');
 assert(canonical.includes(def.body()),'The checked original sheet geometry is preserved');
 if(def.nodeId==='construction-column-01'){
  assert.equal([...svg.matchAll(/data-role="column-longitudinal-section"/g)].length,4);
  assert.equal([...svg.matchAll(/data-role="column-stirrup"/g)].length,1);
  assert.equal([...svg.matchAll(/data-role="tie-y"/g)].length,2);
  assert.equal([...svg.matchAll(/data-role="tie-x"/g)].length,2);
 }
}
console.log('7 portrait node plates: identical checked construction paths, complete numbered labels, corrected reinforcement and unchanged textbook sheets passed.');
