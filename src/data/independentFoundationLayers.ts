export interface LayerInfo {
  objectName: string;
  name: string;
  order: number;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 独立式基础（独立柱基础）— 一般构造层次。
 * 独立式基础常见形式：杯形基础、阶梯形基础、锥形基础。
 * 各形式的差异体现在基础台身（杯口 / 阶梯 / 锥形斜边），
 * 底部均设扩大底板、垫层与地基。
 */
export const independentFoundationLayers: LayerInfo[] = [
  {
    objectName: "地基土",
    name: "地基土（素土夯实）",
    order: 1,
    thickness: "—",
    material: "素土 / 原状土",
    description:
      "基础底面以下承受基础传来荷载的地基土层。持力层应满足承载力要求，基础底面标高通常位于冰冻线以下，必要时对软弱地基进行换填处理。",
  },
  {
    objectName: "垫层",
    name: "垫层",
    order: 2,
    thickness: "100mm",
    material: "C10 / C15 素混凝土",
    description:
      "位于基础底板与地基之间，用于找平地基、扩散基底压力并提供干净的施工面，同时保护底部钢筋。独立基础下通常设100mm厚素混凝土垫层，每边宽出基础底面100mm。",
  },
  {
    objectName: "基础底板",
    name: "基础底板（大放脚）",
    order: 3,
    thickness: "按结构计算",
    material: "钢筋混凝土",
    description:
      "独立基础的底部扩大部分，将柱传来的集中荷载扩散到较大的地基面积上，控制基底平均压力与不均匀沉降。底板为刚性或柔性（配筋）扩展基础。",
  },
  {
    objectName: "基础台身",
    name: "基础台身（形式）",
    order: 4,
    thickness: "按结构计算",
    material: "钢筋混凝土",
    description:
      "独立基础底部以上的台身部分，其形式决定基础类型：杯形基础顶部设杯口供预制柱插入；阶梯形基础按台阶逐级收分；锥形基础以斜边连续收分。三者刚度相近，按施工与装配要求选用。",
  },
  {
    objectName: "柱",
    name: "上部柱（独立柱）",
    order: 5,
    thickness: "按结构计算",
    material: "钢筋混凝土",
    description:
      "独立基础上部的支承柱。预制柱插入杯形基础杯口后用细石混凝土灌实；阶梯形、锥形基础则与上部柱整体现浇（或插筋锚固），柱纵筋锚入基础底板内。",
  },
  {
    objectName: "室内地面",
    name: "室内地面（±0.000）",
    order: 6,
    thickness: "—",
    material: "面层 / 垫层 / 防潮层",
    description:
      "底层室内地坪，常以±0.000作为建筑标高基准。独立基础的顶面标高通常低于室内地面，地面构造层应设防潮层并处理好与基础交接处的防潮。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return independentFoundationLayers.find((l) => l.objectName === objectName);
}
