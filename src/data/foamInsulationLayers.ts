export interface LayerInfo {
  objectName: string;
  name: string;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 粘贴泡沫塑料保温板外保温 — ETICS/EIFS 外墙外保温系统，7层构件。
 * 将泡沫塑料保温板用胶粘剂粘贴于基层墙体，辅以锚栓加固，外侧做抹面层和饰面层。
 */
export const foamInsulationLayers: LayerInfo[] = [
  {
    objectName: "涂料或面砖饰面",
    name: "饰面层",
    thickness: "2-5mm（涂料）/ 5-10mm（面砖）",
    material: "外墙涂料或面砖",
    description:
      "最外层装饰和保护层。涂料饰面施工简便、自重轻；面砖饰面耐久性好但自重较大，锚栓数量需适当增加。",
  },
  {
    objectName: "抹面层",
    name: "抹面层",
    thickness: "3-5mm",
    material: "聚合物抗裂砂浆",
    description:
      "覆盖在玻纤网外侧的保护层，将网格布完全包裹。聚合物砂浆具有良好柔韧性和防水性，防止面层开裂。",
  },
  {
    objectName: "玻纤网或钢丝网",
    name: "增强网",
    thickness: "—",
    material: "耐碱玻纤网格布（涂料饰面）/ 热镀锌钢丝网（面砖饰面）",
    description:
      "嵌在抹面层中的增强材料。涂料饰面用耐碱玻纤网（≥160g/m²），面砖饰面用钢丝网。分散抹面层收缩应力，防止开裂。",
  },
  {
    objectName: "锚栓加固",
    name: "锚栓",
    thickness: "—",
    material: "尼龙膨胀锚栓 + 金属钉芯",
    description:
      "辅助固定保温板的机械连接件，穿过保温板锚入基层墙体。间距由风荷载计算确定，通常每平方米4-6个，阳角及洞口周边加密。",
  },
  {
    objectName: "保温板",
    name: "泡沫塑料保温板",
    thickness: "30-100mm",
    material: "EPS板（膨胀聚苯板）/ XPS板（挤塑聚苯板）",
    description:
      "核心保温层。EPS板导热系数≤0.039W/(m·K)，密度18-22kg/m³；XPS板导热系数≤0.030W/(m·K)，强度更高。板缝应错缝粘贴。",
  },
  {
    objectName: "胶粘剂",
    name: "胶粘剂",
    thickness: "3-5mm",
    material: "聚合物粘结砂浆",
    description:
      "将保温板粘贴于基层墙体的粘结材料。采用点框法或条粘法施工，有效粘贴面积≥40%。不得空粘。",
  },
  {
    objectName: "基层墙体",
    name: "基层墙体",
    thickness: "200-300mm",
    material: "钢筋混凝土/砖砌体",
    description:
      "外保温系统的支撑结构。粘贴保温板前基层应平整、清洁、干燥，平整度偏差≤4mm/2m。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return foamInsulationLayers.find((l) => l.objectName === objectName);
}
