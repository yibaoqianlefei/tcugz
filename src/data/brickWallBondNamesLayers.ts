import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

export const brickWallBondNamesLayers: NodeLayerInfo[] = [
  {
    objectName: '顺砖', name: '顺砖', order: 1,
    thickness: '原图未标注砖规格与墙厚',
    material: '砖（图示未标明品种与强度等级）',
    description: '对照图2-17的“顺砖”引线，辨认长面朝向墙面的砖。展开模型后观察所示砖的长、宽方向及其与相邻丁砖的位置关系；顺砖是排列方向名称，不代表独立的砖材品种。',
  },
  {
    objectName: '丁砖', name: '丁砖', order: 2,
    thickness: '原图未标注砖规格与搭接尺寸',
    material: '砖（图示未标明品种与强度等级）',
    description: '对照图2-17的“丁砖”引线，辨认端面朝向墙面的砖，并与顺砖的长面比较。分解用于看清图示砖的方向，不能仅凭立面图推定墙厚方向的完整搭接或承载性能。',
  },
  {
    objectName: '砂浆', name: '砂浆', order: 3,
    thickness: '原图未标注横缝、竖缝宽度',
    material: '砌筑砂浆（配比与强度等级未标注）',
    description: '砖之间的砂浆形成灰缝：沿每皮砖水平延伸的是横缝，相邻砖端之间的是竖缝。对照图2-17分别追踪两类灰缝，观察上下皮竖缝错开的位置；图示不提供砂浆配比、强度等级或施工质量检验信息。',
  },
];

export function getBrickWallBondNamesLayer(objectName: string): NodeLayerInfo | undefined {
  return brickWallBondNamesLayers.find(layer => canonicalName(layer.objectName) === canonicalName(objectName));
}
