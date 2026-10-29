// One teaching relationship source for the wall pilot. Other chapters retain
// their existing media edition. Object labels below bind to real node cards.
const model = (nodeId, objects, difference) => ({ nodeId, objects, difference });
export const wallUnits = [
  {
    id: 'wall.roles', lesson: 'wall/wall-role', anchor: '从结构体系判断墙的身份', title: '先找到楼板的支承，再给墙定身份',
    question: '外墙是否一定承重，内墙是否一定不承重？',
    principle: '位置说明它分隔哪里，结构角色说明作用传给谁。框架中梁柱构成承重骨架；砌体承重体系中，楼板可把作用传给相应墙段。二者都需要可靠连接。',
    observe: ['点选框架梁，再点选框架柱，说明梁端作用继续向哪里传递。', '框架模型没有填充墙。把填充墙作为另一条自重和面外作用路径补画到草图中。'],
    conclusion: '能指出梁柱的位置，还要能解释围护墙为什么仍需与主体连接；“非承重”不是“不受力”。',
    boundary: '梁柱模型不含楼板、填充墙、基础或连接配筋，不能用它验证整栋建筑的承载与抗侧性能。',
    models: [model('frame-structure-layout-01', ['框架梁', '框架柱'], '从两向梁追到柱，识别框架骨架。')],
  },
  {
    id: 'wall.materials', lesson: 'wall/wall-types', anchor: '按材料与构造方式分类', title: '砌块有孔，不等于整墙有空气间层',
    question: '孔型、墙体构造和承重身份能否互相替代？',
    principle: '孔型是块材内部的几何特征；墙体构造还包含灰缝、连接和可能的附加层；承重身份由完整体系确定。三种描述应分别给出。',
    observe: ['逐组点选四类砌块，观察孔洞与壁肋的位置。', '设想上下两皮叠砌，指出需要灌芯时孔道连续为什么比表面孔数更重要。'],
    conclusion: '先描述块材，再描述墙的组合与作用；模型没有产品强度试验，不能由孔型直接判定用途。',
    boundary: '模型只展示砌块形式，不展示实际组砌、灰缝质量或产品性能。',
    models: [model('hollow-block-forms-01', ['多排扁孔', '单排双孔', '单排圆孔', '单排组合孔'], '比较孔洞和壁肋，而非按孔数排列性能高低。')],
  },
  {
    id: 'wall.bearing', lesson: 'wall/wall-masonry', anchor: '承重墙布置与传力', title: '同一问题：楼板把作用交给哪些支承',
    question: '为什么横墙、纵墙、纵横墙和半框架布置会形成不同空间？',
    principle: '楼板支承、墙段连续与房间分隔共同约束布置。改变支承方向或用内部梁柱替换部分墙段，会改变传力路线与空间组织；围墙外形相似并不表示体系相同。',
    observe: ['在横墙承重模型中点选楼板与墙体，找到板端邻接的横墙。', '比较其余三种方案，分别画出“板—墙”或“板—梁—柱/墙”的路线，并注明图外还需接到基础。'],
    conclusion: '比较的是支承关系和空间分隔，不是外观优劣。纵横墙承重也不表示每一块楼板都是双向板。',
    boundary: '这些是单层布置示意，墙段和楼板多为合并网格；不展示结构计算、完整连接或抗震验算。',
    models: [
      model('wall-bearing-transverse-01', ['楼板', '墙体', '横向梁'], '横墙重复分隔，观察板端与横向墙段及通道梁的关系。'),
      model('wall-bearing-longitudinal-01', ['楼板', '墙体'], '转向外纵墙与内纵墙，比较板端支承和横向空间。'),
      model('wall-bearing-two-way-01', ['楼板', '墙体', '横向梁'], '按房间分别读板的排列方向，不能给整栋建筑只画一种箭头。'),
      model('wall-bearing-semi-frame-01', ['楼板', '横向梁', '柱', '墙体'], '识别内部柱列与横向梁，再观察外围墙体；区别于完全梁柱骨架。'),
    ],
  },
  {
    id: 'wall.integrity', lesson: 'wall/wall-masonry', anchor: '圈梁、构造柱与芯柱', title: '把墙的水平联系与竖向联系接起来',
    question: '构造柱与芯柱在哪里形成联系，为什么都不能代替承重墙？',
    principle: '圈梁沿水平方向联系墙段，构造柱在墙交接或边界形成竖向约束；芯柱利用砌块孔道形成竖向增强。它们通过连续连接改善整体工作，任务与框架承重骨架不同。',
    observe: ['在构造柱模型中依次点选墙体、马牙槎、钢筋、圈梁，解释相邻构件怎样形成联系。', '进入芯柱模型，观察增强构件从墙外预留截面转到砌块孔道内部后的施工条件变化。'],
    conclusion: '用“位置—连接—施工顺序”比较两者，再说明为什么不能先拆墙、后以加柱补救。',
    boundary: '构造柱模型与所配局部原图的墙体布置不同；图示钢筋与混凝土标号是本例记录，不是全站通用配筋。',
    models: [
      model('construction-column-01', ['墙体', '马牙槎', '钢筋', '圈梁'], '墙交接处的柱身、咬合和水平联系。'),
      model('block-wall-core-column-01', ['砌块墙体', '2Φ12通长筋', '灌C15细石混凝土'], '孔道内的钢筋与灌芯，核对孔道连续和灌注条件。'),
    ],
  },
  {
    id: 'wall.thermal', lesson: 'wall/wall-design-requirements', anchor: '保温、隔热、气密与防结露', title: '保温、固定和外侧保护各做什么',
    question: '把保温板贴满墙面，是否就得到完整的外墙性能？',
    principle: '保温层减小实体传热，连接把附加层作用交给基层，外侧保护应适应水和变形。洞口、梁柱和穿透处仍要保持相应边界连续，气密与防结露需要另外判断。',
    observe: ['点选保温板与基层墙体，再找胶粘、锚固和保护层的相邻位置。', '对比岩棉做法，记录固定、找平及保护层的差异；再在纸上把这套层次接到窗洞四周。'],
    conclusion: '能解释层的分工，比只背从外到内的名称更重要；材料名称不能替代完整系统性能评价。',
    boundary: '局部墙身模型不含完整洞口热桥，也不提供热工、声学或耐火试验结果。',
    models: [
      model('foam-insulation-01', ['保温板', '胶粘剂', '锚栓加固', '基层墙体'], '辨认粘贴、锚固、增强及饰面之间的任务。'),
      model('rockwool-insulation-01', ['锚栓', '基层墙体'], '对照卡片中的保温、找平和外侧保护，图示厚度仅对应本例。'),
    ],
  },
  {
    id: 'wall.solar', lesson: 'wall/wall-design-requirements', anchor: '有条件的被动太阳能墙', title: '太阳得热与通风要说明运行条件',
    question: '同一套玻璃、间层和孔口，为何不能在各季节采用同一运行方式？',
    principle: '玻璃侧日射、间层空气、蓄热或传热界面与室内连接共同影响热交换。日照、室内外温度和孔口开闭变化，可能改变热量及空气流动方向。',
    observe: ['定位外侧玻璃、空气间层和外围护墙，画出它们的相邻次序。', '找到上下孔口，分别说明有日照与无日照时还需哪些温度、控制及防倒流信息。'],
    conclusion: '模型帮助定位气流界面；不能只按对象名称中的“进风”“出风”推断所有工况下的流向。',
    boundary: '模型不模拟温度场、气流或季节切换，不把特殊太阳能墙直接当成普通外保温。',
    models: [model('passive-solar-wall-01', ['外侧玻璃', '空气间层', '外围护墙', '上部进风口', '下部出风口'], '从层次与孔口建立有条件的热交换路径。')],
  },
  {
    id: 'wall.damp', lesson: 'wall/wall-details', anchor: '墙脚防潮：先追踪水的路径', title: '三个场景，同一条连续防潮线',
    question: '改变垫层透水性或地面高差，水会从哪里绕过原防潮层？',
    principle: '防潮层要切断墙内毛细水并与地面防护相接。密实与透水垫层提供的边界条件不同；有高差时还要检查侧向绕水，不能只重复一道水平线。',
    observe: ['依次选择密实垫层、透水垫层和地面高差三个方案，比较防潮层与地面的位置。', '在高差方案中定位竖向连接，沿墙内与墙侧各画一条可能的受潮路径。'],
    conclusion: '先解释水的来源与路径，再解释防潮层位置。散水和勒脚不能代替这条墙内防潮线。',
    boundary: '三维方案部分构件为合并网格，应按方案知识条目观察，不能要求逐层点选；尺寸和材料记录属于实例。',
    models: [model('wall-damp-proof-course', [], '通过方案选择切换工况；比较垫层条件和高差连接。')],
  },
  {
    id: 'wall.surface-water', lesson: 'wall/wall-details', anchor: '勒脚、散水与明沟', title: '排走地表水，也要允许墙边变形',
    question: '散水向外找坡后，为什么墙边的缝还需单独处理？',
    principle: '散水减少墙脚的受水机会，分离缝协调主体与地面构造的相对变形，柔性填缝维持接口阻水；坡向、出口和接缝共同决定路径是否连续。',
    observe: ['点选墙边的密封膏与聚乙烯泡沫塑料，区分表面封闭和缝内填充。', '比较块石散水与细石混凝土散水，说明面层和垫层改变后仍应保留哪些水路与变形任务。'],
    conclusion: '“把缝填死”和“把水排走”不是同一任务；比较材料时应保持墙脚接口这个共同观察对象。',
    boundary: '本例坡度、厚度及材料强度只作读图记录，场地出口和整圈散水的分格未完整呈现。',
    models: [
      model('apron-flashing-01', ['密封膏嵌缝', '聚乙烯泡沫塑料'], '细石混凝土面层与墙边分离缝。'),
      model('stone-apron-01', ['密封膏嵌缝', '聚乙烯泡沫塑料'], '面层和垫层形式改变，继续核对坡向及墙边接口。'),
    ],
  },
  {
    id: 'wall.opening-support', lesson: 'wall/wall-details', anchor: '门窗洞口：传力、密封与排水', title: '过梁承托与洞口外形分别比较',
    question: '平墙、带窗套和带窗楣的外形差异，能否直接证明支承充分？',
    principle: '过梁承担洞口上方相应作用，窗套和窗楣改变洞口周边的外形与界面。结构支承、表面排水和窗框密封需要分别说明，再在同一详图中协调。',
    observe: ['点选过梁主体、包覆层和上部墙体，辨认沿墙厚方向的局部截面。', '比较窗套与窗楣的凸出位置，再列出确认跨度、两端支座及配筋仍需要的图纸。'],
    conclusion: '模型能说明局部几何，不能由窗套或窗楣外观推断过梁的承载能力，也不能把窗框当成过梁支座。',
    boundary: '三种模型均未完整表达跨洞方向的两端支座及配筋。',
    models: [
      model('rc-lintel-flush-01', ['平墙过梁', '外围包覆层', '墙'], '先识别齐墙截面，区分主体和外围包覆。'),
      model('rc-lintel-window-surround-01', ['带窗套过梁', '外围包覆层', '墙'], '观察外围向窗套延伸的轮廓。'),
      model('rc-lintel-window-hood-01', ['带窗楣过梁', '外围包覆层', '墙'], '观察外挑窗楣，联系上口遮雨与下口排水。'),
    ],
  },
  {
    id: 'wall.window-joint', lesson: 'wall/wall-details', anchor: '安装缝的四项任务', title: '填缝与密封，不能代替可靠固定',
    question: '窗墙缝填满后，还缺哪些构造信息才能说明接口完整？',
    principle: '固定传递门窗作用，填缝处理间隙，密封控制水与空气通路，排水把已进入界面的水引向室外。几项任务可相互配合，但不能互相替代。',
    observe: ['点选窗框、外墙、袋装矿棉和弹性密封胶，找出不同材料的位置。', '在草图中补出本模型没有独立表示的固定点和下口排水去向，再核对墙身保温的接续。'],
    conclusion: '用“作用—路径—接口”说明填塞与胶封的分工，而非把所有材料统称为防水层。',
    boundary: '这是传统安装缝局部示例，木条不应被当成适用于任意现代门窗系统的固定方案。',
    models: [model('window-wall-gap-sealing-01', ['窗框', '外墙', '袋装矿棉', '弹性密封胶'], '观察缝内填充与两侧密封，补全固定和排水。')],
  },
  {
    id: 'wall.finishes', lesson: 'wall/wall-finishes', anchor: '用勒脚比较饰面与墙身防潮', title: '同一个墙脚，面层改变后哪些任务保留',
    question: '换成石材或贴面，是否就可以取消墙脚防潮？',
    principle: '饰面保护可见表面，基层与连接承担附加层的自重和变形，墙身及地面的防潮线控制内部水分路径。面材更换并不取消另外两项任务。',
    observe: ['比较抹灰、贴面和石砌勒脚，先找墙体与外侧可见层，再找相邻地面和防潮构造。', '说明各模型明确表示了什么连接，哪些重型面材锚固或干挂构造不能从这些模型推出。'],
    conclusion: '从材料名称转向“面层—连接—基层—防潮”的关系；修补起皮前先判断水源和基层是否仍在变化。',
    boundary: '贴面勒脚不代表通用干挂系统；石砌模型未单独显示的防潮层不能解释为可以取消。',
    models: [
      model('plaster-plinth-01', ['抹灰', '墙体', '防潮层'], '区分外侧抹灰保护与墙内水平防潮。'),
      model('faced-plinth-01', ['贴面', '墙体', '防潮层'], '改变面层后，继续检查基层和防潮接续。'),
      model('stone-plinth-01', ['石砌', '墙体'], '比较石砌层与上部墙体，不把未表示的层次当成无需设置。'),
    ],
  },
];

