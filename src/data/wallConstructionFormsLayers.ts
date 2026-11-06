import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

export const wallConstructionFormsLayers: NodeLayerInfo[] = [
  {
    objectName: '实体墙', name: '实体墙', order: 1,
    thickness: '原图未标注墙厚',
    material: '墙身材料（具体品种与等级未标注）',
    description: '对应图2-3（a），墙身截面主体连续。与空体墙的内部空隙、组合墙的相邻材料层比较，辨认构造形式的差异；实体外形不直接说明墙体是否承重。',
  },
  {
    objectName: '空体墙', name: '空体墙', order: 2,
    thickness: '原图未标注墙厚、空隙尺寸与间距',
    material: '墙身材料及内部空隙（具体系统未标注）',
    description: '对应图2-3（b），墙身截面内留有空隙。观察空隙与周边实体的关系，并与实体墙比较；该局部图不说明孔洞沿墙面的连续范围，也不能仅凭空隙推定保温、隔声或承载性能。',
  },
  {
    objectName: '组合墙', name: '组合墙', order: 3,
    thickness: '原图未标注各层厚度与连接尺寸',
    material: '不同材料层组合（具体材料与功能未标注）',
    description: '对应图2-3（c），相邻层采用不同图案表达，示意多种材料组合成墙。对照模型观察层间界面；原图没有标明各层材料、连接或功能，不能直接把其中某层认定为保温层或承重层。',
  },
];

export function getWallConstructionFormsLayer(objectName: string): NodeLayerInfo | undefined {
  return wallConstructionFormsLayers.find(layer => canonicalName(layer.objectName) === canonicalName(objectName));
}
