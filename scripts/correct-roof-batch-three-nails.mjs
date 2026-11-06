import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {roofBatchThree} from './lib/roof-source-batch-three.mjs';
import {renderRoofBatchThree} from './lib/roof-source-batch-three-render.mjs';
const root='audit-output/roof-source-redraw-batch-03-2026-11-03';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const records=JSON.parse(fs.readFileSync(root+'/evidence.json','utf8'));
const ids=new Set(['high-low-roof-joint-01','high-low-roof-joint-02']);
const archive=root+'/history/r2-before-nail-correction';
if(!fs.existsSync(archive)){const names=fs.readdirSync(root).filter(n=>n!=='history');fs.mkdirSync(archive,{recursive:true});for(const n of names)fs.cpSync(root+'/'+n,archive+'/'+n,{recursive:true});}
const protectedBefore=records.filter(r=>!ids.has(r.id)).flatMap(r=>Object.values(r.assets).map(p=>({path:p,sha256:sha(fs.readFileSync(root+'/'+p))})));
const changes=[];
const archivedRecords=JSON.parse(fs.readFileSync(archive+'/evidence.json','utf8'));
for(const r of records.filter(r=>ids.has(r.id))){
 const def=roofBatchThree.find(d=>d.id===r.id),data=def.build();
 const before=structuredClone(r.rendered);
 r.revision=def.revision;r.geometryDigests=Object.fromEntries(data.parts.map(p=>[p.id,sha(p.body)]));
 r.technicalReview={status:'nail-correction-pending-visual-check',scope:'针对用户指出25/26水泥钉复查原图局部；原图未给钉径、钉长及锚深，不由绘图尺寸推算。'};
 r.nailCorrection={date:'2026-11-03',sourceCrop:'checks/nail-correction/'+r.id+'-source.png',description:r.order===25?'补回矮墙侧水泥钉，表达钉杆穿过收头进入墙体；槽口处消除钉头与收头的悬空。':'钉头移至薄钢板外表面，钉杆竖向穿过顶部各薄层进入矮墙。',unresolved:r.order===25?['槽口原图斜线与引线叠黑，当前横向钉及钉头朝向为待确认表达，不计为源图核验通过。']:[],engineeringDimensionsAdded:false};
 for(const mode of ['textbook','node']){const out=renderRoofBatchThree(def,data,r,mode);fs.writeFileSync(root+'/'+r.assets[mode],out.svg);await sharp(Buffer.from(out.svg)).png().toFile(root+'/previews/'+mode+'-'+r.id+'.png');r.rendered[mode]={sha256:sha(out.svg),width:out.width,height:out.height,graphicBox:out.graphicBox};}
 changes.push({id:r.id,order:r.order,before:archivedRecords.find(a=>a.id===r.id).rendered,previousRender:before,after:r.rendered,correction:r.nailCorrection});
 // Keep the existing teaching context, update only the current asset version and review banner.
 const file=root+'/view/'+r.id+'.html';let html=fs.readFileSync(file,'utf8');
 for(const mode of ['textbook','node'])html=html.replaceAll(before[mode].sha256.slice(0,12),r.rendered[mode].sha256.slice(0,12));
 const banner='<section class="panel" id="nail-r3"><b>水泥钉专项修订 r3 · 待复核</b><p>'+r.nailCorrection.description+' '+r.nailCorrection.unresolved.join(' ')+'</p><a href="../nail-correction-r3.html">查看原图局部与修订对照</a></section>';
 if(html.includes('id="nail-r3"'))html=html.replace(/<section class="panel" id="nail-r3">[\s\S]*?<\/section>/,banner);else html=html.replace('<main>','<main>'+banner);
 fs.writeFileSync(file,html);
}
for(const p of protectedBefore)assert.equal(sha(fs.readFileSync(root+'/'+p.path)),p.sha256);
fs.writeFileSync(root+'/evidence.json',JSON.stringify(records,null,2)+'\n');
fs.writeFileSync(root+'/checks/nail-correction/changes.json',JSON.stringify({revision:'r3-nails',formalReplacement:false,changes,other12SvgUnchanged:protectedBefore},null,2)+'\n');
for(const name of ['index.html','correction-r2.html']){const file=root+'/'+name;let h=fs.readFileSync(file,'utf8');for(const c of changes)for(const mode of ['textbook','node'])h=h.replaceAll(c.previousRender[mode].sha256.slice(0,12),c.after[mode].sha256.slice(0,12));fs.writeFileSync(file,h);}
console.log('Updated only 25/26: 4 SVGs. Other 12 SVGs unchanged.');
