import type { NodeLayerConfig, NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

function lintelLayers(objectName: string, description: string): NodeLayerInfo[] {
  return [
    {
      objectName, name: objectName, order: 1,
      thickness: '过梁截面、跨度及配筋未标注', material: '钢筋混凝土（构造示意，配筋未展示）',
      description,
    },
    {
      objectName: '外围包覆层', name: '外围包覆层', order: 2,
      thickness: '包覆层厚度未标注', material: '包覆材料（具体品种未标注）',
      description: '名称沿用原模型，对应剖面中过梁及墙面周边的连续包覆部分。转动观察它在外挑边缘、过梁底面和墙面之间的转折；图纸未注明具体材料和厚度，不能仅凭纹理确定材料品种。',
    },
    {
      objectName: '墙', name: '墙', order: 3,
      thickness: '墙厚与材料规格未标注', material: '墙体（具体材料未标注）',
      description: '对应剖面图中过梁上方的墙体。转动观察墙体、过梁主体与外围包覆层的位置关系；模型为洞口上部的局部构造，未展示完整洞口及过梁两端的支承长度。',
    },
  ];
}

export const flushLintelLayers = lintelLayers('平墙过梁',
  '对照剖面中与墙身基本齐平的过梁截面，观察过梁主体、上部墙体及底面包覆层的关系。与带窗套、带窗楣过梁比较其外侧轮廓；图中的窗框仅作位置参照，原模型未单独建立窗框构件。');

export const windowSurroundLintelLayers = lintelLayers('带窗套过梁',
  '对照剖面观察过梁外侧与窗套相接的短突出部分，区分主体截面和外围包覆层。转动查看突出边缘与洞口上口的位置，并与平墙过梁、带窗楣过梁的轮廓比较；窗套未拆为独立构件。');

export const windowHoodLintelLayers = lintelLayers('带窗楣过梁',
  '对照剖面观察过梁向外延伸的窗楣部分，沿突出顶面、外缘和底面查看包覆关系。模型将过梁主体与窗楣合并为一个构件，可点选后转动观察整体形状；外挑尺寸和连接配筋未标注。');

export function rcLintelLayerConfig(layers: NodeLayerInfo[]): NodeLayerConfig {
  return {
    layers,
    getLayerInfo: objectName => {
      const name = canonicalName(objectName);
      return layers.find(layer => canonicalName(layer.objectName) === name);
    },
  };
}
