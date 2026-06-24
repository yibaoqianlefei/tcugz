/**
 * Flat roof node — layer data mapping.
 * Maps GLB mesh objectName (exact Blender export names) → construction knowledge.
 */
export interface LayerInfo {
  objectName: string;   // matches GLB mesh.name exactly
  name: string;         // Chinese display name
  order: number;        // construction layer order (1=bottom → N=top)
  thickness: string;    // e.g. "40mm"
  material: string;     // material description
  description: string;  // teaching content
}

export const flatRoofLayers: LayerInfo[] = [
  {
    objectName: "钢筋混凝土屋面",
    name: "结构层",
    order: 1,
    thickness: "—",
    material: "钢筋混凝土屋面板",
    description: "建筑主体承重结构，承受屋面全部荷载并传递给梁柱。",
  },
  {
    objectName: "60厚聚苯乙烯保温板",
    name: "保温层",
    order: 2,
    thickness: "60mm",
    material: "聚苯乙烯泡沫塑料板",
    description: "屋面保温核心层，聚苯板导热系数低、质轻。应错缝铺设，避免热桥效应。",
  },
  {
    objectName: "1：1：6 水泥、砂子、焦渣、最薄处30厚，找2%坡",
    name: "找坡层",
    order: 3,
    thickness: "最薄处30mm",
    material: "水泥砂子焦渣（1:1:6）",
    description: "向落水口方向找2%坡，形成排水坡度。天沟、檐沟纵坡不小于1%。",
  },
  {
    objectName: "20厚1：3水泥砂浆找平层",
    name: "找平层",
    order: 4,
    thickness: "20mm",
    material: "1:3水泥砂浆",
    description: "为防水层提供平整、坚固的基层，确保卷材铺设无空鼓。",
  },
  {
    objectName: "涂沥青冷底子油一道",
    name: "隔气层（冷底子油）",
    order: 5,
    thickness: "涂刷一道",
    material: "沥青冷底子油",
    description: "涂刷于保温层之下、找平层之上，起到隔绝水汽上渗和增强层间粘结的作用。",
  },
  {
    objectName: "4厚SBS改性沥青卷材防水层",
    name: "防水层",
    order: 6,
    thickness: "4mm",
    material: "SBS改性沥青卷材",
    description: "屋面防水核心层，防止雨水渗入结构。在女儿墙、管道根部需做附加层，上返高度不小于250mm。",
  },
  {
    objectName: "干铺350号沥青卷材一层",
    name: "隔气层（卷材）",
    order: 7,
    thickness: "一层",
    material: "350号沥青卷材",
    description: "干铺于保温层之下作为隔气层，防止室内水蒸气渗透至保温层内结露，保护保温性能。",
  },
  {
    objectName: "40厚细石混凝土毛面",
    name: "保护层",
    order: 8,
    thickness: "40mm",
    material: "细石混凝土毛面",
    description: "保护防水层免受紫外线老化和机械损伤，上人屋面可兼作使用面层。应设分格缝，间距不宜大于6m。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return flatRoofLayers.find((l) => l.objectName === objectName);
}
