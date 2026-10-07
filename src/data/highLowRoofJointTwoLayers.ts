import type { NodeLayerInfo } from './nodeDefinitions';

/** Component identities match the supplied GLB; section dimensions remain distinct from model appearance. */
export const highLowRoofJointTwoLayers: NodeLayerInfo[] = [
  {
    objectName: '高墙', name: '高墙', order: 1,
    thickness: '墙厚未标注', material: '混凝土外观（模型示意）',
    description: '位于高屋面侧，与低屋面侧矮墙之间留出变形缝。模型将高墙、盖板和缝内材料分为独立构件；分解后对照剖面观察盖板根部及两侧墙体的相对位置。图中未标注高墙材质及缝宽。',
  },
  {
    objectName: '砖砌矮墙', name: '砖砌矮墙', order: 2,
    thickness: '墙厚未标注；图示泛水高度≥250mm', material: '砖砌体（模型示意）',
    description: '低屋面侧的矮墙，与高墙之间形成变形缝。墙顶承接泛水收头，盖板覆盖其上部；分解后观察矮墙、沥青麻丝及防水构造的位置关系。剖面标注泛水高度≥250mm，未标注墙厚。',
  },
  {
    objectName: '低屋面结构板', name: '低屋面结构板', order: 3,
    thickness: '板厚未标注', material: '混凝土外观（模型示意）',
    description: '低屋面侧的承重基层，模型展示结构板与矮墙及屋面薄层的连接位置。分解后观察板面层次；原图未给出结构板厚度、配筋和支承详图。',
  },
  {
    objectName: '下找平层', name: '下找平层', order: 4,
    thickness: '图中未标注', material: '找平材料（具体品种未标注）',
    description: '模型中独立命名的下部找平层，位于低屋面的构造层次中。分解后可与上找平层、防水层及结构板对照位置；原图没有分别标注两道找平层的材料和厚度。',
  },
  {
    objectName: '上找平层', name: '上找平层', order: 5,
    thickness: '图中未标注', material: '找平材料（具体品种未标注）',
    description: '模型中独立命名的上部找平层，与下找平层共同展示低屋面基层的层次。分解后观察其覆盖范围及与防水构造的衔接；原图未标注配比与厚度。',
  },
  {
    objectName: '砂浆圆弧基层', name: '砂浆圆弧基层', order: 6,
    thickness: '厚度与圆弧半径未标注', material: '砂浆（模型对象名）',
    description: '位于矮墙顶部及墙根转角，形成防水层贴合的平顺基层。转动模型观察水平屋面与竖向泛水的过渡，对照剖面中的圆弧收头轮廓。',
  },
  {
    objectName: '防水层', name: '低屋面防水层', order: 7,
    thickness: '图中未标注', material: '防水材料（具体品种未标注）',
    description: '沿低屋面水平铺设并向矮墙上翻，剖面明确标注“防水层”。观察墙根过渡及矮墙顶部收头，对照泛水高度≥250mm的图示要求；材料品种与层数未标注。',
  },
  {
    objectName: '沥青麻丝', name: '沥青麻丝填缝', order: 8,
    thickness: '缝宽未标注', material: '沥青麻丝（图示）',
    description: '填充于高墙与低屋面侧矮墙之间，剖面标注为“沥青麻丝”。分解后观察其与缝两侧墙体及金属覆盖构件的相对位置；动画用于展示构造关系，不代表实际变形过程。',
  },
  {
    objectName: '镀锌薄钢板', name: '镀锌薄钢板', order: 9,
    thickness: '钢板厚度未标注', material: '镀锌薄钢板（图示）',
    description: '覆盖变形缝上部，与矮墙泛水收头及盖板下方构造衔接。剖面明确标注“镀锌薄钢板”；转动或分解模型观察折边、跨缝覆盖及两端连接位置。',
  },
  {
    objectName: '水泥钉', name: '水泥钉', order: 10,
    thickness: '钉长与间距未标注', material: '金属（模型示意）',
    description: '位于矮墙上部的防水收头附近，剖面标注为“水泥钉”。分解后可观察其与防水层、金属覆盖构件及墙顶基层的相对位置；图中未标注钉的规格与固定间距。',
  },
  {
    objectName: '钢筋混凝土盖板', name: '钢筋混凝土盖板', order: 11,
    thickness: '板厚未明确；端部竖向尺寸图示80mm', material: '钢筋混凝土（图示）',
    description: '从高墙侧伸出，覆盖变形缝和低屋面泛水上部，端部向下折边。剖面标注Φ4@200、Φ6@200及端部竖向尺寸80mm；80mm不作为统一板厚。源模型没有独立钢筋网格，配筋需对照剖面阅读。',
  },
  {
    objectName: '盖板面层', name: '盖板面层', order: 12,
    thickness: '面层厚度未标注；图示坡度1%', material: '混凝土外观（模型示意，面层品种未标注）',
    description: '覆盖钢筋混凝土盖板表面的独立面层，剖面在盖板上表面标注1%坡度。分解后观察面层与盖板、端部折边的层次关系；图中未单独标注面层材料及厚度。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return highLowRoofJointTwoLayers.find(layer => layer.objectName === objectName);
}
