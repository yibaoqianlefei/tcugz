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
      "上人平屋面，六层构造由上至下：保护层、防水层、找平层、保温层、找坡层、结构层。",
    category: "屋顶",
    thumbnail: null,
  },
  {
    id: "membrane-roof-01",
    title: "卷材防水屋面",
    description:
      "卷材防水屋面由多层材料叠合而成，按各层的作用分别为：顶棚层、结构层、找平层、结合层、防水层、保护层。",
    category: "屋顶",
    thumbnail: null,
  },
  {
    id: "roof-insulation-01",
    title: "卷材平面屋顶保温构造",
    description:
      "典型含保温层的卷材防水屋面，由结构层至保护层共九层。",
    category: "屋顶",
    thumbnail: null,
  },
  {
    id: "roof-drainage-01",
    title: "无组织排水屋顶",
    description:
      "无组织排水屋面构造节点，包含防水层、保温层、结构层等关键构件。",
    category: "屋顶",
    thumbnail: null,
  },
  {
    id: "organized-drainage-01",
    title: "有组织排水屋顶",
    description:
      "有组织排水屋面构造节点，包含天沟、雨水斗、落水管等构件。",
    category: "屋顶",
    thumbnail: null,
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
  "membrane-roof-01": () => import("./membraneRoof"),
  "roof-insulation-01": () => import("./roofInsulation"),
  "roof-drainage-01": () => import("./roofDrainage"),
  "organized-drainage-01": () => import("./organizedDrainage"),
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
