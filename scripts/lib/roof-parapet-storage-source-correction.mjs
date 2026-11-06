// Coordinates follow the supplied PNG's local graphic proportions after
// straightening the wall/cap references. They are not engineering dimensions.
const ink='#28313b';
const path=(d,fill='none',cls='outline',attrs='')=>`<path d="${d}" fill="${fill}" stroke="${ink}" class="${cls}" ${attrs}/>`;
const line=(x1,y1,x2,y2,cls='medium',attrs='')=>path(`M${x1} ${y1}L${x2} ${y2}`,'none',cls,attrs);
const role=(id,s)=>`<g data-role="${id}">${s}</g>`;
const hidden='stroke-dasharray="10 6" style="stroke-width:1.1"';

export function correctedParapetStorage(){
 const prefix='storage-parapet-r2';
 const wall={left:235,right:359,top:106,bottom:588};
 const roof={end:834,protectionTop:355,protectionBottom:361,membraneBottom:366,thinBandBottom:371,slabTop:383,slabBottom:447};
 let s=`<defs><pattern id="${prefix}-hatch" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M-2 2L2-2M-2 27L27-2M23 27L27 23" fill="none" stroke="#838b94" stroke-width=".65"/></pattern><clipPath id="${prefix}-slab-crop"><path d="M375 383H834V447H375Z"/></clipPath></defs>`;
 // The source is cropped at the wall bottom; do not invent a closed base.
 s+=role('parapet-wall-source-section',`<path d="M235 106H359V588H235Z" fill="url(#${prefix}-hatch)" stroke="none"/>`+path('M235 588V106H359V588'));
 s+=role('parapet-cap',path('M199 74H403V121L359 106H235L199 117Z','white')+path('M207 82H395V105H207Z','url(#concrete)','medium'));
 // Keep the unlabelled strips neutral. Their existence is source evidence;
 // mortar composition/strength is not supplied by this drawing.
 s+=role('parapet-inner-thin-band',path('M359 106H366V347Q366 366 380 366H834V371H379Q359 371 359 347Z','white','medium'));
 s+=role('parapet-waterproof-turn',path('M366 106H370V347Q370 361 380 361H834V366H380Q366 366 366 347Z','#404952','medium'));
 s+=role('parapet-protection-turn',path('M370 106H378V330L403 355H834V361H380Q370 361 370 347Z','white','medium'));
 s+=role('roof-base-layer',path('M359 371H834V383H359Z','white','medium'));
 const hole=(x,y,r)=>`M${x-r} ${y}a${r} ${r} 0 1 0 ${r*2} 0a${r} ${r} 0 1 0-${r*2} 0Z`;
 // There are two visible board outlines, separated by a top-wide joint that
 // narrows at the bottom. The black source bottom does not prove a through-gap.
 let left='M375 383H717L719 410L723 444V447H375Z';
 for(const x of [410,481,551,621,691])left+=hole(x,415,27);
 let right='M729 383H861V447H725V444L726 410Z';
 for(const x of [762,833])right+=hole(x,415,27);
 s+=role('hollow-roof-slab',`<g clip-path="url(#${prefix}-slab-crop)">${role('source-left-board',path(left,'url(#concrete)','outline','fill-rule="evenodd"'))}${role('source-right-board',path(right,'url(#concrete)','outline','fill-rule="evenodd"'))}</g>`);
 s+=role('source-board-joint',path('M717 383L719 410L723 444M729 383L726 410L725 444','none','medium')+line(717,447,729,447));
 s+=role('slab-end-joint',path('M359 383H375V447H359Z','#35404a','medium'));
 // Outside hopper is an elevation/projection in the source, not a longitudinal
 // section. Its closed rim/collar outlines do not mean a capped flow channel.
 s+=role('external-rainwater-hopper',`<g data-view-kind="exterior-projection">`+
  role('hopper-top-rim',path('M85 365H235V384H85Z','white','medium'))+
  role('hopper-upper-body',line(98,384,98,456)+line(219,384,219,456))+
  role('hopper-body-bottom-rim',path('M85 456H235V470H85Z','white','medium'))+
  role('hopper-tapered-body',line(109,470,139,526)+line(217,470,205,526))+
  role('hopper-downpipe-collar',path('M134 526H213V541H134Z','white','medium'))+
  role('hopper-downpipe-projection',line(142,541,142,591)+line(205,541,205,591))+'</g>');
 s+=role('storage-parapet-hidden-upper-passage',line(235,255,359,255,'fine',hidden)+line(235,269,359,269,'fine',hidden));
 s+=role('storage-parapet-hidden-lower-passage',line(235,340,359,340,'fine',hidden)+line(235,354,359,354,'fine',hidden));
 s+=role('storage-parapet-upper-outlet-elbow',path('M235 255H179Q164 255 164 270V316H174V274Q174 269 180 269H235','white','medium'));
 s+=role('storage-parapet-upper-inlet-projection',path('M378 255H398V269H378','none','medium'));
 s+=role('storage-parapet-lower-outlet-projection',path('M235 340H204V354H235','none','medium'));
 s+=role('storage-parapet-lower-inlet-projection',path('M378 340H411V354H403','none','medium'));
 s+=role('storage-parapet-water-surface',line(399,270,834,270,'fine')+path('M559 274H620M564 279H615M570 284H609M577 289H602M585 294H594','none','medium'));
 const anchors={wall,roof,waterSurface:[834,270],upperFlashingProjection:[725,106],flashingStart:[366,106],overflowTop:[235,255],overflowBottom:[235,269],drainTop:[235,340],drainBottom:[235,354],slabTop:[375,383],slabBottom:[375,447],jointFace:[367,422],hollowCenters:[410,481,551,621,691,762,833].map(x=>[x,415]),boardJoint:{topLeft:[717,383],topRight:[729,383],lowerLeft:[723,444],lowerRight:[725,444],bottomConnection:'not-resolved-by-source'},hopper:{topRim:[85,365,150,19],bodyBottomRim:[85,456,150,14],pipeCollar:[134,526,79,15],pipeSides:[[142,541,142,591],[205,541,205,591]],projection:'exterior-elevation-not-longitudinal-section'}};
 return{parts:[{id:'water-storage-parapet-section',body:`<g data-geometry-id="water-storage-parapet-section">${s}</g>`,box:[79,65,762,532]}],view:'女儿墙蓄水排水 · 剖面及斗体投影',anchors,
  marks:[{name:'溢水孔中距同泄水孔',target:[194,255],side:'left',row:214},{name:'泄水孔中距≤15 m',target:[408,344],side:'right',row:310},{name:'沥青麻丝嵌缝',target:[367,422],side:'right',row:502}],
  dimensions:[{id:'source-water-surface-to-flashing-top',a:anchors.waterSurface,b:anchors.upperFlashingProjection,offset:884,label:'≥100',axis:'y',labelSide:0,status:'source-projection-material-interface-unconfirmed',measuredObjects:['原图水面水平投影','原图邻近压顶底/墙顶的上部水平投影'],scope:'两者绘图高差恢复原图比例；不将上界指定为已确证的某材料完成面，不作水深。'}],
  interfaces:[
   {id:'parapet-visible-waterproof-turn',objects:['parapet-inner-thin-band','parapet-waterproof-turn','parapet-protection-turn'],scope:'三条可辨带由压顶下方共同高度起，墙根相邻曲线严格共界；未标材料的外带和板上细带不补砂浆图例。'},
   {id:'parapet-mixed-view-hopper',objects:['external-rainwater-hopper','hopper-top-rim','hopper-body-bottom-rim','hopper-downpipe-collar'],scope:'按原图保留外形投影三处闭合横向轮廓；不将投影横沿解释为封堵流路或改成双壁纵剖。'},
   {id:'parapet-projected-two-wall-passages',objects:['storage-parapet-hidden-upper-passage','storage-parapet-hidden-lower-passage','storage-parapet-upper-inlet-projection','storage-parapet-lower-outlet-projection'],scope:'墙内双虚线与墙外原有端部竖边分别保留；投影端面不作为封堵装置证据。'},
   {id:'parapet-two-board-outlines',objects:['source-left-board','source-right-board','source-board-joint'],scope:'第5与第6完整孔之间保留上宽下窄板缝轮廓；底部连通及缝料未定。'},
  ],orthogonalChecks:[{id:'parapet-wall-left',points:[[235,106],[235,588]],relation:'vertical'},{id:'parapet-wall-right',points:[[359,106],[359,588]],relation:'vertical'},{id:'parapet-cap-top',points:[[199,74],[403,74]],relation:'horizontal'},{id:'parapet-water-level',points:[[399,270],[834,270]],relation:'horizontal'}]};
}
