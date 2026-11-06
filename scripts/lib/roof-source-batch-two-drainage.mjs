// Native reconstruction of the three supplied local drainage sections.
// All coordinates are drawing coordinates, never inferred engineering dimensions.
const path=(d,fill='none',cls='outline',attrs='')=>`<path d="${d}" fill="${fill}" class="${cls}" ${attrs}/>`;
const line=(x,y,X,Y,cls='fine',attrs='')=>path(`M${x} ${y}L${X} ${Y}`,'none',cls,attrs);
const role=(id,body)=>`<g data-role="${id}">${body}</g>`;
const part=(id,body,box)=>({id,body:`<g data-geometry-id="${id}">${body}</g>`,box});
const mark=(name,target,side,row)=>({name,target,side,row});
const param=(name,value,sourceLocator,conditions)=>({name,value,kind:'source-example',sourceLocator,conditions});
const concrete='url(#concrete)',masonry='url(#masonry)';
const white='#fff';

function freeDrainage(){
  // The sloping roof base rises inwards (right); the structural slab is horizontal.
  // Do not rotate the complete original scan: this would erase its actual roof slope.
  const A={eaves:[40,146],roofOuter:[40,146],roofInner:[690,130],beamTop:[305,158],beamBase:[405,357],wallHead:[355,357]};
  // In this source the upper long boundary is horizontal and the lower envelope
  // rises towards the interior. Keep those two source contours in their places;
  // do not exchange them to resemble a conventional roof layer diagram.
  let s=role('roof-surface-envelope',path('M40 70H690V130L40 146Z',white,'medium'));
  s+=role('ring-beam-with-cantilever',path('M50 158H405V357H305V210H50Z',concrete));
  s+=role('supporting-wall',path('M305 357H405V452H365L359 460L355 444L350 452H305Z',masonry));
  // The narrow open joint between beam and precast slab is visible in the source.
  // A compound path keeps all six full cavities and the cut right-hand cavity white
  // without a later white object concealing concrete in the same section plane.
  const outer='M420 160H690V174C677 174 667 178 667 186C667 194 677 198 690 198V212H420Z';
  const holes=Array.from({length:6},(_,i)=>{const x=449+i*38;return `M${x-12} 186a12 12 0 1 0 24 0a12 12 0 1 0-24 0Z`;}).join('');
  s+=role('precast-hollow-slab',path(outer+holes,concrete,'outline','fill-rule="evenodd"'));
  // The source shows a thin soffit return and a small outer-edge downward return;
  // they remain separate visible contours, with no invented material identity.
  s+=role('soffit-return-outline',path('M40 146V230L54 219H294V452M418 452V222H690','none','medium'));
  s+=role('slab-end-cut',path('M690 174L677 183H714L690 198','none','medium'));
  s+=role('roof-slope-arrow',line(446,117,285,124,'fine')+path('M285 124L316 113L307 121Z','#26313a','fine'));
  return {parts:[part('free-drainage-section',s,[25,65,700,405])],view:'挑檐与空心板局部剖面',
    viewLabels:[{text:'屋面坡度',at:[363,103]}],
    marks:[mark('外挑檐板',[190,184],'left',185),mark('圈梁',[357,286],'left',285),mark('墙体',[349,400],'left',400),mark('预制空心板',[585,168],'right',169),mark('板间接缝',[412,182],'right',245),mark('檐口下缘轮廓',[44,225],'left',246)],
    dimensions:[],anchors:A,
    interfaces:[{id:'beam-wall-bearing',objects:['ring-beam-with-cantilever','supporting-wall'],scope:'圈梁下缘与下部墙体在同一水平界面相接。'},{id:'beam-slab-joint',objects:['ring-beam-with-cantilever','precast-hollow-slab'],scope:'梁与空心板保留原图所示窄缝，不将两侧材料连成一体。'},{id:'surface-eaves-return',objects:['roof-surface-envelope','soffit-return-outline'],scope:'屋面外缘及檐底小返回轮廓均保留；原图未独立给出各薄层材料名称。'}],
    orthogonalChecks:[{id:'beam-vertical',a:[405,158],b:[405,357],axis:'y'},{id:'wall-vertical',a:[305,357],b:[305,452],axis:'y'},{id:'cantilever-soffit',a:[50,210],b:[305,210],axis:'x'}]};
}

