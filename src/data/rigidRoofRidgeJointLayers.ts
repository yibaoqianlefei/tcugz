import type { NodeLayerInfo } from './nodeDefinitions';

/** Exact component names from the supplied ridge-joint GLB and Blender mesh. */
export const rigidRoofRidgeJointLayers: NodeLayerInfo[] = [
  {
    objectName: '空心屋面板', name: '空心屋面板', order: 1,
    thickness: '图中未标注', material: '混凝土空心板（模型示意）',
    description: '屋脊两侧的空心屋面板向中部抬起，板端之间留缝。转动模型观察板内空腔、屋脊折线及接缝位置，对照剖面图中的两侧板端。',
  },
  {
    objectName: '水泥砂浆找平层', name: '水泥砂浆找平层', order: 2,
    thickness: '图中未标注', material: '水泥砂浆（按模型命名）',
    description: '位于空心屋面板上方，沿两侧坡面铺设。分解后观察找平层与下部屋面板、上部隔离层的衔接及屋脊处的断开位置。',
  },
  {
    objectName: '纸筋灰隔离层', name: '纸筋灰隔离层', order: 3,
    thickness: '图中未标注', material: '纸筋灰（按模型命名）',
    description: '位于找平层与细石混凝土刚性层之间的薄层。通过分解区分各层位置，观察隔离层在屋脊分格缝两侧的铺设范围。',
  },
  {
    objectName: '细石混凝土刚性层', name: '细石混凝土刚性层', order: 4,
    thickness: '图中未标注', material: '细石混凝土（按模型命名）',
    description: '沿两侧坡面形成上部刚性构造层，在屋脊处分开。观察两侧缝边、油膏嵌缝和跨缝覆盖构造的关系；模型未提供配筋及施工尺寸。',
  },
  {
    objectName: '沥青麻丝缝底填充', name: '沥青麻丝缝底填充', order: 5,
    thickness: '图中未标注', material: '沥青麻丝（剖面图标注）',
    description: '剖面图以“沥青麻丝”标注屋脊接缝下部的填充。观察填充构件在两侧板端之间的位置，以及上端与嵌缝油膏的衔接。',
  },
  {
    objectName: '缝口防水油膏', name: '缝口防水油膏', order: 6,
    thickness: '图中未标注', material: '防水油膏（图示嵌缝油膏）',
    description: '位于屋脊缝口、沥青麻丝填充上方。对照“嵌缝油膏”引线，观察它与两侧刚性层缝边及上方二布三油的连接。',
  },
  {
    objectName: '二布三油', name: '二布三油', order: 7,
    thickness: '图示二布三油，厚度未标注', material: '布类胎体与涂料（图中未标明具体品种）',
    description: '屋脊缝口上方的跨缝覆盖构造，向两侧坡面延伸。分解观察其覆盖范围、屋脊折线及下方油膏的位置，结合剖面图中的“二布三油”标注辨认。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return rigidRoofRidgeJointLayers.find(layer => layer.objectName === objectName);
}
