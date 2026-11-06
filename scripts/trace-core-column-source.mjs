// Reproduce the checked vector contours from the supplied raster, without inventing
// masonry edges. The optional tracing dependency is installed only in tmp/vector-tools.
import {createRequire} from 'node:module';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const require=createRequire(import.meta.url);
const {Potrace}=require('../tmp/vector-tools/node_modules/potrace');
const source='public/images/wall/block-wall-core-column-01.png';
const original=await readFile(source);
const out='audit-output/wall-source-redraw-next-2026-10-29/core-correction';
await mkdir(out,{recursive:true});
// Only raster lettering is removed. The existing leaders, masonry contours,
// visible cell ribs, bar segments and core openings are all retained.
const parts=[
 {id:'corner-core',crop:{left:0,top:0,width:560,height:680},
  textMasks:[{x:238,y:33,w:247,h:52},{x:210,y:597,w:335,h:53}],
  annotations:[{x:245,y:77,text:'2Φ12 通长筋'},{x:215,y:642,text:'灌 C15 细石混凝土'}]},
 {id:'tee-core',crop:{left:580,top:0,width:730,height:680},
  textMasks:[{x:363,y:36,w:251,h:53},{x:337,y:602,w:344,h:55}],
  annotations:[{x:373,y:82,text:'2Φ12 通长筋'},{x:343,y:651,text:'灌 C15 细石混凝土'}]}
];
const parameters={threshold:145,turdSize:6,alphaMax:1,optCurve:true,optTolerance:0.15};
const records=[];
for(const part of parts){
 const mask=`<svg width="${part.crop.width}" height="${part.crop.height}">${part.textMasks.map(r=>`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="white"/>`).join('')}</svg>`;
 const clean=await sharp(original).extract(part.crop).composite([{input:Buffer.from(mask)}]).png().toBuffer();
 await writeFile(`${out}/${part.id}-source-clean.png`,clean);
 const tracer=new Potrace(parameters);
 await new Promise((resolve,reject)=>tracer.loadImage(clean,err=>err?reject(err):resolve()));
 const path=tracer.getPathTag('#202831');
 const vector=`<svg xmlns="http://www.w3.org/2000/svg" width="${part.crop.width}" height="${part.crop.height}" viewBox="0 0 ${part.crop.width} ${part.crop.height}"><rect width="100%" height="100%" fill="white"/>${path}</svg>`;
 await writeFile(`${out}/${part.id}-contours.svg`,vector);
 const rendered=await sharp(Buffer.from(vector)).removeAlpha().greyscale().raw().toBuffer();
 const pixels=await sharp(clean).greyscale().removeAlpha().raw().toBuffer();
 let intersection=0,union=0,sourceBlack=0,renderedBlack=0;
 for(let i=0;i<pixels.length;i++){const a=pixels[i]<parameters.threshold,b=rendered[i]<parameters.threshold;sourceBlack+=a;renderedBlack+=b;intersection+=a&&b;union+=a||b;}
 const fidelity={threshold:parameters.threshold,intersectionOverUnion:intersection/union,sourceInkPixels:sourceBlack,vectorInkPixels:renderedBlack,scope:'同一原图坐标下的轮廓像素检查；不代表构造技术或规范审定。'};
 const comparison=await sharp({create:{width:part.crop.width*2,height:part.crop.height,channels:3,background:'white'}}).composite([{input:clean,left:0,top:0},{input:await sharp(Buffer.from(vector)).png().toBuffer(),left:part.crop.width,top:0}]).png().toBuffer();
 await writeFile(`${out}/${part.id}-source-vector.png`,comparison);
 records.push({...part,path,fidelity,contourSha256:createHash('sha256').update(path).digest('hex')});
}
const result={source,sourceSha256:createHash('sha256').update(original).digest('hex'),method:'源图构造线轮廓矢量描摹；仅清除原文字并重新排字，未概括或重组砌块形体。',tool:{name:'potrace',version:'2.1.8',parameters},parts:records};
await writeFile('scripts/lib/core-column-source-contours.json',JSON.stringify(result,null,2)+'\n');
await writeFile(`${out}/contour-evidence.json`,JSON.stringify(result,null,2)+'\n');
console.log(records.map(r=>({id:r.id,...r.fidelity})));
