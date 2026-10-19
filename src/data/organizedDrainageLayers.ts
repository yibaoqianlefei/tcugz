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
    name: "檐沟及墙体支承",
    thickness: "图中未标注",
    material: "沟体与支承构件（具体材料按设计确定）",
    description: "模型01包含屋面边缘的沟体及下部墙体支承，图示通过檐沟汇水。应结合沟底、出口与主体支承识读，不能把这个实体构件误认为薄金属天沟；尺寸与排水能力需另行核查。",
  },
  {
    objectName: "02",
    name: "水落斗与落水管",
    thickness: "管径及壁厚未标注",
    material: "排水构件（具体材料未标注）",
    description: "模型02将沟底出口、水落斗和下接管段组合显示，用于追踪水离开檐沟后的路线。此图不构成虹吸排水系统的证明，管径、连接和服务汇水面积应按实际条件确定。",
  },
  {
    objectName: "03",
    name: "预制空心屋面板",
    thickness: "板厚与孔径未标注",
    material: "钢筋混凝土板（构造示意）",
    description: "模型03为带纵向孔洞的屋面板，对应原图右侧空心板截面。识读板端支承及上部排水构造的关系；此构件不是落水管，孔洞也不表示屋面排水通道。",
  },
  {
    objectName: "04",
    name: "屋面及檐沟表层",
    thickness: "模型未分解各薄层厚度",
    material: "表层构造（具体材料未标注）",
    description: "模型04沿屋面、檐沟和立面展开，用于观察表层在转折处的衔接路线。各找坡、防水及保护层需结合详图分别识别，不能据这个合并表面确定材料或完整系统性能；它不是地面雨水口。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return organizedDrainageLayers.find((l) => l.objectName === objectName);
}
