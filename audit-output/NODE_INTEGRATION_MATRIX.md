# 全部节点接入一致性矩阵

核对方式：`nodeDefinitions.ts` 配置 ↔ `public/models` / `public/images` 实文件 ↔ GLB 二进制动画片段计数 ↔ 路由可达性。18 个 available 节点 + 3 development 节点。

## 单模型节点（15）

| id | title | category | model 存在 | diagram | scale | noAnimation | 动画片段 | 异常 |
|---|---|---|---|---|---|---|---|---|
| flat-roof-01 | 平屋面构造 | 屋顶 | ✅ | ❌ null | 2.5 | 无 | 有 | 无 diagram/thumbnail；loadContent 死 |
| sloped-roof-01 | 坡屋顶构造 | 屋顶 | ✅ | ❌ null | 2.5 | 无 | 有 | 无 diagram/thumbnail |
| roof-drainage-01 | 无组织排水屋顶 | 屋顶 | ✅ | ✅ | 2.5 | 无 | 有 | loadContent 死 |
| organized-drainage-01 | 有组织排水屋顶 | 屋顶 | ✅ | ✅ | 2.5 | 无 | 有 | loadContent 死 |
| eaves-gutter-01 | 檐沟外排水 | 屋顶 | ✅ | ✅ | 2 | 无 | 有 | — |
| cast-ribbed-floor-01 | 现浇肋梁楼板 | 楼地层 | ✅ | ✅ | 3.5 | ✅ | 无（合理） | nonInteractive:["其他"]；LibraryPage 图标因"楼底层/楼地层"回退 |
| construction-column-01 | 构造柱 | 墙体 | ✅ | ✅ | 4 | 无 | 有 | loadContent 死 |
| apron-flashing-01 | 细石混凝土散水 | 墙体 | ✅ | ✅ | 2 | 无 | 有 | — |
| stone-apron-01 | 块石散水 | 墙体 | ✅ | ✅ | 2 | 无 | 有 | ⚠️ STONE_GROUPS 键值笔误（1：2.5→1：25） |
| foam-insulation-01 | 泡沫塑料保温板外保温 | 墙体 | ✅ | ✅ | 2 | 无 | 有 | — |
| rockwool-insulation-01 | 岩棉防火保温板外保温 | 墙体 | ✅ | ✅ | 2 | 无 | 有 | — |
| faced-plinth-01 | 贴面勒脚 | 墙体 | ✅ | ✅ | 2 | ✅ | 无（合理） | — |
| stone-plinth-01 | 石砌勒脚 | 墙体 | ✅ | ✅ | 2 | ✅ | 无（合理） | — |
| plaster-plinth-01 | 抹灰勒脚 | 墙体 | ✅ | ✅ | 2 | ✅ | 无（合理） | — |
| rc-elevated-steps-01 | 钢筋混凝土架空台阶 | 楼梯 | ✅ | ✅ | 2 | 无 | 有 | — |
| stair-composition-01 | 楼梯的组成 | 楼梯 | ✅ | ✅ | 3.5 | ✅ | 无（合理） | nonInteractive:["其余"] |
| concrete-steps-01 | 混凝土台阶 | 楼梯 | ✅ | ✅ | 2 | 无 | 有 | — |

## 多模型节点（1）

| id | title | variants 数 | modelSources 数 | 一致性 | 异常 |
|---|---|---|---|---|---|
| wall-damp-proof-course | 墙身防潮层的位置 | 3（dense-base/porous-base/level-difference） | 3 | ✅ 一致 | ⚠️ layerConfig 复用 plasterPlinthLayers，objectName 与变体 mesh 名不匹配（P2）；无 diagram；多模型视图层强制 noAnimation |

## 开发中节点（3，状态 development）

| id | title | 说明 |
|---|---|---|
| yuncheng-c-01/02/03 | 案例 01/02/03 | 无模型/无 diagram，进入显示"正在开发中"；被 caseSections 教材章节引用 |

## 逐项检查结论

| 检查项 | 结论 |
|---|---|
| id 唯一 | ✅ 18+3 全部唯一 |
| title 非空 | ✅ |
| model 文件存在 | ✅ 18/18（含 3 变体） |
| diagram 存在或明确为 null | ✅（2 个节点为 null，属允许但建议补） |
| 无 0 字节文件 | ✅ |
| 路径无中文/空格（模型） | ⚠️ `public/models/background/Exhibition model.glb` 含空格（部署与脚本需引号，已确认可加载） |
| GLB 扩展名一致 | ✅ |
| 同一 GLB 被多节点引用 | ✅ 仅背景共用（Exhibition、flat-roof），节点间无冲突复用 |
| animation 声明与 GLB 一致 | ✅ 6 个 noAnimation 节点均无动画片段 |
| variants 数 = modelSources 数 | ✅ |
| mesh 名与构件列表匹配 | ⚠️ 多模型 layerConfig 不匹配（P2-9）；单模型经 canonicalName 映射正常 |
| 路由可达 | ✅ 全部 `#/node/:id` 可打开；未知 id 显示"节点不存在" |
| 残留废弃字段（section/cameraLock/explodeAxis/reverse/target） | ✅ 节点数据层零残留 |
| 幽灵节点（注册无内容） | ⚠️ 3 个 development 案例节点（有意为之） |
| 孤儿 GLB | ⚠️ 4 个 `-orig.glb`（见 ASSET_AUDIT.md） |

## 新增节点最短接入路径

**标准单模型节点**（如 foo-01）：
1. `src/data/nodeDefinitions.ts`：顶部 import 新 layers 模块 + 数组新增对象（id/title/category/model{path,scale}/diagram/layerConfig）。
2. 新建 `src/data/fooLayers.ts`（LayerInfo[] + getLayerInfo）。
3. 资产：`public/models/<category>/foo/foo.glb`、可选 `public/images/foo-diagram.png`。
4. 页面零改动（Library/NodeDetail/Home/Cases 自动读取）。

**多模型节点**（如 bar-01）：
1. `nodeDefinitions.ts`：`presentationMode:"variants"` + `variants:[{id,label,title,model{path,scale}}]`（≤3）+ 一个真值 `layerConfig`（渲染门）。
2. 资产：每 variant 一个 GLB。
3. 可选：专用 `barLayers.ts`。

**共同约束**：新节点经 DEV `validateNodeDefinitions`（id 唯一、available 必须有 model/layerConfig）；当前校验不检查 variant 的 model.path 存在性与 variants 数量上限（P3，建议补）。
