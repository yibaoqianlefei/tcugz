import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

/** Component identities follow the supplied GLB; annotations follow its section drawing. */
export const straightRainwaterOutlet65Layers: NodeLayerInfo[] = [
  {
    objectName: '钢筋混凝土屋面板', name: '钢筋混凝土屋面板', order: 1,
    thickness: '图中未标注', material: '钢筋混凝土（模型对象名）',
    description: '水落口穿过屋面结构板中的预留洞口。分解后观察板端、穿板管身和洞口周边砂浆之间的连接位置。',
  },
  {
    objectName: '1：2.5水泥砂浆', name: '1∶2.5 水泥砂浆', order: 2,
    thickness: '图示配比 1∶2.5，厚度未标注', material: '水泥砂浆',
    description: '剖面图标注为 1∶2.5 水泥砂浆，位于水落口与结构板洞口周边。观察砂浆填嵌位置及其与管身、防水卷材的接合。',
  },
  {
    objectName: '防水卷材', name: '防水卷材', order: 3,
    thickness: '图中未标注', material: '防水卷材（模型未标明品种）',
    description: '沿屋面铺设并在水落口周边转折收边。分解模型，对照剖面中防水层进入水落口周边的连续路径。',
  },
  {
    objectName: '屋面面层', name: '屋面面层', order: 4,
    thickness: '图中未标注', material: '混凝土外观（模型示意）',
    description: '围绕水落口布置的屋面表层。转动模型观察面层在进水口边缘的收口，以及它与油膏嵌缝、防水卷材的位置关系。',
  },
  {
    objectName: '油膏嵌缝', name: '油膏嵌缝', order: 5,
    thickness: '缝宽与填嵌深度未标注', material: '密封油膏（图示）',
    description: '剖面图的“油膏嵌缝”引线指向水落口边缘与屋面交接处。分解后可查看这一环形密封构件与周边面层的连接。',
  },
  {
    objectName: '铸铁水落口', name: '定型铸铁水落口', order: 6,
    thickness: '出口标注 100、两侧壁厚各 6（图示数值）', material: '铸铁',
    description: '上部承接进水罩，下部以直管形式穿过屋面结构板。图中标注“定型铸铁水落口”，底部横向尺寸为 100，两侧管壁各标注 6；转动模型观察漏斗形过渡与下部管口。',
  },
  {
    objectName: '65型铸铁进水罩', name: '65 型铸铁进水罩', order: 7,
    thickness: '罩体尺寸未标注', material: '铸铁（模型对象名）',
    description: '位于水落口顶部的独立进水罩，对应所配 65 型节点。播放分解动画可移开罩体，观察进水开口、罩体与下部铸铁水落口的搭接。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return straightRainwaterOutlet65Layers.find(layer => canonicalName(layer.objectName) === name);
}
