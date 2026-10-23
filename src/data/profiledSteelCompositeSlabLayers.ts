import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

export const profiledSteelCompositeSlabLayers: NodeLayerInfo[] = [
  {
    objectName: '焊接H形钢梁', name: '焊接H形钢梁', order: 1,
    thickness: '钢梁截面及焊缝尺寸未标注', material: '钢材（牌号未标注）',
    description: '对应图3-3左侧板下的钢梁。转动模型观察H形截面、上翼缘与压型钢板的相接位置；分解时钢梁保留在原位，便于对照其他构件。',
  },
  {
    objectName: '压型钢板', name: '压型钢板', order: 2,
    thickness: '板厚未标注，截面形状参见配图', material: '压型钢板（钢材牌号未标注）',
    description: '对应图中带有连续凹凸肋的钢板。分解后可观察板面的折形、板底与钢梁上翼缘的位置，再与右侧剖面中的板肋形状对照。',
  },
  {
    objectName: '抗剪栓钉', name: '抗剪栓钉', order: 3,
    thickness: '栓钉直径、高度及间距未标注', material: '钢制栓钉（规格未标注）',
    description: '对应图中钢梁上方成排布置的带头栓钉。分解模型可查看栓钉与钢梁、压型钢板及混凝土的相对位置；原模型将各个栓钉合并为同一构件，点选时整组联动。',
  },
  {
    objectName: '混凝土', name: '混凝土', order: 4,
    thickness: '截面尺寸参见配图，模型不作为量测依据', material: '混凝土（强度等级未标注）',
    description: '对应图中压型钢板上方的混凝土部分。通过分解查看其与板肋、抗剪栓钉的空间关系。图纸右侧还标有主筋和二次配筋，但原模型未将这些钢筋单独建模。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return profiledSteelCompositeSlabLayers.find(layer => canonicalName(layer.objectName) === name);
}
