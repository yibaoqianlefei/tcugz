export interface LayerInfo {
  objectName: string;
  name: string;
  order: number;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 贴面勒脚构造做法 — 外墙根部贴面勒脚节点，5层构造。
 * 勒脚是外墙接近室外地面的部位，贴面勒脚兼具保护墙体根部、防潮和装饰功能。
 */
export const facedPlinthLayers: LayerInfo[] = [
  {
    objectName: "室内外回填土",
    name: "回填土",
    order: 1,
    thickness: "分层夯实",
    material: "素土",
    description: "图示地面下部的回填土，压实与地坪支承需按场地和设计条件确定。图中未给出统一压实系数。",
  },
  {
    objectName: "垫层",
    name: "垫层",
    order: 2,
    thickness: "图中未标注",
    material: "垫层材料按设计确定",
    description: "素土之上的刚性垫层，起找平和传递荷载作用，兼作防潮层基底。",
  },
  {
    objectName: "防潮层",
    name: "防潮层",
    order: 3,
    thickness: "图中未标注",
    material: "防潮材料按设计确定",
    description: "图示墙脚防潮构造用于控制毛细水路径，需与室内外标高和地坪防潮层协调。不能把地坪以下60mm作为所有项目的固定位置，也不能用外侧贴面替代连续防潮构造。",
  },
  {
    objectName: "贴面",
    name: "贴面层",
    order: 4,
    thickness: "贴面厚度未标注",
    material: "贴面材料，图中未注明品种",
    description: "图示墙脚外侧的贴面保护层。面材、固定、耐候和接缝应作为系统选择，不能据贴面外观保证耐久，也不能把700mm等经验高度作为统一要求。",
  },
  {
    objectName: "墙体",
    name: "墙体",
    order: 5,
    thickness: "墙厚未标注",
    material: "墙体材料按设计确定",
    description: "图示墙脚基层，需处理贴面、防潮层与地面交接。是否承重及具体材料应结合完整建筑与结构图判断，不能从局部墙脚图推定。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return facedPlinthLayers.find((l) => l.objectName === objectName);
}
