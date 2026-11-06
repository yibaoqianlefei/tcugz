import {roofStorageDrawings} from './roof-source-batch-two-storage.mjs';
import {roofTileDrawings} from './roof-source-batch-two-tiles.mjs';
import {roofDrainageDrawings} from './roof-source-batch-two-drainage.mjs';

const orderedIds = [
 'water-storage-parapet-drainage-01', 'water-storage-eaves-drainage-01',
 'steel-batten-tile-roof-01', 'mortar-bed-tile-roof-01', 'wood-batten-tile-roof-01',
 'roof-drainage-01', 'organized-drainage-01', 'eaves-gutter-01', 'roof-access-hatch-01',
];
const definitions = [...roofStorageDrawings, ...roofTileDrawings, ...roofDrainageDrawings];
export const roofBatchTwo = orderedIds.map((id, i) => {
 const definition = definitions.find(d => d.id === id);
 if (!definition) throw new Error('Missing roof batch two definition: ' + id);
 return {...definition, order: i + 10, revision: definition.revision??'roof-batch2-r1-native-2026-11-01'};
});

export const escapeXml = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const text = (x,y,s,size=24,attrs='') => `<text x="${x}" y="${y}" font-size="${size}" ${attrs}>${escapeXml(s)}</text>`;
const line = d => `<path d="${d}" fill="none" stroke="#738095" stroke-width="1.15"/>`;
function wrap(s, limit) {
 const rows=[]; let row='', width=0;
 for (const ch of String(s).match(/[A-Za-z0-9Φφ≥≤∶×@.+−–-]+|\s+|./gu)??[]) {
  const step = [...ch].reduce((sum,c)=>sum+(/[\x00-\x7f]/.test(c)?.55:1),0);
  if (width+step>limit && row) {rows.push(row);row='';width=0;}
  row+=ch;width+=step;
 }
 if(row) rows.push(row);
 return rows.map(r=>r.trim()).filter(Boolean);
}

export const roofBatchTwoDefs = `<defs>
 <pattern id="masonry" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M-2 2L2-2M-2 27L27-2M23 27L27 23" fill="none" stroke="#8a949e" stroke-width=".7"/></pattern>
 <pattern id="mortar" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="4" cy="5" r=".65" fill="#8a949e"/><circle cx="13" cy="14" r=".5" fill="#8a949e"/></pattern>
 <pattern id="metal" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M-1 1L1-1M0 9L9 0M8 10L10 8" fill="none" stroke="#8a949e" stroke-width=".6"/></pattern>
 <pattern id="concrete" width="46" height="38" patternUnits="userSpaceOnUse"><path d="M7 6l7 8-9-2ZM29 23l7 5-8 3ZM-5 36L39-8M12 49L56 5" fill="none" stroke="#8a949e" stroke-width=".65"/><circle cx="24" cy="10" r=".6" fill="#8a949e"/></pattern>
 <pattern id="water" width="48" height="32" patternUnits="userSpaceOnUse"><path d="M2 14h24M20 24h17" fill="none" stroke="#9bafba" stroke-width=".6"/></pattern>
 </defs>`;
export const roofBatchTwoStyle = `<style>
 text{font-family:'Noto Serif CJK SC','SimSun','Songti SC',serif;fill:#233047}
 [data-geometry-id] .outline{stroke:#28323c;stroke-width:2.1;stroke-linejoin:round;stroke-linecap:round}
 [data-geometry-id] .medium{stroke:#36424e;stroke-width:1.5;stroke-linejoin:round;stroke-linecap:round}
 [data-geometry-id] .fine{stroke:#7c8795;stroke-width:.85;stroke-linejoin:round;stroke-linecap:round}
 [data-geometry-id] .steel,[data-geometry-id] .rebar{stroke:#34414d;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
 [data-geometry-id] .wire{stroke:#586773;stroke-width:1;stroke-linecap:round}
 [data-geometry-id] .nail{stroke:#34414d;stroke-width:1.9;stroke-linecap:round}
 </style>`;