function organizedDrainage(){
  const A={leftLip:[60,95],gutterLeft:[104,222],gutterRight:[315,222],drainMouth:[223,212],drainThroat:[223,278],watershed:[160,146],beamWallJoint:[370,262]};
  // Concrete and the metal-neutral outlet wall use the same sloping boundaries.
  const onCone=(y,x0,x1)=>x0+(x1-x0)*(y-215)/(273-215);
  const leftAtTop=onCone(222,173,205),leftAtBottom=onCone(262,173,205);
  const rightAtTop=onCone(222,285,254),rightAtBottom=onCone(262,285,254);
  let s=role('gutter-left-concrete',path(`M60 95H104V222H${leftAtTop}L${leftAtBottom} 262H60Z`,concrete));
  s+=role('gutter-right-beam',path(`M${rightAtTop} 222H315V100H423V262H${rightAtBottom}Z`,concrete));
  s+=role('supporting-wall',path('M315 262H423V448H378L372 456L368 440L362 448H315Z',masonry));
  // Six circular cavities, plus an open section-cut return at the extreme right.
  const outer='M438 102H690V116C681 116 674 119 674 125C674 131 681 134 690 134V157H438Z';
  const holes=Array.from({length:6},(_,i)=>{const x=459+i*37;return `M${x-12} 130a12 12 0 1 0 24 0a12 12 0 1 0-24 0Z`;}).join('');
  s+=role('precast-hollow-slab',path(outer+holes,concrete,'outline','fill-rule="evenodd"'));
  s+=role('roof-and-gutter-envelope',path('M50 86H113V214H169M285 214H305V85L690 70V102M50 86V274H194M261 274H305V448M433 448V166H690','none','medium'));
  s+=role('watershed-line',line(113,146,305,146,'medium'));
  // Funnel walls are two visible thin bands. The clear flow opening remains
  // genuinely absent from adjacent concrete rather than painted white over it.
  s+=role('outlet-funnel-left-wall',path('M173 215L205 273V341H213V271L182 215Z','#e9edf2','medium'));
  s+=role('outlet-funnel-right-wall',path('M276 215L246 271V341H254V273L285 215Z','#e9edf2','medium'));
  s+=role('outlet-grate',path('M168 204H291V216H168Z','#e9edf2','medium'));
  for(const x of [176,197,218,239,260,281])s+=role('grate-slot',path(`M${x} 206h10v8h-10Z`,white,'fine'));
  // Socket ring is discontinuous at its upper opening and at its lower pipe bore.
  // These contours identify geometry only, not an unmarked pipe material.
  s+=role('receiving-socket-left',path('M193 310H201V358L219 369V448H211V376L193 365Z','#e9edf2','medium'));
  s+=role('receiving-socket-right',path('M258 310H266V365L248 376V448H240V369L258 358Z','#e9edf2','medium'));
  // The original includes a visible rear/transverse contour in this receiving
  // region. It is a line, not a solid closure across the clear pipe bore.
  s+=role('socket-bottom-shoulder',path('M201 355H258M201 355L219 369M258 355L240 369','none','fine'));
  // The source's lower transverse bands and two side returns remain separate.
  s+=role('lower-pipe-joint-bands',path('M201 406H258V413H201Z','none','fine')+path('M201 426H258V433H201Z','none','fine')+path('M199 394H205V443H199Z','#e9edf2','medium')+path('M254 394H260V443H254Z','#e9edf2','medium'));
  s+=role('pipe-bore-visible',path('M219 369V448M240 369V448','none','medium'));
  s+=role('roof-slope-arrow',line(597,48,453,58,'fine')+path('M453 58L482 49L475 56Z','#26313a','fine'));
  s+=role('slab-end-cut',path('M690 116L677 125H711L690 134','none','medium'));
  return {parts:[part('organized-drainage-section',s,[40,36,680,430])],view:'檐沟与水落口局部剖面',
    viewLabels:[{text:'屋面排水坡度',at:[529,35]}],
    marks:[mark('檐沟',[80,196],'left',125),mark('分水线',[160,146],'left',173),mark('雨水口格栅',[230,204],'left',235),mark('水落口及接管',[250,295],'left',310),mark('下部接管轮廓',[257,410],'left',410),mark('圈梁',[370,195],'right',196),mark('预制空心板',[542,105],'right',112),mark('墙体',[377,383],'right',383)],
    dimensions:[],anchors:A,
    interfaces:[{id:'open-drain-through-gutter',objects:['gutter-left-concrete','gutter-right-beam','outlet-funnel-left-wall','outlet-funnel-right-wall'],scope:'沟底在雨水口处开口，漏斗壁通过洞口并伸入下部接管。'},{id:'funnel-into-socket',objects:['outlet-funnel-left-wall','outlet-funnel-right-wall','receiving-socket-left','receiving-socket-right'],scope:'上部直管段伸入下部承接轮廓；原图未给出接口密封或插入长度。'},{id:'beam-over-wall',objects:['gutter-right-beam','supporting-wall'],scope:'沟底、圈梁下缘与墙顶保持原图共同水平界面。'}],
    orthogonalChecks:[{id:'gutter-lip',a:[60,95],b:[60,262],axis:'y'},{id:'beam-face',a:[423,100],b:[423,262],axis:'y'},{id:'watershed-horizontal',a:[113,146],b:[305,146],axis:'x'}]};
}

