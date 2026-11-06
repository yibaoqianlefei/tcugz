// Redrawn from 图6-40. Graphic coordinates are not millimetres.
// Scan skew and old leaders are excluded; the two measured heights retain
// their source-projection identity instead of becoming new code requirements.
const path=(d,fill='none',width=1.05,extra='')=>`<path d="${d}" fill="${fill}" stroke="#28313b" stroke-width="${width}" stroke-linecap="butt" stroke-linejoin="round" ${extra}/>`;
const rect=(x,y,w,h,fill,width=1.05)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#28313b" stroke-width="${width}"/>`;
const role=(name,body)=>`<g data-role="${name}">${body}</g>`;
const mark=(name,target,side,row,sourceTarget=target)=>({name,target,side,row,sourceTarget});

export const parapetOrthogonalCorrection={
 revision:'roof-batch1-r4-clean-lines-2026-11-01',
 sourceTracing:null,
 sourceReconstruction:{method:'原生SVG语义分层重建；墙边、板面和截断面复用正交基准；不引用扫描描摹路径。',source:'public/images/roof/coating-parapet-flashing-diagram.png',figure:'图6-40',sourceView:'女儿墙泛水局部剖面',graphicUnits:'仅用于排版的绘图坐标，不换算施工尺寸',checkedOn:'2026-11-01'},
 note:'按原图重绘。≥250与60保留原图相邻尺寸段的投影关系；非本图新增的规范统一取值。薄层厚度作识读夸大，不按比例。',
 teaching:'从槽内收头沿涂膜追踪至屋面，再识别外侧局部附加卷材、压条钉固及墙与板端的油膏嵌缝。',
 checks:[
  '墙体、墙面抹灰边线与板顶、板底、板端分别使用共同的竖直或水平基准；不保留扫描倾斜和旧引线。',
  '原图墙内凹槽、斜向水泥钉及压条按各自构件分开表达；编号引线重新从实际构件定位。',
  '墙根砂浆基层外为连续涂膜，附加卷材在涂膜外侧局部转折并止于原图对应范围，不延长到右侧截断面。',
  '保留墙与板端接缝内油膏、屋面板骨料图例和板底薄饰面；不以通体黑带合并材料。',
  '≥250上端沿原图收头下方投影线，60上端沿凹槽上缘投影线；两段共用收头下方投影。其技术测点身份仍待原图完整出处核定。'
 ],
 uncertainties:[
  '原扫描未提供全部材料性能、各薄层实厚、钉规格及间距，均不补入。',
  '收头局部原图分辨率有限，压条与钉按可辨识的相对位置表达；不构造额外盖板或密封件。',
  '≥250与60为原图实例尺寸标注。仅核对原图投影关系，不将约18与69绘图单位解释成毫米比例。'
 ],
 build(){
  const A={wallOuter:70,wallInner:135,plasterOuter:65,plasterInner:140,top:36,bottom:258,grooveX:115,grooveTop:104,grooveBottom:122,terminationDatum:124,roofSurface:192,slabTop:202,slabBottom:238,slabEnd:270,localSheetEnd:195};
  let s=`<defs>
   <pattern id="parapet-wall-clean-hatch" patternUnits="userSpaceOnUse" width="18" height="18"><path d="M-3 3L3-3M0 18L18 0M15 21L21 15" stroke="#7c838c" stroke-width="0.4" fill="none"/></pattern>
   <pattern id="parapet-mortar-clean-hatch" patternUnits="userSpaceOnUse" width="12" height="12"><path d="M3 3h.7M9 9h.7" stroke="#8a929d" stroke-width="0.45"/></pattern>
   <pattern id="parapet-concrete-clean-hatch" patternUnits="userSpaceOnUse" width="25" height="23"><path d="M-2 2L2-2M0 23L23 0M23 25L27 21" stroke="#89919c" stroke-width="0.35" fill="none"/><path d="M9 7l3 4H7ZM19 17l2 3h-4Z" fill="none" stroke="#89919c" stroke-width="0.35"/><circle cx="4" cy="15" r="0.35" fill="#89919c"/></pattern>
  </defs>`;
  // A stepped wall profile shares all faces with the lining layers.
  s+=role('masonry-wall',path('M70 36H92l3-3 3 6 3-3H135V104H115V122H135V258H108l-3 3-3-6-3 3H70Z','url(#parapet-wall-clean-hatch)',1.25));
  s+=role('left-wall-plaster',rect(65,36,5,222,'url(#parapet-mortar-clean-hatch)',0.65));
  s+=role('upper-wall-plaster',rect(135,36,5,68,'url(#parapet-mortar-clean-hatch)',0.65));
  // The mortar follows the wall and rounds into the roof substrate.
  s+=role('wall-and-roof-mortar',path('M135 122H140V179Q140 194 155 194H270V202H142V214H135Z','url(#parapet-mortar-clean-hatch)',0.65));
  s+=role('lower-wall-plaster',rect(135,217,5,41,'url(#parapet-mortar-clean-hatch)',0.65));
  s+=role('roof-slab',rect(142,202,128,36,'url(#parapet-concrete-clean-hatch)',1.25));
  s+=role('slab-bottom-finish',rect(142,238,128,5,'url(#parapet-mortar-clean-hatch)',0.65));
  // This is the local wall/slab-end seal shown in the source, not a roof layer.
  s+=role('wall-slab-joint-seal',path('M135 197H142V214L135 217Z','#68727e',0.55));
  // Thin coating is continuous on the substrate. The local sheet is OUTSIDE it.
  // Shared interface 1: mortar x140 / Q140 194 155 194 / y194.
  // Shared interface 2: coating x142 / Q142 192 155 192 / y192.
  // The reverse curves are exact reversals of these boundaries, not offsets
  // approximated independently with a white gap between the materials.
  s+=role('coating-waterproof-layer',path('M117 109C130 110 142 113 142 125V179Q142 192 155 192H270V194H155Q140 194 140 179V125C140 115 130 112 117 111Z','#dfe5ec',0.62));
  s+=role('local-additional-sheet',path('M117 107C132 108 144 113 144 125V179Q144 190 155 190H195V192H155Q142 192 142 179V125C142 113 130 110 117 109Z','#edf0f4',0.62));
  // A short clamp remains within the recess. Do not extend it into a cover plate.
  s+=role('termination-clamp',path('M116 105H120L132 110L130 112L119 108H116Z','#dce1e7',0.7));
  // The source nail is oblique. Its real inclination is retained deliberately.
  s+=role('cement-nail',path('M125 106L119 125','none',0.85)+path('M123.1 105.4L126.9 106.6','none',0.85));
  s+=role('source-truncation-edges',path('M270 187V245','none',0.65));
  return {
   parts:[{id:'parapet-orthogonal-section',body:`<g data-geometry-id="parapet-orthogonal-section">${s}</g>`,box:[59,28,218,237]}],
   view:'女儿墙泛水局部剖面',
   anchors:{wallLeft:[A.wallOuter,A.top],wallRight:[A.wallInner,A.top],wallRoot:[A.wallInner,A.slabTop],roofSurface:[A.slabEnd,A.roofSurface],terminationDatum:[146,A.terminationDatum],grooveTop:[A.grooveX,A.grooveTop],additionalSheetEnd:[A.localSheetEnd,191],jointSeal:[138.5,206],slabTop:[142,A.slabTop],slabBottom:[142,A.slabBottom],nailHead:[125,106],nailInWall:[119,125],mortarCoatingContact:[[140,150],[155,194],[240,194]],coatingSheetContact:[[142,150],[155,192],[185,192]]},
   orthogonalChecks:[
    {role:'masonry-wall',direction:'vertical',segments:[[[70,36],[70,258]],[[135,36],[135,104]],[[115,104],[115,122]],[[135,122],[135,258]]]},
    {role:'roof-slab',direction:'horizontal',segments:[[[142,202],[270,202]],[[142,238],[270,238]]]},
    {role:'left-wall-plaster',direction:'vertical',segments:[[[65,36],[65,258]]]},
    {role:'upper-wall-plaster',direction:'vertical',segments:[[[140,36],[140,104]]]}
   ],
   marks:[
    mark('水泥砂浆抹灰',[137.5,65],'right',59,[138,64]),
    mark('压条',[127,109.5],'right',92,[122,109]),
    mark('涂膜防水层',[141,151],'right',141,[140,134]),
    mark('附加卷材',[183,191],'right',177,[185,188]),
    mark('水泥钉',[122,115.5],'left',127,[121,119]),
    mark('防水油膏嵌缝',[139,207],'right',252,[138,208])
   ],
   dimensions:[
    {id:'source-flashing-height',a:[270,A.roofSurface],b:[146,A.terminationDatum],offset:303,label:'≥250',axis:'y',measuredObjects:['原图屋面表面投影','原图收头下部投影'],sourceWitness:[[280,193],[306,124]],status:'source-projection-not-technical-identity',scope:'保留原图数值和相邻尺寸段，未从像素换算毫米，也未将上端重新指定为现行规范测点。'},
    {id:'source-termination-height',a:[146,A.terminationDatum],b:[115,A.grooveTop],offset:303,label:'60',axis:'y',labelSide:1,measuredObjects:['原图收头下部投影','原图凹槽上缘投影'],sourceWitness:[[280,104],[306,124]],status:'source-projection-not-technical-identity'}
   ],
   interfaces:[
    {id:'orthogonal-reference-planes',objects:['masonry-wall','roof-slab','left-wall-plaster','upper-wall-plaster'],scope:'墙体主边竖直，屋面及板底水平；只保留钉、材料剖线和转角圆弧各自真实方向。'},
    {id:'roof-turn-layer-order',objects:['wall-and-roof-mortar','coating-waterproof-layer','local-additional-sheet'],scope:'基层外连续涂膜，外侧附加卷材局部上覆；附加卷材不铺到右端截断面。'},
    {id:'termination-in-groove',objects:['masonry-wall','termination-clamp','cement-nail','coating-waterproof-layer'],scope:'凹槽保留；压条和倾斜钉单独表达，不加入高低跨盖缝钢板。'},
    {id:'wall-slab-end-seal',objects:['masonry-wall','roof-slab','wall-slab-joint-seal','slab-bottom-finish'],scope:'油膏在板端接缝上部，未铺成满屋面黑层；板底饰面与板体分开。'}
   ]
  };
 }
};
