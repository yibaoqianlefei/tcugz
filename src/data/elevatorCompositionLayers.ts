import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

// Ten authored GLB objects. Several contain multiple material primitives;
// each object is one selectable group, not a list of independently modelled parts.
export const elevatorCompositionLayers: NodeLayerInfo[] = [
  {
    objectName: '井壁', name: '井壁', order: 1,
    thickness: '井道平面及层高尺寸见图 5-44；井壁做法按实际工程确定',
    material: '井道围护（具体材料及配筋未标注）',
    description: '沿竖向包围轿厢、导轨及对重所在空间，原模型保留开口以观察内部构造。对照图纸的井道平面与纵剖面，辨认井壁、楼层开口和机房的相对位置；展开时井壁向侧后方移开，便于查看设备。',
  },
  {
    objectName: '楼层平台', name: '楼层平台', order: 2,
    thickness: '图中楼层高、门口高等为本图示例尺寸（单位：mm）',
    material: '楼层平台及相接楼板（材料、配筋未单独注明）',
    description: '对应井道前侧各层到达面的水平构件，原模型将多层平台合并为一组。转动观察平台边缘、层门及轿厢入口之间的关系；展开时平台整体向井道外侧移开。',
  },
  {
    objectName: '底坑与缓冲器', name: '底坑与缓冲器', order: 3,
    thickness: '图中底坑尺寸为所示设备的示例，具体深度及缓冲器参数由设备资料确定',
    material: '底坑底板与缓冲装置组合（具体材料规格未标注）',
    description: '位于井道最下方，原模型将底坑底部、支承和缓冲器几何合并为一组。对照纵剖面中轿厢、对重下方的弹簧形示意，观察缓冲位置与井道底部的关系；展开动画使这一组向下移开。',
  },
  {
    objectName: '导轨和固定架', name: '导轨和固定架', order: 4,
    thickness: '固定导轨预埋件的位置及间距见配图，导轨规格未标注',
    material: '导轨与固定架组合（具体钢材及连接规格未标注）',
    description: '沿井道高度布置，固定架把导轨与井壁相联系。对照图中的导轨位置和局部固定详图，观察导轨、轿厢及对重的空间关系；展开时这一组保持原位，作为其他设备位置的参照。导轨与各固定架未分别建模。',
  },
  {
    objectName: '层门与门框', name: '层门与门框', order: 5,
    thickness: '图示净门宽 900、门口高 ≥2100（mm，仅为配图实例）',
    material: '层门和门框组合（材料及门系统性能未标注）',
    description: '位于楼层平台与井道的交界，原模型将各层门和门框合并显示。观察门框、平台完成面和轿厢入口的位置，对照配图中的平面净门宽与门口节点。展开时这一组向前移开；动画没有演示门扇启闭或门锁联动。',
  },
  {
    objectName: '电梯轿厢', name: '电梯轿厢', order: 6,
    thickness: '轿厢平面尺寸参见配图；轿壁、轿底及框架规格未标注',
    material: '轿厢及附属框架组合（具体材料规格未标注）',
    description: '位于井道内并与楼层门口相对应，是供乘客或货物承载使用的运载空间。原模型将轿厢围护、底部及相关框架组合成一个点选对象。展开时该组向上移动，用于辨认构件关系，不代表按真实停层过程运行。',
  },
  {
    objectName: '对重及悬挂', name: '对重及悬挂', order: 7,
    thickness: '对重尺寸、质量及悬挂规格未标注',
    material: '对重及悬挂组件（具体材料和配重参数未标注）',
    description: '位于轿厢侧后方的竖向设备区域，原模型将配重块、框架及相接几何合并为一组。转动并展开后，观察它与轿厢、导轨及上方绳索的关系。展开动画向后分离该组，不演示实际运行中轿厢与对重的联动。',
  },
  {
    objectName: '机房结构', name: '机房结构', order: 8,
    thickness: '图示机房及顶层空间为设备示例，楼板结构尺寸与配筋未标注',
    material: '机房结构构件（具体材料及配筋未标注）',
    description: '位于井道顶部，作为上部曳引设备所在部位的建筑结构参照。对照纵剖面中机房楼面、上方设备及井道顶层空间，辨认设备与建筑的分界；展开时保持原位。模型只表达这一示例的上置机房形式。',
  },
  {
    objectName: '曳引轮组', name: '曳引轮组', order: 9,
    thickness: '轮组、绳径及设备规格未标注',
    material: '曳引设备组合（具体设备及材料规格未标注）',
    description: '位于井道上部的曳引设备组合，名称采用最新模型的“曳引轮组”。对照顶部机房、轿厢和对重的位置，观察这一组设备与独立“绳索”构件的相对关系。点选时整组联动；展开动画使整组向上移开，不是实际曳引轮运行演示。',
  },
  {
    objectName: '绳索', name: '绳索', order: 10,
    thickness: '绳径、绳数及端部连接规格未标注',
    material: '绳索及附属几何（具体材料规格未标注）',
    description: '采用最新源文件中独立的“绳索”对象，与“曳引轮组”分开点选。转动观察绳索沿井道延伸、经过顶部设备并联系轿厢和对重区域的位置。展开动画中整组上移，用于分离观察，不演示真实运行中的绳索收放或张力变化。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return elevatorCompositionLayers.find(layer => canonicalName(layer.objectName) === name);
}
