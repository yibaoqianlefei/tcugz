export interface LayerInfo {
  objectName: string;
  name: string;
  order: number;
  thickness: string;
  material: string;
  description: string;
}

/**
 * 空心砌块的常见形式 — 混凝土空心砌块常用孔型。
 * 四种常见砌块形式：多排扁孔、单排组合孔、单排圆孔、单排双孔。
 * 空心率、孔型与排布方式直接影响砌块的强度、自重及保温隔热性能。
 */
export const hollowBlockFormsLayers: LayerInfo[] = [
  {
    objectName: "多排扁孔",
    name: "多排扁孔",
    order: 1,
    thickness: "—",
    material: "混凝土空心砌块",
    description:
      "孔型扁长，横向多排布置（一般3~5排），孔洞率较大。扁孔错缝砌筑后孔洞不上下贯通，隔声、保温隔热性能较好；强度较高，常用于外墙与承重部位。",
  },
  {
    objectName: "单排双孔",
    name: "单排双孔",
    order: 2,
    thickness: "—",
    material: "混凝土空心砌块",
    description:
      "单排两个矩形孔并排布置，孔洞率适中、孔壁较厚，强度与保温性能较好，是承重砌块的常见形式。",
  },
  {
    objectName: "单排圆孔",
    name: "单排圆孔",
    order: 3,
    thickness: "—",
    material: "混凝土空心砌块",
    description:
      "单排圆孔布置，孔洞率较高，自重轻、用料省、造价低，但保温隔声性能相对较差，多用于填充墙或非承重部位。",
  },
  {
    objectName: "单排组合孔",
    name: "单排组合孔",
    order: 4,
    thickness: "—",
    material: "混凝土空心砌块",
    description:
      "单排孔由圆孔与方孔（矩形孔）组合而成，孔间错位布置、不上下贯通，兼顾强度与保温性能。承重空心砌块常用形式，砌筑后可在孔内插筋并灌注混凝土形成芯柱。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return hollowBlockFormsLayers.find((l) => l.objectName === objectName);
}
