/**
 * Mortar-bed block-tile roof (砂浆卧瓦块瓦屋面) — layer data mapping.
 * Maps GLB mesh objectName (canonical Blender export names) → construction knowledge.
 *
 * Load path (bottom → top): 钢筋混凝土屋面板 → 水泥砂浆找平层 → 防水卷材
 *   → 水泥砂浆卧瓦层 → 块瓦
 *
 * 与钢挂瓦条块瓦屋面不同，砂浆卧瓦屋面不设挂瓦条/顺水条，
 * 块瓦在水泥砂浆层上承托；是否参与找坡须结合实际标高与设计说明核查。
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
      "承接上部屋面构造相关作用，并经实际支承传入主体。坡度需结合结构及各层标高识读，不能从示意外形推定找坡工法、支座或承载能力。",
  },
  {
    objectName: "1：3水泥砂浆找平层,厚_15mm",
    name: "找平层（水泥砂浆）",
    order: 2,
    thickness: "15mm",
    material: "1:3水泥砂浆",
    description:
      "位于结构板与防水层之间，1:3及15mm来自原对象名。用于辨认防水基层；实际表面、强度、含水及材料相容条件需按所选系统核查，不能由层名保证无空鼓或不破坏。",
  },
  {
    objectName: "高聚物改性沥青防水卷材，厚_3mm",
    name: "防水层",
    order: 3,
    thickness: "3mm",
    material: "高聚物改性沥青防水卷材",
    description:
      "位于找平层之上、砂浆卧瓦层之下，3mm来自原对象名。防水需在搭接、转折、收头及固定位置连续衔接；具体搭接宽度、工法与上部保护按材料和配套系统核查，不规定统一数值或保证完全隔水。",
  },
  {
    objectName: "1：3水泥砂浆挂瓦层，最薄处_20mm",
    name: "卧瓦层（砂浆挂瓦）",
    order: 4,
    thickness: "最薄处 20mm",
    material: "1:3水泥砂浆",
    description:
      "位于防水层上方并承托块瓦，1:3及最薄处20mm来自原对象名，仅用于本层识读。卧瓦、抗滑和抗风固定以及与下部防水的保护或隔离关系需按设计核查，不能把砂浆粘结当作全部固定措施，也不能由本层名称推定整体找坡。",
  },
  {
    objectName: "块瓦",
    name: "块瓦面层",
    order: 5,
    thickness: "按瓦材规格",
    material: "块瓦（具体品种须核查）",
    description:
      "模型以砂浆卧瓦层承托最外侧搭接覆盖层，用于比较其与挂瓦条体系的差异。瓦材覆盖排雨不能单独证明完整防水或保温；适用坡度、搭接和固定需结合产品、设计与环境核查，不从砂浆外观推定通用适用范围。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return mortarBedTileRoofLayers.find((l) => l.objectName === objectName);
}
