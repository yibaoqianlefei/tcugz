import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const svg=await readFile('audit-output/source-drawing-redraw-2026-10-29/drawings/construction-column-01.svg','utf8');
const attributes=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match=>[match[1],match[2]]));
const tags=[...svg.matchAll(/<(?:path|rect|circle)\b[^>]*\/>/g)].map(match=>attributes(match[0]));
const byRole=role=>tags.filter(tag=>tag['data-role']===role);
// Probe the actual SVG segments away from hooks. A long return leg would
// create an extra intersection even if the source data still listed two bars.
function straightSegments(d){
 const tokens=d.match(/[MLHVQ]|-?\d+(?:\.\d+)?/g);let p=[0,0],index=0;const segments=[];
 while(index<tokens.length){
  const command=tokens[index++];let q;
  if(command==='M'){p=[+tokens[index++],+tokens[index++]];continue;}
  if(command==='L')q=[+tokens[index++],+tokens[index++]];
  else if(command==='H')q=[+tokens[index++],p[1]];
  else if(command==='V')q=[p[0],+tokens[index++]];
  else if(command==='Q'){index+=2;p=[+tokens[index++],+tokens[index++]];continue;}
  else throw Error('Unsupported drawing command: '+command);
  segments.push([p,q]);p=q;
 }
 return segments;
}
const vertical=byRole('tie-y');assert.equal(vertical.length,2);
for(const y of [760,800]){
 const crossings=vertical.flatMap(bar=>straightSegments(bar.d)).filter(([a,b])=>(a[1]<y&&b[1]>y)||(a[1]>y&&b[1]<y));
 assert.equal(crossings.length,2,'Each wall leg has two tie bars, not four long parallel return legs');
}
const horizontal=byRole('tie-x');assert.equal(horizontal.length,2);
for(const x of [200,530]){
 const crossings=horizontal.flatMap(bar=>straightSegments(bar.d)).filter(([a,b])=>(a[0]<x&&b[0]>x)||(a[0]>x&&b[0]<x));
 assert.equal(crossings.length,2,'The transverse wall also has two tie bars');
}
const bars=byRole('column-longitudinal-section'),hoops=byRole('column-stirrup');
assert.equal(bars.length,4,'4Φ12 must have exactly four cut symbols');assert.equal(hoops.length,1);
const hoop=hoops[0];
for(const bar of bars){
 const x=+bar.cx,y=+bar.cy,r=+bar.r;
 assert(x-r>+hoop.x&&x+r<+hoop.x+(+hoop.width)&&y-r>+hoop.y&&y+r<+hoop.y+(+hoop.height),'All four column bars must be inside the closed hoop');
}
const section=svg.match(/<g data-role="column-section">([\s\S]*?)<\/g>/)[1];
assert.equal([...section.matchAll(/<circle\b/g)].length,4,'Leader dots must not resemble extra cut bars');
const tieLevels=byRole('elevation-tie').map(tag=>straightSegments(tag.d)[0][0][1]);
for(const cut of byRole('section-cut'))assert(tieLevels.includes(straightSegments(cut.d)[0][0][1]),'The section must pass through a tie layer shown in elevation');
console.log('Column drawing: two tie bars per wall direction, four enclosed longitudinal cuts, a closed hoop, and an aligned section plane passed.');
