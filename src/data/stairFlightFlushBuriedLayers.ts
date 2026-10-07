import type { NodeLayerInfo } from './nodeDefinitions';

/** Only the five teaching components; the source's “无需标注” assembly is display-only. */
export const stairFlightFlushBuriedLayers: NodeLayerInfo[] = [
  {
    objectName: '梯段', name: '梯段', order: 3,
    thickness: '梯段板厚、踏步尺寸未标注', material: '混凝土（模型示意）',
    description: '连接上下平台的踏步梯段。对照剖面观察“梯段齐步并埋步”的端部处理：踏步与平台起始位置相接，端部部分踏步埋入平台接合部位；转动模型可观察梯段两端与平台梁承托部位的关系。图中未标注板厚、踏步尺寸及配筋。',
  },
  {
    objectName: '下平台梁-斜肩L形承托', name: '下平台梁-斜肩L形承托', order: 2,
    thickness: '梁截面与承托尺寸未标注', material: '混凝土（模型示意）',
    description: '位于梯段下端与下平台交接处，模型展示斜肩及L形承托轮廓。观察梯段端部落在承托部位的位置，并对照剖面中的埋步处理；原图未标注支承长度、梁截面和连接配筋。',
  },
  {
    objectName: '下平台板', name: '下平台板', order: 1,
    thickness: '板厚与面层厚度未标注', material: '混凝土（模型示意）',
    description: '梯段低端的水平平台，与下平台梁及梯段起步端相接。转动模型观察平台板面、梁边与端部踏步的相对位置，理解埋步部位的接合关系。原图未标注平台板厚和面层做法。',
  },
  {
    objectName: '上平台梁-斜肩L形承托', name: '上平台梁-斜肩L形承托', order: 4,
    thickness: '梁截面与承托尺寸未标注', material: '混凝土（模型示意）',
    description: '位于梯段上端与上平台交接处，斜肩和L形承托与梯段倾斜端部相接。结合剖面放大部位观察梁边、平台起始点和埋入踏步的关系；原图未给出承托尺寸或节点配筋。',
  },
  {
    objectName: '上平台板', name: '上平台板', order: 5,
    thickness: '板厚与面层厚度未标注', material: '混凝土（模型示意）',
    description: '梯段高端的水平平台，图中标出平台起始点，并放大显示端部接合轮廓。观察上平台板、平台梁和梯段最后几级踏步的关系，理解齐步与埋步的处理位置。原图未标注平台宽度与板厚。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return stairFlightFlushBuriedLayers.find(layer => layer.objectName === objectName);
}
