const roofSections = [
  {
    id: "roof-form-design",
    title: "屋盖的形式及设计要求",
    description:
      "介绍平屋顶、坡屋顶、曲面屋顶等形式及其适用场景，分析结构、防水、保温等基本设计要求。",
    nodeIds: [],
    available: false,
  },
  {
    id: "roof-drainage",
    title: "屋盖的排水",
    description:
      "讲述屋顶排水方式（无组织排水、有组织排水），雨水口、天沟、落水管的布置与构造要求。",
    nodeIds: [],
    available: false,
  },
  {
    id: "roof-membrane",
    title: "卷材防水屋面",
    description:
      "以SBS/APP改性沥青卷材为主要防水层的屋面构造，包含保护层、防水层、结合层、找平层、结构层等。",
    nodeIds: ["membrane-roof-01"],
    available: true,
    hasTextbook: true,
  },
  {
    id: "roof-rigid",
    title: "刚性防水屋面",
    description:
      "采用防水混凝土或防水砂浆作为防水层的屋面，适用于温差较小地区，需设分格缝。",
    nodeIds: [],
    available: false,
  },
  {
    id: "roof-coating",
    title: "涂膜防水屋面",
    description:
      "使用聚氨酯、丙烯酸等涂料形成连续防水膜，适用于复杂形状屋面，施工简便。",
    nodeIds: [],
    available: false,
  },
  {
    id: "roof-tile",
    title: "瓦屋面",
    description:
      "以水泥瓦、陶瓦、金属瓦等为面层的坡屋面构造，包括挂瓦条、顺水条、防水垫层等。",
    nodeIds: [],
    available: false,
  },
  {
    id: "roof-insulation",
    title: "屋盖的保温",
    description:
      "讲述保温材料（XPS、EPS、岩棉等）的选择、保温层位置（正置式/倒置式）及热工设计要求。",
    nodeIds: [],
    available: false,
  },
  {
    id: "roof-heat-isolation",
    title: "屋盖的隔热",
    description:
      "介绍通风隔热层、反射隔热涂料、种植屋面等隔热措施，降低夏季顶层室温。",
    nodeIds: [],
    available: false,
  },
];

export default roofSections;
