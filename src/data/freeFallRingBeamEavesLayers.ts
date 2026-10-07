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
    description: '位于结构构件上方、隔离层下方。分解查看屋面板与挑檐板上部的找平基层及檐口收边位置；图中未标注砂浆配比、找坡坡度和该层厚度。',
  },
  {
    objectName: '纸筋灰隔离层', name: '纸筋灰隔离层', order: 5,
    thickness: '图中未标注', material: '纸筋灰（模型对象名）',
    description: '剖面标注为隔离层，模型对象名为纸筋灰隔离层，位于找平层与防水层之间。展开后观察其铺设范围及与相邻层的关系；原图未给出材料配比和厚度。',
  },
  {
    objectName: '细石混凝土防水层', name: '细石混凝土防水层', order: 6,
    thickness: '防水层厚度未标注；檐端局部水平尺寸60mm', material: '细石混凝土（模型对象名）',
    description: '剖面标注为防水层，模型以细石混凝土层表达，覆盖屋面并延伸至檐端。对照檐端局部水平尺寸60mm及下方滴水位置；60mm不作为防水层厚度或整个挑檐板的悬挑长度。',
  },
  {
    objectName: '防水层双向钢筋网', name: '防水层双向钢筋网', order: 7,
    thickness: '钢筋直径与间距未标注', material: '钢筋（模型示意）',
    description: '模型防水层中的双向钢筋网。展开后点击钢筋网区域，观察其布置及与防水层、隔离层的相对位置。原图未标注钢筋直径、间距、等级、保护层及锚固详图。',
  },
  {
    objectName: '室外抹灰', name: '室外抹灰', order: 8,
    thickness: '图中未标注', material: '抹灰砂浆（模型示意）',
    description: '外墙与挑檐板外侧、板底附近的饰面构件。分解观察饰面包覆、檐口收边和图示滴水处的位置关系；原图未给出砂浆配比和抹灰厚度。',
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
