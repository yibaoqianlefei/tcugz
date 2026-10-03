# 屋面检修口模型接入

节点：`roof-access-hatch-01`，分类：屋顶。

## 提供的资料

- Blender 源文件：`D:\大三下作业\blender构件\屋面检修口.blend`
- 原导出模型：`D:\大三下作业\glb构造\屋面检修口.glb`
- 剖面图：`D:\剖面图\图片_134_02.png`
- 盖板纹理：同项目 `su构件\屋面检修口\人孔盖` 的 Wood_Veneer_01.jpg、Wood_OSB.jpg。

## 2026-10-03 盖板恢复

原 GLB 存在 `人孔盖` 节点及分解动画轨道，但未附带 mesh 引用。源 `.blend` 中存在该对象的真实网格：60 个顶点、50 个多边形、208 个面角，包含 UV 和三个材质分区。

后台 Blender 启动崩溃，故从源 `.blend` 的 SDNA 数据只读提取该网格。将 Blender Z-up 坐标转换为 glTF Y-up，三角化面并保留 UV 与材质分区，把网格附加到原 GLB 的 `人孔盖` 节点。其动画轨道负责运动，未额外叠加源文件当前帧的对象位移。

项目模型保留原 GLB 所有节点、既有网格、动画描述和原始二进制前缀，仅新增盖板数据、材质和内嵌纹理。用户提供的 `.blend`、原导出 GLB 和剖面图均未改写。

- 项目模型：`public/models/roof/roof-access-hatch/roof-access-hatch.glb`
- 构件说明：`src/data/roofAccessHatchLayers.ts`，12 个构件。
- 注册：`src/data/nodeDefinitions.ts`，采用现有节点工作台。

后续重新从 Blender 导出时，应检查 `人孔盖` 节点包含 mesh 后再覆盖项目模型，避免丢失本次恢复的盖板。

## 验证

- 浏览器验证模型及剖面加载、播放分解、反向收拢、R 复位、节点库入口，无控制台错误及失败请求。
- 浏览器验证 12 个构件、3D 点选与知识面板联动、人孔盖说明展开。
- 配置文件 ESLint 通过。
