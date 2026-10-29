import { wallLessons, wallUnits } from './wall-learning.mjs';

const extraWallUnits = [
  { id: 'wall.overview', lesson: 'wall/index', anchor: '用一张剖面组织知识', title: '把一面外墙读成连续系统',
    question: '墙脚受潮、洞口支承与保温中断为什么需要在同一张剖面核对？',
    principle: '同一面墙同时承接结构作用和环境边界；分开画出传力、防潮、防雨及保温路线，再检查它们在接口处是否相容。',
    observe: ['在防潮图中辨认室内垫层、室外地面和贯穿墙厚的水平防潮层。', '另画带窗外墙草图，补出图中没有表示的洞口承托、雨水排离与保温接续，并把已知和待查内容分开。'],
    conclusion: '局部图解释墙身防潮的位置；全章草图才把结构、热湿与接口串起来，不能让一张局部图替代完整系统。',
    boundary: '本图只表达砌筑墙体防潮层位置，不表达楼板传力、洞口、保温或材料配方。', models: [], diagramIds: ['wall-paths'],
    assessment: { question: '墙脚饰面起皮时，应按什么顺序查因，为什么不能直接重做面层？', criteria: ['区分地表水、毛细水、渗漏及结露线索。', '核对水平防潮层与高差侧连接，再查基层和面层。', '说明局部示意不能证明整面墙的构造完整性。'] }, conceptIds: ['systems', 'moisture', 'connections'] },
  { id: 'wall.partition', lesson: 'wall/wall-partition', anchor: '轻骨架隔墙', title: '从面板边缘找到连续支承',
    question: '面板固定牢固，是否就说明轻骨架隔墙的支承和分隔性能完整？',
    principle: '面板把相应作用交给骨架，骨架经沿顶、沿地和边框连接到基层；板边、板缝和腔内材料还影响完整系统的工作。',
    observe: ['在局部揭板立面中沿板边查找竖向龙骨，再辨认沿顶和沿地龙骨。', '在水平横剖面中按一侧面板—腔体及龙骨—另一侧面板的次序读层次，检查板缝对应的支承。'],
    conclusion: '把面板、骨架、填充与周边连接一起解释；单独填满吸声材料不等于达到隔声或耐火要求。',
    boundary: '图不表示滑移节点、螺钉间距、管线穿透、额定隔声量或耐火极限；这些内容需按具体系统另查设计和试验依据。', models: [], diagramIds: ['partition'],
    assessment: { question: '说明图中板缝为什么要对应支承，并列出判断隔声及防火仍缺少的两类证据。', criteria: ['在横剖面定位板边与龙骨的关系。', '说明面板层数、接缝及周边连接属于系统条件。', '提出完整系统性能依据和实际穿透封堵设计，不能由示意图推定等级。'] }, conceptIds: ['layers', 'connections', 'sound', 'fire'] },
];
const wallAssessments = {
  'wall.roles': ['框架外墙受风后，为什么仍需连接主体？画出你能确认与需要补查的传递环节。', ['梁柱构成承重骨架，位置不决定墙的承重身份。', '墙承受自重及面外作用，需要连接和支承。', '模型未含填充墙和连接，不以梁柱外观证明连接可靠。']],
  'wall.materials': ['两种孔型不同的砌块，能否仅凭孔数判断墙的承重和保温性能？', ['区分块材孔型、整墙组合和结构角色。', '需结合产品性能、组砌与结构设计。', '灌芯时还需核对孔道连续与施工条件。']],
  'wall.bearing': ['把横墙方案改成半框架时，画出支承路线和可改变的空间边界。', ['分别画板—墙与板—梁—柱或墙的路径。', '说明内部柱列替换部分墙段后的空间变化。', '完整路线还需接到基础，模型不能替代验算。']],
  'wall.integrity': ['构造柱与芯柱如何形成竖向联系，为什么不能因此拆除相邻承重墙？', ['比较墙交接截面与砌块孔道内增强的位置。', '把竖向增强接到水平联系并说明施工条件。', '增强构件不能替代承重墙的完整作用。']],
  'wall.thermal': ['保温层在窗洞处中断时，加厚墙面保温能否解决所有问题？', ['分清保温、固定和保护的任务。', '指出洞口热桥和边界接续仍需处理。', '需热工及系统依据，不能从材料名直接推断性能。']],
  'wall.solar': ['无日照时上下孔口仍保持原状态，判断热交换方向还需要什么信息？', ['辨认玻璃、间层、墙及孔口的关系。', '补查温度、日射和控制条件。', '不能按对象名推定所有工况气流或以静态模型代替模拟。']],
  'wall.damp': ['相邻室内地面有高差时，画出水平防潮与邻土侧竖向防潮如何接续。', ['水平防潮连续贯穿需要阻断的墙厚。', '高侧邻土墙面设竖向防潮并与相应水平层连续。', '墙身防潮与地表排水分工不同，实例标高不通用。']],
  'wall.surface-water': ['墙边散水向外找坡后，为什么仍要处理墙边接缝？', ['坡向和出口负责排水。', '分离缝协调相对变形。', '柔性填缝与表面封闭共同控制接缝进水，不能刚性填死。']],
  'wall.opening-support': ['带窗楣过梁的外观能否证明支承充分？应补哪一方向的图纸？', ['窗楣外形不等于承载证明。', '需跨洞方向跨度、两端支座和配筋图。', '窗周排水与密封另行协调，窗框不是过梁支座。']],
  'wall.window-joint': ['安装缝已经填满矿棉并封胶，为什么仍需查固定点和排水？', ['填充、密封、固定、排水各有任务。', '自重、风和启闭作用需要可靠传递到基层。', '下口水要有室外出口，不能把矿棉当密封胶。']],
  'wall.finishes': ['把抹灰勒脚改为石材后，列出保留和需要重新核对的构造任务。', ['保留防潮和表面排水任务。', '按面材自重与变形重查连接和基层。', '局部石砌模型未表示的防潮层不等于可以取消。']],
};
const wallConcepts = { roles: ['loads', 'systems'], materials: ['layers'], bearing: ['loads', 'systems'], integrity: ['loads', 'connections'], thermal: ['heat', 'connections'], solar: ['solar', 'heat'], damp: ['moisture'], 'surface-water': ['water', 'movement'], 'opening-support': ['loads', 'water'], 'window-joint': ['connections', 'water'], finishes: ['layers', 'maintenance'] };
const wallPrerequisites = { roles: ['wall.overview'], materials: ['wall.roles'], bearing: ['wall.materials'], integrity: ['wall.bearing'], thermal: ['wall.partition'], solar: ['wall.thermal'], damp: ['wall.integrity'], 'surface-water': ['wall.damp'], 'opening-support': ['wall.roles'], 'window-joint': ['wall.opening-support'], finishes: ['wall.surface-water', 'wall.window-joint'] };
export const lessons = Object.fromEntries(Object.entries(wallLessons).map(([key, plan]) => [key, { ...plan, units: key === 'wall/index' ? ['wall.overview'] : key === 'wall/wall-partition' ? ['wall.partition'] : plan.units, prerequisiteIds: [], relatedPrinciples: [], applications: ['practice/envelope-detail'] }]));
export const units = [...extraWallUnits, ...wallUnits.map(unit => {
  const suffix = unit.id.slice(5);
  const assessment = wallAssessments[unit.id];
  return { ...unit, models: unit.models.map((model, index) => ({ ...model, role: index === 0 ? 'core' : 'comparison', primary: true })),
    assessment: { question: assessment[0], criteria: assessment[1] }, prerequisiteIds: wallPrerequisites[suffix] ?? [],
    conceptIds: wallConcepts[suffix] ?? [], relatedPrinciples: /damp|surface-water/.test(suffix) ? ['principles/moisture', 'principles/waterproof'] : suffix === 'thermal' ? ['principles/thermal'] : [],
    applications: ['practice/envelope-detail'], diagramIds: unit.id === 'wall.damp' ? ['wall-paths'] : unit.id === 'wall.bearing' ? ['masonry-bond'] : [] };
})].map(unit => ({ prerequisiteIds: [], relatedPrinciples: [], applications: [], ...unit }));

