import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

/** Keep the supplied static GLBs' component identities and the drawings' labels. */
export const slabFoundationLayers: NodeLayerInfo[] = [
  {
    objectName: '平板式筏板', name: '平板式筏板', order: 1,
    thickness: '板厚与配筋未标注', material: '混凝土（模型示意）',
    description: '连续的平板承接多根柱，所配图纸标注为“板”。转动模型观察筏板的整体边界、柱位分布及柱脚与板面的连接。',
  },
  {
    objectName: '柱', name: '柱', order: 2,
    thickness: '柱截面与高度未标注', material: '混凝土（模型示意）',
    description: '多根柱布置在同一块筏板上，将上部作用传至底板。点选柱组，对照图纸查看中部柱、边柱与板边之间的相对位置。',
  },
];

export const beamSlabFoundationLayers: NodeLayerInfo[] = [
  {
    objectName: '板', name: '基础底板', order: 1,
    thickness: '板厚与配筋未标注', material: '混凝土（模型示意）',
    description: '位于基础梁下方的连续底板，图纸标注为“板”。从侧面观察板、梁和柱的高低关系，区分整块底板与上部梁格。',
  },
  {
    objectName: '梁', name: '基础梁', order: 2,
    thickness: '梁截面与配筋未标注', material: '混凝土（模型示意）',
    description: '基础梁沿柱列布置并在柱位附近相交，与底板共同组成梁板式基础。转动模型可观察梁格的两个方向及梁、柱、板的连接位置。',
  },
  {
    objectName: '柱', name: '柱', order: 3,
    thickness: '柱截面与高度未标注', material: '混凝土（模型示意）',
    description: '柱位于基础梁的交接位置，上部柱与梁板体系相连。结合图中“柱”“梁”“板”标注，沿柱脚识别各部分的连接。',
  },
];

export const boxFoundationLayers: NodeLayerInfo[] = [
  {
    objectName: '板', name: '箱形基础底板', order: 1,
    thickness: '底板厚度与配筋未标注', material: '混凝土（模型示意）',
    description: '位于箱体底部，承接内外墙并构成连续底面，对应图中的“底板”。转动模型查看底板与墙体下端的连接及箱体的整体范围。',
  },
  {
    objectName: '内外墙', name: '箱形基础内外墙', order: 2,
    thickness: '墙厚与配筋未标注', material: '混凝土（模型示意）',
    description: '外墙围合箱体边界，内墙分隔出内部格室，并连接上下板。图纸以局部剖开方式展示内部空间，可与模型的墙体布置相互对照。',
  },
  {
    objectName: '顶板及梁', name: '箱形基础顶板及梁', order: 3,
    thickness: '板厚、梁截面与配筋未标注', material: '混凝土（模型示意）',
    description: '位于箱体上部，与内外墙及底板共同形成空间整体。模型将顶板和梁作为同一构件组，结合图中“顶板”“梁”的标注观察它们的相对位置。',
  },
  {
    objectName: '柱', name: '柱', order: 4,
    thickness: '柱截面与高度未标注', material: '混凝土（模型示意）',
    description: '从箱体上部伸出的柱组，与箱形基础上部构造相接。点选柱组后，转动模型观察柱脚、顶板和墙体之间的对应位置。',
  },
];

export const columnCrossFoundationLayers: NodeLayerInfo[] = [
  {
    objectName: '十字交叉条基', name: '柱下十字交叉条基', order: 1,
    thickness: '条基宽度、高度与配筋未标注', material: '混凝土（模型示意）',
    description: '两个方向的连续条基相交形成网格，柱位于交叉处。对照图纸观察条基的连续方向、交叉节点以及格间留空的位置。',
  },
  {
    objectName: '柱', name: '柱', order: 2,
    thickness: '柱截面与高度未标注', material: '混凝土（模型示意）',
    description: '柱组布置在纵横条基的交叉位置。转动模型，对照各排柱与两个方向条基的连接，识别边部和中部交叉节点。',
  },
];

export const columnStripFoundationLayers: NodeLayerInfo[] = [
  {
    objectName: '条基与近端连接梁', name: '柱下条基与近端连接梁', order: 1,
    thickness: '条基与连接梁截面、配筋未标注', material: '混凝土（模型示意）',
    description: '几道平行条基沿柱列延伸，近端以横向连接梁相连。模型将条基和近端连接梁作为一组，可对照图纸查看条基走向、端部连接与柱脚位置。',
  },
  {
    objectName: '柱', name: '柱', order: 2,
    thickness: '柱截面与高度未标注', material: '混凝土（模型示意）',
    description: '各排柱沿对应的条形基础布置。点选柱组并转动模型，沿单排柱脚追踪连续条基，比较相邻平行条基之间的关系。',
  },
];

export function foundationLayerConfig(layers: NodeLayerInfo[]) {
  return {
    layers,
    getLayerInfo: (objectName: string) => layers.find(layer => canonicalName(layer.objectName) === canonicalName(objectName)),
  };
}
