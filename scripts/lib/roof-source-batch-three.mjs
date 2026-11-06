// Source-derived geometry only. Coordinates are diagram units, never engineering dimensions.
const p=(d,fill='none',cls='outline')=>`<path d="${d}" fill="${fill}" class="${cls}"/>`;
const r=(x,y,w,h,fill='white',cls='outline')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" class="${cls}"/>`;
const c=(x,y,rad,fill='white',cls='medium')=>`<circle cx="${x}" cy="${y}" r="${rad}" fill="${fill}" class="${cls}"/>`;
const g=(id,s)=>`<g data-geometry-id="${id}">${s}</g>`;
const mark=(name,target,side,row)=>({name,target,side,row:row??target[1]});
const dim=(id,a,b,offset,label,axis='x')=>({id,a,b,offset,label,axis});
const base=(id,body,box,marks=[],dimensions=[],view='构造剖面（局部）')=>({parts:[{id,body:g(id,body),box}],marks,dimensions,view,anchors:{},interfaces:[],orthogonalChecks:[],viewLabels:[]});
const loops=(x,y,w,h)=>Array.from({length:Math.floor(h/12)},(_,i)=>p(`M${x} ${y+i*12+5}q${w/2} -9 ${w} 0q${-w/2} 9 ${-w} 0`,'none','fine')).join('');
const seal=(x,y,w,h)=>r(x,y,w,h,'#edf0f2','medium')+Array.from({length:Math.floor(h/6)},(_,i)=>p(`M${x+2} ${y+3+i*6}h${w-4}`,'none','fine')).join('');
const sourceParam=(name,value,conditions='原图实例；不得由示意图比例反推施工尺寸。')=>({name,value,conditions,kind:'source-instance'});
const centerline=d=>`<path d="${d}" fill="none" stroke="#667381" stroke-width=".85" stroke-dasharray="12 3 2 3"/>`;

function castIron(){
 // Keep the source's axonometric body and HALF grate elevation + L section separate.
 const ax=g('cast-outlet-axon',p('M62 52L150 98V147L162 151V155L146 159V102L63 57Z','white')+p('M63 57V85M146 159L137 154','none','medium')+p('M65 70L136 107L136 150L73 166V201L51 212L27 201V145Z','white')+p('M27 145L65 70L136 107L52 158V212M52 158L136 107','none','medium')+c(69,77,2.1)+c(143,116,2.1)+c(143,142,2.1));
 const elevation=g('grate-half-elevation',p('M314 90H210V190H314','white')+Array.from({length:6},(_,i)=>r(233+i*13,111,9,74,'white','medium')).join('')+r(220,115,3.5,9,'white','medium')+r(220,160,3.5,9,'white','medium')+p('M210 185H314','none','medium')+centerline('M314 73V207'));
 const section=g('grate-L-section',p('M340 90H347V183H365V190H340Z','#39434d','medium'));
 const d=base('cast-outlet-three-views',ax+elevation+section,[22,48,345,213],[],[
  dim('half-length',[210,90],[314,90],37,'1/2长220'),dim('section-thickness',[340,90],[347,90],55,'10'),
  dim('grate-total',[365,90],[365,190],426,'215','y'),dim('head',[347,90],[347,111],383,'45','y'),
  dim('slot',[347,111],[347,183],383,'160','y'),{...dim('foot',[365,183],[365,190],402,'10','y'),sourceFragment:{lines:[[[370,183],[407,183]],[[370,190],[407,190]],[[402,176],[402,197]],[[398,187],[406,179]],[[398,194],[406,186]],[[402,197],[410,207]]],textAt:[410,225]}},
 ],'铸铁水落口及L形格栅');
 d.viewLabels=[{text:'水落口轴测',at:[95,257]},{text:'格栅半立面',at:[260,257]},{text:'侧剖面',at:[377,257]}];
 d.parts=[{id:'cast-outlet-axon',body:ax,box:[22,48,145,180]},{id:'grate-half-elevation',body:elevation,box:[210,73,104,134]},{id:'grate-L-section',body:section,box:[340,90,25,100]}];
 d.nodePanels=[{partIds:['cast-outlet-axon'],box:[22,48,145,180],label:'水落口轴测',dimensions:[]},{partIds:['grate-half-elevation','grate-L-section'],box:[205,0,240,245],label:'格栅半立面与侧剖面',dimensions:d.dimensions}];
 d.interfaces=[{id:'open-outlet',relation:'轴测出水短管保留可见折转与开口边；不把下弯通道填成实心'},{id:'grate-half',relation:'中心线右侧未重复画另一半；220仍标1/2长'}];
 return d;
}

