import { getNodeDefinition } from './nodeDefinitions';

export type TrainingMode = 'identify' | 'match' | 'order' | 'diagram' | 'path' | 'scenario' | 'diagnose' | 'assemble';
export interface TrainingPart { id: string; name: string; meshes: string[]; }
export interface TrainingChoice { id: string; label: string; }
export interface TrainingAnswer {
  selection?: string;
  reason?: string;
  order: string[];
  pairs: Record<string, string>;
  placements: Record<string, string>;
}
export interface TrainingQuestion {
  id: string;
  mode: TrainingMode;
  nodeId: string;
  title: string;
  prompt: string;
  hint: string;
  explanation: string;
  parts: TrainingPart[];
  answer: Partial<TrainingAnswer>;
  choices?: TrainingChoice[];
  reasons?: TrainingChoice[];
  figure?: { x: number; y: number; caption: string };
  hiddenParts?: string[];
  slots?: TrainingChoice[];
  startingPlacements?: Record<string, string>;
}
export interface TrainingModeInfo { id: TrainingMode; title: string; description: string; nodeId: string; minutes: string; level: string; }

// Named meshes in the eaves-gutter asset are verified against its section image.
// Numeric meshes in organized-drainage are not reliable assessment bindings.
const drainage: TrainingPart[] = [
  { id: 'roof', name: '屋面顶', meshes: ['屋面顶'] },
  { id: 'gutter', name: '檐沟', meshes: ['檐沟'] },
  { id: 'divider', name: '檐沟分水', meshes: ['檐沟分水'] },
  { id: 'outlet', name: '排水口', meshes: ['排水口'] },
];
const column: TrainingPart[] = [
  { id: 'rebar', name: '纵向钢筋', meshes: ['钢筋'] },
  { id: 'stirrup', name: '箍筋', meshes: ['箍筋'] },
  { id: 'concrete', name: '混凝土柱身', meshes: ['混凝土柱子'] },
  { id: 'slab', name: '楼板', meshes: ['楼板'] },
  { id: 'wall', name: '墙体', meshes: ['墙体'] },
  { id: 'beam', name: '圈梁', meshes: ['圈梁'] },
];
const stairs: TrainingPart[] = [
  { id: 'landing', name: '中间平台', meshes: ['中间平台'] },
  { id: 'flight', name: '梯段', meshes: ['梯段'] },
  { id: 'floor', name: '楼层平台', meshes: ['横层平台'] },
  { id: 'rail', name: '栏杆', meshes: ['栏杆', '顶层水平栏杆'] },
];
const tileRoof: TrainingPart[] = [
  { id: 'structure', name: '结构层', meshes: ['钢筋混凝土屋面板'] },
  { id: 'concrete-level', name: '细石混凝土找平层', meshes: ['C15细石混凝土找平层_35mm'] },
  { id: 'mortar-level', name: '水泥砂浆找平层', meshes: ['1：3_水泥砂浆找平层_15mm'] },
  { id: 'waterproof', name: '防水层', meshes: ['高聚物改性沥青防水卷材_3mm'] },
  { id: 'counter-batten', name: '顺水条', meshes: ['顺水条_-25×5，中距600'] },
  { id: 'batten', name: '挂瓦条', meshes: ['挂瓦条_L30×4，中距按瓦材规格'] },
  { id: 'tile', name: '块瓦面层', meshes: ['块瓦'] },
];
const floor: TrainingPart[] = [
  { id: 'column', name: '柱', meshes: ['柱'] },
  { id: 'primary', name: '主梁', meshes: ['主梁'] },
  { id: 'secondary', name: '次梁', meshes: ['次梁'] },
  { id: 'slab', name: '现浇板', meshes: ['板'] },
];

