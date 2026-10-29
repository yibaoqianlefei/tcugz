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
 * 用于比较改变底层梯段走向对入口空间的影响；仍需核查级数、净高和通行路线。
 */
export const bottomLandingEntranceStraightLayers: LayerInfo[] = [
  {
    objectName: "基础",
    name: "基础",
    order: 1,
    thickness: "—",
    material: "混凝土基础",
    description:
      "直跑梯段下端的基础支承，将端部传来的荷载传给地基。基础与地基是不同对象，具体承载能力及沉降需由地基条件和结构设计核查。",
  },
  {
    objectName: "底层地坪",
    name: "底层地坪",
    order: 2,
    thickness: "—",
    material: "地坪 / 面层",
    description:
      "底层楼梯起步处的完成地面。此图通过改变底层梯段走向组织入口空间；仍需检查起步位置、入口通行路线和上方障碍物。",
  },
  {
    objectName: "出入口",
    name: "出入口（门洞 / 雨篷）",
    order: 3,
    thickness: "净高按通行部位核查",
    material: "门 / 雨篷",
    description:
      "改变底层梯段走向后组织的入口空间。配图在指定测量位置标有≥2200mm，属于该图的示意；需从实际通行面量至上方最低障碍物，并另核查门洞、通道和梯段各自的净高条件。",
  },
  {
    objectName: "直跑梯段",
    name: "直跑梯段（直行单跑）",
    order: 4,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "配图将底层梯段按直行单跑布置，与上部双跑形式形成比较。这会增加所需进深；是否可采用仍需检查层高、踏步级数、休息平台和疏散条件，不能仅因入口处获得空间就判定方案适用。",
  },
  {
    objectName: "楼层平台",
    name: "楼层平台",
    order: 5,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "衔接底层梯段与该层交通空间的平台。有效通行宽度、转向空间以及平台下方和相邻梯段的净高应分别核查。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return bottomLandingEntranceStraightLayers.find((l) => l.objectName === objectName);
}
