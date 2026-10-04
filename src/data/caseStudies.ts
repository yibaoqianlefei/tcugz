export type CaseTopicId = 'pilotis' | 'windows' | 'roof';
export interface CaseTopic {
  id: CaseTopicId;
  number: string;
  title: string;
  subtitle: string;
  summary: string;
  observation: string;
  principle: string;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
  course: { to: string; title: string };
  practice: { to: string; title: string; note: string };
}

export const savoye = {
  id: 'villa-savoye',
  title: '萨伏伊别墅',
  english: 'VILLA SAVOYE',
  location: '法国 · 普瓦西',
  period: '1928–1931',
  architects: '勒·柯布西耶、皮埃尔·让纳雷',
  description: '从架空柱、水平长窗与屋顶露台，观察结构、围护和使用空间之间的关系。',
  modelNote: '教学示意模型 · 比例与细部简化',
  sources: [
    { title: '勒·柯布西耶基金会：项目与修复记录', url: 'https://www.fondationlecorbusier.fr/oeuvre-architecture/realisations-villa-savoye-et-loge-du-jardinier-poissy-france-1928-1931/' },
    { title: '法国国家古迹中心：现代建筑的五个要点', url: 'https://www.villa-savoye.fr/decouvrir/les-5-points-de-l-architecture-moderne-selon-le-corbusier' },
    { title: '法国国家古迹中心：露台、坡道与日光浴场', url: 'https://www.villa-savoye.fr/decouvrir/un-jardin-suspendu' },
  ],
};

export const savoyeTopics: CaseTopic[] = [
  {
    id: 'pilotis', number: '01', title: '架空柱', subtitle: '结构与地面空间',
    summary: '细长的钢筋混凝土柱托起上层，让底层保留通行空间。',
    observation: '转动模型，观察退入立面内侧的柱与上层楼板。底层仍包含入口及服务空间，架空并不意味着整层没有房间。',
    principle: '柱—板体系把承重与空间分隔分开。围护墙不必沿用传统承重墙的连续布置，底层因此获得更灵活的使用方式。',
    question: '使上层居住空间离开地面、释放底层通行空间的主要构件是什么？',
    choices: ['架空柱', '水平长窗', '屋顶围墙'], answer: 0,
    explanation: '架空柱承担竖向支承作用；长窗主要用于采光与视线联系，屋顶围墙则围合露台空间。',
    course: { to: '/lesson/basics/floor/index.html', title: '楼地层章节目录' },
    practice: { to: '/games/path?question=path-floor', title: '练习梁板传力路径', note: '通用梁板节点练习，用于比较传力关系；不是别墅的原始结构节点。' },
  },
  {
    id: 'windows', number: '02', title: '水平长窗', subtitle: '结构与围护分离',
    summary: '窗带沿立面展开，把连续采光与横向景观带进室内。',
    observation: '观察窗带与柱的位置关系。模型中的细框和玻璃强调连续开口，未复原原窗的全部开启方式及连接细部。',
    principle: '当承重任务由柱—板体系承担，立面开口可以更自由地安排。长窗的效果仍需与框架连接、密封和排水做法共同判断。',
    question: '连续窗带能够较自由地布置，与哪项结构条件直接相关？',
    choices: ['窗框代替楼板承重', '承重体系与立面围护分离', '屋顶没有自重'], answer: 1,
    explanation: '柱—板体系承担主要承重任务，为立面开口提供自由度；窗框不能替代楼板承重。',
    course: { to: '/lesson/basics/door-window/index.html', title: '门窗章节目录' },
    practice: { to: '/games/diagram?question=diagram-column', title: '练习图纸与模型对应', note: '通用构造柱辨识练习，训练读图与空间对应能力；不代表别墅窗框细部。' },
  },
  {
    id: 'roof', number: '03', title: '屋顶露台', subtitle: '屋顶与室外生活',
    summary: '露台、上层日光浴场与坡道共同延续建筑中的行走体验。',
    observation: '从上方观察一层露台与更高的日光浴场，注意曲面挡风墙和坡道。模型刻意保留两级室外空间，便于比较它们与居住层的关系。',
    principle: '平屋顶可承载室外活动，但仍要解决排水、防水和边缘收口。基金会记录了露台防水修复，因此经典形式也应结合实际使用表现分析。',
    question: '屋顶露台用于室外活动时，哪项构造问题仍必须处理？',
    choices: ['取消所有排水构件', '用围墙替代防水层', '排水、防水与边缘收口'], answer: 2,
    explanation: '可使用的屋顶同样需要可靠的排水和防水。围墙及露台铺装不能直接替代这些构造。',
    course: { to: '/lesson/basics/roof/roof-overview.html', title: '阅读屋顶概述' },
    practice: { to: '/games/identify?question=identify-gutter', title: '练习辨识檐沟', note: '通用檐沟外排水练习，用于理解汇水构件；不是萨伏伊别墅的排水复原。' },
  },
];

export function getSavoyeTopic(id: string | null | undefined) {
  return savoyeTopics.find(topic => topic.id === id) ?? savoyeTopics[0];
}