export const trainingModes: TrainingModeInfo[] = [
  { id: 'identify', title: '模型构件辨识', description: '转动模型，找到题目指定的构件。', nodeId: 'eaves-gutter-01', minutes: '3–5 分钟', level: '入门' },
  { id: 'match', title: '构件功能配对', description: '把构件与它承担的作用联系起来。', nodeId: 'stair-composition-01', minutes: '3–5 分钟', level: '入门' },
  { id: 'order', title: '构造层次排序', description: '从结构层到面层，建立空间层次。', nodeId: 'steel-batten-tile-roof-01', minutes: '5–8 分钟', level: '基础' },
  { id: 'diagram', title: '图纸与模型对应', description: '在三维模型中找到图纸圈示的部位。', nodeId: 'construction-column-01', minutes: '3–5 分钟', level: '基础' },
  { id: 'path', title: '排水与传力路径', description: '依次选择构件，连起作用传递的路径。', nodeId: 'cast-ribbed-floor-01', minutes: '3–5 分钟', level: '理解' },
  { id: 'scenario', title: '情境方案判断', description: '观察不同方案，依据条件作出判断。', nodeId: 'independent-foundation-01', minutes: '5–8 分钟', level: '应用' },
  { id: 'diagnose', title: '构造错误诊断', description: '发现缺失构件，并判断带来的影响。', nodeId: 'eaves-gutter-01', minutes: '5–8 分钟', level: '应用' },
  { id: 'assemble', title: '三维装配补全', description: '选择构件与预设位置，补全构造节点。', nodeId: 'eaves-gutter-01', minutes: '5–8 分钟', level: '进阶' },
];

