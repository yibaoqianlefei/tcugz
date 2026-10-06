import type { NodeLayerInfo } from './nodeDefinitions';

/** Exact source mesh names; section annotations are distinguished from model appearance. */
export const waterStorageEavesDrainageLayers: NodeLayerInfo[] = [
  {
    objectName: '承托及挡水墙', name: '承托及挡水墙', order: 1,
    thickness: '图中未标注', material: '混凝土外观（模型示意）',
    description: '位于屋面与檐沟之间，承托板端并形成蓄水区边界。墙内设高位溢水孔和低位泄水孔；源动画中该构件固定，便于对照其他构件的分离位置。',
  },
  {
    objectName: '屋面空心板', name: '屋面空心板', order: 2,
    thickness: '图中未标注', material: '混凝土（模型示意）',
    description: '蓄水屋面下方的承重构件，剖面与模型均展示板内空腔。分解后观察板端与承托墙、找平层及嵌缝材料的关系；图中未给出板厚和配筋。',
  },
  {
    objectName: '沥青麻丝嵌缝', name: '沥青麻丝嵌缝', order: 3,
    thickness: '缝宽未标注', material: '沥青麻丝（图示）',
    description: '位于空心板端部与墙体交接缝内，剖面明确标注“沥青麻丝嵌缝”。分解后可观察填缝范围及其与板端的相对位置。',
  },
  {
    objectName: '找平层', name: '找平层', order: 4,
    thickness: '图中未标注', material: '找平材料（具体品种未标注）',
    description: '位于空心板上方，为上部防水构造提供平整基层。模型将其作为独立薄层，分解后可观察找平层与板面、防水层的先后关系。',
  },
  {
    objectName: '防水层', name: '蓄水区防水层', order: 5,
    thickness: '图中未标注', material: '防水材料（图中未明确品种）',
    description: '沿蓄水区底部铺设，并在挡水墙内侧上翻形成泛水。转动模型观察水平防水层与竖向上翻的连续关系，对照剖面中的墙根及收头位置。',
  },
  {
    objectName: '保护层', name: '防水保护层', order: 6,
    thickness: '图中未标注', material: '混凝土外观（模型示意，具体材料未标注）',
    description: '位于蓄水区防水层上方、水层下方。分解后可观察其覆盖范围及对下部防水构造的保护位置；图中没有标注保护层材料与厚度。',
  },
  {
    objectName: '水层', name: '蓄水层', order: 7,
    thickness: '蓄水深度未标注', material: '水（半透明模型示意）',
    description: '展示屋面的蓄水范围和水位，采用原模型半透明材质。对照高位溢水孔与低位泄水孔观察两种孔口的位置区别；图中“≥100”标注为水面至泛水上部的竖向距离，不作为蓄水深度。模型中的水层为静态示意，分解动画用于观察构造关系。',
  },
  {
    objectName: '泛水保护砂浆', name: '泛水保护砂浆', order: 8,
    thickness: '图中未标注', material: '砂浆（模型对象名）',
    description: '覆盖挡水墙内侧的泛水部位，沿墙根和上翻防水构造设置。分解后观察砂浆保护范围、墙根转折以及孔口附近的相对位置。',
  },
  {
    objectName: '泛水收头', name: '泛水收头', order: 9,
    thickness: '图示水面至泛水上部≥100mm', material: '混凝土外观（模型示意，收头材料未标注）',
    description: '位于竖向泛水顶部，对应剖面墙面上部的收口构造。剖面标注水面至泛水上部的竖向距离≥100；转动模型观察收头与墙面、上翻防水层的衔接。',
  },
  {
    objectName: '溢水孔', name: '溢水孔', order: 10,
    thickness: '孔口尺寸未标注', material: '金属外观（模型示意，具体材质未标注）',
    description: '挡水墙内的高位孔口，将高于孔口位置的水引向外侧檐沟。剖面注明“溢水孔每开间一个”；分解后观察其与蓄水区、墙体和檐沟的连通位置。图中的50尺寸按原图对照，不作为孔口直径。',
  },
  {
    objectName: '泄水孔', name: '泄水孔', order: 11,
    thickness: '孔口尺寸未标注', material: '金属外观（模型示意，具体材质未标注）',
    description: '位于蓄水区底部附近的低位孔口，贯穿挡水墙通向檐沟。对照剖面观察其与上方溢水孔的高差，理解低位泄水和高位溢水的位置关系。图中未标注封堵或启闭装置。',
  },
  {
    objectName: '檐沟', name: '檐沟', order: 12,
    thickness: '图中未标注', material: '混凝土外观（模型示意）',
    description: '位于挡水墙外侧，承接孔口排出的水并汇向水落管。模型展示沟槽和落水口形状，可转动观察沟底、边缘与承托部位。',
  },
  {
    objectName: '檐沟衬层', name: '檐沟衬层', order: 13,
    thickness: '图中未标注', material: '防水衬层外观（模型示意，具体品种未标注）',
    description: '沿檐沟内侧及落水口附近铺设的独立衬层构件。分解后观察其与檐沟沟体、水落管接口的覆盖和衔接关系。',
  },
  {
    objectName: '水落管', name: '水落管', order: 14,
    thickness: '管径与壁厚未标注', material: '金属外观（模型示意，具体材质未标注）',
    description: '位于檐沟底部，承接沟内汇集的水并向下排出。剖面展示其入口与沟底的连接；分解后观察水落管、檐沟衬层和沟体的接口关系。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return waterStorageEavesDrainageLayers.find(layer => layer.objectName === objectName);
}
