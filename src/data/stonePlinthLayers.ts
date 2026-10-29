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
 * 配图表达石砌墙脚与室内外地面关系，未标注材料强度和构造尺寸。
 */
export const stonePlinthLayers: LayerInfo[] = [
  {
    objectName: "室内外回填土",
    name: "回填土",
    order: 1,
    thickness: "分层夯实",
    material: "回填土（具体土料未标注）",
    description: "室内外地面下的回填土，与墙脚和地面垫层形成位置关系。土料、处理厚度和压实指标需按设计及地基条件确定，此图未给出数值。",
  },
  {
    objectName: "垫层",
    name: "垫层",
    order: 2,
    thickness: "配图未标注",
    material: "具体材料未标注",
    description: "与回填土、地面相接的垫层，用于辨认地面支承层次。配图未明确材料和防潮做法，不能把垫层本身等同于防潮层。",
  },
  {
    objectName: "石砌",
    name: "石砌层",
    order: 3,
    thickness: "配图未标注",
    material: "石砌体（石材与砂浆规格未标注）",
    description: "配图中的石砌墙脚，用于比较其与上部墙体、室内地面和室外地面的衔接。图中未给出勒脚高度、厚度或外坡；散水坡度不能直接套用于竖向石砌勒脚。石材和砂浆的耐久性需按实际环境选定。",
  },
  {
    objectName: "墙体",
    name: "墙体",
    order: 4,
    thickness: "配图未标注",
    material: "具体墙体材料未标注",
    description: "主体结构墙体，根部与石砌勒脚衔接处需做好防水和防潮处理。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return stonePlinthLayers.find((l) => l.objectName === objectName);
}
