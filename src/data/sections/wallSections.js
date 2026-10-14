const wallSections = [
  {
    id: "wall-role",
    title: "墙体在建筑中的作用",
    description: "承重、围护、分隔——墙体作为建筑竖向构件的三大基本功能。",
    nodeIds: [],
    available: true,
  },
  {
    id: "wall-types",
    title: "墙体的类型",
    description: "按受力情况（承重墙/非承重墙）、按位置（外墙/内墙）、按材料（砖墙/砌块墙/混凝土墙）分类。",
    nodeIds: [],
    available: true,
  },
  {
    id: "wall-masonry",
    title: "砌体结构",
    description: "砖砌体与砌块砌体的构造要求，包括砌筑方式、墙厚模数、构造柱与圈梁。",
    nodeIds: [],
    available: true,
  },
  {
    id: "wall-partition",
    title: "隔墙",
    description: "非承重内隔墙的类型与构造做法，包括轻钢龙骨隔墙、轻质条板隔墙等。",
    nodeIds: [],
    available: true,
  },
  {
    id: "wall-design-requirements",
    title: "墙体的设计要求",
    description: "结构安全、保温隔热、隔声、防火、防水防潮等墙体设计的技术要求。",
    nodeIds: ["construction-column-01"],
    available: true,
  },
  {
    id: "wall-details",
    title: "墙体细部构造",
    description: "沿墙脚、洞口与墙顶理解防潮、排水和结构连接。",
    nodeIds: ["wall-damp-proof-course", "construction-column-01"],
    available: true,
  },
  {
    id: "wall-finishes",
    title: "墙面装修",
    description: "比较抹灰、贴面、涂饰与装配饰面的基层和连接。",
    nodeIds: [],
    available: true,
  },
];

export default wallSections;
