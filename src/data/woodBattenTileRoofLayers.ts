/**
 * Wooden-batten block-tile roof (木挂瓦条块瓦屋面) — layer data mapping.
 * Maps GLB mesh objectName (canonical Blender export names) → construction knowledge.
 *
 * 图示层序（下→上）：钢筋混凝土屋面板 → 水泥砂浆找平层 → 防水卷材/防水涂膜
 *   → C15细石混凝土层 → 顺水条 → 挂瓦条 → 块瓦
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
    order: 4,
    thickness: "35mm",
    material: "C15细石混凝土，配φ6@500×500钢筋",
    description:
      "本配图与模型中，此层位于防水层之上、顺水条之下。图示为35厚C15细石混凝土及φ6@500×500钢筋网，用于该示例层次的识读；其功能、固定和配筋应按配套系统设计确认，不能误置于防水层下方。",
  },
  {
    objectName: "1：3水泥砂浆找平层_15mm",
    name: "找平层（水泥砂浆）",
    order: 2,
    thickness: "15mm",
    material: "1:3水泥砂浆",
    description:
      "图示15厚1:3水泥砂浆找平层，位于钢筋混凝土屋面板之上、防水层之下；不是位于上部35厚细石混凝土层之上。图中厚度和配比只对应该示例。",
  },
  {
    objectName: "高聚物改性沥青防水卷材_3mm（或防水涂膜≥2mm",
    name: "防水层",
    order: 3,
    thickness: "卷材3mm 或 涂膜≥2mm",
    material: "高聚物改性沥青防水卷材 / 防水涂膜",
    description:
      "本图防水层位于15厚水泥砂浆找平层与35厚细石混凝土层之间。原图列3厚卷材或相应涂膜的示例条件；选材、厚度、搭接和转折收头应按所选系统核查，不把图中数值当作统一要求。",
  },
  {
    objectName: "顺水条（35×25h，中距500）",
    name: "顺水条",
    order: 5,
    thickness: "35×25h mm，中距500mm",
    material: "防腐木条",
    description:
      "图示沿坡向布置的木顺水条，位于35厚细石混凝土层之上，承接挂瓦条；35×25h与中距500为原图示例。条材间的空间有利于组织瓦下排水与通风，其连续出口、固定和防腐处理仍需按配套节点落实。",
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
      "最外侧搭接覆盖层，通过条材及连接组织固定和排雨。块瓦不能单独代表完整防水或保温系统；瓦下防水、通风、搭接和抗风固定需共同检查，具体搭接及间距按产品和设计条件确定。",
  },
].sort((a, b) => a.order - b.order);

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return woodBattenTileRoofLayers.find((l) => l.objectName === objectName);
}
