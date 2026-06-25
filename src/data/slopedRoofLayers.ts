/**
 * Sloped roof node — layer data mapping.
 * Maps GLB mesh objectName → construction knowledge.
 */
export interface LayerInfo {
  objectName: string;
  aliases?: string[];
  name: string;
  order: number;
  thickness: string;
  material: string;
  description: string;
}

export const slopedRoofLayers: LayerInfo[] = [
  {
    objectName: "彩色水泥瓦",
    name: "屋面瓦",
    order: 9,
    thickness: "—",
    material: "彩色水泥瓦",
    description: "坡屋面最外层覆盖材料，起防水和装饰作用。彩色水泥瓦耐久性好、色彩丰富，适用于各类坡屋面。",
  },
  {
    objectName: "30*30木质挂瓦条并做防腐处理",
    name: "挂瓦条",
    order: 8,
    thickness: "30×30mm",
    material: "杉木/松木（防腐处理）",
    description: "横向固定在顺水条之上，用于挂设屋面瓦。间距根据瓦片规格确定，需做防腐处理以延长使用寿命。",
  },
  {
    objectName: "40*20木质顺水条并做防腐处理",
    name: "顺水条",
    order: 7,
    thickness: "40×20mm",
    material: "杉木/松木（防腐处理）",
    description: "纵向铺设于防水层之上，形成通风间层，同时为挂瓦条提供固定基层。间距不大于500mm。",
  },
  {
    objectName: "40厚细石混凝土捣实压光配双向单层4钢筋，",
    name: "细石混凝土保护层",
    order: 6,
    thickness: "40mm",
    material: "细石混凝土（配双向单层Φ4@150钢筋）",
    description: "40厚细石混凝土捣实压光，内配双向单层Φ4钢筋间距150mm。作为持钉层和刚性保护层，增强屋面整体刚度。",
  },
  {
    objectName: "60厚聚苯乙烯保温板",
    name: "保温层",
    order: 5,
    thickness: "60mm",
    material: "聚苯乙烯泡沫塑料板",
    description: "屋面保温核心层，坡屋面保温板铺设于防水层之上（倒置式），应错缝铺设避免热桥效应。",
  },
  {
    objectName: "4厚SBS防水卷材",
    name: "防水层",
    order: 4,
    thickness: "4mm",
    material: "SBS改性沥青防水卷材",
    description: "屋面防水核心层，坡屋面防水尤为关键。在屋脊、檐口、天沟等节点处需做附加层。",
  },
  {
    objectName: "涂沥青冷底子油一道",
    name: "隔气层",
    order: 3,
    thickness: "涂刷一道",
    material: "沥青冷底子油",
    description: "涂刷于找平层与防水层之间，增强防水卷材与基层的粘结力，同时起到隔绝水汽的作用。",
  },
  {
    objectName: "20厚1：2.5水泥砂浆找平",
    name: "找平层",
    order: 2,
    thickness: "20mm",
    material: "1:2.5水泥砂浆",
    description: "为防水层提供平整、坚固的基层，确保卷材铺设无空鼓。坡屋面找平需注意坡度控制。",
  },
  {
    objectName: "钢筋混凝土屋面板",
    name: "结构层",
    order: 1,
    thickness: "120mm",
    material: "钢筋混凝土屋面板",
    description: "建筑主体承重结构，承受屋面全部荷载并传递给梁柱。坡屋面结构板需考虑坡度带来的水平推力。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return slopedRoofLayers.find(
    (l) =>
      l.objectName === objectName ||
      (l.aliases && l.aliases.includes(objectName)),
  );
}