for (const filename of ['learning-batch-structure.mjs', 'learning-batch-envelope.mjs', 'learning-batch-crosscutting.mjs']) {
  try {
    const batch = await import(`./${filename}`);
    for (const [key, lesson] of Object.entries(batch.lessons)) {
      if (lessons[key]) throw new Error(`Duplicate authored course: ${key}`);
      lessons[key] = lesson;
    }
    units.push(...batch.units);
  } catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND' || !error.message.includes(filename)) throw error;
  }
}

// Cross-chapter prerequisites connect the book without turning review links
// into prerequisite cycles. Compare/application links remain many-to-many.
const bridges = {
  'wall.overview': ['introduction.composition'],
  'wall.partition': ['wall.integrity'],
  'foundation.path': ['introduction.composition'],
  'roof.systems': ['floor.system'],
  'openings.identity': ['wall.roles'],
  'joints.purposes': ['foundation.settlement'],
  'practice.floor-layout': ['floor.ribbed', 'floor.composite'],
  'practice.stairs-drawing': ['stairs.route', 'stairs.support', 'stairs.start'],
  'practice.roof-drainage': ['roof.drainage', 'roof.outlets'],
  'practice.envelope-detail': ['wall.window-joint', 'roof.flashing'],
};
for (const unit of units) unit.prerequisiteIds = [...new Set([...(unit.prerequisiteIds ?? []), ...(bridges[unit.id] ?? [])])];