function vent(){
 let s='';
 // Roof layers stop at the pipe hole. Pipe bore remains empty through every layer.
 for(const [x,w] of [[77,99],[240,99]]){
  s+=r(x,424,w,28,'url(#concrete)')+r(x,415,w,9,'url(#mortar)','medium')+r(x,406,w,9,'white','medium');
 }
 // Source dotted cove is a solid substrate, bounded by the outer curve and pipe face.
 // Its lower return shares the roof interfaces; no second inner curve creates a void.
 s+=g('pipe-root-coves',p('M77 400H111Q157 395 166 344L176 306H184V424H176V406H77Z','url(#mortar)','medium')+p('M240 306H248L258 344Q270 395 304 400H339V406H248V424H240Z','url(#mortar)','medium')+p('M77 398H111Q155 393 164 344L174 305H181M243 305H250L260 344Q272 393 304 398H339','none','medium'));
 s+=g('hollow-vent-pipe',p('M184 174H191V470H184ZM233 174H240V470H233Z','url(#metal)')+r(176,424,8,46,'url(#mortar)','medium')+r(240,424,8,46,'url(#mortar)','medium')+p('M165 470H205l4-8 5 16 4-8H252','none','fine')+centerline('M212 83V458'));
 // Sphere wires, no opaque fill in the vent throat.
 s+=g('wire-globe',`<ellipse cx="212" cy="132" rx="37" ry="34" fill="none" class="medium"/>`+[-24,-16,-8,0,8,16,24].map(y=>{const dx=37*Math.sqrt(1-y*y/1156);return p(`M${212-dx} ${132+y}H${212+dx}`,'none','wire');}).join('')+p('M212 98C188 112 188 151 212 166C236 151 236 112 212 98M212 98V166M194 161V201M203 165V201M221 165V201M230 161V201','none','wire')+r(184,174,7,27,'url(#metal)','fine')+r(233,174,7,27,'url(#metal)','fine'));
 s+=g('clamp-and-gasket',r(181,242,3,40,'#e3e7eb','fine')+r(240,242,3,40,'#e3e7eb','fine')+r(178,243,3,38,'white','medium')+r(243,243,3,38,'white','medium')+r(168,258,10,15,'white','medium')+r(246,258,10,15,'white','medium')+c(173,265.5,2.5)+c(251,265.5,2.5));
 s+=g('umbrella-and-seal',p('M184 282L147 314V318H159L184 296ZM240 282L271 314V318H259L240 296Z','white','medium')+p('M178 289L184 282V291L178 296ZM240 282L246 289V296L240 291Z','#56616c','medium'));
 const d=base('vent-pipe-section',s,[72,83,272,397],[
 mark('球形罩：16号镀锌钢丝，间距10',[185,115],'left',102),mark('透气管',[187,219],'left',204),
 mark('40宽环形件、2厚橡皮垫',[182,249],'left',238),mark('螺栓抱箍',[251,266],'right',243),mark('防水油膏',[243,289],'right',283),mark('伞形罩',[263,308],'right',326),mark('一布四涂',[151,387],'left',368),
 ],[dim('globe-width',[175,99],[249,99],54,'d₁'),dim('globe-height',[249,98],[249,166],290,'罩高','y'),dim('neck',[240,166],[240,201],290,'80','y'),dim('clamp-offset',[178,254],[178,282],109,'60','y'),dim('umbrella-offset',[159,282],[159,314],109,'80','y'),dim('design-height',[184,174],[77,424],48,'按工程设计','y')],'透气管出屋面剖面');
 d.interfaces=[{id:'pipe-bore',relation:'左右管壁独立闭合，孔腔贯通；屋面各层在洞口两侧终止'},{id:'umbrella',relation:'伞罩两侧斜折遮护收头，防水上翻在罩下；不把伞罩填成三角实体'}];
 return d;
}

