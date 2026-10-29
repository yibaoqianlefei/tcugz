export interface LayerInfo {
  objectName: string;
  name: string;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 檐沟外排水构造 — 屋顶檐沟有组织排水节点，6类构件。
 * 檐沟承接屋面雨水，经排水口汇入落水管，实现有组织外排水。
 */
export const eavesGutterLayers: LayerInfo[] = [
  {
    objectName: "屋面顶",
    name: "屋面顶",
    thickness: "屋面板厚度未标注",
    material: "屋面板及上部构造（材料参数须核查）",
    description:
      "檐沟内侧的屋面构造，观察来水如何到达沟边。配图未标注屋面坡度、板厚或混凝土强度；实际找坡、表层防水及结构支承需结合完整设计核查，不从局部图规定统一坡度。",
  },
  {
    objectName: "檐沟",
    name: "檐沟",
    thickness: "截面按配图识读，排水尺寸需设计核查",
    material: "沟体（具体材料与防水做法须核查）",
    description:
      "承接屋面来水，并沿沟内低点将水导向排水口。配图标出局部截面尺寸，未给出沟底纵坡或材料强度；纵坡、过水断面、连续防水与溢流安排应按汇水及系统条件核查，不能套用统一坡度或砂浆做法。",
  },
  {
    objectName: "檐沟分水",
    name: "檐沟分水",
    thickness: "—",
    material: "同檐沟材质",
    description:
      "用于辨认沟内分水位置及两侧可能的排水方向。分水线不表示汇水面积或流量必然等分，还需结合屋面分区、沟底标高与实际出口检查。",
  },
  {
    objectName: "排水口",
    name: "排水口",
    thickness: "口径与壁厚未标注",
    material: "排水构件（具体材质须核查）",
    description:
      "沟内来水进入下游管路的位置。需核对实际低点、过水断面、连接和清理条件；本配图未给出口径、雨水斗或滤网规格，不能据开口外观确定排水能力或推定不会堵塞。",
  },
  {
    objectName: "墙体",
    name: "墙体",
    thickness: "墙厚未标注",
    material: "墙体（具体材料须核查）",
    description:
      "位于屋面与檐沟下部的墙体，帮助定位上部构件的支承边界。实际受力、材料及沟体与主体的连接需按结构资料核查；模型没有完整预埋件或托架时，不自行补定固定方式。",
  },
  {
    objectName: "圈梁",
    name: "圈梁",
    thickness: "截面尺寸未标注",
    material: "墙顶联系构件（材料参数须核查）",
    description:
      "按原对象名辨认为圈梁，用于观察墙顶联系及屋面、沟体的相对支承位置。其连续范围、截面、配筋和连接需完整结构资料，不能由局部实体推定荷载均匀分配或整体刚度已满足。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return eavesGutterLayers.find((l) => l.objectName === objectName);
}
