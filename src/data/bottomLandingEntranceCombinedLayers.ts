export interface LayerInfo {
  objectName: string;
  name: string;
  order: number;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 底层中间平台下作出入口（底层长短跑并局部降低地坪）— 楼梯底层平台出入口构造。
 * 综合两种处理方式：既将底层第一跑加长（长短跑）抬高中间平台，
 * 又适当降低平台下地坪标高，两者叠加共同满足平台下净高（≥2000mm），
 * 兼有两种方法的优点并弱化各自缺点，在工程中应用最为广泛。
 */
export const bottomLandingEntranceCombinedLayers: LayerInfo[] = [
  {
    objectName: "局部降低地坪",
    name: "局部降低地坪",
    order: 1,
    thickness: "高差 1~2 级踏步",
    material: "地坪 / 垫层",
    description:
      "中间平台下局部降低的地坪标高，与长短跑配合使用。通过降低地坪获得一部分净空，使第一跑无需过度加长；降低后的地坪应高于室外地坪约100~150mm（至少50mm），防止雨水内溢。",
  },
  {
    objectName: "下踏步段",
    name: "下踏步段（室内台阶）",
    order: 2,
    thickness: "—",
    material: "钢筋混凝土 / 石材",
    description:
      "由常规地面标高下降到局部降低地坪的踏步段，与室外台阶统筹内移布置，保证行人从出入口顺畅下至降低地坪后起步上梯。",
  },
  {
    objectName: "出入口",
    name: "出入口（门洞）",
    order: 3,
    thickness: "净高 ≥2000mm",
    material: "门 / 洞口",
    description:
      "位于中间平台下的通道出入口。净高验算 d = d₁ + d₂ − d₃ ≥ 2000mm：d₁ 为第一跑垂直投影高度，d₂ 为室内外高差利用量，d₃ 为平台梁截面高度。长短跑与降地坪叠加使净高更容易满足。",
  },
  {
    objectName: "长跑梯段",
    name: "下梯段（长跑）",
    order: 4,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "底层第一跑，踏步级数增多（长跑）。级数 n₁ 由平台下所需净高反算确定，因同时降低地坪，第一跑加长量可减小，梯段进深占用相应减少。",
  },
  {
    objectName: "中间平台",
    name: "中间平台",
    order: 5,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "位于长短跑两个梯段之间的休息平台，标高相对抬高（第一跑加长）并与降低地坪共同保证平台下净高≥2000mm。平台宽度不小于梯段宽度。",
  },
  {
    objectName: "短跑梯段",
    name: "上梯段（短跑）",
    order: 6,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "底层第二跑，踏步级数较少（短跑），n₂ = N − n₁。因级数减少，梯段多为折板（折梁）形式；需验算第二跑与上层平台的净高（≥2200mm）。",
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
  return bottomLandingEntranceCombinedLayers.find((l) => l.objectName === objectName);
}
