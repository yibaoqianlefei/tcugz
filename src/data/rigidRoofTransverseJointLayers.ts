import type { NodeLayerInfo } from './nodeDefinitions';

/** Component names follow the supplied GLB; only the cover mesh was restored from its Blender source. */
export const rigidRoofTransverseJointLayers: NodeLayerInfo[] = [
  {
    objectName: '承重支座', name: '承重支座', order: 1,
    thickness: '图中未标注', material: '支承构件（模型未标明具体材料）',
    description: '位于屋面板接缝下方的支承构件。对照剖面图观察两侧屋面板、板缝与下部支座的位置关系。',
  },
  {
    objectName: '支承座浆', name: '支承座浆', order: 2,
    thickness: '图中未标注', material: '座浆材料（模型未标明具体配比）',
    description: '位于空心屋面板与承重支座之间的薄层构造。分解后观察座浆在支座上部的范围及其与两侧板端的接触位置。',
  },
  {
    objectName: '空心屋面板', name: '空心屋面板', order: 3,
    thickness: '图中未标注', material: '混凝土空心板（模型示意）',
    description: '模型展示两侧空心屋面板及其板端接缝。转动观察空腔、板端和下部支承关系，再与剖面图的板缝位置对应。',
  },
  {
    objectName: '水泥砂浆找平层', name: '水泥砂浆找平层', order: 4,
    thickness: '图中未标注', material: '水泥砂浆',
    description: '位于屋面板上方、隔离层下方的找平构造。观察该层在横向接缝处的断开及其与上部刚性层分格缝的位置关系。',
  },
  {
    objectName: '纸筋灰隔离层', name: '纸筋灰隔离层', order: 5,
    thickness: '图中未标注', material: '纸筋灰（按模型命名）',
    description: '位于找平层与细石混凝土刚性层之间。分解模型区分薄层位置，观察隔离层在分格缝两侧的铺设范围。',
  },
  {
    objectName: '细石混凝土刚性层', name: '细石混凝土刚性层', order: 6,
    thickness: '图中未标注', material: '细石混凝土',
    description: '屋面上部的刚性构造层，在横向分格缝处断开。对照图示观察两侧面层、缝口密封和跨缝覆盖构造；模型未提供配筋及施工尺寸。',
  },
  {
    objectName: '浸沥青木丝板缝底填充', name: '浸沥青木丝板缝底填充', order: 7,
    thickness: '图中未标注', material: '浸沥青木丝板（按模型命名）',
    description: '位于横向接缝中的竖向填充构件。分解后观察它贯穿各层接缝的位置及其与上部缝口油膏的衔接。',
  },
  {
    objectName: '缝口防水油膏', name: '缝口防水油膏', order: 8,
    thickness: '图中未标注', material: '防水油膏（图示油膏嵌缝）',
    description: '剖面图以“油膏嵌缝”引线标注缝口处的密封构造。观察油膏在填充构件上端的位置，以及上部二布三油覆盖构造与缝口的关系。',
  },
  {
    objectName: '二布三油', name: '二布三油', order: 9,
    thickness: '图示二布三油，厚度未标注', material: '布类胎体与涂料（图中未标明具体品种）',
    description: '图中标注的跨缝覆盖构造，在缝口上方形成抬起的形态并向两侧延伸。通过分解观察覆盖范围、缝口密封和两侧刚性层之间的空间关系。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return rigidRoofTransverseJointLayers.find(layer => layer.objectName === objectName);
}
