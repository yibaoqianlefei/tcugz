export interface LayerInfo {
  objectName: string;
  name: string;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 细石混凝土散水构造 — 外墙根部散水节点，9层构造。
 * 散水环绕建筑外墙根部，向外找坡快速排走雨水，保护地基。
 */
export const apronFlashingLayers: LayerInfo[] = [
  {
    objectName: "60厚C20细石混凝土面层",
    name: "细石混凝土面层",
    thickness: "60mm",
    material: "C20细石混凝土",
    description:
      "散水最面层，60mm厚C20细石混凝土，表面压光。一次浇筑成型，随捣随抹，向外坡度≥3%以利排水。",
  },
  {
    objectName: "饰面层",
    name: "饰面层",
    thickness: "10-15mm",
    material: "外墙饰面材料",
    description:
      "外墙饰面层，延伸至散水顶部收口处，与散水混凝土之间留有变形缝并用密封膏嵌填。",
  },
  {
    objectName: "防水层",
    name: "防水层",
    thickness: "2-3mm",
    material: "防水涂料或防水卷材",
    description:
      "墙体根部防水层，向下延伸至散水垫层下方，防止地面水沿墙根渗入室内，形成封闭防水体系。",
  },
  {
    objectName: "钢筋混凝土墙体",
    name: "钢筋混凝土墙体",
    thickness: "200-300mm",
    material: "C25-C30钢筋混凝土",
    description:
      "主体结构墙体，承受上部荷载并传递至基础。外墙根部与散水相接处需做防水处理。",
  },
  {
    objectName: "聚乙烯泡沫塑料",
    name: "聚乙烯泡沫塑料",
    thickness: "20-30mm",
    material: "闭孔聚乙烯泡沫",
    description:
      "墙体与散水之间的水平伸缩缝填充材料，可压缩变形吸收墙体与散水的差异沉降，防止散水开裂。",
  },
  {
    objectName: "密封膏嵌缝",
    name: "密封膏嵌缝",
    thickness: "10-15mm宽",
    material: "聚氨酯或硅酮密封膏",
    description:
      "散水与外墙之间缝顶的弹性密封材料，防水防尘，随墙体微动保持密封，施工前需清理缝内杂物并涂刷底涂。",
  },
  {
    objectName: "保温层",
    name: "保温层",
    thickness: "30-50mm",
    material: "挤塑聚苯板(XPS)",
    description:
      "外墙外保温层，延伸至散水垫层以下，减少冷桥效应，防止冬季土壤冻胀对散水的破坏。",
  },
  {
    objectName: "150厚粒径10~40卵石灌M2.5混合砂浆（或150厚3：7",
    name: "卵石灌浆垫层",
    thickness: "150mm",
    material: "卵石+M2.5混合砂浆（或3:7灰土）",
    description:
      "散水基层，150mm厚10~40mm粒径卵石用M2.5混合砂浆灌缝（也可用150mm厚3:7灰土分层夯实），提供坚实平稳的基层。",
  },
  {
    objectName: "素土夯实，向外坡3%~5%",
    name: "素土夯实",
    thickness: "≥300mm分层夯实",
    material: "素土",
    description:
      "散水最底层，原土分层夯实，压实系数≥0.94。表面向外做出3%~5%坡度，坡度大于面层以利散水面层排水。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return apronFlashingLayers.find((l) => l.objectName === objectName);
}
