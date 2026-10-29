/**
 * Steel batten block-tile roof (钢挂瓦条块瓦屋面) — layer data mapping.
 * Maps GLB mesh objectName (canonical Blender export names) → construction knowledge.
 *
 * Load path (bottom → top): 钢筋混凝土屋面板 → C15找平层 → 水泥砂浆找平层
 *   → 防水卷材 → 顺水条 → 挂瓦条 → 块瓦
 */

export interface LayerInfo {
  objectName: string;   // matches canonical GLB mesh name
  name: string;         // Chinese display name
  order: number;        // construction layer order (1=bottom → N=top)
  thickness: string;    // e.g. "3mm"
  material: string;     // material description
  description: string;  // teaching content
}

export const steelBattenTileRoofLayers: LayerInfo[] = [
  {
    objectName: "钢筋混凝土屋面板",
    name: "结构层",
    order: 1,
    thickness: "—",
    material: "钢筋混凝土屋面板",
    description:
      "承接上部构造相关作用的结构板，并经实际支承传入主体。模型未提供完整支座、配筋和抗风连接，不能由层次示意推定其承载或稳定已满足。",
  },
  {
    objectName: "C15细石混凝土找平层_35mm",
    name: "找平层（细石混凝土）",
    order: 2,
    thickness: "35mm",
    material: "C15细石混凝土",
    description:
      "本层位于结构板与水泥砂浆层之间，C15及35mm来自原对象名。其找平、找坡或其他设计任务需结合剖面标高和原说明核查；不能由对象名称证明整体坡度或卷材粘结质量。",
  },
  {
    objectName: "1：3_水泥砂浆找平层_15mm",
    name: "找平层（水泥砂浆）",
    order: 3,
    thickness: "15mm",
    material: "1:3水泥砂浆",
    description:
      "位于细石混凝土层之上、防水层之下，1:3及15mm来自原对象名。用于识别防水基层位置；实际平整、强度、含水和材料相容条件仍需按所选卷材系统检验。",
  },
  {
    objectName: "高聚物改性沥青防水卷材_3mm",
    name: "防水层",
    order: 4,
    thickness: "3mm",
    material: "高聚物改性沥青防水卷材",
    description:
      "位于找平层之上、顺水条之下，3mm来自原对象名。防水层需要在搭接、转折、收头及固定穿透处保持相容的阻水连接；搭接宽度和工法须依据材料、系统及适用要求确定，此处不提供通用数值或不渗漏保证。",
  },
  {
    objectName: "顺水条_-25×5，中距600",
    name: "顺水条",
    order: 5,
    thickness: "-25×5mm，中距600mm",
    material: "钢条（原对象名记录为-25×5）",
    description:
      "沿坡向布置并承接挂瓦条的条材，-25×5及中距600来自原对象名，不能推广为统一规格。条间空隙可用于组织瓦下排水与通风，但需核查进出口、基层固定及防水穿透处理，不能由空隙外观推定已经通风或不积水。",
  },
  {
    objectName: "挂瓦条_L30×4，中距按瓦材规格",
    name: "挂瓦条",
    order: 6,
    thickness: "L30×4mm，中距按瓦材规格",
    material: "钢条（原对象名记录为L30×4）",
    description:
      "垂直于顺水条布置并承接块瓦，L30×4来自原对象名，间距需与实际瓦型协调。抗风固定、条材连接和防腐处理需按完整体系核查；模型中的相接位置不证明连接承载力。",
  },
  {
    objectName: "块瓦",
    name: "块瓦面层",
    order: 7,
    thickness: "按瓦材规格",
    material: "块瓦（具体品种须核查）",
    description:
      "最外侧搭接覆盖层，通过挂瓦条及连接组织固定和排雨。块瓦不能单独代表完整防水或保温系统；瓦下防水、通风、搭接和抗风固定需共同检查，具体搭接及间距按产品和设计条件确定。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return steelBattenTileRoofLayers.find((l) => l.objectName === objectName);
}
