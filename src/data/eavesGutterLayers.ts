export interface LayerInfo {
  objectName: string;
  name: string;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 檐沟外排水构造 — 屋顶檐沟有组织排水节点，6层构件。
 * 檐沟承接屋面雨水，经排水口汇入落水管，实现有组织外排水。
 */
export const eavesGutterLayers: LayerInfo[] = [
  {
    objectName: "屋面顶",
    name: "屋面顶",
    thickness: "120mm",
    material: "C25钢筋混凝土",
    description:
      "屋面结构层，向檐沟方向做≥2%找坡，将雨水汇集至檐沟。表面铺设防水层及保护层。",
  },
  {
    objectName: "檐沟",
    name: "檐沟",
    thickness: "宽度250-400mm",
    material: "镀锌钢板/C20混凝土",
    description:
      "水平方向承接屋面雨水，纵向坡度≥0.5%，将水导向排水口。金属檐沟需做防腐蚀处理，混凝土檐沟内壁应抹防水砂浆。",
  },
  {
    objectName: "檐沟分水",
    name: "檐沟分水",
    thickness: "—",
    material: "同檐沟材质",
    description:
      "檐沟中间高、两端低的转折分隔构造，将汇水面积一分为二，分向两侧排水口，降低单侧排水负荷。",
  },
  {
    objectName: "排水口",
    name: "排水口",
    thickness: "Φ75-110mm",
    material: "PVC-U或铸铁",
    description:
      "檐沟最低点开口，连接竖向落水管。入口处设雨水斗或滤网，防止树叶杂物堵塞。",
  },
  {
    objectName: "墙体",
    name: "墙体",
    thickness: "240mm",
    material: "砖砌体/混凝土",
    description:
      "檐口下方承重墙体，檐沟通常通过预埋件或托架固定于墙体顶部或圈梁外侧。",
  },
  {
    objectName: "圈梁",
    name: "圈梁",
    thickness: "200mm",
    material: "C25钢筋混凝土",
    description:
      "墙体顶部水平封闭梁，兼作檐沟的后支撑结构，增强房屋整体刚度并将檐沟荷载均匀传递至墙体。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return eavesGutterLayers.find((l) => l.objectName === objectName);
}
