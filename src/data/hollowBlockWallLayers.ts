import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

export const hollowBlockWallLayers: NodeLayerInfo[] = [
  {
    objectName: '空心砌块墙', name: '空心砌块墙', order: 1,
    thickness: '原图未标注块材规格、墙厚与灰缝宽度',
    material: '空心砌块与灰缝（具体材料等级未标注）',
    description: '对照图2-5，观察顶部砌块内部的孔洞、块壁及墙面上下皮的错缝排列。源模型将墙体合为一组，点选用于整体识别，不将孔壁、灰缝或单块砌块拆成独立卡片。原图没有说明灌芯、配筋或产品性能，不能由孔洞外形推定这些条件。',
  },
];

export function getHollowBlockWallLayer(objectName: string): NodeLayerInfo | undefined {
  return hollowBlockWallLayers.find(layer => canonicalName(layer.objectName) === canonicalName(objectName));
}
