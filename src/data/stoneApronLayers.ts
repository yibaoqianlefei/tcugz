export interface LayerInfo {
  objectName: string;
  name: string;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 块石散水构造 — 外墙根部块石铺砌散水节点，9层构造。
 * 传统块石散水兼具排水和装饰功能，常用于历史建筑和景观工程。
 */
export const stoneApronLayers: LayerInfo[] = [
  {
    objectName: "饰面层",
    name: "饰面层",
    thickness: "10-15mm",
    material: "外墙饰面材料",
    description:
      "外墙饰面层，延伸至散水顶部收口处，与散水之间以密封膏嵌缝形成弹性防水封口。",
  },
  {
    objectName: "防水层",
    name: "防水层",
    thickness: "2-3mm",
    material: "防水涂料或卷材",
    description:
      "墙体根部防水层，向下延伸至散水垫层以下，形成连续封闭的防水屏障，防止地表水渗入地基。",
  },
  {
    objectName: "钢筋混凝土墙体",
    name: "钢筋混凝土墙体",
    thickness: "200-300mm",
    material: "C25-C30钢筋混凝土",
    description:
      "主体结构墙体，承担上部荷载并传至基础。外墙根部与散水相接处的防水处理是构造关键。",
  },
  {
    objectName: "聚乙烯泡沫塑料",
    name: "聚乙烯泡沫塑料",
    thickness: "20-30mm",
    material: "闭孔聚乙烯泡沫",
    description:
      "伸缩缝填充材料，夹于墙体与散水之间，可压缩变形吸收差异沉降与温度变形，防止散水开裂。",
  },
  {
    objectName: "密封膏嵌缝",
    name: "密封膏嵌缝",
    thickness: "10-15mm宽",
    material: "聚氨酯或硅酮密封膏",
    description:
      "散水与外墙之间缝顶的弹性密封，阻止雨水入缝。施工前清缝、干燥、涂底涂，再嵌填密封膏。",
  },
  {
    objectName: "保温层",
    name: "保温层",
    thickness: "30-50mm",
    material: "挤塑聚苯板(XPS)",
    description:
      "外墙外保温层延伸至散水以下，阻断冷桥，减少冬季土壤冻胀对散水的抬升破坏。",
  },
  {
    objectName: "120厚块石,1：2.5水泥砂浆灌缝",
    name: "块石面层",
    thickness: "120mm",
    material: "块石 + 1:2.5水泥砂浆",
    description:
      "散水面层，120mm厚天然块石铺砌，1:2.5水泥砂浆灌缝。块石要求质地坚硬、抗冻，排列紧密有序，向外坡≥3%。",
  },
  {
    objectName: "30厚粗砂垫层",
    name: "粗砂垫层",
    thickness: "30mm",
    material: "粗砂（粒径0.5-2mm）",
    description:
      "块石面层与素土之间的过渡层，30mm厚粗砂填铺，起找平、缓冲和排水三重作用。",
  },
  {
    objectName: "素土夯实，向外坡 3%～5%",
    name: "素土夯实",
    thickness: "≥300mm分层夯实",
    material: "素土",
    description:
      "散水最底层，原土清除杂填物后分层夯实，压实系数≥0.94。表面向外坡3%-5%，确保渗入散水的水快速排离建筑。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return stoneApronLayers.find((l) => l.objectName === objectName);
}
