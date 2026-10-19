import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

export const pileFoundationLayers: NodeLayerInfo[] = [
  {
    objectName: '桩', name: '桩', order: 1,
    thickness: '桩径、桩长及间距未标注', material: '混凝土（模型示意，配筋未展示）',
    description: '对应图8-10中的“桩柱”，位于承台板和承台梁下方。原模型将左右两种构造下的桩合并为同一构件组，点选时共同高亮。转动观察桩头与承台的连接位置；图纸未标明桩型、成桩工艺或地层。',
  },
  {
    objectName: '斜顶承台板', name: '斜顶承台板', order: 2,
    thickness: '承台尺寸与配筋未标注', material: '混凝土（模型示意，配筋未展示）',
    description: '对应图纸左侧的“承台板”，名称沿用原模型。上部连接柱，下部连接多根桩；转动查看倾斜顶面、柱脚及桩头的位置，对照承台把柱与桩联系起来的构造关系。',
  },
  {
    objectName: '墙下承台梁', name: '墙下承台梁', order: 3,
    thickness: '梁截面、跨度及配筋未标注', material: '混凝土（模型示意，配筋未展示）',
    description: '对应图纸右侧的“承台梁”，沿墙体下方延伸，并与下部桩相接。转动比较墙下承台梁与柱下承台板的形状、延伸方向及桩位；桩头连接细节未单独展示。',
  },
  {
    objectName: '柱', name: '柱', order: 4,
    thickness: '柱截面与配筋未标注', material: '混凝土（模型示意，配筋未展示）',
    description: '对应图纸左侧的“柱”，位于斜顶承台板上方。点选后对照柱脚、承台板和下部桩的位置，观察柱下桩基础的竖向连接关系。',
  },
  {
    objectName: '墙体', name: '墙体', order: 5,
    thickness: '墙厚与材料规格未标注', material: '墙体（具体材料未标注）',
    description: '对应图纸右侧的“墙”，沿墙下承台梁上方布置。转动查看墙底、承台梁和桩之间的相对位置，并与左侧柱下承台板构造进行比较。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return pileFoundationLayers.find(layer => canonicalName(layer.objectName) === name);
}