function eavesGutter(){
  const A={lipTop:[90,105],leftInner:[120,105],watershedLeft:[120,194],watershedRight:[421,194],rightInner:[421,78],outletLeft:[260,278],outletRight:[322,278],wallHead:[465,315]};
  // Clear gutter surfaces and the drain opening are explicit boundaries. There
  // is no black rectangle standing in for a gutter, and no patch filling its bore.
  let s=role('gutter-left-concrete',path('M90 105H120V250Q120 278 142 278H254L271 314V315H90Z',concrete));
  s+=role('gutter-right-ring-beam',path('M329 278H400Q421 278 421 251V78H515V315H312V314Z',concrete));
  s+=role('supporting-wall',path('M421 315H515V482H476L470 490L466 474L460 482H421Z',masonry));
  s+=`<defs><pattern id="gutter-source-stipple" width="18" height="15" patternUnits="userSpaceOnUse"><circle cx="4" cy="5" r=".8" fill="#7c8795"/><circle cx="13" cy="12" r=".65" fill="#7c8795"/></pattern></defs>`;
  s+=role('roof-surface-envelope',path('M421 58L633 45V78H421Z','url(#gutter-source-stipple)','medium'));
  // Only the one cavity visible in the source is reproduced. The original is
  // truncated at the right-hand boundary; its exact far-side shape is unknown.
  s+=role('hollow-slab-cut-end',path('M529 80H633V99A38 38 0 1 0 633 159V173H529Z',concrete));
  // The raised curved profile is the labelled watershed line; the lower profile
  // is the gutter's bottom lining/return. They are not a water-filled rectangle.
  s+=role('gutter-watershed-profile',path('M120 137Q120 194 153 194H371Q403 194 421 147','none','medium'));
  // The lower source contour meets each inlet shoulder. Preserve this visible
  // junction without assigning a material or inventing a filled triangular wedge.
  s+=role('gutter-bottom-return',path('M120 152L133 258Q135 270 149 270H261L265 278M318 278L322 270H398Q410 270 410 255L421 147','none','medium'));
  s+=role('drain-left-wall',path('M254 278L271 314V482H280V313L265 278Z','#e9edf2','medium'));
  s+=role('drain-right-wall',path('M318 278L303 313V482H312V314L329 278Z','#e9edf2','medium'));
  s+=role('drain-section-cut',path('M254 482H287L292 476L296 488L301 482H329','none','medium'));
  s+=role('support-wall-section-cut',path('M411 482H460L466 474L470 490L476 482H525','none','medium'));
  return {parts:[part('eaves-gutter-section',s,[78,35,566,465])],view:'檐沟、分水线与排水口局部剖面',
    marks:[mark('檐沟分水线',[237,194],'left',165),mark('沟底返回轮廓',[165,270],'left',260),mark('排水口',[276,387],'left',390),mark('圈梁',[468,218],'right',220),mark('墙体',[468,397],'right',397),mark('空心板孔腔',[619,127],'right',128)],
    dimensions:[{id:'source-gutter-width',a:A.leftInner,b:A.rightInner,offset:15,label:'≥200',axis:'x',labelSide:0},{id:'source-lip-above-watershed',a:A.lipTop,b:[90,194],offset:42,label:'≥120',axis:'y',labelSide:0}],anchors:A,
    interfaces:[{id:'gutter-drain-opening',objects:['gutter-left-concrete','gutter-right-ring-beam','drain-left-wall','drain-right-wall'],scope:'沟底在出水口处留开口；竖管及入口斜段保持净空。'},{id:'watershed-vs-gutter-bottom',objects:['gutter-watershed-profile','gutter-bottom-return'],scope:'分水线为沟中较高轮廓，沟底排水口为其下方另一处截面轮廓，两条线不合并。'},{id:'ring-beam-wall',objects:['gutter-right-ring-beam','supporting-wall'],scope:'圈梁底面与墙体顶面在 y315 共界，材料不重叠占面。'}],
    orthogonalChecks:[{id:'gutter-lip-vertical',a:[90,105],b:[90,315],axis:'y'},{id:'ring-beam-vertical',a:[515,78],b:[515,315],axis:'y'},{id:'watershed-flat',a:[153,194],b:[371,194],axis:'x'}]};
}

