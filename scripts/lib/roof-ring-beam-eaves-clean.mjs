// Object-by-object reconstruction of the supplied historical eaves section.
// Graphic coordinates below are not construction dimensions.
const ink='#28313b';
const path=(d,fill='none',width=.75,extra='')=>`<path d="${d}" fill="${fill}" stroke="${ink}" stroke-width="${width}" stroke-linecap="butt" stroke-linejoin="round" ${extra}/>`;
const rect=(x,y,w,h,fill='white',width=.75)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${ink}" stroke-width="${width}"/>`;
const group=(id,body)=>`<g data-role="${id}" data-geometry-id="ring-eaves-${id}">${body}</g>`;
const mark=(name,target,side,row,sourceTarget=target)=>({name,target,sourceTarget,side,row});
const dots=[64,116,168,220,272,324,376,428,480];

export const ringBeamEavesCleanCorrection={
 revision:'roof-batch1-r4-clean-lines-2026-11-01',
 sourceTracing:null,
 sourceReconstruction:{
  method:'以原图实体、共用层界、孔洞和上部钢筋逐对象重建原生SVG；不调用扫描轮廓，不嵌入原图。',
  source:'public/images/roof/free-fall-ring-beam-eaves-01-diagram.png',
  sourceSha256:'12ff3b9a59ebf89a3cfa13178e33e0ad017eb8b8e7994fdb56822e6bc9a822b8',
  figure:null,checkedOn:'2026-11-01',
  graphicUnits:'不按比例图示坐标；薄层为阅读作适度分离，不从像素推算材料厚度或钢筋间距。',
  sourceObservation:'已查看535×307原图、4倍全图、5倍檐端/配筋局部和逐像素放大；确认三个完整板孔、上部线/截点、檐端弯折与圈梁下部材料界线。',
  reinforcementEvidence:{member:'原图上部防水层内的线与截点',visibleLine:'沿层内横向延伸，左端短折保持在挑出唇口内',sectionDots:dots.map(x=>[x,81]),identification:'保留9处可辨剖点的图示身份；不解释为本节点所需设计数量或间距。'},
 },
 note:'60为原图檐端局部水平尺寸。保留传统刚性防水教学实例；配筋、层厚与锚固参数未标，图示不作施工取值。',
 teaching:'从挑出唇口下侧识读滴水，分别追踪上部防水层、隔离薄层、结构挑檐与右侧空心板，辨认圈梁和下部墙身的材料分界。',
 uncertainties:[
  '原图隔离薄层及结构外侧细边带没有厚度或完整材料说明；保留各自层界，不补材料配比、层厚与现代设防。',
  '原图上层横线、9处可辨截点及檐端短折保留在上部防水层内；细部墨线合并处不足以确定弯钩构造，不新增长钩、箍筋或结构配筋。',
  '右端为截取边，仅保留3个完整孔；孔径、板厚和孔距没有数值证据。',
  '60保留原图挑出唇口外缘至图示檐端细边带外缘的局部水平投影；细边带材料身份未核定，不把该测点冒称已核定的混凝土结构面。',
  '本稿为待核对矢量清理稿，未替换正式图；历史单一刚性层不代表满足现行整屋面设防要求。',
 ],
 checks:[
  '防水层上缘、层内钢筋线、隔离层上下缘、结构顶面分别为独立整齐线条，不以同一粗黑边代替。',
  '檐端短折归于上部防水层内的原图钢筋线；9处可辨截点独立于材料图例，不在L形结构内补造配筋。',
  'L形圈梁带挑檐板与下部墙身在y=189共界；其不同原图材料图例保留为清淡疏线。',
  '右侧空心板用3个完整椭圆孔重建，右端保留截取折线，不添加第四个半孔。',
  '60两端复用原图防水唇口与图示檐端外缘的投影锚点；后者属于未命名细边带，材料身份不补造。滴水引线位于上唇口下侧。',
 ],
 build(){
  const levels={waterproofTop:74,steelLine:79.5,waterproofBottom:87,isolationBottom:91,structuralTop:96,cantileverBottom:116,beamWall:189,wallBottom:294};
  let s=`<defs>
   <pattern id="ring-eaves-wall-hatch" patternUnits="userSpaceOnUse" width="18" height="18"><path d="M-2-2L20 20M-2 16L2 20M16-2L20 2" fill="none" stroke="#7c838c" stroke-width=".4"/></pattern>
   <pattern id="ring-eaves-concrete-hatch" patternUnits="userSpaceOnUse" width="36" height="36"><path d="M-2-2L38 38M-2 16L20 38M16-2L38 20" fill="none" stroke="#7c838c" stroke-width=".38"/><path d="M8 5l3 5-5-1ZM27 25l-2 4 5-1Z" fill="none" stroke="#7c838c" stroke-width=".4"/></pattern>
  </defs>`;
  // The top layer keeps the source overhang and local underside drip profile.
  // The short steel turn below is deliberately a separate object inside it.
  s+=group('upper-waterproof-layer',path('M21 74H529V87H40L28 81L26 84H21Z','#fafbfc',.75));
  s+=group('waterproof-reinforcement-line',path('M25 82.5Q22.5 79.5 26.5 79.5H529','none',1.2));
  s+=group('waterproof-reinforcement-sections',dots.map((x,i)=>`<ellipse data-source-section="${i+1}" cx="${x}" cy="81" rx="1.45" ry="1.45" fill="${ink}"/>`).join(''));
  // Adjacent bands share exactly the same top/bottom ordinates.
  s+=group('isolation-layer',rect(40,87,489,4,'#f0f2f4',.65));
  s+=group('unlabelled-upper-edge-band',rect(40,91,489,5,'white',.65));
  // Thin source edge outside the structural L. Its material was not labelled.
  s+=group('unlabelled-soffit-edge-band',path('M40 96V122H301V294H307V116H45V96Z','white',.65));
  // One structural L, not a collage of a slab rectangle over a beam rectangle.
  s+=group('ring-beam-cantilever',path('M45 96H393V189H307V116H45Z','url(#ring-eaves-concrete-hatch)',1.25));
  s+=group('lower-wall',path('M307 189H393V294H307Z','url(#ring-eaves-wall-hatch)',1.2));
  // Source right edge and slab soffit remain distinct from the concrete section.
  s+=group('unlabelled-right-edge-band',path('M393 149H529M399 149V294','none',.65));
  s+=group('hollow-roof-slab',path('M404 96H529V119L534 122L529 125V144H397Z','url(#ring-eaves-concrete-hatch)',1.2));
  s+=group('three-complete-slab-voids',[424,464,504].map((x,i)=>`<ellipse data-source-void="${i+1}" cx="${x}" cy="122" rx="12.4" ry="12.8" fill="white" stroke="${ink}" stroke-width="1.05"/>`).join(''));
  // Explicit crop symbols are geometry, not traces of the old scanned border.
  s+=group('right-source-crop',path('M529 70V119M529 125V155','none',.65));
  s+=group('lower-source-crop',path('M295 294H344L349 289L354 299L359 294H405','none',.75));
  return {
   parts:[{id:'ring-beam-eaves-clean-section',body:`<g data-geometry-id="ring-beam-eaves-clean-section">${s}</g>`,box:[17,70,520,231]}],
   view:'圈梁带挑檐板檐口剖面',
   anchors:{waterproofEdge:[21,74],sourceEavesEdge:[40,96],dripLip:[26,84],steelLineStart:[26.5,79.5],steelSectionDots:dots.map(x=>[x,81]),isolationTop:[452,87],isolationBottom:[452,91],slabVoids:[[424,122],[464,122],[504,122]],wallBeamInterface:[348,189],levels},
   marks:[
    mark('防水层',[207,74],'left',50,[207,76]),
    mark('隔离层',[452,89],'right',54,[452,88]),
    mark('滴水',[26,84],'left',140,[27,83]),
    mark('圈梁带挑檐板',[204,108],'left',220,[204,118]),
   ],
   dimensions:[{id:'source-nose-offset',a:[21,74],b:[40,96],offset:40,label:'60',axis:'x',measuredObjects:['原图防水层挑出唇口外缘','图示檐端细边带外缘'],objectIds:['ring-eaves-upper-waterproof-layer','ring-eaves-unlabelled-soffit-edge-band'],sourceWitness:[[21,75],[40,99]],status:'source-projection-material-interface-unconfirmed',scope:'保留原图局部水平投影；第二对象是未命名细边带外缘，不据此确认混凝土结构测面。绘图坐标不代表60的比例。'}],
   interfaces:[
    {id:'upper-layer-and-steel',objects:['ring-eaves-upper-waterproof-layer','ring-eaves-waterproof-reinforcement-line','ring-eaves-waterproof-reinforcement-sections'],scope:'横线、可辨截点与檐端短折均归属上部层内，细线与材料边界分离。'},
    {id:'waterproof-isolation-substrate',objects:['ring-eaves-upper-waterproof-layer','ring-eaves-isolation-layer','ring-eaves-unlabelled-upper-edge-band','ring-eaves-ring-beam-cantilever'],scope:'y=87、91、96是相邻对象共用界线，不遗留扫描残梗。'},
    {id:'beam-wall-material-boundary',objects:['ring-eaves-ring-beam-cantilever','ring-eaves-lower-wall'],scope:'共用y=189的材料界面，L形混凝土骨料图例与墙身斜线图例分开。'},
    {id:'three-whole-voids',objects:['ring-eaves-hollow-roof-slab','ring-eaves-three-complete-slab-voids'],scope:'三个完整孔；右侧截取折线不增造半孔。'},
    {id:'nose-drip-and-dimension',objects:['ring-eaves-upper-waterproof-layer','ring-eaves-unlabelled-soffit-edge-band'],scope:'上唇口下侧为滴水引线落点；60保留唇口至图示檐端细边带外缘的原图投影，不补造该边带材料身份。'},
   ],
  };
 },
};