export const wallLessons = {
  'wall/index': { outcome: '用一张带窗外墙剖面，串起身份、材料、连接、性能与维护。', prerequisite: '先回顾建筑物的构造组成。', next: 'wall/wall-role', units: [], diagrams: ['wall-paths'], intro: '从一片带窗外墙出发：先确认支承，再追踪水与热，最后解释洞口、墙脚和饰面为何要这样连接。' },
  'wall/wall-role': { outcome: '根据支承关系区分承重、围护与分隔，并解释非承重墙的必要连接。', prerequisite: '墙体概述：先分清部位与结构身份。', next: 'wall/wall-types', units: ['wall.roles'], diagrams: [], intro: '先用梁柱骨架找承重路径，再把围护和分隔的作用放回同一空间，避免凭内外位置判断受力。' },
  'wall/wall-types': { outcome: '用位置、受力、材料和组合方式分别描述同一片墙。', prerequisite: '墙体在建筑中的作用：结构身份与位置并不等价。', next: 'wall/wall-masonry', units: ['wall.materials'], diagrams: [], intro: '先描述块材孔型，再描述墙体组合与结构角色；每一个分类词都应回答不同的问题。' },
  'wall/wall-masonry': { outcome: '从楼板支承解释四种布置，再用错缝、圈梁、构造柱和芯柱解释整体联系。', prerequisite: '墙体类型：分清方向、材料和受力三个维度。', next: 'wall/wall-partition', units: ['wall.bearing', 'wall.integrity'], diagrams: ['masonry-bond'], intro: '先看整栋布置中的支承，再缩小到砌体交接。四种承重方案与两种竖向增强构造围绕同一条传力路线比较。' },
  'wall/wall-partition': { outcome: '解释隔墙的自重支承、面外连接、顶部变形和声火边界。', prerequisite: '砌体结构：有自重支承与连接，不等于承担楼盖荷载。', next: 'wall/wall-design-requirements', units: [], diagrams: ['partition'], intro: '本节用轻骨架示意补足模型库的表达范围，按支承、变形、密封和穿透四处接口检查隔墙。' },
  'wall/wall-design-requirements': { outcome: '在同一墙身与洞口追踪结构、热湿、声火和维护要求，说明各层分工。', prerequisite: '隔墙：性能来自完整系统及周边连接。', next: 'wall/wall-details', units: ['wall.thermal', 'wall.solar'], diagrams: [], intro: '保温系统用来理解层次与固定；太阳能墙用来讨论工况与孔口。两种模型分别回答不同问题，不混为一种外墙做法。' },
  'wall/wall-details': { outcome: '把墙脚防潮、散水排水、洞口承托与安装缝接成连续路径。', prerequisite: '墙体设计要求：先说明作用，再选择接口措施。', next: 'wall/wall-finishes', units: ['wall.damp', 'wall.surface-water', 'wall.opening-support', 'wall.window-joint'], diagrams: ['wall-paths'], intro: '从地面水分走向洞口：每一处节点都要说明水从哪里来、作用传给谁、连接怎样连续。多种做法围绕同一个问题比较。' },
  'wall/wall-finishes': { outcome: '从基层、连接与面层解释墙面缺陷，并把表面保护与墙身防潮分开。', prerequisite: '墙体细部：明确墙脚与洞口的水路及活动接口。', next: 'wall/index', units: ['wall.finishes'], diagrams: [], intro: '保留饰面分类与施工知识，再用三种勒脚检验“面材更换不等于系统任务消失”，完成本章综合解释。' },
};

export const wallMedia = Object.fromEntries(Object.entries(wallLessons).map(([key, lesson]) => [key, {
  intro: lesson.intro,
  figures: lesson.units.map(id => {
    const unit = wallUnits.find(item => item.id === id);
    return { nodeId: unit.models[0].nodeId, anchor: unit.anchor, title: unit.title, caption: unit.principle + unit.boundary, focus: unit.observe, imageAlt: unit.title + '的构造示意', knowledgeId: unit.id };
  }),
}]));
