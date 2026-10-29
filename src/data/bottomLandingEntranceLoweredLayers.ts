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
 * 用于比较地面降低对平台下净空与入口高差的影响，适用净高需另行核查。
 */
export const bottomLandingEntranceLoweredLayers: LayerInfo[] = [
  {
    objectName: "局部降低地坪",
    name: "局部降低地坪",
    order: 1,
    thickness: "高差按标高设计确定",
    material: "地坪 / 垫层",
    description:
      "通过降低平台下通行地面的标高增加净空，而不是抬高中间平台。需同时检查它与室外地面、室内地面的高差及排水条件；不能仅用一个固定高差判断防倒灌或通行是否满足要求。",
  },
  {
    objectName: "下踏步段",
    name: "下踏步段（室内台阶）",
    order: 2,
    thickness: "—",
    material: "钢筋混凝土 / 石材",
    description:
      "连接局部降低地面与常规室内地面的踏步段。观察新增踏步与入口、楼梯起步的先后关系，并分别核查通行安全和无障碍路线。",
  },
  {
    objectName: "出入口",
    name: "出入口（门洞）",
    order: 3,
    thickness: "净高按通行部位核查",
    material: "门 / 洞口",
    description:
      "平台下通道的净高应从通行范围内的完成地面量至上方最低障碍物底面，不能套用梯段踏步前缘的量法。配图在指定位置标有≥2200mm，属于该教学图示意；具体入口、通道及梯段应按各自适用要求核查。",
  },
  {
    objectName: "下梯段",
    name: "下梯段（第一跑）",
    order: 4,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "底层第一跑，衔接楼梯起步位置与中间平台。本方案比较中梯段仍按等跑组织；平台下通行地面降低，不等于第一跑的起步标高也随之降低，应对照图中的踏步和标高分别辨认。",
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
      "底层第二跑，自中间平台上至楼层平台。配图以等跑形式比较空间组织，不表示构件已具备相同截面、配筋或预制条件。",
  },
  {
    objectName: "楼层平台",
    name: "楼层平台",
    order: 7,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "与楼层地面相连，衔接梯段与该层交通空间。平台上的有效通行空间、平台下通道以及相邻梯段净高应分别核查。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return bottomLandingEntranceLoweredLayers.find((l) => l.objectName === objectName);
}
