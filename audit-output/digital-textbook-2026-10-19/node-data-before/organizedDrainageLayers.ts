export interface LayerInfo {
  objectName: string;
  name: string;
  thickness: string;
  material: string;
  description: string;
}

export const organizedDrainageLayers: LayerInfo[] = [
  {
    objectName: "01",
    name: "天沟",
    thickness: "3mm",
    material: "不锈钢/镀锌钢板",
    description: "屋面排水沟，收集雨水并导入雨水斗。纵向坡度不小于0.5%，保证雨水快速排出。",
  },
  {
    objectName: "02",
    name: "雨水斗",
    thickness: "—",
    material: "铸铁/不锈钢",
    description: "连接天沟与落水管的接口构件，拦截杂物防止管道堵塞，虹吸式雨水斗可提高排水效率。",
  },
  {
    objectName: "03",
    name: "落水管",
    thickness: "Φ100mm",
    material: "PVC-U/铸铁",
    description: "将雨水从屋面引至地面排水系统。布置间距不宜大于18m，每根落水管服务面积不超过200m²。",
  },
  {
    objectName: "04",
    name: "雨水口",
    thickness: "—",
    material: "铸铁格栅",
    description: "地面接收雨水的入口构件，带格栅防止大块杂物进入。与市政雨水管网连接。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return organizedDrainageLayers.find((l) => l.objectName === objectName);
}
