import type { NodeLayerConfig, NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

// Both source GLBs contain two named components and no animation clips.
// Railings and handrails are authored together, including material submeshes.
export const roundedStairStartLayers: NodeLayerInfo[] = [
  {
    objectName: '圆头踏步', name: '圆头踏步', order: 1,
    thickness: '踏步尺寸、面层厚度及内部构造未标注',
    material: '踏步本体（具体材料及配筋未标注）',
    description: '起步踏步的外端形成圆弧轮廓，后续踏步向上接续。对照图中的立体示意与下方平面，观察首级圆头、扶手起始立杆和通行一侧的相对位置。源模型将各级踏步合并为一组，点选时整体高亮；未将面层或内部结构单独建模。',
  },
  {
    objectName: '连续回弯扶手', name: '连续回弯扶手', order: 2,
    thickness: '平面图标有 45°；扶手截面、立杆间距与高度未标注',
    material: '扶手与栏杆组合（模型有木纹及金属外观，具体材质规格未标注）',
    description: '扶手沿梯段上升，并在起步端连续回弯，与下方立杆共同组成原模型中的一个构件。转动模型对照平面示意，观察回弯部分与圆头踏步外缘的关系；图中 45° 位于起步平面，不作为梯段坡度。扶手和立杆未拆成独立点选对象。',
  },
];

export const straightStairStartLayers: NodeLayerInfo[] = [
  {
    objectName: '直边踏步', name: '直边踏步', order: 1,
    thickness: '踏步宽高、面层厚度及内部构造未标注',
    material: '踏步本体（具体材料及配筋未标注）',
    description: '起步及后续踏步以直边轮廓向上接续。对照立体示意与下方平面，观察首级外缘、栏杆起始位置和梯段通行范围。源模型将各级踏步合并为一组，不支持逐级或按面层分别点选。',
  },
  {
    objectName: '下折回接扶手', name: '下折回接扶手', order: 2,
    thickness: '扶手截面、回接尺寸、立杆间距与高度未标注',
    material: '扶手与栏杆组合（模型有木纹及金属外观，具体材质规格未标注）',
    description: '扶手在梯段起步端向下折转，再回接起始立杆，形成与连续圆弧回弯不同的端部轮廓。转动模型观察折转段、回接位置及直边踏步之间的关系。原模型把扶手和栏杆立杆合并为一个构件，连接件及踏步内锚固未单独展示。',
  },
];

export function stairStartLayerConfig(layers: NodeLayerInfo[]): NodeLayerConfig {
  return {
    layers,
    getLayerInfo: objectName => {
      const name = canonicalName(objectName);
      return layers.find(layer => canonicalName(layer.objectName) === name);
    },
  };
}
