import {roofSourceCorrections} from './roof-source-corrected.mjs';
// Source drawings define the topology and example parameters. Coordinates are graphic units.
export const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const p=(d,fill='none',cls='outline',attrs='')=>`<path d="${d}" fill="${fill}" class="${cls}" ${attrs}/>`;
const r=(x,y,w,h,fill='none',attrs='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" class="outline" ${attrs}/>`;
const ln=(x,y,X,Y,cls='fine',attrs='')=>p(`M${x} ${y}L${X} ${Y}`,'none',cls,attrs);
const circle=(x,y,rad,fill='white',attrs='')=>`<circle cx="${x}" cy="${y}" r="${rad}" fill="${fill}" class="outline" ${attrs}/>`;
const role=(id,s)=>`<g data-role="${id}">${s}</g>`;
const part=(id,body,box)=>({id,body:`<g data-geometry-id="${id}">${body}</g>`,box});
const concrete='url(#concrete)',masonry='url(#masonry)',mortar='url(#mortar)',metal='url(#metal)';
const param=(name,value,sourceLocator)=>({name,value,kind:'source-example',sourceLocator,conditions:'仅为所提供原图的示例标注，不作为其他节点的统一设计取值。'});
const mark=(name,target,side='right',row=null)=>({name,target,side,row:row??target[1]});
const dim=(id,a,b,offset,label,axis='x',labelSide=0)=>({id,a,b,offset,label,axis,labelSide});

function truss(kind){
 let outer,holes;
 if(kind==='timber'){
  outer='M20 260H65L500 30L935 260H980V280H20Z';
  holes=['M100 260L275 167V260Z','M292 158L491 53V252Z','M295 180L471 260H295Z','M509 53L708 158L509 252Z','M529 260L705 180V260Z','M725 167L900 260H725Z'];
 }else if(kind==='concrete'){
  outer='M0 250H30L500 24L970 250H1000V277H970L960 270H40L30 277H0Z';
  holes=['M55 253L163 201Q173 197 181 203L241 247Q248 253 240 253Z','M192 191L322 128Q333 123 326 137L274 227Q267 239 256 231L192 202Q184 196 192 191Z','M280 253L341 149Q348 138 360 148L475 249Q480 253 471 253Z','M368 126L463 79Q471 76 480 76H489Q494 76 494 84V239Q494 248 487 241L366 137Q359 131 368 126Z',
    'M506 84Q506 76 511 76H520Q529 76 537 79L632 126Q641 131 634 137L513 241Q506 248 506 239Z','M525 249L640 148Q652 138 659 149L720 253H529Q520 253 525 249Z','M678 128L808 191Q816 196 808 202L744 231Q733 239 726 227L674 137Q667 123 678 128Z','M759 247L819 203Q827 197 837 201L945 253H760Q752 253 759 247Z'];
 }else{
  outer='M0 250H30L500 20L970 250H1000V275H970L960 269H40L30 275H0Z';
  holes=['M67 252L187 194V252Z','M193 191L337 121V247Z','M195 203L321 252H193Z','M343 115L497 42V249Z','M347 130L481 252H343Z','M503 42L657 115L503 249Z','M519 252L653 130L657 252Z','M663 121L807 191L663 247Z','M679 252L805 203L807 252Z','M813 194L933 252H813Z'];
 }
 // Holes are a single compound geometry so chord/web junctions do not double-stroke.
 const body=role('truss-silhouette',p(outer+holes.join(''),'#f8f8f5','outline','fill-rule="evenodd" style="stroke-width:2.5"'));
 return {parts:[part('truss-elevation',body,[0,0,1000,300])],
  marks:[],dimensions:[dim('source-span',[kind==='timber'?20:15,280],[kind==='timber'?980:985,280],355,kind==='timber'?'6～12 m':kind==='concrete'?'15～24 m':'12～18 m')],
  anchors:{leftSupport:[kind==='timber'?20:15,280],rightSupport:[kind==='timber'?980:985,280],ridge:[500,kind==='timber'?30:kind==='concrete'?24:20]},
  view:'屋架立面示意',expectedVoids:holes.length};
}

function parapet(){
 const A={roofTop:[270,188],termination:[140,123],grooveTop:[115,104],clampBottom:[140,123],wallBase:[135,239]};
 let s=role('wall',p('M70 37H90L94 33L97 42L102 37H135V104H115V122H135V257H108L104 262L100 253L96 257H70Z',masonry));
 s+=role('plaster',p('M65 37H70V257H65Z',mortar)+p('M135 37H141V101H115V104H135Z',mortar));
 s+=role('roof-slab',p('M142 202H270V238H142Z',concrete));
 s+=role('roof-base',p('M143 194H270V202H144V210H138V194Z',mortar));
 s+=role('joint-seal',p('M135 198H142V214L135 219Z','#26313a','medium'));
 // Add-on sheet sits below coating, both turn continuously onto the roof.
 s+=role('additional-sheet',p('M135 122V178Q135 194 151 194H270V191H151Q139 191 139 178V122Z','#e0e5ec','medium'));
 s+=role('coating',p('M139 122V178Q139 191 151 191H270V188H151Q142 188 142 178V122Z','#333b43','medium'));
 s+=role('clamp',p('M115 105H137L144 115V123H140V116L135 111H115Z',metal,'medium'));
 s+=role('cement-nail',ln(121,115,138,115,'nail')+ln(138,112,138,118,'nail'));
 return {parts:[part('parapet-section',s,[58,26,220,245])],view:'女儿墙泛水局部剖面',anchors:A,
  marks:[mark('水泥砂浆抹灰',[138,65],'right',61),mark('压条',[138,109],'right',93),mark('涂膜防水层',[141,145],'right',132),mark('附加卷材',[137,166],'right',184),mark('水泥钉',[125,115],'left',104),mark('防水油膏嵌缝',[138,210],'right',235)],
  dimensions:[dim('source-flashing-height',A.roofTop,A.termination,302,'≥250','y'),dim('source-termination-height',A.termination,A.grooveTop,302,'60','y',1)],
  interfaces:[{id:'root-turn',objects:['additional-sheet','coating','roof-base'],scope:'分别连续上翻，层次在墙根转角处不交换。'},{id:'roof-end-joint',objects:['wall','joint-seal','roof-slab'],scope:'油膏位于板端与墙体接缝。'}]};
}

function highLow(){
 let s=role('high-wall',p('M80 12H98L102 7L105 17L109 12H130V109H118V124H130V297H105L102 302L98 292L94 297H80Z',masonry));
 s+=role('plaster',p('M130 12H135V105H118V109H130Z',mortar));
 s+=role('low-upstand-slab',p('M146 157H176V221H278V254H146Z',concrete));
 s+=role('base-mortar',p('M146 151H181V213H278V221H176V157H146Z',mortar));
 s+=role('membrane-u',p('M129 119L136 132V161Q136 174 141 174Q146 174 146 161V152H179V204Q179 216 190 216H278V212H190Q183 212 183 204V148H142V161Q142 169 141 169Q140 169 140 161V131L132 118Z','#d3dbe6','medium'));
 s+=role('metal-cap',p('M119 112H132L146 143L203 148L194 153L146 148L130 116H119Z',metal,'medium'));
 s+=role('sealant',p('M119 110H129V115H119Z','#303942','medium'));
 s+=role('clamp',p('M119 116H132V125H129V120H119Z',metal,'medium'));
 s+=role('cement-nail-clamp',ln(121,122,132,122,'nail')+ln(132,120,132,124,'nail'));
 s+=role('cement-nail-upper',ln(122,53,136,53,'nail')+ln(136,50,136,56,'nail'));
 const A={roofTop:[278,212],upstandTop:[176,157],wallGroove:[119,112],uBottom:[141,174]};
 return {parts:[part('high-low-section',s,[72,0,215,306])],view:'高低屋面交界局部剖面',anchors:A,
  marks:[mark('水泥钉（上部）',[128,53],'right',39),mark('水泥砂浆抹灰',[132,81],'right',79),mark('压条',[130,120],'right',108),mark('镀锌薄钢板盖缝',[171,146],'right',140),mark('防水卷材',[183,185],'right',192),mark('嵌缝油膏',[124,112],'left',96),mark('水泥钉（收头处）',[125,122],'left',147)],
  dimensions:[dim('source-flashing-height',A.roofTop,A.upstandTop,310,'≥250','y')],
  interfaces:[{id:'movement-fold',objects:['high-wall','membrane-u','low-upstand-slab'],scope:'保留墙与矮墙间间隙及卷材U形跨缝，不能填实。'},{id:'cap-over-fold',objects:['metal-cap','membrane-u'],scope:'钢板罩在跨缝段外侧，墙槽端有嵌缝。'}]};
}

function outlet(is65){
 if(is65){
  let s=role('structure-left',p('M34 158H144L153 205H34V183L28 179L34 175Z',concrete));
  s+=role('structure-right',p('M278 158H397V175L404 179L397 183V205H275Z',concrete));
  s+=role('mortar-left',p('M34 148H88L116 163H154L165 198H152L143 171H116L88 157H34Z',mortar));
  s+=role('mortar-right',p('M278 148H397V157H341L313 171H283L275 198H262Z',mortar));
  s+=role('waterproof-left',p('M34 145H88L118 158H153L163 192H159L150 162H117L87 151H34Z','#3e4750','medium'));
  s+=role('waterproof-right',p('M278 145H397V151H341L312 162H281L272 192H268L278 158H313L340 145Z','#3e4750','medium'));
  s+=role('roof-finish',p('M34 136H148V143H34Z',mortar)+p('M282 136H397V143H282Z',mortar));
  s+=role('sealant',p('M62 136H138V145H89Z','#3c4650','medium')+p('M290 136H367L340 145H290Z','#3c4650','medium'));
  s+=role('outlet-body',p('M148 143H168L181 191L205 310V360H196V310L171 200H158L148 151Z',metal)+p('M264 143H282V151H273L261 200H251L235 310V360H226V310L251 191Z',metal));
  s+=role('inlet-cover',p('M139 70H176L195 88H233L254 70H290V79H258L238 99L223 143H211L199 102L172 79H139Z',metal));
  s+=role('cover-side',ln(148,79,148,143,'medium')+ln(281,79,281,143,'medium'));
  return {parts:[part('outlet65-section',s,[24,58,385,312])],view:'65型水落口局部剖面',anchors:{pipeOuterLeft:[196,360],pipeInnerLeft:[205,360],pipeInnerRight:[226,360],pipeOuterRight:[235,360]},
   marks:[mark('油膏嵌缝',[94,140],'left',125),mark('定型铸铁水落口',[252,182],'right',210),mark('65型铸铁进水罩',[223,108],'right',82),mark('1∶2.5 水泥砂浆',[150,181],'left',243),mark('防水卷材',[120,159],'left',185)],
   dimensions:[{...dim('source-outlet-inner-diameter',[205,360],[226,360],398,'100'),labelAtNode:[280,380]},dim('source-outlet-left-wall',[196,360],[205,360],398,'6','x',-1),dim('source-outlet-right-wall',[226,360],[235,360],398,'6','x',1)],
   interfaces:[{id:'waterproof-recess',objects:['waterproof-left','waterproof-right','outlet-body'],scope:'卷材沿凹口转折；穿板管与砂浆填嵌分开。'}]};
 }
 let s=role('structure-left',p('M34 152H112L139 176V202H34Z',concrete))+role('structure-right',p('M222 176L251 152H324V202H222Z',concrete));
 s+=role('mortar-left',p('M34 134H92L115 142L147 173V202H139V176L112 152H34Z',mortar));
 s+=role('mortar-right',p('M217 173L244 142L267 134H324V152H251L222 176V202H217Z',mortar));
 s+=role('waterproof-left',p('M34 129H92L117 139L151 170V201H147V173L115 142L92 134H34Z','#3d4750','medium'));
 s+=role('waterproof-right',p('M213 170L243 139L267 129H324V134H267L244 142L217 173V201H213Z','#3d4750','medium'));
 s+=role('roof-finish',p('M34 119L95 132L117 137H34Z',mortar)+p('M243 137L267 131L324 119V137Z',mortar));
 s+=role('sealant',p('M91 138H112L124 147H91Z','#333e47','medium')+p('M238 147L250 138H267V147Z','#333e47','medium'));
 s+=role('outlet-body',p('M96 147H117L147 172V301H140V176L115 153H96Z',metal)+p('M215 172L244 147H264V153H247L222 176V301H215Z',metal));
 const globe='M143 146C123 126 135 87 161 80C187 72 207 93 210 118C213 140 198 152 195 164V177Q191 189 179 194Q166 189 162 177V165C159 157 149 154 143 146Z';
 let grid='';for(const y of [88,96,104,112,120,128,136,144,152,160,168,176,184])grid+=ln(126,y,215,y,'wire');
 for(const x of [146,157,168,179,190,201])grid+=p(`M179 78Q${x} 108 ${x} 140L${179+(x-179)*.55} 191`,'none','wire');
 s+=`<defs><clipPath id="wire-globe-clip"><path d="${globe}"/></clipPath></defs>`+role('wire-globe',p(globe,'none','medium')+`<g clip-path="url(#wire-globe-clip)">${grid}</g>`);
 return {parts:[part('cast-outlet-section',s,[25,69,310,241])],view:'铸铁水落口局部剖面',anchors:{inletCenter:[179,155],pipeLeft:[140,301],pipeRight:[222,301]},
  marks:[mark('镀锌钢丝球',[179,84],'right',76),mark('油膏嵌缝',[254,142],'right',121),mark('1∶2.5 水泥砂浆',[139,176],'left',210),mark('防水卷材',[123,147],'left',153),mark('铸铁水落口',[219,248],'right',254)],dimensions:[],
  interfaces:[{id:'guard-in-inlet',objects:['wire-globe','outlet-body'],scope:'球网下部收束伸入管口，不画成实心球。'}]};
}

function eaves(direct){
 const wallLeft=direct?299:303,wallRight=direct?384:393,slabRight=direct?516:526;
 const slabTop=direct?94:99,slabBottom=direct?145:149,beamBottom=direct?185:190;
 let s=role('wall',p(`M${wallLeft} ${beamBottom}H${wallRight}V322H${wallRight-34}l-4 -5 -4 10 -4 -5H${wallLeft}Z`,masonry));
 s+=role('hollow-slab',r(wallRight,slabTop,slabRight-wallRight,slabBottom-slabTop,concrete));
 s+=`<defs><clipPath id="slab-void-clip"><rect x="${wallRight}" y="${slabTop}" width="${slabRight-wallRight}" height="${slabBottom-slabTop}"/></clipPath></defs><g clip-path="url(#slab-void-clip)">`;
 for(const x of direct?[412,451,490]:[423,458,493,528])s+=circle(x,(slabTop+slabBottom)/2,12,'white','data-role="slab-void"');
 s+='</g>';
 if(direct){
  s+=role('ring-beam',r(wallLeft,94,wallRight-wallLeft,beamBottom-94,concrete));
  s+=role('cantilever-waterproof',p('M96 72H516V94H299V100H96Z',concrete));
  // One longitudinal bar and section dots, matching the source indication of a two-way mesh.
  s+=role('mesh-longitudinal',p('M101 92V77H347L414 83H512','none','rebar'));
  for(const x of [152,214,277,340,404,468])s+=role('mesh-cross-section',circle(x,79+(x>347?4:0),1.7,'#26313b'));
  return {parts:[part('direct-eaves-section',s,[86,62,440,271])],view:'防水层直接悬挑檐口剖面',anchors:{outerTop:[96,72],outerBottom:[96,100],wallOuter:[299,185]},
   marks:[mark('双向 Φ4 钢筋 @100～200',[214,79],'left',44),mark('细石混凝土防水悬挑层',[240,90],'left',128),mark('墙顶圈梁',[342,151],'right',188),mark('空心屋面板',[451,120],'right',129)],
   dimensions:[dim('source-end-height',[96,72],[96,100],64,'70','y'),dim('source-cantilever',[96,100],[299,100],223,'≤450')],
   interfaces:[{id:'waterproof-over-support',objects:['cantilever-waterproof','ring-beam','hollow-slab'],scope:'悬挑层连续跨过圈梁与板端，钢筋位于层内。'}]};
 }
 s+=role('ring-beam-and-cantilever',p('M38 99H393V190H303V122H38Z',concrete));
 s+=role('leveling-base',p('M33 91H526V99H38V123H33Z',mortar));
 s+=role('isolation',r(33,87,493,4,'#e2e6eb'));
 s+=role('waterproof',p('M20 76H526V87H33V94H20Z','#edf0f4'));
 s+=role('drip',p('M31 94V124H38','none','medium'));
 return {parts:[part('ring-eaves-section',s,[12,65,526,268])],view:'圈梁带挑檐板檐口剖面',anchors:{waterproofNose:[20,76],dripReturn:[38,124],structuralEdge:[38,99]},
  marks:[mark('防水层',[207,82],'left',39),mark('隔离层',[451,89],'right',48),mark('滴水',[33,116],'left',167),mark('圈梁带挑檐板',[204,111],'left',227),mark('空心屋面板',[465,124],'right',166)],
  dimensions:[dim('source-nose-offset',[20,76],[38,76],48,'60')],
  interfaces:[{id:'nose-and-drip',objects:['waterproof','drip','ring-beam-and-cantilever'],scope:'60是檐端局部水平尺寸，滴水在下方，不是防水层厚度。'},{id:'layer-order',objects:['waterproof','isolation','leveling-base','ring-beam-and-cantilever'],scope:'防水、隔离、找平基层与结构分层表达；不把模型额外材质当作原图标注。'}]};
}

export const roofBatchOne=[
 {id:'roof-truss-timber-01',title:'屋架形式 · 木屋架',file:'roof-truss-timber-diagram.png',lesson:'basics/roof/roof-slope.html',unit:'roof.trusses',build:()=>truss('timber'),parameters:[param('图示跨度','6～12 m','原图下部水平尺寸')],note:'6～12 m 为原图跨度示例；杆件截面、节点连接与承载力另行设计。',teaching:'辨认上下弦与腹杆，再沿杆件追踪到两端支承。',checks:['六个内孔与中心竖杆、两侧竖杆及斜腹杆对应。','跨度界线与原图底部两端对应，不补造支座或连接件。']},
 {id:'roof-truss-reinforced-concrete-01',title:'屋架形式 · 钢筋混凝土屋架',file:'roof-truss-reinforced-concrete-diagram.png',lesson:'basics/roof/roof-slope.html',unit:'roof.trusses',build:()=>truss('concrete'),parameters:[param('图示跨度','15～24 m','原图下部水平尺寸')],note:'15～24 m 为原图跨度示例；轮廓不表示配筋与节点连接详图。',teaching:'比较上弦、下弦和腹杆之间的整体轮廓与三角孔。',checks:['八个内孔、中心竖向腹杆和两端外伸轮廓与原图对应。','不从外形补出预应力、配筋或截面尺寸。']},
 {id:'roof-truss-steel-timber-01',title:'屋架形式 · 钢木屋架',file:'roof-truss-steel-timber-diagram.png',lesson:'basics/roof/roof-slope.html',unit:'roof.trusses',build:()=>truss('steel-timber'),parameters:[param('图示跨度','12～18 m','原图下部水平尺寸')],note:'12～18 m 为原图跨度示例；杆件材质分工结合模型及设计资料识读。',teaching:'比较腹杆分格与细拉杆；不由线宽单独判断杆件材质。',checks:['十个内孔、中心吊杆、两级竖杆及斜杆分格对应原图。','不补画原图未示的连接螺栓、节点板和木材截面。']},
 {id:'coating-parapet-flashing-01',title:'涂膜防水屋面 · 女儿墙泛水',file:'coating-parapet-flashing-diagram.png',figure:'图6-40',lesson:'basics/roof/roof-flat.html',unit:'roof.flashing',build:parapet,parameters:[param('泛水图示高度','≥250 mm','右侧下段竖向尺寸'),param('收头局部高度','60 mm','右侧上段竖向尺寸')],note:'≥250、60 为本图标注；涂膜厚度、卷材品种及固定间距未给出。',teaching:'沿附加卷材与涂膜的墙根转折读到压条收头，再定位板端嵌缝。',checks:['防水涂膜与附加卷材分别连续转折，层序不交换。','压条和水泥钉位于立面收头；油膏位于板端接缝。','≥250与60分属相邻尺寸段，不合并为一个高度。']},
 {id:'coating-high-low-roof-flashing-01',title:'涂膜防水屋面 · 高低屋面泛水',file:'coating-high-low-roof-flashing-diagram.png',figure:'图6-41',lesson:'basics/roof/roof-flat.html',unit:'roof.flashing',build:highLow,parameters:[param('泛水图示高度','≥250 mm','右侧竖向尺寸')],note:'≥250 为原图实例标注；跨缝构造的变形能力和完整防水设防另行核定。',teaching:'追踪低屋面卷材上翻、U形跨缝及外侧盖缝钢板，区分两处水泥钉。',checks:['高墙与矮墙之间保留间隙，U形跨缝段不填实。','盖缝钢板在卷材外侧，墙槽端有嵌缝。','图名沿用原题，实际标注材料为防水卷材，不改成全部涂膜。']},
 {id:'straight-rainwater-outlet-65-01',title:'直管式水落口 · 65型水落口',file:'straight-rainwater-outlet-65-diagram.png',lesson:'basics/roof/roof-flat.html',unit:'roof.drainage-outlets',build:()=>outlet(true),parameters:[param('出口内尺寸','100 mm','底部中段尺寸'),param('出口两侧壁厚','6、6 mm','底部左右短尺寸'),param('砂浆配比','1∶2.5','原图砂浆引线')],note:'100、两侧6及1∶2.5均为本图实例；“65型”不是图中100的替代标注。',teaching:'区分进水罩与定型水落口，再追踪卷材转折和穿板周边砂浆。',checks:['进水罩与下部漏斗形管体为不同对象，管腔贯通。','管口下端三个尺寸分别对应左壁、内口和右壁。','卷材与周边砂浆、结构板及油膏嵌缝分开表达。']},
 {id:'straight-rainwater-outlet-cast-iron-01',title:'直管式水落口 · 铸铁水落口',file:'straight-rainwater-outlet-cast-iron-diagram.png',lesson:'basics/roof/roof-flat.html',unit:'roof.drainage-outlets',build:()=>outlet(false),parameters:[param('砂浆配比','1∶2.5','原图砂浆引线')],note:'1∶2.5为原图配比；钢丝直径、管径、壁厚及网格间距未标注。',teaching:'观察通透球网与收束端，并定位周边嵌缝及防水转折。',checks:['球形钢丝网为线网，底部收束进入管口而非实心球。','穿板管腔保持贯通；不从原图像素补出管径。']},
 {id:'free-fall-ring-beam-eaves-01',title:'自由落水檐口 · 圈梁带挑檐板',file:'free-fall-ring-beam-eaves-01-diagram.png',lesson:'basics/roof/roof-flat.html',unit:'roof.eaves',build:()=>eaves(false),parameters:[param('檐端局部水平尺寸','60 mm','原图左上角短尺寸')],note:'60为檐端局部水平尺寸；原图未给配筋、锚固和防水层厚度。',teaching:'区分防水层、隔离层与结构挑檐，并定位檐端滴水。',checks:['60对应檐端两条竖向界线，不是板厚或整个悬挑长。','隔离层位于防水层下；圈梁与挑檐板整体相接。','空心板孔腔与原图局部截取范围对应。']},
 {id:'free-fall-waterproof-eaves-01',title:'自由落水檐口 · 防水层直接悬挑',file:'free-fall-waterproof-eaves-01-diagram.png',lesson:'basics/roof/roof-flat.html',unit:'roof.eaves',build:()=>eaves(true),parameters:[param('檐端竖向尺寸','70 mm','左侧竖向尺寸'),param('图示悬挑尺寸','≤450 mm','下部水平尺寸'),param('图示双向钢筋','Φ4 @100～200 mm','顶部钢筋标注')],note:'70、≤450、Φ4@100～200均为历史图示参数；不代表现行屋面完整防水做法。',teaching:'对照悬挑层内的双向钢筋与墙顶圈梁，区别局部高度和悬挑长度。',checks:['70指檐端竖向尺寸，≤450从檐端量至墙外缘。','沿长度可见钢筋用线，横向截面用点，均位于悬挑层内。','不由原图推定钢筋等级、保护层或锚固长度。']}
];

for(const definition of roofBatchOne){const correction=roofSourceCorrections[definition.id];if(correction)Object.assign(definition,correction);}

export const svgDefs=`<defs>
<pattern id="masonry" width="17" height="17" patternUnits="userSpaceOnUse"><path d="M-4 4L4 -4M0 17L17 0M13 21L21 13" fill="none" stroke="#6d7883" stroke-width=".55"/></pattern>
<pattern id="mortar" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".45" fill="#88919b"/><circle cx="4" cy="5" r=".35" fill="#88919b"/></pattern>
<pattern id="metal" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M-1 1L1 -1M0 5L5 0M4 6L6 4" fill="none" stroke="#596672" stroke-width=".45"/></pattern>
<pattern id="concrete" width="31" height="27" patternUnits="userSpaceOnUse"><path d="M4 4l4 8 -7 -2ZM21 17l6 4 -7 3ZM-4 22L31 -13M-4 49L31 14" fill="none" stroke="#7c8690" stroke-width=".45"/><circle cx="17" cy="8" r=".5" fill="#8b949b"/></pattern>
</defs>`;
export const svgStyle=`<style>text{font-family:'Noto Serif CJK SC','SimSun','Songti SC',serif;fill:#202d46}.outline{stroke:#26313b;stroke-width:1.3;stroke-linejoin:round;stroke-linecap:round}.medium{stroke:#26313b;stroke-width:.9;stroke-linejoin:round;stroke-linecap:round}.fine{stroke:#75808e;stroke-width:.55;stroke-linejoin:round;stroke-linecap:round}.nail{stroke:#26313b;stroke-width:1.7;stroke-linecap:round}.wire{stroke:#475560;stroke-width:.7;stroke-linecap:round}.rebar{stroke:#26313b;stroke-width:1.6;stroke-linejoin:round;stroke-linecap:round}</style>`;
