export interface LayerInfo {
  objectName: string;
  name: string;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 粘贴泡沫塑料保温板外保温示例，7类构件。
 * 将泡沫塑料保温板用胶粘剂粘贴于基层墙体，辅以锚栓加固，外侧做抹面层和饰面层。
 */
export const foamInsulationLayers: LayerInfo[] = [
  {
    objectName: "涂料或面砖饰面",
    name: "饰面层",
    thickness: "厚度按面层与配套系统确定",
    material: "外墙涂料或面砖",
    description:
      "最外侧的装饰保护构件，原对象名列有涂料或面砖两类面层。两者的自重、连接和基层条件不同，更换面层需核查完整配套系统，不能只增加锚栓数量就认定可行。此处未提供通用厚度或耐久性能依据。",
  },
  {
    objectName: "抹面层",
    name: "抹面层",
    thickness: "厚度按配套系统确定",
    material: "聚合物抗裂砂浆",
    description:
      "位于保温板外侧并与增强网共同工作的抹面构造。材料、厚度、网布埋置和接缝应与所选系统配套；不能由砂浆名称推定不裂、防水或完整外墙性能。",
  },
  {
    objectName: "玻纤网或钢丝网",
    name: "增强网",
    thickness: "—",
    material: "玻纤网或钢丝网（类别与指标须核对系统资料）",
    description:
      "嵌入抹面构造的增强材料，用于分散局部应力并配合抗裂。原对象名未提供面密度、搭接或产品性能依据，不能据此规定统一指标，也不能仅按饰面名称决定网材类别。",
  },
  {
    objectName: "锚栓加固",
    name: "锚栓",
    thickness: "—",
    material: "机械锚固件（具体类别按配套系统确定）",
    description:
      "穿过保温板并与基层连接的机械固定件。规格、数量、布置、有效锚固及其与粘结的分工需结合基层、风作用、系统和试验依据确定；模型中可见数量不构成每平方米用量要求。",
  },
  {
    objectName: "保温板",
    name: "泡沫塑料保温板",
    thickness: "厚度按热工与系统设计确定",
    material: "泡沫塑料保温板（具体品种与性能须核查）",
    description:
      "用于改变墙体实体传热的保温构件。原对象名只标为保温板，未提供产品类别、导热系数、密度、强度和燃烧性能的取值依据；不能推定为某一EPS或XPS产品。板厚、板缝和洞口接续需结合热工分析及配套系统核查。",
  },
  {
    objectName: "胶粘剂",
    name: "胶粘剂",
    thickness: "厚度按配套系统确定",
    material: "聚合物粘结砂浆",
    description:
      "把保温板与基层连接的粘结材料。粘贴方式、有效面积、胶层厚度及施工条件应按所选系统、基层和作用条件核查；此处没有支持统一粘贴比例或工法的来源，不能从示意模型推算。",
  },
  {
    objectName: "基层墙体",
    name: "基层墙体",
    thickness: "墙厚按设计资料核查",
    material: "墙体基层（具体材料与强度须核查）",
    description:
      "承接外保温连接作用的墙体基层。施工前需按配套系统核查基层强度、表面状态、平整及含水条件；无材料与检验依据时，不能规定统一墙厚或平整度阈值。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return foamInsulationLayers.find((l) => l.objectName === objectName);
}
