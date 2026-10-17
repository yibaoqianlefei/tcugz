import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

/** Names follow the supplied GLB; the wire guard and mortar ratio are labelled in the section. */
export const straightRainwaterOutletCastIronLayers: NodeLayerInfo[] = [
  {
    objectName: '钢筋混凝土屋面板', name: '钢筋混凝土屋面板', order: 1,
    thickness: '图中未标注', material: '钢筋混凝土（模型对象名）',
    description: '屋面的承重基层，在直管式水落口处留出贯穿洞口。分解后查看洞口周边结构板、管身和填嵌砂浆的关系。',
  },
  {
    objectName: '1：2.5水泥砂浆', name: '1∶2.5 水泥砂浆', order: 2,
    thickness: '图示配比 1∶2.5，厚度未标注', material: '水泥砂浆',
    description: '剖面标注为 1∶2.5 水泥砂浆，布置在水落口穿板处及周边基层。结合分解模型观察它对管身周边空隙的填嵌与屋面转角处的衔接。',
  },
  {
    objectName: '防水卷材', name: '防水卷材', order: 3,
    thickness: '图中未标注', material: '防水卷材（模型未标明品种）',
    description: '从水平屋面延伸至水落口周边的防水构造。对照剖面查看卷材在凹口边缘的转折及其与铸铁管口的接合位置。',
  },
  {
    objectName: '屋面面层', name: '屋面面层', order: 4,
    thickness: '图中未标注', material: '混凝土外观（模型示意）',
    description: '位于屋面表面的构造层，围绕水落口形成收口。转动模型观察面层、环形嵌缝和中央进水开口之间的高低关系。',
  },
  {
    objectName: '油膏嵌缝', name: '油膏嵌缝', order: 5,
    thickness: '缝宽与填嵌深度未标注', material: '密封油膏（图示）',
    description: '剖面图标注的油膏嵌缝位于水落口周边交接处。分解后查看环形密封位置及其与屋面面层、防水卷材的关系。',
  },
  {
    objectName: '铸铁水落口', name: '铸铁水落口', order: 6,
    thickness: '管径与壁厚未标注', material: '铸铁（模型对象名）',
    description: '承接屋面来水，并通过穿过结构板的竖向管口向下排水。结合剖面观察上部进水开口、周边防水收边和下部直管之间的连接。',
  },
  {
    objectName: '镀锌钢丝球', name: '镀锌钢丝球', order: 7,
    thickness: '钢丝直径与网格间距未标注', material: '镀锌钢丝（图示）',
    description: '设置在水落口上方的球形钢丝网罩，图中标注为“镀锌钢丝球”。转动模型查看通透网格和下部收束形态；分解后可观察罩体与水落口开口的相对位置。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return straightRainwaterOutletCastIronLayers.find(layer => canonicalName(layer.objectName) === name);
}
