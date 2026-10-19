export interface LayerInfo {
  objectName: string;
  name: string;
  order: number;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 抹灰勒脚构造做法 — 外墙根部抹灰勒脚节点，5层构造。
 * 勒脚是外墙接近室外地面的部位，起保护墙体根部、防潮和装饰作用。
 */
export const plasterPlinthLayers: LayerInfo[] = [
  {
    objectName: "室内外回填土",
    name: "回填土",
    order: 1,
    thickness: "分层夯实",
    material: "素土",
    description: "地基回填土分层夯实，压实系数≥0.94，为上部垫层和勒脚提供稳定基础。",
  },
  {
    objectName: "垫层",
    name: "垫层",
    order: 2,
    thickness: "60-100mm",
    material: "C15混凝土",
    description: "回填土之上的刚性垫层，起找平和传递荷载作用，兼作防潮层基底。",
  },
  {
    objectName: "防潮层",
    name: "防潮层",
    order: 3,
    thickness: "2-3mm",
    material: "沥青/防水涂料",
    description: "阻止土壤水分毛细上升侵入墙体，通常设在室内地坪以下60mm处。勒脚处的防潮层需延伸至外墙抹灰以下，形成连续封闭。",
  },
  {
    objectName: "抹灰",
    name: "抹灰层",
    order: 4,
    thickness: "15-20mm",
    material: "1:2.5水泥砂浆",
    description: "外墙勒脚表面水泥砂浆抹灰，保护墙体根部免受雨水溅湿、冻融和机械碰撞。勒脚高度一般不小于700mm，表面可做分格缝或涂料饰面。",
  },
  {
    objectName: "墙体",
    name: "墙体",
    order: 5,
    thickness: "240mm",
    material: "砖砌体/混凝土",
    description: "主体结构墙体，根部与勒脚抹灰相接处的防水和防潮处理是构造关键。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return plasterPlinthLayers.find((l) => l.objectName === objectName);
}
