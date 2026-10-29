/**
 * Roof drainage node — layer data mapping.
 * Maps GLB mesh objectName → construction knowledge.
 */
export interface LayerInfo {
  objectName: string;   // matches GLB mesh.name
  name: string;         // Chinese display name
  thickness: string;    // e.g. "40mm"
  material: string;     // material description
  description: string;  // teaching content
}

export const roofDrainageLayers: LayerInfo[] = [
  {
    objectName: "01",
    name: "保护层",
    thickness: "原配图未标注厚度",
    material: "表层保护构造（具体材料须核查）",
    description: "当前节点将本表层归为保护层，用于观察其与檐口及下部层次的关系。配图未给出材料、厚度或使用荷载，保护方式需与防水系统相容，不能据此认定为可上人屋面面层。",
  },
  {
    objectName: "02",
    name: "防水层",
    thickness: "原配图未标注厚度",
    material: "防水构造（材料与层数须核查）",
    description: "当前节点将本层归为防水构造，用于追踪屋面至檐口的连续位置。原配图没有注明SBS品种、厚度或完整层序；女儿墙、穿出物的上翻、附加防护和收头需按各接口及所选系统另查，不能从本檐口局部图规定统一高度。",
  },
  {
    objectName: "03",
    name: "屋面下部组合构件",
    thickness: "各层厚度未独立标注",
    material: "组合构造（具体层序与材料须核查）",
    description: "本对象将屋面下部构造组合显示，不能独立点选全部找平、保温、找坡或结构层。配图用于识读外挑檐口和屋面坡向，未注明完整功能层、保温材料或坡度；各任务需结合完整剖面另行区分，不能由一个合并实体推断各层齐备或没有热桥。",
  },
];

/** Look up layer info by GLB object name */
export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return roofDrainageLayers.find((l) => l.objectName === objectName);
}
