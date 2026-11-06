// Figure 6-47(a), source-led correction. All distances below are graphic units.
// The scan's unhatched intervals are deliberately NOT named as air cavities.
// Likewise, its short returns are preserved as contours, not invented battens.
const A=25*Math.PI/180,C=Math.cos(A),S=Math.sin(A);
const round=n=>+n.toFixed(3);
const xy=(u,v)=>[round(50+C*u+S*v),round(480-S*u+C*v)];
const path=(d,fill='none',cls='outline',attrs='')=>`<path d="${d}" fill="${fill}" class="${cls}" ${attrs}/>`;
const role=(id,s)=>`<g data-role="${id}">${s}</g>`;
const rect=(x,y,w,h,fill,cls='medium')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" class="${cls}"/>`;

// These reproduce the drawing's repeated visible profile, not product sizes.
// A partial downhill tile is retained: clipping must not manufacture a free nose.
const starts=[-110,50,210,370],advance=160,length=220;
const top=-54,thickness=7,noseDepth=9,noseWidth=6;
const gradient=noseDepth/advance;
const tileTop=(start,u)=>round(top+gradient*(u-start));
const tileBottom=(start,u)=>round(tileTop(start,u)+thickness);
const layer={slabTop:0,slabBottom:44,levelingTop:-10,waterproofTop:-14,bedTop:-27};

function build(){
 let s=`<defs>
  <pattern id="tile-mortar-r2-concrete" patternUnits="userSpaceOnUse" width="58" height="30"><path d="M7 5l7 5-6 6ZM39 20l6-5 5 7Z" fill="none" stroke="#929ba6" stroke-width=".7"/><path d="M25 6h1M15 25h1M54 13h1" stroke="#929ba6" stroke-width="1.4"/></pattern>
  <pattern id="tile-mortar-r2-mortar" patternUnits="userSpaceOnUse" width="15" height="15"><path d="M0 15L15 0" fill="none" stroke="#929ba6" stroke-width=".55"/></pattern>
  <clipPath id="tile-mortar-r2-source-crop"><rect x="0" y="-80" width="610" height="140"/></clipPath>
 </defs><g clip-path="url(#tile-mortar-r2-source-crop)">`;
 // Shared faces are reused. The continuous bedding band stays below the
 // unhatched intervals; it does not grow into a tile-following sawtooth wedge.
 s+=role('reinforced-concrete-roof-slab',rect(0,layer.slabTop,610,layer.slabBottom,'url(#tile-mortar-r2-concrete)','outline'));
 s+=role('cement-mortar-leveling',rect(0,layer.levelingTop,610,-layer.levelingTop,'url(#tile-mortar-r2-mortar)'));
 s+=role('waterproof-one-selected-alternative',rect(0,layer.waterproofTop,610,layer.levelingTop-layer.waterproofTop,'#d6dde5'));
 s+=role('source-continuous-mortar-band',rect(0,layer.bedTop,610,layer.waterproofTop-layer.bedTop,'url(#tile-mortar-r2-mortar)'));

 // Source-local returns lie at the upper ends of the lower tile profiles.
 // Their exact material/fixing identity is unresolved. Keep just their visible
 // outlines: no concrete/mortar hatch, nail symbols, or member specification.
 const returns=[];
 for(const [i,start] of starts.entries()){
  const end=start+length,left=end-6;
  const d=`M${left} ${tileBottom(start,left)}L${end} ${tileBottom(start,end)}V${layer.bedTop}H${left}Z`;
  s+=role('source-short-contour-unassigned',path(d,'white','medium',`data-source-contour="${i+1}" data-material-status="unresolved"`));
  returns.push({id:`short-return-${i+1}`,topLeft:xy(left,tileBottom(start,left)),topRight:xy(end,tileBottom(start,end)),bottomRight:xy(end,layer.bedTop),material:'unresolved-source-contour'});
 }

 // Draw the uphill tile after its downhill neighbour so visible/hidden lap
 // order survives; an upper tile's small lower return meets the preceding top.
 for(const [i,start] of starts.entries()){
  const end=start+length,inside=start+noseWidth;
  const d=`M${start} ${top}L${end} ${tileTop(start,end)}V${tileBottom(start,end)}L${inside} ${tileBottom(start,inside)}V${round(top+noseDepth+gradient*noseWidth)}L${start} ${top+noseDepth}Z`;
  s+=role('overlapping-block-tile',path(d,'#fff','outline',`data-source-tile="${i+1}" data-crop-status="${i===0?'partial-downhill':'visible-profile'}"`));
 }
 s+='</g>';
 const body=`<g data-geometry-id="tile-mortar-roof-section"><g transform="matrix(${C} ${-S} ${S} ${C} 50 480)">${s}</g></g>`;
 const marks=[
  {name:'块瓦（顺坡搭接）',target:xy(525,tileTop(starts[3],525)+3),side:'right',row:181},
  {name:'1∶3水泥砂浆挂瓦层；最薄处20；配φ6@500×500钢筋网',target:xy(454,(layer.bedTop+layer.waterproofTop)/2),side:'right',row:270},
  {name:'高聚物改性沥青防水卷材3（合成高分子防水涂膜≥2）',target:xy(315,(layer.waterproofTop+layer.levelingTop)/2),side:'right',row:340},
  {name:'1∶3水泥砂浆找平层15',target:xy(185,layer.levelingTop/2),side:'right',row:408},
  {name:'钢筋混凝土屋面板',target:xy(65,22),side:'right',row:484},
 ];
 return {
  parts:[{id:'tile-mortar-roof-section',body,box:[20,170,620,355]}],
  view:'沿屋面坡向的局部剖面',marks,dimensions:[],
  anchors:{slabTop:xy(0,layer.slabTop),slabBottom:xy(0,layer.slabBottom),levelingTop:xy(0,layer.levelingTop),waterproofTop:xy(0,layer.waterproofTop),continuousBedTop:[xy(0,layer.bedTop),xy(610,layer.bedTop)],tileStarts:starts.map(u=>xy(u,top)),sourceShortContours:returns,cropRangeGraphic:[0,610],meshGeometry:'not-drawn; source text retained without invented count'},
  interfaces:[
   {id:'tile-mortar-lower-layer-sequence',objects:['reinforced-concrete-roof-slab','cement-mortar-leveling','waterproof-one-selected-alternative','source-continuous-mortar-band'],scope:'按完整原图自下而上保留结构板、15厚找平层、防水薄层和上部连续挂瓦砂浆带；图形厚度不代表实厚。'},
   {id:'tile-mortar-source-unhatched-intervals',objects:['overlapping-block-tile','source-continuous-mortar-band','source-short-contour-unassigned'],scope:'瓦下无纹理长条区域与局部短轮廓分开保留，不将整片区域填成砂浆，不把留白命名为空气层或赋予固定件身份。'},
   {id:'tile-mortar-tile-overlap',objects:['overlapping-block-tile'],scope:'保留上坡瓦叠盖下坡瓦的可见次序、下端返回和左端被截取的瓦件；重复可见段不表示工程数量。'},
  ],
  orthogonalChecks:[],viewLabels:[],
 };
}

