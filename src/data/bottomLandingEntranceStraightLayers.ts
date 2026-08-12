export interface LayerInfo {
  objectName: string;
  name: string;
  order: number;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 底层中间平台下作出入口（底层直跑）— 楼梯底层平台出入口构造。
 * 底层采用直行单跑楼梯，从底层地坪直达楼层，中间不设休息平台，
 * 从根上避免"中间平台下空间不足"的问题；入口设于梯段一侧，
 * 入口处雨篷底面标高应保证净高≥2m。常用于南方地区住宅建筑。
 */
export const bottomLandingEntranceStraightLayers: LayerInfo[] = [
  {
    objectName: "基础",
    name: "基础 / 地基",
    order: 1,
    thickness: "—",
    material: "混凝土基础",
    description:
      "直跑梯段底部的基础支承，支承梯段与平台的自重及使用荷载，埋置于底层地坪以下，保证梯段端部稳固。",
  },
  {
    objectName: "底层地坪",
    name: "底层地坪",
    order: 2,
    thickness: "—",
    material: "地坪 / 面层",
    description:
      "底层楼梯起步处的地坪。直跑楼梯自底层地坪直接起步上行，无需在平台下设出入口，故不要求抬高平台或降低地坪。",
  },
  {
    objectName: "出入口",
    name: "出入口（门洞 / 雨篷）",
    order: 3,
    thickness: "净高 ≥2000mm",
    material: "门 / 雨篷",
    description:
      "位于直跑梯段一侧的入口。因底层不设中间平台，入口空间不受平台梁遮挡；需注意入口处雨篷底面的标高位置，保证净空高度在2m以上。",
  },
  {
    objectName: "直跑梯段",
    name: "直跑梯段（直行单跑）",
    order: 4,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "直行单跑梯段，自底层地坪直达楼层，中间不设休息平台，全部踏步级数 N 在一跑内完成。梯段较长，适用于底层进深较大的情况，常见于南方地区住宅建筑。",
  },
  {
    objectName: "楼层平台",
    name: "楼层平台",
    order: 5,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "与一层楼面相连的平台，是楼梯与楼层的衔接处。宽度不小于梯段宽度，底面净高不应小于2200mm。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return bottomLandingEntranceStraightLayers.find((l) => l.objectName === objectName);
}
