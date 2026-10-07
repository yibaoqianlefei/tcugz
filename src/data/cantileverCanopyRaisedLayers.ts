import type { NodeLayerInfo } from './nodeDefinitions';

export const cantileverCanopyRaisedLayers: NodeLayerInfo[] = [
  {
    objectName: '墙体', name: '墙体', order: 1,
    thickness: '墙厚未标注', material: '墙体材料未标注',
    description: '雨篷根部上方的墙体。对照剖面观察其与过梁、板面上翻防水抹面的接合位置；图中没有明确墙体材料及墙厚。',
  },
  {
    objectName: '过梁-悬挑板-加高外檐', name: '过梁、悬挑板与加高外檐', order: 2,
    thickness: '板厚、悬挑长度与外檐高度未标注', material: '混凝土（模型示意）',
    description: '根部过梁、悬挑雨篷板及向上加高的外檐组成一个模型构件。外檐改变板面排水路径，需结合出水口与水舌观察排水关系；图中没有给出完整配筋及锚固详图。',
  },
  {
    objectName: '防水砂浆-加高外檐包覆', name: '防水砂浆抹面', order: 3,
    thickness: '图中未标注', material: '防水砂浆（图示）',
    description: '覆盖板面，沿墙根及加高外檐包覆转角。剖面标注“防水砂浆抹面”；分解后观察水平板面、竖向外檐和出水口周边的连续关系，图中未给出配比及厚度。',
  },
  {
    objectName: '板底抹灰与折形滴水', name: '板底抹灰与折形滴水', order: 4,
    thickness: '图中未标注', material: '抹灰砂浆（模型示意）',
    description: '位于雨篷底面，檐口呈折形滴水轮廓。结合I—Ⅰ局部剖面观察外檐下缘的滴水处理，减少雨水沿板底向内回流；厚度和砂浆配比未标注。',
  },
  {
    objectName: '墙面抹灰', name: '墙面抹灰', order: 5,
    thickness: '图中未标注', material: '抹灰砂浆（模型示意）',
    description: '墙体表面的独立抹灰层。分解模型查看墙面抹灰、过梁和雨篷根部防水抹面的相对位置；图中未标注抹灰厚度与材料配比。',
  },
  {
    objectName: '出水口砂浆衬口', name: '出水口砂浆衬口', order: 6,
    thickness: '出水口尺寸及衬口厚度未标注', material: '砂浆（模型对象名）',
    description: '位于加高外檐的出水口周边。分解后观察衬口与板面防水砂浆、水舌的配合，辨认集中排水穿过外檐的位置；剖面没有单独注明衬口规格。',
  },
  {
    objectName: '出水水舌', name: '出水水舌', order: 7,
    thickness: '图示外伸尺寸60mm；水舌厚度未标注', material: '金属外观（模型示意，图中未注明材质）',
    description: '从外檐出水口伸出，将板面雨水导离檐口。局部剖面标注“水舌”与外伸尺寸60mm；转动模型观察水舌、衬口及下方滴水构造的衔接，60mm不作为水舌厚度。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return cantileverCanopyRaisedLayers.find(layer => layer.objectName === objectName);
}
