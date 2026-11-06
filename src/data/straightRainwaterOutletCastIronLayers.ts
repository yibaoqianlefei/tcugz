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
    description: '从屋面沿口杯边缘独立转折。图中杯口内侧另有两条闭合斜带，按可见轮廓保留，其材料及与卷材的具体关系未定，不能将它们命名为新增防水层。',
  },
  {
    objectName: '屋面面层', name: '屋面面层', order: 4,
    thickness: '图中未标注', material: '混凝土外观（模型示意）',
    description: '位于屋面表面的构造层，围绕水落口形成收口。转动模型观察面层、环形嵌缝和中央进水开口之间的高低关系。',
  },
  {
    objectName: '油膏嵌缝', name: '油膏嵌缝', order: 5,
    thickness: '缝宽与填嵌深度未标注', material: '密封油膏（图示）',
    description: '原图油膏仅在落口周边局部嵌缝，与卷材转折、金属口杯分别表达。分解模型对照周边交接，不将局部密封或未定材料的斜带合并为完整防水层。',
  },
  {
    objectName: '铸铁水落口', name: '铸铁水落口', order: 6,
    thickness: '管径与壁厚未标注', material: '铸铁（模型对象名）',
    description: '结合原图观察两侧翻边、斜向口杯与下部短直管，保持通水腔留空。图纸未标管径、壁厚或制造连接，不能从模型长度、线宽或邻图6／100／6推定本口规格。',
  },
  {
    objectName: '镀锌钢丝球', name: '镀锌钢丝球', order: 7,
    thickness: '钢丝直径与网格间距未标注', material: '镀锌钢丝（图示）',
    description: '原图历史拦污构件，标注为“镀锌钢丝球”。对照其通透网格和进入喉部后分散终止的开放丝尾，再观察模型与落口的位置关系；本图不验证现行产品形式、排水能力或维护条件。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return straightRainwaterOutletCastIronLayers.find(layer => canonicalName(layer.objectName) === name);
}
