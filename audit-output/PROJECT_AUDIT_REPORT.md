# 建筑构造交互教材 — 全项目审计报告

审计性质：**只读**。未修改任何源码、资产、配置或依赖。
审计时点：2026-08-04，HEAD `b37f9c2 修复ui`。

---

## 1. 执行摘要

项目当前处于**功能整合阶段末期、稳定化阶段前期**。核心 3D 交互（单/多模型加载、统一比例、独立旋转、联合相机拟合、爆炸、Picking、高亮、控制栏白名单）工程上全部通过（1281 断言、tsc 0、build OK、lint 0 错误），浏览器 15 个路由全部正常打开、0 控制台错误、4 个 3D 节点控制栏 477px 干净、多尺寸无横向溢出。最大优点：**单一节点数据源 + 统一的单/多模型 UI 壳层 + 材质克隆隔离 + 已被测试保护的相机拟合**。最大风险：**存在 1 个 P1 缺陷——多模型节点按 R 重置后拾取/高亮永久失效**（浏览器实测确认），以及**教材内容体系基本为空**（仅 1 章 available）。

结论：**适合继续扩展节点**，但应先在 3~6 项第一优先级整改（含 P1）后进入批量节点建设。不是"修底层"vs"加内容"的二选一——底层只有一个必须修的 P1，其余是内容与测试补齐。

---

## 2. 项目基线

| 项 | 值 |
|---|---|
| 项目路径 | `d:\vscode project\建筑构造交互教材` |
| 分支 / HEAD | `main` / `b37f9c2 修复ui` |
| Git 工作区 | **非干净**：18 个已跟踪修改（Section/CameraLock 删除链）+ 6 个未跟踪（截图×4、verify-deletion.mjs） |
| 未提交内容 | 上轮"废弃高级功能删除"工作尚未提交（D 删除 ×7、M ×10、截图、脚本） |
| Node / npm | v24.15.0 / 11.12.1，包管理器 npm，仅 1 个 lockfile `package-lock.json` |
| React / Three.js / R3F / Drei | ^19.2.6 / ^0.184.0 / ^9.6.1 / ^10.7.7 |
| Zustand / TS / Vite / Router | ^5.0.14 / ~6.0.2 / ^8.0.12 / react-router-dom ^7.18.0（createHashRouter） |
| 测试 / 浏览器 | tsx（纯逻辑）/ playwright（acceptance.mjs，未纳入 npm test） |
| ESLint / tsconfig | eslint 10 + typescript-eslint，覆盖 `**/*.{ts,tsx}`；tsconfig.app 仅 include `src`（**tests 不被 tsc 检查**） |
| 构建入口 / base | `index.html`→`src/main.tsx`（React.StrictMode）；生产 base=`/tcugz/`，dev base=`/` |
| public 资源规则 | 一律经 `assetPath()`（nodeDefinitions.ts:36-40）拼 `BASE_URL`；模型在 `public/models/`、图在 `public/images/` |

package.json 与 lockfile 同步（无 diff）；无重复 lock 文件；无失效脚本（`compress-models`、`predeploy`、`deploy` 均为真实工具）。README 与项目实际一致。

---

## 3. 真实架构

```
nodeDefinitions.ts（唯一数据源，21 节点）
  └─ nodesIndex.ts（纯转发兼容层）
        ├─ LibraryPage / CasesPage / HomePage / CurriculumPage / DataAnalysis（读列表）
        └─ 路由 #/node/:id → NodeDetail
              ├─ resolveNodeModelSources（单/多模型判定，MAX_MODELS=3）
              ├─ ModelViewer（R3F Canvas）
              │    ├─ SceneModel（单模型：GLTF clone + 自动尺寸 + AnimationMixer + picking）
              │    └─ MultiModelGroup（多模型：LayoutRoot→RotationPivot→DisplayScale→CenterOffset→SceneModel ×N）
              │         ├─ layoutModels()（统一 scale / layoutX / 联合 _fitBox，仅跑一次）
              │         ├─ CameraTracker（fit：单模型 z=8 target-only；多模型联合包围盒距离拟合）
              │         ├─ explode useFrame（explodeProgress 驱动绝对位移）
              │         └─ 自转 useFrame（pivot.rotation.y += 0.12·dt）
              ├─ ControlBar（唯一白名单 UI：explode|reset|link|lighting）
              └─ ConstructionKnowledgePanel（右侧知识联动）
```

- **数据来源**：nodeDefinitions.ts 单一源；nodesIndex 纯转发。
- **读取/转换**：resolveNodeModelSources、resolveVariantExplodeConfig、resolveComponentKnowledge。
- **渲染**：ModelViewer（R3F Canvas）→ SceneModel / MultiModelGroup。
- **状态**：nodeStore（Zustand）——selected/hovered/animationProgress/explodeProgress/refitToken/linkage。
- **副作用**：ModelViewer 内 useFrame（mixer 更新、自转、爆炸、target-follow）；动画写回 store。
- **清理**：SceneModel cleanup（dispose 材质、取消注册动画、置空 modelScene 单模型）；多模型不置空 `__modelScene`（P4 悬空）。

