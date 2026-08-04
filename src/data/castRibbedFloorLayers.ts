/**
 * Cast-in-place ribbed-beam floor (现浇肋梁楼板) — layer data mapping.
 * Maps GLB mesh objectName (exact Blender export names) → construction knowledge.
 *
 * Load path: 现浇板 → 次梁(肋梁) → 主梁 → 柱 → 基础
 */

export interface LayerInfo {
  objectName: string;   // matches GLB mesh.name exactly
  name: string;         // Chinese display name
  order: number;        // construction layer order (1=bottom → N=top)
  thickness: string;    // e.g. "板厚 80mm"
  material: string;     // material description
  description: string;  // teaching content
}

export const castRibbedFloorLayers: LayerInfo[] = [
  {
    objectName: "柱",
    name: "柱",
    order: 1,
    thickness: "—",
    material: "钢筋混凝土柱",
    description:
      "楼盖竖向承重构件，支承主梁并将楼板全部荷载传至基础。柱的间距决定主梁跨度，是肋梁楼板传力路径的终点。",
  },
  {
    objectName: "主梁",
    name: "主梁",
    order: 2,
    thickness: "—",
    material: "钢筋混凝土主梁",
    description:
      "沿柱距方向布置的主要承重梁，支承次梁，将楼面荷载集中传递给柱。主梁截面尺寸大于次梁。",
  },
  {
    objectName: "次梁",
    name: "肋梁（次梁）",
    order: 3,
    thickness: "—",
    material: "钢筋混凝土次梁",
    description:
      "间距较小的支承梁（肋），直接支承现浇板，将板传来的荷载传递给主梁。肋梁楼板由此得名。",
  },
  {
    objectName: "板",
    name: "现浇板",
    order: 4,
    thickness: "板厚 60~120mm",
    material: "钢筋混凝土现浇板",
    description:
      "楼面水平承重构件，直接承受使用荷载，并将荷载传给次梁。肋梁楼板中板跨度较小、板厚较薄，与次梁、主梁现浇成整体。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return castRibbedFloorLayers.find((l) => l.objectName === objectName);
}
