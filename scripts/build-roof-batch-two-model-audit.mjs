import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {nodeDefinitions} from '../src/data/nodeDefinitions.ts';
import {roofBatchTwo} from './lib/roof-source-batch-two.mjs';
const root='audit-output/roof-batch-two-model-audit-2026-11-01';
await mkdir(root+'/previews',{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const renders=JSON.parse(await readFile('public/images/node-renders/manifest.json','utf8')).renders;
const drawingRoot='audit-output/roof-source-redraw-batch-02-2026-11-01';
const drawings=JSON.parse(await readFile(drawingRoot+'/evidence.json','utf8'));
const catalog=[];
for(const d of roofBatchTwo){
 const n=nodeDefinitions.find(n=>n.id===d.id),file='public'+n.model.path,bytes=await readFile(file),digest=sha(bytes),r=renders[d.id],drawing=drawings.find(r=>r.id===d.id);
 catalog.push({id:d.id,title:n.title,modelSource:n.model.path,modelFile:file,modelSha256:digest,
  modelBytes:bytes.length,description:n.description,layers:n.layerConfig.layers,groups:n.model.groups??{},
  storedRender:r?.sourceSha256===digest?{path:'/'+r.path,poseTime:r.poseTime,poseCandidates:r.poseCandidates,shaMatched:true}:null,
  original:'/'+drawingRoot+'/'+drawing.source.path,drawing:'/'+drawingRoot+'/'+drawing.assets.textbook,
  panel:'/'+drawingRoot+'/'+drawing.assets.node,drawingHashes:drawing.rendered,knowledgeContext:drawing.knowledgeContext});
}
await writeFile(root+'/catalog.json',JSON.stringify({checkedOn:'2026-11-01',scope:'Read-only audit of actual GLBs, current cards and source-based SVGs',nodes:catalog},null,2)+'\n');
const protectedPaths=[...catalog.map(n=>n.modelFile),'src/data/nodeDefinitions.ts','src/data/sourceDrawingEvidence.json','src/data/nodeDiagramLayouts.json',
 ...drawings.flatMap(r=>Object.values(r.assets).map(a=>drawingRoot+'/'+a)),drawingRoot+'/evidence.json'];
const protectedFile=root+'/protected-assets.json';
let protectedAssets;try{protectedAssets=JSON.parse(await readFile(protectedFile,'utf8'));}catch{protectedAssets=await Promise.all(protectedPaths.map(async path=>({path,sha256:sha(await readFile(path))})));await writeFile(protectedFile,JSON.stringify(protectedAssets,null,2)+'\n');}
for(const entry of protectedAssets)if(sha(await readFile(entry.path))!==entry.sha256)throw new Error('Audit altered protected asset: '+entry.path);
await writeFile(root+'/viewer.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>屋顶第二组 · 图模构件审核</title><style>*{box-sizing:border-box}body{margin:0;background:#f6f7fa;color:#202d46;font:15px/1.7 system-ui}header{padding:18px 25px;background:white;border-bottom:1px solid #d7dfed}h1{font-size:25px;margin:8px 0}a{color:#465b96}nav,.controls{display:flex;gap:15px;flex-wrap:wrap;align-items:center}select,button{font:inherit;padding:7px 10px;color:#324775;background:white;border:1px solid #cad4e7;border-radius:4px}main{padding:20px;display:grid;grid-template-columns:minmax(480px,1.1fr) minmax(380px,1fr);gap:20px}.panel{background:white;border:1px solid #d8dfeb;padding:15px}canvas{width:100%;height:auto;display:block}img{width:100%;height:auto;display:block}.meta{color:#67758d;font-size:13px;overflow-wrap:anywhere}h2{font-size:18px}pre{font:12px/1.5 monospace;white-space:pre-wrap;max-height:280px;overflow:auto}table{width:100%;border-collapse:collapse;font-size:13px}td,th{padding:7px;border-bottom:1px solid #e0e5ee;text-align:left}details{padding:12px 0}#status{color:#465b96}@media(max-width:980px){main{grid-template-columns:1fr}}</style><header><nav><a href="index.html">审核结论</a><a href="../roof-source-redraw-batch-02-2026-11-01/index.html">原图重绘稿</a></nav><h1>屋顶第二组 · 真实模型构件核对</h1><p class="meta">读取当前GLB，保留原材质。装配、独立构件与正投影视图用于识读；模型尺寸只记录模型自身，不作为规范设计取值。</p><div class="controls"><label>节点 <select id="node"></select></label><label>构件 <select id="part"><option value="all">全部构件</option></select></label><label>姿态 <select id="pose"><option value="assembly">装配态</option><option value="default">原始默认态</option><option value="end">动画终态</option></select></label><label>视角 <select id="view"><option value="iso">轴测</option><option value="side">侧视 Z</option><option value="front">正视 X</option><option value="top">俯视</option></select></label><button id="fit">适配当前构件</button></div><p id="status">加载模型…</p></header><main><section class="panel"><h2 id="model-title">实际GLB</h2><div id="stage"></div><p id="model-source" class="meta"></p><details><summary>实际网格与知识卡</summary><table><thead><tr><th>网格</th><th>三角面</th><th>知识卡</th></tr></thead><tbody id="mesh-table"></tbody></table></details><details><summary>当前构件空间范围</summary><pre id="measurement"></pre></details></section><section class="panel"><h2>原图重绘 · 教材版</h2><a id="drawing-link" target="_blank"><img id="drawing" alt="原图重绘教材图"></a><details><summary>用户原图</summary><img id="original" alt="用户原图"></details></section></main><script type="module" src="./viewer.mjs"></script></html>`);
console.log('Model audit catalog built for '+catalog.length+' GLBs; protected '+protectedAssets.length+' files.');