export const roofDrainageDrawings=[
  {id:'roof-drainage-01',title:'无组织排水屋顶',file:'roof-drainage-diagram.png',figure:null,parameters:[],
    note:'挑檐与空心板局部剖面；屋面坡向檐外，薄层材料未逐项标出。',
    teaching:'把屋面坡向、外挑檐板与圈梁支承关系分开识读；图示六个完整孔及右端截断只属于本局部。',
    checks:['屋面坡度保持向左檐外，不随扫描纠偏被拉平。','圈梁、下部墙体、板间窄缝及檐口小返回分别保留。','空心板六个完整孔腔与截断端可见，实体填充未占孔腔。'],
    uncertainties:['原图没有逐层标注防水、找坡或保温材料，屋面包络不命名为完整层序。','檐底薄轮廓及外缘小返回的材料和具体功能未标明；不能据此外推滴水尺寸。'],
    sourceFeatures:[{id:'cantilever',sourceLocator:'原图左侧水平挑檐与中部下折圈梁'},{id:'roof-slope',sourceLocator:'原图顶部“屋面坡度”左向箭头与上部倾斜薄带'},{id:'six-voids-and-cut',sourceLocator:'原图右侧六个完整圆孔及右端折断孔口'},{id:'thin-soffit-return',sourceLocator:'原图挑檐下侧细轮廓及檐外缘短返回'}],build:freeDrainage},
  {id:'organized-drainage-01',title:'有组织排水屋顶',file:'organized-drainage-diagram.png',figure:null,parameters:[],
    note:'檐沟、雨水口及下部接管局部剖面；分水线与沟底开口分别表达。',
    teaching:'沿屋面坡向到檐沟，再核对格栅、漏斗口、直管段与下部承接轮廓；支承部分另看圈梁与墙体。',
    checks:['左侧沟壁、沟底、右侧圈梁构成真实凹槽。','沟底没有穿过漏斗净空；漏斗直管段伸入承接轮廓。','原图分水线、格栅开口、下部两道横带与侧返回分别保留。'],
    uncertainties:['原图未标出水落口/接管材质、管径、接口密封或插接长度，不从模型命名补入。','分水线是原图命名；此局部不证明檐沟完整平面坡向或整体雨水系统。','原图格栅槽数量按可见节奏清绘，只表达局部开孔，不升级为工程设计数量。'],
    sourceFeatures:[{id:'gutter-section',sourceLocator:'原图左侧U形檐沟与右侧圈梁交接'},{id:'watershed',sourceLocator:'“分水线”引线下方、沟内上部水平线'},{id:'grate-funnel',sourceLocator:'沟底中部短条格栅及下收漏斗'},{id:'nested-pipe',sourceLocator:'原图下方直管插入承接杯、两道横带及侧向返回'},{id:'six-hollow-cores',sourceLocator:'原图右上预制板六个完整圆孔与最右截断轮廓'}],build:organizedDrainage},
  {id:'eaves-gutter-01',title:'檐沟外排水',file:'eaves-gutter-diagram.png',figure:null,revision:'roof-batch2-gutter-r3-inner-lip-2026-11-02',
    parameters:[param('檐沟横向尺寸','≥200 mm','原图顶部水平尺寸线，两端投影位于沟内左右边','保留原图实例数值与投影；不据像素确定净宽材料测界，不作为通用设计下限。'),param('檐口顶至分水线竖向尺寸','≥120 mm','原图左侧竖向尺寸线，上端齐檐沟外缘顶、下端齐分水线','仅保留本图实例尺寸；不改写成檐沟总深度或所有节点要求。')],
    note:'檐沟分水线、沟底出水口及圈梁局部剖面；标注数值为原图实例。',
    teaching:'识别分水线和低处出水口的不同截面位置；≥120的下端在分水线，不能误作沟底或管口。',
    checks:['≥200水平投影与≥120竖向投影互不混用。','上部分水线与下部沟底返回均保留，出口清空。','圈梁、墙体及空心板孔腔分开绘制；右侧只有原图可见一个截断孔腔。'],
    uncertainties:['≥200材料测界未完全标明，记录原图投影而不强认定完成面或结构面。','原图未给出图示管口、沟底返回轮廓的材质及密封构造；连接线仅恢复可见投影，不代表已核定的粘接或密封工艺。','右上保留原图点状图例，材料未标，不命名为混凝土或找坡层。','右侧孔腔被原图边缘截断，未补造其完整远端截面。'],
    sourceFeatures:[{id:'source-width',sourceLocator:'原图顶部≥200水平投影'},{id:'source-lip-height',sourceLocator:'原图左侧≥120，从檐外壁顶至沟中分水线'},{id:'watershed-curves',sourceLocator:'“檐沟分水线”箭头所指水平段及两侧上翻曲线'},{id:'bottom-return',sourceLocator:'沟中下方独立细轮廓，在中央出水口分开'},{id:'outlet-throat',sourceLocator:'中央两侧斜收至竖管与底部截断'},{id:'upper-unidentified-band',sourceLocator:'右上屋面未标材料的细点带'},{id:'one-truncated-core',sourceLocator:'右侧边界处单个可见空心板孔腔'}],build:eavesGutter}
];
