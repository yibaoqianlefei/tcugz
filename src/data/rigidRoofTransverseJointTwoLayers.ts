import type { NodeLayerInfo } from './nodeDefinitions';

/** Names match the supplied second transverse-joint GLB, including its separate ridge cap. */
export const rigidRoofTransverseJointTwoLayers: NodeLayerInfo[] = [
  {
    objectName: '承重支座', name: '承重支座', order: 1,
    thickness: '图中未标注', material: '支承构件（模型未标明具体材料）',
    description: '位于两侧屋面板接缝下方。结合剖面图观察板端、座浆和支座的位置关系；播放分解时支座作为下部参照构件。',
  },
  {
    objectName: '支承座浆', name: '支承座浆', order: 2,
    thickness: '图中未标注', material: '座浆材料（模型未标明具体配比）',
    description: '位于空心屋面板与承重支座之间。分解后观察两侧板端下方的座浆范围及其与接缝中填充构件的关系。',
  },
  {
    objectName: '空心屋面板', name: '空心屋面板', order: 3,
    thickness: '图中未标注', material: '混凝土空心板（模型示意）',
    description: '分格缝两侧的空心屋面板。转动模型观察板端空腔与中部板缝，再与剖面图中的空心截面和支承位置对应。',
  },
  {
    objectName: '水泥砂浆找平层', name: '水泥砂浆找平层', order: 4,
    thickness: '图中未标注', material: '水泥砂浆（按模型命名）',
    description: '位于屋面板上方、隔离层下方。观察找平层在横向接缝两侧的断开位置及其与屋面各层的衔接。',
  },
  {
    objectName: '纸筋灰隔离层', name: '纸筋灰隔离层', order: 5,
    thickness: '图中未标注', material: '纸筋灰（按模型命名）',
    description: '位于找平层与细石混凝土刚性层之间的薄层构造。通过分解区分各层，观察隔离层在分格缝两侧的范围。',
  },
  {
    objectName: '细石混凝土刚性层', name: '细石混凝土刚性层', order: 6,
    thickness: '图中未标注', material: '细石混凝土（按模型命名）',
    description: '在分格缝两侧形成上抬的缝边构造，上方设独立折脊盖瓦。对照剖面图观察刚性层、缝口与盖瓦的覆盖关系；模型未提供配筋或施工尺寸。',
  },
  {
    objectName: '浸沥青木丝板缝底填充', name: '浸沥青木丝板缝底填充', order: 7,
    thickness: '图中未标注', material: '浸沥青木丝板（按模型命名）',
    description: '位于横向接缝内的竖向填充构件。观察它在屋面板及上部各层接缝中的位置，以及其上端与缝口油膏的衔接。',
  },
  {
    objectName: '缝口防水油膏', name: '缝口防水油膏', order: 8,
    thickness: '图中未标注', material: '防水油膏（按模型命名）',
    description: '位于填充构件上端、折脊盖瓦下方的缝口处。分解观察油膏与两侧上抬缝边及盖瓦之间的空间关系。',
  },
  {
    objectName: '折脊盖瓦', name: '折脊盖瓦', order: 9,
    thickness: '图中未标注', material: '盖瓦（模型未标明具体材料）',
    description: '独立的跨缝盖瓦，呈折脊形覆盖在两侧上抬缝边上方。转动及分解模型观察折角、两侧下垂边与缝口的关系，区分盖瓦和下方刚性层。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return rigidRoofTransverseJointTwoLayers.find(layer => layer.objectName === objectName);
}
