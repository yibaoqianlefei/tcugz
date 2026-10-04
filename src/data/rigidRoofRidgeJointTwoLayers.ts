import type { NodeLayerInfo } from './nodeDefinitions';

/** Exact names from the supplied second ridge-joint GLB. */
export const rigidRoofRidgeJointTwoLayers: NodeLayerInfo[] = [
  {
    objectName: '空心屋面板', name: '空心屋面板', order: 1,
    thickness: '图中未标注', material: '混凝土空心板（模型示意）',
    description: '屋脊两侧的空心屋面板向中部抬起，板端之间留缝。转动模型观察空腔、两侧板端和屋脊折线，对照剖面图中的板缝位置。',
  },
  {
    objectName: '水泥砂浆找平层', name: '水泥砂浆找平层', order: 2,
    thickness: '图中未标注', material: '水泥砂浆（按模型命名）',
    description: '位于空心屋面板上方，沿两侧坡面铺设。分解观察找平层与屋面板、隔离层的关系，以及它在屋脊接缝两侧的断开位置。',
  },
  {
    objectName: '纸筋灰隔离层', name: '纸筋灰隔离层', order: 3,
    thickness: '图中未标注', material: '纸筋灰（按模型命名）',
    description: '位于找平层与细石混凝土刚性层之间。通过分解辨认薄层范围，观察屋脊缝两侧各层的衔接。',
  },
  {
    objectName: '细石混凝土刚性层', name: '细石混凝土刚性层', order: 4,
    thickness: '图中未标注', material: '细石混凝土（按模型命名）',
    description: '沿两侧坡面铺设，在屋脊缝边形成上抬构造。对照剖面图观察上抬缝边、嵌缝油膏和折脊盖瓦的覆盖关系；模型未提供配筋及施工尺寸。',
  },
  {
    objectName: '沥青麻丝缝底填充', name: '沥青麻丝缝底填充', order: 5,
    thickness: '图中未标注', material: '沥青麻丝（剖面图标注）',
    description: '位于屋脊接缝下部，剖面以“沥青麻丝”标注。观察它在板端及上部各层接缝中的位置，以及上端与嵌缝油膏的衔接。',
  },
  {
    objectName: '缝口防水油膏', name: '缝口防水油膏', order: 6,
    thickness: '图中未标注', material: '防水油膏（图示嵌缝油膏）',
    description: '位于屋脊缝口、沥青麻丝填充上端。对照“嵌缝油膏”引线，观察密封构件与两侧上抬缝边及上方盖瓦的位置关系。',
  },
  {
    objectName: '折脊盖瓦', name: '折脊盖瓦', order: 7,
    thickness: '图中未标注', material: '脊瓦（图中未标明具体材料）',
    description: '独立的跨缝盖瓦，呈折脊形覆盖在两侧上抬缝边上方。图示“脊瓦单边坐灰固定”；转动与分解观察盖瓦折角、覆盖范围和下方缝口油膏。坐灰固定为图示要求，模型未单独命名座浆构件。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return rigidRoofRidgeJointTwoLayers.find(layer => layer.objectName === objectName);
}