export const farnsworth = {
  id: 'farnsworth-house', title: '法恩斯沃斯住宅', english: 'FARNSWORTH HOUSE',
  location: '美国 · 普莱诺', period: '1949–1951', architects: '路德维希·密斯·凡德罗',
  description: '转动完整建筑，观察外置钢柱、玻璃围护与两级入口平台。',
  modelNote: '建筑依实测图重建 · 地面与绿植为展示装饰',
  sources: [
    { title: '美国国会图书馆：HABS 实测平面', url: 'https://www.loc.gov/pictures/item/il0323.sheet.00003a/' },
    { title: 'HABS：立面与剖面', url: 'https://www.loc.gov/pictures/item/il0323.sheet.00005a/' },
    { title: 'HABS：室内核心与构造细节', url: 'https://www.loc.gov/pictures/item/il0323.sheet.00006a/' },
    { title: 'HABS：台阶、卫浴与衣柜详图', url: 'https://www.loc.gov/pictures/item/il0323.sheet.00007a/' },
    { title: 'Thornton Tomasetti：结构及梁柱连接报告（2013）', url: 'https://edithfarnsworthhouse.org/wp-content/uploads/National_Trust_Farnsworth_Thorton_Tomasetti.pdf' },
    { title: '住宅官网：尺寸与材料资料', url: 'https://edithfarnsworthhouse.org/wp-content/uploads/Mies-van-der-Rohe-Farnsworth-house.pdf' },
  ],
};
export const farnsworthTopics: CaseTopic[] = [
  {
    id: 'pilotis', number: '01', title: '外置钢柱', subtitle: '钢框架与悬挑',
    summary: '8 根外置钢柱支撑屋盖和楼板，玻璃围护退入结构内侧。',
    observation: '查看柱的工字形截面，以及它与楼板、屋盖边缘的关系。转到下方，可观察横向钢梁；柱没有被玻璃包在室内。',
    principle: '沿长向布置的钢柱承担竖向荷载，楼板和屋盖向端柱外悬挑。观察时应区分承重框架与玻璃围护。模型不用于校核钢梁承载力。',
    question: '这座住宅的玻璃围护与主体承重框架是什么关系？',
    choices: ['由钢框架承重，玻璃负责围护', '由玻璃承托屋盖', '由台阶承托屋盖'], answer: 0,
    explanation: '钢框架承担主要荷载，玻璃围护负责围合空间。二者的位置与作用不同。',
    course: { to: '/lesson/basics/floor/index.html', title: '楼地层章节目录' },
    practice: { to: '/games/path?question=path-floor', title: '练习梁板传力路径', note: '通用节点练习，用于比较传力关系；不是该住宅的钢结构节点复原。' },
  },
  {
    id: 'windows', number: '02', title: '玻璃围护', subtitle: '透明围护与开口',
    summary: '大面积固定玻璃围合室内，入口双门与东端开启窗提供开口。',
    observation: '绕建筑观察四面玻璃、细钢框、入口双门和东端下部开启窗。打开“观察内部”，查看围护与独立服务核心的位置关系。',
    principle: '透明围护不能代替承重结构，也需要处理玻璃与框的连接、密封和使用舒适度。视觉上的轻盈应与实际热工、通风条件一起分析。',
    question: '模型中的大面积玻璃主要承担哪项任务？',
    choices: ['支承整个楼板', '围合空间并提供采光与视线', '作为楼板基础'], answer: 1,
    explanation: '玻璃形成透明围护；支承楼板和屋盖的主要构件是钢框架。',
    course: { to: '/lesson/basics/door-window/index.html', title: '门窗章节目录' },
    practice: { to: '/games/diagram?question=diagram-column', title: '练习图纸与模型对应', note: '通用图模对应练习，训练空间辨识；不是该住宅的门窗细部。' },
  },
  {
    id: 'roof', number: '03', title: '入口平台', subtitle: '架空平台与台阶',
    summary: '两级石材平台与开敞台阶连接地面和抬高的室内地坪。',
    observation: '查看向侧面错开的下层平台、上层门廊和两段无踢面的台阶。平台属于建筑本体；周围地面与绿植为展示装饰，不代表原址测绘。',
    principle: '抬高的地坪通过钢支承与地面分离，入口以分级平台组织高度变化。架空高度本身不能作为充分的防洪保证，室外平台仍需考虑排水。',
    question: '从地面进入抬高的室内，模型呈现了怎样的路径？',
    choices: ['直接跨过玻璃', '沿屋顶进入', '台阶—下层平台—台阶—上层门廊'], answer: 2,
    explanation: '入口由两级平台和两段台阶连接，不需要借助场地模型也能观察它们的关系。',
    course: { to: '/lesson/basics/stairs/index.html', title: '楼梯章节目录' },
    practice: { to: '/games/identify?question=identify-gutter', title: '练习辨识檐沟', note: '通用排水辨识练习，用于比较室外汇水构件；不是该住宅的排水复原。' },
  },
];

export interface CaseStudy {
  id: string; title: string; english: string; location: string; period: string; architects: string;
  description: string; modelNote: string; sources: { title: string; url: string }[];
  topics: CaseTopic[]; cover: string;
}
export const featuredCase: CaseStudy = { ...farnsworth, topics: farnsworthTopics, cover: 'images/cases/farnsworth-model.png' };
export const legacySavoyeCase: CaseStudy = { ...savoye, topics: savoyeTopics, cover: 'images/cases/villa-savoye-model.png' };
export function getCaseStudy(id: string | undefined) {
  return [featuredCase, legacySavoyeCase].find(item => item.id === id);
}
export function getCaseTopic(study: CaseStudy, id: string | null | undefined) {
  return study.topics.find(topic => topic.id === id) ?? study.topics[0];
}
