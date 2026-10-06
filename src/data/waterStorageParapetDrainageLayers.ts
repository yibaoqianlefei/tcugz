import type { NodeLayerInfo } from './nodeDefinitions';

/** Exact source mesh names, including the hopper recovered from the saved Blender mesh. */
export const waterStorageParapetDrainageLayers: NodeLayerInfo[] = [
  {
    objectName: '承托及挡水墙', name: '女儿墙及板端承托', order: 1,
    thickness: '图中未标注', material: '混凝土外观（模型示意）',
    description: '形成蓄水屋面的外侧边界，并承托屋面板端。高位溢水孔与低位泄水孔穿过墙体向墙外排水；分解时该构件固定，便于观察各层与女儿墙的连接。',
  },
  {
    objectName: '屋面空心板', name: '屋面空心板', order: 2,
    thickness: '板厚与配筋未标注', material: '混凝土（模型示意）',
    description: '位于屋面构造层下方的承重板，模型与剖面均展示板内空腔。观察板端承托、上部找平层及板墙交接缝的位置关系。',
  },
  {
    objectName: '沥青麻丝嵌缝', name: '板端嵌缝', order: 3,
    thickness: '缝宽未标注', material: '沥青麻丝（剖面标注）',
    description: '位于空心板端部与墙体交接处，剖面标注“沥青麻丝嵌缝”。分解后观察填缝范围与板端、女儿墙的相对位置。',
  },
  {
    objectName: '找平层', name: '屋面找平层', order: 4,
    thickness: '图中未标注', material: '找平材料（具体品种未标注）',
    description: '铺设在屋面板上，为上部防水构造提供平整基层。分解后观察屋面板、找平层和防水层的上下关系。',
  },
  {
    objectName: '防水层', name: '蓄水区防水层', order: 5,
    thickness: '图中未标注', material: '防水材料（具体品种未标注）',
    description: '沿蓄水区底部铺设，并在女儿墙内侧上翻形成泛水。转动模型观察水平防水层、墙根转折及竖向上翻的连续关系，并对照穿墙孔口附近的构造。',
  },
  {
    objectName: '保护层', name: '防水保护层', order: 6,
    thickness: '图中未标注', material: '混凝土外观（模型示意，具体材料未标注）',
    description: '位于防水层上方、蓄水层下方，用于观察防水保护构造的覆盖范围。图中没有给出该层的具体材料、厚度或混凝土等级。',
  },
  {
    objectName: '水层', name: '蓄水层', order: 7,
    thickness: '蓄水深度未标注', material: '水（半透明模型示意）',
    description: '以原模型的半透明材质表示蓄水范围和水面位置。对照高位溢水孔与低位泄水孔理解水位关系；剖面中≥100的竖向尺寸表示水面至泛水上部的距离，不是蓄水深度。该水层为静态构造示意。',
  },
  {
    objectName: '泛水保护砂浆', name: '泛水保护砂浆', order: 8,
    thickness: '图中未标注', material: '砂浆（模型对象名）',
    description: '覆盖女儿墙内侧的泛水部位。剖面标注水面至泛水上部的竖向距离≥100mm；分解后观察墙根、竖向保护范围及孔口周边的位置关系。',
  },
  {
    objectName: '女儿墙压顶', name: '女儿墙压顶', order: 9,
    thickness: '图中未标注', material: '混凝土外观（模型示意，具体材料未标注）',
    description: '覆盖女儿墙顶部，对照剖面观察压顶与墙面泛水的关系。图中未明确压顶材质、厚度、坡向或滴水尺寸，不按模型外观推定做法。',
  },
  {
    objectName: '溢水孔', name: '高位溢水孔', order: 10,
    thickness: '孔径与壁厚未标注', material: '金属外观（模型示意，具体材质未标注）',
    description: '位于蓄水区较高位置，穿过女儿墙后向外排水。剖面注明“溢水孔中距同泄水孔”；对应泄水孔中距≤15m。转动模型观察弯管出口与墙外雨水斗的位置关系。',
  },
  {
    objectName: '泄水孔', name: '低位泄水孔', order: 11,
    thickness: '孔口尺寸未标注；中距≤15m', material: '金属外观（模型示意，具体材质未标注）',
    description: '位于蓄水区底部附近，穿过女儿墙向墙外雨水斗排水。剖面标注“泄水孔中距≤15m”，该尺寸为孔口沿墙布置的中心间距，不是孔径或蓄水深度；高位溢水孔中距与其相同。',
  },
  {
    objectName: '雨水斗', name: '墙外雨水斗', order: 12,
    thickness: '斗口及出水口尺寸未标注', material: '金属外观（源模型材质，具体材质未标注）',
    description: '设在女儿墙外侧，承接溢水孔和泄水孔排出的水，再通过下部出口排出。网格取自对应Blender源文件，保留原GLB中的位置与分解动画；转动模型并对照剖面观察接水口、斗身及下部出口的连接。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return waterStorageParapetDrainageLayers.find(layer => layer.objectName === objectName);
}
