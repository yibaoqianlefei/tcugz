// Second source-based wall batch. Coordinates are drawing units, not design dimensions.
import coreSource from './core-column-source-contours.json' with {type:'json'};
export const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const p=(d,fill='none',cls='outline',extra='')=>`<path d="${d}" fill="${fill}" class="${cls}" ${extra}/>`;
const r=(x,y,w,h,fill='none',cls='outline',extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" class="${cls}" ${extra}/>`;
const l=(x,y,X,Y,cls='fine',extra='')=>p(`M${x} ${y}L${X} ${Y}`,'none',cls,extra);
const c=(x,y,rad,fill='white',cls='outline',extra='')=>`<circle cx="${x}" cy="${y}" r="${rad}" fill="${fill}" class="${cls}" ${extra}/>`;
const group=(id,body)=>`<g data-geometry-id="${id}">${body}</g>`;
const marker=(part,target,offset,name,detail='')=>({part,target,offset,name,detail});
const part=(id,box,body,caption='')=>({id,box,body:group(id,body),caption});
const wall=(x,y,w,h)=>r(x,y,w,h,'url(#masonry)');
const axis=(x,y,X,Y)=>l(x,y,X,Y,'axis');
const floorStrips=(x,y,w,h,dir,count)=>{
 let s='';for(let i=0;i<=count;i++)s+=dir==='x'?l(x,y+h*i/count,x+w,y+h*i/count,'medium','data-role="floor-strip"'):l(x+w*i/count,y,x+w*i/count,y+h,'medium','data-role="floor-strip"');
 s+=dir==='x'?axis(x+w/2,y,x+w/2,y+h):axis(x,y+h/2,x+w,y+h/2);return s;
};
const planShell=()=>p('M50 70H850V530H50ZM68 88V512H832V88Z','url(#masonry)','outline','fill-rule="evenodd" data-role="perimeter-walls"');
function plan(kind){
 const id='plan-'+kind;let body='',marks=[];
 if(kind==='frame'){
  body=r(50,70,800,440,'none','medium');
  for(let i=0;i<7;i++)body+=axis(50+i*800/6,70,50+i*800/6,510);
  for(let j=0;j<4;j++)body+=axis(50,70+j*440/3,850,70+j*440/3);
  // Fine secondary projection lines in the original are not labelled as floor slabs.
  for(let i=0;i<6;i++)for(let k=1;k<3;k++)body+=axis(50+(i+k/3)*800/6,70,50+(i+k/3)*800/6,510);
  for(let i=0;i<7;i++)for(let j=0;j<4;j++)body+=r(50+i*800/6-7,70+j*440/3-7,14,14,'#202831','medium','data-role="frame-column"');
  marks=[marker(id,[183.33,70],[-38,-47],'框架柱'),marker(id,[465,70],[44,-47],'框架梁')];
 }else{
  body=planShell();
  if(kind==='semi'){
   body+=axis(68,300,832,300);
   body+=floorStrips(650,88,182,424,'x',20);
   for(let i=0;i<7;i++){const x=150+i*100;body+=axis(x,88,x,512)+r(x-10,290,20,20,'white','outline','data-role="interior-column"');}
   marks=[marker(id,[50,180],[-55,-70],'山墙'),marker(id,[410,70],[0,-42],'外纵墙'),marker(id,[350,300],[-40,-55],'柱'),marker(id,[430,300],[70,75],'梁'),marker(id,[780,440],[155,0],'楼板')];
  }else if(kind==='transverse'){
   body+=wall(68,244,546,14)+wall(68,328,546,14)+wall(604,88,14,424);
   for(let i=1;i<5;i++)body+=wall(68+i*536/5-6,88,12,156)+wall(68+i*536/5-6,342,12,170);
   body+=axis(135,290,550,290)+floorStrips(618,88,214,424,'x',22);
   marks=[marker(id,[336,290],[-4,-130],'梁'),marker(id,[390,410],[-45,35],'横墙'),marker(id,[755,420],[180,0],'楼板')];
  }else if(kind==='longitudinal'){
   body+=wall(68,242,548,16)+wall(68,330,548,16)+wall(604,88,14,424);
   for(const x of [278,390])body+=wall(x,88,14,154)+wall(x,346,14,166);
   body+=floorStrips(618,88,214,424,'y',11);
   marks=[marker(id,[160,70],[0,-42],'外纵墙'),marker(id,[210,250],[-35,44],'内纵墙'),marker(id,[395,160],[55,0],'横墙'),marker(id,[740,430],[195,0],'楼板')];
  }else{
   // Keep the original mixed-direction floor zones and the open lower-left bay.
   body+=wall(68,220,444,16)+wall(68,286,444,16)+wall(512,88,16,424)+wall(528,300,304,16)+wall(395,88,16,132);
   body+=floorStrips(411,88,101,132,'x',7)+floorStrips(528,88,304,212,'y',12)+floorStrips(528,316,304,196,'x',10);
   body+=axis(178,302,178,512)+axis(288,302,288,512)+axis(130,414,355,414);
   marks=[marker(id,[240,70],[0,-42],'外纵墙'),marker(id,[840,180],[95,-50],'山墙'),marker(id,[210,228],[-40,-58],'横墙'),marker(id,[220,294],[0,50],'内纵墙'),marker(id,[288,420],[-40,50],'梁'),marker(id,[700,430],[235,0],'楼板')];
  }
 }
 return {parts:[part(id,[0,0,1000,580],body,'平面示意 · 不按比例')],marks,dimensions:[],wide:true};
}
function blocks(){
 const outline=(w,h,waist)=>waist?p(`M0 0H${w}V18Q${w-18} 22 ${w-18} 38V${h-38}Q${w-18} ${h-22} ${w} ${h-18}V${h}H0V${h-18}Q18 ${h-22} 18 ${h-38}V38Q18 22 0 18Z`,'#f8f8f6'):r(0,0,w,h,'#f8f8f6');
 const hole=(x,y,w,h,rad=0)=>r(x,y,w,h,'white','medium',`rx="${rad}" data-role="block-hole"`);
 const a=outline(330,125,false)+hole(35,25,105,75)+hole(190,25,105,75);
 let b=outline(430,150,true);
 b+=p('M52 35L67 20H94L110 35V114L94 130H67L52 114Z','white','medium','data-role="block-hole"');
 b+=p('M145 35L160 20H270L287 35V114L270 130H160L145 114Z','white','medium','data-role="block-hole"');
 b+=p('M322 35L338 20H365L380 35V114L365 130H338L322 114Z','white','medium','data-role="block-hole"');
 let round=outline(430,125,true);for(let i=0;i<4;i++){round+=c(78+i*92,62.5,31,'white','medium','data-role="block-hole"')+l(47+i*92,62.5,109+i*92,62.5,'fine');}
 let flat=outline(430,150,true);for(let row=0;row<3;row++){const count=row===1?3:4;for(let i=0;i<count;i++)flat+=hole(30+(row===1?45:0)+i*91,23+row*41,70,20,9);}
 return {parts:[part('block-a',[0,0,450,180],a,'(a) 单排方孔'),part('block-b',[0,0,450,180],b,'(b) 单排异形方孔'),part('block-c',[0,0,450,180],round,'(c) 单排圆孔'),part('block-d',[0,0,450,180],flat,'(d) 多排扁孔')],marks:[],dimensions:[],wide:true};
}
function core(){
 // Preserve the original cell/rib contours and course offsets; do not replace
 // this geometry with approximate block polygons. Text alone is newly typeset.
 return {
  parts:coreSource.parts.map(source=>part(source.id,[0,0,source.crop.width,source.crop.height],source.path,
   source.id==='corner-core'?'转角处芯柱（局部）':'T形交接处芯柱（局部）')),
  annotations:coreSource.parts.flatMap(source=>source.annotations.map(a=>({...a,part:source.id,size:32}))),
  marks:[],dimensions:[],wide:true,equalScale:true,sourceTracing:coreSource
 };
}
function solar(){
 const id='solar-section';let s='';
 const outer='M230 70H410V275H600V365H410V680H230V325H90V275H230Z';
 s+=p(outer+'M230 125V190H410V125ZM230 520V590H410V520Z','url(#concrete)','outline','fill-rule="evenodd" data-role="solar-wall"');
 s+=l(90,70,90,680,'medium')+l(96,70,96,680,'fine');
 for(const [y,h] of [[70,55],[190,85],[325,195],[590,90]])s+=r(207,y,23,h,'url(#wool)','medium')+r(201,y,5,h,'#202831','fine');
 for(const [y,h] of [[70,55],[190,85],[365,155],[590,90]])s+=r(410,y,14,h,'url(#mortar)','medium');
 for(const [y,h] of [[125,65],[520,70]])s+=r(206,y,204,h,'white','medium','data-role="solar-opening"')+p(`M420 ${y-8}H430V${y+h+8}H420`,'none','medium');
 s+=l(230,70,424,70,'fine')+l(230,680,424,680,'fine');
 s+=p('M300 58L285 73L300 70L285 85M310 665L295 681L311 675L297 692','none','medium');
 const dimensions=[{part:id,x:42,y:275,X:42,Y:325,label:'80',axis:'y'},...[[70,190,'120'],[190,275,'120'],[275,365,'120'],[365,520,'275'],[520,590,'120']].map(([y,Y,label])=>({part:id,x:650,y,X:650,Y,label,axis:'y'}))];
 for(const y of [70,190,275,365,520,590])s+=l(610,y,670,y,'fine');s+=l(30,275,88,275,'fine')+l(30,325,88,325,'fine');
 return {parts:[part(id,[0,0,720,730],s,'墙身局部剖面 · 单位：mm')],marks:[marker(id,[92,220],[-60,-50],'玻璃','图示3厚'),marker(id,[150,230],[0,-50],'空气间层','图示80厚'),marker(id,[203,410],[-58,-25],'薄钢板','图示0.5厚'),marker(id,[218,445],[-78,30],'矿棉保温层','图示30厚'),marker(id,[320,440],[190,40],'外围护墙'),marker(id,[418,430],[132,-25],'内墙抹灰'),marker(id,[420,150],[105,-30],'上部进风口','原图120×240（200×300）'),marker(id,[420,553],[110,55],'下部出风口','原图120×240（200×300）'),marker(id,[520,320],[30,-85],'楼板')],dimensions,wide:false};
}
function apron(stone){
 const id=stone?'stone-apron-section':'concrete-apron-section';let s='';
 // These coordinates are graphic anchors, never engineering dimensions. Keep
 // all coincident interfaces and dimension witnesses tied to the same points.
 const start=250,surfaceEnd=stone?780:750,baseEnd=stone?735:800;
 const surfaceY=stone?606:603,gradeY=626;
 const slope=(surfaceY-580)/(surfaceEnd-start);
 const surfaceBottomStart=stone?649:626;
 const baseTopY=surfaceBottomStart+(baseEnd-start)*slope;
 const baseBottomStart=stone?674:730;
 const baseBottomY=baseBottomStart+(baseEnd-start)*slope;
 const returnBottomY=775;
 const fillerTop=590,fillerBottom=surfaceBottomStart;
 const fillerTargetY=fillerTop+(fillerBottom-fillerTop)*.55;
 const anchors={surfaceAtWall:[start,580],surfaceEdge:[surfaceEnd,surfaceY],outsideGrade:[840,gradeY],
  sealTop:[227,580],sealBottom:[227,fillerTop],fillerBottom:[227,fillerBottom],
  baseTopAtEnd:[baseEnd,baseTopY],baseBottomAtEnd:[baseEnd,baseBottomY],
  surfaceBottomAtStart:[start,surfaceBottomStart],
  ...(stone?{returnFoot:[surfaceEnd,returnBottomY]}:{})};
 s+=r(85,70,90,710,'url(#masonry)')+r(175,70,42,710,'url(#wool)','medium')+r(217,70,10,710,'url(#mortar)','medium');
 s+=r(172,230,5,550,'#202831','fine','data-role="wall-waterproofing"');
 s+=r(227,fillerTop,23,fillerBottom-fillerTop,'url(#foam)','medium','data-role="joint-filler"')+r(227,580,23,10,'#202831','medium','data-role="joint-sealant"');
 const top=stone?`M250 580L780 606V775H735V${baseTopY}L250 649Z`:`M250 580L750 603V${baseTopY-(baseEnd-surfaceEnd)*slope}L250 626Z`;
 s+=p(top,stone?'url(#masonry)':'url(#concrete)','outline','data-role="apron-surface"');
 if(stone){
  for(const x of [365,485,605,735])s+=l(x,580+(x-start)*slope,x,surfaceBottomStart+(x-start)*slope,'medium');
 }
 s+=p(`M${start} ${surfaceBottomStart}L${baseEnd} ${baseTopY}V${baseBottomY}L${start} ${baseBottomStart}Z`,stone?'url(#mortar)':'url(#pebbles)','outline','data-role="apron-cushion"');
 s+=p(`M${start} ${baseBottomStart}L${baseEnd} ${baseBottomY}V${baseBottomY+30}L${start} ${baseBottomStart+30}Z`,'url(#earth)','','stroke="none" data-role="soil-under-cushion"');
 s+=p(`M${surfaceEnd} ${gradeY}H840V${gradeY+22}H${surfaceEnd}Z`,'url(#earth)','','stroke="none"')+
  l(surfaceEnd,gradeY,840,gradeY,'outline','data-role="outside-ground"');
 s+=p('M540 552L650 557M638 550L650 557L637 562','none','medium','data-role="outward-slope"');
 s+=l(227,334,227,378)+l(stone?735:750,334,stone?735:750,378)+l(stone?780:800,334,stone?780:800,378);
 s+=l(263,230,302,230)+l(263,580,302,580)+l(250,535,250,575)+l(227,535,227,575);
 const dimensions=[{part:id,x:227,y:350,X:stone?735:750,Y:350,label:'B',axis:'x'},{part:id,x:stone?735:750,y:350,X:stone?780:800,Y:350,label:stone?'120':'100',axis:'x'},{part:id,x:285,y:230,X:285,Y:580,label:'≥500',axis:'y'},{part:id,x:227,y:550,X:250,Y:550,label:'20',axis:'x',labelAt:[355,560]}];
 const verticalChain=stone?[[surfaceY,gradeY,'20'],[gradeY,returnBottomY,'220']]:[[surfaceY,gradeY,'20'],[gradeY,baseTopY,'40'],[baseTopY,baseBottomY,'150']];
 for(const [i,[y,Y,label]] of verticalChain.entries())dimensions.push({id:'outer-height-'+i,part:id,x:865,y,X:865,Y,label,axis:'y',...(label==='20'?{labelAt:[920,590]}:label==='40'?{labelAt:[920,665]}:{})});
 // Witnesses meet their actual construction endpoints, including the ground
 // level 20 below the surface edge, rather than stopping at unrelated heights.
 for(const [X,Y] of [anchors.surfaceEdge,anchors.outsideGrade,...(stone?[anchors.returnFoot]:[anchors.baseTopAtEnd,anchors.baseBottomAtEnd])])s+=l(X+5,Y,883,Y,'fine','data-role="dimension-witness"');
 return {parts:[part(id,[-35,20,1035,900],s,'墙脚散水剖面 · 单位：mm')],marks:[marker(id,[150,170],[-130,-40],'主体墙体'),marker(id,[194,160],[156,-20],'保温层'),marker(id,[222,370],[-202,-60],'饰面层'),marker(id,[175,680],[-155,80],'墙脚防水层'),marker(id,[237,585],[-217,-35],'密封膏嵌缝'),marker(id,[238,fillerTargetY],[-218,660-fillerTargetY],'聚乙烯泡沫塑料','图示缝宽20'),marker(id,[500,608],[-90,-128],stone?'块石面层':'细石混凝土面层',stone?'图示120厚；1∶2.5水泥砂浆灌缝':'图示60厚C20；撒1∶1水泥砂子压实赶光'),marker(id,[540,stone?679:698],[260,stone?171:152],stone?'粗砂垫层':'卵石灌浆垫层',stone?'图示30厚':'图示150厚；粒径10～40，M2.5混合砂浆'),marker(id,[470,stone?710:757],[-120,stone?140:93],'素土夯实','原图向外坡3%～5%')],dimensions,wide:false,geometryAnchors:anchors};
}
function plinth(kind){
 const id='plinth-'+kind;let s='';
 if(kind==='stone'){
  s+=wall(260,70,190,210);
  s+=r(230,280,220,505,'#fbfbf9');
  for(const y of [380,480,580,680])s+=r(230,y,220,8,'url(#mortar)','fine');
  for(const y of [388,588])s+=r(337,y,9,92,'url(#mortar)','fine');
  s+=p('M340 54L326 74L341 69L326 86M340 770L326 790L341 785L326 802','none','medium');
 }else{
  s+=wall(260,70,190,715);
  if(kind==='faced')s+=r(228,70,18,715,'url(#masonry)','medium')+r(246,70,14,715,'url(#mortar)','medium');
  else{s+=p('M245 378L260 360V785H245Z','url(#mortar)','medium')+r(253,70,7,290,'url(#mortar)','fine');}
  s+=l(260,408,450,408,'damp','data-role="horizontal-damp-proofing"');
  s+=p('M340 54L326 74L341 69L326 86M340 770L326 790L341 785L326 802','none','medium');
 }
 const inside=kind==='stone'?270:376;
 s+=r(450,inside,140,12,'#fff','medium')+r(450,inside+12,140,43,'url(#concrete)','medium')+r(450,inside+55,140,30,'url(#earth)','fine');
 const ext=kind==='stone'?665:650;
 s+=r(65,ext,kind==='faced'?163:kind==='stone'?165:180,12,'#fff','medium')+r(65,ext+12,kind==='faced'?163:kind==='stone'?165:180,36,'url(#concrete)','medium')+r(65,ext+48,kind==='faced'?163:kind==='stone'?165:180,32,'url(#earth)','fine');
 const marks=kind==='stone'?[marker(id,[300,528],[-125,-15],'石砌勒脚'),marker(id,[356,178],[194,-58],'上部墙体')]:[marker(id,[kind==='faced'?236:250,530],[-75,-30],kind==='faced'?'贴面':'抹灰勒脚'),marker(id,[350,408],[150,100],'水平防潮层')];
 marks.push(marker(id,[572,inside+36],[48,-121],'室内地面','原图标高±0.000'),marker(id,[85,ext+28],[-60,-110],'室外地面','高差未给数值'));
 return {parts:[part(id,[0,0,650,840],s,'勒脚局部剖面 · 不按比例')],marks,dimensions:[],wide:false};
}
const definitions=[
 ['frame-structure-layout-01',()=>plan('frame'),'梁柱平面骨架及原图的投影辅助线；未增加墙体或楼板。',[],['7列×4排，共28个柱位','框架梁与柱位相接','未把投影辅助线命名为楼板']],
 ['wall-bearing-semi-frame-01',()=>plan('semi'),'外墙、内部柱列、梁与右端板带的布置示意。',[],['内部7个柱位保持单列','外围墙与内部梁柱分开','右端楼板排列方向与原图一致']],
 ['wall-bearing-transverse-01',()=>plan('transverse'),'重复横墙、中央通道梁和右端板带的平面关系。',[],['上、下各5个房间分格','中间通道与梁连续','右端板带保留横向排列']],
 ['wall-bearing-two-way-01',()=>plan('two-way'),'各局部房间具有不同板带排列方向，保留左下开敞梁区。',[],['上左窄板带、上右纵向板带、下右横向板带分区','左下为梁区而非补画承重墙','纵横墙分隔保持原图相邻关系']],
 ['wall-bearing-longitudinal-01',()=>plan('longitudinal'),'内外纵墙、局部横墙和右端纵向板带。',[],['上下左侧各3个房间分格','中央纵向通道关系','右端楼板按竖向排列']],
 ['passive-solar-wall-01',solar,'按原图保留玻璃、空气层、薄钢板、矿棉、墙体与孔口，未假定运行风向。',['玻璃3厚','空气层80厚','薄钢板0.5厚','矿棉30厚','孔口120×240（200×300）','局部标注80；右侧尺寸链120、120、120、275、120'],['上、下两个孔口均与空气间层及室内侧相接','矿棉和薄钢板在孔口及板端处中断','左侧80与右侧120板端厚度分开','实例厚度不代表适用于所有太阳房']],
 ['block-wall-core-column-01',core,'按原图保留转角及T形交接两种轴测示意、孔道、通长筋和灌孔位置。',['原图2Φ12','原图C15：历史实例，不能作为现行设计值'],['转角与T形墙肢各自保持原图方向','保留原图可见纵筋位置及被砌块遮挡的分段表达','孔口与灌孔位置对应','未补造钢筋牌号、锚固与箍筋；C15身份明确']],
 ['hollow-block-forms-01',blocks,'原图四种外轮廓与孔型比较；名称与模型别名在说明中对应。',[],['a为2个方孔','b为3个异形孔','c为4个圆孔并保留孔内细线','d为4、3、4错列共11个扁孔','不由孔型直接判定强度、保温或承重资格']],
 ['apron-flashing-01',()=>apron(false),'按原图保留墙脚各层、密封与填缝、面层、垫层及向外坡。',['60厚C20细石混凝土','撒1∶1水泥砂子压实赶光','150厚，粒径10～40卵石灌M2.5混合砂浆；原图另列150厚3∶7灰土','坡3%～5%','接缝20；防水伸出散水面≥500；图示B、100、20、40、150'],['防水位于主体外侧、保温内侧的图示位置','顶部密封与下部泡沫填缝分开','坡向外侧','保留原图20/40/150尺寸链，实例不冒充统一规定']],
 ['stone-apron-01',()=>apron(true),'块石面层、粗砂垫层、外缘下折和墙脚接缝的局部剖面。',['120厚块石；表面平整','1∶2.5水泥砂浆灌缝','30厚粗砂垫层','坡3%～5%','接缝20；图示B、120、≥500、20、220'],['块石分缝与下部砂层分开','保留外缘下折','防水、饰面、保温与接缝不同层次','未知B不赋数值']],
 ['faced-plinth-01',()=>plinth('faced'),'外侧贴面与基层、水平防潮层及室内外地面的关系。',['室内标高±0.000；高差未给数值'],['贴面与粘结基层分别表示','防潮层位于图示室内垫层相邻标高且贯穿墙厚','不将贴面实例改画为干挂系统']],
 ['stone-plinth-01',()=>plinth('stone'),'石砌勒脚的错缝分块、上部墙体及室内外地面。',['室内标高±0.000；高差未给数值'],['原图5层石砌分块及错缝关系','石砌宽于上部墙体的外侧突出','原图未单独表示的防潮层不擅自补画，也不解释为可取消']],
 ['plaster-plinth-01',()=>plinth('plaster'),'外侧加厚抹灰、墙身水平防潮层及室内外地面。',['室内标高±0.000；高差未给数值'],['抹灰勒脚顶部转折保留','防潮层贯穿墙厚','室内外地面高低关系保留']]
];
export const wallRoundTwo=definitions.map(([id,build,scope,parameters,checks])=>({id,build,scope,parameters,checks}));
export const svgDefs=`<defs>
<pattern id="masonry" width="15" height="15" patternUnits="userSpaceOnUse"><rect width="15" height="15" fill="#fbfbf9"/><path d="M-5 5L5 -5M0 15L15 0M10 20L20 10" stroke="#8a929a" stroke-width=".8"/></pattern>
<pattern id="wool" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#f6f7f9"/><path d="M0 0L18 18M18 0L0 18" stroke="#8997a7" stroke-width=".8"/></pattern>
<pattern id="mortar" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#fcfbf8"/><circle cx="3" cy="3" r=".8" fill="#747d87"/><circle cx="9" cy="9" r=".8" fill="#747d87"/></pattern>
<pattern id="foam" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#f8fafc"/><path d="M0 7L7 0L14 7L7 14Z" stroke="#8c99a8" stroke-width=".7" fill="none"/></pattern>
<pattern id="concrete" width="50" height="50" patternUnits="userSpaceOnUse"><rect width="50" height="50" fill="#fafaf8"/><path d="M-5 5L5 -5M0 50L50 0M45 55L55 45" stroke="#a6adb5" stroke-width=".7"/><path d="M15 12L23 17L17 23ZM34 35L41 39L36 44Z" stroke="#707a85" stroke-width=".8" fill="none"/></pattern>
<pattern id="pebbles" width="100" height="80" patternUnits="userSpaceOnUse"><rect width="100" height="80" fill="#fafaf8"/><path d="M5 20Q-2 3 20 2Q36 5 28 22Q15 34 5 20ZM40 7Q59 -5 69 17Q72 36 53 35Q37 32 40 7ZM75 42Q88 22 99 46Q105 66 85 70Q70 65 75 42ZM4 48Q16 33 32 46Q49 70 26 79Q5 82 4 48ZM48 47Q60 38 69 50Q76 63 61 69Q45 65 48 47Z" stroke="#747d87" stroke-width="1" fill="none"/></pattern>
<pattern id="earth" width="35" height="30" patternUnits="userSpaceOnUse"><rect width="35" height="30" fill="#fbfbf7"/><path d="M0 10L10 0M5 18L23 0M15 18L30 3M20 24L35 9" stroke="#7c848d" stroke-width="1"/></pattern></defs>`;
export const svgStyle=`<style>.outline,.medium,.fine,.axis,.rebar,.damp{stroke-linejoin:miter;vector-effect:non-scaling-stroke}.outline{stroke:#202831;stroke-width:2.4}.medium{stroke:#202831;stroke-width:1.2}.fine{stroke:#677482;stroke-width:.6}.axis{stroke:#677482;stroke-width:.6;stroke-dasharray:20 4 3 4}.rebar{stroke:#202831;stroke-width:3.2;stroke-linecap:round}.damp{stroke:#344b79;stroke-width:2.4}text{font-family:'Times New Roman','SimSun','Noto Serif CJK SC',serif;fill:#202831}</style>`;
