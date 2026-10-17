import type { NodeLayerConfig, NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

export const timberTrussLayers: NodeLayerInfo[] = [
  {
    objectName: '木屋架', name: '木屋架', order: 1,
    thickness: '图示跨度6–12 m；杆件截面与连接规格未标注',
    material: '木材（模型示意，树种未标注）',
    description: '对照图纸识别两侧上弦、水平下弦和中间腹杆，观察屋脊、杆件交汇处及两端支座。所配图纸标注跨度6–12 m；原模型将整榀木屋架合并为一个构件，支持整体点选与转动观察，图纸未给出树种和连接件规格。',
  },
];

export const reinforcedConcreteTrussLayers: NodeLayerInfo[] = [
  {
    objectName: '钢筋混凝土屋架', name: '钢筋混凝土屋架', order: 1,
    thickness: '图示跨度15–24 m；杆件截面与配筋未标注',
    material: '钢筋混凝土（模型名称）',
    description: '对照图纸识别两侧倾斜的上弦、水平下弦和中间腹杆，观察各杆件围成的三角形空间及两端支座。所配图纸标注跨度15–24 m；原模型将整榀屋架合并为一个构件，点选后查看整体说明，可转动模型观察侧面厚度。',
  },
];

export const steelTimberTrussLayers: NodeLayerInfo[] = [
  {
    objectName: '钢木屋架', name: '钢木屋架', order: 1,
    thickness: '图示跨度12–18 m；杆件截面与连接规格未标注',
    material: '钢、木（模型材质示意）',
    description: '模型以木纹与金属两类表面表示钢木屋架，点选时联动整榀屋架说明。对照图纸观察上弦、下弦、腹杆与支座的组合；所配图纸标注跨度12–18 m，未逐根注明杆件材料、截面或连接件规格。',
  },
];

export function roofTrussLayerConfig(layers: NodeLayerInfo[]): NodeLayerConfig {
  return {
    layers,
    getLayerInfo: objectName => {
      const name = canonicalName(objectName);
      return layers.find(layer => canonicalName(layer.objectName) === name);
    },
  };
}
