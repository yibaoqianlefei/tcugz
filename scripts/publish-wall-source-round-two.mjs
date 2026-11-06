import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {wallRoundTwo,esc} from './lib/wall-source-round-two.mjs';

const root='audit-output/wall-source-redraw-next-2026-10-29';
const drafts=JSON.parse(await readFile(root+'/evidence.json','utf8'));
const browser=JSON.parse(await readFile(root+'/browser-layout-checks.json','utf8'));
const clearance=JSON.parse(await readFile(root+'/clearance-checks.json','utf8')).results;
const vector=JSON.parse(await readFile(root+'/vector-checks.json','utf8')).flatMap(r=>r.checks);
const published=JSON.parse(await readFile('src/data/sourceDrawingEvidence.json','utf8'));
const layouts=JSON.parse(await readFile('src/data/nodeDiagramLayouts.json','utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
const teaching={
 'frame-structure-layout-01':'先辨认实心柱位与梁线，再在模型中追踪梁端到柱的连接。细辅助线不代表本模型已有楼板或填充墙。',
 'wall-bearing-semi-frame-01':'从内部柱列和梁读到外围墙，再与横墙方案比较板的支承路线；这不是完全由梁柱承重的框架。',
 'wall-bearing-transverse-01':'先找重复横墙，再观察右端板带与通道梁，在模型中核对板端支承。',
 'wall-bearing-two-way-01':'按房间分别读板带排列与支承，区分左下梁区和两向墙段，不能给整栋建筑套用同一传力箭头。',
 'wall-bearing-longitudinal-01':'比较内外纵墙及右端板带，与横墙方案保持同一问题：板端把作用交给谁。',
 'passive-solar-wall-01':'从玻璃、空气间层读到薄钢板、保温与墙体，再定位上下孔口；对象名称不代表所有工况下的实际流向。',
 'block-wall-core-column-01':'比较转角与T形交接：沿上下皮孔口追踪通长筋与灌孔位置，并回到模型确认孔道内的增强构件。2Φ12和C15为原图实例。',
 'hollow-block-forms-01':'按(a)至(d)比较孔洞与壁肋，再点选对应模型；孔型用于几何识读，不能单独判定块材性能或整墙用途。',
 'apron-flashing-01':'从墙边密封和填缝读到向外找坡、室外地坪与垫层端部，分别解释排水和允许变形的任务。图示数值属于本例。',
 'stone-apron-01':'与细石混凝土方案比较块石面层、粗砂垫层及外缘下折，继续核对墙边接缝与地坪高差。图示数值属于本例。',
 'faced-plinth-01':'从贴面及基层追到墙内水平防潮层，区别表面保护与阻断毛细水的任务；本图不是干挂体系。',
 'stone-plinth-01':'沿石砌层的错缝和上部墙体读承托关系；本图未单列防潮层，不能据此取消完整墙脚防潮。',
 'plaster-plinth-01':'将外侧抹灰收头与墙内水平防潮分开辨认，再检查室内外地面的高低关系。'
};
assert.equal(drafts.length,13);
// Validate every input before changing any published asset or index.
const prepared=[];
for(const draft of drafts){
 assert.equal(draft.revision,'wall-source-r3','Withdrawn r1/r2 drawings must not be published');
 assert.equal(sha(await readFile('public'+draft.source.path)),draft.source.sha256);
 const def=wallRoundTwo.find(d=>d.id===draft.id);assert(def);
 const data=def.build();
 assert.deepEqual(Object.fromEntries(data.parts.map(p=>[p.id,sha(p.body)])),draft.geometryDigests,'Rebuild and recheck changed geometry first');
 const assets={};
 for(const mode of ['textbook','node']){
  const svg=await readFile(root+'/'+draft.assets[mode],'utf8'),hash=sha(svg);
  assert(!/<image\b|<script\b|<foreignObject\b/i.test(svg));
  const b=browser.find(c=>c.title===mode+'-'+draft.id);
  assert(b&&!b.clipped.length&&!b.overlaps.length&&b.observedUrl.endsWith('?v='+hash.slice(0,12)),'Stale or failed browser layout check');
  const c=clearance.find(c=>c.id===draft.id&&c.mode===mode);
  assert(c?.sha256===hash&&!c.textLineIntersections.length&&!c.symbolOcclusions.length,'Stale or failed clearance check');
  const v=vector.find(c=>c.sha256===hash);
  assert(v&&!v.errors.length,'Stale or failed SVG structure check');
  assets[mode]={svg,hash};
 }
 prepared.push({draft,assets});
}
await mkdir('public/images/learning/node-panels',{recursive:true});
for(const {draft,assets} of prepared){
 const record={...draft,nodeId:draft.id,path:`/images/learning/${draft.id}.svg`,
  width:draft.textbookSize.width,height:draft.textbookSize.height,
  original:draft.source,status:'source-based',reviewStatus:'source-and-layout-checked',
  usage:'teaching-reference',replacesOriginal:true,publishedOn:'2026-10-30',
  teaching:{summary:teaching[draft.id],points:draft.geometryChecks},
  learningContexts:[{...draft.knowledgeContext,unitId:draft.knowledgeContext.knowledgeId,lesson:draft.knowledgeContext.lessonKey,primary:true}],
  checkedDrafts:{textbook:assets.textbook.hash,node:assets.node.hash},
  panel:{path:`/images/learning/node-panels/${draft.id}.svg`,width:draft.nodeSize.width,height:draft.nodeSize.height,sourceGeometryDigests:draft.geometryDigests},
  publication:{status:'published-teaching-reference',formalReplacement:true,publishedOn:'2026-10-30'}};
 for(const mode of ['textbook','node']){
  const content=assets[mode].svg.replace(/<metadata>[\s\S]*?<\/metadata>/,`<metadata>${esc(JSON.stringify(record))}</metadata>`);
  await writeFile('public'+(mode==='node'?record.panel.path:record.path),content);
 }
 published[record.id]=record;
 const index=layouts.findIndex(r=>r.path===record.path);
 const mapping={path:record.path,panel:record.panel.path};
 if(index>=0)layouts[index]=mapping;else layouts.push(mapping);
}
await writeFile('src/data/sourceDrawingEvidence.json',JSON.stringify(published,null,2)+'\n');
await writeFile('src/data/nodeDiagramLayouts.json',JSON.stringify(layouts,null,2)+'\n');
await writeFile(root+'/publication.json',JSON.stringify({publishedOn:'2026-10-30',batch:prepared.map(({draft})=>({id:draft.id,revision:draft.revision,path:published[draft.id].path,panel:published[draft.id].panel.path,knowledgeId:draft.knowledgeContext.knowledgeId,lesson:draft.knowledgeContext.lessonKey,original:draft.source.path,originalSha256:draft.source.sha256})),totalPublishedSourceDrawings:Object.keys(published).length},null,2)+'\n');
console.log('Published 13 checked wall drawing pairs; previous drawings, source originals and evidence preserved.');
