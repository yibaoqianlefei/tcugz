// Output-level QA: glyph/line intersections and numbered-symbol occlusion.
// This does not inspect engineering applicability or infer construction correctness.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='audit-output/wall-source-redraw-next-2026-10-29';
const records=JSON.parse(await readFile(root+'/evidence.json','utf8'));
const browser=JSON.parse(await readFile(root+'/browser-layout-checks.json','utf8'));
await mkdir(root+'/clearance',{recursive:true});
const withoutText=s=>s.replace(/<text\b[^>]*>[\s\S]*?<\/text>/g,'');
const withoutCallouts=s=>s.replace(/<g data-callout-id="\d+">[\s\S]*?<\/g>/g,'');
const ink=async s=>{const {data,info}=await sharp(Buffer.from(s)).ensureAlpha().raw().toBuffer({resolveWithObject:true});return {data,info};};
const dark=(d,i)=>d[i+3]>128&&(.2126*d[i]+.7152*d[i+1]+.0722*d[i+2])<190;
const results=[];
for(const record of records)for(const mode of ['textbook','node']){
 const svg=await readFile(root+'/'+record.assets[mode],'utf8');
 const bounds=browser.find(b=>b.title===mode+'-'+record.id);
 const textOnly=svg.replace(/<defs>[\s\S]*?<\/defs>/g,'').replace(/<(?:path|rect|circle)\b[^>]*\/>/g,'');
 const [letters,graphics,construction]=await Promise.all([ink(textOnly),ink(withoutText(svg)),ink(withoutCallouts(withoutText(svg)))]);
 const {width,height}=letters.info;
 const collisions=[];
 for(const b of bounds.boxes){let pixels=0;let minX=width,minY=height,maxX=0,maxY=0;
  for(let y=Math.max(0,Math.floor(b.y));y<Math.min(height,Math.ceil(b.y+b.height));y++)for(let x=Math.max(0,Math.floor(b.x));x<Math.min(width,Math.ceil(b.x+b.width));x++){
   const i=(y*width+x)*4;if(dark(letters.data,i)&&dark(graphics.data,i)){pixels++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  }
  if(pixels>2)collisions.push({text:b.text,pixels,box:[minX,minY,maxX-minX+1,maxY-minY+1]});
 }
 const symbols=[];
 for(const match of svg.matchAll(/<g data-callout-id="(\d+)">[\s\S]*?<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/g)){
  const [cx,cy,r]=match.slice(2).map(Number);let pixels=0;
  // An extra 2px gap around the circle is checked against the construction layer.
  for(let y=Math.max(0,Math.floor(cy-r-2));y<Math.min(height,cy+r+2);y++)for(let x=Math.max(0,Math.floor(cx-r-2));x<Math.min(width,cx+r+2);x++){
   if((x-cx)**2+(y-cy)**2>(r+2)**2)continue;
   if(dark(construction.data,(y*width+x)*4))pixels++;
  }
  if(pixels>2)symbols.push({number:Number(match[1]),pixels,cx,cy,r});
 }
 const boxes=collisions.map(c=>`<rect x="${c.box[0]-3}" y="${c.box[1]-3}" width="${c.box[2]+6}" height="${c.box[3]+6}" fill="none" stroke="red" stroke-width="2"/>`).join('')+symbols.map(c=>`<circle cx="${c.cx}" cy="${c.cy}" r="${c.r+3}" fill="none" stroke="red" stroke-width="2"/>`).join('');
 if(boxes)await sharp(Buffer.from(svg.replace('</svg>',boxes+'</svg>'))).resize({width:mode==='node'?620:1000}).png().toFile(`${root}/clearance/${mode}-${record.id}.png`);
 results.push({id:record.id,mode,sha256:createHash('sha256').update(svg).digest('hex'),textLineIntersections:collisions,symbolOcclusions:symbols});
}
await writeFile(root+'/clearance-checks.json',JSON.stringify({method:'字形与非文字图层逐像素相交；编号圆与未遮盖构造图层检查2px净距。阈值190，>2像素列入人工核查。',results},null,2)+'\n');
console.log(JSON.stringify(results.filter(r=>r.textLineIntersections.length||r.symbolOcclusions.length),null,2));
if(results.some(r=>r.textLineIntersections.length||r.symbolOcclusions.length))process.exitCode=1;
