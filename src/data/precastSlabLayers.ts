import type { NodeLayerConfig, NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

function wall(): NodeLayerInfo {
  return {
    objectName: '墙', name: '墙', order: 1,
    thickness: '墙厚与材料规格未标注', material: '墙体（具体材料未标注）',
    description: '对应图纸左侧的墙体部分。转动模型观察墙体、墙内梁及预制板端的相对位置，并对照支承处的剖面；图纸未给出墙体材料和厚度。',
  };
}

function beam(objectName: string, description: string, order = 2): NodeLayerInfo {
  return {
    objectName, name: objectName, order,
    thickness: '梁截面与支承长度未标注', material: '钢筋混凝土（构造示意，配筋未展示）',
    description,
  };
}

function slab(objectName: string, description: string, order = 4): NodeLayerInfo {
  return {
    objectName, name: objectName, order,
    thickness: '板厚、跨度及配筋未标注', material: '预制钢筋混凝土（构造示意）',
    description,
  };
}

function wallBeam(): NodeLayerInfo {
  return beam('墙内梁', '位于墙体与预制板端的交接处，名称沿用原模型。对照剖面观察板端与梁的支承关系，并与中梁的位置进行比较；支承长度、梁截面和连接配筋未标注。');
}

function middleBeam(): NodeLayerInfo {
  return beam('中梁', '位于模型中部的板下支承位置。对照图纸观察两侧板端与中梁的关系，转动查看梁底和板底的高差；模型未单独展示连接钢筋或板缝材料。', 3);
}

export const precastFlatSlabLayers: NodeLayerInfo[] = [
  wall(), wallBeam(), middleBeam(),
  slab('平板', '实心平板构件，对应图中的薄板截面和下方板形示意。转动模型观察板面、板底及板端与墙内梁、中梁的连接位置；板厚、跨度与配筋以实际设计为准，所配图纸未标注。'),
];

export const precastHollowSlabLayers: NodeLayerInfo[] = [
  wall(), wallBeam(), middleBeam(),
  slab('空心板', '对应图纸中带孔的板截面。转动模型从板端观察孔洞的形状及其沿板长方向延伸的位置，再对照墙内梁和中梁处的支承；孔径、板厚、配筋及孔端处理未标注。'),
];

export const precastUprightChannelSlabLayers: NodeLayerInfo[] = [
  wall(),
  beam('墙内梁-右侧挑肩支承', '名称沿用原模型，梁在墙体右侧形成挑肩支承。对照剖面观察槽形板端部与挑肩的位置，转动查看梁与墙体的交接；挑肩尺寸、支承长度和连接配筋未标注。'),
  slab('正放槽形板', '对应图纸所示的正放槽形板：板面在上、槽口朝下，板底可见肋部。转动模型观察板底槽形及板端支承，与倒放槽形板的开口方向进行比较。', 3),
];

export const precastInvertedChannelSlabLayers: NodeLayerInfo[] = [
  wall(),
  beam('墙内梁-左外挑直角支承', '名称沿用原模型，梁在墙体左侧形成外挑直角支承。对照剖面观察倒放槽形板端部与支承台阶的相接位置；图纸未给出梁截面、支承长度或连接配筋。'),
  slab('倒放槽形板', '对应图纸下方的板形示意，槽口朝上、板底较平。模型将槽形板与槽内填料、上部平整层分开建模，可分别点选并转动查看肋部、填料和板端支承的位置。', 3),
  {
    objectName: '填料', name: '填料', order: 4,
    thickness: '填料厚度未标注', material: '填料（具体品种未标注）',
    description: '位于倒放槽形板的槽内，对应剖面中板肋之间的填充部分。图纸及原模型未注明填料品种；显示纹理仅用于区分构件，不能据此确定材料。',
  },
  {
    objectName: '平整层', name: '平整层', order: 5,
    thickness: '平整层厚度未标注', material: '平整层（具体材料未标注）',
    description: '位于倒放槽形板和填料上方，名称沿用原模型。对照剖面观察连续面层与板肋、槽内填料的上下关系；厚度、材料及是否参与受力均未标注。',
  },
];

export function precastSlabLayerConfig(layers: NodeLayerInfo[]): NodeLayerConfig {
  return {
    layers,
    getLayerInfo: objectName => {
      const name = canonicalName(objectName);
      return layers.find(layer => canonicalName(layer.objectName) === name);
    },
  };
}
