// Source-led clean reconstruction of Figure 6-47(b), 2026-11-02.
// The four visible tile profiles and four cut steel battens come from the
// supplied PNG, not the earlier three-piece generic tile generator.
// u follows the photographed roof; v is normal to it. All distances below
// are drawing coordinates, not roof pitch, product dimensions or bar counts.
const radians = 24.5 * Math.PI / 180;
const C = Math.cos(radians), S = Math.sin(radians);
const xy = (u, v) => [+(45 + C*u + S*v).toFixed(3), +(470 - S*u + C*v).toFixed(3)];
const path = (d, fill = 'none', cls = 'outline', extra = '') => `<path d="${d}" fill="${fill}" class="${cls}" ${extra}/>`;
const role = (id, content, extra = '') => `<g data-role="${id}" ${extra}>${content}</g>`;
const band = (top, bottom, fill, extra = '') => path(`M0 ${top}H600V${bottom}H0Z`, fill, 'medium', extra);

// These are source-visible profiles. The head/overlap is not reconstructed as
// an unseen complete solid: the scan merges the tile return and the L upper
// edge at several joints. Only visible paths are retained in that area.
const tileProfiles = [
  {id:'A', start:-2, mainEnd:131, headEnd:181, first:true},
  {id:'B', start:131, mainEnd:264, headEnd:314},
  {id:'C', start:264, mainEnd:397, headEnd:447},
  {id:'D', start:397, mainEnd:529, headEnd:580, exposedHead:true},
];
const tileTop = (piece, u) => -70 + .072*(u-piece.start);
const tileLower = (piece, u) => -50 + .072*(u-piece.start);

function tileVisibleContour(piece) {
  const a=piece.start, b=piece.mainEnd, e=piece.headEnd;
  // The next upslope tile hides the continuation of this upper contour.
  // At the rightmost exposed piece the short top drop and narrow extension
  // remain visible, as in the original, rather than a flat rectangular cut.
  let d=`M${a} -70L${b} ${tileTop(piece,b)}`;
  if(piece.exposedHead) d+=`V${tileTop(piece,b)+17}L${e-7} ${tileLower(piece,e)-6}`;
  d+=`M${a} -70V-50`;
  if(piece.first) d+=`V-39H${a+15}V${tileLower(piece,a+15)}`;
  // Visible underside, followed by the short returned source contour. Its
  // functional identity and the ink-hidden part are deliberately unassigned.
  const lowerStart=piece.first?a+15:a;
  d+=`M${lowerStart} ${tileLower(piece,lowerStart)}L${e-13} ${tileLower(piece,e-13)}`;
  d+=`Q${e-10} ${tileLower(piece,e-13)-5} ${e-6} ${tileLower(piece,e)-5}`;
  d+=`Q${e+1} ${tileLower(piece,e)-3} ${e} ${tileLower(piece,e)+4}`;
  d+=`L${e-7} ${tileLower(piece,e)+6}L${e-9} ${tileLower(piece,e)-1}`;
  return role('overlapping-block-tile', path(d, 'none', 'outline'),
    `data-source-tile="${piece.id}" data-visible-contours-only="true"`);
}

