const roofDrainageData = {
  id: "roof-drainage-01",
  title: "无组织排水屋顶",
  category: "屋顶",
  description:
    "无组织排水屋面构造节点，包含防水层、保温层、结构层等关键构件。",
  diagramImage: null,
  explodeAxis: "y",
  floatDirection: "z",
  floatDistance: 0.22,
  modelRotation: [0, 0, 0],
  cameraPosition: [0, 1.2, 4.0],
  layers: [
    {
      name: "构件01",
      material: "待补充",
      thickness: 0.03,
      color: "#d4a574",
      layerObjectName: "01",
      modelPath: "/models/roof/roof-drainage/roof-drainage.glb",
      description: "无组织排水屋顶构件01。",
    },
    {
      name: "构件02",
      material: "待补充",
      thickness: 0.03,
      color: "#8b7d6b",
      layerObjectName: "02",
      modelPath: "/models/roof/roof-drainage/roof-drainage.glb",
      description: "无组织排水屋顶构件02。",
    },
    {
      name: "构件03",
      material: "待补充",
      thickness: 0.03,
      color: "#6b8e7d",
      layerObjectName: "03",
      modelPath: "/models/roof/roof-drainage/roof-drainage.glb",
      description: "无组织排水屋顶构件03。",
    },
  ],
};

export default roofDrainageData;
