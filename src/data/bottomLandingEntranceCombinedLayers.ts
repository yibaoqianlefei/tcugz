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
 * 又适当降低平台下地坪标高，用于比较两种手段对通行净空和高差组织的影响。
 * 图示尺寸属于教学配图标注，不作为所有建筑用途的统一阈值。
 */
export const bottomLandingEntranceCombinedLayers: LayerInfo[] = [
  {
    objectName: "局部降低地坪",
    name: "局部降低地坪",
    order: 1,
    thickness: "高差按标高设计确定",
    material: "地坪 / 垫层",
    description:
      "中间平台下局部降低的完成地面，与抬高平台配合争取通行净空。降低地面会改变入口高差和雨水进入的条件，需统筹室外标高、排水、防倒灌及无障碍通行，不能仅按减少踏步级数来确定。",
  },
  {
    objectName: "下踏步段",
    name: "下踏步段（室内台阶）",
    order: 2,
    thickness: "—",
    material: "钢筋混凝土 / 石材",
    description:
      "衔接常规完成地面与局部降低地面的踏步段。应观察新增高差与入口、起步位置的关系，并另行核查通行安全和无障碍路线。",
  },
  {
    objectName: "出入口",
    name: "出入口（门洞）",
    order: 3,
    thickness: "净高按通行部位核查",
    material: "门 / 洞口",
    description:
      "本方案同时抬高平台并降低其下地面。净高应从平台下通行范围内的完成地面量至上方最低障碍物底面；标高差计算还需扣除梁、装修等下挂高度。配图指定位置标有≥2200mm，属于该图示意，不能替代不同通行部位的适用要求。",
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
      "位于长短跑两个梯段之间，标高随第一跑上升高度调整。平台抬高与地面降低共同增加其下空间，但仍需核查最低障碍物、平台有效宽度及相邻梯段净高。",
  },
  {
    objectName: "短跑梯段",
    name: "上梯段（短跑）",
    order: 6,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "底层第二跑，衔接中间平台与楼层平台。在总级数N不变的比较中，级数n₂=N−n₁；仍需检查踏步分配、支承及相邻梯段的通行净高，不能由级数直接推定结构形式。",
  },
  {
    objectName: "楼层平台",
    name: "楼层平台",
    order: 7,
    thickness: "—",
    material: "钢筋混凝土",
    description:
      "与楼层地面相连的平台，是第二跑与该层交通空间的衔接处。平台上的有效通行空间、平台下通道和梯段上的净高应分别核查。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return bottomLandingEntranceCombinedLayers.find((l) => l.objectName === objectName);
}
