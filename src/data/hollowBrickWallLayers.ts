import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

export const hollowBrickWallLayers: NodeLayerInfo[] = [
  {
    objectName: '侧砌普通砖', name: '侧砌普通砖', order: 1,
    thickness: '原图未标注砖规格、墙厚与空腔宽度',
    material: '普通砖（模型对象名，品种与强度未标注）',
    description: '对照图2-4两向墙段中侧立的砖，观察它们围合空腔的位置。这里的空心来自砖的组砌与围合，不是将整面墙理解为一种自带孔洞的砖产品。转动模型观察内外侧砖面和顶部空腔边缘。',
  },
  {
    objectName: '横向拉结砖', name: '横向拉结砖', order: 2,
    thickness: '原图未标注拉结间距与搭接尺寸',
    material: '砖（模型对象名）',
    description: '模型以“横向拉结砖”命名跨接空腔两侧的砖。点选后观察其与侧砌砖的交接、顶部格状空腔及不同高度处的位置；图示不提供工程拉结间距或承载依据。',
  },
  {
    objectName: '转角平砌砖', name: '转角平砌砖', order: 3,
    thickness: '原图未标注转角搭接尺寸',
    material: '砖（模型对象名）',
    description: '位于两向墙段相交的转角处，以平砌砖形成局部联系。与两侧侧砌砖对照，观察转角处的排列与上下皮关系；本局部图不表示整墙的完整配筋、拉结设计或使用条件。',
  },
];

export function getHollowBrickWallLayer(objectName: string): NodeLayerInfo | undefined {
  return hollowBrickWallLayers.find(layer => canonicalName(layer.objectName) === canonicalName(objectName));
}
