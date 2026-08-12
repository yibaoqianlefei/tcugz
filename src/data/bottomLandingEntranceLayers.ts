export interface LayerInfo {
  objectName: string;
  name: string;
  order: number;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 底层中间平台下作出入口（底层长短跑）— 楼梯底层平台出入口构造。
 * 将底层平行双跑的等跑梯段改为不等跑（长短跑）：起步第一跑为长跑（踏步级数增多），
 * 第二跑为短跑（级数减少），从而抬高中间平台标高，使平台下净高满足出入口通行要求。
 */
export const bottomLandingEntranceLayers: LayerInfo[] = [
  {
    objectName: "底层地坪",
    name: "底层地坪",
    order: 1,
    thickness: "—",
    material: "地坪 / 台阶",
    description:
      "底层楼梯起步处的地坪。平台下的净高按踏步前缘至平台梁底面的垂直距离计算，通行出入口处不应小于2000mm。必要时可结合局部降低地坪来保证净空。",
  },
  {
    objectName: "出入口",
    name: "出入口（门洞）",
    order: 2,
    thickness: "净高 ≥2000mm",
    material: "门 / 洞口",
    description:
      "位于中间平台下的通道出入口，是底层楼梯长短跑处理的目标空间。净高不应小于2000mm，其与顶部平台梁内缘线的水平距离不小于500mm，保证通行与疏散要求。",
  },
  {
    objectName: "长跑梯段",
    name: "下梯段（长跑）",
    order: 3,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "底层第一跑，踏步级数较多（长跑）。自底层地坪起步向上到达中间平台，级数 n₁ 由平台下所需净高反算确定（第一跑垂直投影高度 d₁），从而把中间平台标高抬高。",
  },
  {
    objectName: "中间平台",
    name: "中间平台",
    order: 4,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "位于长短跑两个梯段之间的休息平台，被抬高以满足平台下出入口净高。平台底面（平台梁底面）到出入口地面的净高应≥2000mm；平台宽度不小于梯段宽度。",
  },
  {
    objectName: "短跑梯段",
    name: "上梯段（短跑）",
    order: 5,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "底层第二跑，踏步级数较少（短跑）。自中间平台上至楼层平台，级数 n₂ = N − n₁。因级数减少，梯段多为折板（折梁）形式；需验算第二跑与上层平台的净高。",
  },
  {
    objectName: "楼层平台",
    name: "楼层平台",
    order: 6,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "与一层楼面相连的平台，是楼梯与楼层的衔接处。宽度不小于梯段宽度，底面净高不应小于2200mm，需与第二跑净高共同验算。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return bottomLandingEntranceLayers.find((l) => l.objectName === objectName);
}
