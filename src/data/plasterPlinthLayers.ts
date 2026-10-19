export interface LayerInfo {
  objectName: string;
  name: string;
  order: number;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 抹灰勒脚构造做法 — 外墙根部抹灰勒脚节点，5层构造。
 * 勒脚是外墙接近室外地面的部位，起保护墙体根部、防潮和装饰作用。
 */
export const plasterPlinthLayers: LayerInfo[] = [
  {
    objectName: "室内外回填土",
    name: "回填土",
    order: 1,
    thickness: "分层夯实",
    material: "素土",
    description: "图示室内外地面下的回填土。应按场地及地坪设计处理和压实，图中未规定统一的压实系数，不能据此判断地基承载条件。",
  },
  {
    objectName: "垫层",
    name: "垫层",
    order: 2,
    thickness: "图中未标注",
    material: "垫层，具体材料按设计确定",
    description: "回填土之上的刚性垫层，起找平和传递荷载作用，兼作防潮层基底。",
  },
  {
    objectName: "防潮层",
    name: "防潮层",
    order: 3,
    thickness: "图中未标注",
    material: "防潮材料按设计确定",
    description: "墙脚水平防潮构造用于阻断毛细水上升。应结合室内外完成面、墙脚和地坪防潮连续性确定位置；不能把室内地坪以下60mm等传统经验作为所有项目的通用标高。",
  },
  {
    objectName: "抹灰",
    name: "抹灰层",
    order: 4,
    thickness: "抹灰厚度未标注",
    material: "勒脚抹灰，具体砂浆按设计确定",
    description: "外墙近地部位的抹灰保护层，需协调溅水、耐久与墙脚收口。图中未规定统一高度或配比，不能将700mm等经验值理解为所有勒脚的最低要求。",
  },
  {
    objectName: "墙体",
    name: "墙体",
    order: 5,
    thickness: "墙厚未标注",
    material: "墙体材料按设计确定",
    description: "图示墙脚基层，需协调抹灰、防潮层及室内外地面交接。具体材料与结构身份须查完整图纸，不能仅凭局部墙脚外观判断。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return plasterPlinthLayers.find((l) => l.objectName === objectName);
}
