const constructionColumnData = {
  id: "construction-column-01",
  title: "构造柱",
  category: "墙体",
  description:
    "砖混结构墙体交接处设置的钢筋混凝土构造柱，增强建筑整体刚度和抗震性能。",
  directionLabel: "构造柱组成构件",
  floatDirection: "z",
  floatDistance: 0.3,
  cameraPosition: [4, 5, 6],
  content: `# 构造柱

## 概述

构造柱是砖混结构中设置在墙体转角、交接处等关键部位的钢筋混凝土柱。它与圈梁、墙体共同形成空间约束体系，显著提高房屋的整体刚度、延性和抗震能力。构造柱不单独承受竖向荷载，而是作为墙体的一部分协同工作。

## 构成构件

1. **混凝土柱子** —— 截面通常为240mm×240mm或与墙厚相同，内配4根直径12-14mm的纵向钢筋。
2. **钢筋** —— 纵向受力钢筋，通常为HRB400级，直径12-14mm。
3. **箍筋** —— 直径6-8mm，间距200mm，加密区间距100mm。
4. **墙体** —— 砖砌体或砌块墙体，与构造柱通过马牙槎连接。
5. **圈梁** —— 水平方向钢筋混凝土梁，与构造柱形成空间约束体系。
6. **楼板** —— 钢筋混凝土楼板，与圈梁和构造柱整体连接。
7. **马牙槎** —— 构造柱与墙体之间的咬合连接构造，每步退进60mm。

## 设计要点

- 构造柱最小截面不应小于240mm×180mm。
- 纵向钢筋不宜少于4根12mm直径。
- 箍筋间距不宜大于200mm，在柱上下端适当加密。
- 与墙体连接须设置马牙槎，先退后进，每步高度不大于300mm。
- 构造柱须与圈梁连接，形成封闭的空间约束体系。`,
  layers: [
    {
      name: "钢筋",
      material: "HRB400钢筋",
      thickness: 0.014,
      color: "#C44536",
      description: "纵向受力钢筋4根，直径12mm，与箍筋共同构成钢筋骨架。",
      objectName: "钢筋",
      modelPath: "/models/wall/construction-column/construction-column.glb",
    },
    {
      name: "箍筋",
      material: "HPB300钢筋",
      thickness: 0.008,
      color: "#B8302C",
      description: "直径6-8mm，间距200mm，加密区间距100mm，约束纵筋。",
      objectName: "箍筋",
      modelPath: "/models/wall/construction-column/construction-column.glb",
    },
    {
      name: "混凝土柱子",
      material: "C25混凝土",
      thickness: 0.24,
      color: "#B0A595",
      description: "截面240mm×240mm，与墙体等厚，内配钢筋笼。",
      objectName: "混凝土柱子",
      modelPath: "/models/wall/construction-column/construction-column.glb",
    },
    {
      name: "楼板",
      material: "C25钢筋混凝土",
      thickness: 0.12,
      color: "#9E9E9E",
      description: "钢筋混凝土楼板，与圈梁和构造柱整体浇筑连接。",
      objectName: "楼板",
      modelPath: "/models/wall/construction-column/construction-column.glb",
    },
    {
      name: "马牙槎",
      material: "混凝土/砌体",
      thickness: 0.06,
      color: "#C4B5A5",
      description: "马牙槎咬合连接构造，先退后进，每步退进60mm。",
      objectName: "马牙槎",
      modelPath: "/models/wall/construction-column/construction-column.glb",
    },
    {
      name: "墙体",
      material: "砖砌体",
      thickness: 0.24,
      color: "#D4A76A",
      description: "砖砌体墙体，与构造柱通过马牙槎连接，形成整体。",
      objectName: "墙体",
      modelPath: "/models/wall/construction-column/construction-column.glb",
    },
    {
      name: "圈梁",
      material: "C25钢筋混凝土",
      thickness: 0.2,
      color: "#8D8D8D",
      description: "水平方向连续封闭的钢筋混凝土梁，与构造柱形成空间约束。",
      objectName: "圈梁",
      modelPath: "/models/wall/construction-column/construction-column.glb",
    },
  ],
};

export default constructionColumnData;
