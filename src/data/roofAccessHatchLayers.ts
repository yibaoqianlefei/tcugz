import type { NodeLayerInfo } from './nodeDefinitions';

/** Names match the 12 components, including the cover mesh recovered from the supplied .blend. */
export const roofAccessHatchLayers: NodeLayerInfo[] = [
  {
    objectName: '屋面结构板', name: '屋面结构板', order: 1,
    thickness: '按设计确定', material: '混凝土（模型示意）',
    description: '承托屋面各层构造，并在检修口位置留出洞口。观察结构板、洞口与井壁的连接关系。',
  },
  {
    objectName: '屋面找坡层', name: '屋面找坡层', order: 2,
    thickness: '随坡度变化，按设计确定', material: '找坡材料（模型示意）',
    description: '形成屋面的排水坡向。检修口周边应结合屋面排水组织观察，避免雨水在井壁根部积聚。',
  },
  {
    objectName: '屋面保温层', name: '屋面保温层', order: 3,
    thickness: '按设计确定', material: '保温材料（模型未标明具体品种）',
    description: '位于屋面构造层中，承担保温作用。观察其在检修口井壁周边的收边及与上部找平、防水层的关系。',
  },
  {
    objectName: '水泥砂浆找平层', name: '屋面找平层', order: 4,
    thickness: '按设计确定', material: '水泥砂浆',
    description: '为防水卷材提供连续的基层。通过分解模型观察水平屋面找平层与井壁外侧找平砂浆的衔接。',
  },
  {
    objectName: '检修口混凝土井壁', name: '检修口混凝土井壁', order: 5,
    thickness: '按设计确定', material: '混凝土',
    description: '围合检修口并高出周边屋面，为防水上翻和压顶提供支承。所配剖面图在井壁顶部与屋面之间标注了 250 mm 的竖向尺寸。',
  },
  {
    objectName: '井壁外侧及顶面找平砂浆', name: '井壁外侧及顶面找平砂浆', order: 6,
    thickness: '按设计确定', material: '水泥砂浆',
    description: '覆盖井壁外侧与顶部，作为卷材上翻处的基层。重点观察水平面转至竖向面以及井壁顶部的连续关系。',
  },
  {
    objectName: '第一道SBS防水卷材', name: '第一道 SBS 防水卷材', order: 7,
    thickness: '模型和剖面图未标注', material: 'SBS 改性沥青防水卷材（按模型命名）',
    description: '模型中的第一道防水层从屋面延续至检修口井壁。对照剖面图观察卷材在井壁根部的转折和上翻路径。',
  },
  {
    objectName: '附加防水卷材', name: '附加防水卷材', order: 8,
    thickness: '模型和剖面图未标注', material: '防水卷材',
    description: '局部覆盖检修口周边与井壁转角，用于展示节点防水加强做法。剖面图中的“附加卷材”引线指向井壁根部的转折位置。',
  },
  {
    objectName: '第二道SBS防水卷材', name: '第二道 SBS 防水卷材', order: 9,
    thickness: '模型和剖面图未标注', material: 'SBS 改性沥青防水卷材（按模型命名）',
    description: '与第一道防水卷材共同展示该模型的双层防水构造。分解后对比两道卷材与附加卷材的覆盖范围及相互位置。',
  },
  {
    objectName: '镀锌薄钢板盖缝件', name: '镀锌薄钢板盖缝件', order: 10,
    thickness: '模型和剖面图未标注', material: '镀锌薄钢板（按模型命名）',
    description: '位于检修口顶部周边，展示盖缝和收边位置。结合压顶观察它与防水卷材上端的相对关系。',
  },
  {
    objectName: '混凝土压顶圈', name: '混凝土压顶圈', order: 11,
    thickness: '按设计确定', material: '混凝土',
    description: '覆盖井壁顶部，形成检修口周边的压顶圈，为人孔盖提供承托边缘。分解后观察压顶圈、盖板与防水上翻收头的关系。',
  },
  {
    objectName: '人孔盖', name: '人孔盖', order: 12,
    thickness: '按设计确定', material: '木饰面、板材及边框（源模型示意）',
    description: '覆盖检修口上方的盖板。可随分解动画移开，观察其与混凝土压顶圈的搭接及检修通道。当前网格来自提供的 Blender 源文件，保留了原模型的材质分区。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return roofAccessHatchLayers.find(layer => layer.objectName === objectName);
}
