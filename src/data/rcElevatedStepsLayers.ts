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
 * 架空台阶通过独立基础支撑，与建筑外墙分离，避免不均匀沉降导致台阶开裂。
 */
export const rcElevatedStepsLayers: LayerInfo[] = [
  {
    objectName: "素土夯实",
    name: "素土夯实",
    order: 1,
    thickness: "分层夯实",
    material: "素土",
    description: "地基底层，原土清除杂填物后分层夯实，压实系数≥0.94。",
  },
  {
    objectName: "独立基础垫层",
    name: "独立基础垫层",
    order: 2,
    thickness: "100mm",
    material: "C15素混凝土",
    description: "独立基础下的垫层，起找平和保护基础底面作用，兼作防潮隔离层。",
  },
  {
    objectName: "踏步斜梁",
    name: "踏步斜梁",
    order: 3,
    thickness: "—",
    material: "C25钢筋混凝土",
    description: "支撑踏步板的倾斜梁，两端分别支承于独立基础和水平平台。斜梁截面高度根据跨度和荷载计算确定。",
  },
  {
    objectName: "钢筋混凝土踏步",
    name: "钢筋混凝土踏步",
    order: 4,
    thickness: "—",
    material: "C25钢筋混凝土",
    description: "台阶的主体构件，由踏步板和斜梁共同承担使用荷载。踏步高150mm、宽300mm为标准尺寸。",
  },
  {
    objectName: "水平平台楼板",
    name: "水平平台",
    order: 5,
    thickness: "120mm",
    material: "C25钢筋混凝土",
    description: "台阶顶部与建筑入口相接的水平平台，兼作台阶的顶部支座。",
  },
  {
    objectName: "面层",
    name: "面层",
    order: 6,
    thickness: "20mm",
    material: "水泥砂浆/石材",
    description: "踏步和平台的表面饰面层，保护混凝土结构并满足防滑、耐磨和美观要求。室外台阶面层应做防滑处理。",
  },
  {
    objectName: "建筑外墙",
    name: "建筑外墙",
    order: 7,
    thickness: "240mm",
    material: "砖砌体/混凝土",
    description: "建筑物主体外墙，架空台阶与外墙之间设变形缝（20mm），防止不均匀沉降影响结构安全。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return rcElevatedStepsLayers.find((l) => l.objectName === objectName);
}
