// Native reconstruction of the source instance. Coordinates are graphic units,
// not measured fabrication or construction dimensions.
const ink='#28313b';
const path=(d,fill='none',width=.8,extra='')=>`<path d="${d}" fill="${fill}" stroke="${ink}" stroke-width="${width}" stroke-linecap="butt" stroke-linejoin="round" ${extra}/>`;
const role=(id,body)=>`<g data-role="${id}">${body}</g>`;
const mark=(name,target,side,row,sourceTarget=target)=>({name,target,sourceTarget,side,row});

export const outlet65CleanCorrection={
 revision:'roof-batch1-r4-clean-lines-2026-11-01',
 sourceTracing:null,
 sourceReconstruction:{
  method:'按原图的上部铸铁进水构件、口杯、下接管、板洞与连续转折层界，使用独立原生SVG路径重建；无描摹轮廓、扫描噪点及旧引线。',
  source:'public/images/roof/straight-rainwater-outlet-65-diagram.png',
  sourceSha256:'e7b4828d87f99a36aef87f7a6a029b0118053b4bf6e65aa080a612f13ab88bfb',
  graphicUnits:'不按比例图示坐标；薄层仅为识读适当分开，不从像素补工程尺寸。',
  checkedOn:'2026-11-01',
  evidenceBoundary:'沿用既有evidence.json中原图实例及已读取规范的边界；本轮没有新增产品型号、设计流量或规范断言。'
 },
 note:'按原图重绘。6／100／6、1∶2.5为实例值。“65型”为既有条目名，不作DN65解释。口腔细横线为可见边，非封堵。',
 teaching:'先辨认上部带凸缘的铸铁进水构件、口杯和下接管，再沿板洞周围的卷材转折、砂浆与油膏核对接口；6／100／6分别量取下口两壁及净空。',
 uncertainties:[
  '原截图仅有“定型铸铁水落口”原标；65型的命名出处和产品制造标准未取得，不新增“DN65”或有规格保证的进水罩名称。',
  '口罩、口杯与下接管的嵌套轮廓按原图保留；未给出的制造连接、承插深度和固定方式不补画。',
  '原图未给板厚、洞口大小、卷材厚度及伸入长度，绘图夸大和位置坐标不能转为工程尺寸。',
  '既有核对仅取得12J201 A12的间接旁证，未取得A18～A20完整雨水口页；本稿不验证产品选型、汇水能力或现代完整设防。'
 ],
 checks:[
  '上部双侧凸缘、中央Y形剖切带与两侧竖向可见边保留；原“定型铸铁水落口”引线回到中央Y形剖切带。',
  '口杯双侧、周边卷材转折、下接管双侧和板洞砂浆分开表达；相接边界使用共同坐标，无随机白缝。',
  '口腔横向可见边及下口内缘仅用细线，不使用跨腔填充；下接管四条壁线仍对应6／100／6。',
  '材料剖线稀疏重画，剖切轮廓、可见边及薄层分级；没有保留扫描黑块、散点或原引线残梗。',
  '已按原图整体及上口/嵌套轮廓局部核对，并渲染教材版与节点版复查。'
 ],
 build(){
  let s=`<defs>
   <pattern id="outlet65-cast-hatch" patternUnits="userSpaceOnUse" width="16" height="16"><path d="M-2 2L2-2M0 16L16 0M14 18L18 14" fill="none" stroke="#7c838c" stroke-width=".4"/></pattern>
   <pattern id="outlet65-mortar-hatch" patternUnits="userSpaceOnUse" width="14" height="14"><path d="M1 11l3-3M9 4l2-2" fill="none" stroke="#9299a0" stroke-width=".35"/></pattern>
  </defs>`;
  // The plate is interrupted at the opening. Its notch and the mortar share
  // x148 / x283; the source did not give an engineering opening width.
  s+=role('roof-slab-left',path('M34 158H80L117 171H148V205H34Z','#fff',0)+path('M34 158H80L117 171H148V205H34','none',1.25));
  s+=role('roof-slab-right',path('M283 171H315L350 158H397V205H283Z','#fff',0)+path('M397 158H350L315 171H283V205H397','none',1.25));
  s+=role('slab-material-legend',`<path d="M48 205L94 162M102 205L137 171M293 205L335 163M349 205L391 163M65 173l3-9 4 9ZM132 195l3-9 4 9ZM306 194l3-9 4 9ZM368 174l3-9 4 9Z" fill="none" stroke="#7c838c" stroke-width=".4"/>`);
  // Sparse mortar at the actual slab opening, rather than a black strip.
  s+=role('opening-mortar',path('M148 171L154 207H148Z','url(#outlet65-mortar-hatch)',.6)+path('M283 171V207H277Z','url(#outlet65-mortar-hatch)',.6));
  // Clean roof layers follow the recess. They are drawn before the metal so
  // their shared boundary is visible once, without a white overlay or gap.
  // The substrate stops at the casting flange. The metal's footprint is not
  // duplicated underneath as a second, differently named filled material.
  s+=role('roof-local-substrate',path('M34 152H80L117 164V171L80 158H34Z','#fff',.65)+path('M397 152H350L315 164V171L350 158H397Z','#fff',.65));
  s+=role('waterproof-recess-turn',path('M34 150H80L117 162H156L164 197H175V199H162L154 164H117L80 152H34Z','#e7ecf1',.65)+path('M397 150H350L315 162H274L266 197H256V199H268L276 164H315L350 152H397Z','#e7ecf1',.65));
  s+=role('roof-upper-thin-layer',path('M34 144H80L117 156H162L170 191M397 144H350L315 156H269L261 191','none',.65));
  // Outer lower casting: both walls remain separate and the central bore open.
  s+=role('cast-lower-pipe-left',path('M117 164H154L162 199H175L196 315V360H187V315L162 207H154L148 171H117Z','url(#outlet65-cast-hatch)',1.2));
  s+=role('cast-lower-pipe-right',path('M315 164H276L268 199H256L235 315V360H243V315L269 207H277L283 171H315Z','url(#outlet65-cast-hatch)',1.2));
  // The cup flange is above the waterproof turn. The projecting upper part
  // and the cup walls retain their source silhouettes, without implying a weld.
  s+=role('cast-cup-left',path('M117 143H139V134H148V143H174L181 191H174L167 153H117Z','url(#outlet65-cast-hatch)',1.2));
  s+=role('cast-cup-right',path('M253 191L261 143H281V134H290V143H315V153H269L261 191Z','url(#outlet65-cast-hatch)',1.2));
  // Source rear-facing rim: no filled polygon spans the water passage.
  s+=role('cup-rear-visible-edge',path('M174 191H261','none',.65));
  s+=role('outlet-lower-visible-edge',path('M196 360H235','none',.65));
  // Upper cast inlet: a central Y-shaped section and unsectioned side faces.
  s+=role('cast-inlet-upper-section',path('M139 70H175L194 88H235L254 70H290V79H258L234 103L222 143H208L198 103L173 79H139Z','url(#outlet65-cast-hatch)',1.2));
  s+=role('cast-inlet-visible-sides',path('M148 79V143H208M222 143H281V79','none',.75));
  // Oil seal is a light solid material with a clear edge, never scan hatching.
  s+=role('sealant-left',path('M64 134H139V143H117Q106 150 95 146Z','#bac2cb',.65));
  s+=role('sealant-right',path('M290 134H368Q351 147 336 146L315 143H290Z','#bac2cb',.65));
  s+=role('roof-surface-lines',path('M34 134H64M368 134H397','none',.8));
  // Cropped slab ends retain neat conventional discontinuities, not ragged ink.
  s+=role('slab-truncation',path('M34 128V171M34 184V212M397 128V164M397 179V212M34 171l-6 7h12l-6 6M397 164l6 7h-12l6 8','none',.65));
  return {
   parts:[{id:'outlet65-clean-section',body:`<g data-geometry-id="outlet65-clean-section">${s}</g>`,box:[24,66,385,298]}],
   view:'直管式水落口局部剖面',
   anchors:{outerLeft:[187,360],innerLeft:[196,360],innerRight:[235,360],outerRight:[243,360],visibleRearEdge:[213,191],upperCastPart:[223,107],slabOpeningLeft:[148,186],slabOpeningRight:[283,186],waterproofLeftTurn:[160,184],waterproofRightTurn:[270,184],mortarLeft:[150,199],sealantLeft:[97,140]},
   marks:[mark('油膏嵌缝',[97,140],'left',115,[97,141]),mark('定型铸铁水落口',[223,107],'right',97,[223,107]),mark('1∶2.5 水泥砂浆',[150,199],'left',237,[150,205]),mark('防水卷材（沿洞口转折）',[270,184],'right',223,[270,184])],
   dimensions:[
    {id:'source-outlet-inner-diameter',a:[196,360],b:[235,360],offset:398,label:'100',axis:'x',labelAtNode:[279,382],measuredObjects:['出水端左内壁','出水端右内壁']},
    {id:'source-outlet-left-wall',a:[187,360],b:[196,360],offset:398,label:'6',axis:'x',labelSide:-1,measuredObjects:['出水端左外壁','出水端左内壁']},
    {id:'source-outlet-right-wall',a:[235,360],b:[243,360],offset:398,label:'6',axis:'x',labelSide:1,measuredObjects:['出水端右内壁','出水端右外壁']}
   ],
   interfaces:[
    {id:'upper-cast-and-cup',objects:['cast-inlet-upper-section','cast-inlet-visible-sides','cast-cup-left','cast-cup-right'],scope:'保留上部进水构件、凸缘、中央Y形剖面与下部口杯嵌合；不据产品别名补制造连接。'},
    {id:'cup-and-recess-turn',objects:['cast-cup-left','cast-cup-right','waterproof-recess-turn','cast-lower-pipe-left','cast-lower-pipe-right'],scope:'内外嵌套轮廓分别表达，卷材沿板洞转折；口腔内横向可见边不是实体封堵。'},
    {id:'slab-opening-mortar',objects:['roof-slab-left','roof-slab-right','opening-mortar','cast-lower-pipe-left','cast-lower-pipe-right'],scope:'板洞边、周边砂浆和金属管壁分开；砂浆引线落在洞壁与管体之间。'},
    {id:'sealant-at-upper-flange',objects:['sealant-left','sealant-right','cast-cup-left','cast-cup-right'],scope:'油膏沿屋面与铸铁凸缘两侧收口，使用浅实填而不将材料图例画成黑块。'}
   ]
  };
 }
};
