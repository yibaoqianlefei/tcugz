import type { NodeLayerInfo } from './nodeDefinitions';

/** Teaching components only; the “无需标注” assembly remains display-only. */
export const stairFlightOffsetMultipleLayers: NodeLayerInfo[] = [
  {
    objectName: '梯段', name: '梯段', order: 3,
    thickness: '梯段板厚、踏步尺寸未标注', material: '混凝土（模型示意）',
    description: '带踏步的倾斜梯段。对照剖面观察“梯段错多步”的端部处理，以及图中标出的折形构件轮廓；转动模型查看端部踏步与平台板、水平挑边L形梁的相对位置。原图未标注板厚、踏步尺寸、错步尺寸或配筋。',
  },
  {
    objectName: '下平台梁-水平挑边L形梁', name: '下平台梁-水平挑边L形梁', order: 2,
    thickness: '梁截面与挑边尺寸未标注', material: '混凝土（模型示意）',
    description: '位于梯段端部与平台交接处，模型展示水平挑边及L形梁轮廓。结合剖面观察折形构件端部与梁挑边的接合位置，并查看平台板与梁的关系。原图未标注挑边长度、梁截面、支承尺寸或节点配筋。',
  },
  {
    objectName: '平台板', name: '平台板', order: 1,
    thickness: '板厚与面层厚度未标注', material: '混凝土（模型示意）',
    description: '与梯段端部及平台梁相接的水平平台板。对照剖面观察平台边缘、梁边与端部踏步的错位关系，比较“错多步”与其他梯段端部处理方式的轮廓。原图未标注平台宽度、板厚或面层做法。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return stairFlightOffsetMultipleLayers.find(layer => layer.objectName === objectName);
}
