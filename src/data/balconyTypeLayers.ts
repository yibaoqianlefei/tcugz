import type { NodeLayerConfig, NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

type BalconyType = '挑阳台' | '半凸半凹阳台' | '凹阳台';
const positions: Record<BalconyType, string> = {
  '挑阳台': '阳台空间向外突出于相邻外墙基准',
  '半凸半凹阳台': '阳台空间一部分突出、一部分退入相邻外墙基准',
  '凹阳台': '阳台空间退入相邻外墙基准以内',
};

export function balconyTypeLayerConfig(type: BalconyType): NodeLayerConfig {
  const layers: NodeLayerInfo[] = [
    {
      objectName: '主体墙', name: '主体墙', order: 1,
      thickness: '原图未标注墙厚', material: '墙体示意（材料与受力身份未标注）',
      description: `对照${type}平面图，先沿两侧外墙确定比较凹凸关系的基准：${positions[type]}。模型对象名为主体墙，表示墙体所在位置，不据此认定其为承重墙；支承与连接仍需结构资料。`,
    },
    {
      objectName: '楼板', name: '楼板', order: 2,
      thickness: '原图未标注板厚、跨度与配筋', material: '板体示意（具体结构材料未标注）',
      description: `观察${type}的板面范围与主体墙、临空栏板之间的关系。${positions[type]}；空间位置分类不直接决定板的支承方式，模型没有给出完整支座、配筋或根部锚固。`,
    },
    {
      objectName: '栏板', name: '栏板', order: 3,
      thickness: '原图未标注栏板厚度、高度与锚固', material: '栏板示意（材料与连接未标注）',
      description: '沿阳台临空边缘辨认栏板，与楼板边缘和两侧墙体对照。平面示意说明防护边界的位置，三维外形不作为防护高度、承载、锚固或防攀爬性能的验证。',
    },
    {
      objectName: '窗', name: '窗', order: 4,
      thickness: '原图未标注窗规格与框墙接缝', material: '窗构件示意（材料与开启方式未标注）',
      description: '模型以“窗”命名这一组，包含窗框与窗面。观察它在阳台内侧墙面的开口位置；原图没有完整门窗表、开启标注或框墙节点，不从平面线型推定窗型和安装做法。',
    },
  ];
  return { layers, getLayerInfo: name => layers.find(layer => canonicalName(layer.objectName) === canonicalName(name)) };
}
