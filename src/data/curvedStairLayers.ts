import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

export const curvedStairLayers: NodeLayerInfo[] = [
  {
    objectName: '楼梯承重基础层', name: '楼梯承重基础层', order: 1,
    thickness: '结构层厚度及配筋未标注', material: '混凝土（按模型表达，强度等级未标注）',
    description: '名称沿用原模型，指踏步与面层下方的楼梯承重部分。转动观察弧形梯段的底面、踏步轮廓及平台连接；分解时该构件保持原位，便于对照上部各层。',
  },
  {
    objectName: '结合层', name: '结合层', order: 2,
    thickness: '结合层厚度未标注', material: '结合层（具体材料未标注）',
    description: '位于承重部分与木制面层之间，名称沿用原模型。分解后可观察其沿弧形梯段连续铺设的位置；模型纹理用于区分构件，不能据此认定其材料。',
  },
  {
    objectName: '木制面层', name: '木制面层', order: 3,
    thickness: '面层厚度及板材规格未标注', material: '木制面层（按原模型命名，树种未标注）',
    description: '沿弧形梯段和平台布置的表面构件。分解后对照承重部分与结合层，观察扇形踏步及内外侧边缘；图纸包含板1至板5的做法详图，原模型未按这些板号分别拆分。',
  },
  {
    objectName: '防滑条', name: '防滑条', order: 4,
    thickness: '图纸防滑条详图见右下区域', material: '图纸标注为金刚砂防滑条；模型纹理仅作区分',
    description: '位于各级踏步前缘，原模型将多道防滑条合并为同一构件。点选可整组联动，分解后观察其与木制面层的相对位置，并对照图纸中的金刚砂防滑条详图。',
  },
  {
    objectName: '地毯棍', name: '地毯棍', order: 5,
    thickness: '杆件直径、间距及固定件尺寸未标注', material: '杆件及端部固定件（具体材质未标注）',
    description: '名称沿用原模型，杆件沿踏步转角位置成组布置。转动或分解后查看杆身及端部固定件，参照图纸中“地毯棍卡”的标注；模型未单独包含地毯构件。',
  },
  {
    objectName: '弧形扶手', name: '弧形扶手', order: 6,
    thickness: '图纸扶手剖面标注 30、30（单位：mm）', material: '图纸标注水曲柳扶手，配 25×3 通长扁钢与 25 长木螺钉；模型材质名称为 M_538 系列，仅用于区分纹理',
    description: '沿弧形梯段外侧连续的扶手构件，随本版模型提供几何体。分解后观察它与木制面层、防滑条的相对位置；模型未表现通长扁钢、木螺钉及护脚，这些做法应结合图纸扶手剖面与护脚详图识读。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return curvedStairLayers.find(layer => canonicalName(layer.objectName) === name);
}
