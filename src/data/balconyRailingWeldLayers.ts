import type { NodeLayerInfo } from './nodeDefinitions';

/** Exact source mesh names; only legible section annotations are used. */
export const balconyRailingWeldLayers: NodeLayerInfo[] = [
  {
    objectName: '阳台板', name: '阳台板', order: 1,
    thickness: '图中未完整标注', material: '混凝土（模型示意）',
    description: '连接节点下方的阳台板，为板边构造提供承托。分解模型可观察其与挡水带、饰面包覆的位置关系；提供的剖面右侧文字被截断，不据此推测板厚、强度等级或配筋。',
  },
  {
    objectName: '现浇挡水带', name: '现浇挡水带', order: 2,
    thickness: '图示竖向尺寸60mm', material: '现浇混凝土（模型对象名）',
    description: '位于阳台板边缘的上凸构件，预埋板与锚脚设置在此处。剖面可辨认竖向60尺寸；转动和分解模型观察挡水带与阳台板的接合及预埋位置。右侧混凝土等级标注不完整，未推测其完整要求。',
  },
  {
    objectName: '预埋锚脚', name: '预埋件锚脚', order: 3,
    thickness: '截面与锚入长度未标注', material: '钢材（模型示意）',
    description: '与预埋板配套、伸入混凝土内部的锚固部分。分解后观察锚脚与钢板的位置关系，对照剖面中预埋件的锚固形状。模型用于展示连接关系，图中未给出锚固长度和焊缝尺寸。',
  },
  {
    objectName: '预埋板', name: '预埋钢板', order: 4,
    thickness: '图中未标注', material: '钢板（模型示意）',
    description: '位于栏杆脚底部与混凝土之间的预埋件钢板。与锚脚共同组成预埋件，提供栏杆连接部位；剖面注明通长钢筋与两边预埋件焊接。未标注的钢板厚度、焊缝形式及尺寸不作推测。',
  },
  {
    objectName: '通长联系钢筋', name: '通长联系钢筋', order: 5,
    thickness: '直径Φ16mm（图示）', material: '钢筋',
    description: '剖面明确标注“Φ16通长钢筋与两边预埋件焊接”。模型展示连接节点的一段钢筋，可分解观察它与预埋板的相对位置；不将局部模型视为整段阳台的栏杆布置。源模型没有独立命名的焊缝网格。',
  },
  {
    objectName: '栏杆脚', name: '栏杆脚', order: 6,
    thickness: '截面尺寸未标注', material: '源模型采用混凝土外观，具体材质未标注',
    description: '栏杆在板边的局部支承构件，底部与预埋板连接。分解观察栏杆脚、钢板、锚脚的上下关系；本模型只展示局部连接，不包含完整栏杆。剖面未给出栏杆脚材料及截面尺寸，保留源模型外观。',
  },
  {
    objectName: '饰面包覆', name: '板边饰面包覆', order: 7,
    thickness: '图中未标注', material: '源模型采用混凝土外观，具体饰面未标注',
    description: '包覆阳台板边缘和连接部位外侧的构件。源动画中该构件保持固定，其余构件分离后可观察包覆范围和内部连接。剖面未明确饰面材料及厚度，不依据纹理推断实际材料做法。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return balconyRailingWeldLayers.find(layer => layer.objectName === objectName);
}
