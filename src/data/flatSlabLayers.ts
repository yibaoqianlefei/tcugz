import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

export const flatSlabLayers: NodeLayerInfo[] = [
  {
    objectName: '无梁楼板', name: '无梁楼板', order: 1,
    thickness: '板厚、柱截面及柱帽尺寸未标注',
    material: '钢筋混凝土（构造示意，配筋未展示）',
    description: '对照图3-7观察楼板、柱与柱顶扩大的柱帽，识别板直接支承于柱的连接形式。原模型将楼板、柱和柱帽合并为一个构件，支持整体点选及转动查看板底空间。图纸标注了柱帽位置，未给出板厚、柱帽尺寸或配筋。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return flatSlabLayers.find(layer => canonicalName(layer.objectName) === name);
}
