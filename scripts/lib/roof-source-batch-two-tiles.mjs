import {steelTileCorrection} from './roof-tile-steel-source-correction.mjs';
import {mortarTileCorrection} from './roof-tile-mortar-source-correction.mjs';
import {woodTileCorrection} from './roof-tile-wood-source-correction.mjs';
// Native reconstruction of the three supplied block-tile roof sections.
// u follows the real roof slope; v is the section's normal direction.
// Graphic distances are intentionally not engineering dimensions.
const C=.9238795325, S=.3826834324;
const xy=(u,v)=>[+(50+C*u+S*v).toFixed(3),+(480-S*u+C*v).toFixed(3)];
const path=(d,fill='none',cls='outline',attrs='')=>`<path d="${d}" fill="${fill}" class="${cls}" ${attrs}/>`;
const role=(id,s)=>`<g data-role="${id}">${s}</g>`;
const rect=(x,y,w,h,fill='white',cls='medium')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" class="${cls}"/>`;
const line=(x,y,X,Y,cls='fine')=>path(`M${x} ${y}L${X} ${Y}`,'none',cls);
const param=(name,value,sourceLocator)=>({name,value,kind:'source-example',sourceLocator,conditions:'图6-47原图实例；单位mm，配比及C15为原图历史标注。不得作为其他瓦屋面、现行选材或结构设计的统一取值。'});
const parentSource='D:/剖面图/刚性防水屋面分隔缝做法/块瓦屋面构造.png';
// In drawing coordinates the next tile advances 215 along the roof. Its nose
// is 15 deep; matching that normal offset makes the returned nose rest on the
// preceding tile's upper face, rather than intersecting the tile body.
// These graphic proportions are not a pitch or tile-product specification.
const tileAdvance=215,tileThickness=9,tileNoseDepth=15;
const tileSlope=tileNoseDepth/tileAdvance;
const tileBottom=(start,u,base)=>base+tileSlope*(u-start)+tileThickness;

