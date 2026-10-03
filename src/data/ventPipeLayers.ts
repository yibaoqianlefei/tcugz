import type { NodeLayerInfo } from './nodeDefinitions';

/** Names match all 11 GLB components, including the steel cage restored from the source .blend. */
export const ventPipeLayers: NodeLayerInfo[] = [
  {
    objectName: '钢筋混凝土屋面板', name: '钢筋混凝土屋面板', order: 1,
    thickness: '按设计确定', material: '钢筋混凝土',
    description: '屋面承重基层，透气管穿过结构板中的预留洞口。观察洞口、管身与周边屋面构造的空间关系。',
  },
  {
    objectName: '水泥砂浆找平层', name: '水泥砂浆找平层', order: 2,
    thickness: '图中未标注', material: '水泥砂浆',
    description: '为屋面防水构造提供平整基层。结合剖面图观察找平层在穿管位置与管根防水上翻部位的衔接。',
  },
  {
    objectName: '一布四涂', name: '一布四涂防水层', order: 3,
    thickness: '图示一布四涂，厚度未标注', material: '胎体增强材料与防水涂料（图示）',
    description: '剖面图标注的一布四涂防水构造从水平屋面延伸至透气管周边。分解模型观察管根附加构造和沿管身上翻的防水路径。',
  },
  {
    objectName: '屋面隔离层', name: '屋面隔离层', order: 4,
    thickness: '图中未标注', material: '隔离材料（模型未标明具体品种）',
    description: '用于展示屋面各层之间的隔离关系。观察隔离层在管根位置的断开与周边细石混凝土屋面层的关系。',
  },
  {
    objectName: '细石混凝土屋面层', name: '细石混凝土屋面层', order: 5,
    thickness: '图中未标注', material: '细石混凝土',
    description: '屋面表层构造。透气管周边保留管根分隔缝，配合密封料观察面层与穿出构件之间的接缝处理。',
  },
  {
    objectName: '管根分隔缝密封料', name: '管根分隔缝密封料', order: 6,
    thickness: '按接缝设计确定', material: '密封材料（模型示意）',
    description: '位于屋面面层与透气管根部的接缝处。分解后观察密封料的环形位置及其与屋面面层、防水层的相互关系。',
  },
  {
    objectName: '透气管', name: '透气管', order: 7,
    thickness: '管径及出屋面高度按工程设计', material: '管材（模型未标明具体品种）',
    description: '从屋面洞口伸出的通气管道。剖面图注明其高度按工程需要确定；顶部与球形罩连接，管根配合防水上翻及伞形罩。',
  },
  {
    objectName: '防水油膏', name: '防水油膏', order: 8,
    thickness: '图中未标注', material: '防水密封油膏（图示）',
    description: '剖面图的引线指向伞形罩与透气管连接处。观察该处密封材料与抱箍、伞形罩之间的位置关系。',
  },
  {
    objectName: '管根伞形罩', name: '管根伞形罩', order: 9,
    thickness: '图中未标注', material: '金属罩（模型示意）',
    description: '套在透气管根部上方的伞形构件，覆盖防水上翻的上端。对照剖面图观察罩体向外下折的形态与管根收头位置。',
  },
  {
    objectName: '螺栓抱箍', name: '螺栓抱箍', order: 10,
    thickness: '图示 40 宽环形件、2 厚橡皮垫（mm）', material: '金属抱箍及橡皮垫（图示）',
    description: '由螺栓紧固的环形连接构件。剖面图标注了 40 宽环形件与 2 厚橡皮垫，用于理解抱箍与透气管的连接和垫片位置。',
  },
  {
    objectName: '球形镀锌钢丝罩', name: '球形镀锌钢丝罩', order: 11,
    thickness: '图示 16 号镀锌钢丝，间距 10 mm', material: '镀锌钢丝',
    description: '设置在透气管顶部的球形网罩。剖面图标注了钢丝规格与间距；观察网罩的通透结构和下部与管口的连接。网格来自同项目 Blender 源文件。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return ventPipeLayers.find(layer => layer.objectName === objectName);
}
