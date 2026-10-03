# 刚性防水屋面横向分格缝（一）

2026-10-03，本地接入。

- 节点 ID：`rigid-roof-transverse-joint-01`，屋顶分类。
- 模型：`public/models/roof/rigid-roof-joint/transverse-joint-01.glb`。
- 剖面：`public/images/roof/rigid-roof-transverse-joint-01-diagram.png`，保持完整原图。
- 构件映射：`src/data/rigidRoofTransverseJointLayers.ts`，9 个构件。
- 课程关联：平屋面构造章节。

## 资源来源与补齐

用户提供 GLB：`D:\大三下作业\glb构造\刚性防水屋面分格缝做法-横向分格缝之一.glb`；剖面：`D:\剖面图\屏幕截图 2026-10-03 195248.png`。

原 GLB 包含 9 个构件节点及动画，其中“二布三油”没有网格引用。对应源文件 `D:\大三下作业\blender构件\刚性防水屋面分格缝做法-横向分格缝之一.blend` 中有完整网格。只读提取 54 个顶点、50 个面、240 个面角及 UV，转换坐标轴并三角化为 140 个三角形，补入原有“二布三油”动画节点。

补入的两个材质使用源 Blender Principled BSDF 的实际基础颜色、金属度、粗糙度、IOR 和高光参数。保留原 GLB 的 8 个已有网格、全部 9 段动画、节点变换及原有二进制数据。项目 GLB 为 184124 字节；源 GLB、Blender 文件和原剖面均未改写。

教学说明以图示和构件名称为依据；剖面仅明确标注“油膏嵌缝”“二布三油”。未给出依据的厚度、配比和施工尺寸注明未标注，不将模型尺寸当作通用工程要求。

## 验证入口

`tests/rigid-roof-joint-browser.mjs` 检查完整剖面、9 个构件、补齐网格实际渲染、分解/收拢/R 复位、真实 3D 选择与说明联动、节点库入口及手机布局。

本地浏览器验证通过：点选细石混凝土刚性层可展开说明，二布三油说明与模型构件联动；390 px 布局无横向溢出，无页面错误或失败资源请求。TypeScript、相关 ESLint、节点配置契约与资源检查通过（144 个资源引用）。
