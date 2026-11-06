// Semantic redraw of 图6-41. Drawing coordinates do not define engineering sizes.
const path=(d,fill='none',width=1.05,extra='')=>`<path d="${d}" fill="${fill}" stroke="#28313b" stroke-width="${width}" stroke-linecap="butt" stroke-linejoin="round" ${extra}/>`;
const rect=(x,y,w,h,fill,width=1.05)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#28313b" stroke-width="${width}"/>`;
const role=(name,body)=>`<g data-role="${name}">${body}</g>`;
const mark=(name,target,side,row)=>({name,target,sourceTarget:target,side,row});
export const highLowOrthogonalCorrection={
 revision:'roof-batch1-r4-clean-lines-2026-11-01',sourceTracing:null,
 sourceReconstruction:{method:'以构造对象、层界和正交基准重新绘制原生SVG；不使用扫描轮廓或旧引线。',source:'public/images/roof/coating-high-low-roof-flashing-diagram.png',figure:'图6-41',graphicUnits:'仅为不按比例图示坐标；不从原图像素确定工程尺寸',checkedOn:'2026-11-01'},
 note:'按原图关系重绘。≥250保留原图尺寸投影；材料起算面未核定。缝宽、板厚和材料规格未给出，薄层作识读夸大。',
 teaching:'区分钢板上部墙面固定与槽内卷材收头，沿U形跨缝、矮墙顶部与屋面转角追踪卷材连续性。',
 uncertainties:['≥250仅保留原图右侧离体尺寸投影；精确材料起算界面未唯一确定，不把结构板顶、砂浆面或卷材表面混称。','原图矮墙中部细横线性质不明，以独立细实线保留，不赋予钢筋、钉或拉结构件名称。','钢板厚度及上部终止高度未标，以单线薄板和上端局部截断表达；线宽不表示板厚。','矮墙与高墙的斜线图例不单独证明材料品种；下部板骨料图例与矮墙保持分界，不凭模型命名补造材料参数。'],
 checks:['高墙、抹灰和矮墙的长直边均为垂直线，结构板上下界线水平；材料剖线和实际钢板斜边保持各自方向。','钢板独立由上部墙面固定竖边连续下折至跨盖、右端返回及外撇，不从槽内压条起步。','卷材独立由槽内收头下行，保留双边U形余量、矮墙顶跨越和屋面圆弧，不用粗黑填充合并层界。','新引线直接定位压条、钉、卷材和钢板，不保留原图粗黑引线残梗。','≥250的两条投影界线与构造分开记录；尚不冒称工程完成面测点。'],
 build(){
  let s=`<defs>
   <pattern id="highlow-wall-hatch" patternUnits="userSpaceOnUse" width="18" height="18"><path d="M-3 3L3-3M0 18L18 0M15 21L21 15" stroke="#7c838c" stroke-width=".4" fill="none"/></pattern>
   <pattern id="highlow-mortar-hatch" patternUnits="userSpaceOnUse" width="12" height="12"><path d="M3 3h.7M9 9h.7" stroke="#8a929d" stroke-width=".45"/></pattern>
   <pattern id="highlow-concrete-hatch" patternUnits="userSpaceOnUse" width="25" height="23"><path d="M-2 2L2-2M0 23L23 0M23 25L27 21" stroke="#89919c" stroke-width=".35" fill="none"/><path d="M9 7l3 4H7ZM19 17l2 3h-4Z" fill="none" stroke="#89919c" stroke-width=".35"/><circle cx="4" cy="15" r=".35" fill="#89919c"/></pattern>
  </defs>`;
  s+=role('high-wall',path('M80 12H99l3-3 3 6 3-3H130V109H118V124H130V300H106l-3 3-3-6-3 3H80Z','url(#highlow-wall-hatch)',1.25));
  s+=role('wall-plaster',rect(130,12,6,87,'url(#highlow-mortar-hatch)',.65));
  s+=role('low-roof-slab',rect(148,222,132,34,'url(#highlow-concrete-hatch)',1.25));
  s+=role('low-upstand',rect(148,158,30,64,'url(#highlow-wall-hatch)',1.05));
  // Shared contact curve between the substrate and the inner membrane boundary.
  s+=role('roof-and-upstand-substrate',path('M148 154H176Q185 154 185 163V202Q185 214 198 214H280V222H178V158H148Z','url(#highlow-mortar-hatch)',.65));
  // One continuous ribbon, with explicit inner/outer boundaries and an open U cavity.
  s+=role('waterproof-u-ribbon',path('M119 114L131 119Q135 122 135 128V163Q135 174 141 174Q147 174 147 163V154H176Q185 154 185 163V202Q185 214 198 214H280V211H198Q188 211 188 202V163Q188 151 176 151H144V163Q144 171 141 171Q138 171 138 163V128Q138 119 132 116L120 111Z','#e6ebf1',.65));
  // A sheet is shown by a single clean centreline. The upper break is graphical,
  // not a newly asserted plate termination or a manufacturing dimension.
  s+=role('metal-cap',path('M136 12V24M136 30V99L153 145L208 149L194 157V185L198 190','none',1.1));
  s+=role('metal-cap-crop-mark',path('M133 25L139 29','none',.6));
  s+=role('groove-sealant',rect(118.5,111,2.5,11,'#68727e',.55));
  s+=role('termination-clamp',path('M120 112L132 120L130.5 122.5L118.5 115Z','#dce1e7',.7));
  s+=role('upper-cement-nail',path('M122 78L137 71M135.8 68.7L138.2 73.3','none',.85));
  s+=role('termination-cement-nail',path('M126 118L119 130M124 116.8L128 119.2','none',.85));
  // Retained source evidence, deliberately not a named structural connection.
  s+=role('source-uncertain-line',path('M152 180H194','none',.45));
  s+=role('roof-truncation',path('M280 207V233l3 3-6 3 3 3V260','none',.65));
  return {parts:[{id:'high-low-orthogonal-section',body:`<g data-geometry-id="high-low-orthogonal-section">${s}</g>`,box:[72,4,215,304]}],view:'高低屋面跨缝泛水局部剖面',
   anchors:{wallLeft:[80,12],wallRight:[130,12],upperNail:[136,71.4667],capFixedEdge:[136,99],upstandTop:[178,158],roofWaterproofSurface:[280,211],upstandSlabInterface:[160,222],foldBottom:[141,174],sourceUpperWitness:[242,160],sourceLowerWitness:[292,220]},
   orthogonalChecks:[{role:'high-wall',direction:'vertical',segments:[[[80,12],[80,300]],[[130,12],[130,109]],[[130,124],[130,300]]]},{role:'wall-plaster',direction:'vertical',segments:[[[136,12],[136,99]]]},{role:'low-upstand',direction:'vertical',segments:[[[148,158],[148,222]],[[178,158],[178,222]]]},{role:'low-roof-slab',direction:'horizontal',segments:[[[148,222],[280,222]],[[148,256],[280,256]]]}],
   marks:[mark('水泥钉（上部）',[136,71.4667],'right',58),mark('水泥砂浆抹灰',[133,86],'right',87),mark('压条',[126,117.4],'right',109),mark('镀锌薄钢板盖缝',[177,146.75],'right',142),mark('防水卷材',[221,212.5],'right',168),mark('嵌缝油膏',[119.2,119.5],'left',106),mark('水泥钉（收头处）',[123,123.1429],'left',147)],
   dimensions:[{id:'source-flashing-height',a:[292,220],b:[242,160],offset:323,label:'≥250',axis:'y',measuredObjects:['原图下部离体尺寸投影','原图上部离体尺寸投影'],sourceWitness:[[292,219],[242,161]],status:'source-projection-not-technical-identity',scope:'纠正整体倾斜后保留原图高度标注和相对投影，界线不假接到已核定的工程材料测点。'}],
   interfaces:[{id:'orthogonal-reference-planes',objects:['high-wall','wall-plaster','low-upstand','low-roof-slab'],scope:'共同竖向/水平基准，不保留扫描歪斜与粗墨。'},{id:'cap-and-upper-nail',objects:['metal-cap','upper-cement-nail'],scope:'钉穿过上部钢板固定竖边；钢板与槽内压条为不同构件路径。'},{id:'slot-u-upstand-roof',objects:['termination-clamp','waterproof-u-ribbon','roof-and-upstand-substrate','low-upstand'],scope:'槽内卷材与压条收头后保留U形跨缝，再跨过矮墙圆弧下翻至屋面。'},{id:'upstand-slab-material-boundary',objects:['low-upstand','low-roof-slab'],scope:'保留斜线区与骨料区之间水平材料界线，不合并为同一L形材料。'}]};
 }
};
