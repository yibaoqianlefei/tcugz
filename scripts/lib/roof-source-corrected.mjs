import contours from './roof-source-corrected-contours.json' with {type:'json'};
import {parapetOrthogonalCorrection} from './roof-parapet-orthogonal.mjs';
import {highLowOrthogonalCorrection} from './roof-high-low-orthogonal.mjs';
import {outlet65CleanCorrection} from './roof-outlet-65-clean.mjs';
import {outletIronCleanCorrection} from './roof-outlet-iron-clean.mjs';
import {ringBeamEavesCleanCorrection} from './roof-ring-beam-eaves-clean.mjs';
const mark=(name,target,side='right',row=target[1],sourceTarget=target)=>({name,target,sourceTarget,side,row});
const dimension=(id,a,b,offset,label,axis='x',extra={})=>({id,a,b,offset,label,axis,...extra});
const part=(id,box)=>{const source=contours.sources.find(s=>s.id===id);return {id:id+'-source-section',body:`<g data-geometry-id="${id}-source-section">${source.path}</g>`,box};};
const base=id=>({sourceTracing:{method:contours.method,tool:contours.tool,source:contours.sources.find(s=>s.id===id)},revision:contours.revision});
const unit='mm';
export const roofSourceCorrections={
 'coating-parapet-flashing-01':{
  ...base('coating-parapet-flashing-01'),
  build:()=>({parts:[part('coating-parapet-flashing-01',[55,28,224,239])],view:'女儿墙泛水局部剖面',
   anchors:{roofSurface:[270,193],terminationDatum:[144,124],grooveTop:[115,104],additionalSheetEnd:[195,190],sealant:[138,208]},
   marks:[mark('水泥砂浆抹灰',[151,64],'right',60,[140,64]),mark('压条',[151,109],'right',100,[123,109]),mark('涂膜防水层',[151,134],'right',138,[140,134]),mark('附加卷材',[185,188],'right',177),mark('水泥钉',[61,129],'left',122,[119,129]),mark('防水油膏嵌缝',[174,247],'right',258,[138,208])],
   dimensions:[dimension('source-flashing-height',[270,193],[144,124],303,'≥250','y',{measuredObjects:['原图屋面表面界线','原图收头下部尺寸界线'],sourceWitness:[[280,193],[306,124]]}),dimension('source-termination-height',[144,124],[115,104],303,'60','y',{labelSide:1,measuredObjects:['原图收头下部尺寸界线','原图凹槽上缘'],sourceWitness:[[280,104],[306,124]]})],
   interfaces:[{id:'local-additional-sheet',objects:['source-turn','source-local-sheet'],scope:'保留原图转角上方局部附加卷材及x195附近止端，不延长成整屋面层。'},{id:'roof-end-seal',objects:['source-wall','source-slab','source-seal'],scope:'防水油膏位于墙与板端接缝，原板底抹灰边线保留。'}]}),
  checks:['对照原图恢复局部附加卷材止端和薄层相对位置，不把局部带延长至屋面右端。','凹槽、压条、水泥钉、墙面抹灰与板端油膏按原图轮廓及引线归属保留。','≥250与60沿原图右侧相邻尺寸段分别标注；坐标不作为施工尺寸。']
 },
 'coating-high-low-roof-flashing-01':{
  ...base('coating-high-low-roof-flashing-01'),
  build:()=>({parts:[part('coating-high-low-roof-flashing-01',[68,2,218,306])],view:'高低跨缝泛水局部剖面',
   anchors:{upperNail:[130,71],capFixedEdge:[134,98],upstandTop:[176,160],roofSurface:[278,220],upstandSlabInterface:[160,223],foldBottom:[137,173]},
   marks:[mark('水泥钉（上部）',[141,65],'right',48,[130,71]),mark('水泥砂浆抹灰',[141,86],'right',86,[133,86]),mark('压条',[141,115],'right',115,[127,118]),mark('镀锌薄钢板盖缝',[186,142],'right',148,[186,148]),mark('防水卷材',[224,205],'right',207,[224,212]),mark('嵌缝油膏',[69,119],'left',111,[118,119]),mark('水泥钉（收头处）',[69,150],'left',154,[123,126])],
   dimensions:[dimension('source-flashing-height',[278,220],[176,160],313,'≥250','y',{measuredObjects:['原图低屋面表面附近界线','原图矮墙上缘附近界线'],sourceWitness:[[292,219],[242,161]],scanTolerance:'原扫描界线存在约1～2像素倾斜；按对应构造界面中线定位，不由像素计算高度。'})],
   interfaces:[{id:'cap-fixed-edge',objects:['upper-nail','cap-upstand','cap-cover'],scope:'上部钉固竖边连续向下斜折到钢板盖缝；不把盖板误接到槽内压条。'},{id:'u-fold',objects:['high-wall','u-membrane','low-upstand'],scope:'高墙与矮墙间有缝，跨缝卷材保留U形余量。'},{id:'upstand-slab-material-interface',objects:['source-upstand','source-roof-slab'],scope:'矮墙斜线区和屋面板骨料区按原图分开，不合并成同一L形混凝土对象。'}]}),
  checks:['保留上部水泥钉至盖板固定竖边、斜边和跨盖的连续原线。','矮墙与下部屋面板之间恢复原材料图例分界。','保留U形跨缝和图中“防水卷材”原标，不把墙与矮墙刚接或填实。']
 },
 'straight-rainwater-outlet-65-01':{
  ...base('straight-rainwater-outlet-65-01'),
  build:()=>({parts:[part('straight-rainwater-outlet-65-01',[24,66,385,298])],view:'直管式水落口局部剖面',
   anchors:{outerLeft:[187,360],innerLeft:[196,360],innerRight:[235,360],outerRight:[243,360],visibleRearEdge:[213,191],upperCastPart:[223,107]},
   marks:[mark('油膏嵌缝',[97,134],'left',119,[97,141]),mark('定型铸铁水落口',[292,107],'right',94,[223,107]),mark('1∶2.5 水泥砂浆',[150,216],'left',245,[150,205])],
   dimensions:[dimension('source-outlet-inner-diameter',[196,360],[235,360],398,'100','x',{labelAtNode:[279,382],measuredObjects:['出水端左内壁','出水端右内壁']}),dimension('source-outlet-left-wall',[187,360],[196,360],398,'6','x',{labelSide:-1,measuredObjects:['出水端左外壁','出水端左内壁']}),dimension('source-outlet-right-wall',[235,360],[243,360],398,'6','x',{labelSide:1,measuredObjects:['出水端右内壁','出水端右外壁']})],
   interfaces:[{id:'source-nested-profiles',objects:['source-cast-inlet','source-recess','source-pipe'],scope:'嵌套轮廓、口腔内横向可见边线和出水端内口线按原图保留；不把细线误判为实体封堵。'}]}),
  teaching:'按原标定位定型铸铁水落口、周边砂浆与油膏，再识读6／100／6的测点。',
  checks:['定型铸铁水落口的引线仍指上部原标对象，不新增没有来源的“65型进水罩”名称。','保留口腔内横向可见线和管口下端内口线；其存在不表示管腔实心。','6／100／6的测点改回原图下口四条壁线，保留周边嵌套材料轮廓。']
 },
 'straight-rainwater-outlet-cast-iron-01':{
  ...base('straight-rainwater-outlet-cast-iron-01'),
  build:()=>({parts:[part('straight-rainwater-outlet-cast-iron-01',[30,82,298,192])],view:'铸铁水落口及钢丝球局部剖面',
   anchors:{wireTail:[179,194],wireCrown:[179,86],pipeEndLeft:[141,270],pipeEndRight:[216,270]},
   marks:[mark('镀锌钢丝球',[191,82],'right',71,[191,91]),mark('油膏嵌缝',[238,128],'right',116,[238,140]),mark('1∶2.5 水泥砂浆',[125,214],'left',228,[134,200])],dimensions:[],
   interfaces:[{id:'open-wire-ends',objects:['source-wire-sphere','source-wire-tail','source-cup'],scope:'球网下部为各自收束并留开端部的线网，不画成封闭梨形外壳。'},{id:'nested-recess',objects:['source-waterproof','source-mortar','source-cast-cup'],scope:'防水转折、砂浆与金属口杯按原图分别保留。'}]}),
  checks:['按原图保留钢丝球分散开口端部与网孔，不用封闭外轮廓概括尾部。','保留原管体到原截断范围，删除上一稿擅自拉长的管段。','钢丝直径、网距、管径、壁厚不从图中量取。']
 },
 'free-fall-ring-beam-eaves-01':{
  ...base('free-fall-ring-beam-eaves-01'),
  build:()=>({parts:[part('free-fall-ring-beam-eaves-01',[17,71,518,234])],view:'圈梁带挑檐板檐口剖面',
   anchors:{waterproofEdge:[21,75],structuralEdge:[40,99],dripLip:[27,83],slabVoids:[[424,122],[464,122],[503,122]],wallBeamInterface:[348,189]},
   marks:[mark('防水层',[207,72],'left',48,[207,76]),mark('隔离层',[452,71],'right',51,[452,88]),mark('滴水',[27,83],'left',130),mark('圈梁带挑檐板',[204,126],'left',214,[204,118])],
   dimensions:[dimension('source-nose-offset',[21,75],[40,99],40,'60','x',{measuredObjects:['原图防水层挑出唇口外缘','原图结构檐端外缘']})],
   interfaces:[{id:'three-whole-voids',objects:['source-hollow-slab'],scope:'原图仅有三个完整空心板孔；右端截断不增造第四半孔。'},{id:'nose-drip',objects:['source-waterproof-lip','source-drip'],scope:'滴水标注回到上层挑出唇口下侧。'},{id:'source-mesh',objects:['source-longitudinal-line','source-cross-section-dots'],scope:'按原图保留防水层内的线和截点；规格、数量设计与锚固未标，不补参数。'}]}),
  note:'60为原图檐端局部水平尺寸；图示钢筋未注明规格、间距与锚固。属传统屋面教学实例。',
  checks:['空心板保留原图三个完整孔及右端截取边，不新增半孔。','滴水引线指上层挑出唇口下侧，60指该唇口外缘至结构檐端的局部水平距离。','恢复原图上部钢筋线与截点、隔离层及圈梁/墙身材料分界；不补造配筋参数。']
 }
};
Object.assign(roofSourceCorrections['coating-parapet-flashing-01'],parapetOrthogonalCorrection);
Object.assign(roofSourceCorrections['coating-high-low-roof-flashing-01'],highLowOrthogonalCorrection);
Object.assign(roofSourceCorrections['straight-rainwater-outlet-65-01'],outlet65CleanCorrection);
Object.assign(roofSourceCorrections['straight-rainwater-outlet-cast-iron-01'],outletIronCleanCorrection);
Object.assign(roofSourceCorrections['free-fall-ring-beam-eaves-01'],ringBeamEavesCleanCorrection);