export const trainingQuestions: TrainingQuestion[] = [
  {"id":"identify-gutter","mode":"identify","nodeId":"eaves-gutter-01","title":"找到檐沟","prompt":"转动檐沟外排水模型，选中承接屋面雨水的水平沟槽。可直接点选模型，也可选择模型上的字母标记。","hint":"观察屋面边缘外侧的凹槽状构件。","explanation":"檐沟位于屋面边缘，承接屋面汇水，并把雨水引向排水口。","parts":drainage,"answer":{"selection":"gutter"}},
  { id: 'identify-stirrup', mode: 'identify', nodeId: 'construction-column-01', title: '识别箍筋', prompt: '在构造柱模型中，找到环绕纵向钢筋的箍筋。转动模型观察柱内构件。', hint: '关注横向围合、重复布置的钢筋。', explanation: '箍筋围合纵向钢筋，帮助约束柱内混凝土及固定纵向钢筋的位置。', parts: column, answer: { selection: 'stirrup' } },
  { id: 'identify-landing', mode: 'identify', nodeId: 'stair-composition-01', title: '找到中间平台', prompt: '选择连接上下两个梯段、用于休息与转向的中间平台。', hint: '它位于两个相邻楼层之间，不与楼层地面直接衔接。', explanation: '中间平台连接两段楼梯，为行人提供缓冲与转向空间；楼层平台与楼层地面衔接。', parts: stairs, answer: { selection: 'landing' } },
  {"id":"match-drainage","mode":"match","nodeId":"eaves-gutter-01","title":"排水构件各司其职","prompt":"为四个构件分别选择最符合其作用的描述。点选名称可观察对应部位。","hint":"从屋面汇水开始，思考雨水怎样离开檐沟。","explanation":"屋面顶将雨水引向檐沟；檐沟承接汇水；檐沟分水使沟内雨水分向排水位置；排水口把沟内雨水导出。","parts":drainage,"choices":[{"id":"roof-flow","label":"将屋面雨水引向檐沟"},{"id":"collect","label":"在檐口承接并汇流雨水"},{"id":"divide","label":"使沟内雨水分向排水位置"},{"id":"outflow","label":"将檐沟内的雨水导出"}],"answer":{"pairs":{"roof":"roof-flow","gutter":"collect","divider":"divide","outlet":"outflow"}}},
  { id: 'match-stairs', mode: 'match', nodeId: 'stair-composition-01', title: '理解楼梯的组成', prompt: '将楼梯构件与功能一一对应。每个功能使用一次。', hint: '区分行走、休息转向、楼层衔接与临空防护。', explanation: '梯段承担上下行走；中间平台用于休息与转向；楼层平台衔接楼层；栏杆提供临空防护。', parts: stairs, choices: [{ id: 'protect', label: '临空侧的安全防护' }, { id: 'walk', label: '沿踏步上下行走' }, { id: 'join', label: '与楼层地面衔接' }, { id: 'turn', label: '两梯段之间休息与转向' }], answer: { pairs: { landing: 'turn', flight: 'walk', floor: 'join', rail: 'protect' } } },
  { id: 'order-tile-roof', mode: 'order', nodeId: 'steel-batten-tile-roof-01', title: '排列瓦屋面层次', prompt: '按当前钢挂瓦条屋面节点，从结构层向最外侧面层排列七个构造层次。这是空间层次排序，不是施工工序排序。', hint: '先确定结构层与瓦面层，再观察找平、防水及支承瓦材的构件之间的关系。', explanation: '本节点从内向外依次为结构层、细石混凝土找平层、水泥砂浆找平层、防水层、顺水条、挂瓦条、块瓦面层。其他屋面方案应按各自构造判断。', parts: tileRoof, answer: { order: tileRoof.map(part => part.id) } },
  { id: 'order-roof-support', mode: 'order', nodeId: 'steel-batten-tile-roof-01', title: '辨明支承瓦材的层次', prompt: '只排列当前节点的防水层、顺水条、挂瓦条与块瓦面层，从内向外排序。其余层次不参与本题。', hint: '顺水条沿坡向，挂瓦条直接承接瓦材。', explanation: '本节点中，顺水条位于防水层上方，挂瓦条承接瓦材，块瓦形成最外侧面层。', parts: tileRoof.filter(part => ['waterproof', 'counter-batten', 'batten', 'tile'].includes(part.id)), answer: { order: ['waterproof', 'counter-batten', 'batten', 'tile'] } },
  {"id":"diagram-outlet","mode":"diagram","nodeId":"eaves-gutter-01","title":"从剖面找到排水口","prompt":"观察图纸圈示的竖向排水开口，在三维模型中选出对应构件。图纸与模型为示意对应，不比较尺寸比例。","hint":"圈示部位位于檐沟底部，并向下延伸。","explanation":"圈示部位是排水口，对应模型中将檐沟内雨水向下导出的构件。","parts":drainage,"figure":{"x":47,"y":70,"caption":"檐沟外排水剖面 · 圈示部位 1"},"answer":{"selection":"outlet"}},
  { id: 'diagram-column', mode: 'diagram', nodeId: 'construction-column-01', title: '识别墙体交接处的柱身', prompt: '观察图纸上部圈示的竖向柱身区域，在模型中找到对应的混凝土柱身。', hint: '关注墙体交接位置的连续竖向构件。', explanation: '圈示竖向区域对应混凝土柱身。纵向钢筋与箍筋位于柱内，柱身与邻接墙体形成构造联系。', parts: column, figure: { x: 44, y: 30, caption: '构造柱示意 · 圈示部位 1' }, answer: { selection: 'concrete' } },
  {"id":"path-drainage","mode":"path","nodeId":"eaves-gutter-01","title":"追踪檐口雨水路径","prompt":"从屋面汇水到离开檐沟，依次点选雨水经过的三个构件。本题只表示模型内的连接关系，不进行水流计算。","hint":"先找屋面，再找汇水沟槽，最后找向下导出的开口。","explanation":"本节点的简化路径为屋面顶 → 檐沟 → 排水口。雨水随后经落水管继续排走，完整落水管不在本题模型内。","parts":drainage.filter(part => part.id !== 'divider'),"answer":{"order":["roof","gutter","outlet"]}},
  { id: 'path-floor', mode: 'path', nodeId: 'cast-ribbed-floor-01', title: '追踪楼面荷载', prompt: '对当前简化肋梁楼板模型，从直接承受楼面荷载的构件开始，依次点选至柱。只排列模型内的四类构件。', hint: '观察板由什么支承，较小的梁又将荷载交给谁。', explanation: '本模型的主要传力路径为现浇板 → 次梁 → 主梁 → 柱；柱继续把荷载传向基础，基础不在本题模型内。', parts: floor, answer: { order: ['slab', 'secondary', 'primary', 'column'] } },
  { id: 'scenario-cup', mode: 'scenario', nodeId: 'independent-foundation-01', title: '寻找预留杯口的方案', prompt: '任务条件：预制钢筋混凝土柱需要插入基础顶部预留的杯口，再完成灌实连接。比较模型，选择符合这个连接特征的方案与理由。', hint: '观察基础顶部是否具有容纳柱脚的杯口。', explanation: '杯形基础顶部设杯口，预制柱可插入后灌实连接。这里判断的是连接特征，不替代基础的结构设计与选型计算。', parts: [], choices: [{ id: 'cup-base', label: '杯形基础' }, { id: 'stepped-base', label: '阶梯形基础' }, { id: 'tapered-base', label: '锥形基础' }], reasons: [{ id: 'socket', label: '顶部设杯口，能容纳插入的预制柱柱脚' }, { id: 'steps', label: '外侧按台阶逐级收分' }, { id: 'slope', label: '台身以斜边连续收分' }], answer: { selection: 'cup-base', reason: 'socket' } },
  { id: 'scenario-tapered', mode: 'scenario', nodeId: 'independent-foundation-01', title: '区分基础的外形', prompt: '任务条件：需要识别台身以斜边连续收分、顶面呈斜坡的独立基础。比较三种模型并选择对应特征。', hint: '区分连续斜坡与分级台阶。', explanation: '锥形基础台身以斜边连续收分；阶梯形基础按台阶收分；杯形基础的显著连接特征是顶部杯口。', parts: [], choices: [{ id: 'cup-base', label: '杯形基础' }, { id: 'stepped-base', label: '阶梯形基础' }, { id: 'tapered-base', label: '锥形基础' }], reasons: [{ id: 'socket', label: '顶部预留杯口' }, { id: 'continuous', label: '台身以斜边连续收分，顶面呈斜坡' }, { id: 'stepped', label: '台身按台阶逐级收分' }], answer: { selection: 'tapered-base', reason: 'continuous' } },
  {"id":"diagnose-outlet","mode":"diagnose","nodeId":"eaves-gutter-01","title":"找出缺失的排水出口","prompt":"这个训练模型移除了一个排水构件。转动模型，判断缺少哪个构件，并选择其缺失造成的问题。提交后会显示完整模型。","hint":"检查檐沟底部向下导出雨水的位置。","explanation":"排水口缺失，檐沟中的雨水缺少对应出口。应恢复排水口及其与下游排水构件的连接。","parts":drainage,"hiddenParts":["outlet"],"choices":drainage.map(part => ({ id: part.id, label: part.name })),"reasons":[{"id":"outflow","label":"檐沟中的雨水缺少对应出口"},{"id":"roof","label":"缺少屋面顶构件"},{"id":"collect","label":"檐口缺少承接雨水的沟槽"}],"answer":{"selection":"outlet","reason":"outflow"}},
  {"id":"diagnose-gutter","mode":"diagnose","nodeId":"eaves-gutter-01","title":"检查檐口汇水构件","prompt":"观察移除一个构件后的模型，判断哪个构件缺失，并说明它原本承担的作用。","hint":"检查屋面边缘是否仍有完整的承接沟槽。","explanation":"檐沟缺失，屋面边缘缺少承接并汇流雨水的沟槽。檐沟分水构件不能代替完整的檐沟。","parts":drainage,"hiddenParts":["gutter"],"choices":drainage.map(part => ({ id: part.id, label: part.name })),"reasons":[{"id":"collect","label":"在檐口承接并汇流屋面雨水"},{"id":"divide","label":"使沟内雨水分向排水位置"},{"id":"outflow","label":"将檐沟内雨水向下导出"}],"answer":{"selection":"gutter","reason":"collect"}},
  {"id":"assemble-drainage","mode":"assemble","nodeId":"eaves-gutter-01","title":"补全檐沟排水节点","prompt":"先选择待装配构件，再点击模型上的位置字母或右侧位置按钮。构件会按预设方向放入该位置；可替换、移除和重试。提交后检查全部对应。","hint":"先放屋面与承接沟槽，再放沟内分水构件与底部排水口。","explanation":"屋面顶位于屋面位置，檐沟承接屋面汇水，分水构件位于沟内，排水口位于沟底。本题练习预设位置对应，方向由模型预设。","parts":drainage,"slots":[{"id":"roof","label":"屋面位置"},{"id":"gutter","label":"檐口沟槽位置"},{"id":"divider","label":"沟内分水位置"},{"id":"outlet","label":"沟底出口位置"}],"answer":{"placements":{"roof":"roof","gutter":"gutter","divider":"divider","outlet":"outlet"}}},
  {"id":"assemble-drainage-repair","mode":"assemble","nodeId":"eaves-gutter-01","title":"调整放错位置的构件","prompt":"屋面顶与排水口在这个模型中放错了位置。选择构件，再选择预设位置完成修正；已使用的构件可以移动到另一位置。","hint":"观察水平屋面与向下排水构件的形态区别。","explanation":"屋面顶放回屋面位置，排水口放回沟底出口位置。放错位置时可替换或移除，直到全部对应正确。","parts":drainage,"startingPlacements":{"roof":"outlet","outlet":"roof","gutter":"gutter","divider":"divider"},"slots":[{"id":"outlet","label":"沟底出口位置"},{"id":"divider","label":"沟内分水位置"},{"id":"gutter","label":"檐口沟槽位置"},{"id":"roof","label":"屋面位置"}],"answer":{"placements":{"roof":"roof","gutter":"gutter","divider":"divider","outlet":"outlet"}}},
];

export const TRAINING_BANK_VERSION = 1;
export function getTrainingNode(question: Pick<TrainingQuestion, 'nodeId'>) { return getNodeDefinition(question.nodeId); }
export function questionsForMode(mode: string) { return trainingQuestions.filter(question => question.mode === mode); }
