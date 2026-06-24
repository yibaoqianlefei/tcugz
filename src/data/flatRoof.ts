const flatRoofData = {
  id: "flat-roof-01",
  title: "平屋面构造",
  category: "屋顶",
  description:
    "典型上人平屋面构造，由上至下共六层，适用于寒冷及夏热冬冷地区。",
  directionLabel: "由上至下：保护层→结构层",
  explodeAxis: "y",
  floatDirection: "z",
  floatDistance: 0.22,
  cameraPosition: [4, 5, 6],
  content: `# 平屋面构造

## 概述

平屋面是指屋面坡度小于5%的屋顶形式，广泛应用于住宅、公共建筑及工业厂房。上人平屋面除满足防水、保温基本功能外，还需承受人行荷载，因此对保护层和结构层的要求较高。本节点展示的是典型倒置式屋面构造，适用于寒冷及夏热冬冷地区。

## 构造层次（由上至下）

1. **保护层** —— 细石混凝土或防滑地砖，厚度40mm，保护防水层免受紫外线老化和机械损伤，上人屋面可兼作使用面层。
2. **防水层** —— SBS改性沥青防水卷材，厚度约10mm，是屋面防水核心层，通常采用两层或三层铺设以确保抗渗性能。
3. **找平层** —— 1:3水泥砂浆，厚度20mm，为防水层提供平整坚固的基层，确保卷材铺设无空鼓。
4. **保温层** —— 挤塑聚苯板（XPS），厚度100mm，抗压强度高、吸水率低，适合倒置式屋面置于防水层之上。
5. **找坡层** —— 轻集料混凝土，最薄处30mm，向落水口方向找坡（通常2%），形成排水坡度。
6. **结构层** —— 钢筋混凝土屋面板，厚度150mm，承受屋面全部荷载并传递给梁柱。

## 设计要点

- 排水坡度不应小于2%，天沟、檐沟纵坡不小于1%。
- 卷材防水层在女儿墙、管道根部等节点处需做附加层，上返高度不小于250mm。
- 保温层应错缝铺设，避免热桥。
- 保护层应设分格缝，间距不宜大于6m。`,
  layers: [
    {
      name: "保护层",
      material: "细石混凝土/地砖",
      thickness: 0.04,
      color: "#C4B5A5",
      description:
        "保护防水层免受机械损伤和紫外线老化，上人屋面可兼作使用面层。",
      modelPath: "/models/roof/flat-roof/flat-roof.glb",
    },
    {
      name: "防水层",
      material: "SBS改性沥青防水卷材",
      thickness: 0.01,
      color: "#3A3A3A",
      description:
        "屋面防水核心层，防止雨水渗入结构，通常为两层或三层铺设。",
      modelPath: "/models/roof/flat-roof/flat-roof.glb",
    },
    {
      name: "找平层",
      material: "1:3水泥砂浆",
      thickness: 0.02,
      color: "#B0A595",
      description:
        "为防水层提供平整、坚固的基层，厚度20mm。",
      modelPath: "/models/roof/flat-roof/flat-roof.glb",
    },
    {
      name: "保温层",
      material: "挤塑聚苯板 (XPS)",
      thickness: 0.10,
      color: "#F0A04B",
      description:
        "屋面保温核心层，挤塑板抗压强度高、吸水率低，适合倒置式屋面。",
      modelPath: "/models/roof/flat-roof/flat-roof.glb",
    },
    {
      name: "找坡层",
      material: "轻集料混凝土",
      thickness: 0.08,
      color: "#A0A0A0",
      description:
        "形成屋面排水坡度（通常2%），最薄处30mm，向落水口方向找坡。",
      modelPath: "/models/roof/flat-roof/flat-roof.glb",
    },
    {
      name: "结构层",
      material: "钢筋混凝土屋面板",
      thickness: 0.15,
      color: "#808080",
      description:
        "建筑主体承重结构，承受屋面全部荷载并传递给梁柱。",
      modelPath: "/models/roof/flat-roof/flat-roof.glb",
    },
    
  ],
};

export default flatRoofData;
