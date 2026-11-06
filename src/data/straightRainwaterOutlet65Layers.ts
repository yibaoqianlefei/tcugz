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
    description: '原图1∶2.5为砂浆实例标注，引线位于板洞边与金属管体之间。观察砂浆、管壁和防水卷材分别占据的位置；未给出的洞口、砂浆厚度与产品连接不据图形比例补定。',
  },
  {
    objectName: '防水卷材', name: '防水卷材', order: 3,
    thickness: '图中未标注', material: '防水卷材（模型未标明品种）',
    description: '沿屋面在板洞和口杯周边独立转折。分解模型后对照图纸，分别追踪卷材与相邻金属边界；卷材厚度、伸入长度和制造连接未给定。',
  },
  {
    objectName: '屋面面层', name: '屋面面层', order: 4,
    thickness: '图中未标注', material: '混凝土外观（模型示意）',
    description: '围绕水落口布置的屋面表层。转动模型观察面层在进水口边缘的收口，以及它与油膏嵌缝、防水卷材的位置关系。',
  },
  {
    objectName: '油膏嵌缝', name: '油膏嵌缝', order: 5,
    thickness: '缝宽与填嵌深度未标注', material: '密封油膏（图示）',
    description: '原图油膏沿屋面与铸铁凸缘两侧局部收口，模型将周边嵌缝作为独立构件。分解后对照面层、卷材与金属边缘，不把局部密封当作完整防水系统。',
  },
  {
    objectName: '铸铁水落口', name: '定型铸铁水落口', order: 6,
    thickness: '原图下口6／100／6 mm，分别为两壁及中间净空的实例', material: '铸铁（模型构件）',
    description: '观察模型的口杯过渡与下接管。原图“定型铸铁水落口”引线指向上部Y形剖切构件，不能与模型分件及此卡名称直接等同；下口6／100／6分别标示两侧壁厚与中间净空，不代表全部产品规格。',
  },
  {
    objectName: '65型铸铁进水罩', name: '65 型铸铁进水罩', order: 7,
    thickness: '原图未提供65型规格或罩体尺寸', material: '铸铁（沿用模型对象名）',
    description: '位于模型顶部的独立可选构件，保留“65型铸铁进水罩”既有别名。65型命名出处未核定，不等于DN65，也不替代原图100mm净空；原图上部构件的实标与模型命名分别辨认，动画仅用于观察分件关系。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return straightRainwaterOutlet65Layers.find(layer => canonicalName(layer.objectName) === name);
}
