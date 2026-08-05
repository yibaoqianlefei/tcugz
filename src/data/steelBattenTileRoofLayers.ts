/**
 * Steel batten block-tile roof (钢挂瓦条块瓦屋面) — layer data mapping.
 * Maps GLB mesh objectName (canonical Blender export names) → construction knowledge.
 *
 * Load path (bottom → top): 钢筋混凝土屋面板 → C15找平层 → 水泥砂浆找平层
 *   → 防水卷材 → 顺水条 → 挂瓦条 → 块瓦
 */

export interface LayerInfo {
  objectName: string;   // matches canonical GLB mesh name
  name: string;         // Chinese display name
  order: number;        // construction layer order (1=bottom → N=top)
  thickness: string;    // e.g. "3mm"
  material: string;     // material description
  description: string;  // teaching content
}

export const steelBattenTileRoofLayers: LayerInfo[] = [
  {
    objectName: "钢筋混凝土屋面板",
    name: "结构层",
    order: 1,
    thickness: "—",
    material: "钢筋混凝土屋面板",
    description:
      "屋面承重结构层，承受瓦屋面全部荷载（瓦、挂瓦条、顺水条、防水层及自重、风荷载）并传递给屋架或墙体。",
  },
  {
    objectName: "C15细石混凝土找平层_35mm",
    name: "找平层（细石混凝土）",
    order: 2,
    thickness: "35mm",
    material: "C15细石混凝土",
    description:
      "在结构层上浇筑C15细石混凝土找坡找平，形成排水坡度，为防水层提供平整坚固的基层，避免卷材空鼓。",
  },
  {
    objectName: "1：3_水泥砂浆找平层_15mm",
    name: "找平层（水泥砂浆）",
    order: 3,
    thickness: "15mm",
    material: "1:3水泥砂浆",
    description:
      "在细石混凝土层之上抹1:3水泥砂浆作精找平，表面压实抹光，进一步提高基层平整度，保证防水卷材铺贴密实。",
  },
  {
    objectName: "高聚物改性沥青防水卷材_3mm",
    name: "防水层",
    order: 4,
    thickness: "3mm",
    material: "高聚物改性沥青防水卷材",
    description:
      "坡屋面防水的核心层次，铺贴于找平层之上、顺水条之下。卷材应顺水流方向搭接，搭接宽度不小于100mm，将雨水与结构层完全隔离。",
  },
  {
    objectName: "顺水条_-25×5，中距600",
    name: "顺水条",
    order: 5,
    thickness: "-25×5mm，中距600mm",
    material: "防腐木条 / 钢条",
    description:
      "沿坡向布置的顺水条，钉固于防水层之上，既压紧保护卷材，又在其间形成空气流通层，加速雨水蒸发、防止瓦下积水。",
  },
  {
    objectName: "挂瓦条_L30×4，中距按瓦材规格",
    name: "挂瓦条",
    order: 6,
    thickness: "L30×4mm，中距按瓦材规格",
    material: "防腐钢条 / 木条",
    description:
      "垂直于顺水条布置，直接承接瓦材，间距按瓦材规格确定。挂瓦条必须平直、牢固，与顺水条连接可靠，保证块瓦挂接稳固、不松动。",
  },
  {
    objectName: "块瓦",
    name: "块瓦面层",
    order: 7,
    thickness: "按瓦材规格",
    material: "烧结块瓦 / 水泥瓦",
    description:
      "屋面最外层的块瓦，依靠挂瓦条挂接，形成完整防水、防雨、保温、美观的屋面面层。块瓦搭接应顺水流方向，上下搭接长度符合规范。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return steelBattenTileRoofLayers.find((l) => l.objectName === objectName);
}
