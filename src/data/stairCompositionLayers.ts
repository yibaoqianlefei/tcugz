export interface LayerInfo {
  objectName: string;
  name: string;
  order: number;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 楼梯的组成 — 模型包含以下5类可交互构件。
 * 楼梯是建筑中连接不同标高楼层的重要垂直交通构件。
 */
export const stairCompositionLayers: LayerInfo[] = [
  {
    objectName: "中间平台",
    name: "中间平台",
    order: 1,
    thickness: "—",
    material: "钢筋混凝土",
    description: "位于两个梯段之间，供通行停歇和转向，并与梯段共同形成连续路线。平台有效宽度需结合梯段净宽、转向方式和建筑使用要求核查，配图未标注尺寸。",
  },
  {
    objectName: "梯段",
    name: "梯段",
    order: 2,
    thickness: "—",
    material: "钢筋混凝土",
    description: "连接不同标高平台的倾斜构件，由连续踏步组成。观察踏步、梯段和平台的衔接；级数、踏步尺寸及通行净高需结合建筑用途和适用要求确定，不能由本组成示意图直接推定。",
  },
  {
    objectName: "横层平台",
    name: "楼层平台",
    order: 3,
    thickness: "—",
    material: "钢筋混凝土",
    description: "与楼层地面相连，衔接梯段与该层交通空间。核查平台有效宽度时，还需考虑门扇开启、转向和通行路线的影响。",
  },
  {
    objectName: "栏杆",
    name: "栏杆",
    order: 4,
    thickness: "—",
    material: "金属/钢筋混凝土",
    description: "沿梯段和平台临空一侧设置的防护构件。梯段扶手与平台临空栏杆的量高基准、适用条件可能不同，应分别核查；配图没有高度标注，不能按住宅或公共建筑简单套用统一高度。",
  },
  {
    objectName: "顶层水平栏杆",
    name: "顶层水平栏杆",
    order: 5,
    thickness: "—",
    material: "金属/钢筋混凝土",
    description: "位于顶层平台临空一侧的水平防护构件。观察它与梯段栏杆的转接；防护高度应按平台部位和可踏面条件单独核查，不能直接沿用梯段扶手的高度。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return stairCompositionLayers.find((l) => l.objectName === objectName);
}
