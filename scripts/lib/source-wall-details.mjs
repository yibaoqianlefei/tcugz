// Source-based technical redraws. Authored paths, material fills, new text and leaders.
// Original drawings define the local contours; no raster image is embedded.
export const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const C={ink:'#202831',blue:'#465b96',thin:'#66717f',red:'#bf4939'};
export const t=(x,y,s,size=23,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" ${extra}>${xml(s)}</text>`;
const path=(d,fill='none',cls='cut',extra='')=>`<path d="${d}" fill="${fill}" class="${cls}" ${extra}/>`;
const line=(x,y,X,Y,cls='fine',extra='')=>path(`M${x} ${y}L${X} ${Y}`,'none',cls,extra);
const rect=(x,y,w,h,fill='none',cls='cut',extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" class="${cls}" ${extra}/>`;
const dot=(x,y,r=3)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${C.ink}"/>`;
const leader=(x,y,_guideX,rowY,name,note,markPoint=true)=>{
 const dy=Math.abs(rowY-y),room=755-x;
 // GB/T 50001—2017 7.3.1: use 45°, then 60°, or a vertical leg.
 const dx=dy<=room?dy:dy/Math.sqrt(3)<=room?dy/Math.sqrt(3):0;
 return (markPoint?dot(x,y):'')+path(`M${x} ${y}L${x+dx} ${rowY}H765`,'none','fine')+t(785,rowY+7,name,24)+(note?t(785,rowY+38,note,19,'fill="#66717f"'):'');
};
const dim=(x,y,X,Y,s)=>line(x,y,X,Y)+line(x-6,y+6,x+6,y-6,'medium')+line(X-6,Y+6,X+6,Y-6,'medium')+t((x+X)/2,(y+Y)/2-10,s,23,'text-anchor="middle"');
const vdim=(x,y,Y,s)=>line(x,y,x,Y)+line(x-6,y+6,x+6,y-6,'medium')+line(x-6,Y+6,x+6,Y-6,'medium')+t(x-12,(y+Y)/2,s,21,`text-anchor="middle" transform="rotate(-90 ${x-12} ${(y+Y)/2})"`);
const breakLine=(x,y,w)=>path(`M${x} ${y}h${w/2-18}l12 -12 12 24 12 -12h${w/2-18}`,'none','medium');
// Coordinates are drawing units, not reinforcement dimensions or cover design.
export const constructionColumnSection={
 cutLevel:380,
 concrete:{x:335,y:850,width:70,height:70},
 stirrup:{x:342,y:857,width:56,height:56},
 longitudinal:[{x:348,y:863},{x:392,y:863},{x:348,y:907},{x:392,y:907}],
 horizontalTieLevels:[873,897],
 verticalTies:[{x:353,returnX:365,anchorX:382},{x:389,returnX:377,anchorX:360}],
 hook:{crownY:704,tangentY:710,returnEndY:718},
 anchor:{bendY:875,endY:904},
};
function columnSectionReinforcement(){
 const section=constructionColumnSection,{concrete,stirrup,hook,anchor}=section;
 let s=`<g data-role="column-section">${rect(concrete.x,concrete.y,concrete.width,concrete.height,'#fff','medium')}`;
 s+=rect(stirrup.x,stirrup.y,stirrup.width,stirrup.height,'none','medium','rx="2" data-role="column-stirrup"');
 s+=path('M184 879H174Q171 879 171 876Q171 873 174 873H569Q572 873 572 876Q572 879 569 879H559','none','rebar','data-role="tie-x" style="stroke-width:3.2"');
 s+=path('M184 891H174Q171 891 171 894Q171 897 174 897H569Q572 897 572 894Q572 891 569 891H559','none','rebar','data-role="tie-x" style="stroke-width:3.2"');
 for(const tie of section.verticalTies){
  const mid=(tie.x+tie.returnX)/2;
  s+=path(`M${tie.returnX} ${hook.returnEndY}V${hook.tangentY}Q${tie.returnX} ${hook.crownY} ${mid} ${hook.crownY}Q${tie.x} ${hook.crownY} ${tie.x} ${hook.tangentY}V${anchor.bendY}L${tie.anchorX} ${anchor.endY}`,'none','rebar','data-role="tie-y" style="stroke-width:3.2"');
 }
 // Only the four vertical column bars are cut by this horizontal section.
 for(const point of section.longitudinal)s+=`<circle data-role="column-longitudinal-section" cx="${point.x}" cy="${point.y}" r="5" fill="#202831"/>`;
 return s+'</g>';
}
const sources={
 foam:{nodeId:'foam-insulation-01',original:'/images/wall/foam-insulation-diagram.png',title:'粘贴泡沫塑料保温板外保温',figure:'用户原图：图13-5',scope:'沿用原图层次与一处机械锚固示意；材料名称不确定具体产品体系。',parameters:[],review:['增强网置于抹面层内，不额外画成独立空气层。','锚栓进入基层；数量、长度与性能不由本图推定。','内外方向、各层标注及锚固位置均与原图核对。'],body:()=>{
 const y=175,h=500; let s=rect(215,y,230,h,'url(#concrete)')+rect(445,y,15,h,'url(#mortar)')+rect(460,y,98,h,'url(#foam)')+rect(558,y,24,h,'url(#mortar)')+rect(582,y,9,h,'#f0f0ed');
 s+=line(571,y,571,y+h,'mesh');
 s+=path('M385 415H569V429H385L375 422Z','#e9e9e7','medium')+rect(567,397,9,50,'#fff','medium');
 s+=breakLine(215,y,376)+breakLine(215,y+h,376);
 s+=t(145,590,'内',28)+t(635,590,'外',28);
 s+=leader(330,250,690,215,'01 基层墙体','承接外保温系统的粘结与锚固。');
 s+=leader(452,320,690,300,'02 胶粘剂','连接保温板与基层。');
 s+=leader(510,355,690,385,'03 保温板','形成墙身保温层。');
 s+=leader(573,418,645,470,'07 机械锚固件','穿过保温层，连接至基层。');
 s+=leader(571,495,690,555,'04 增强网（嵌于抹面层）','与抹面层共同构成增强保护层。');
 s+=leader(563,555,690,640,'05 抹面层','包覆增强网，保护保温板。');
 s+=leader(587,610,690,725,'06 饰面层','位于系统外侧，形成外观表面。');
 s+=t(220,760,'局部剖面 · 不按比例',25,'fill="#465b96"');return s;
 }},
 rockwool:{nodeId:'rockwool-insulation-01',original:'/images/wall/rockwool-insulation-diagram.png',title:'粘贴岩棉保温板外保温',figure:'用户原图：图13-6',scope:'保留原图基层、找平、防水、岩棉、抹面及饰面的先后关系；原图数值均作为实例记录。',parameters:['20厚1∶3水泥砂浆找平层','2厚聚合物水泥防水涂料','43厚岩棉保温板','5厚抹面胶浆，原图标内置160级耐碱玻纤网格布'],review:['防水涂料位于找平层外、岩棉内，不移至岩棉外侧。','增强网位于抹面层内。','涂料层绘图厚度夸大；原图实例数值与规范要求分开。'],body:()=>{
 const y=170,h=505;let s=rect(205,y,230,h,'url(#concrete)')+rect(435,y,24,h,'url(#mortar)')+rect(459,y,7,h,'#b9cbd9')+rect(466,y,82,h,'url(#wool)')+rect(548,y,24,h,'url(#mortar)')+rect(572,y,8,h,'#ededeb');
 s+=line(560,y,560,y+h,'mesh')+path('M385 305H559V317H385L375 311Z','#eee','medium')+rect(557,288,8,45,'#fff','medium');
 s+=breakLine(205,y,375)+breakLine(205,y+h,375)+t(145,590,'内',28)+t(625,590,'外',28);
 s+=leader(562,310,680,205,'01 锚栓','穿过保温层，连接至基层。');
 s+=leader(325,350,680,290,'02 基层墙体','承接外保温系统的连接。');
 s+=leader(446,390,680,375,'03 找平层：20厚，1∶3水泥砂浆','为外侧各层提供平整基层。');
 s+=leader(462,452,680,460,'04 聚合物水泥防水涂料：2厚','位于找平层外侧、岩棉板内侧。');
 s+=leader(506,510,680,545,'05 岩棉保温板：43厚','通过粘结与锚固连接基层。');
 s+=leader(560,583,680,630,'06 抹面胶浆：5厚，内置增强网','形成保温板外侧的增强保护层。');
 s+=leader(576,640,680,715,'07 柔性耐水腻子及外墙涂料','形成系统外侧饰面。');
 s+=t(220,755,'局部剖面 · 图示实例单位：mm',24,'fill="#465b96"');return s;
 }},
 flush:{nodeId:'rc-lintel-flush-01',original:'/images/wall/rc-lintel-flush-diagram.png',title:'钢筋混凝土过梁 · 平墙过梁',figure:'用户原图：钢筋混凝土过梁—平墙过梁',scope:'按原图重绘洞口上方局部横向截面、外围包覆及窗框位置参照；不补虚构的跨洞剖面与支座。',parameters:[],review:['主体内外侧基本与上部墙身齐平。','外围包覆沿过梁底部连续转折。','窗框仅位置参照，原模型无独立窗框。'],body:()=>lintel('flush')},
 surround:{nodeId:'rc-lintel-window-surround-01',original:'/images/wall/rc-lintel-window-surround-diagram.png',title:'钢筋混凝土过梁 · 带窗套过梁',figure:'用户原图：钢筋混凝土过梁—带窗套过梁',scope:'沿用原图短外挑与窗套交接截面，保留包覆转折；不将窗套外形当作跨洞支承证明。',parameters:[],review:['原图短突出位于外侧，不变成独立悬挑雨篷。','外围包覆跟随主体转折。','截面未提供两端支承长度，不标推定数值。'],body:()=>lintel('surround')},
 hood:{nodeId:'rc-lintel-window-hood-01',original:'/images/wall/rc-lintel-window-hood-diagram.png',title:'钢筋混凝土过梁 · 带窗楣过梁',figure:'用户原图：钢筋混凝土过梁—带窗楣过梁',scope:'沿用原图长外挑窗楣、外围包覆及窗框参照；小下凸轮廓保留但不擅称具有已验证尺寸的滴水槽。',parameters:[],review:['长外挑位于外侧，板根与过梁主体连成截面。','保留包覆外缘及端部小转折，不猜测尺寸和材料。','区分可见截面与未表示的支座、配筋及窗周完整排水。'],body:()=>lintel('hood')},
 windowGap:{nodeId:'window-wall-gap-sealing-01',original:'/images/wall/window-wall-gap-sealing-diagram.png',title:'窗框与墙间缝隙 · 原图做法识读',figure:'用户原图：图2-12，封堵窗墙间缝隙做法',scope:'按原图横剖面重绘墙、窗框、木条、袋装矿棉及弹性密封胶；保留约7mm为原图实例，不升级为现代通用安装详图。',parameters:['原图标δ≈7 mm：仅该实例的图示缝宽'],review:['袋装矿棉位于墙与窗框之间；密封胶按原图连续薄层绘制，不改画为两端三角填角。','木条保留原图交叉表示，不误称机械锚固件。','图中未给固定件及排水出口，正文明确它们仍需补查。'],body:()=>{
 let s=rect(150,205,525,155,'url(#masonry)')+path('M215 402H608V550L360 570V530H305V575H215Z','white','cut');
 s+=rect(215,366,393,36,'url(#mineral)','medium');
 s+=rect(170,360,45,100,'#fff')+line(170,360,215,460,'fine')+line(215,360,170,460,'fine');
 s+=rect(608,360,35,86,'#fff')+line(608,360,643,446,'fine')+line(643,360,608,446,'fine');
 s+=rect(215,360,393,6,'#202831','medium');
 s+=leader(380,270,695,215,'04 外墙','窗框周边的围护构件。');
 s+=leader(390,382,695,320,'02 袋装矿棉','填充窗框与墙体之间的缝隙。');
 s+=leader(590,363,695,425,'03 弹性密封胶','与缝内填充材料分层设置。');
 s+=leader(192,415,695,530,'01 木条','位于图示窗框两侧。');
 s+=leader(455,500,695,635,'05 窗框','与墙体之间留设安装缝。');
 s+=line(643,360,720,360)+line(608,402,720,402)+dim(705,360,705,402,'δ')+t(185,665,'图示缝宽 δ≈7 mm',25,'fill="#465b96"');
 s+=t(185,715,'横剖面 · 不按比例',25)+t(185,755,'填充、密封与固定承担不同的接口任务。',21);return s;
 }},
 column:{nodeId:'construction-column-01',original:'/images/wall/construction-column-diagram.png',title:'砌体构造柱 · 马牙槎与拉结关系',figure:'用户原图：构造柱立面与1—1剖面',scope:'沿用用户原图马牙槎及拉结钢筋的位置关系，原配筋与尺寸列为实例记录；非现行通用配筋详图。',parameters:['原图墙厚240','原图马牙槎示意≥60、每步≤300','原图拉结2Φ6@500、两侧延伸≥1000','原图纵筋4Φ12及底部构造为示例记录'],review:['马牙槎左右与中部柱核保持原图对应，不把凸齿反画成空洞。','立面与1—1横剖使用同一中部柱位；横剖保持原图T形墙肢，不增加下侧墙体，保留拉结钢筋端部弯折。','原配筋参数只在实例资料栏列示，不作为统一要求。'],body:()=>{
 const left='M160 180H335V245H315V310H335V375H315V440H335V505H315V570H335V615H160Z';
 const right='M405 180H585V615H405V570H425V505H405V440H425V375H405V310H425V245H405Z';
 let s=path(left,'url(#masonry)')+path(right,'url(#masonry)')+line(353,165,353,635,'medium')+line(389,165,389,635,'medium');
 for(const y of [220,380,540])s+=line(170,y,575,y,'rebar','data-role="elevation-tie"');
 s+=[160,335,405,585].map(x=>line(x,150,x,174)).join('');
 s+=dim(160,160,335,160,'≥1000')+dim(335,160,405,160,'240')+dim(405,160,585,160,'≥1000');
 s+=vdim(125,220,380,'500')+vdim(125,380,540,'500');
 s+=line(115,220,150,220)+line(115,380,150,380)+line(115,540,150,540);
 const cut=constructionColumnSection.cutLevel;
 s+=path(`M75 ${cut}H105V${cut+20}`,'none','cut','data-role="section-cut"')+path(`M670 ${cut}H640V${cut+20}`,'none','cut','data-role="section-cut"')+t(85,cut+45,'1',22)+t(640,cut+45,'1',22)+t(140,674,'立面（局部）',23);
 s+=path('M160 850H335V690H405V850H585V920H160Z','url(#masonry)');
 s+=columnSectionReinforcement()+t(260,937,'1—1 横剖面 · T形墙交接',21);
 s+=leader(315,405,680,205,'马牙槎','墙体与构造柱交错咬合。');
 s+=leader(355,475,680,335,'柱纵向钢筋','纵向钢筋位于柱核内。');
 s+=leader(510,380,680,465,'墙柱拉结','拉结钢筋连接墙体与构造柱。');
 s+=t(785,595,'1—1 横剖面：T形墙交接',24)+t(785,633,'沿纵横墙交接布置拉结钢筋。',19);
 s+=t(785,674,'图示实例参数（mm）',19,'fill="#465b96"');
 s+=leader(389,810,680,720,'2Φ6@500 墙体拉结筋','沿纵横墙布置，按图示弯折进入柱内。',false);
 s+=leader(392,863,680,800,'4Φ12 柱纵筋（剖切）','横剖面以4个实心圆点表示。',false);
 s+=leader(398,889,680,890,'箍筋','以闭合环线表示，围住柱纵筋。',false);return s;
 }},
};

function lintel(kind){
 const data={
 flush:{scale:.8,dx:205,dy:145,wall:[75,44,301,229],concrete:'M75 273H376V434H75Z',coat:'M47 44H75V434H376V44H400V457H112L96 478H47Z',frame:'M188 457H305V800H246V515H188Z',anchors:[[230,160],[210,350],[58,445],[270,625]],top:[47,44,353],bottom:[188,800,212]},
 surround:{scale:.75,dx:150,dy:145,wall:[137,34,372,209],concrete:'M137 243H509V456H57V402H137Z',coat:'M106 34H137V402H57V456H509V34H535V480H112L98 494H38V384L106 365Z',frame:'M260 480H377V795H318V535H260Z',anchors:[[310,150],[310,350],[48,445],[345,650]],top:[106,34,429],bottom:[260,795,275]},
 hood:{scale:.65,dx:105,dy:145,wall:[557,48,260,210],concrete:'M557 258H817V493H90V447H557Z',coat:'M537 48H557V447H90V493H817V48H840V516H145L136 530H65V417H537Z',frame:'M575 516H688V815H631V577H575Z',anchors:[[680,155],[680,380],[78,490],[655,680]],top:[537,48,303],bottom:[575,815,265]},
 }[kind];
 const [wx,wy,ww,wh]=data.wall;
 let detail=rect(wx,wy,ww,wh,'url(#block)')+path(data.concrete,'url(#concrete)')+path(data.coat,'url(#mortar)')+path(data.frame,'#fff','medium');
 detail+=line(data.bottom[0],kind==='flush'?457:kind==='surround'?480:516,data.bottom[0],data.bottom[1],'medium');
 detail+=breakLine(...data.top)+breakLine(...data.bottom);
 let s=`<g transform="translate(${data.dx} ${data.dy}) scale(${data.scale})">${detail}</g>`+t(135,730,'外侧',27)+t(675,730,'内侧',27);
 const names=[['01 上部墙体','位于洞口上方。'],['02 钢筋混凝土过梁主体','承托洞口上方墙体。'],['03 外围包覆','沿墙面与过梁底部转折。'],['04 窗框','图示窗框相对过梁的安装位置。']];
 data.anchors.forEach(([x,y],i)=>{s+=leader(data.dx+x*data.scale,data.dy+y*data.scale,705,[210,345,480,615][i],...names[i]);});
 s+=t(200,865,'横向局部剖面 · 不按比例',22,'fill="#465b96"');return s;
}

const teachingContent={
 'foam-insulation-01':{summary:'从内向外依次识别基层、粘结、保温、增强保护及饰面，沿锚固件追踪与基层的连接。',points:['基层承接粘结和锚固，保温板形成墙身保温层。','增强网嵌于抹面层，外侧为饰面层。','锚固件穿过保温层，与基层连接。']},
 'rockwool-insulation-01':{summary:'沿墙厚方向识别找平、防水、岩棉、抹面增强及饰面，区分保温、保护与固定的作用。',points:['防水涂料位于找平层外侧、岩棉板内侧。','岩棉板通过粘结与锚固连接基层。','抹面胶浆内置增强网，外侧设置腻子和涂料。']},
 'rc-lintel-flush-01':{summary:'平墙过梁的局部截面与墙身基本齐平；结合窗框位置，识别过梁主体和外围包覆。',points:['上部墙体位于过梁上方。','过梁主体沿墙厚方向基本齐平。','包覆层沿过梁底部转折，窗框位于其下方。']},
 'rc-lintel-window-surround-01':{summary:'带窗套过梁在外侧形成短突出，比较主体、包覆与窗框之间的截面关系。',points:['过梁截面外侧形成短突出。','包覆层沿主体外缘连续转折。','结合窗框安装位置识别洞口周边构造。']},
 'rc-lintel-window-hood-01':{summary:'带窗楣过梁在外侧形成较长突出，观察突出部分与过梁主体的连接及包覆转折。',points:['外侧长突出与过梁主体连成截面。','包覆层沿外缘与底面转折。','比较窗楣突出和窗框所在的位置。']},
 'window-wall-gap-sealing-01':{summary:'窗墙安装缝由填充、密封与固定等任务共同组成；图中分别识别矿棉、密封胶、木条和窗框。',points:['袋装矿棉填充窗框与墙体间的缝隙。','弹性密封胶与缝内填充材料分层设置。','图示缝宽约7mm，为该构造实例的参数。']},
 'construction-column-01':{summary:'通过马牙槎、柱纵筋与拉结钢筋，认识构造柱与砌体交接的整体联系，并对应立面与横剖面。',points:['马牙槎使墙体与构造柱交错咬合。','横剖面中4个实心圆点表示柱纵筋，闭合环线表示箍筋。','沿纵横墙分别识别2根拉结筋、端部短弯钩和柱内弯折。','1—1对准立面中的拉结筋层，尺寸与配筋为图示实例参数。']},
};
export const wallSourceDetails=Object.values(sources).map(def=>({...def,teaching:teachingContent[def.nodeId],title:def.nodeId==='window-wall-gap-sealing-01'?'窗框与墙间缝隙构造':def.title}));
export {rect,path,line,dot,leader,dim,breakLine};
export function technicalSvg(def,evidence){
 const height=1120;
 const notesY=height-155;
 const constructionBasis=evidence.references.slice(3).map(ref=>ref.standard.match(/^(?:GB(?:\/T)?|JGJ(?:\/T)?)\s*[\d—-]+/)?.[0]+' '+ref.clause.split('：')[0]).join('；');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="${height}" viewBox="0 0 1400 ${height}" role="img" aria-labelledby="title desc"><title id="title">${xml(def.title)}</title><desc id="desc">${xml(def.teaching.summary)}</desc><metadata>${xml(JSON.stringify(evidence))}</metadata><defs>
 <pattern id="concrete" width="56" height="56" patternUnits="userSpaceOnUse"><rect width="56" height="56" fill="#f9f9f7"/><path d="M-10 10L10 -10M0 56L56 0M46 66L66 46" stroke="#8d939a" stroke-width="1"/><path d="M18 15L26 19L20 25Z M40 40L48 44L42 50Z" stroke="#5e666e" stroke-width="1" fill="none"/><circle cx="8" cy="35" r="1.3" fill="#777"/></pattern>
 <pattern id="mortar" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#fcfbf8"/><circle cx="3" cy="3" r="1" fill="#747d87"/><circle cx="9" cy="9" r="1" fill="#747d87"/></pattern>
 <pattern id="foam" width="26" height="30" patternUnits="userSpaceOnUse"><rect width="26" height="30" fill="#f5f8fb"/><path d="M0 7.5L13 0L26 7.5V22.5L13 30L0 22.5ZM0 7.5L-13 0M26 22.5L39 30" stroke="#8d9aaa" stroke-width=".8" fill="none"/></pattern>
 <pattern id="wool" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#f4f6f8"/><path d="M0 0L24 24M24 0L0 24" stroke="#8c99a9" stroke-width=".8"/></pattern>
 <pattern id="masonry" width="15" height="15" patternUnits="userSpaceOnUse"><rect width="15" height="15" fill="#fcfcfa"/><path d="M-5 5L5 -5M0 15L15 0M10 20L20 10" stroke="#8a9098" stroke-width="1"/></pattern>
 <pattern id="mineral" width="13" height="35" patternUnits="userSpaceOnUse"><path d="M0 0C0 33 7 33 7 0S13 -12 13 15" stroke="#737e8b" stroke-width="1" fill="none"/></pattern>
 <pattern id="block" width="95" height="90" patternUnits="userSpaceOnUse"><rect width="95" height="90" fill="#fafaf8"/><path d="M15 20L25 15L33 25L25 35L14 30ZM65 60L72 54L80 62L78 72L68 74Z" stroke="#777f88" stroke-width="1.2" fill="none"/><circle cx="55" cy="20" r="1.2" fill="#777"/><circle cx="12" cy="70" r="1" fill="#777"/></pattern>
 </defs><style>.cut,.medium,.fine,.rebar,.mesh{vector-effect:non-scaling-stroke}.cut{stroke:#202831;stroke-width:3.2;stroke-linejoin:miter}.medium{stroke:#202831;stroke-width:1.6;stroke-linejoin:miter}.fine{stroke:#66717f;stroke-width:.8;stroke-linejoin:miter}.rebar{stroke:#202831;stroke-width:4;stroke-linecap:round}.mesh{stroke:#465b96;stroke-width:1.3;stroke-dasharray:8 3 1 3}text{fill:#202831;font-family:'Times New Roman','SimSun','Noto Serif CJK SC',serif}</style><rect width="1400" height="${height}" fill="#fff"/><g>${rect(30,25,1340,height-50,'white','fine')}${t(65,73,def.title,32,'font-weight="700"')}${t(65,112,def.nodeId==='construction-column-01'?'立面与横剖面 · 不按比例':'剖面构造 · 不按比例',20,'fill="#66717f"')}${line(65,135,1335,135)}${def.body()}${line(65,notesY-20,1335,notesY-20)}${t(65,notesY+10,'构造要点',21,'font-weight="700"')}${t(65,notesY+43,def.teaching.summary,19)}${t(65,height-78,'制图依据：GB/T 50001—2017（图线、字体、引出线及材料图例）',17,'fill="#66717f"')}${t(65,height-49,constructionBasis?'构造依据：'+constructionBasis:'观察重点：上部墙体、过梁主体、包覆层与窗框的位置关系。',17,'fill="#66717f"')}</g></svg>`;
}
