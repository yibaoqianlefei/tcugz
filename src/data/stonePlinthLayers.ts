export interface LayerInfo {
  objectName: string;
  name: string;
  order: number;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 石砌勒脚构造做法 — 外墙根部石砌勒脚节点，4层构造。
 * 石砌勒脚采用天然石材砌筑，耐久性极好，常见于历史建筑和高端工程。
 */
export const stonePlinthLayers: LayerInfo[] = [
  {
    objectName: "室内外回填土",
    name: "回填土",
    order: 1,
    thickness: "分层夯实",
    material: "素土",
    description: "地基回填土分层夯实，压实系数≥0.94，为上部垫层和石砌勒脚提供稳定基础。",
  },
  {
    objectName: "垫层",
    name: "垫层",
    order: 2,
    thickness: "60-100mm",
    material: "C15混凝土/碎石",
    description: "回填土之上的刚性垫层，起找平和传递荷载作用，兼作防潮层基底。",
  },
  {
    objectName: "石砌",
    name: "石砌层",
    order: 3,
    thickness: "≥120mm",
    material: "天然石材 + 水泥砂浆",
    description: "天然块石或料石砌筑的勒脚面层，耐久抗冻、质感厚重。石材要求质地坚硬，砌筑灰缝饱满，向外坡≥3%。石砌勒脚高度一般不小于700mm。",
  },
  {
    objectName: "墙体",
    name: "墙体",
    order: 4,
    thickness: "240mm",
    material: "砖砌体/混凝土",
    description: "主体结构墙体，根部与石砌勒脚衔接处需做好防水和防潮处理。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return stonePlinthLayers.find((l) => l.objectName === objectName);
}
