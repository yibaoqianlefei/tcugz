export interface LayerInfo {
  objectName: string;
  name: string;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 块石散水构造 — 外墙根部块石铺砌散水节点，9层构造。
 * 所配图用于比较块石面层、粗砂垫层及墙脚接缝，标注值仅属于该图实例。
 */
export const stoneApronLayers: LayerInfo[] = [
  {
    objectName: "饰面层",
    name: "饰面层",
    thickness: "配图未标注",
    material: "外墙饰面材料",
    description:
      "外墙饰面层，延伸至散水顶部收口处，与散水之间以密封膏嵌缝形成弹性防水封口。",
  },
  {
    objectName: "防水层",
    name: "防水层",
    thickness: "配图未标注",
    material: "防水材料类型未标注",
    description:
      "配图在墙根标注的防水层。观察其与散水接缝的相对位置；材料、厚度和完整的上翻、收头及地下连接范围未在此图交代，不能据此判定已形成封闭防水屏障。",
  },
  {
    objectName: "钢筋混凝土墙体",
    name: "钢筋混凝土墙体",
    thickness: "配图未标注",
    material: "钢筋混凝土（模型原名，强度未标注）",
    description:
      "主体结构墙体，承担上部荷载并传至基础。外墙根部与散水相接处的防水处理是构造关键。",
  },
  {
    objectName: "聚乙烯泡沫塑料",
    name: "聚乙烯泡沫塑料",
    thickness: "图示接缝宽20mm",
    material: "图示聚乙烯泡沫塑料",
    description:
      "墙脚与散水之间的接缝填充材料，配图缝宽标为20mm。填充与上部密封共同处理一定相对位移，不能保证吸收任意差异沉降或消除散水裂缝。",
  },
  {
    objectName: "密封膏嵌缝",
    name: "密封膏嵌缝",
    thickness: "密封深度未标注",
    material: "密封膏（类型未标注）",
    description:
      "位于散水与墙脚接缝顶部，与下部填充材料区分表达。具体密封产品、截面尺寸、相容性和施工工序需按选定系统核查，本图未指定底涂要求。",
  },
  {
    objectName: "保温层",
    name: "保温层",
    thickness: "配图未标注",
    material: "保温材料类型未标注",
    description:
      "墙体外侧的保温层，用于辨认墙脚处保温、防水和饰面的衔接。此图未标注材料和厚度，不能据此判定热桥已经消除或土壤冻胀风险已得到控制。",
  },
  {
    objectName: "120厚块石,1：2.5水泥砂浆灌缝",
    name: "块石面层",
    thickness: "图示120mm",
    material: "图示块石、1:2.5水泥砂浆灌缝",
    description:
      "配图标注120mm厚块石、表面平整，采用1:2.5水泥砂浆灌缝，并示意向外坡3%～5%。这些是该图的实例表达；材料耐久性、接缝和排水坡度需结合工程环境另行确定。",
  },
  {
    objectName: "30厚粗砂垫层",
    name: "粗砂垫层",
    thickness: "图示30mm",
    material: "粗砂（粒径未标注）",
    description:
      "配图标注30mm厚粗砂垫层，位于块石面层与素土之间，提供铺砌和找平的过渡层。排水能力还与砂料、下部土层和出水条件有关，不能单凭设置垫层来保证。",
  },
  {
    objectName: "素土夯实，向外坡 3%～5%",
    name: "素土夯实",
    thickness: "处理厚度未标注",
    material: "素土",
    description:
      "配图注明素土夯实、向外坡3%～5%，用于表达散水下部的支承与坡向。处理厚度、压实指标以及渗水能否排离建筑，还需按地基和排水设计核查。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return stoneApronLayers.find((l) => l.objectName === objectName);
}