function transverse(cap){
 const y=cap?-70:0, L=cap?405:380,R=cap?432:407, sx=cap?310:290,ex=cap?516:495;
 let s=g('support',r(sx,370+y,ex-sx,185,'url(#masonry)')+p(`M${sx-11} ${555+y}V${359+y}H${ex+11}V${555+y}`,'none','medium'));
 s+=g('hollow-planks',p(`M0 ${250+y}H${L}V${350+y}H0ZM${R} ${250+y}H810V${350+y}H${R}Z`,'url(#concrete)')+p(`M0 ${277+y}H${sx}V${324+y}H0ZM${ex} ${277+y}H810V${324+y}H${ex}Z`,'white','medium'));
 // Separate sheet boundaries in the original; do not assign an unlabelled mix.
 for(const h of [205,224,240])s+=p(`M0 ${h+y}H${L}M${R} ${h+y}H810`,'none','medium');
 const top=cap?120:120;
 s+=g('rigid-layers',p(cap?`M0 ${165+y}H${L-65}L${L-35} ${120+y}H${L}V${205+y}H0M${R} ${120+y}H${R+35}L${R+65} ${165+y}H810V${205+y}H${R}Z`:`M${L} 121V205H0M${R} 121V205H810`,'none','outline'));
 // Each left-edge cut point is visible in its own source; positions are not rebar spacing.
 const cutPoints=cap?[8,180,598,786]:[8,174,595,782];
 s+=g('separate-rebar',p(`M0 ${182+y}H${L-17}V${137+y}M${R+17} ${137+y}V${182+y}H810`,'none','rebar')+cutPoints.map(x=>c(x,186+y,3,'#34414d','fine')).join(''));
 s+=g('joint-fill',seal(L,top+y,R-L,36)+loops(L+2,top+37+y,R-L-4,cap?84:194));
 if(cap)s+=g('folded-cap',p(`M${L-72} ${123+y}L${(L+R)/2} ${75+y}L${R+73} ${123+y}L${R+68} ${134+y}L${(L+R)/2} ${89+y}L${L-67} ${134+y}Z`,'white','outline'));
 else s+=g('flexible-cover',p('M120 156H210L341 110H446L575 166H672M0 173H260L346 121H442L529 175H810','none','medium'));
 s+=p(`M0 ${147+y}V${367+y}M810 ${147+y}V${367+y}`,'none','fine');
 const d=base(`transverse-joint-${cap?2:1}`,s,[-8,cap?-5:100,826,cap?503:465],cap?[mark('折脊盖瓦',[460,24],'right',-5),mark('缝口油膏',[417,61],'right',71),mark('板端与下部支承',[484,301],'right',310)]:[mark('二布三油',[506,136],'right',92),mark('油膏嵌缝',[393,136],'left',111)],[],`横向分格缝 · ${cap?'盖瓦覆盖':'柔性覆盖'}`);
 d.interfaces=[{id:'plank-support',relation:'空心板端实心区位于下部支承上方，板底与支承间薄层保留'},{id:'joint-open',relation:'左右板及上部刚性层不跨缝连续；缝上部密封、下部填充分别表达'}];
 return d;
}

