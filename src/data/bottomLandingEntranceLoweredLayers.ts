export interface LayerInfo {
  objectName: string;
  name: string;
  order: number;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 底层中间平台下作出入口（局部降低地坪）— 楼梯底层平台出入口构造。
 * 保持底层两个梯段等跑不变，将中间平台下的地面标高局部降低（将室外台阶部分内移），
 * 使平台下净高满足出入口通行要求（≥2000mm）。
 */
export const bottomLandingEntranceLoweredLayers: LayerInfo[] = [
  {
    objectName: "局部降低地坪",
    name: "局部降低地坪",
    order: 1,
    thickness: "高差 1~2 级踏步",
    material: "地坪 / 垫层",
    description:
      "中间平台下局部降低的地坪标高，是本节点的核心处理。保持梯段等跑不变，通过降低平台下地面标高获得净空；降低后的地坪应高于室外地坪约100~150mm（至少50mm），防止雨水内溢。",
  },
  {
    objectName: "下踏步段",
    name: "下踏步段（室内台阶）",
    order: 2,
    thickness: "—",
    material: "钢筋混凝土 / 石材",
    description:
      "由常规地面标高下降到局部降低地坪的踏步段。通常将室外台阶部分内移，与室外台阶统筹布置，保证行人从出入口进入后顺畅下至降低地坪。",
  },
  {
    objectName: "出入口",
    name: "出入口（门洞）",
    order: 3,
    thickness: "净高 ≥2000mm",
    material: "门 / 洞口",
    description:
      "位于中间平台下的通道出入口。局部降低平台下地坪后，净高按踏步前缘至平台梁底面计算，应满足≥2000mm的通行与疏散要求。",
  },
  {
    objectName: "下梯段",
    name: "下梯段（第一跑）",
    order: 4,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "底层第一跑，保持等跑梯段不变，自局部降低后的地坪起步向上到达中间平台。因起步面降低，平台下净空相应增大。",
  },
  {
    objectName: "中间平台",
    name: "中间平台",
    order: 5,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "位于两个等跑梯段之间的休息平台，标高保持常规高度不变（与长短跑法不同，此方法不抬高平台，而是降低平台下地面）。",
  },
  {
    objectName: "上梯段",
    name: "上梯段（第二跑）",
    order: 6,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "底层第二跑，等跑梯段，自中间平台上至楼层平台。踏步级数与第一跑相同，保持构件统一、便于工业化制作与施工。",
  },
  {
    objectName: "楼层平台",
    name: "楼层平台",
    order: 7,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "与一层楼面相连的平台，是楼梯与楼层的衔接处。宽度不小于梯段宽度，底面净高不应小于2200mm。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return bottomLandingEntranceLoweredLayers.find((l) => l.objectName === objectName);
}
