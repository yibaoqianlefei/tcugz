export interface LayerInfo {
  objectName: string;
  name: string;
  order: number;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 钢筋混凝土架空台阶 — 室外架空台阶节点，7层构造。
 * 通过踏步、斜梁及端部支承表达架空传力，配图未给出强度等级、构件尺寸或缝宽。
 */
export const rcElevatedStepsLayers: LayerInfo[] = [
  {
    objectName: "素土夯实",
    name: "素土夯实",
    order: 1,
    thickness: "分层夯实",
    material: "素土",
    description: "台阶下部的土层，用于辨认架空踏步与地面的空间关系。地基处理方式、压实指标和排水条件需按工程设计核查，不能由模型外观推定。",
  },
  {
    objectName: "独立基础垫层",
    name: "独立基础垫层",
    order: 2,
    thickness: "配图未标注",
    material: "具体材料与强度未标注",
    description: "模型原名为“独立基础垫层”，对应下端支承部位；配图只表达支承轮廓，未区分其材料与分层。基础承载、垫层找平和防潮隔离属于不同作用，不应把此构件直接等同于防潮层。",
  },
  {
    objectName: "踏步斜梁",
    name: "踏步斜梁",
    order: 3,
    thickness: "—",
    material: "钢筋混凝土（强度未标注）",
    description: "位于踏步下方的倾斜支承构件，将踏步荷载传向端部支座。观察斜梁与下端支承、上端平台的关系；其截面、配筋和端部连接需由结构设计确定。",
  },
  {
    objectName: "钢筋混凝土踏步",
    name: "钢筋混凝土踏步",
    order: 4,
    thickness: "—",
    material: "钢筋混凝土（强度未标注）",
    description: "形成行走表面的踏步构件，将使用荷载传向支承构件。配图未给出踏步高宽，不能把常见尺寸当作本图已确定的尺寸或统一标准。",
  },
  {
    objectName: "水平平台楼板",
    name: "水平平台",
    order: 5,
    thickness: "配图未标注",
    material: "钢筋混凝土（强度未标注）",
    description: "台阶顶部与建筑入口相接的水平平台，兼作台阶的顶部支座。",
  },
  {
    objectName: "面层",
    name: "面层",
    order: 6,
    thickness: "配图未标注",
    material: "具体饰面材料未标注",
    description: "踏步和平台的表面层，需满足相应使用条件下的防滑、耐磨和排水要求。配图未指定面层厚度与材料。",
  },
  {
    objectName: "建筑外墙",
    name: "建筑外墙",
    order: 7,
    thickness: "配图未标注",
    material: "具体墙体材料未标注",
    description: "与入口平台相邻的建筑外墙。应分别检查台阶与主体之间的支承、变形协调和防水收口；配图未标注20mm缝宽，也不能据此断言台阶已与主体完全脱开或已消除差异沉降影响。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return rcElevatedStepsLayers.find((l) => l.objectName === objectName);
}
