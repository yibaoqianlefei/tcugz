interface NodeIndexEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string | null;
}

const nodesIndex: NodeIndexEntry[] = [
  {
    id: "flat-roof-01",
    title: "平屋面构造",
    description:
      "上人平屋面，八层构造：保护层、隔气层(卷材)、防水层、隔气层(冷底子油)、找平层、找坡层、保温层、结构层。",
    category: "屋顶",
    thumbnail: null,
  },
  {
    id: "sloped-roof-01",
    title: "坡屋顶构造",
    description:
      "坡屋顶（斜屋顶）构造层次：彩色水泥瓦→挂瓦条→顺水条→保温层→隔气层→防水层→找平层→结构层。",
    category: "屋顶",
    thumbnail: null,
  },
  {
    id: "roof-drainage-01",
    title: "无组织排水屋顶",
    description:
      "无组织排水屋面构造节点，包含防水层、保温层、结构层等关键构件。",
    category: "屋顶",
    thumbnail: "/images/roof/roof-drainage-diagram.png",
  },
  {
    id: "organized-drainage-01",
    title: "有组织排水屋顶",
    description:
      "有组织排水屋面构造节点，包含天沟、雨水斗、落水管等构件。",
    category: "屋顶",
    thumbnail: "/images/roof/organized-drainage-diagram.png",
  },
  {
    id: "construction-column-01",
    title: "构造柱",
    description:
      "砖混结构墙体交接处的钢筋混凝土构造柱，包含混凝土柱、钢筋、箍筋、墙体、圈梁、楼板及马牙槎。",
    category: "墙体",
    thumbnail: "/images/construction-column-diagram.png",
  },
  {
    id: "apron-flashing-01",
    title: "细石混凝土散水构造",
    description:
      "外墙根部散水构造节点，九层构造：细石混凝土面层→饰面层→防水层→钢筋混凝土墙体→聚乙烯泡沫缝→密封膏嵌缝→保温层→卵石灌浆垫层→素土夯实。",
    category: "墙体",
    thumbnail: "/images/apron-flashing-diagram.png",
  },
  {
    id: "eaves-gutter-01",
    title: "檐沟外排水",
    description:
      "屋顶檐沟有组织排水节点，六层构件：屋面顶→檐沟→檐沟分水→排水口→墙体→圈梁。",
    category: "屋顶",
    thumbnail: "/images/eaves-gutter-diagram.png",
  },
  {
    id: "stone-apron-01",
    title: "块石散水构造",
    description:
      "外墙根部块石铺砌散水节点，九层构造：饰面层→防水层→钢筋混凝土墙体→聚乙烯泡沫缝→密封膏嵌缝→保温层→块石面层(120mm)→粗砂垫层(30mm)→素土夯实。",
    category: "墙体",
    thumbnail: "/images/stone-apron-diagram.png",
  },
  {
    id: "yuncheng-c-01",
    title: "01",
    description:
      "郓城县南湖新区公共服务建筑C地块设计 - 构造节点01",
    category: "案例",
    thumbnail: null,
  },
  {
    id: "yuncheng-c-02",
    title: "02",
    description:
      "郓城县南湖新区公共服务建筑C地块设计 - 构造节点02",
    category: "案例",
    thumbnail: null,
  },
  {
    id: "yuncheng-c-03",
    title: "03",
    description:
      "郓城县南湖新区公共服务建筑C地块设计 - 构造节点03",
    category: "案例",
    thumbnail: null,
  },
];

type NodeLoader = () => Promise<{ default: any }>;

const nodeLoaders: Record<string, NodeLoader> = {
  "flat-roof-01": () => import("./flatRoof"),
  "roof-drainage-01": () => import("./roofDrainage"),
  "organized-drainage-01": () => import("./organizedDrainage"),
  "construction-column-01": () => import("./constructionColumn"),
  // yuncheng case-study nodes — deferred until models are available
  // "yuncheng-c-01": () => import("./yunchengC01"),
  // "yuncheng-c-02": () => import("./yunchengC02"),
  // "yuncheng-c-03": () => import("./yunchengC03"),
};

export async function getNodeData(id: string): Promise<any> {
  const loader = nodeLoaders[id];
  if (!loader) return null;
  try {
    const mod = await loader();
    return mod.default;
  } catch {
    return null;
  }
}

export { nodesIndex };
