/**
 * Block-wall core column (砌块墙墙芯柱构造) — layer data mapping.
 * Maps GLB mesh objectName (canonical Blender export names) → construction knowledge.
 *
 * Construction order (base → core): 砌块墙体 → 2Φ12通长筋 → 灌C15细石混凝土
 *
 * 墙芯柱（混凝土芯柱）构造：混凝土小型空心砌块墙体砌筑时，在墙体内利用
 * 砌块竖向孔洞形成连续孔道，插筋并灌孔形成墙芯柱。2Φ12、C15是原始模型
 * 标注，并非现行设计推荐；材料强度须同时核对砌体与抗震规范。芯柱与砌块
 * 共同形成钢筋混凝土墙芯柱，提高墙体的竖向承载力
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
    material: "原图标2Φ12；钢筋牌号未提供",
    description:
      "2Φ12为用户原图与模型的示例标注，原图未提供钢筋牌号。观察纵筋与孔道的空间关系，并另查实际配筋、锚固和水平联系的设计；不能由模型中可见的两根钢筋推定所有墙芯柱的配筋。",
  },
  {
    objectName: "灌C15细石混凝土",
    name: "芯柱灌孔混凝土（原图C15须复核）",
    order: 3,
    thickness: "填充砌块孔洞",
    material: "原图标C15，不能作为现行通用设计取值",
    description:
      "对象名“灌C15细石混凝土”保留用于识别原模型，不代表现行推荐。GB 55007—2021第3.3.2条要求混凝土砌块砌体灌孔混凝土不低于Cb20，且不低于块体强度等级的1.5倍；在GB 55002—2021第5.5节适用的砌体结构房屋中，还须满足第5.5.11条对芯柱等构件混凝土不低于C25的要求。Cb与C的材料标识不在本例中擅自换算；原图C15不能直接沿用。实际材料、灌孔范围、施工与验收仍须按设计核定。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return blockWallCoreColumnLayers.find((l) => l.objectName === objectName);
}
