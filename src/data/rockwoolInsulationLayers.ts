export interface LayerInfo {
  objectName: string;
  name: string;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 粘贴岩棉保温板外保温示例，按配套原图识别7类构件。
 * 图示材料名称不等于完整系统的热工或防火性能证明。
 */
export const rockwoolInsulationLayers: LayerInfo[] = [
  {
    objectName: "柔性耐水腻子，刷外墙涂料",
    name: "饰面层",
    thickness: "腻子及涂料厚度未标注",
    material: "柔性耐水腻子 + 外墙涂料",
    description:
      "最外层装饰保护层。柔性腻子与涂料配套使用，提供装饰效果的同时保护基层不受紫外线侵蚀。",
  },
  {
    objectName: "5厚抹面胶浆，内置160级耐碱玻纤网格布",
    name: "抹面层",
    thickness: "5mm",
    material: "抹面胶浆 + 160级耐碱玻纤网格布",
    description:
      "图示为岩棉板外侧5厚抹面胶浆，内置160级耐碱玻纤网格布，用于增强与保护。网布的具体产品指标、埋置和搭接要求应按配套系统资料核查，不由图上的级别名称直接推定。",
  },
  {
    objectName: "2厚聚合物水泥防水涂料",
    name: "防水层",
    thickness: "2mm",
    material: "聚合物水泥防水涂料（JS防水涂料）",
    description:
      "按本配图，此2厚涂料层位于水泥砂浆找平层外侧、岩棉板内侧，不能误读为岩棉与外侧抹面之间的层。材料与粘贴界面是否相容、如何施工，应按所选系统核查。",
  },
  {
    objectName: "锚栓",
    name: "锚栓",
    thickness: "—",
    material: "锚栓，具体类别按配套系统选用",
    description:
      "穿过保温板并与基层连接的机械固定件。规格、数量、有效锚固深度与布置需结合基层、风作用、系统及试验依据确定，不能由此图推导统一的每平方米数量。",
  },
  {
    objectName: "粘贴43厚度岩棉防火保温板",
    name: "岩棉防火保温板",
    thickness: "43mm",
    material: "岩棉保温板，性能以产品与系统依据为准",
    description:
      "图示43厚岩棉保温板。厚度只对应本示例，导热系数、燃烧性能、粘贴与固定要求应查产品和配套系统资料；不能据材料名称宣称整面外墙满足防火或节能要求。",
  },
  {
    objectName: "20厚1：3水泥砂浆找平层",
    name: "找平层",
    thickness: "20mm",
    material: "1:3水泥砂浆",
    description:
      "图示位于基层墙体外侧的20厚1:3水泥砂浆找平层，外接2厚聚合物水泥防水涂料。厚度与配比为该图示例条件，基层处理及平整度按配套系统要求核查。",
  },
  {
    objectName: "基层墙体",
    name: "基层墙体",
    thickness: "墙厚未标注",
    material: "基层墙体，具体材料按设计确定",
    description:
      "外保温系统的支撑结构。粘贴保温板前基层应平整、清洁、干燥，施工前应清除表面浮灰和油污。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return rockwoolInsulationLayers.find((l) => l.objectName === objectName);
}
