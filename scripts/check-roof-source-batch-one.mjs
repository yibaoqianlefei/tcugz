import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='audit-output/roof-source-redraw-batch-01-2026-10-30';
const sha=b=>createHash('sha256').update(b).digest('hex');
const records=JSON.parse(await readFile(root+'/evidence.json','utf8'));
const browser=JSON.parse(await readFile(root+'/browser-layout-checks.json','utf8'));
const approvals=JSON.parse(await readFile(root+'/approvals.json','utf8').catch(()=>'[]'));
const withoutText=s=>s.replace(/<text\b[^>]*>[\s\S]*?<\/text>/g,'');
const withoutCallouts=s=>s.replace(/<g data-callout-id="\d+">[\s\S]*?<\/g>/g,'');
const ink=async s=>{const {data,info}=await sharp(Buffer.from(s)).ensureAlpha().raw().toBuffer({resolveWithObject:true});return {data,info};};
const dark=(data,i)=>data[i+3]>128&&.2126*data[i]+.7152*data[i+1]+.0722*data[i+2]<190;
const results=[];
await mkdir(root+'/clearance',{recursive:true});
assert.equal(records.length,9);
for(const record of records){
 assert.equal(sha(await readFile('public'+record.source.path)),record.source.sha256,'Original remains recoverable');
 for(const mode of ['textbook','node']){
  const svg=await readFile(root+'/'+record.assets[mode],'utf8'),hash=sha(svg);
  assert.equal(record.rendered[mode].sha256,hash);
  const approval=approvals.find(a=>a.id===record.id);
  if(approval)assert.equal(hash,approval.assets[mode].sha256,'Human-approved version must stay unchanged');
  const b=browser.find(b=>b.title===mode+'-'+record.id);
  assert(b&&!b.error&&!b.clipped.length&&!b.overlaps.length&&b.observedUrl.endsWith('?v='+hash.slice(0,12)),'Current browser check required');
  const textOnly=svg.replace(/<defs>[\s\S]*?<\/defs>/g,'').replace(/<(?:path|rect|circle)\b[^>]*\/>/g,'');
  const [letters,graphics,construction]=await Promise.all([ink(textOnly),ink(withoutText(svg)),ink(withoutCallouts(withoutText(svg)))]);
  const {width,height}=letters.info,collisions=[],symbols=[];
  for(const box of b.boxes){let pixels=0,minX=width,minY=height,maxX=0,maxY=0;
   for(let y=Math.max(0,Math.floor(box.y));y<Math.min(height,Math.ceil(box.y+box.height));y++)for(let x=Math.max(0,Math.floor(box.x));x<Math.min(width,Math.ceil(box.x+box.width));x++){
    const i=(y*width+x)*4;if(dark(letters.data,i)&&dark(graphics.data,i)){pixels++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
   }
   if(pixels>2)collisions.push({text:box.text,pixels,box:[minX,minY,maxX-minX+1,maxY-minY+1]});
  }
  for(const m of svg.matchAll(/<g data-callout-id="(\d+)">[\s\S]*?<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/g)){
   const [cx,cy,r]=m.slice(2).map(Number);let pixels=0;
   for(let y=Math.max(0,Math.floor(cy-r-2));y<Math.min(height,cy+r+2);y++)for(let x=Math.max(0,Math.floor(cx-r-2));x<Math.min(width,cx+r+2);x++)if((x-cx)**2+(y-cy)**2<=(r+2)**2&&dark(construction.data,(y*width+x)*4))pixels++;
   if(pixels>2)symbols.push({number:Number(m[1]),pixels,cx,cy,r});
  }
  const boxes=collisions.map(c=>`<rect x="${c.box[0]-3}" y="${c.box[1]-3}" width="${c.box[2]+6}" height="${c.box[3]+6}" fill="none" stroke="red" stroke-width="2"/>`).join('')+symbols.map(c=>`<circle cx="${c.cx}" cy="${c.cy}" r="${c.r+3}" fill="none" stroke="red" stroke-width="2"/>`).join('');
  if(boxes)await sharp(Buffer.from(svg.replace('</svg>',boxes+'</svg>'))).png().toFile(`${root}/clearance/${mode}-${record.id}.png`);
  // Read actual generated dimension lines and compare to the intended measured objects.
  const {tx,ty,scale}=record.rendered[mode].geometryPlacement;
  for(const dim of record.dimensions){
   const match=svg.match(new RegExp('<g data-dimension-id="'+dim.id+'"[^>]*><path d="M([\\d.-]+) ([\\d.-]+)L([\\d.-]+) ([\\d.-]+)"'));
   assert(match,'Actual dimension line missing');
   const actual=match.slice(1).map(Number),expected=dim.axis==='y'?[tx+dim.offset*scale,ty+dim.a[1]*scale,tx+dim.offset*scale,ty+dim.b[1]*scale]:[tx+dim.a[0]*scale,ty+dim.offset*scale,tx+dim.b[0]*scale,ty+dim.offset*scale];
   actual.forEach((n,i)=>assert(Math.abs(n-expected[i])<1e-6,'Dimension no longer measures the authored objects'));
  }
  results.push({id:record.id,mode,sha256:hash,textLineIntersections:collisions,symbolOcclusions:symbols,dimensionEndpoints:'passed'});
 }
}
await writeFile(root+'/clearance-checks.json',JSON.stringify({method:'当前SVG字形/非文字分层相交、移除编号层后检查编号圆及2px外缘；阈值190与>2像素用于本机筛查。实际尺寸线读取输出坐标。非工程合规认证。',results},null,2)+'\n');
console.log(JSON.stringify(results.filter(r=>r.textLineIntersections.length||r.symbolOcclusions.length),null,2));
if(results.some(r=>r.textLineIntersections.length||r.symbolOcclusions.length))process.exitCode=1;
