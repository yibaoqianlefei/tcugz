import introSections from '../../src/data/sections/introSections.js';
import foundationSections from '../../src/data/sections/foundationSections.js';
import wallSections from '../../src/data/sections/wallSections.js';
import windowSections from '../../src/data/sections/windowSections.js';
import floorSections from '../../src/data/sections/floorSections.js';
import stairsSections from '../../src/data/sections/stairsSections.js';
import roofSections from '../../src/data/sections/roofSections.js';
import deformationJointSections from '../../src/data/sections/deformationJointSections.js';

export const principles = [
  ['thermal', '建筑保温', '理解围护结构的保温做法与热工性能。'],
  ['waterproof', '建筑防水', '梳理屋面、墙体与地下空间的防水策略。'],
  ['insulation', '建筑隔热', '比较遮阳、通风与隔热构造。'],
  ['acoustic', '建筑隔声', '认识空气声与撞击声的控制方式。'],
  ['fire', '建筑防火', '理解耐火与防火分隔的构造要求。'],
  ['moisture', '建筑防潮', '关注地面、墙脚与围护层的防潮处理。'],
].map(([id, title, description]) => ({ id, title, description }));

export const practiceTasks = [
  ['construction-brief', '构造方案说明', '从建筑条件建立结构、围护与材料方案。'],
  ['floor-layout', '楼面构造布置', '协调轴网、受力、标高与房间面层。'],
  ['stairs-drawing', '楼梯绘图', '从层高和空间条件推导楼梯平剖面。'],
  ['roof-drainage', '屋顶排水设计', '形成排水分区、分水线与落水口方案。'],
  ['envelope-detail', '外檐节点综合', '在墙、窗和屋面交接处落实连续性能层。'],
  ['integrated-design', '综合课程设计', '通过幼儿园教学场景串联专项构造任务。'],
  ['construction-survey', '构造调研', '用可核实的记录比较两类构造系统。'],
].map(([id, title, description]) => ({ id, title, description }));

export const groups = {
  introduction: { title: '建筑绪论', description: '认识建筑的分类、组成与基本设计原则。', topics: introSections },
  principles: { title: '构造原理', description: '从建筑物理与安全要求理解构造设计。', topics: principles },
  practice: { title: '教材实践作业', description: '把章节知识转化为方案、图纸与调研记录。按任务书自查后，再与课程教师约定提交方式。', topics: practiceTasks },
};

export const modules = {
  foundation: { title: '基础与地基', description: '理解建筑与地面的连接方式。', topics: foundationSections },
  wall: { title: '墙体', description: '认识围护、分隔与承重构造。', topics: [{ id: 'index', title: '墙体概述', description: '建立对墙体功能与基本构造的整体认识。' }, ...wallSections] },
  'door-window': { title: '门窗', description: '探索建筑开口的设计与做法。', topics: windowSections },
  floor: { title: '楼地层', description: '了解楼板与地面的构造关系。', topics: floorSections },
  stairs: { title: '楼梯', description: '梳理建筑的竖向交通空间。', topics: stairsSections },
  roof: { title: '屋顶', description: '比较平屋面与坡屋面的构造。', topics: roofSections },
  'deformation-joint': { title: '变形缝', description: '认识建筑变形缝的设置原则与构造做法。', topics: deformationJointSections },
};

const folders = { wall: 'walls', 'door-window': 'door-window' };
const exceptions = { 'wall/index': 'walls/index', 'wall/wall-partition': 'walls/partitions', 'roof/roof-overview': 'roof/index' };
export const articles = [
  ...Object.entries(groups).flatMap(([group, value]) => value.topics.map(topic => ({ ...topic, group, path: `${group}/${topic.id}.html`, source: `src/data/textbook/${group}/${topic.id}.md` }))),
  ...Object.entries(modules).flatMap(([group, value]) => value.topics.map(topic => ({ ...topic, group, path: `basics/${group}/${topic.id}.html`, source: `src/data/textbook/${exceptions[`${group}/${topic.id}`] ?? `${folders[group] ?? group}/${topic.id}`}.md` }))),
];
export const articleSources = Object.fromEntries(articles.map(article => [`${article.group}/${article.id}`, article.source]));
