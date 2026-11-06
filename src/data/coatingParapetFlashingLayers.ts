import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

/** Preserve source GLB identities; dimensions refer only to the supplied section. */
export const coatingParapetFlashingLayers: NodeLayerInfo[] = [
  {
    objectName: '屋面结构板', name: '屋面结构板', order: 1,
    thickness: '板厚与配筋未标注', material: '混凝土外观（模型示意）',
    description: '位于屋面找平基层下方，模型将结构板与女儿墙分别建模。分解后观察板端、墙根与防水油膏嵌缝的位置；图纸未标注板厚、配筋及支承方式。',
  },
  {
    objectName: '女儿墙墙体', name: '女儿墙墙体', order: 2,
    thickness: '墙厚未标注', material: '墙体（具体材料未标注）',
    description: '提供屋面防水层上翻的竖向基层。对照剖面观察墙根、抹灰面、压条和防水收头之间的关系；图纸未标注墙体材料和墙厚。',
  },
  {
    objectName: '屋面找平基层', name: '屋面找平基层', order: 3,
    thickness: '厚度与转角尺寸未标注', material: '找平材料（具体品种未标注）',
    description: '位于结构板上方，图中基层外为连续涂膜，附加卷材在涂膜外侧局部覆盖。分解模型分别观察基层、涂膜与卷材，再对照墙根转角和板端嵌缝。',
  },
  {
    objectName: '防水油膏嵌缝', name: '防水油膏嵌缝', order: 4,
    thickness: '缝宽与填嵌深度未标注', material: '防水油膏（图示）',
    description: '剖面图引线指向墙与屋面板端接缝上部的局部油膏。转动或分解模型对照其与结构板、墙体及上部防水的相对位置，不将局部嵌缝读成满屋面材料层。',
  },
  {
    objectName: '水泥砂浆抹灰', name: '水泥砂浆抹灰', order: 5,
    thickness: '厚度与砂浆配比未标注', material: '水泥砂浆（图示）',
    description: '沿女儿墙内侧形成表面基层，并在泛水收头附近转折。图纸标注为“水泥砂浆抹灰”；分解后查看抹灰面与墙体、附加卷材及压条的位置关系。',
  },
  {
    objectName: '附加卷材', name: '附加卷材', order: 6,
    thickness: '卷材厚度与品种未标注', material: '防水卷材（图示）',
    description: '位于连续涂膜外侧，沿墙根转角局部覆盖，并在屋面一侧终止。对照图纸分别追踪卷材边界与继续延伸的涂膜；图中未给卷材规格、实厚或完整屋面设防。',
  },
  {
    objectName: '涂膜防水层', name: '涂膜防水层', order: 7,
    thickness: '原图相邻竖向投影≥250、60 mm；材料测界未核定，涂膜厚度未标注', material: '防水涂膜（具体品种未标注）',
    description: '在基层外沿屋面与墙根连续转折至槽内收头，外侧另有局部附加卷材。≥250与60分别保留原图相邻尺寸段，不能将其解释为已核定的工程材料测点或通用高度；局部旧图不验证完整设防。',
  },
  {
    objectName: '压条', name: '压条', order: 8,
    thickness: '截面与规格未标注', material: '压条（图纸未标明材质）',
    description: '位于墙槽内的防水收头处，与斜向水泥钉分别表达。对照图纸观察压条、涂膜端部和墙体凹槽；本节点没有高低屋面图中的外部钢板盖缝。',
  },
  {
    objectName: '水泥钉', name: '水泥钉', order: 9,
    thickness: '钉长与固定间距未标注', material: '金属钉（模型示意）',
    description: '原图斜向水泥钉穿过槽内压条并进入墙体，钉与压条单独表达。分解模型对照连接方向；规格、间距和锚固参数未给定。',
  },
  {
    objectName: '外侧抹灰', name: '外侧抹灰', order: 10,
    thickness: '图中未标注', material: '抹灰材料（具体品种未标注）',
    description: '位于女儿墙外侧，与内侧泛水构造分开建模。转动模型比较墙体两侧面层的位置，分解后观察外侧抹灰和墙体之间的层次。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return coatingParapetFlashingLayers.find(layer => canonicalName(layer.objectName) === name);
}
