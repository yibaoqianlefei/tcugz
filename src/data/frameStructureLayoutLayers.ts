import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

export const frameStructureLayoutLayers: NodeLayerInfo[] = [
  {
    objectName: '框架梁', name: '框架梁', order: 1,
    thickness: '梁截面、跨度及节点尺寸未标注',
    material: '框架梁示意构件（具体材料、强度与配筋未标注）',
    description: '对照图 2-7 中“框架梁”的标注，观察梁在两个方向连接柱列的布置，再沿梁端寻找柱的位置。源模型将各跨梁合为一个点选组，用于观察梁柱骨架；没有单独的楼板、钢筋或梁柱连接详图。',
  },
  {
    objectName: '框架柱', name: '框架柱', order: 2,
    thickness: '柱截面、柱距与层高未标注',
    material: '框架柱示意构件（具体材料、强度与配筋未标注）',
    description: '对照平面图中柱位的排列，观察框架柱与两向梁的交接及柱网形成的空间。各柱按源模型合为一个点选组，不逐根拆分；本模型未包含柱下基础、填充墙或多层结构。',
  },
];

export function getFrameStructureLayoutLayer(objectName: string): NodeLayerInfo | undefined {
  return frameStructureLayoutLayers.find(layer => canonicalName(layer.objectName) === canonicalName(objectName));
}
