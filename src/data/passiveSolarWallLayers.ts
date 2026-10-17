import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

/** Component names follow the supplied GLB; dimensions follow the section drawing. */
export const passiveSolarWallLayers: NodeLayerInfo[] = [
  {
    objectName: '外侧玻璃', name: '外侧玻璃', order: 1,
    thickness: '图示玻璃厚3 mm', material: '玻璃；边框随模型组合显示',
    description: '位于空气间层的外侧，剖面图从左至右的第一层标注为“3厚玻璃”。模型把玻璃和周边框边组合为同一构件；分解后观察玻璃与空气间层、墙体之间的位置。',
  },
  {
    objectName: '空气间层', name: '空气间层', order: 2,
    thickness: '图示厚80 mm', material: '空气',
    description: '模型以半透明区域表示玻璃与薄钢板之间的空气空间，剖面图标注为“80厚空气层”。分解后对照上下孔口，观察空气间层沿墙面延伸及与孔口相接的位置。',
  },
  {
    objectName: '薄钢板', name: '薄钢板', order: 3,
    thickness: '图示厚0.5 mm', material: '薄钢板',
    description: '位于空气间层与矿棉保温层之间，剖面图标注为“0.5厚薄钢板”。分解模型可将薄板与前后的空气空间、保温层区分开，观察它在上下孔口附近的轮廓。',
  },
  {
    objectName: '矿棉保温层', name: '矿棉保温层', order: 4,
    thickness: '图示厚30 mm', material: '矿棉',
    description: '位于薄钢板与外围护墙之间，剖面图标注为“30厚矿棉保温层”。分解后查看保温层与墙体的层次，以及它在上下孔口处的布置。',
  },
  {
    objectName: '外围护墙', name: '外围护墙', order: 5,
    thickness: '墙厚与楼板厚度未标注', material: '墙体及楼板（具体材料未标注）',
    description: '作为各层构造和上下孔口的定位参照，在分解动画中保持固定。模型将墙体与楼板交接部分合并显示，可转动观察孔口、墙身和楼板之间的关系。',
  },
  {
    objectName: '上部进风口', name: '上部进风口', order: 6,
    thickness: '孔口图示120×240 mm（200×300 mm）', material: '孔口构件（具体材料未标注）',
    description: '对应剖面图中上侧孔口，名称沿用原模型“上部进风口”。图中标注为120×240（200×300），单位为mm；分解后观察孔口构件与空气间层、墙体及上侧抹灰的相对位置。',
  },
  {
    objectName: '下部出风口', name: '下部出风口', order: 7,
    thickness: '孔口图示120×240 mm（200×300 mm）', material: '孔口构件（具体材料未标注）',
    description: '对应剖面图中下侧孔口，名称沿用原模型“下部出风口”。图中标注为120×240（200×300），单位为mm；分解后对比上下孔口的高度与它们连接空气间层的位置。',
  },
  {
    objectName: '上侧内墙抹灰', name: '上侧内墙抹灰', order: 8,
    thickness: '图中未标注', material: '抹灰材料（具体品种未标注）',
    description: '位于室内侧的上部墙面，图纸统一标注为“内墙抹灰”，模型按上下部位拆分。分解后观察上部孔口边缘、墙体与抹灰面的收口关系。',
  },
  {
    objectName: '下侧内墙抹灰', name: '下侧内墙抹灰', order: 9,
    thickness: '图中未标注', material: '抹灰材料（具体品种未标注）',
    description: '位于室内侧的下部墙面，与上侧内墙抹灰共同对应图中的室内面层。分解后观察下部孔口周边和下侧抹灰的连接，并对照墙身、楼板的交接位置。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return passiveSolarWallLayers.find(layer => canonicalName(layer.objectName) === name);
}