function dimensions(data,map,mode) {
 return data.dimensions.map(d=>{
  if(d.sourceFragment){
   const fragment=d.sourceFragment;
   const paths=fragment.lines.map(points=>line(points.map((point,i)=>{const p=map(point);return(i?'L':'M')+p[0]+' '+p[1];}).join(''))).join('');
   const [x,y]=map(fragment.textAt);
   return `<g data-dimension-id="${d.id}" data-dimension-label="${escapeXml(d.label)}" data-source-fragment="true">${paths}${text(x,y,d.label,26,'text-anchor="middle"')}</g>`;
  }
  const A=map(d.a), B=map(d.b), isY=d.axis==='y';
  const v=map(isY?[d.offset,0]:[0,d.offset])[isY?0:1];
  const a=isY?[v,A[1]]:[A[0],v], b=isY?[v,B[1]]:[B[0],v];
  let s=line(`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`);
  for(const [end,origin] of [[a,A],[b,B]]) {
   s+=line(`M${end[0]-5} ${end[1]+5}L${end[0]+5} ${end[1]-5}`);
   const delta=isY?Math.sign(v-origin[0]):Math.sign(v-origin[1]);
   s+=isY?line(`M${origin[0]+delta*5} ${origin[1]}H${v+delta*7}`):line(`M${origin[0]} ${origin[1]+delta*5}V${v+delta*7}`);
  }
  if(isY) {const x=v-12,y=(A[1]+B[1])/2;s+=text(x,y,d.label,24,`text-anchor="middle" transform="rotate(-90 ${x} ${y})"`);}
  else s+=text((A[0]+B[0])/2,v-13,d.label,24,'text-anchor="middle"');
  return `<g data-dimension-id="${d.id}" data-dimension-label="${escapeXml(d.label)}">${s}</g>`;
 }).join('');
}

