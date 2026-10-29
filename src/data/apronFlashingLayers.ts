export interface LayerInfo {
  objectName: string;
  name: string;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 细石混凝土散水构造 — 外墙根部散水节点，9层构造。
 * 散水环绕建筑外墙根部，向外找坡快速排走雨水，保护地基。
 */
export const apronFlashingLayers: LayerInfo[] = [
  {
    objectName: "60厚C20细石混凝土面层",
    name: "细石混凝土面层",
    thickness: "图示60mm",
    material: "图示C20细石混凝土",
    description:
      "配图标注60mm厚C20细石混凝土，并标出撒1:1水泥砂子压实赶光、向外坡3%～5%的实例做法。这里用于辨认表面排水方向；材料、厚度和坡度不是所有散水的统一要求。",
  },
  {
    objectName: "饰面层",
    name: "饰面层",
    thickness: "配图未标注",
    material: "外墙饰面材料",
    description:
      "外墙饰面层，延伸至散水顶部收口处，与散水混凝土之间留有变形缝并用密封膏嵌填。",
  },
  {
    objectName: "防水层",
    name: "防水层",
    thickness: "配图未标注",
    material: "防水材料类型未标注",
    description:
      "配图在墙根标注的防水层，用于观察墙脚防水与散水接缝的位置关系。其材料、厚度及完整的上翻、收头和地下连接范围未在本图交代，不能仅凭局部轮廓判定已形成封闭防水体系。",
  },
  {
    objectName: "钢筋混凝土墙体",
    name: "钢筋混凝土墙体",
    thickness: "配图未标注",
    material: "钢筋混凝土（模型原名，强度未标注）",
    description:
      "主体结构墙体，承受上部荷载并传递至基础。外墙根部与散水相接处需做防水处理。",
  },
  {
    objectName: "聚乙烯泡沫塑料",
    name: "聚乙烯泡沫塑料",
    thickness: "图示接缝宽20mm",
    material: "图示聚乙烯泡沫塑料",
    description:
      "配图中墙脚与散水之间的接缝填充材料，缝宽标为20mm。填充与上部密封共同处理接缝，允许一定相对变形；不能据此保证吸收任意差异沉降或避免所有裂缝。",
  },
  {
    objectName: "密封膏嵌缝",
    name: "密封膏嵌缝",
    thickness: "密封深度未标注",
    material: "密封膏（类型未标注）",
    description:
      "位于散水与墙脚接缝顶部，与下部填充材料区分表达。密封材料的相容性、可适应位移和截面尺寸需按选定系统核查，本图未指定产品或底涂工序。",
  },
  {
    objectName: "保温层",
    name: "保温层",
    thickness: "配图未标注",
    material: "保温材料类型未标注",
    description:
      "墙体外侧的保温层，教学重点是墙脚处保温与防水、饰面的连续关系。具体材料和厚度未标注，不能据此断言它能阻止土壤冻胀或完全消除热桥。",
  },
  {
    objectName: "150厚粒径10~40卵石灌M2.5混合砂浆（或150厚3：7",
    name: "卵石灌浆垫层",
    thickness: "图示150mm",
    material: "卵石+M2.5混合砂浆（或3:7灰土）",
    description:
      "配图列出150mm厚、粒径10～40mm卵石灌M2.5混合砂浆，或150mm厚3:7灰土两种实例选项，用于观察面层的下部支承。选项是配图说明，不表示两者在任意地基和水环境下均可互换。",
  },
  {
    objectName: "素土夯实，向外坡3%~5%",
    name: "素土夯实",
    thickness: "处理厚度未标注",
    material: "素土",
    description:
      "配图注明素土夯实、向外坡3%～5%，用于表达基层与面层共同向外组织排水；图中并未要求基层坡度必须大于面层。土层处理厚度和压实指标需按设计确定。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return apronFlashingLayers.find((l) => l.objectName === objectName);
}