export const mortarTileCorrection={
 revision:'roof-batch2-mortar-r2-source-2026-11-02',build,
 checks:[
  '主原图与完整图6-47(a)分别核对，最薄处20由完整原图补核；下部15厚1∶3砂浆和单一防水薄层保留。',
  '瓦下长条留白和局部短竖轮廓分别绘制；连续砂浆带顶边保持连续，不再沿每片瓦底生成锯齿满填实体。',
  '局部短轮廓不填砂浆或混凝土纹理，不赋予钢木条、钉或固定件材料身份。',
  'φ6@500×500只保留原图文字，删除未经源图逐根确认的连续钢筋线及三个圆形截点。',
  '首片瓦保留局部截取身份；不在左截取端补造完整自由鼻端。',
  '坡向与各层共界统一变换，双版使用同一tile-mortar-roof-section几何组；图形坐标和角度不解释成工程尺寸或实坡度。',
 ],
 sourceFeatures:[
  {id:'source-unhatched-below-tiles',locator:'主原图下部瓦底与连续密黑薄带之间；完整图6-47(a)',observation:'可辨连续无纹理区与若干局部短竖轮廓；不由白色推断空气，不由卧瓦名称补为满铺接触。'},
  {id:'source-continuous-mortar-band',locator:'原图防水及15厚找平层上部的连续窄带',observation:'保留连续层界及1∶3挂瓦层最薄处20文字；不使其顶面逐片追随瓦底成为锯齿楔体。'},
  {id:'source-tile-laps',locator:'原图顶部叠接瓦件、局部端返及左端截取',observation:'瓦件分片、叠盖次序、末端小轮廓保留，瓦下短线身份单独未定。'},
  {id:'source-parameters-complete-a',locator:'完整图6-47(a)文字',observation:'1∶3挂瓦层最薄处20、φ6@500×500、卷材3（涂膜≥2）、1∶3找平层15均是原图实例；未画出未经确认根数的网筋。'},
 ],
 uncertainties:[
  '瓦下白色区域和短竖轮廓的具体实体、材料和固定作用，低清原图不能完整确认；本稿保留可见图面关系，未将留白定性为空气层。',
  '短轮廓厚度、鼻端产品断面、搭接长度、完整固定及抗风措施未给出；清线用图形坐标，不构成工程参数。',
  '原图配φ6@500×500为文字证据；扫描未清楚给出可逐根确认的剖切钢筋，故不补根数、锚固或保护层。',
  '最薄处20与找平层15不由像素测量。原图砂浆卧瓦保留历史实例身份，适用瓦材及现行干法、固定、防水设防条件须依已核标准与具体设计另行判断。',
  '卷材3和括注涂膜≥2仅保留原图替代标法，只绘一道薄层，不承诺当前任何防水等级均适用。',
 ],
};
