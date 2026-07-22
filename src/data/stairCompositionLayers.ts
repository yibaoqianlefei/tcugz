export interface LayerInfo {
  objectName: string;
  name: string;
  order: number;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 楼梯的组成 — 楼梯基本构造，6个组成部分。
 * 楼梯是建筑中连接不同标高楼层的重要垂直交通构件。
 */
export const stairCompositionLayers: LayerInfo[] = [
  {
    objectName: "中间平台",
    name: "中间平台",
    order: 1,
    thickness: "—",
    material: "钢筋混凝土",
    description: "位于两个梯段之间的休息平台，供行人缓冲和转向。宽度不小于梯段宽度，长度不小于1.2m。",
  },
  {
    objectName: "梯段",
    name: "梯段",
    order: 2,
    thickness: "—",
    material: "钢筋混凝土",
    description: "楼梯的主要构成部分，由若干踏步组成的倾斜构件。每个梯段的踏步数不应超过18级，也不应少于3级。",
  },
  {
    objectName: "横层平台",
    name: "楼层平台",
    order: 3,
    thickness: "—",
    material: "钢筋混凝土",
    description: "与楼层地面相连的平台，是楼梯与楼层的衔接处。宽度不小于梯段宽度。",
  },
  {
    objectName: "栏杆",
    name: "栏杆",
    order: 4,
    thickness: "—",
    material: "金属/钢筋混凝土",
    description: "楼梯的安全防护构件，沿梯段和平台临空一侧设置。栏杆高度不应小于1.05m（住宅）或1.10m（公共建筑）。",
  },
  {
    objectName: "顶层水平栏杆",
    name: "顶层水平栏杆",
    order: 5,
    thickness: "—",
    material: "金属/钢筋混凝土",
    description: "顶层平台临空侧的栏杆，水平方向连续设置，高度要求同普通栏杆。顶部扶手便于抓握和锚固。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return stairCompositionLayers.find((l) => l.objectName === objectName);
}
