export interface LayerInfo {
  objectName: string;
  name: string;
  thickness: string;
  material: string;
  description: string;
}

export const constructionColumnLayers: LayerInfo[] = [
  {
    objectName: "钢筋",
    name: "钢筋",
    thickness: "Φ12-14mm",
    material: "HRB400钢筋",
    description: "纵向受力钢筋4根，直径12mm，与箍筋共同构成钢筋骨架，提高构造柱抗弯能力。",
  },
  {
    objectName: "箍筋",
    name: "箍筋",
    thickness: "Φ6-8mm",
    material: "HPB300钢筋",
    description: "直径6-8mm，间距200mm，加密区间距100mm，约束纵向钢筋防止压曲。",
  },
  {
    objectName: "混凝土柱子",
    name: "混凝土柱子",
    thickness: "240mm",
    material: "C25混凝土",
    description: "截面通常为240mm×240mm，与墙体等厚，内配钢筋笼，不单独承受竖向荷载。",
  },
  {
    objectName: "楼板",
    name: "楼板",
    thickness: "120mm",
    material: "C25钢筋混凝土",
    description: "钢筋混凝土楼板，与圈梁和构造柱整体浇筑连接，传递水平力。",
  },
  {
    objectName: "马牙槎",
    name: "马牙槎（马牙槎）",
    thickness: "60mm/步",
    material: "混凝土/砌体",
    description: "构造柱与墙体之间的咬合连接构造，先退后进，每步退进60mm，高度不大于300mm。",
  },
  {
    objectName: "墙体",
    name: "墙体",
    thickness: "240mm",
    material: "砖砌体",
    description: "砖砌体墙体，与构造柱通过马牙槎咬合连接，形成整体受力体系。",
  },
  {
    objectName: "圈梁",
    name: "圈梁",
    thickness: "200mm",
    material: "C25钢筋混凝土",
    description: "水平方向连续封闭的钢筋混凝土梁，与构造柱形成空间约束体系，提高房屋整体刚度。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return constructionColumnLayers.find((l) => l.objectName === objectName);
}
