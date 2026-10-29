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
      "底层楼梯起步处的完成地面。平台下通道的净高，应从通行范围内的完成地面量至上方最低障碍物底面；梯段上的净高则需另按踏步前缘及通行范围核查，两者不能混用量法。",
  },
  {
    objectName: "出入口",
    name: "出入口（门洞）",
    order: 2,
    thickness: "净高按通行部位核查",
    material: "门 / 洞口",
    description:
      "本方案通过抬高中间平台，为平台下通行空间争取净空。配图在指定测量位置标有≥2200mm，这是该教学图的标注；门洞、平台下通道与梯段净高仍需按各自部位及建筑用途分别核查，不能仅凭此图判断疏散合规。",
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
      "位于长短跑两个梯段之间，通过增加第一跑上升高度而抬高标高。检查平台下净高时，应计入平台梁、装修及其他下挂障碍物；平台的有效宽度与转向空间也需同时核查。",
  },
  {
    objectName: "短跑梯段",
    name: "上梯段（短跑）",
    order: 5,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "底层第二跑，自中间平台上至楼层平台；在总级数N不变的比较中，级数n₂=N−n₁。第一跑加长后还需检查第二跑的踏步分配、支承关系及上方障碍物，级数变化本身不能决定采用哪一种结构形式。",
  },
  {
    objectName: "楼层平台",
    name: "楼层平台",
    order: 6,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "与楼层地面相连的平台，衔接第二跑和该层交通空间。分别检查平台上的有效通行空间、平台下通道以及相邻梯段的净高，不能把某一处的图示尺寸作为所有部位的统一要求。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return bottomLandingEntranceLayers.find((l) => l.objectName === objectName);
}
