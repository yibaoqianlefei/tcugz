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
    objectName: "保护层",
    name: "保护层",
    thickness: "40mm",
    material: "细石混凝土/防滑地砖",
    description: "保护防水层免受紫外线老化和机械损伤，上人屋面可兼作使用面层。保护层应设分格缝，间距不宜大于6m。",
  },
  {
    objectName: "防水层",
    name: "防水层",
    thickness: "10mm",
    material: "SBS改性沥青防水卷材",
    description: "屋面防水核心层，防止雨水渗入结构。通常采用两层或三层铺设以确保抗渗性能。在女儿墙、管道根部需做附加层。",
  },
  {
    objectName: "找平层",
    name: "找平层",
    thickness: "20mm",
    material: "1:3水泥砂浆",
    description: "为防水层提供平整、坚固的基层，确保卷材铺设无空鼓。厚度20mm，表面应平整、光洁。",
  },
  {
    objectName: "保温层",
    name: "保温层",
    thickness: "100mm",
    material: "挤塑聚苯板（XPS）",
    description: "抗压强度高、吸水率低，适合倒置式屋面置于防水层之上。应错缝铺设，避免热桥。导热系数≤0.030W/(m·K)。",
  },
  {
    objectName: "找坡层",
    name: "找坡层",
    thickness: "30~100mm",
    material: "轻集料混凝土",
    description: "向落水口方向找坡（通常2%），形成排水坡度。最薄处30mm，天沟、檐沟纵坡不小于1%。",
  },
  {
    objectName: "结构层",
    name: "结构层",
    thickness: "150mm",
    material: "钢筋混凝土屋面板",
    description: "承受屋面全部荷载并传递给梁柱。厚度150mm，混凝土强度不低于C25，钢筋保护层厚度满足规范要求。",
  },
];

/** Look up layer info by GLB object name */
export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return roofDrainageLayers.find((l) => l.objectName === objectName);
}
