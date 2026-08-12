/**
 * Cantilever slab (挑梁搭板) — general layer data.
 * Used as the node's layerConfig for the knowledge panel's layer list.
 * (Multi-variant clicks resolve per-variant componentKnowledge instead.)
 */

export interface LayerInfo {
  objectName: string;
  name: string;
  order: number;
  thickness: string;
  material: string;
  description: string;
}

export const cantileverSlabLayers: LayerInfo[] = [
  {
    objectName: "挑梁",
    name: "挑梁（结构支承）",
    order: 1,
    thickness: "按结构计算",
    material: "钢筋混凝土",
    description:
      "从墙体或主体楼板悬挑出的钢筋混凝土梁，是悬挑板的主要承重构件，承受板面荷载并传递至墙体或柱。根据构型可分为设置边梁、挑梁外露、L形挑梁卡口板三种做法。",
  },
  {
    objectName: "现浇挑板",
    name: "现浇钢筋混凝土板",
    order: 2,
    thickness: "按结构计算",
    material: "钢筋混凝土",
    description:
      "与挑梁整体浇筑的悬挑楼板（挑板），承担使用荷载（人群、家具、防水面层等）并可靠传递给挑梁，板厚由计算确定，悬挑端较薄、根部较厚。",
  },
  {
    objectName: "找平层",
    name: "找平层",
    order: 3,
    thickness: "15~20mm",
    material: "水泥砂浆",
    description:
      "在结构板上抹水泥砂浆找坡找平，形成排水坡度，为防水层提供平整基层。",
  },
  {
    objectName: "防水层",
    name: "防水层",
    order: 4,
    thickness: "按材料",
    material: "防水卷材 / 防水涂膜",
    description:
      "悬挑板（阳台、雨篷等露天部位）的防水关键层次，铺贴于找平层之上，顺排水方向搭接，防止雨水渗入板内与挑梁交接处。",
  },
  {
    objectName: "面层",
    name: "面层 / 保护层",
    order: 5,
    thickness: "20~25mm",
    material: "水泥砂浆 / 面砖",
    description:
      "最外层的保护与装饰面层，兼作防水层的保护层，应分格以避免温度应力开裂，并保证排水顺畅。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return cantileverSlabLayers.find((l) => l.objectName === objectName);
}
