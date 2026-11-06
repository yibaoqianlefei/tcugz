import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

export const castIronRainwaterOutletLayers: NodeLayerInfo[] = [
  {
    objectName: '铸铁水落口', name: '铸铁水落口', order: 1,
    thickness: '原图未单独标注本体壁厚与出口尺寸',
    material: '铸铁（原图标题与模型对象名）',
    description: '对应图 6-22 左侧立体图中的水落口本体。观察入口边框、口腔与向下转折的出口，再分解模型查看它与L形格栅的装配关系。原图没有展示周边墙体、屋面防水及下接管道，不能由本体外形推定这些接口做法。',
  },
  {
    objectName: 'L形铸铁格栅', name: 'L形铸铁格栅', order: 2,
    thickness: '右侧详图标有 215、160、45、10（单位：mm）',
    material: '铸铁（模型对象名）',
    description: '格栅位于水落口入口处，右侧正视与侧视图表达竖向栅条、边框和L形转折。对照原图尺寸线辨认各段标注，分解后观察格栅与本体的相对位置及清理通道。尺寸仅属于给定图例，不据此推定净过水面积、排水能力或本体规格。',
  },
];

export function getCastIronRainwaterOutletLayer(objectName: string): NodeLayerInfo | undefined {
  return castIronRainwaterOutletLayers.find(layer => canonicalName(layer.objectName) === canonicalName(objectName));
}
