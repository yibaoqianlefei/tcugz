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
    description: '位于结构板上方，为附加卷材和涂膜防水层提供基层。分解模型查看水平基层在墙根处的转折，以及它与嵌缝材料、墙面抹灰的连接。',
  },
  {
    objectName: '防水油膏嵌缝', name: '防水油膏嵌缝', order: 4,
    thickness: '缝宽与填嵌深度未标注', material: '防水油膏（图示）',
    description: '剖面图引线指向屋面板端与女儿墙根部的接缝。转动或分解模型观察这条嵌缝与结构板、墙体及上部防水层的相对位置。',
  },
  {
    objectName: '水泥砂浆抹灰', name: '水泥砂浆抹灰', order: 5,
    thickness: '厚度与砂浆配比未标注', material: '水泥砂浆（图示）',
    description: '沿女儿墙内侧形成表面基层，并在泛水收头附近转折。图纸标注为“水泥砂浆抹灰”；分解后查看抹灰面与墙体、附加卷材及压条的位置关系。',
  },
  {
    objectName: '附加卷材', name: '附加卷材', order: 6,
    thickness: '卷材厚度与品种未标注', material: '防水卷材（图示）',
    description: '沿墙根从水平屋面转向女儿墙立面，与涂膜防水层共同构成图示泛水。分解模型区分附加卷材与涂膜防水层，查看转角覆盖范围和上部收头。',
  },
  {
    objectName: '涂膜防水层', name: '涂膜防水层', order: 7,
    thickness: '泛水高度图示≥250 mm；涂膜厚度未标注', material: '防水涂膜（具体品种未标注）',
    description: '沿屋面及女儿墙内侧连续转折，上部由压条与水泥钉固定收头。所配剖面标注泛水高度≥250 mm；对照图纸观察涂膜、附加卷材和基层的层次。',
  },
  {
    objectName: '压条', name: '压条', order: 8,
    thickness: '截面与规格未标注', material: '压条（图纸未标明材质）',
    description: '位于立面防水层的上部收头处，与水泥钉配合固定。模型保留原文件的压条外观；分解后查看压条、防水层端部和墙面抹灰的连接。',
  },
  {
    objectName: '水泥钉', name: '水泥钉', order: 9,
    thickness: '钉长与固定间距未标注', material: '金属钉（模型示意）',
    description: '穿过收头处压条并固定于墙面，剖面图明确标注为“水泥钉”。分解模型观察其与压条、防水层和墙体的连接方向。',
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
