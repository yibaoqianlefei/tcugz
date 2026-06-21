/**
 * Roof drainage node — layer data mapping.
 * Maps GLB mesh objectName → construction knowledge.
 */
export interface LayerInfo {
  objectName: string;   // matches GLB mesh.name
  name: string;         // Chinese display name
  thickness: string;    // e.g. "40mm"
  material: string;     // material description
  description: string;  // teaching content
}

export const roofDrainageLayers: LayerInfo[] = [
  {
    objectName: "01",
    name: "保护层",
    thickness: "40mm",
    material: "细石混凝土",
    description: "保护防水层免受紫外线老化和机械损伤，上人屋面可兼作使用面层。",
  },
  {
    objectName: "02",
    name: "防水层",
    thickness: "10mm",
    material: "SBS改性沥青防水卷材",
    description: "屋面防水核心层，防止雨水渗入结构。在女儿墙、管道根部需做附加层，上返高度不小于250mm。",
  },
  {
    objectName: "03",
    name: "找平层+保温层+找坡层+结构层",
    thickness: "20~150mm",
    material: "砂浆/XPS/轻集料/钢筋混凝土",
    description: "找平层为防水层提供平整基层；保温层错缝铺设避免热桥；找坡层向落水口方向找坡2%；结构层承受全部荷载。",
  },
];

/** Look up layer info by GLB object name */
export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return roofDrainageLayers.find((l) => l.objectName === objectName);
}
