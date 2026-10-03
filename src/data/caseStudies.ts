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
