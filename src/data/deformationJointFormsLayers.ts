import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

export const deformationJointFormsLayers: NodeLayerInfo[] = [
  {
    objectName: '平缝', name: '平缝', order: 1,
    thickness: '原图未标注缝宽与构件尺寸',
    material: '缝两侧构件及填缝示意（材料未标注）',
    description: '对应图 2-38（a），两侧边缘平直，缝线直接贯穿构件厚度。点选并转动模型，沿缝口辨认两侧边界；源模型将这一形式合为一个点选组。',
  },
  {
    objectName: '错缝', name: '错缝', order: 2,
    thickness: '原图未标注缝宽与错口尺寸',
    material: '缝两侧构件及填缝示意（材料未标注）',
    description: '对应图 2-38（b），两侧边缘形成错台，缝线随错口转折。对照平缝观察转折位置和两侧轮廓，模型按完整形式点选，不将错口拆成独立材料层。',
  },
  {
    objectName: '企口缝', name: '企口缝', order: 3,
    thickness: '原图未标注缝宽与企口尺寸',
    material: '缝两侧构件及填缝示意（材料未标注）',
    description: '对应图 2-38（c），一侧凸出、另一侧凹入，缝线沿企口轮廓转折。观察凹凸边缘之间保留的缝隙；图示仅比较几何形式，不给出位移能力或完整防水、防火做法。',
  },
];

export function getDeformationJointFormsLayer(objectName: string): NodeLayerInfo | undefined {
  return deformationJointFormsLayers.find(layer => canonicalName(layer.objectName) === canonicalName(objectName));
}