export function renderRoofBatchTwo(def,data,record,mode) {
 const narrow=mode==='node', w=narrow?620:1400;
 const titles=wrap(def.title,narrow?17:36), headerBottom=94+titles.length*37;
 const part=data.parts[0];
 let [minX,minY,bw,bh]=part.box, maxX=minX+bw, maxY=minY+bh;
 for(const d of data.dimensions) {
  minX=Math.min(minX,d.a[0],d.b[0],d.axis==='y'?d.offset-36:Infinity);
  maxX=Math.max(maxX,d.a[0],d.b[0],d.axis==='y'?d.offset+18:-Infinity);
  minY=Math.min(minY,d.a[1],d.b[1],d.axis==='x'?d.offset-35:Infinity);
  maxY=Math.max(maxY,d.a[1],d.b[1],d.axis==='x'?d.offset+20:-Infinity);
 }
 const availableWidth=narrow?480:790, availableHeight=narrow?730:690;
 const scale=Math.min(availableWidth/(maxX-minX),availableHeight/(maxY-minY));
 const graphicW=(maxX-minX)*scale, graphicH=(maxY-minY)*scale;
 const x=(narrow?70:95)+(availableWidth-graphicW)/2, y=headerBottom+65;
 const tx=x-minX*scale, ty=y-minY*scale, map=([X,Y])=>[tx+X*scale,ty+Y*scale];
 let body=`<g data-layout="${mode}-${part.id}" transform="translate(${tx} ${ty}) scale(${scale})">${part.body}</g>`;
 body+=dimensions(data,map,mode);
 for(const label of data.viewLabels??[]) {
  if(label.text.includes('不按比例')) continue;
  const [X,Y]=map(label.at);body+=text(X,Y,label.text,narrow?21:24,'text-anchor="middle" data-view-label="true"');
 }
 const calloutRows=new Map();
 for(const side of ['left','right']) {
  let last=-Infinity;
  for(const m of data.marks.map((mark,index)=>({...mark,index})).filter(m=>m.side===side).sort((a,b)=>a.row-b.row)) {
   let cy=Math.max(ty+m.row*scale,last+38);
   const [ax]=map(m.target), cx=narrow?(side==='left'?28:592):(side==='left'?34:921);
   // Keep horizontal leaders clear of rotated dimension digits. A dimension
   // and a callout can share a margin without placing a line through the text.
   for(const d of data.dimensions.filter(d=>d.axis==='y'&&!d.sourceFragment)){
    const dx=map([d.offset,0])[0]-12, middle=(map(d.a)[1]+map(d.b)[1])/2;
    const half=Math.max(31,String(d.label).length*8), inside=dx>Math.min(ax,cx)&&dx<Math.max(ax,cx);
    if(inside&&Math.abs(cy-middle)<half+12)cy=middle+half+20;
   }
   calloutRows.set(m.index,cy);last=cy;
  }
 }
 for(const [i,m] of data.marks.entries()) {
  const [ax,ay]=map(m.target), cy=calloutRows.get(i), cx=narrow?(m.side==='left'?28:592):(m.side==='left'?34:921);
  const sign=Math.sign(cx-ax), end=cx-sign*15;
  const elbow=ax+sign*Math.min(34,Math.abs(cx-ax)*.3);
  body+=`<g data-callout-id="${i+1}">${line(`M${ax} ${ay}L${elbow} ${cy}H${end}`)}<circle cx="${cx}" cy="${cy}" r="15" fill="white" stroke="#7b879b" stroke-width="1"/>${text(cx,cy+7,i+1,22,'text-anchor="middle"')}</g>`;
 }
 const viewY=y+graphicH+43;
 body+=text(narrow?38:95,viewY,data.view,narrow?21:24,'fill="#5a6d91"');
 const legendX=narrow?40:982;
 let legendY=narrow?Math.max(viewY+56,...calloutRows.values())+12:y+12;
 for(const [i,m] of data.marks.entries()) {
  const rows=wrap(m.name,narrow?20:12.6);
  body+=`<g data-label-id="${i+1}">${text(legendX,legendY,String(i+1).padStart(2,'0'),23,'fill="#536691"')}${rows.map((row,j)=>text(legendX+45,legendY+j*33,row,narrow?25:26)).join('')}</g>`;
  legendY+=rows.length*33+24;
 }
 let bottom=Math.max(viewY+30,legendY+10), noteRows=wrap(def.note,narrow?24:57);
 const footerY=bottom+35, h=Math.max(narrow?650:900,footerY+45+noteRows.length*31+90);
 body+=line(`M${narrow?38:65} ${footerY}H${w-(narrow?38:65)}`);
 body+=noteRows.map((row,i)=>text(narrow?38:65,footerY+36+i*31,row,narrow?21:23)).join('');
 body+=text(narrow?38:65,h-27,narrow?'制图 GB/T 50001—2017 · 构造依据见配套说明':'制图 GB/T 50001—2017 · 原图实例；构造适用依据及差异见配套教材',narrow?18.5:21,'fill="#6e7c90"');
 const header=titles.map((row,i)=>text(narrow?38:65,54+i*37,row,narrow?29:34,'font-weight="700"')).join('')+
  text(narrow?38:65,headerBottom-21,(def.figure?def.figure+' · ':'')+'原图实例 · 不按比例 · 尺寸单位 mm',narrow?20:23,'fill="#6e7c90"')+line(`M${narrow?38:65} ${headerBottom}H${w-(narrow?38:65)}`);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="drawing-title drawing-desc"><title id="drawing-title">${escapeXml(def.title)}</title><desc id="drawing-desc">${escapeXml(data.view+'。'+def.note)}</desc><metadata>${escapeXml(JSON.stringify(record))}</metadata>${roofBatchTwoDefs}${roofBatchTwoStyle}<rect width="${w}" height="${h}" fill="white"/>${header}${body}</svg>`;
 return {svg,width:w,height:h,geometryPlacement:{tx,ty,scale},graphicBox:[x,y,graphicW,graphicH]};
}
