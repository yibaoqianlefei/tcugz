// Source-led correction of 图 6-47(c), not a product/structural detail.
// All distances below are drawing coordinates. The source's mm values live
// in labels; neither this slope nor these graphic offsets defines a design.
const C = .9238795325, S = .3826834324;
const xy = (u, v) => [+(50 + C*u + S*v).toFixed(3), +(480 - S*u + C*v).toFixed(3)];
const path = (d, fill = 'none', cls = 'outline', attrs = '') => `<path d="${d}" fill="${fill}" class="${cls}" ${attrs}/>`;
const role = (id, body) => `<g data-role="${id}">${body}</g>`;
const rect = (x, y, w, h, fill = 'white', cls = 'medium', attrs = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" class="${cls}" ${attrs}/>`;

function buildWoodSection() {
  const prefix = 'tile-wood-r2';
  const width = 700;
  const slabTop = 0, slabBottom = 48, mortarTop = -14, waterTop = -20;
  const concreteTop = -54, counterTop = -80;
  // Four visible tile bodies and four batten sections belong to this source
  // crop. Their visible count is not the number of complete installed pieces.
  const advance = 170, tileLength = 215, tileThickness = 9, noseDepth = 12;
  const tileSlope = noseDepth / advance;
  const tileBase = -127;
  const starts = [-25, 145, 315, 485];
  const battens = starts.map((start, i) => {
    const right = start + 210, left = right - 30;
    // Keep a rectangular timber section. The rising tile's underside touches
    // its uphill edge; do not bevel the timber to fill an unproven interface.
    const top = tileBase + tileSlope*(right - start) + tileThickness;
    return { index: i+1, left, right, top, bottom: counterTop };
  });
  const tileTop = (start, u) => tileBase + tileSlope*(u-start);
  const tileBottom = (start, u) => tileTop(start, u) + tileThickness;
  let s = `<defs>
    <pattern id="${prefix}-concrete" patternUnits="userSpaceOnUse" width="62" height="32"><path d="M8 6l8 5-7 6ZM41 21l6-5 5 8Z" fill="none" stroke="#929ba6" stroke-width=".8"/><path d="M27 6h1M17 26h1M57 12h1" stroke="#929ba6" stroke-width="1.6"/></pattern>
    <pattern id="${prefix}-mortar" patternUnits="userSpaceOnUse" width="17" height="17"><path d="M0 17L17 0" stroke="#9da5ae" stroke-width=".6"/></pattern>
    <pattern id="${prefix}-wood-longitudinal" patternUnits="userSpaceOnUse" width="48" height="26"><path d="M0 7C12 2 24 12 48 5M0 20C16 11 31 25 48 17" fill="none" stroke="#929ba6" stroke-width=".65"/></pattern>
    <pattern id="${prefix}-wood-end-grain" patternUnits="userSpaceOnUse" width="38" height="34"><path d="M-5 3C9 1 24 5 33 16M-5 9C8 6 21 11 29 21M-5 16C5 13 14 17 20 25M-5 23C2 20 8 24 11 29" fill="none" stroke="#929ba6" stroke-width=".65"/></pattern>
  </defs>`;
  s += role('reinforced-concrete-roof-slab', path(`M0 ${slabTop}H${width}V20L705 24L700 28V${slabBottom}H0V28L-5 24L0 20Z`, `url(#${prefix}-concrete)`));
  s += role('cement-mortar-leveling', rect(0, mortarTop, width, -mortarTop, `url(#${prefix}-mortar)`));
  s += role('waterproof-one-selected-alternative', rect(0, waterTop, width, mortarTop-waterTop, '#d6dde5'));
  s += role('reinforced-fine-aggregate-concrete', rect(0, concreteTop, width, waterTop-concreteTop, `url(#${prefix}-concrete)`));
  // The old PNG explicitly names the mesh, but does not resolve individual
  // bar sections. Preserve that annotation instead of inventing three dots.
  s += role('wood-counter-batten-along-slope', rect(0, counterTop, width, concreteTop-counterTop, `url(#${prefix}-wood-longitudinal)`));
  for (const b of battens) {
    s += role('wood-transverse-batten', rect(b.left, b.top, b.right-b.left, b.bottom-b.top, `url(#${prefix}-wood-end-grain)`, 'medium', `data-source-member="${b.index}" data-section-form="rectangular"`));
  }
  for (const [i, start] of starts.entries()) {
    const end = start + tileLength;
    const noseWidth = 8;
    // At the exposed uphill end, the source has a drop from the raised body,
    // a thin continuation, and a small turned end. These visible contours must
    // survive even though their product/fixing identity is not established.
    // The continuation remains part of the source-local profile, not tile 5.
    const mainEnd = i===starts.length-1 ? 665 : end;
    const uphill = i===starts.length-1
      ? `L${mainEnd} ${tileTop(start,mainEnd)}V${tileTop(start,mainEnd)+6}L700 ${tileTop(start,700)+6}L704 ${tileTop(start,700)+12}L700 ${tileTop(start,700)+13}L696 ${tileBottom(start,696)}L${mainEnd} ${tileBottom(start,mainEnd)}`
      : `L${end} ${tileTop(start,end)}V${tileBottom(start,end)}`;
    const d = `M${start} ${tileBase}${uphill}L${start+noseWidth} ${tileBottom(start,start+noseWidth)}V${tileBase+noseDepth+tileSlope*noseWidth}L${start} ${tileBase+noseDepth}Z`;
    let tile = path(d, '#fbfcfd', 'outline', `data-source-tile="${i+1}" data-visible-scope="source-local-section"`);
    // A short source-visible underside return, not a fastening or another tile.
    tile += path(`M${start+noseWidth} ${tileBottom(start,start+noseWidth)}L${start+30} ${tileBottom(start,start+30)}`, 'none', 'fine');
    s += role('overlapping-block-tile', tile);
  }
  const body = `<g data-geometry-id="tile-wood-roof-section"><g transform="matrix(${C} ${-S} ${S} ${C} 50 480)">${s}</g></g>`;
  const markB = battens[1];
  const marks = [
    { name:'块瓦（顺坡搭接）', target:xy(530,tileTop(starts[3],530)+tileThickness/2), side:'right', row:106 },
    { name:'木挂瓦条 30×25；中距按瓦材规格', target:xy((markB.left+markB.right)/2,(markB.top+markB.bottom)/2), side:'right', row:164 },
    { name:'木顺水条 35×25h；中距500', target:xy(340,(counterTop+concreteTop)/2), side:'right', row:220 },
    { name:'C15细石混凝土找平层35；配φ6@500×500钢筋网', target:xy(280,(concreteTop+waterTop)/2), side:'right', row:279 },
    { name:'高聚物改性沥青防水卷材3（合成高分子防水涂膜≥2）', target:xy(205,(waterTop+mortarTop)/2), side:'right', row:332 },
    { name:'1∶3水泥砂浆找平层15', target:xy(135,mortarTop/2), side:'right', row:390 },
    { name:'钢筋混凝土屋面板', target:xy(70,26), side:'right', row:466 },
  ];
  return {
    parts:[{ id:'tile-wood-roof-section', body, box:[-20,93,770,443] }],
    view:'沿屋面坡向的局部剖面', marks, dimensions:[],
    anchors:{
      slabTop:xy(0,slabTop), slabBottom:xy(0,slabBottom), levelingTop:xy(0,mortarTop),
      waterproofTop:xy(0,waterTop), upperLayerTop:xy(0,concreteTop),
      counterBattenTop:xy(0,counterTop), tileStarts:starts.map(u=>xy(u,tileBase)),
      visibleTileBodies:starts.map((u,i)=>({ sourceVisibleIndex:i+1, start:xy(u,tileBase), end:xy(u+tileLength,tileTop(u,u+tileLength)), scope:'原图局部可见段，不代表完整瓦长' })),
      rectangularBattenCorners:battens.map(b=>({ sourceVisibleIndex:b.index, corners:[[b.left,b.top],[b.right,b.top],[b.right,b.bottom],[b.left,b.bottom]].map(([u,v])=>xy(u,v)), tileEdgeContact:xy(b.right,b.top), scope:b.index===4?'原图上坡局部端部可见位置，不代表完整构件':'局部剖切可见位置，不代表工程数量' })),
      sourceUphillTerminal:{ raisedBodyEnd:xy(665,tileTop(starts[3],665)), dropEnd:xy(665,tileTop(starts[3],665)+6), thinExtensionEnd:xy(700,tileTop(starts[3],700)+6), returnOutline:[xy(704,tileTop(starts[3],700)+12),xy(700,tileTop(starts[3],700)+13),xy(696,tileBottom(starts[3],696))], identity:'原图可见末端落差、细延伸及小回转；产品或固定身份未定' },
      meshAnnotationOnly:true,
    },
    interfaces:[
      { id:'tile-wood-lower-layer-sequence', objects:['reinforced-concrete-roof-slab','cement-mortar-leveling','waterproof-one-selected-alternative','reinforced-fine-aggregate-concrete','wood-counter-batten-along-slope'], scope:'结构板、15厚找平层、原图一处防水、35厚C15配网细石混凝土、木顺水条依次相邻；共用层界，不交换材料层。' },
      { id:'tile-wood-tile-laps', objects:['overlapping-block-tile'], scope:'保留原图四条局部可见瓦身长带，后片的下坡鼻端覆盖前片上坡端；不把可见段计数作为安装数量或完整瓦长。' },
      { id:'tile-wood-rectangular-batten', objects:['wood-transverse-batten','wood-counter-batten-along-slope','overlapping-block-tile'], scope:'横向木挂瓦条保持矩形剖切，底边与顺水条顶共界；瓦下边缘在条顶边缘落点接触。没有为贴合斜瓦而补削斜木顶、楔块或紧固件；精细接触范围不由此示意核定。' },
    ],
    orthogonalChecks:[],
    viewLabels:[{ text:'局部坡向剖面 · 不按比例', at:[315,560] }],
  };
}

export const woodTileCorrection = {
  revision:'roof-batch2-wood-r2-source-2026-11-02',
  build:buildWoodSection,
  checks:[
    '按单张原图与完整图6-47(c)恢复四条局部可见瓦身、四处木条剖切位置；上坡端可见位置不计作完整构件或工程根数。',
    '瓦身两条长边平行、图形厚度恒定；搭接鼻端方向按原图保留，不将旧稿误读为非等厚瓦。',
    '木挂瓦条采用矩形剖切，顶底边平行；不因瓦底倾斜而自动削斜木条顶部，也不增加楔块。',
    '最上坡主瓦身结束后的短落差、细延伸与末端小回转按原图可见轮廓保留，不因物理身份未定而删除，也不补成第五片完整瓦。',
    '顺水条沿坡向连续，挂瓦条为横向剖切；二者规格及500间距保持分别归属。',
    '35厚C15配网细石混凝土位于防水上方，15厚1∶3砂浆找平层位于防水下方；所有数值保留原图实例身份。',
    '配网保留原文φ6@500×500；原图密黑未能独立辨认网筋剖点，本稿不补出三点或指定剖筋数量。',
  ],
  sourceFeatures:[
    { id:'wood-four-source-visible-positions', locator:'单张原图下部坡向剖面及完整图6-47(c)；focused review 14-source-visible-pieces-numbered.png', observation:'原图可辨四条瓦身长带、四处横向木条剖切。前三瓦上坡端受后片搭接遮挡，最后一处位于局部上坡端，不能外推完整瓦数。' },
    { id:'wood-rectangular-section', locator:'原图瓦下四处短实体木条；B1～B4', observation:'短木条为实体剖切，不是钢L形或三角楔。上部与瓦鼻有粗墨粘连，未证实削顶；重建时保持矩形，接触细节留作未核定项。' },
    { id:'wood-exposed-uphill-return', locator:'单张原图上坡端约x510～550、y518～540；完整图6-47(c)右上端，坐标仅供图像定位', observation:'主瓦身上边在末端下降，接窄的延伸轮廓及小回转；该可见形状与其产品/固定身份分开记录，清稿保留可见线，不画成整段直切尾端。' },
    { id:'wood-layer-labels', locator:'图6-47(c)右上材料引注', observation:'挂瓦条30×25、顺水条35×25h/中距500、35厚C15配网层、一处防水替代标注、15厚1∶3找平及结构板均按原文归属。' },
  ],
  uncertainties:[
    '这是原图局部坡向剖面的清稿，绘图角度、长宽和接触偏移均为图形坐标，不是实际屋面坡度、瓦厚、搭接长度或木条工程尺寸。',
    '木条上边与瓦鼻处在原图中有密黑粘连，不能据此确认削斜、钉、垫块或完整固定方式。矩形木条与斜瓦仅表达可见边缘接触，不等于已核定承托长度或抗风连接。',
    '四处可见位置包括局部上坡端；最上坡落差、细延伸和小回转保留为可见轮廓，其产品瓦型、挂接或固定身份未核定，不补成第五片完整瓦。',
    '配网参数仅保留原图文字；图中不新增钢筋剖点数量、锚固、保护层或配筋设计。',
    '卷材3与括注涂膜≥2按原图列示关系仅画一处防水，不代表任意工程条件下均可互换；C15、35、配比及条材规格均为历史实例参数。',
    '未补原图未示的木材品种、防腐方法、紧固件、保温、屋面支座或檐口做法；模型对应和规范适用性仍需单独验收。',
  ],
};
