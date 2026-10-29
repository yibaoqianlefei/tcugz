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
    thickness: "配图纵筋4Φ12",
    material: "钢筋（牌号未标注）",
    description: "构造柱内的纵向钢筋，与箍筋组成钢筋骨架。配图标注4Φ12，属于该图实例；牌号、锚固和实际配筋应按结构设计核查，不能把此值当作所有构造柱的通用配筋。",
  },
  {
    objectName: "箍筋",
    name: "箍筋",
    thickness: "箍筋规格与间距未标注",
    material: "钢筋（牌号未标注）",
    description: "围束构造柱纵筋、维持钢筋骨架形状的横向钢筋。配图中的2Φ6@500引向墙柱连接拉结筋，不能误读成构造柱箍筋的规格与间距；箍筋应另按结构设计核查。",
  },
  {
    objectName: "混凝土柱子",
    name: "混凝土柱子",
    thickness: "配图平面一向标注240mm",
    material: "混凝土（强度未标注）",
    description: "与砌体、圈梁共同形成整体性约束的混凝土构造柱。配图平面一向尺寸标为240mm，不能据此推定截面必为240mm×240mm。其作用不同于以承担竖向荷载为主的框架柱，也不意味着构造柱完全没有竖向受力。",
  },
  {
    objectName: "楼板",
    name: "楼板",
    thickness: "配图未标注",
    material: "钢筋混凝土（强度未标注）",
    description: "楼层部位的楼板，用于观察墙体、圈梁和构造柱在楼层处的空间关系。连接与传力取决于结构体系和构造设计，不能只凭相邻轮廓断言所有构件均整体浇筑。",
  },
  {
    objectName: "马牙槎",
    name: "马牙槎",
    thickness: "配图退进≥60mm、段高≤300mm",
    material: "混凝土/砌体",
    description: "构造柱与砌体交接处的凹凸槎口。配图标出退进≥60mm、段高≤300mm，并示意墙内拉结筋；这些标注用于识读该图，具体砌体类型和工程条件下的做法需按设计及适用要求核查。整体性不能只靠槎口外形判断。",
  },
  {
    objectName: "墙体",
    name: "墙体",
    thickness: "配图平面墙厚240mm",
    material: "砖砌体",
    description: "构造柱两侧的砌体墙，配图墙厚标注240mm。观察马牙槎及伸入墙内的拉结筋如何共同联系墙柱；不能把图示局部连接等同于完整抗震体系已满足要求。",
  },
  {
    objectName: "圈梁",
    name: "圈梁",
    thickness: "配图未标注",
    material: "钢筋混凝土（强度未标注）",
    description: "沿墙体水平方向设置、用于加强整体联系的圈梁，与构造柱共同表达墙体的水平和竖向约束。完整的连续性、交接及配筋需结合整层布置核查，局部模型不能证明全楼已形成连续封闭体系。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return constructionColumnLayers.find((l) => l.objectName === objectName);
}
