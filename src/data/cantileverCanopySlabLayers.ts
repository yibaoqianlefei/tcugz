import type { NodeLayerInfo } from './nodeDefinitions';

export const cantileverCanopySlabLayers: NodeLayerInfo[] = [
  {
    objectName: '墙体', name: '墙体', order: 1,
    thickness: '墙厚未标注', material: '墙体材料未标注',
    description: '雨篷根部上方的墙体。对照剖面观察墙体、过梁与板面防水砂浆的连接位置；图中未明确墙体材料及墙厚，模型外观不作为材料判定依据。',
  },
  {
    objectName: '过梁与悬挑板', name: '过梁与悬挑板', order: 2,
    thickness: '结构板厚及悬挑长度未标注', material: '混凝土（模型示意）',
    description: '模型将根部过梁与向外伸出的雨篷板作为一个构件。观察根部加厚、板端及其与墙体的连接，分解后对照板面和板底的饰面层次；剖面没有提供完整配筋及锚固详图。',
  },
  {
    objectName: '防水砂浆', name: '防水砂浆抹面', order: 3,
    thickness: '根部图示竖向尺寸200mm；面层厚度未单独标注', material: '防水砂浆（图示）',
    description: '覆盖雨篷板面，并在墙根上翻。剖面标注“防水砂浆抹面”与1%坡度，可观察雨水向外檐排出的路径；根部200mm为局部竖向尺寸，不作为砂浆层厚度。',
  },
  {
    objectName: '板底抹灰与檐口滴水槽', name: '板底抹灰与檐口滴水槽', order: 4,
    thickness: '檐口局部尺寸见剖面；板底抹灰厚度未单独标注', material: '抹灰砂浆（模型示意）',
    description: '板底抹灰在外檐形成滴水槽，截断沿板底向墙面回流的水。转动模型观察槽口凹进及外檐折形轮廓；剖面右下给出局部尺寸，不应将其全部解释为板厚或饰面厚度。',
  },
  {
    objectName: '墙面抹灰', name: '墙面抹灰', order: 5,
    thickness: '图中未标注', material: '抹灰砂浆（模型示意）',
    description: '墙体表面的独立饰面构件，与雨篷根部防水抹面相接。分解后观察墙面层次与上翻收头的位置；图中未标注砂浆配比和抹灰厚度。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return cantileverCanopySlabLayers.find(layer => layer.objectName === objectName);
}
