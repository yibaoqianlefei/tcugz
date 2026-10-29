export interface LayerInfo {
  objectName: string;
  name: string;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 混凝土台阶构造 — 室外台阶构造节点，5层。
 * 所配图标注C15混凝土和80mm厚碎石，为该教学实例的材料与厚度表达。
 */
export const concreteStepsLayers: LayerInfo[] = [
  {
    objectName: "面层",
    name: "面层",
    thickness: "配图未标注厚度",
    material: "面层材料未标注",
    description:
      "覆盖踏步及平台的表面层，承担行走、防滑和耐磨等使用要求。配图在上部表面标有向外3%的坡度，为该图排水示意；未给出面层材料、厚度或可通用于所有踏面的坡度要求。",
  },
  {
    objectName: "C15 混凝土",
    name: "混凝土台阶",
    thickness: "配图未标注厚度",
    material: "图示C15混凝土",
    description:
      "配图标为C15混凝土，形成踏步并经下部垫层向地基传递荷载。该强度等级属于配图实例，不是所有室外台阶的统一要求；踏步高宽和结构厚度在此图中未标注。",
  },
  {
    objectName: "80mm 厚碎石",
    name: "碎石垫层",
    thickness: "图示80mm",
    material: "碎石（粒径未标注）",
    description:
      "配图标注80mm厚碎石，位于混凝土与夯实土层之间，形成支承过渡层。设置垫层不能单独保证消除不均匀沉降，仍需核查地基和排水条件。",
  },
  {
    objectName: "素土夯实",
    name: "素土夯实",
    thickness: "处理厚度未标注",
    material: "素土",
    description:
      "配图注明素土夯实，作为台阶与垫层的下部支承。土料、处理厚度、压实指标及排水措施应按地基条件和设计要求确定，此图未给出这些参数。",
  },
  {
    objectName: "墙柱",
    name: "墙柱",
    thickness: "—",
    material: "具体材料未标注",
    description:
      "邻近台阶和入口的墙柱构件，用于辨认台阶与建筑主体的位置关系。配图不能据此证明它为踏步提供侧向约束，或可直接用作扶手、栏杆的锚固基础。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return concreteStepsLayers.find((l) => l.objectName === objectName);
}
