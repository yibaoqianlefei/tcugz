// Source-frame coordinates are for graphic correspondence only (990 x 571).
// Wall and horizontal references are straightened; real folds stay inclined.
const p=(d,fill='none',cls='outline',attrs='')=>`<path d="${d}" fill="${fill}" stroke="#28313b" class="${cls}" ${attrs}/>`;
const line=(a,b,cls='medium',attrs='')=>p(`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`,'none',cls,attrs);
const role=(id,s)=>`<g data-role="${id}">${s}</g>`;
const hidden='stroke-dasharray="10 6" style="stroke-width:1.15"';
const dim=(id,a,b,offset,label,objects)=>({id,a,b,offset,label,axis:'y',labelSide:0,status:'source-projection-material-interface-unconfirmed',measuredObjects:objects});

export function correctedEavesStorage(){
 const prefix='eaves-storage-r4';
 const wall={left:407,right:542,top:38,bearingTop:365,bearingBottom:505,bottom:560};
 const roof={end:934,upperBandTop:327,heavyLine:347,bottomBand:365,slabBottom:443};
 const rightFlare={innerTop:[389,365],outerTop:[403,365],innerKnee:[340,400],outerKnee:[350,403],bottom:493};
 const rightConcreteCorner=[350+(403-350)*(403-392)/(403-365),392];
 // The outlet is a separate thin-walled funnel, not a concrete shoulder.
 // Derive two parallel sloping faces and give them DISTINCT top endpoints.
 // Coordinates only organize this teaching section; no engineering thickness
 // or construction joint is inferred from the scanned image or GLB.
 const leftFlare={innerTop:[235,365],innerKnee:[280,399],outerKnee:[272,403],bottom:493};
 leftFlare.outerTop=[leftFlare.innerTop[0],leftFlare.outerKnee[1]-(leftFlare.outerKnee[0]-leftFlare.innerTop[0])*(leftFlare.innerKnee[1]-leftFlare.innerTop[1])/(leftFlare.innerKnee[0]-leftFlare.innerTop[0])];
 const leftGutterEnd={x:leftFlare.innerTop[0],bottom:390};
 let s=`<defs><pattern id="${prefix}-wall" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M-2 2L2-2M-2 27L27-2M23 27L27 23" fill="none" stroke="#838b94" stroke-width=".65"/></pattern><pattern id="${prefix}-unidentified-stipple" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="4" cy="5" r=".65" fill="#838b94"/><circle cx="12" cy="13" r=".55" fill="#838b94"/></pattern><clipPath id="${prefix}-slab-crop"><path d="M558 365H934V443H558Z"/></clipPath></defs>`;
 // No transverse top/bottom closures or sawtooth breaks are visible in source.
 s+=role('bearing-wall-upper-source-section',`<path d="M407 38H542V365H407Z" fill="url(#${prefix}-wall)" stroke="none"/>`+p('M407 38V365M542 38V365'));
 const bearing=`M403 365H542V505H407V392H${rightConcreteCorner[0]}Z`;
 s+=role('bearing-base-source-concrete',p(bearing,'url(#concrete)'));
 s+=role('bearing-wall-lower-source-section',`<path d="M407 505H542V560H407Z" fill="url(#${prefix}-wall)" stroke="none"/>`+p('M407 505V560M542 505V560'));
 // Preserve the source's step, sloping top/bottom edge and separate dark seat.
 // The source stipple is retained as a graphic pattern, not a mortar grade.
 s+=role('flashing-upper-return',p('M542 38H552V63L590 68V130L565 120H542Z',`url(#${prefix}-unidentified-stipple)`,'medium'));
 s+=role('flashing-upper-seal',p('M542 99H554Q566 99 566 119H542Z','#35404a','medium'));
 // Unlabelled thin bands stay separate and neutral; no inferred mortar hatch.
 s+=role('roof-inner-unidentified-band',p('M542 119H550V326Q550 349 575 349H934V365H542Z','white','medium'));
 s+=role('roof-waterproof',p('M550 119H555V326Q555 343 577 343H934V349H575Q550 349 550 326Z','#404952','medium'));
 s+=role('roof-protection',p('M555 120H564V302L604 327H934V343H577Q555 343 555 326Z','white','medium'));
 // Keep the four visible short source marks without calling them reinforcement
 // or fasteners. Their material and physical function are not identified.
 s+=role('source-roof-small-marks',p('M646 343L650 338L654 343M734 343L738 338L742 343M822 343L826 338L830 343M909 343V337','none','medium'));
 s+=role('source-vertical-small-marks',p('M550 141V129Q550 124 553 124Q557 124 558 130L559 135L555 141Z','#35404a','fine')+p('M552 204Q560 205 560 210Q560 215 552 216Z','#35404a','fine')+p('M554 269Q561 270 561 274Q561 279 554 280Z','#35404a','fine'));
 let slab='M558 365H965V443H558Z';
 for(const x of [606,681,762,836,914])slab+=`M${x-29} 404a29 29 0 1 0 58 0a29 29 0 1 0-58 0Z`;
 s+=role('hollow-roof-slab',`<g clip-path="url(#${prefix}-slab-crop)">${p(slab,'url(#concrete)','outline','fill-rule="evenodd"')}</g>`);
 s+=role('slab-end-joint',p('M542 365H558V443H542Z','#35404a','medium'));
 const leftConcrete=`M84 255H101V365H${leftGutterEnd.x}V${leftGutterEnd.bottom}H84Z`;
 const leftCoat=`M68 241H116V328Q116 350 132 354L${leftFlare.innerTop.join(' ')}V${leftGutterEnd.bottom}H116V409L68 414Z`;
 s+=role('eaves-gutter-structure-left',p(leftConcrete,'url(#concrete)'));
 // The compound path removes the concrete footprint rather than hiding it
 // under a second material. The two material regions share the same boundary.
 s+=role('eaves-gutter-lining-left',p(leftCoat+leftConcrete,'white','medium','fill-rule="evenodd"'));
 s+=role('eaves-outlet-pipe-left',p(`M${leftFlare.innerTop.join(' ')}L${leftFlare.innerKnee.join(' ')}V${leftFlare.bottom}H${leftFlare.outerKnee[0]}V${leftFlare.outerKnee[1]}L${leftFlare.outerTop.join(' ')}Z`,'white','medium'));
 s+=role('eaves-gutter-lining-right',p('M389 365L340 400V493H350V403L403 365Z','white','medium'));
 s+=role('source-gutter-horizontal-projection',line([116,332],[407,332],'medium'));
 // Source shows a horizontal lower outline, not two indefinitely open tails.
 // Preserve that line without asserting a physical cap or a blocked drain.
 s+=role('source-outlet-lower-projection',line([272,493],[350,493],'medium'));
 s+=role('eaves-hidden-upper-passage',line([407,233],[542,233],'fine',hidden)+line([407,249],[542,249],'fine',hidden));
 s+=role('eaves-hidden-lower-passage',line([407,314],[542,314],'fine',hidden)+line([407,330],[542,330],'fine',hidden));
 s+=role('eaves-upper-outlet-projection',p('M407 233H372V249H407','none','medium'));
 s+=role('eaves-lower-outlet-projection',p('M407 314H373V330H407','none','medium'));
 s+=role('eaves-upper-inlet-projection',p('M564 233H590V249H564','none','medium'));
 s+=role('eaves-lower-inlet-projection',p('M564 314H586V327H604','none','medium'));
 s+=role('eaves-water-surface',line([590,249],[934,249],'fine')+p('M734 253H811M741 259H804M750 265H795M759 271H786M768 277H777','none','medium'));
 const anchors={wall,roof,leftFlare,leftGutterEnd,rightFlare,rightConcreteCorner,waterSurface:[895,249],upperFlashingProjection:[835,113],flashingSealLevel:[555,119],left50UpperProjection:[407,162],left50VisibleVerticalEnd:[367,214],left50LowerMeasuringFace:'not-visible-in-source',overflowTop:[407,233],overflowBottom:[407,249],drainTop:[407,314],drainBottom:[407,330],slabTop:[558,365],slabBottom:[558,443],jointFace:[551,417],gutterUpperLip:[68,241,48,14],gutterHorizontalProjection:[[116,332],[407,332]],outletLowerProjection:[[272,493],[350,493]],hollowCenters:[606,681,762,836].map(x=>[x,404]),partialHollowCenter:[914,404],unidentifiedVerticalMarks:[[550,135],[552,210],[554,274]]};
 return{parts:[{id:'water-storage-eaves-section',body:`<g data-geometry-id="water-storage-eaves-section">${s}</g>`,box:[61,30,880,536]}],view:'檐沟式蓄水排水 · 原图局部剖面',anchors,
  marks:[{name:'溢水孔每开间一个',target:[377,233],side:'left',row:180},{name:'泄水孔',target:[588,317],side:'right',row:286},{name:'沥青麻丝嵌缝',target:[551,417],side:'right',row:490}],
  dimensions:[dim('source-water-surface-to-flashing-top',[895,249],[835,113],895,'≥100',['原图水面水平投影','原图上部短水平投影，材料面未定']),{...dim('source-left-local-50',[367,214],[367,162],367,'50',['原图短水平投影','原图竖线可见止点，不认作下测界']),status:'partial-source-dimension-fragment',sourceFragment:{lines:[[[350,162],[407,162]],[[367,146],[367,214]]],textAt:[367,135]},scope:'只保留原图可见横竖线片段及横排50；不补下端界线、起止斜划或确定下测界。'}],
  interfaces:[
   {id:'eaves-gutter-source-projection',objects:['eaves-gutter-structure-left','eaves-gutter-lining-left','source-gutter-horizontal-projection','source-outlet-lower-projection'],scope:'原图多带L形沟沿、内侧独立水平线、漏斗斜边及下端横线均保留；不由下端横线断言实际管道封闭，也不为解释排水删线。'},
   {id:'eaves-gutter-no-hidden-material-overlap',objects:['eaves-gutter-structure-left','eaves-gutter-lining-left'],scope:'衬带使用复合路径扣除同一混凝土轮廓；不存在靠白填充遮住混凝土的同域占面。'},
   {id:'eaves-left-pipe-wall-continuity',objects:['eaves-gutter-structure-left','eaves-gutter-lining-left','eaves-outlet-pipe-left'],scope:'依据用户构件身份纠正及GLB可见内外双面，将混凝土沟底止于起口图示接口；管壁单独绘制，内外斜边平行并连续接入竖段，不共用同一上点、不填混凝土三角楔。接口位置及壁厚为图形整理，未指认原图施工缝或工程厚度。'},
   {id:'eaves-right-flare-bearing',objects:['eaves-gutter-lining-right','bearing-base-source-concrete'],scope:'斜衬带外边403,365至350,403与承托段左斜面共界；y392交点由同一直线求得。'},
   {id:'eaves-source-roof-bands',objects:['roof-inner-unidentified-band','roof-waterproof','roof-protection','source-roof-small-marks','source-vertical-small-marks'],scope:'相邻转角复用界面；白色细带、水平四记号及竖向三记号身份未定，不补砂浆配比、配筋或固定件。'},
  ],orthogonalChecks:[{id:'eaves-wall-left-vertical',points:[[407,38],[407,560]],relation:'vertical'},{id:'eaves-wall-right-vertical',points:[[542,38],[542,560]],relation:'vertical'},{id:'eaves-water-horizontal',points:[[590,249],[934,249]],relation:'horizontal'},{id:'eaves-slab-bottom-horizontal',points:[[558,443],[934,443]],relation:'horizontal'}]};
}
