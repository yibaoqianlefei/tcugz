import type { NodeLayerConfig, NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

function component(objectName: string, order: number, description: string): NodeLayerInfo {
  return {
    objectName, name: objectName, order,
    thickness: '布置示意；截面尺寸、跨度与连接详图未标注',
    material: `${objectName}示意构件（具体材料、强度及配筋未标注）`,
    description,
  };
}

// Each source is a static model. Repeated walls, beams or slabs are grouped
// exactly as authored, rather than presented as individually selectable pieces.
export const semiFrameBearingLayers: NodeLayerInfo[] = [
  component('楼板', 1, '对照平面图的楼板排列，观察板端与横向梁、外围墙体的相对位置，再沿梁找到柱的位置。源模型中的楼板为一个点选组，未逐块拆分。'),
  component('横向梁', 2, '结合图中“梁”的标注，观察横向梁与楼板、内部柱列及外围墙体的连接位置。梁端支承与节点连接需结合详图判断，本模型展示整体布置。'),
  component('柱', 3, '对照平面图中的内部柱列，观察柱与横向梁的上下衔接及其对室内空间的组织。各柱在源模型中合为一组，不包含柱下基础或钢筋细节。'),
  component('墙体', 4, '对照外纵墙与山墙，观察外围墙体与内部梁柱共同构成的布置。墙体按源模型整组点选；其承重身份应结合配图与支承关系识读，不能由显示颜色判断。'),
];

export const transverseWallBearingLayers: NodeLayerInfo[] = [
  component('楼板', 1, '对照平面图中楼板的排列方向，观察板端与横墙的支承关系，区分墙间房间与中部通道。楼板按源模型整组点选，板缝与连接件未单独建模。'),
  component('墙体', 2, '对照图中“横墙”位置，观察重复布置的横向墙段、洞口及其与外围墙体的交接。所有墙段合为一个点选组，未分别标定承重墙与其他墙段。'),
  component('横向梁', 3, '对照图中“梁”的位置，观察通道附近梁与相邻墙段及楼板的衔接。配图和模型用于布置识读，不提供梁端锚固、配筋或截面设计。'),
];

export const twoWayWallBearingLayers: NodeLayerInfo[] = [
  component('楼板', 1, '对照不同房间内楼板排列方向的变化，分别寻找其邻接的纵墙、横墙或梁。这里展示分区支承的布置，不代表每块板均按双向板工作。'),
  component('墙体', 2, '结合图中外纵墙、内纵墙、横墙和山墙的标注，观察两向墙体的交接与房间分区。源模型将墙体合并，点选时整体高亮，不逐段区分其结构角色。'),
  component('横向梁', 3, '对照平面图局部标注的梁，观察其在墙段之间的位置及与楼板的邻接关系。将局部梁与两向墙体一起识读，连接和配筋以相应详图为准。'),
];

export const longitudinalWallBearingLayers: NodeLayerInfo[] = [
  component('楼板', 1, '对照图中楼板排列，观察楼板与外纵墙、内纵墙之间的支承位置。转动模型查看板端与墙顶的关系；楼板合并为一个点选组。'),
  component('墙体', 2, '结合图中外纵墙、内纵墙和横墙标注，比较沿建筑长向的墙段与横向分隔位置。源模型没有逐段拆分或标注受力身份，应结合支承关系识读，不能仅凭墙的方向或厚薄判断。'),
];

export function wallBearingLayoutConfig(layers: NodeLayerInfo[]): NodeLayerConfig {
  return {
    layers,
    getLayerInfo: objectName => layers.find(layer => canonicalName(layer.objectName) === canonicalName(objectName)),
  };
}
