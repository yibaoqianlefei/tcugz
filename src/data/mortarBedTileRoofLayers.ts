/**
 * Mortar-bed block-tile roof (砂浆卧瓦块瓦屋面) — layer data mapping.
 * Maps GLB mesh objectName (canonical Blender export names) → construction knowledge.
 *
 * Load path (bottom → top): 钢筋混凝土屋面板 → 水泥砂浆找平层 → 防水卷材
 *   → 水泥砂浆卧瓦层 → 块瓦
 *
 * 与钢挂瓦条块瓦屋面不同，砂浆卧瓦屋面不设挂瓦条/顺水条，
 * 块瓦直接坐浆于水泥砂浆之上，砂浆层兼具找坡与粘结双重作用。
 */

export interface LayerInfo {
  objectName: string;   // matches canonical GLB mesh name
  name: string;         // Chinese display name
  order: number;        // construction layer order (1=bottom → N=top)
  thickness: string;    // e.g. "15mm"
  material: string;     // material description
  description: string;  // teaching content
}

export const mortarBedTileRoofLayers: LayerInfo[] = [
  {
    objectName: "钢筋混凝土屋面板",
    name: "结构层",
    order: 1,
    thickness: "—",
    material: "钢筋混凝土屋面板",
    description:
      "屋面承重结构层，承受瓦屋面全部荷载（瓦、砂浆卧瓦层、防水层及自重、风荷载）并传递给屋架或墙体。坡度由结构找坡或砂浆找坡形成。",
  },
  {
    objectName: "1：3水泥砂浆找平层,厚_15mm",
    name: "找平层（水泥砂浆）",
    order: 2,
    thickness: "15mm",
    material: "1:3水泥砂浆",
    description:
      "在结构层上抹1:3水泥砂浆找平，表面压实抹光，为防水卷材提供平整、坚固的基层，避免卷材铺贴空鼓或受结构不平整影响而破坏。",
  },
  {
    objectName: "高聚物改性沥青防水卷材，厚_3mm",
    name: "防水层",
    order: 3,
    thickness: "3mm",
    material: "高聚物改性沥青防水卷材",
    description:
      "坡屋面防水的核心层次，铺贴于找平层之上、砂浆卧瓦层之下。卷材应顺水流方向搭接，搭接宽度不小于100mm，将雨水与结构层完全隔离。",
  },
  {
    objectName: "1：3水泥砂浆挂瓦层，最薄处_20mm",
    name: "卧瓦层（砂浆挂瓦）",
    order: 4,
    thickness: "最薄处 20mm",
    material: "1:3水泥砂浆",
    description:
      "砂浆卧瓦的核心构造层次：将块瓦直接坐浆于防水层之上，最薄处不小于20mm。水泥砂浆既粘结固定块瓦，又沿坡向找坡形成排水坡度；砂浆须饱满密实，块瓦座浆稳固、不松动。",
  },
  {
    objectName: "块瓦",
    name: "块瓦面层",
    order: 5,
    thickness: "按瓦材规格",
    material: "烧结块瓦 / 水泥瓦",
    description:
      "屋面最外层的块瓦，依靠水泥砂浆卧浆粘结而不设挂瓦条，形成完整防水、防雨、保温、美观的屋面面层。块瓦搭接应顺水流方向，上下搭接长度符合规范，砂浆卧瓦宜用于坡度较缓的屋面。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return mortarBedTileRoofLayers.find((l) => l.objectName === objectName);
}