---

## 4. 已确认稳定的能力（有测试/浏览器证据）

1. 单一节点数据源（21 节点 id 唯一，18 available + 3 development；全库仅 nodeDefinitions 是活注册表）。
2. 单/多模型共用同一 ControlBar 白名单（explode|reset|link|lighting，浏览器 4 节点验证 5 按钮/1 滑块/3 分隔线/477px）。
3. 多模型统一比例 + 独立绕自身中心旋转 + 联合包围盒初始拟合（881 条层级不变量 + 浏览器实测 fitDistance 26.92/padding 1.5，完整自转周期零相机写入）。
4. 材质克隆隔离、高亮可恢复、不污染共享材质（explodeLayout/nameUtils 测试覆盖）。
5. 删除后的废弃高级功能零残留（nodeDetail-controls.test.ts 断言文件/字段/能力不存在；浏览器 DOM 无剪刀/X/Y/Z/反/锁定）。
6. 全路由无白屏、0 控制台错误、无横向溢出（1920/1366/800 三档实测）。

---

## 5. 主要问题

完整清单见 PROJECT_AUDIT_ISSUES.md。摘要：

| 级别 | 问题 |
|---|---|
| **P1** | 多模型节点按 R 后拾取/高亮永久失效（浏览器实测：R 前点击可选构件，R 后点击无反应） |
| **P2** | R 不回卷单模型 AnimationMixer；多模型 mesh 级高亮 scoped key 未剥离；单模型动画播放期整页每帧重渲染；无 404 catch-all；教材目录锚点失效；教材内容近空；真实 DeepSeek key 存本地 .env.local；AI 生产不可用；wall-damp-proof layerConfig 复用不匹配；STONE_GROUPS 键值笔误；旋转测试零 src import |
| **P3** | `__rotDiag` 未 DEV 门控（生产残留）；4 孤儿 GLB ≈10.5MB；nodes.ts/loadContent 死代码；双图标库；[GLB] console.log 未门控；多模型未选方案时爆炸滑块无效；LibraryPage 类别图标"楼底层"vs"楼地层"；占位页 /tools /contribute /games；tests 不受 tsc 覆盖 |
| **P4** | layoutModels.ts 死代码/常量漂移；多模型卸载 __modelScene 悬空；若干 UX 细节 |

---

## 6. 节点接入一致性

18 个 available 节点全部：id 唯一、title 非空、model/diagram 文件真实存在、noAnimation 与 GLB 动画一致。异常集中在：wall-damp-proof-course 的 layerConfig 复用 mismatch（P2）、STONE_GROUPS 键值笔误（P2）、2 个节点无 diagram（P3）、多模型分支硬编码 noAnimation（P4）。详见 NODE_INTEGRATION_MATRIX.md。

## 7. 单模型与多模型统一性

**已统一**：ControlBar、数据源、pick 事件体系、材质克隆、爆炸 progress、fitKey 门控、R→requestCameraRefit。
**仍为特例**：相机逻辑（单模型 z=8 target-only，多模型距离拟合）；mesh 级高亮 scoped key 解析（多模型失效）；R 行为不对称（多模型不恢复动画进度 1 → 触发 P1）。

## 8. Runtime 与状态风险

- 双真相：`AnimationAction.time` 权威，store `animationProgress` 每帧镜像（一致性 OK，但导致整页每帧重渲染 P2）。
- 每帧分配：单模型 target-follow `box.setFromObject` 全场景遍历；爆炸每帧 new 数组；规模小（P3）。
- 生命周期：StrictMode 双挂载用 token/readyRef 守卫基本正确；多模型 `__modelScene` 卸载不置空（P4）。
- 残留：`__rotDiag` 未 DEV 门控（P3）；`__cameraWrites`/`__multiModelDebug` 均已 DEV 门控。

## 9. 模型与资产

GLB 21.7MB 总量，其中 **≈10.5MB 是 4 个 `-orig.glb` 孤儿备份**（未被任何引用）。节点与背景共用 2 个 GLB（Exhibition model、flat-roof）属合理复用。详见 ASSET_AUDIT.md。

## 10. 教材产品完整度

**未形成闭环**。结构化脚手架（模块→章节→description→nodeIds）齐备，但：仅 1 章 `available:true`；正文无图片、无内嵌 `/node/` 链接；目录锚点失效；存在双渲染器（MarkdownComponents 使用 / MarkdownRenderer 死代码）。"文字-图片-表格-可交互模型节点"统一学习路径尚未达成（P2）。

## 11. 测试可信度

1281 断言全过，但 **881 条来自 phase6-multi-model-rotation（零 src import 的自写模拟）**，保护的是"重实现的数学"而非真实实现。真实保护集中在：相机拟合（59）、数据源解析（142）、爆炸（134）、控制栏/删除验证（65）。**缺口**：无节点数据源/资产存在性/路由/动画/错误态/教材跳转测试；浏览器 E2E（acceptance.mjs）未纳入 npm test。详见 TEST_AUDIT.md。

## 12. 性能与浏览器验收

