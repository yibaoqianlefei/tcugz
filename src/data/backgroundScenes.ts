const B = import.meta.env.BASE_URL;
const backgroundScenes = [
  {
    id: "wall",
    name: "墙体",
    modelPath: `${B}models/background/Exhibition model.glb`,
    position: [0, 0.5, 0],
  },
  {
    id: "roof",
    name: "屋顶",
    modelPath: `${B}models/roof/flat-roof/flat-roof.glb`,
    position: [0, 0, 0],
  },
];

export default backgroundScenes;
