import type { NodeLayerInfo } from './nodeDefinitions';

export const freeFallWaterproofEavesLayers: NodeLayerInfo[] = [
  {
    objectName: '墙体', name: '墙体', order: 1,
    thickness: '墙厚未标注', material: '墙体材料未明确',
    description: '位于墙顶圈梁下方，剖面以砌体图例表示。观察墙体、圈梁与屋面板端的层次关系；具体砌体品种及墙厚未标注，模型外观不作为材料依据。',
  },
  {
    objectName: '墙顶圈梁', name: '墙顶圈梁', order: 2,
    thickness: '梁截面尺寸未标注', material: '混凝土（模型示意）',
    description: '位于墙顶、屋面板端附近，上部与防水悬挑层相接。分解观察墙体、圈梁及板端的相对位置；原图未给出圈梁截面、配筋及锚固尺寸。',
  },
  {
    objectName: '空心屋面板', name: '空心屋面板', order: 3,
    thickness: '图中未标注', material: '混凝土空心板（模型示意）',
    description: '位于圈梁内侧，剖面展示板内圆形空腔。转动模型观察板端支承位置及上部防水层覆盖关系；图中未标注板厚、孔径和配筋。',
  },
  {
    objectName: '细石混凝土防水悬挑层', name: '细石混凝土防水悬挑层', order: 4,
    thickness: '檐口图示竖向尺寸70mm；悬挑长度≤450mm', material: '细石混凝土（模型对象名）',
    description: '防水层直接伸出墙外形成自由落水檐口，端部向下折边。剖面标注檐口竖向尺寸70mm、悬挑长度≤450mm；70mm为所示檐口尺寸，不作为全屋面统一厚度。分解查看内部双向钢筋网与板端关系。',
  },
  {
    objectName: '防水层双向钢筋网', name: '防水层双向钢筋网', order: 5,
    thickness: '图示双向Φ4钢筋，间距100～200mm', material: '钢筋（图示）',
    description: '防水悬挑层中的双向钢筋网，剖面标注“双向Φ4钢筋@100～200”。展开后点击钢筋网区域，查看其与细石混凝土层的关系。图中未给出钢筋等级、保护层及锚固详图。',
  },
  {
    objectName: '室外抹灰', name: '室外抹灰', order: 6,
    thickness: '图中未标注', material: '抹灰砂浆（模型示意）',
    description: '墙体外侧的独立饰面，向上与檐口根部相接。分解对照外墙面、圈梁与悬挑端的位置；图中未标注砂浆配比及抹灰厚度。',
  },
  {
    objectName: '室内抹灰', name: '室内抹灰', order: 7,
    thickness: '图中未标注', material: '抹灰砂浆（模型示意）',
    description: '墙体内侧及屋面板底附近的饰面构件。分解后与室外抹灰、圈梁及空心屋面板对照其包覆范围；材料配比和厚度未标注。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return freeFallWaterproofEavesLayers.find(layer => layer.objectName === objectName);
}