- 15 路由逐页：0 白屏、0 console error、0 网络 404（除 unknown 路由触发 React Router 默认错误页）。
- 4 个 3D 节点：控制栏结构/宽度一致；多模型 A/B/C 完整；自转活跃、完整周期零相机写入；orbit/zoom/pan 正常。
- 多尺寸（1920/1366/800）：无横向溢出。
- 性能短板：单模型动画播放期 NodeDetail 每帧重渲染（P2，代码确认）；GLB 总 21.7MB（含死重 10.5MB）。未实测 FPS/内存（如实说明，无编造数据）。

## 13. 安全和部署风险

- `.env.local` 含真实 DeepSeek key，但被 `*.local` gitignore 排除、未入库、仅 dev 代理读取、不进前端 bundle（**未泄露**）。风险：本地真 key 有误提交/共享风险；代理把 key 前 8 位打日志（P2/P3 密钥卫生）。
- 无 `dangerouslySetInnerHTML`；react-markdown 默认转义；外链均 https + noopener noreferrer；无 localStorage 风险。
- 部署：生产 base `/tcugz/` 构建产物前缀正确；**AI 功能生产不可用**（/api/deepseek 仅 vite dev 代理，GH Pages 无后端）。

## 14. 项目评分（100 分制）

| 维度 | 分 | 扣分原因 / 证据 | 提升到更高分的必要条件 |
|---|---|---|---|
| 架构清晰度 15 | **11** | 死代码多（nodes.ts/layoutModels/loadContent 模块/MarkdownRenderer/menu.ts）、双渲染器、内联 vs 纯函数重复 | 清理死代码、统一渲染器与 layout 纯函数 |
| 节点数据一致性 15 | **11** | 单一源确认，但 layerConfig 复用 mismatch、STONE_GROUPS 笔误、无资产存在性测试 | 修 2 个 P2 + 资产存在性测试 |
| 3D Runtime 稳定性 15 | **9** | P1（R 禁用交互）、每帧重渲染、__rotDiag 残留 | 修 P1 + DEV 门控 + 订阅收敛 |
| 单/多模型统一性 10 | **6** | 相机两套逻辑、mesh 高亮 scoped key 未统一、R 不对称 | 统一高亮 key 解析 + R 语义 |
| 交互可靠性 10 | **6** | P1 直接破坏多模型交互；单模型侧可靠 | 修 P1 |
| 教材内容体系 10 | **4** | 仅 1 章、正文无图/无节点链接 | 放开章节 + 补内容 + 锚点 |
| 测试与工程质量 10 | **5** | 881 条模拟测试、缺核心保护、E2E 未纳入 | 补数据源/资产/路由测试 |
| 性能 5 | **3** | 每帧重渲染、GLB 死重 | 订阅收敛 + 清理孤儿资产 |
| UI/响应式/可访问性 5 | **3.5** | 控制栏干净、aria 齐全、无溢出；教材锚点失效 | 修 TOC 锚点 |
| 可扩展性与维护性 5 | **4** | 新增节点路径清晰（数据+资产+可选 layers）；死代码拖累 | 清理死代码 |
| **总分** | **62.5** | | |

## 15. 整改路线

**第一优先级（立即）**：
1. 修 P1：多模型 R 后拾取/高亮失效（NodeDetail handleReset 多模型分支恢复 animationProgress=1，或改交互门不依赖 animationProgress）。
2. 修 P2：单模型 R 回卷 AnimationMixer（handleReset 调 animControls.setTime(0)）。
3. 修 P2：多模型 mesh 高亮 scoped key 剥离（setGroupHighlight 先 parseScopedKey）。
4. 补保护：节点数据源 + 资产存在性 + 路由测试；给 phase6-multi-model-rotation 接真实 import。
5. 加 `path:"*"` 404 路由。

**第二优先级（稳定后）**：修教材目录锚点；清理孤儿 GLB / 死代码；单模型动画重渲染订阅收敛；密钥卫生（轮换 + 去掉代理日志）；教材内容批量补齐。

**第三优先级（暂缓）**：大规模重构、技术栈替换、双渲染器合并、layoutModels 与内联合并（无运行影响时可放）。

## 16. 最终结论

- **当前最危险的问题**：P1 —— 多模型节点按 R 后拾取/高亮永久失效（浏览器确认，必须重进节点才能恢复）。
- **当前最稳定的基础**：单一节点数据源、统一 UI 壳层、多模型层级旋转与联合相机拟合、材质克隆隔离、控制栏白名单、删除后的功能清理。
- **下一步应先做什么**：修 P1 + 2 个 P2（R 回卷、mesh 高亮 key），加数据源/资产/路由三组保护测试。
- **哪些内容不要再动**：相机拟合算法与 padding、layoutModels/5 层层级、ControlBar 结构与样式、模型 scale 与间距、自转速度。
- **是否可以进入批量节点建设**：**可以，但有前置条件**——先修 P1 并加资产存在性测试；之后新增节点只需"数据 1 处 + GLB/图 + 可选 layers 文件"，页面零改动，路径已通。
