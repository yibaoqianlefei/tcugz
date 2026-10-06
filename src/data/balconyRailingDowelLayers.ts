import type { NodeLayerInfo } from './nodeDefinitions';

/** Match source meshes; dimensions follow this connection's section. */
export const balconyRailingDowelLayers: NodeLayerInfo[] = [
  {
    objectName: '阳台板', name: '阳台板', order: 1,
    thickness: '图中未标注', material: '混凝土（模型示意）',
    description: '连接节点下方的阳台板，为板边挡水带提供承托。分解模型观察板边与上部插筋连接的位置关系；剖面未标注板厚、混凝土等级或配筋。',
  },
  {
    objectName: '现浇挡水带', name: '现浇挡水带', order: 2,
    thickness: '图示竖向尺寸60mm', material: '现浇混凝土（模型对象名）',
    description: '位于阳台板边缘，槽口和插筋位置与栏杆脚底端配合。剖面标注竖向60尺寸；分解后观察挡水带、栏杆脚与插接钢筋的连接关系。',
  },
  {
    objectName: '插接钢筋', name: '插接钢筋', order: 3,
    thickness: '直径Φ6mm，长度80mm（图示）', material: '钢筋',
    description: '剖面明确标注“Φ6插钢筋长80”。钢筋沿竖向连接栏杆脚底端与板边构造，模型将其作为独立构件，可分解、点选并观察插接位置。图中未给出上下段分别的锚入长度。',
  },
  {
    objectName: '槽口侧缝填实', name: '槽口侧缝填实', order: 4,
    thickness: '图中未标注', material: '填缝材料（剖面未标注品种）',
    description: '源模型中包围栏杆脚底部槽口侧缝的填充构件，分解后可观察侧缝范围及其与插接钢筋的位置关系。剖面未注明填缝材料及强度等级，模型保留原纹理外观。',
  },
  {
    objectName: '栏杆脚', name: '栏杆脚', order: 5,
    thickness: '截面尺寸未标注', material: '混凝土外观（模型示意，剖面未明确材料）',
    description: '栏杆的局部支承构件，下端与挡水带槽口配合，由竖向插接钢筋连接。分解后观察脚部形状、插筋位置和周围填充；模型只展示局部连接，剖面未给出完整栏杆尺寸或材料要求。',
  },
  {
    objectName: '饰面包覆', name: '板边饰面包覆', order: 6,
    thickness: '图中未标注', material: '混凝土外观（模型示意，具体饰面未标注）',
    description: '包覆阳台板边缘及挡水带外侧，并在栏杆脚周围收口。源动画中该构件固定，其余构件分离后可观察包覆范围和内部连接；剖面未明确饰面材料与厚度。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return balconyRailingDowelLayers.find(layer => layer.objectName === objectName);
}
