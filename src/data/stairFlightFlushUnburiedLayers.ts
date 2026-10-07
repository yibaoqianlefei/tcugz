import type { NodeLayerInfo } from './nodeDefinitions';

/** Teaching components only; the “无需标注” assembly remains display-only. */
export const stairFlightFlushUnburiedLayers: NodeLayerInfo[] = [
  {
    objectName: '梯段', name: '梯段', order: 3,
    thickness: '梯段板厚、踏步尺寸未标注', material: '混凝土（模型示意）',
    description: '连接上下平台的踏步梯段。对照剖面观察“梯段齐步不埋步”的端部轮廓，比较端部踏步、平台边缘及平台梁的位置。图中标出梯段构件跨度，并放大显示端部接合轮廓；未给出跨度数值、板厚、踏步尺寸或配筋。',
  },
  {
    objectName: '下平台梁-平肩凹口', name: '下平台梁-平肩凹口', order: 2,
    thickness: '梁截面与凹口尺寸未标注', material: '混凝土（模型示意）',
    description: '位于梯段下端与下平台交接处。转动模型观察平肩和凹口轮廓，以及梯段端部与梁的接合位置。对照剖面查看梯段、平台板与梁边的关系；原图未标注凹口尺寸、支承长度或节点配筋。',
  },
  {
    objectName: '下平台板', name: '下平台板', order: 1,
    thickness: '板厚与面层厚度未标注', material: '混凝土（模型示意）',
    description: '梯段低端的水平平台，与下平台梁及梯段起步端相接。结合剖面观察平台边缘和端部踏步的齐步处理，比较其与“齐步并埋步”节点的接合轮廓。原图未标注平台板厚和面层做法。',
  },
  {
    objectName: '上平台梁-梁腹对齐', name: '上平台梁-梁腹对齐', order: 4,
    thickness: '梁截面与接合尺寸未标注', material: '混凝土（模型示意）',
    description: '位于梯段上端与上平台交接处。观察梯段端部与平台梁梁腹的对齐位置，并结合剖面中的局部放大轮廓查看接合关系。原图未标注梁截面、连接尺寸或节点配筋。',
  },
  {
    objectName: '上平台板', name: '上平台板', order: 5,
    thickness: '板厚与面层厚度未标注', material: '混凝土（模型示意）',
    description: '梯段高端的水平平台。对照剖面观察上平台板、平台梁和梯段末端踏步的相对位置，理解“梯段齐步不埋步”的端部处理。原图未标注平台宽度与板厚。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return stairFlightFlushUnburiedLayers.find(layer => layer.objectName === objectName);
}
