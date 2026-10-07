import type { NodeLayerInfo } from './nodeDefinitions';

/** Teaching components only; the “无需标注” assembly remains display-only. */
export const stairFlightOffsetOneLayers: NodeLayerInfo[] = [
  {
    objectName: '梯段', name: '梯段', order: 3,
    thickness: '梯段板厚、踏步尺寸未标注', material: '混凝土（模型示意）',
    description: '连接上下平台的踏步梯段。对照剖面观察“梯段错一步”的端部处理，比较端部踏步与平台边缘的错位关系，并转动模型查看梯段两端与斜肩L形承托的接合位置。图中未标注板厚、踏步尺寸及配筋。',
  },
  {
    objectName: '下平台梁-斜肩L形承托', name: '下平台梁-斜肩L形承托', order: 2,
    thickness: '梁截面与承托尺寸未标注', material: '混凝土（模型示意）',
    description: '位于梯段下端与下平台交接处，具有斜肩及L形承托轮廓。结合剖面观察梁边、承托部位与梯段起步端的相对位置。原图未标注支承长度、梁截面和连接配筋。',
  },
  {
    objectName: '下平台板', name: '下平台板', order: 1,
    thickness: '板厚与面层厚度未标注', material: '混凝土（模型示意）',
    description: '梯段低端的水平平台，与下平台梁及梯段起步端相接。观察平台边缘与端部踏步的错位，比较“错一步”与“齐步并埋步”的端部轮廓。原图未标注平台板厚和面层做法。',
  },
  {
    objectName: '上平台梁-斜肩L形承托', name: '上平台梁-斜肩L形承托', order: 4,
    thickness: '梁截面与承托尺寸未标注', material: '混凝土（模型示意）',
    description: '位于梯段上端与上平台交接处，斜肩及L形承托与梯段倾斜端部相接。对照剖面中的平台起始位置，观察梁边与最后几级踏步的接合轮廓。原图未给出承托尺寸或节点配筋。',
  },
  {
    objectName: '上平台板', name: '上平台板', order: 5,
    thickness: '板厚与面层厚度未标注', material: '混凝土（模型示意）',
    description: '梯段高端的水平平台。结合剖面观察平台起始位置、上平台梁和梯段末端踏步之间的关系，理解“梯段错一步”的端部处理。原图未标注平台宽度与板厚。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return stairFlightOffsetOneLayers.find(layer => layer.objectName === objectName);
}