function section(kind){
 const wood=kind==='wood',mortar=kind==='mortar',prefix=`tile-${kind}`;
 const slabTop=0,slabBottom=48,mortarTop=-14,waterTop=-20,upperTop=mortar?-51:-54;
 const counterTop=wood?-80:-61;
 const tileBase=wood?-132:mortar?-72:-113;
 const starts=[-25,-25+tileAdvance,-25+tileAdvance*2],length=290;
 let s=`<defs>
 <pattern id="${prefix}-concrete" patternUnits="userSpaceOnUse" width="62" height="32"><path d="M8 6l8 5-7 6ZM41 21l6-5 5 8Z" fill="none" stroke="#929ba6" stroke-width=".8"/><path d="M27 6h1M17 26h1M57 12h1" stroke="#929ba6" stroke-width="1.6"/></pattern>
 <pattern id="${prefix}-mortar" patternUnits="userSpaceOnUse" width="17" height="17"><path d="M0 17L17 0" stroke="#9da5ae" stroke-width=".6"/></pattern>
 <pattern id="${prefix}-wood" patternUnits="userSpaceOnUse" width="32" height="32"><path d="M2 5C9 1 20 9 30 4M0 18C10 10 17 24 32 16M2 28C13 23 23 31 31 27" fill="none" stroke="#929ba6" stroke-width=".65"/></pattern>
 </defs>`;
 // Individual bodies share exact boundaries. The long diagonal is a real slope,
 // not scan distortion. Left and right ends retain section/crop identity.
 s+=role('reinforced-concrete-roof-slab',path(`M0 ${slabTop}H700V20L705 24L700 28V${slabBottom}H0V28L-5 24L0 20Z`,`url(#${prefix}-concrete)`));
 s+=role('cement-mortar-leveling',rect(0,mortarTop,700,-mortarTop,`url(#${prefix}-mortar)`));
 s+=role('waterproof-one-selected-alternative',rect(0,waterTop,700,mortarTop-waterTop,'#d6dde5'));
 if(mortar){
  const b=(start,u)=>tileBottom(start,u,tileBase);
  // The bedding meets the lowest tile underside at the lapped zones; it is a
  // continuous mortar body, not a manufactured batten or isolated pedestal.
  s+=role('reinforced-mortar-tile-bed',path(`M0 ${b(starts[0],0)}L265 ${b(starts[0],265)}V${b(starts[1],265)}L480 ${b(starts[1],480)}V${b(starts[2],480)}L695 ${b(starts[2],695)}H700V${waterTop}H0Z`,`url(#${prefix}-mortar)`));
 }else s+=role('reinforced-fine-aggregate-concrete',rect(0,upperTop,700,waterTop-upperTop,`url(#${prefix}-concrete)`));
 // The source explicitly specifies a two-way mesh; this uncluttered line and
 // three cross-sections express direction only, not a designed bar count.
 const meshY=(upperTop+waterTop)/2;
 s+=role('source-mesh-direction',line(8,meshY,692,meshY,'steel')+[115,335,555].map(u=>`<circle cx="${u}" cy="${meshY}" r="2.5" fill="#28313b"/>`).join(''));
 if(!mortar){
  s+=role(wood?'wood-counter-batten-along-slope':'steel-flat-counter-batten-along-slope',rect(0,counterTop,700,upperTop-counterTop,wood?`url(#${prefix}-wood)`:'#e2e7ed'));
  // The battens are cut across their run. Their direction is transverse to
  // this roof-slope section, distinct from the continuous counter-batten.
  for(const [i,u] of [235,450,665].entries()){
   const start=starts[i],top=tileBottom(start,u,tileBase);
   if(wood){
    const x=u-29;
    const leftTop=tileBottom(start,x,tileBase);
    s+=role('wood-transverse-batten',path(`M${x} ${leftTop}L${u} ${top}V${counterTop}H${x}Z`,`url(#${prefix}-wood)`,'medium',`data-source-member="${i+1}"`));
   }else{
    // Actual L section: an upstanding web and a short foot on the flat strip.
    // The web top touches the tile underside, not an unrelated air gap.
    const th=4,webLeft=u-5,webRight=u-5+th;
    const webLeftTop=tileBottom(start,webLeft,tileBase),webRightTop=tileBottom(start,webRight,tileBase);
    s+=role('steel-angle-transverse-batten',path(`M${webLeft} ${webLeftTop}L${webRight} ${webRightTop}V${counterTop-th}H${u+22}V${counterTop}H${webLeft}Z`,'#e2e7ed','medium',`data-source-member="${i+1}"`));
   }
  }
 }
 // Draw uphill tiles last: each new lower end covers the upper end of the
 // preceding tile. The three visible pieces are a local crop, not a roof count.
 for(const [i,start] of starts.entries()){
  const end=start+length,top=tileBase,bottomAtEnd=tileBottom(start,end,top);
  const noseWidth=9;
  let tile=path(`M${start} ${top}L${end} ${top+tileSlope*length}V${bottomAtEnd}L${start+noseWidth} ${tileBottom(start,start+noseWidth,top)}V${top+tileNoseDepth+tileSlope*noseWidth}L${start} ${top+tileNoseDepth}Z`,'#fbfcfd','outline',`data-source-tile="${i+1}"`);
  // Retain the small bent/returned tile nose instead of a flat bar silhouette.
  tile+=line(start+noseWidth,top+tileThickness+tileSlope*noseWidth,start+38,top+tileThickness+tileSlope*38,'fine');
  s+=role('overlapping-block-tile',tile);
 }
 // Everything remains one geometric group so its slope and relative scale
 // cannot diverge between a wide textbook sheet and a narrow node sheet.
 const body=`<g data-geometry-id="${prefix}-roof-section"><g transform="matrix(${C} ${-S} ${S} ${C} 50 480)">${s}</g></g>`;
 const marks=[
  {name:'块瓦（顺坡搭接）',target:xy(492,tileBottom(starts[2],492,tileBase)-tileThickness/2),side:'right',row:106},
 ];
 if(!mortar){
  const u=450,top=tileBottom(starts[1],u,tileBase);
  marks.push({name:wood?'木挂瓦条 30×25；中距按瓦材规格':'钢挂瓦条 L30×4；中距按瓦材规格',target:xy(u-3,(top+counterTop)/2),side:'right',row:164});
  marks.push({name:wood?'木顺水条 35×25h；中距500':'钢顺水条 −25×5；中距600',target:xy(340,(counterTop+upperTop)/2),side:'right',row:220});
 }
 marks.push({name:mortar?'1∶3水泥砂浆挂瓦层；最薄处20；配φ6@500×500钢筋网':'C15细石混凝土找平层35；配φ6@500×500钢筋网',target:xy(mortar?440:280,meshY+5),side:'right',row:mortar?190:279});
 marks.push({name:'高聚物改性沥青防水卷材3（合成高分子防水涂膜≥2）',target:xy(mortar?325:205,(waterTop+mortarTop)/2),side:'right',row:mortar?267:332});
 marks.push({name:'1∶3水泥砂浆找平层15',target:xy(mortar?210:135,mortarTop/2),side:'right',row:mortar?338:390});
 marks.push({name:'钢筋混凝土屋面板',target:xy(70,26),side:'right',row:466});
 const interfaces=[
  {id:`${prefix}-lower-layer-sequence`,objects:['reinforced-concrete-roof-slab','cement-mortar-leveling','waterproof-one-selected-alternative',mortar?'reinforced-mortar-tile-bed':'reinforced-fine-aggregate-concrete'],scope:'结构板、15厚找平层、防水层及其上部配网层依原图从下至上相邻；各共界不交换，不同材料不重复占面。'},
  {id:`${prefix}-tile-overlap`,objects:['overlapping-block-tile'],scope:'每一上坡瓦的下端叠盖前一瓦的上端，保留三段局部可见瓦及鼻端返回；不表示工程实际铺设数量。'},
 ];
 if(!mortar)interfaces.push({id:`${prefix}-batten-contact`,objects:[wood?'wood-counter-batten-along-slope':'steel-flat-counter-batten-along-slope',wood?'wood-transverse-batten':'steel-angle-transverse-batten','overlapping-block-tile'],scope:'顺水条沿坡向连续，挂瓦条为横向构件的剖切；挂瓦条底落在顺水条顶、上端接触瓦底，不补钉、焊缝或穿透防水的连接。'});
 else interfaces.push({id:`${prefix}-bed-support`,objects:['reinforced-mortar-tile-bed','overlapping-block-tile'],scope:'砂浆卧瓦连续承托保留；没有顺水条或挂瓦条，不把砂浆承托表达为经过核定的全部抗风固定。'});
 return {parts:[{id:`${prefix}-roof-section`,body,box:[-20,93,770,443]}],view:'沿屋面坡向的局部剖面',marks,dimensions:[],anchors:{slabTop:xy(0,0),slabBottom:xy(0,48),levelingTop:xy(0,mortarTop),waterproofTop:xy(0,waterTop),upperLayerTop:xy(0,mortar?tileBottom(starts[0],0,tileBase):upperTop),meshLine:[xy(8,meshY),xy(692,meshY)],tileStarts:starts.map(u=>xy(u,tileBase)),tileOverlapLengthGraphic:length-tileAdvance},interfaces,orthogonalChecks:[],viewLabels:[{text:'局部坡向剖面 · 不按比例',at:[315,560]}]};
}

