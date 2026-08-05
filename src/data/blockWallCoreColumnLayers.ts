/**
 * Block-wall core column (砌块墙墙芯柱构造) — layer data mapping.
 * Maps GLB mesh objectName (canonical Blender export names) → construction knowledge.
 *
 * Construction order (base → core): 砌块墙体 → 2Φ12通长筋 → 灌C15细石混凝土
 *
 * 墙芯柱（混凝土芯柱）构造：混凝土小型空心砌块墙体砌筑时，在墙体内利用
 * 砌块竖向孔洞形成连续孔道，先插入 2Φ12 通长竖向钢筋，再浇筑 C15 细石
 * 混凝土填实孔洞，与砌块共同形成钢筋混凝土墙芯柱，提高墙体的竖向承载力
 * 与整体性（尤其利于抗震）。
 *
 * 无动画静态节点（GLB 无动画 clip），3 个构件预分离显示。
 */

export interface LayerInfo {
  objectName: string;   // matches canonical GLB mesh name
  name: string;         // Chinese display name
  order: number;        // construction order (1=base → N=final)
  thickness: string;    // e.g. "Φ12"
  material: string;     // material description
  description: string;  // teaching content
}

export const blockWallCoreColumnLayers: LayerInfo[] = [
  {
    objectName: "砌块墙体",
    name: "砌块墙体",
    order: 1,
    thickness: "按块材规格",
    material: "混凝土小型空心砌块 + 砂浆",
    description:
      "采用混凝土小型空心砌块错缝搭砌的墙体。砌块设有竖向孔洞，砌筑时上下孔洞对正连通，形成贯穿墙体的芯柱孔道，为后浇混凝土芯柱预留成型空间；砌筑砂浆应饱满，灰缝横平竖直。",
  },
  {
    objectName: "2Φ12通长筋",
    name: "芯柱纵筋",
    order: 2,
    thickness: "2Φ12",
    material: "HRB400级钢筋（Φ12）",
    description:
      "沿砌块孔道居中设置2根Φ12通长竖向钢筋，为墙芯柱的纵向受力钢筋。钢筋贯通墙体全高，下端锚固于基础或基础圈梁，上端伸入顶层圈梁或压顶，保证上下传力连续，提高墙体竖向承载力与整体性。",
  },
  {
    objectName: "灌C15细石混凝土",
    name: "芯柱混凝土",
    order: 3,
    thickness: "填充砌块孔洞",
    material: "C15细石混凝土",
    description:
      "在插入通长筋的砌块孔道内浇筑C15细石混凝土并捣实，与2Φ12通长筋共同形成钢筋混凝土墙芯柱。细石混凝土粒径小、流动性好，能充分填实孔洞、与砌块紧密粘结，与砌块协同受力，约束墙体开裂、增强墙体整体性与抗震性能。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return blockWallCoreColumnLayers.find((l) => l.objectName === objectName);
}
