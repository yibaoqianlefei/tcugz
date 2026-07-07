export interface LayerInfo {
  objectName: string;
  name: string;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 混凝土台阶构造 — 室外台阶构造节点，5层。
 * C15混凝土台阶适用于一般民用建筑室外入口。
 */
export const concreteStepsLayers: LayerInfo[] = [
  {
    objectName: "面层",
    name: "面层",
    thickness: "20mm",
    material: "1:2.5水泥砂浆",
    description:
      "台阶最面层，20mm厚1:2.5水泥砂浆抹面。表面压光或做防滑条，踏面应向外做1%坡度以利排水。",
  },
  {
    objectName: "C15 混凝土",
    name: "混凝土台阶",
    thickness: "≥150mm（踏步板厚）",
    material: "C15混凝土",
    description:
      "台阶主体结构层，C15混凝土浇筑成型。踏步高150mm、宽300mm为标准模数。混凝土台阶应坐落在坚实基层上。",
  },
  {
    objectName: "80mm 厚碎石",
    name: "碎石垫层",
    thickness: "80mm",
    material: "碎石（粒径20-40mm）",
    description:
      "混凝土台阶的垫层，80mm厚碎石夯填。碎石垫层起排水和均匀传递荷载的作用，防止台阶不均匀沉降。",
  },
  {
    objectName: "素土夯实",
    name: "素土夯实",
    thickness: "≥300mm分层夯实",
    material: "素土",
    description:
      "台阶最底层，原土分层夯实，压实系数≥0.94。表面向室外方向做微坡以利排水，防止台阶底部积水。",
  },
  {
    objectName: "墙柱",
    name: "墙柱",
    thickness: "—",
    material: "砖砌体/混凝土",
    description:
      "台阶两侧的限位结构，为台阶提供侧向支撑，防止踏步横向位移。同时兼作扶手或栏杆的安装基础。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return concreteStepsLayers.find((l) => l.objectName === objectName);
}
