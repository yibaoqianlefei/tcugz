import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {xml} from './source-wall-details.mjs';

// Reuse the checked construction paths verbatim. Only their sheet placement and
// annotation layout change; reinforcement and material contours are not redrawn.
const firstLeader={
 'foam-insulation-01':[330,250], 'rockwool-insulation-01':[562,310],
 'rc-lintel-flush-01':[389,273], 'rc-lintel-window-surround-01':[382.5,257.5],
 'rc-lintel-window-hood-01':[547,245.75],
 'window-wall-gap-sealing-01':[380,270], 'construction-column-01':[315,405],
};
export function panelGeometry(def){
 const body=def.body(),[x,y]=firstLeader[def.nodeId];
 const marker=`<circle cx="${x}" cy="${y}" r="3"`;
 const end=body.indexOf(marker);
 assert(end>0,'Missing checked geometry boundary: '+def.nodeId);
 let geometry=body.slice(0,end);
 // Captions/directions are typeset in the new layout, not scaled with geometry.
 geometry=geometry.replace(/<text\b[\s\S]*?<\/text>/g,'');
 if(def.nodeId==='construction-column-01'){
  const sectionStart=geometry.indexOf('<path d="M160 850H335V690H405V850H585V920H160Z"');
  assert(sectionStart>0);
  return {elevation:geometry.slice(0,sectionStart),section:geometry.slice(sectionStart)};
 }
 return {detail:geometry};
}
const text=(x,y,value,size=26,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" ${extra}>${xml(value)}</text>`;
const line=(x,y,X,Y)=>`<path d="M${x} ${y}L${X} ${Y}" class="fine" fill="none"/>`;
const group=(role,transform,body)=>`<g data-panel-geometry="${role}" transform="${transform}">${body}</g>`;
function marker(x,y,X,Y,n){
 const dy=Math.abs(Y-y),room=Math.abs(X-x)-21;
 const dx=dy<=room?dy:dy/Math.sqrt(3)<=room?dy/Math.sqrt(3):0;
 const sign=X>=x?1:-1,elbow=x+sign*dx;
 return `<g data-panel-callout="${n}"><path d="M${x} ${y}L${elbow} ${Y}H${X-sign*17}" class="fine" fill="none"/><circle cx="${X}" cy="${Y}" r="17" fill="white" stroke="#66717f" stroke-width="1.2"/>${text(X,Y+8,n,24,'text-anchor="middle"')}</g>`;
}
const caption=(x,y,number,lines)=>`<g data-panel-label="${number}">${text(x,y,String(number).padStart(2,'0'),23,'fill="#465b96"')}${lines.map((s,i)=>text(x+43,y+i*32,s,i?23:26)).join('')}</g>`;
function column(parts){
 let body=group('elevation','translate(12 10) scale(.8)',parts.elevation);
 // Dimensions are re-typeset at readable sizes, at their original endpoints.
 body+=text(210,127,'≥1000',24,'text-anchor="middle"')+text(308,127,'240',24,'text-anchor="middle"')+text(408,127,'≥1000',24,'text-anchor="middle"');
 body+=text(92,250,'500',24,'text-anchor="middle" transform="rotate(-90 92 250)"')+text(92,378,'500',24,'text-anchor="middle" transform="rotate(-90 92 378)"');
 body+=text(80,355,'1',23)+text(528,355,'1',23)+text(310,551,'立面（局部）',24,'text-anchor="middle"');
 body+=marker(264,334,565,259,1)+marker(296,390,565,383,2)+marker(420,314,565,495,3);
 body+=caption(42,600,1,['马牙槎'])+caption(223,600,2,['柱纵向钢筋'])+caption(445,600,3,['墙柱拉结']);
 body+=line(42,632,578,632);
 body+=group('section','translate(-92 -67) scale(1.08)',parts.section);
 body+=text(310,981,'1—1 横剖面 · T形墙交接',25,'text-anchor="middle"');
 body+=caption(42,1035,4,['2Φ6@500 拉结筋'])+caption(42,1080,5,['4Φ12 柱纵筋（剖切）'])+caption(42,1125,6,['箍筋']);
 // Numbers stay outside the section core; they cannot resemble cut bars.
 body+=marker(328,808,563,738,4)+marker(331,865,563,846,5)+marker(338,893,563,936,6);
 return {height:1230,body,parameter:'图示实例 · 单位：mm · 不按比例'};
}
function insulation(id,parts){
 const foam=id==='foam-insulation-01';
 let body=group('detail','translate(-72 -12) scale(.82)',parts.detail);
 const anchors=foam?[[330,250],[452,320],[510,355],[571,495],[563,555],[587,610],[573,418]]:[[562,310],[325,350],[446,390],[462,452],[506,510],[560,583],[576,640]];
 const rows=foam?[156,226,296,436,506,576,366]:[156,226,296,366,436,506,576];
 anchors.forEach(([x,y],i)=>{body+=marker(x*.82-72,y*.82-12,485,rows[i],i+1);});
 body+=text(64,585,'内',27)+text(427,640,'外',27);
 const labels=foam?[
  ['基层墙体'],['胶粘剂'],['保温板'],['增强网','嵌于抹面层'],['抹面层'],['饰面层'],['机械锚固件'],
 ]:[
  ['锚栓'],['基层墙体'],['找平层','20厚，1∶3水泥砂浆'],['防水涂料','聚合物水泥，2厚'],['岩棉保温板','43厚'],['抹面胶浆','5厚，内置增强网'],['柔性耐水腻子','及外墙涂料'],
 ];
 body+=line(42,674,578,674);
 labels.forEach((label,i)=>{const col=i%2,row=Math.floor(i/2);body+=caption(42+col*290,720+row*87,i+1,label);});
 return {height:1100,body,parameter:foam?'局部剖面 · 不按比例':'局部剖面 · 图示实例单位：mm'};
}
function lintel(id,parts){
 let body=group('detail','translate(-45 -20) scale(.9)',parts.detail);
 const anchors=id==='rc-lintel-flush-01'?[[389,273],[373,425],[251.4,501],[421,645]]:id==='rc-lintel-window-surround-01'?[[382.5,257.5],[382.5,407.5],[186,478.75],[408.75,632.5]]:[[547,245.75],[547,392],[155.7,463.5],[530.75,587]];
 const targets=[[90,180],[555,380],[90,575],[555,681]];
 anchors.forEach(([x,y],i)=>{body+=marker(x*.9-45,y*.9-20,...targets[i],i+1);});
 body+=text(78,742,'外侧',26)+text(514,742,'内侧',26);
 body+=line(42,775,578,775);
 body+=caption(42,824,1,['上部墙体'])+caption(332,824,2,['钢筋混凝土','过梁主体']);
 body+=caption(42,916,3,['外围包覆'])+caption(332,916,4,['窗框']);
 return {height:1050,body,parameter:'横向局部剖面 · 不按比例'};
}
function gap(parts){
 let body=group('detail','translate(-124 -55)',parts.detail);
 body+=text(581,330,'δ',27)+text(310,578,'横剖面 · δ≈7 mm（图示实例）',25,'text-anchor="middle"');
 const anchors=[[192,415],[390,382],[590,363],[380,270],[455,500]];
 anchors.forEach(([x,y],i)=>{const target=[[68,478],[252,478],[517,478],[460,123],[375,521]][i];body+=marker(x-124,y-55,...target,i+1);});
 body+=line(42,615,578,615);
 [['木条'],['袋装矿棉'],['弹性密封胶'],['外墙'],['窗框']].forEach((label,i)=>{body+=caption(42+(i%2)*290,666+Math.floor(i/2)*65,i+1,label);});
 return {height:910,body,parameter:'填充与密封分层设置 · 不按比例'};
}
export function nodePanelSvg(def,record,canonical){
 const parts=panelGeometry(def),id=def.nodeId;
 const layout=id==='construction-column-01'?column(parts):id.includes('insulation')?insulation(id,parts):id.startsWith('rc-lintel')?lintel(id,parts):gap(parts);
 const title=id==='construction-column-01'?'构造柱 · 立面与横剖面':id==='window-wall-gap-sealing-01'?'窗框与墙间缝隙':id.startsWith('rc-lintel')?def.title.replace('钢筋混凝土过梁 · ',''):id==='foam-insulation-01'?'泡沫塑料保温板外保温':'岩棉保温板外保温';
 const defs=canonical.match(/<defs>[\s\S]*?<\/defs>/)[0],style=canonical.match(/<style>[\s\S]*?<\/style>/)[0].replace('</style>','.cut{stroke-width:2}.medium{stroke-width:1.2}.fine{stroke-width:.7}.rebar{stroke-width:2.3}.mesh{stroke-width:1}</style>');
 const sourceGeometryDigest=createHash('sha256').update(JSON.stringify(parts)).digest('hex');
 const metadata={...record,presentation:'node-panel',width:620,height:layout.height,sourceGeometryDigest};
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="620" height="${layout.height}" viewBox="0 0 620 ${layout.height}" role="img" aria-labelledby="title desc"><title id="title">${xml(title)}</title><desc id="desc">${xml(def.teaching.summary)}</desc><metadata>${xml(JSON.stringify(metadata))}</metadata>${defs}${style}<rect width="620" height="${layout.height}" fill="white"/>${text(42,47,title,30,'font-weight="700"')}${text(42,82,layout.parameter,21,'fill="#66717f"')}${line(42,101,578,101)}${layout.body}${line(42,layout.height-65,578,layout.height-65)}${text(42,layout.height-30,'制图：GB/T 50001—2017 · 构造依据见教材',19,'fill="#66717f"')}</svg>`;
 return {svg,sourceGeometryDigest,width:620,height:layout.height};
}
