import type { NodeLayerInfo } from "./nodeDefinitions";

/** Names match the two independently selectable meshes in ramp-handrail.glb. */
export const rampHandrailLayers: NodeLayerInfo[] = [
  {
    objectName: "扶手",
    name: "坡道扶手",
    order: 2,
    thickness: "图示 Φ45×3 mm",
    material: "钢管或不锈钢管（图示）",
    description: "沿坡道设置的扶手及其支承构件。剖面图标注了扶手截面、端部与坡面之间的关系；模型中的扶手作为一个整体构件播放分离演示动画。",
  },
  {
    objectName: "坡道",
    name: "坡道",
    order: 1,
    thickness: "按实际工程设计",
    material: "混凝土（模型示意）",
    description: "连接不同标高的倾斜通行面，为扶手提供安装位置。模型将坡道作为独立构件，便于观察扶手与坡面的相对关系。",
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return rampHandrailLayers.find((layer) => layer.objectName === objectName);
}
