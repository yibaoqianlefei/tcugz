import type { NodeLayerInfo } from './nodeDefinitions';

/** Preserve GLB object identities; dimensions below are transcribed from the supplied section. */
export const highLowRoofJointLayers: NodeLayerInfo[] = [
  {
    objectName: '高墙', name: '高墙', order: 1,
    thickness: '墙厚未标注', material: '混凝土外观（模型示意）',
    description: '高低屋面交接处的高墙，与低屋面侧矮墙之间留出变形缝。剖面注明缝宽按设计；墙面开槽用于附加卷材收头。源动画中高墙固定，便于对照各构件分离前后的位置。',
  },
  {
    objectName: '砖砌矮墙', name: '砖砌矮墙', order: 2,
    thickness: '图示墙厚120mm', material: '砖砌体（模型示意）',
    description: '位于低屋面侧，与高墙分开设置，形成变形缝边缘的泛水基层。剖面标注矮墙厚120mm、泛水高度≥250mm；转动模型观察矮墙顶部与跨缝附加卷材的关系。',
  },
  {
    objectName: '低屋面结构板', name: '低屋面结构板', order: 3,
    thickness: '板厚未标注', material: '混凝土外观（模型示意）',
    description: '低屋面侧的承重基层，模型展示其与矮墙、上部找平层的连接位置。分解后可观察板面层次；剖面未标注板厚、配筋及具体支承方式。',
  },
  {
    objectName: '低屋面找平层', name: '低屋面找平层', aliases: ['低屋面找层'], order: 4,
    thickness: '图中未标注', material: '找平材料（具体品种未标注）',
    description: '位于低屋面结构板与防水层之间，为防水构造提供平整基层。分解后观察找平层与墙根圆弧基层的相接位置；图中未标注材料配比和厚度。',
  },
  {
    objectName: '砂浆圆弧基层', name: '砂浆圆弧基层', order: 5,
    thickness: '厚度与圆弧半径未标注', material: '砂浆（模型对象名）',
    description: '沿矮墙顶部及墙根转角形成平顺过渡，供防水层和附加卷材贴合。转动或分解模型观察水平面与竖向面的转折；剖面未标注圆弧半径。',
  },
  {
    objectName: '防水层', name: '低屋面防水层', order: 6,
    thickness: '图中未标注', material: '防水材料（具体品种未标注）',
    description: '沿低屋面铺设，并在矮墙内侧上翻形成泛水。对照剖面观察水平防水层、墙根转角和矮墙上部的连续关系；图示泛水高度≥250mm。',
  },
  {
    objectName: '附加卷材', name: '跨缝附加卷材', order: 7,
    thickness: '图中未标注', material: '防水卷材（图示）',
    description: '从高墙槽口跨越变形缝，覆盖矮墙顶部并与低屋面泛水衔接。剖面明确标注“附加卷材”；分解后可观察跨缝覆盖范围及高墙端收头。动画用于展示构件位置，不代表实际变形过程。',
  },
  {
    objectName: '水泥钉', name: '水泥钉', order: 8,
    thickness: '钉长与间距未标注', material: '金属（模型示意）',
    description: '位于高墙槽口处，固定附加卷材的墙端收头，剖面标注为“水泥钉”。分解后观察其与卷材端部、槽口封口的相对位置；图中未给出钉长、规格及固定间距。',
  },
  {
    objectName: '墙槽柔性封口', name: '墙槽柔性封口', order: 9,
    thickness: '图中未标注', material: '柔性封口材料（模型对象名）',
    description: '位于高墙槽口及卷材收头附近，模型将其作为独立封口构件。对照剖面观察封口与水泥钉、附加卷材的衔接；原图未标注封口材料的具体品种。',
  },
  {
    objectName: '抹灰', name: '高墙抹灰', order: 10,
    thickness: '图中未标注', material: '抹灰材料（模型对象名）',
    description: '高墙表面的独立面层，模型将槽口附近的收口轮廓一并呈现。分解后可观察抹灰、高墙及跨缝卷材的层次；材质颜色沿用原模型，原图未标注抹灰配比和厚度。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return highLowRoofJointLayers.find(layer => layer.objectName === objectName || layer.aliases?.includes(objectName));
}