function ridge(cap){
 const L=400,R=450,C=425;
 let s=g('hollow-sloping-planks',p('M12 238L400 215L418 294L21 320ZM450 215L840 249L829 332L432 298Z','url(#concrete)'));
 // Six full holes per side, matching the source; outer continuation is a cut cavity.
 for(let i=0;i<6;i++){s+=c(82+55*i,274-3.1*i,21,'white','medium');s+=c(489+55*i,259+4.4*i,21,'white','medium');}
 s+=g('edge-cut-holes',p('M13 260C53 248 54 300 17 294L-5 280H26M837 273C797 261 799 315 832 307L858 290H821','white','medium'));
 s+=p('M21 328L418 302M432 306L829 340','none','medium');
 s+=g('rigid-ridge-layers',p(cap?'M12 191L348 171L373 120H400V215L12 238M450 215V120H476L502 177L840 199V249Z':'M12 191L400 170V215L12 238M450 170L840 199V249L450 215','none','outline'));
 s+=g('ridge-rebar',p(cap?'M12 209L378 187V139M472 139V191L840 218':'M12 209L378 187M472 191L840 218','none','rebar')+[[60,211],[220,201],[377,191],[472,195],[628,210],[783,220]].map(([x,y])=>c(x,y,3,'#34414d','fine')).join(''));
 let ridgeFill='';
 for(let y=cap?167:215;y<289;y+=12){const t=Math.max(0,Math.min(1,(y+6-215)/79)),left=400+18*t+2,right=450-18*t-2,w=right-left;ridgeFill+=p(`M${left} ${y}q${w/2} -8 ${w} 0q${-w/2} 8 ${-w} 0`,'none','fine');}
 s+=g('ridge-joint-fill',seal(L,cap?123:170,R-L,39)+p('M400 211L418 294H432L450 211','none','medium')+ridgeFill);
 if(cap){
  // Source says single-sided bedding but does not resolve which side/material thickness.
  // Preserve the cap and support outline, do not invent a symmetric mortar bridge.
  s+=g('ridge-cover-tile',p('M334 129L425 79L516 129L509 140L425 94L341 140Z','white','outline'));
 }else s+=g('ridge-flexible-cover',p('M291 158L425 152L567 165M12 191L425 169L840 199','none','medium'));
 const d=base(`ridge-joint-${cap?2:1}`,s,[-8,cap?70:140,875,cap?285:217],[
 mark(cap?'脊瓦单边坐灰固定':'二布三油',cap?[369,110]:[342,156],'left',cap?75:115),mark('嵌缝油膏',[430,cap?141:185],'right',cap?108:154),mark('沥青麻丝',[425,268],'right',350)
 ],[],`屋脊分格缝 · ${cap?'脊瓦覆盖':'柔性覆盖'}`);
 d.interfaces=[{id:'ridge-hole-count',relation:'原图左右各6个完整孔腔，边缘截断孔独立保留'},{id:'ridge-cap',relation:cap?'保留单边坐灰固定文字；原图未分清坐灰侧，图稿不新增双侧刚接':'柔性覆盖跨过两坡交汇处；刚性层、配筋在缝边断开'}];
 d.nodeDetail={box:cap?[322,70,206,245]:[325,145,200,165],label:'缝口局部放大 · 与上图同源'};
 return d;
}