const sharedUncertainties=[
 '原图为沿坡向局部剖面，不能从绘图角度推算实际屋面坡度、瓦搭接长度或结构板厚；三段瓦及三处条材仅为本视图可见示意，不是设计数量。',
 '3厚高聚物改性沥青卷材与括注合成高分子防水涂膜≥2保留原图列示关系，只画一处防水层，不并画成两道必设材料。当前采用条件仍须按实际产品与完整设防设计核查。',
 'φ6@500×500来自原图文字；图中配网方向线及三个截点只辅助识读，不反推实际根数、锚固或保护层。',
 '原图未示支座、保温、檐口出口、条材与基层完整锚固或抗风措施，不额外补画。',
];
const features=[
 {id:'inclined-section',locator:'原图下部整幅坡向剖面',observation:'结构板、层界及瓦件沿同一实际坡向，不把该斜向认作扫描歪斜。'},
 {id:'tile-laps-and-noses',locator:'坡面最上部三段可见瓦及其搭接处',observation:'瓦片相互搭接，左侧露出小返回鼻端，不能画成一条不分片的平直面层。'},
 {id:'mesh-source-label',locator:'图6-47各分图挂瓦/细石混凝土层括注',observation:'保留φ6@500×500钢筋网的原图标注，不由模型对象名代替。'},
 {id:'thin-waterproof-layer',locator:'15厚找平层与配网层之间',observation:'保留一处连续薄层，卷材和涂膜为原图列示的替代标法；不用两条粗黑带表达两道材料。'},
];
const locator=(letter,part)=>`图6-47(${letter}) ${part}；完整原图 ${parentSource}`;
const commonParams=letter=>[
 param('找平层配比/厚度','1∶3水泥砂浆，15',locator(letter,'下部找平层引注')),
 param('防水卷材厚度','高聚物改性沥青防水卷材3',locator(letter,'防水层主引注')),
 param('防水涂膜替代标注','合成高分子防水涂膜≥2',locator(letter,'防水层括注')),
 param('配网','φ6@500×500',locator(letter,'配网括注')),
];

