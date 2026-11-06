import type { NodeLayerInfo } from './nodeDefinitions';

export const freeFallRingBeamEavesLayers: NodeLayerInfo[] = [
  {
    objectName: '墙体', name: '墙体', order: 1,
    thickness: '墙厚未标注', material: '墙体材料未明确',
    description: '位于圈梁下方，剖面以砌体图例表示。观察墙顶支承、圈梁及屋面板端的相对位置；图中未标注具体砌体品种和墙厚。',
  },
  {
    objectName: '圈梁带挑檐板', name: '圈梁带挑檐板', order: 2,
    thickness: '圈梁截面与挑檐板尺寸未标注', material: '混凝土（图示）',
    description: '墙顶圈梁与向外伸出的挑檐板在该构件中整体表达。分解后观察圈梁、板端支承及挑檐根部的连接，结合剖面对照檐口滴水位置。原图未标注构件配筋、锚固和混凝土等级。',
  },
  {
    objectName: '空心屋面板', name: '空心屋面板', order: 3,
    thickness: '图中未标注', material: '混凝土空心板（模型示意）',
    description: '位于圈梁内侧，板内具有圆形空腔。观察板端与圈梁的支承关系，以及上部找平层、隔离层和防水层的连续覆盖；板厚、孔径与配筋未标注。',
  },
  {
    objectName: '水泥砂浆找平层', name: '水泥砂浆找平层', order: 4,
    thickness: '图中未标注', material: '水泥砂浆（模型对象名）',
    description: '模型中位于结构构件上方、隔离层下方的基层。图中相关薄层未给完整材料说明，不能由模型“水泥砂浆”名称核定原图材料；配比、坡度与厚度均未标注。',
  },
  {
    objectName: '纸筋灰隔离层', name: '纸筋灰隔离层', order: 5,
    thickness: '图中未标注', material: '纸筋灰（模型对象名）',
    description: '原图标注隔离层，模型沿用“纸筋灰隔离层”对象名。分别观察薄层边界与相邻防水、基层的关系；原图没有完整材料说明，模型名称不替代材料、配比或厚度证据。',
  },
  {
    objectName: '细石混凝土防水层', name: '细石混凝土防水层', order: 6,
    thickness: '防水层厚度未标注；60 mm仅为原图檐端局部水平投影', material: '细石混凝土（模型对象名，原图标注防水层）',
    description: '传统刚性防水实例，模型以细石混凝土层表达。60保留挑出唇口外缘至图示檐端细边带外缘的投影，细边带材料未核定，不冒称混凝土结构面；滴水引线位于上唇口下侧。局部旧图不代表现代完整设防。',
  },
  {
    objectName: '防水层双向钢筋网', name: '防水层双向钢筋网', order: 7,
    thickness: '钢筋直径与间距未标注', material: '钢筋（模型示意）',
    description: '模型防水层中的双向钢筋网可独立点选。原图上部横线、可辨截点和檐端短折属于上部防水层内，不能补作圈梁或挑檐板配筋；钢筋规格、间距、保护层和锚固详图未给定。',
  },
  {
    objectName: '室外抹灰', name: '室外抹灰', order: 8,
    thickness: '图中未标注', material: '抹灰砂浆（模型示意）',
    description: '模型在外墙、挑檐板外侧及板底附近的饰面构件。原图结构外侧细边带的材料身份未核定，不能因模型此名称便把该边带认作抹灰或核定60的材料测界；配比与厚度未给定。',
  },
  {
    objectName: '室内抹灰', name: '室内抹灰', order: 9,
    thickness: '图中未标注', material: '抹灰砂浆（模型示意）',
    description: '墙体内侧及屋面板底附近的饰面。分解对照室外抹灰、圈梁及空心屋面板，观察其覆盖范围；图中未标注材料配比和厚度。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return freeFallRingBeamEavesLayers.find(layer => layer.objectName === objectName);
}