function highLow(one){
 if(one){
  let s=g('high-wall',p('M97 43H138l8-9-3 17 11-8H194V112H171V136H194V355H152l-8 8 3-15-11 7H97Z','url(#masonry)')+p('M93 43V355M200 43V355','none','fine'));
  s+=g('low-wall-and-slab',r(211,166,48,156,'url(#masonry)')+r(259,272,137,16,'url(#concrete)')+p('M259 288V322H285l5-6v12l5-6H396M396 252V339','none','medium'));
  s+=g('flashing-wrap',p('M174 116L213 151H257Q270 151 270 166V250Q270 263 284 263H396M172 122L212 158H256Q264 158 264 170V252Q264 269 284 269H396','none','medium')+p('M215 153H278L275 162V187L281 200','none','medium'));
  // Two distinct fixing positions visible in the source: recessed high-wall return
  // and low-wall outer face. Heads stay outside the fixed sheet; shafts enter masonry.
  s+=g('cement-nail',g('cement-nail-high-wall',p('M183 124H157M183 119V129','none','nail'))+g('cement-nail-low-wall',p('M276 184H245M276 179V189','none','nail')));
  const d=base('high-low-joint-one',s,[88,30,320,345],[mark('水泥钉（槽口）',[162,124],'left',113),{...mark('附加卷材',[265,201],'right',194),circleAt:[350,228]},{...mark('水泥钉（矮墙侧）',[275,184],'right',180),circleAt:[350,185]}],[dim('low-wall-width',[211,322],[259,322],404,'120'),{...dim('gap',[194,355],[211,322],385,'缝宽按设计'),sourceFragment:{lines:[[[194,360],[194,392]],[[211,361],[211,392]],[[182,385],[218,385]],[[191,388],[197,382]],[[208,388],[214,382]],[[202.5,385],[167,421],[137,421]]],textAt:[137,445]}},dim('upstand',[270,159],[396,263],455,'≥250','y')],'高低屋面变形缝（a）');
  d.interfaces=[{id:'wall-recess',relation:'高墙凹槽接收收头；卷材自槽口跨到矮墙顶部并沿屋面外侧下翻'},{id:'structural-gap',relation:'矮墙与高墙保留设计缝，不能用刚性材料桥接'}];return d;
 }
 let s=g('high-wall',p('M210 70H265l8-8-3 16 10-8H327V146H210ZM210 170H327V350H210Z','url(#masonry)')+p('M333 70V112Q333 137 357 137H450','none','fine'));
 s+=g('low-wall-slab',r(351,198,43,104,'url(#masonry)')+r(351,303,168,47,'url(#concrete)'));
 s+=g('gap-hemp',loops(328,211,21,90));
 // Cover seated into the high wall, clear of the low wall and flexible sheet below.
 s+=g('concrete-cover',p('M210 146H448V202H432V170H210Z','white','outline')+p('M210 152H442V194H436V164H210','none','rebar'));
 s+=g('cover-top-screed',p('M327 70V115Q327 141 352 141L448 146','none','medium'));
 s+=g('wall-external-cove',p('M394 210H398V250Q398 292 433 292H519V303H394Z','url(#mortar)','medium'));
 s+=g('metal-flashing',p('M327 200Q338 209 350 193Q354 184 362 184H390Q410 184 410 204V249M327 205Q339 214 354 198Q357 188 363 188H390Q406 188 406 204V249','none','medium'));
 s+=g('waterproof-turn',p('M355 190H386Q402 190 402 210V250Q402 286 433 286H519M356 194H386Q398 194 398 210V250Q398 292 433 292H519','none','medium'));
 s+=g('cement-nail',p('M363 184V222','none','nail')+r(358,181,10,3,'#34414d','nail'));
 s+=p('M519 279V365','none','fine');
 const d=base('high-low-joint-two',s,[205,58,322,310],[
 mark('钢筋混凝土盖板',[236,158],'left',133),mark('砖砌矮墙',[370,242],'left',235),mark('沥青麻丝',[338,272],'left',275),{...mark('镀锌薄钢板',[408,236],'right',205),circleAt:[485,222]},mark('水泥钉',[363,215],'left',185),{...mark('防水层',[441,289],'right',300),circleAt:[490,260]},mark('Φ4@200',[351,152],'right',85),mark('Φ6@200',[441,183],'right',140),
 ],[dim('cover-end-height',[448,146],[448,202],558,'80','y'),dim('low-upstand',[448,202],[519,292],558,'≥250','y')],'高低屋面变形缝（b）');
 d.viewLabels=[{text:'1% →',at:[408,123]}];
 d.interfaces=[{id:'cover-clearance',relation:'盖板右下折边与矮墙上柔性覆盖分离；不填封滑移空间'},{id:'upstand-datum',relation:'80为原图盖板顶部至折边底部投影，不称混凝土板厚'},{id:'reinforcement',relation:'Φ4@200和Φ6@200来自原图引注；只绘可辨纵向与折边钢筋，不新增数量'}];return d;
}

