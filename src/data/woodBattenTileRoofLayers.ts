/**
 * Wooden-batten block-tile roof (木挂瓦条块瓦屋面) — layer data mapping.
 * Maps GLB mesh objectName (canonical Blender export names) → construction knowledge.
 *
 * Load path (bottom → top): 钢筋混凝土屋面板 → C15细石混凝土找平层 → 水泥砂浆找平层
 *   → 防水卷材/防水涂膜 → 顺水条 → 挂瓦条 → 块瓦
 *
 * 与钢挂瓦条块瓦屋面同为"顺水条+挂瓦条"构造，但挂瓦条、顺水条均采用
 * 经防腐处理的木条；防水层允许采用高聚物改性沥青防水卷材 3mm 或防水涂膜 ≥2mm。
 *
 * 注意：Blender glTF 导出将超长对象名截断至 63 字节，防水层与细石混凝土找平层
 * 的名字缺少结尾右括号「）」，此处 objectName 与 GLB 实际导出名保持一致。
 */

export interface LayerInfo {
  objectName: string;   // matches canonical GLB mesh name
  name: string;         // Chinese display name
  order: number;        // construction layer order (1=bottom → N=top)
  thickness: string;    // e.g. "15mm"
  material: string;     // material description
  description: string;  // teaching content
}

export const woodBattenTileRoofLayers: LayerInfo[] = [
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
    objectName: "C15细石混凝土找平层，厚_35mm（配φ6@500×500钢筋",
    name: "找平层（细石混凝土）",
    order: 2,
    thickness: "35mm",
    material: "C15细石混凝土，配φ6@500×500钢筋",
    description:
      "在结构层上浇筑C15细石混凝土找坡找平，厚35mm，内配φ6@500×500钢筋网以防收缩开裂，形成平整坚固的基层，为防水层提供可靠的铺贴面。",
  },
  {
    objectName: "1：3水泥砂浆找平层_15mm",
    name: "找平层（水泥砂浆）",
    order: 3,
    thickness: "15mm",
    material: "1:3水泥砂浆",
    description:
      "在细石混凝土层之上抹1:3水泥砂浆作精找平，表面压实抹光，进一步提高基层平整度，保证防水卷材铺贴密实、不空鼓。",
  },
  {
    objectName: "高聚物改性沥青防水卷材_3mm（或防水涂膜≥2mm",
    name: "防水层",
    order: 4,
    thickness: "卷材3mm 或 涂膜≥2mm",
    material: "高聚物改性沥青防水卷材 / 防水涂膜",
    description:
      "坡屋面防水的核心层次，铺贴于找平层之上、顺水条之下。可采用高聚物改性沥青防水卷材厚3mm，或防水涂膜厚≥2mm；卷材应顺水流方向搭接，搭接宽度不小于100mm，将雨水与结构层完全隔离。",
  },
  {
    objectName: "顺水条（35×25h，中距500）",
    name: "顺水条",
    order: 5,
    thickness: "35×25h mm，中距500mm",
    material: "防腐木条",
    description:
      "沿坡向布置的防腐木顺水条，断面35×25mm（h为高度方向），中距500mm，钉固于防水层之上。既压紧保护卷材，又在其间形成空气流通层，加速雨水蒸发、防止瓦下积水。",
  },
  {
    objectName: "挂瓦条（30×25，中距按瓦材规格）",
    name: "挂瓦条",
    order: 6,
    thickness: "30×25mm，中距按瓦材规格",
    material: "防腐木条",
    description:
      "垂直于顺水条布置的防腐木挂瓦条，断面30×25mm，直接承接瓦材，间距按瓦材规格确定。挂瓦条必须平直、牢固，与顺水条连接可靠，保证块瓦挂接稳固、不松动。",
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
  return woodBattenTileRoofLayers.find((l) => l.objectName === objectName);
}
