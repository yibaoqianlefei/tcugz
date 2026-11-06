// Native reconstruction of the supplied historical outlet detail.
// All coordinates below are graphic units, never engineering dimensions.
const ink='#28313b';
const path=(d,fill='none',width=.75,extra='')=>`<path d="${d}" fill="${fill}" stroke="${ink}" stroke-width="${width}" stroke-linecap="butt" stroke-linejoin="round" ${extra}/>`;
const role=(name,body)=>`<g data-role="${name}">${body}</g>`;
const mark=(name,target,side,row,sourceTarget=target)=>({name,target,sourceTarget,side,row});
const mirror=body=>`<g transform="translate(358 0) scale(-1 1)">${body}</g>`;
const cubic=(a,b,c,d,t)=>(1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t*t*c+t**3*d;
// Intersections of the clean, designed meridian with each horizontal wire.
// These are graphic constraints only, not measurements of wire or mesh size.
function outsideAtY(y){
 const q=y<=126?[[179,86],[155,86],[138,104],[138,126]]:[[138,126],[138,143],[146,155],[162,166]];
 let lo=0,hi=1;
 for(let i=0;i<40;i++){const t=(lo+hi)/2;if(cubic(...q.map(p=>p[1]),t)<y)lo=t;else hi=t;}
 return cubic(...q.map(p=>p[0]),(lo+hi)/2);
}

export const outletIronCleanCorrection={
 revision:'roof-batch1-r4-clean-lines-2026-11-01',
 sourceTracing:null,
 sourceReconstruction:{
  method:'按原图可辨构件与共用层界，以原生SVG路径重建；删除扫描墨块、旧引线与粗糙轮廓，不引用轮廓描摹数据。',
  source:'public/images/roof/straight-rainwater-outlet-cast-iron-diagram.png',
  sourceSha256:'dd0f471290856a79d879d1ccb00534fe70b4cc20009db1223b38f7f59dd2c298',
  figure:null,
  graphicUnits:'仅为不按比例图示坐标；球径、丝径、网距、管径、壁厚和洞口尺寸均不从像素确定。',
  checkedOn:'2026-11-01',
  evidence:'沿用audit-output/roof-source-redraw-batch-01-2026-10-30/evidence.json中本图已查依据与限制；本次为线稿清理，不新增规范要求。',
  nativeObjects:['slab-opening','mortar-setting','cast-iron-cup','waterproof-turn','sealant-joint','source-unidentified-inner-band','wire-net-open-tail'],
  retainedUnidentifiedFeature:'原图杯口内侧另有左右闭合斜带与短横返回端，单独保留其轮廓和邻接，不将其命名为额外防水层。'
 },
 note:'原图实例，1∶2.5为原标砂浆配比。钢丝球、铸铁口及周边防水关系按原图重绘；薄层作识读夸大，未标尺寸不补造。',
 teaching:'观察钢丝球的通透网格和喉内分散收束端，再沿卷材转折、油膏嵌缝、铸铁口杯和周边砂浆追踪板洞口关系。',
 uncertainties:[
  '钢丝球是原图历史拦污构件；既有规范核对没有指定该形式及球径、丝径、网格间距，不将本图改称现行通用产品。',
  '原图未给管径、壁厚、洞口尺寸或砂浆厚度；本次绘图坐标与线宽均不作为工程尺寸。',
  '保留原图所示屋面薄层与口杯转折，不据有限截图补齐现代完整设防、材料规格和未示连接。',
  '杯口内侧的两条闭合斜带在原图中可辨，其材料身份和与相邻卷材的具体做法未唯一确定；按可见外形独立保留，不称为新增防水层。',
  '既有12J201核对只实际读到A12，未取得A18～A20完整图页，不能验证本图球网及口杯制造型号；产品适配、排水性能与维护条件仍未核定。',
  '1∶2.5仅为原图砂浆实例标注；规范适用状态与旧强条限制沿用既有依据记录，本次不新增合规结论。'
 ],
 checks:[
  '钢丝球保留细线横竖网格；外缘与内部丝线均下行进入喉部，并以5个彼此分开的开放端点结束，不用封闭尖壳。',
  '铸铁口杯保持两侧翻边、斜向口杯和短段直管；管腔留白，下端仅封合两侧壁厚，不跨腔连线或擅自延长管段。',
  '结构板洞口、周边砂浆及铸铁口共用接触边，卷材独立沿坡面转入杯口，油膏嵌缝仅以局部窄带表达。',
  '杯口内侧左右闭合斜带单独绘制，左侧从约128、141斜下至157、167并以短横端返回150、167，右侧相应保留；带端接近球网喉部而不与网丝合并。',
  '主体剖切、薄层边界、网丝和材料图例分级；原生细线替代扫描墨块与旧引线残梗。',
  '砂浆标注仍为1∶2.5，dimensions为空，不从图示比例增设丝径、网距、管径或壁厚标注。'
 ],
 build(){
  const slab='M34 154H99L130 185V202H34Z';
  // Shared edges: the slab opening is 99/154 -> 130/185 -> 130/202;
  // the mortar follows the flange and the outer cup wall without overlap.
  const mortar='M34 128L117 142L145 169V173L113 144H92V150H110L138 178V202H130V185L99 154H34Z';
  const cup='M92 144H113L145 173V270H138V178L110 150H92Z';
  // The lower edge is the same path used by the mortar above the cup.
  const membrane='M34 124L119 139L148 166L145 169L117 142L34 128Z';
  const sealant='M112 137.765L119 139L125 144.586L122.985 146.773L117 142L111.563 140.703Z';
  // Independently visible source feature: closed sloping strip plus a short
  // horizontal return. Its material/technical identity is unresolved.
  const unidentifiedInnerBand='M123 141H128L157 167H150Z';
  let s=`<defs>
   <pattern id="iron-clean-concrete" patternUnits="userSpaceOnUse" width="28" height="28"><path d="M-3 3L3-3M0 28L28 0M25 31L31 25" fill="none" stroke="#7c838c" stroke-width=".38"/><path d="M9 11l3 5H7ZM23 21l2 3h-4Z" fill="none" stroke="#7c838c" stroke-width=".4"/><circle cx="20" cy="7" r=".42" fill="#7c838c"/></pattern>
   <pattern id="iron-clean-mortar" patternUnits="userSpaceOnUse" width="15" height="14"><path d="M3 4h.8M10 10h.8" stroke="#7c838c" stroke-width=".48"/></pattern>
   <pattern id="iron-clean-metal" patternUnits="userSpaceOnUse" width="14" height="14"><path d="M-2 2L2-2M0 14L14 0M12 16L16 12" fill="none" stroke="#7c838c" stroke-width=".38"/></pattern>
  </defs>`;
  const slabs=path(slab,'url(#iron-clean-concrete)',1.25);
  s+=role('slab-opening',slabs+mirror(slabs));
  const mortars=path(mortar,'url(#iron-clean-mortar)',.65);
  s+=role('mortar-setting',mortars+mirror(mortars));
  const cups=path(cup,'url(#iron-clean-metal)',1.1);
  s+=role('cast-iron-cup',cups+mirror(cups));
  const membranes=path(membrane,'#e8edf3',.7);
  s+=role('waterproof-turn',membranes+mirror(membranes));
  const seals=path(sealant,'#7b858f',.45);
  s+=role('sealant-joint',seals+mirror(seals));
  const innerBands=path(unidentifiedInnerBand,'white',.65);
  s+=role('source-unidentified-inner-band',innerBands+mirror(innerBands));
  // Five open meridians, including the two outer silhouette strands.
  // There is deliberately no closed wire envelope or bottom cap.
  let net=path('M170 194L162 184V166C146 155 138 143 138 126C138 104 155 86 179 86C203 86 220 104 220 126C220 143 212 155 196 166V184L188 194','none',.72);
  net+=path('M170 87.2C156 106 154 142 170 166V184L175 194M179 86V194M188 87.2C202 106 204 142 188 166V184L183 194','none',.62);
  for(const y of [94,102,110,118,126,134,142,150,158,166]){
   const a=outsideAtY(y);net+=path(`M${a.toFixed(4)} ${y}H${(358-a).toFixed(4)}`,'none',.58);
  }
  net+=path('M162 174H196M162 182H196','none',.58);
  s+=role('wire-net-open-tail',net);
  // The crop lines describe the source drawing extent, not a new material edge.
  s+=role('source-truncation',path('M34 114V210M324 114V210','none',.65));
  return {
   parts:[{id:'outlet-iron-clean-section',body:`<g data-geometry-id="outlet-iron-clean-section">${s}</g>`,box:[28,79,302,198]}],
   view:'铸铁水落口及钢丝球局部剖面',
   anchors:{wireCrown:[179,86],wireLeftNeck:[162,166],wireRightNeck:[196,166],wireOpenEnds:[[170,194],[175,194],[179,194],[183,194],[188,194]],cupInnerLeft:[145,173],cupOuterLeft:[138,178],cupInnerRight:[213,173],cupOuterRight:[220,178],pipeEndLeft:[141.5,270],pipeEndRight:[216.5,270],slabOpeningLeft:[[99,154],[130,185],[130,202]],slabOpeningRight:[[259,154],[228,185],[228,202]],membraneLeftTurn:[117,142],membraneRightTurn:[241,142],sealantRight:[238,140],unidentifiedBandLeftStart:[[123,141],[128,141]],unidentifiedBandLeftReturn:[[157,167],[150,167]],unidentifiedBandRightStart:[[235,141],[230,141]],unidentifiedBandRightReturn:[[201,167],[208,167]]},
   marks:[mark('镀锌钢丝球',[192,88.1],'right',72,[191,91]),mark('油膏嵌缝',[238,140],'right',119,[238,140]),mark('1∶2.5 水泥砂浆',[134,198],'left',228,[134,200])],
   dimensions:[],
   interfaces:[
    {id:'open-wire-ends',objects:['wire-net-open-tail','cast-iron-cup'],scope:'五条纵向线网由球面下行进入喉部，分别收束，末端不连接成封闭尖壳；横向网格保持通透。'},
    {id:'mortar-and-slab-opening',objects:['slab-opening','mortar-setting'],scope:'两侧砂浆共用板洞口斜边和竖边，不漂移、重叠或以黑块掩盖接缝。'},
    {id:'cast-cup-setting',objects:['cast-iron-cup','mortar-setting'],scope:'砂浆沿口杯翻边上下及外侧管壁嵌合；杯壁内腔保持开放，短管截断位置依原图。'},
    {id:'unidentified-inner-band-return',objects:['source-unidentified-inner-band','waterproof-turn','cast-iron-cup','wire-net-open-tail'],scope:'按原图保留卷材转折内侧的独立闭合斜带及短横返回端；其端部到球网喉部保留小间隙。材料身份未核定，不据轮廓新增技术层次名称。'},
    {id:'waterproof-collar-seal',objects:['waterproof-turn','sealant-joint','mortar-setting','cast-iron-cup'],scope:'卷材沿屋面向杯口转折，砂浆上界共用卷材下界；油膏为转折附近局部窄带，不替代整条卷材或管壁。'}
   ]
  };
 }
};