function build() {
  const boundaries={slabBottom:99, slabTop:51, mortarTop:39, waterproofTop:33, c15Top:6, counterTop:0};
  let s=`<defs>
    <pattern id="tile-steel-r2-concrete" patternUnits="userSpaceOnUse" width="47" height="29"><path d="M7 6l8 6-8 4ZM32 20l6-4 4 8Z" fill="none" stroke="#909aa5" stroke-width=".7"/><path d="M25 5h.8M17 24h.8" stroke="#909aa5" stroke-width="1.25"/></pattern>
    <pattern id="tile-steel-r2-mortar" patternUnits="userSpaceOnUse" width="19" height="19"><path d="M-2 2L2-2M0 19L19 0M17 21L21 17" stroke="#909aa5" stroke-width=".55"/></pattern>
  </defs>`;
  // Neighbouring layers share exact interfaces. No reinforcement geometry is
  // invented: the source mesh specification remains in its text callout.
  s+=role('reinforced-concrete-roof-slab',band(boundaries.slabTop,boundaries.slabBottom,'url(#tile-steel-r2-concrete)'));
  s+=role('cement-mortar-leveling',band(boundaries.mortarTop,boundaries.slabTop,'url(#tile-steel-r2-mortar)'));
  s+=role('waterproof-one-selected-alternative',band(boundaries.waterproofTop,boundaries.mortarTop,'#d4dbe3'));
  s+=role('reinforced-fine-aggregate-concrete',band(boundaries.c15Top,boundaries.waterproofTop,'url(#tile-steel-r2-concrete)'));
  s+=role('steel-flat-counter-batten-along-slope',band(boundaries.counterTop,boundaries.c15Top,'#e4e8ed'));

  const supports=tileProfiles.map((piece,index)=>{
    const right=piece.headEnd-7, left=right-4, toe=left-23;
    // The source short bottom limb points LEFT/downhill. It shares the
    // counter-batten upper boundary; it is not the earlier uphill toe.
    const top=tileLower(piece,piece.headEnd)+6;
    const section=`M${left} ${top}H${right}V0H${toe}V-4H${left}Z`;
    s+=role('steel-angle-transverse-batten',path(section,'#e4e8ed','medium'),
      `data-source-member="${index+1}" data-foot-direction="downhill"`);
    return {tile:piece.id,webTop:[[left,top],[right,top]],foot:[[toe,0],[right,0]],toeU:toe,webU:left};
  });
  // Contours are visible-only open paths. There is no full hidden tile filled
  // over another full tile and no white patch hiding overlapping solids.
  s+=tileProfiles.map(tileVisibleContour).join('');

  const body=`<g data-geometry-id="tile-steel-roof-section"><g transform="matrix(${C} ${-S} ${S} ${C} 45 470)">${s}</g></g>`;
  return {
    parts:[{id:'tile-steel-roof-section',body,box:[5,168,655,404]}],
    view:'沿屋面坡向的局部剖面',
    marks:[
      {name:'块瓦（顺坡搭接）',target:xy(468,-65),side:'right',row:165},
      {name:'钢挂瓦条 L30×4；中距按瓦材规格',target:xy(supports[3].webU+2,-11),side:'right',row:225},
      {name:'钢顺水条 −25×5；中距600',target:xy(520,3),side:'right',row:285},
      {name:'C15细石混凝土找平层35；配φ6@500×500钢筋网',target:xy(426,19),side:'right',row:345},
      {name:'高聚物改性沥青防水卷材3（合成高分子防水涂膜≥2）',target:xy(325,36),side:'right',row:405},
      {name:'1∶3水泥砂浆找平层15',target:xy(222,45),side:'right',row:465},
      {name:'钢筋混凝土屋面板',target:xy(105,76),side:'right',row:525},
    ],
    dimensions:[],
    anchors:{
      localCoordinateMeaning:'原图识读用绘图坐标，非工程尺寸；u向上坡、v向屋面下侧。',
      layerInterfaces:Object.fromEntries(Object.entries(boundaries).map(([key,v])=>[key,[xy(0,v),xy(600,v)]])),
      tileVisibleGroups:tileProfiles.map(piece=>({id:piece.id,start:xy(piece.start,-70),mainEnd:xy(piece.mainEnd,tileTop(piece,piece.mainEnd)),headEnd:xy(piece.headEnd,tileLower(piece,piece.headEnd)+6),visibleContoursOnly:true})),
      steelLSections:supports.map(a=>({...a,webTop:a.webTop.map(p=>xy(...p)),foot:a.foot.map(p=>xy(...p)),toeDirection:'downhill'})),
      visibleTileCount:4,visibleLSectionCount:4,reinforcementGeometryAdded:false,
    },
    interfaces:[
      {id:'tile-steel-layer-sequence',objects:['reinforced-concrete-roof-slab','cement-mortar-leveling','waterproof-one-selected-alternative','reinforced-fine-aggregate-concrete','steel-flat-counter-batten-along-slope'],scope:'由下至上保留板、15砂浆、防水、35C15配网层及连续顺水条；相邻材料共界，不画成两道防水。'},
      {id:'tile-steel-downhill-L-foot',objects:['steel-angle-transverse-batten','steel-flat-counter-batten-along-slope'],scope:'四处L形短底肢朝下坡，底面落在连续顺水条顶；不增加原图未示的焊缝、钉或锚固。'},
      {id:'tile-steel-visible-lap',objects:['overlapping-block-tile','steel-angle-transverse-batten'],scope:'四组源图可见瓦面、下缘返回与四处支承逐组对应；墨线合并处只保留可见轮廓，不封造隐藏瓦体或给小返回命名为固定件。'},
    ],
    orthogonalChecks:[],
  };
}

export const steelTileCorrection = {
  revision:'roof-batch2-steel-r2-source-2026-11-02',
  build,
  checks:[
    '直接重看主PNG和完整图6-47(b)：恢复原图可见4段瓦与4处L形短支承；四组仅为源图局部范围。',
    '逐组核对角钢短底肢向下坡而非上坡；L底面与顺水条顶共界，不以矩形薄条代替L形。',
    '瓦采用源图可见分段轮廓，保留最左小返边和最上坡暴露的短落差、细延伸与小回转，不以隐藏实体相互重叠掩盖接口。',
    '结构板→15砂浆→防水→35C15配网层→顺水条→短L→瓦的顺序及原实例文字不变；不补出3个网筋截点。',
  ],
  sourceFeatures:[
    {id:'steel-four-source-groups',locator:'图6-47(b)主PNG下部，约x24～550/y500～740',observation:'原图可见四段阶梯瓦面及四个短支承；来源不是旧生成器中三段的自述。'},
    {id:'steel-downhill-angle-foot',locator:'原图约x175/y695、x300/y640、x420/y590及x540/y535各支承下部',observation:'短底肢向左/下坡延伸，底面落在连续条材上；不补焊缝或固定钉。'},
    {id:'steel-tile-visible-returns',locator:'原图最左外露瓦端及各搭接/支承处、最上坡右端',observation:'保留小返边和暴露的台阶/细延伸/小回转；瓦尾与角钢上缘连墨的隐藏关系不由清稿推定。'},
    {id:'steel-original-layer-labels',locator:'图6-47(b)主PNG及完整图(b)引注',observation:'保留L30×4、−25×5/600、C15/35、配φ6@500×500、3（≥2）及1∶3/15的原实例身份。'},
  ],
  uncertainties:[
    '源图局部瓦尾、小回转与L顶缘墨线合并，实际瓦型、隐藏挂钩断面及接触面积不能逐线核定；本图只清绘有证可见投影，不表示完整产品断面或固定做法。',
    '四段瓦、四处L和绘图坡角仅恢复原图可见范围，不给出工程铺设数量、屋面坡度、瓦搭接长度或结构板厚。',
    '原图φ6@500×500仅保留文字；未从模糊图形补造网筋根数、保护层、锚固或三维模型钢筋。',
    'C15、厚35/15/3、≥2、条材规格及间距是原图历史实例，不作为现行通用要求；连接、防腐、抗风、设防等级和产品适用性仍须完整设计另核。',
  ],
};