export const roofTileDrawings=[
 {
  id:'steel-batten-tile-roof-01',title:'块瓦屋面 · 钢挂瓦条',file:'steel-batten-tile-roof-01.png',figure:'图6-47(b)',
  supplementalSources:[{path:parentSource,figure:'图6-47(b)',scope:'补核右侧截断参数和层序'}],
  parameters:[...commonParams('b'),param('细石混凝土层','C15，厚35',locator('b','C15细石混凝土找平层引注')),param('钢挂瓦条','L30×4，中距按瓦材规格',locator('b','挂瓦条引注')),param('钢顺水条','−25×5，中距600',locator('b','顺水条引注'))],
  note:'原图实例，单位mm。顺坡剖面中区分连续顺水条与横向L形挂瓦条；防水替代材料仅示一层。',
  teaching:'由搭接瓦向下追踪L形挂瓦条、顺水条、35厚配网细石混凝土、防水层、15厚找平层和结构板，比较条材支承与砂浆卧瓦。',
  checks:['保留L形挂瓦条立腿和短底腿，不误画成实心矩形木条。','顺水条与坡面平行，挂瓦条为横向剖切，与瓦底及顺水条共用接触锚点。','35厚C15配网层位于防水上方，防水下方是15厚1∶3砂浆层。','删去主PNG左侧邻图数字和右下角邻图残边，不把它们重绘为本图构造。'],
  uncertainties:[...sharedUncertainties,'现有钢挂瓦条模型知识卡曾将C15层放在结构板之上、15厚砂浆层之下，与原图层序不同。此稿按原图重绘；模型与卡片需另行比对，本次不改变其文件或对象。','钢条的防腐、焊接、锚栓、钉和固定穿透原图未示，不通过L形与扁条相接补造连接。'],
  sourceFeatures:[...features,{id:'steel-profiles',locator:'原图瓦下三处短L形断面与其下连续薄条',observation:'L30×4为横向挂瓦条，−25×5为顺水条；短立腿与瓦底相接、底腿落在顺水条。'}],
  build:()=>section('steel'),
 },
 {
  id:'mortar-bed-tile-roof-01',title:'块瓦屋面 · 砂浆卧瓦',file:'mortar-bed-tile-roof-01.png',figure:'图6-47(a)',
  supplementalSources:[{path:parentSource,figure:'图6-47(a)',scope:'补核右侧截断参数和层序'}],
  parameters:[...commonParams('a'),param('卧瓦砂浆','1∶3水泥砂浆挂瓦层，最薄处20',locator('a','上部挂瓦层引注；主PNG右侧裁断，完整图补核20'))],
  note:'原图实例，单位mm。20为卧瓦层最薄处，不能作均匀厚度；无挂瓦条、顺水条。',
  teaching:'识读瓦搭接与砂浆局部承托，沿下部连续防水层追踪至15厚找平层和结构板，比较砂浆承托与挂瓦条承托的差别。',
  checks:['完整图补核挂瓦层最薄处20，不根据主PNG残字或模型名猜数。','配网仍归上部卧瓦砂浆，不画入结构板，也不增加35厚C15层。','瓦下局部砂浆支持与卧瓦层连通，不加入L形挂瓦条或木条。','20及φ6@500×500仅在文字中保留原图实例身份，不用像素距离标成实际比例尺寸。'],
  uncertainties:[...sharedUncertainties,'主PNG“最薄处2…”右侧被截断，本次20由完整图6-47(a)读取；配比、最薄处20与网片参数不外推到所有砂浆卧瓦系统。','原图上部瓦与砂浆接触的密黑小段不能确认专用固定件；保留为砂浆局部承托，不添加钉、胶或抗风固定。'],
  sourceFeatures:[...features,{id:'mortar-only-support',locator:'瓦与防水层之间的配网砂浆层及搭接下方',observation:'砂浆承托体系，无顺水条和挂瓦条；最薄处20不是35厚细石混凝土。'}],
  build:()=>section('mortar'),
 },
 {
  id:'wood-batten-tile-roof-01',title:'块瓦屋面 · 木挂瓦条',file:'wood-batten-tile-roof-01.png',figure:'图6-47(c)',
  supplementalSources:[{path:parentSource,figure:'图6-47(c)',scope:'补核右侧截断参数和层序'}],
  parameters:[...commonParams('c'),param('细石混凝土层','C15，厚35',locator('c','C15细石混凝土找平层引注')),param('木挂瓦条','30×25，中距按瓦材规格',locator('c','挂瓦条引注')),param('木顺水条','35×25h，中距500',locator('c','顺水条引注'))],
  note:'原图实例，单位mm。木挂瓦条与顺水条方向不同，35×25h保留原标记；不补未示固定件。',
  teaching:'从木挂瓦条的横向剖切与顺水条的连续方向，理解瓦面支承关系；将防水和配网细石混凝土分层追踪，避免同为条材而混淆方向。',
  checks:['横向木挂瓦条为实体木条剖切，不照搬钢L形。','连续木顺水条位于35厚配网细石混凝土层之上；后者位于防水层上方。','30×25与35×25h分别归挂瓦条和顺水条，不混用两者规格、间距或方向。','瓦片的真实搭接与小鼻端保留，不将原图局部坡面正交拉平。'],
  uncertainties:[...sharedUncertainties,'木条原图未注明树种、防腐处理方法、钉或螺栓规格，图上不新增；相关模型文字只作后续核对线索。'],
  sourceFeatures:[...features,{id:'wood-battens',locator:'原图瓦下短木条与连续顺坡木条',observation:'挂瓦条30×25为横向剖切；顺水条35×25h沿坡向，中距500；木条接触位置不等于已证实连接件。'}],
  build:()=>section('wood'),
 },
];

// Replace the rejected r1 geometry and its assertions together. The earlier
// three-piece generator is retained above for history, never used for r2.
for (const [id, correction] of [
 ['steel-batten-tile-roof-01', steelTileCorrection],
 ['mortar-bed-tile-roof-01', mortarTileCorrection],
 ['wood-batten-tile-roof-01', woodTileCorrection],
]) Object.assign(roofTileDrawings.find(d=>d.id===id), correction);
roofTileDrawings.find(d=>d.id==='mortar-bed-tile-roof-01').note =
 '原图实例，单位mm。挂瓦砂浆层最薄处20；保留瓦下可见短轮廓，不补未示条材或固定件。';
roofTileDrawings.find(d=>d.id==='mortar-bed-tile-roof-01').teaching =
 '比较连续砂浆窄带、瓦下无纹理区域与局部短轮廓，未定部位不补实体；沿防水层追踪至15厚找平层和结构板，结合原图实例识读砂浆卧瓦与条材挂瓦的区别。';
