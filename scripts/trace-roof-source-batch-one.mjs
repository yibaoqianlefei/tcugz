// Controlled contour tracing: the supplied source determines every construction edge.
// Masks isolate the drawing from its raster typography; no engineering size is measured.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const require=createRequire(import.meta.url);
const {Potrace}=require('../tmp/vector-tools/node_modules/potrace');
const root='audit-output/roof-source-redraw-batch-01-2026-10-30';
const out=root+'/correction-2026-11-01';
const sha=s=>createHash('sha256').update(s).digest('hex');
// Coordinates below are source-image pixels. The white masks touch only the
// external part of old leaders, not material interfaces or construction edges.
const sources=[
 {id:'coating-parapet-flashing-01',file:'coating-parapet-flashing-diagram.png',
  polygons:['55,28 151,28 151,182 279,182 279,247 145,247 145,267 55,267'],
  white:[{x:173,y:180,w:5,h:7}],
  retainedLeaders:[{name:'水泥钉',object:[119,129],exit:[61,129]},{name:'防水油膏嵌缝',object:[140,211],exit:[174,247]}],
  criticalRegions:[{id:'termination',box:[111,100,39,35]},{id:'local-additional-sheet',box:[130,173,71,29]},{id:'slab-wall-joint',box:[127,192,40,53]}]},
 {id:'coating-high-low-roof-flashing-01',file:'coating-high-low-roof-flashing-diagram.png',
  polygons:['68,2 141,2 141,109 149,140 210,142 210,157 194,157 194,205 282,205 286,269 146,269 146,308 68,308'],
  white:[],retainedLeaders:[{name:'嵌缝油膏',object:[118,119],exit:[69,119]},{name:'水泥钉（收头处）',object:[123,126],exit:[69,150]}],
  criticalRegions:[{id:'upper-fixed-cap-edge',box:[115,61,37,84]},{id:'u-fold',box:[121,109,79,85]},{id:'upstand-slab-interface',box:[141,209,49,24]}]},
 {id:'straight-rainwater-outlet-65-01',file:'straight-rainwater-outlet-65-diagram.png',
  polygons:['136,66 293,66 293,134 405,134 409,217 272,217 247,315 247,364 185,364 185,315 158,217 24,217 24,133 136,133'],
  white:[{x:160,y:232,w:11,h:22}],retainedLeaders:[{name:'油膏嵌缝',object:[97,141],exit:[97,134]},{name:'定型铸铁水落口',object:[223,107],exit:[292,107]},{name:'1∶2.5 水泥砂浆',object:[150,205],exit:[150,216]}],
  criticalRegions:[{id:'cup-and-recess',box:[108,137,216,73]},{id:'source-horizontal-visible-edge',box:[170,184,91,15]},{id:'pipe-end',box:[182,309,68,57]}]},
 {id:'straight-rainwater-outlet-cast-iron-01',file:'straight-rainwater-outlet-cast-iron-diagram.png',
  polygons:['132,82 222,82 222,130 328,121 328,216 224,216 224,274 134,274 134,216 30,216 30,111 132,132'],
  white:[],retainedLeaders:[{name:'油膏嵌缝',object:[238,140],exit:[238,128]},{name:'1∶2.5 水泥砂浆',object:[134,200],exit:[125,214]}],
  criticalRegions:[{id:'wire-net-open-tail',box:[149,157,54,43]},{id:'waterproof-collar',box:[98,132,165,75]}]},
 {id:'free-fall-ring-beam-eaves-01',file:'free-fall-ring-beam-eaves-01-diagram.png',
  polygons:['17,71 534,71 534,152 401,152 401,305 290,305 290,126 33,126 33,87 17,87'],
  white:[],retainedLeaders:[],
  criticalRegions:[{id:'nose-and-drip',box:[17,71,29,29]},{id:'reinforcement-and-isolation',box:[45,73,437,25]},{id:'three-whole-voids',box:[396,99,137,53]},{id:'beam-wall-interface',box:[293,180,109,18]}]}
];
const traceScale=4;
const parameters={threshold:135,turdSize:5,alphaMax:.65,optCurve:true,optTolerance:.08};
await mkdir(out,{recursive:true});
// Preserve the rejected drafts and their evidence exactly, once only.
await mkdir(out+'/rejected-r1',{recursive:true});
for(const s of sources)for(const mode of ['textbook','node']){
 const target=out+'/rejected-r1/'+mode+'-'+s.id+'.svg';
 if(!await readFile(target).then(()=>true).catch(()=>false))await copyFile(root+'/'+mode+'/'+s.id+'.svg',target);
}
for(const f of ['evidence.json','browser-layout-checks.json','clearance-checks.json','validation-summary.json']){
 const target=out+'/rejected-r1/'+f;
 if(!await readFile(target).then(()=>true).catch(()=>false))await copyFile(root+'/'+f,target);
}
const records=[];
for(const s of sources){
 const original=await readFile('public/images/roof/'+s.file),info=await sharp(original).metadata();
 const mask=Buffer.from(`<svg width="${info.width}" height="${info.height}">${s.polygons.map(points=>`<polygon points="${points}" fill="white"/>`).join('')}</svg>`);
 const clipped=await sharp(original).ensureAlpha().composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
 const trim=await sharp(clipped).flatten({background:'white'}).png().toBuffer();
 const clean=await sharp(trim).composite([{input:Buffer.from(`<svg width="${info.width}" height="${info.height}">${s.white.map(r=>`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="white"/>`).join('')}</svg>`)}]).png().toBuffer();
 await writeFile(`${out}/${s.id}-source-clean.png`,clean);
 const tracer=new Potrace(parameters);
 const tracingInput=await sharp(clean).resize({width:info.width*traceScale,kernel:'lanczos3'}).png().toBuffer();
 await new Promise((resolve,reject)=>tracer.loadImage(tracingInput,err=>err?reject(err):resolve()));
 const path=`<g transform="scale(${1/traceScale})">${tracer.getPathTag('#202831')}</g>`;
 const vector=`<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}" viewBox="0 0 ${info.width} ${info.height}"><rect width="100%" height="100%" fill="white"/>${path}</svg>`;
 await writeFile(`${out}/${s.id}-contours.svg`,vector);
 const render=await sharp(Buffer.from(vector)).png().toBuffer();
 const [a,b]=await Promise.all([sharp(clean).greyscale().removeAlpha().raw().toBuffer(),sharp(render).greyscale().removeAlpha().raw().toBuffer()]);
 const stats=box=>{let intersection=0,union=0;for(let y=box[1];y<Math.min(info.height,box[1]+box[3]);y++)for(let x=box[0];x<Math.min(info.width,box[0]+box[2]);x++){const i=y*info.width+x,A=a[i]<parameters.threshold,B=b[i]<parameters.threshold;intersection+=A&&B;union+=A||B;}return {inkIoU:intersection/union,intersection,union};};
 const comparisonNative=await sharp({create:{width:info.width*2,height:info.height,channels:3,background:'white'}}).composite([{input:clean,left:0,top:0},{input:render,left:info.width,top:0}]).png().toBuffer();
 const comparison=await sharp(comparisonNative).resize({width:1600}).png().toBuffer();
 await writeFile(`${out}/${s.id}-source-vector.png`,comparison);
 for(const region of s.criticalRegions){region.fidelity=stats(region.box);const crop={left:region.box[0],top:region.box[1],width:region.box[2],height:region.box[3]};
  const pair=await sharp({create:{width:crop.width*2,height:crop.height,channels:3,background:'white'}}).composite([{input:await sharp(clean).extract(crop).png().toBuffer(),left:0,top:0},{input:await sharp(render).extract(crop).png().toBuffer(),left:crop.width,top:0}]).png().toBuffer();
  await sharp(pair).resize({width:1200}).png().toFile(`${out}/${s.id}-${region.id}.png`);
 }
 records.push({...s,path,sourceSha256:sha(original),sourceSize:[info.width,info.height],contourSha256:sha(path),fidelity:stats([0,0,info.width,info.height])});
}
const evidence={revision:'roof-batch1-r2-2026-11-01',method:'原图坐标受控轮廓矢量描摹；原文字、尺寸重新排版；材料图例、构造边、开口与细钢丝按原图保留。',tool:{name:'potrace',version:'2.1.8',traceScale,parameters},limitations:'掩膜和描摹须人工检查；IoU仅筛查像素轮廓保真，不等于构造正确率或规范合规率；扫描件未注明的规格不补造。',sources:records};
await writeFile('scripts/lib/roof-source-corrected-contours.json',JSON.stringify(evidence,null,2)+'\n');
await writeFile(out+'/contour-evidence.json',JSON.stringify(evidence,null,2)+'\n');
console.log(records.map(s=>({id:s.id,...s.fidelity})));
