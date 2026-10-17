import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

/** Names follow the supplied model; drawing numbers refer to 图2-12. */
export const windowWallGapSealingLayers: NodeLayerInfo[] = [
  {
    objectName: '外墙', name: '外墙', order: 1,
    thickness: '墙厚未标注', material: '墙体（具体材料未标注）',
    description: '对应剖面图编号4，位于窗框外侧。分解后对照墙体与窗框之间的安装缝，观察填缝材料和两侧收口的位置。',
  },
  {
    objectName: '窗框', name: '窗框', order: 2,
    thickness: '框截面尺寸未标注', material: '窗框（具体材料未标注）',
    description: '对应剖面图编号5，在分解动画中保持固定。图示窗框与外墙之间的缝宽为7 mm；转动模型查看缝内填充材料及两侧的封堵关系。',
  },
  {
    objectName: '袋装矿棉', name: '袋装矿棉', order: 3,
    thickness: '安装缝宽7 mm（图示）', material: '袋装矿棉',
    description: '对应剖面图编号2，填于窗框与外墙之间的缝隙。分解后观察填充层沿窗框延伸的位置，并与端部弹性密封胶区分。图示7 mm为安装缝宽，其他尺寸未标注。',
  },
  {
    objectName: '弹性密封胶', name: '弹性密封胶', order: 4,
    thickness: '胶缝深度未标注', material: '弹性密封胶',
    description: '对应剖面图编号3，位于填缝层的端部收口处。分解后观察密封胶与袋装矿棉、窗框及外墙的相接位置；胶的具体品种与施工深度未标注。',
  },
  {
    objectName: '左木条', name: '左木条', order: 5,
    thickness: '木条截面尺寸未标注', material: '木条',
    description: '对应剖面图编号1，模型按左右位置拆分为两个木条构件。该木条位于图示左端，分解后查看它与窗框及墙面边缘的关系。',
  },
  {
    objectName: '右木条', name: '右木条', order: 6,
    thickness: '木条截面尺寸未标注', material: '木条',
    description: '与左木条同属剖面图编号1，位于图示右端的收口位置。分解后观察它与弹性密封胶、窗框及外墙的相对位置，并对照两侧木条的形状。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return windowWallGapSealingLayers.find(layer => canonicalName(layer.objectName) === name);
}
