export interface LayerInfo {
  objectName: string;
  name: string;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 粘贴岩棉防火保温板外保温 — A级防火岩棉外保温系统，7层构件。
 * 岩棉板兼具保温与防火性能，适用于防火要求较高的建筑。
 */
export const rockwoolInsulationLayers: LayerInfo[] = [
  {
    objectName: "柔性耐水腻子，刷外墙涂料",
    name: "饰面层",
    thickness: "2-3mm（腻子）+ 涂料",
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
      "覆盖在岩棉板外侧的增强保护层。5mm厚抹面胶浆将网格布完全包裹，分散表面应力防止开裂。160级网格布单位面积质量≥160g/m²。",
  },
  {
    objectName: "2厚聚合物水泥防水涂料",
    name: "防水层",
    thickness: "2mm",
    material: "聚合物水泥防水涂料（JS防水涂料）",
    description:
      "岩棉板与抹面层之间的防水屏障。岩棉吸水率较高，必须做好防水防止保温性能下降。涂刷均匀，不得漏涂。",
  },
  {
    objectName: "锚栓",
    name: "锚栓",
    thickness: "—",
    material: "尼龙膨胀锚栓 + 金属钉芯",
    description:
      "机械固定件，穿过保温板锚入基层墙体。岩棉板自重较大，锚栓数量应比EPS系统适当增加，通常每平方米6-8个。",
  },
  {
    objectName: "粘贴43厚度岩棉防火保温板",
    name: "岩棉防火保温板",
    thickness: "43mm",
    material: "岩棉板（A级防火）",
    description:
      "核心保温防火层。岩棉导热系数≤0.040W/(m·K)，燃烧性能A级（不燃材料）。适用于防火隔离带和防火要求较高的外墙外保温。板缝应错缝粘贴，避免通缝。",
  },
  {
    objectName: "20厚1：3水泥砂浆找平层",
    name: "找平层",
    thickness: "20mm",
    material: "1:3水泥砂浆",
    description:
      "基层墙体表面的找平层。20mm厚1:3水泥砂浆，刮平压实，确保基层平整度满足粘贴保温板的要求（偏差≤4mm/2m）。",
  },
  {
    objectName: "基层墙体",
    name: "基层墙体",
    thickness: "200-300mm",
    material: "钢筋混凝土/砖砌体",
    description:
      "外保温系统的支撑结构。粘贴保温板前基层应平整、清洁、干燥，施工前应清除表面浮灰和油污。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return rockwoolInsulationLayers.find((l) => l.objectName === objectName);
}