export const roofBatchThree=[
 {id:'cast-iron-rainwater-outlet-01',file:'cast-iron-rainwater-outlet-diagram.png',title:'铸铁水落口',figure:'图6-22',build:castIron,model:'roof/cast-iron-rainwater-outlet/cast-iron-rainwater-outlet.glb',parameters:[sourceParam('格栅半长','220'),sourceParam('总高、开孔高及端部','215、160、45、10')],sourceFeatures:['水落口轴测折转及短管开口','格栅半立面和中心线','L形剖面及原尺寸投影'],teaching:'将水落口本体与L形格栅分开识读：轴测用于辨认进水和转折，半立面显示格栅孔槽，侧剖面显示竖肢与短横肢。构件图不能代替它与屋面防水层连接的完整设计。',uncertainties:['轴测中未给出的壁厚、出口管径、格栅另一半与排水能力不由像素推算。']},
 {id:'vent-pipe-roof-01',file:'vent-pipe-diagram.png',title:'透气管出屋面',figure:'图6-32',build:vent,model:'roof/vent-pipe/vent-pipe.glb',parameters:[sourceParam('网罩钢丝','16号，间距10'),sourceParam('环形件与垫片','40宽、2厚'),sourceParam('局部高度','80、60、80'),sourceParam('出屋面高度','按工程设计'),sourceParam('原图做法','一布四涂')],sourceFeatures:['球形网罩与空心管','带垫片抱箍及螺栓','伞形薄罩遮护管根收头','一布四涂沿管根弧形上翻'],teaching:'沿管根追踪防水层从水平面到立面的连续路径，再辨认伞形罩、密封油膏和抱箍各自的位置。球形网罩属于管口附件，不能替代管根密封。',uncertainties:['原图网罩竖向符号的下标较模糊，本稿以“罩高”代称，未赋数值；原符号见原图对照。','一布四涂是原图历史实例，不据涂刷遍数认定现行系统厚度或防水等级。']},
 {id:'rigid-roof-transverse-joint-01',file:'rigid-roof-transverse-joint-01-diagram.png',title:'刚性屋面 · 横向分格缝（一）',build:()=>transverse(false),model:'roof/rigid-roof-joint/transverse-joint-01.glb',parameters:[sourceParam('柔性覆盖','二布三油')],sourceFeatures:['两侧板端空腔与实心端','板下支承及薄层','刚性层钢筋在缝边断开','油膏嵌缝及跨缝柔性覆盖'],teaching:'从下部支承向上区分板端接缝、刚性层分格缝与顶部柔性覆盖。支承承担荷载，嵌缝与覆盖处理接缝；二者不是同一种连续关系。',uncertainties:['原图下部填充未标材料；模型命名为浸沥青木丝板，图中仅保留填充线形。']},
 {id:'rigid-roof-transverse-joint-02',file:'rigid-roof-transverse-joint-02-diagram.png',title:'刚性屋面 · 横向分格缝（二）',build:()=>transverse(true),model:'roof/rigid-roof-joint/transverse-joint-02.glb',parameters:[],sourceFeatures:['上抬缝边','独立折脊盖瓦','板端及下部支承','盖瓦下缝口与填充'],teaching:'与柔性覆盖方案比较，关注独立盖瓦、上抬缝边和缝内填充的不同位置。模型构件名称可帮助识别，原图未标的材料和尺寸仍需另行确定。',uncertainties:['截图无文字引注；本稿盖瓦、油膏及支承名称结合模型识别，不补入尺寸或双侧座浆。']},
 {id:'rigid-roof-ridge-joint-01',file:'rigid-roof-ridge-joint-01-diagram.png',title:'刚性屋面 · 屋脊分格缝（一）',build:()=>ridge(false),model:'roof/rigid-roof-joint/ridge-joint-01.glb',parameters:[sourceParam('柔性覆盖','二布三油'),sourceParam('缝内材料','嵌缝油膏、沥青麻丝')],sourceFeatures:['两坡屋面真实倾角','圆孔板截面及边缘截断孔','屋脊处断开的刚性层和钢筋','油膏、麻丝与柔性盖缝分别表达'],teaching:'屋脊两坡形成不同于平屋面板端的剖面。沿中缝从麻丝到油膏再到柔性覆盖观察，解释刚性层断开后如何在局部维持遮护。',uncertainties:['未标坡度、孔径、缝宽和配筋规格；本图不能用于确定这些工程参数。']},
 {id:'rigid-roof-ridge-joint-02',file:'rigid-roof-ridge-joint-02-diagram.png',title:'刚性屋面 · 屋脊分格缝（二）',build:()=>ridge(true),model:'roof/rigid-roof-joint/ridge-joint-02.glb',parameters:[sourceParam('盖瓦固定','脊瓦单边坐灰固定'),sourceParam('缝内材料','嵌缝油膏、沥青麻丝')],sourceFeatures:['独立盖瓦与两侧上抬缝边','单边坐灰固定原注','麻丝及缝口油膏','两坡空心板及断开的钢筋'],teaching:'单边固定的原注是本图核心信息。观察盖瓦跨过缝口，但不要把跨越误解为两侧刚性粘结；结合模型区分盖瓦、密封和板端。',uncertainties:['原图坐灰具体侧及砂浆边界不清，保留原注、不凭空画双侧砂浆；模型未单独提供座浆。']},
 {id:'high-low-roof-joint-01',file:'high-low-roof-joint-01-diagram.png',title:'高低屋面变形缝 · 卷材收头',figure:'（a）',build:()=>highLow(true),model:'roof/high-low-roof-joint/high-low-roof-joint-01.glb',parameters:[sourceParam('矮墙宽','120'),sourceParam('泛水高度','≥250'),sourceParam('结构缝','缝宽按设计')],sourceFeatures:['高墙垂直与收头凹槽','独立矮墙及设计缝','卷材跨至矮墙顶部并向屋面下翻','水泥钉和原图泛水高度投影'],teaching:'先分清高墙、矮墙和两者间的缝，再沿屋面防水上翻到高墙槽口。跨缝覆盖需要容许相对变形，不能把两个结构体直接刚性连成一体。',uncertainties:['原图未给附加卷材伸展量、材种、凹槽尺寸与密封规格；未把现行条文尺寸补画成原图参数。']},
 {id:'high-low-roof-joint-02',file:'high-low-roof-joint-02-diagram.png',title:'高低屋面变形缝 · 混凝土盖板',figure:'（b）',build:()=>highLow(false),model:'roof/high-low-roof-joint/high-low-roof-joint-02.glb',parameters:[sourceParam('配筋引注','Φ4@200、Φ6@200'),sourceParam('盖板处高度','80','原尺寸投影至折边底，不等于水平盖板厚度。'),sourceParam('泛水高度','≥250'),sourceParam('盖板顶坡','1%')],sourceFeatures:['盖板嵌入高墙及右侧下折','盖板与矮墙间的分离','镀锌薄钢板、水泥钉及防水层各自终止','麻丝缝填充及原配筋引注'],teaching:'混凝土盖板遮护接缝，下面的薄钢板与防水层另有收头路径。对照原注辨认80的尺寸界线，避免把它当成水平板厚；模型未独立显示钢筋，配筋参数只来自原图。',uncertainties:['盖板配筋为原图实例，未提供计算、锚固长度和钢筋牌号；不能由模型或示意图进行承载验算。','沥青麻丝是历史原图填料，不等同于现行条文要求的不燃保温材料。']},
].map((d,i)=>({...d,order:19+i,revision:d.id.startsWith('high-low-roof-joint')?'roof-batch3-r3-nails-2026-11-03':'roof-batch3-r2-corrected-2026-11-03',note:d.id.startsWith('rigid')?'原图局部；材料、配筋与未注尺寸按具体设计确定。':'原图实例；未注尺寸按具体设计确定。',checks:d.sourceFeatures}));
