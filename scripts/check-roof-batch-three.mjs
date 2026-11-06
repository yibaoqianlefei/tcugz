// Content/asset checks and a DOM-readable visual fixture; not engineering certification.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='audit-output/roof-source-redraw-batch-03-2026-11-03';
const sha=b=>createHash('sha256').update(b).digest('hex');
const records=JSON.parse(await readFile(root+'/evidence.json','utf8'));
const renders=JSON.parse(await readFile('public/images/node-renders/manifest.json','utf8')).renders;
const results=[];let fixture='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>第三组 · 标注净空检查</title><style>body{margin:20px;background:#f5f6f8;font:16px system-ui;color:#233047}.drawing{margin:28px 0;background:white;border:1px solid #ccd4df;width:max-content}.drawing>svg{display:block;max-width:none}h2{padding:14px}nav{margin:20px}</style><nav><a href="index.html">返回第三组</a></nav>';
for(const r of records){
 assert.equal(sha(await readFile('public/images/roof/'+r.source.path.split('/').pop())),r.source.sha256);
 assert.equal(sha(await readFile(r.model.path)),r.model.sha256);
 const mr=renders[r.id];
 const modelPreview=mr?.sourceSha256===r.model.sha256?mr.path:null;
 for(const mode of ['textbook','node']){
  const svg=await readFile(root+'/'+r.assets[mode],'utf8');
  assert(!/<image\b/.test(svg),'Raster in '+r.id);assert.equal(sha(svg),r.rendered[mode].sha256);
  const prefix=r.id+'-'+mode+'-';
  const inline=svg.replace(/\sid="([^"]+)"/g,(_,id)=>` id="${prefix}${id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${prefix}${id})`).replace(/href="#([^"]+)"/g,(_,id)=>`href="#${prefix}${id}"`).replace('aria-labelledby="drawing-title drawing-desc"',`aria-labelledby="${prefix}drawing-title ${prefix}drawing-desc"`);
  fixture+=`<section class="drawing" data-drawing="${r.id}" data-mode="${mode}" data-sha256="${r.rendered[mode].sha256}"><h2>${r.order} · ${mode}</h2>${inline}</section>`;
 }
 const check=JSON.parse(await readFile(root+'/checks/'+r.id+'-structure.json','utf8'));
 assert(check.passed);for(let i=0;i<2;i++)assert.equal(check.checks[i].sha256,r.rendered[i?'node':'textbook'].sha256,'Stale structural check '+r.id);
 results.push({id:r.id,sourceHashMatched:true,modelHashMatched:true,modelPreview,geometryPairPassed:true,meshNodes:r.model.meshNodes.length,assets:r.rendered});
}
await writeFile(root+'/visual-check.html',fixture+'</html>');
await writeFile(root+'/checks/asset-validation.json',JSON.stringify({scope:'源图和模型哈希、真实网格库存、原生SVG和双版标记几何；不证明构造合规',drawings:results},null,2));
console.log(JSON.stringify({drawings:results.length,svg:results.length*2,modelPreviews:results.filter(r=>r.modelPreview).length,passed:true}));
