# 建筑构造交互教材 — 问题清单（P0~P4）

每条含：严重程度 / 模块 / 文件:行 / 组件·配置 / 触发条件 / 实际影响 / 证据 / 建议 / 是否立即处理。

---

## P0（阻断）

无。

---

## P1（严重）

### P1-1 多模型节点按 R 后拾取/高亮永久失效
- **模块**：NodeDetail × ModelViewer（交互门）
- **文件:行**：`NodeDetail.tsx:99-105` × `ModelViewer.tsx:377/509/535`
- **组件/配置**：`handleReset` / `highlightEnabled` / `animationProgress` 门
- **触发条件**：进入多模型节点（wall-damp-proof-course），按 R 或点重置按钮。
- **实际影响**：R 将 `animationProgress` 置 0；多模型无 AnimationMixer，`SceneModel` 不会重新 first-init，故 `animationProgress` 恒为 0 → hover（<0.99）、click（<1）、highlight（≥0.99）三个门全部锁定。用户 R 之后无法再点选/高亮构件，必须离开节点重进才能恢复。
- **证据**：浏览器实测 —— R 前点击模型命中 `level-difference::室内地面有高差001`；R 后同点 `selectedObject: null`。代码路径：`nodeStore.ts resetNodeInteractionState` 置 animationProgress=0；`ModelViewer.tsx:298` 仅在 `isFirstInit` 时置 1。
- **建议**：`handleReset` 在多模型分支 reset 后显式 `setAnimationProgress(1)`（与 noAnimation 对称）；或把三个交互门改为不依赖 `animationProgress`。
- **立即处理**：是（P1，必须）。

---

## P2（重要）

### P2-1 R 不回卷单模型 AnimationMixer（动画不归零）
- **文件:行**：`NodeDetail.tsx:99-105` × `ModelViewer.tsx:346-367`
- **触发**：单模型有动画节点动画中途按 R。
- **影响**：store `animationProgress` 归 0，但 mixer 继续播放并把 `action.time/duration` 每帧写回 store，进度条弹回真实时间，模型不归位，与"重置"语义不符。
- **证据**：浏览器实测 construction-column-01：expand 后 R，进度条 0→0.388→0.487 继续增长。
- **建议**：`handleReset` 调 `animControls.setTime(0)` + `animControls.pause()`。
- **立即处理**：是。

### P2-2 多模型 mesh 级高亮失效（scoped key 未剥离）
- **文件:行**：`ModelViewer.tsx:421`（setGroupHighlight `resolveName`）vs `:518/:545`（pick 写 `makeScopedKey(variantId,name)`）vs `:208`（meshMap 键为无前缀名）。
- **触发**：多模型节点 hover/点击任意构件。
- **影响**：`meshMapRef.get("variant::name")` 返回 undefined → 构件级高亮（hover 白 / selected 金）永不生效；只剩整方案 variant 级高亮。知识面板（parseScopedKey）正常，视觉与意图不符。
- **证据**：代码路径确认（canonicalName 不剥离 `::` 前缀，`nameUtils.ts:14-29`）。
- **建议**：`setGroupHighlight` 入口先 `parseScopedKey` 解出 objectName。
- **立即处理**：是。

### P2-3 单模型动画播放期整页每帧重渲染
- **文件:行**：`NodeDetail.tsx:27`（订阅 `s.animationProgress`）× `ModelViewer.tsx:363`（每帧 setAnimationProgress）。
- **触发**：单模型有动画节点播放动画。
- **影响**：NodeDetail 及其子组件（ControlBar/双 Panel）每帧重渲染。
- **证据**：代码路径（mixer useFrame 每帧写 store；NodeDetail 直接订阅）。
- **建议**：NodeDetail 改派生选择器（如 `animationProgress>=0.99`）或在 ControlBar 局部订阅。
- **立即处理**：建议。

### P2-4 无 404 catch-all 路由
- **文件:行**：`src/routes.tsx`（全文无 `path:"*"`）。
- **触发**：访问未知顶级路由（如 `#/foo`）。
- **影响**：渲染 React Router 默认错误页（"Unexpected Application Error! 404"），非品牌化 404；控制台 2 条错误。
- **证据**：浏览器实测 `#/does-not-exist-route` → 默认错误页 + 2 console error。
- **建议**：加 `path:"*"` → 自定义 404 页。
- **立即处理**：是。

### P2-5 教材目录锚点失效
- **文件:行**：`src/components/textbook/MarkdownComponents.tsx:11-19`（h2/h3 无 id）× `ChapterTOC.tsx:23-54`（生成 `#slug` 链接）。
- **触发**：点击教材目录项。
- **影响**：不滚动到对应标题，目录形同虚设。
- **证据**：代码路径确认（无 id、无 rehype-slug）。
- **建议**：渲染标题时加 `id={slugify}` 或引入 rehype-slug。
- **立即处理**：是（教材功能实打实缺陷）。

### P2-6 教材内容体系近空（统一学习路径未达成）
- **文件:行**：`src/data/sections/*.js`（8 模块仅 `wallSections.js:35` 的 `wall-design-requirements` 为 `available:true`）。
- **影响**：教材页大部分显示"章节内容正在建设中 / 即将上线"；唯一可用章节无正文图片、无内嵌 `/node/` 链接。另有 `wall-partition` 有 MD_MAP 内容却被 `available:false` 门控（`wallSections.js:24-29`）。
- **证据**：grep 确认仅 1 章 available:true；浏览器实测 chapter 渲染"正在建设中"。
- **建议**：放开章节、补内容、正文插图与 `/node/` 内嵌链接、统一渲染器。
- **立即处理**：否（属内容建设，量大）。

### P2-7 真实 DeepSeek key 存本地 .env.local
- **文件:行**：`.env.local`（gitignore `*.local` 排除，未入库）；`vite.config.ts:20-23` 代理打 key 前 8 位日志。
- **影响**：未泄露（gitignored、不进 bundle、仅 dev 代理）。但本地真 key 存在误提交/共享风险。
- **证据**：`git ls-files` 仅 `.env.example`；`.env.local` 含真实 `sk-*`。
- **建议**：轮换 key、加 pre-commit 扫描、移除代理打码日志。
- **立即处理**：建议（安全卫生）。

### P2-8 AI 功能生产不可用
- **文件:行**：`vite.config.ts:13-30`（/api/deepseek 仅 dev 代理）；`src/store/chatStore.ts:52`（请求相对路径）。
- **影响**：GH Pages/生产部署无后端，AIPage 请求失败。
- **建议**：明确 AI 生产部署路径（独立后端/serverless）。
- **立即处理**：否（若 AI 非本轮目标可暂缓）。

### P2-9 多模型节点 layerConfig 复用不匹配
- **文件:行**：`nodeDefinitions.ts:592-595`（wall-damp-proof-course `layerConfig` 复用 `plasterPlinthLayers`）。
- **影响**：objectName（室内外回填土/垫层/防潮层/抹灰/墙体）与变体 GLB 真实 mesh 名不匹配；当前仅充当 NodeDetail 渲染门，一旦多模型分支使用即显示错误内容。
- **证据**：agent 盘点 + 代码对比。
- **建议**：为多模型节点建立专用 layerConfig 或置空并改渲染门。
- **立即处理**：建议。

### P2-10 STONE_GROUPS 键值不一致（笔误）
- **文件:行**：`nodeDefinitions.ts:184` `"120厚块石,1：2.5水泥砂浆灌缝.001"` → 值 `"120厚块石,1：25水泥砂浆灌缝"`（1：2.5 vs 1：25）。
- **影响**：canonical 展示名错误。
- **建议**：改值 `1：2.5`。
- **立即处理**：是（一行）。

### P2-11 旋转测试零 src import（881 断言为自写模拟）
- **文件:行**：`tests/phase6-multi-model-rotation.test.ts`（无 `../src` import）。
- **影响**：881 断言保护"重实现的层级数学"，不保护真实实现（真实实现在 ModelViewer 内联，layoutModels.ts 未被使用）；测试数量虚高、防护虚假。
- **证据**：grep 无 src import；`layoutModels.ts` 无运行时消费方。
- **建议**：改为 import 真实函数或明确标注"设计规格文档"；给真实 layoutModels 加测试。
- **立即处理**：建议。

---

## P3（一般）

| # | 问题 | 文件:行 | 证据 |
|---|---|---|---|
| P3-1 | `__rotDiag` 未 DEV 门控，生产残留 window 调试写入 + 里程碑分配 Vector3 | `ModelViewer.tsx:1167-1212` | 仅 `typeof window` 判断；对比 :77/:1061 均有 DEV 守卫 |
| P3-2 | 4 个孤儿 `-orig.glb`（≈10.5MB）打进产物 | `public/models/**/*-orig.glb` | 全库 grep `.glb` 无 `-orig` 命中 |
| P3-3 | `src/data/nodes.ts` 遗留硬编码数组，零引用 | `nodes.ts:1-11` | grep 无 import |
| P3-4 | 4 个 loadContent 内容模块含并行 layers/modelPath/cameraPosition，`getNodeData()` 无调用者 | `nodeDefinitions.ts:217/260/282/353`、`getNodeData:836` | 无消费方 |
| P3-5 | 单模型 R 只恢复 target 不恢复 zoom/环绕（单多模型 R 语义不对称） | `ModelViewer.tsx:771-796` | 单模型分支只写 controls.target |
| P3-6 | 单/多模型两套相机逻辑未完全统一 | `ModelViewer.tsx:771` vs `:800` | 单模型 z=8 target-only；多模型距离拟合 |
| P3-7 | 爆炸位移被 sharedDisplayScale 世界空间放大（待实测） | `ModelViewer.tsx:983` × `nodeDefinitions.ts:621` | 位移在 scale=1 局部空间，父级 DisplayScale 放大 |
| P3-8 | 双图标库 lucide-react + react-icons；`categorizeQuestion` 在 AIPage 与 DataAnalysis 重复实现 | `LibraryPage.tsx:3`、`AIPage.tsx:9-18`、`DataAnalysis.tsx:31-40` | 双库/逻辑重复 |
| P3-9 | `[GLB]` 动画/缩放 console.log 未 DEV 门控（进生产控制台） | `ModelViewer.tsx:131-160` | 无 import.meta.env.DEV |
| P3-10 | 多模型未选方案时爆炸滑块/箭头无效但不禁用 | `ModelViewer.tsx:1298` × `NodeDetail.tsx:268` | activeExplodeVariantId 为空时位移恒 0 |
| P3-11 | LibraryPage 类别图标"楼底层"vs 节点"楼地层"，cast-ribbed-floor 图标回退 📦 | `LibraryPage.tsx:10` vs `nodeDefinitions.ts:312` | 键值不匹配 |
| P3-12 | 占位/死链：/tools、/contribute（PlaceholderPage）、/games（占位）；HomePage"构造原理"6 子项无 to；menu.ts 死代码指向失效路径 | `routes.tsx:33-34`、`HomePage.tsx:143-152/661`、`menu.ts:23-39` | 页面可访问空内容 |
| P3-13 | MarkdownRenderer 无页面引用，与 MarkdownComponents 双渲染器漂移 | `MarkdownRenderer.tsx` vs `MarkdownComponents.tsx` | grep 无引用 |
| P3-14 | tests 不受 tsc 类型检查（tsconfig.app include 仅 src）；acceptance.mjs 不在 npm test | `tsconfig.app.json:25`、`package.json:14` | 配置确认 |
| P3-15 | flat-roof-01、sloped-roof-01 无 diagram 也无 thumbnail | `nodeDefinitions.ts:201/228` | 字段 null |
| P3-16 | LibraryPage 页脚三个 `href="#"` 死锚点 | `LibraryPage.tsx:104-112` | 点击回页首 |

---

## P4（建议）

- layoutModels.ts 死代码，与 ModelViewer 内联边距常量漂移（`layoutModels.ts:26-29` vs `ModelViewer.tsx:870-872`）。
- 多模型卸载不置空 `__modelScene` 悬空引用（`ModelViewer.tsx:1038/1103`）。
- 多模型分支硬编码 `noAnimation/nonInteractive`，忽略节点配置（`ModelViewer.tsx:1335-1336`）。
- `variants/` 目录（VariantModelViewer/VariantScene 等）全库无 import，死代码。
- 多模型 autoRotate 期间 fit 用标准姿态静态值，90°/270° 可能轻微裁切（padding 收紧时暴露）。
- /ai、/resources 无主导航入口（仅 /ai-extend tab 内嵌）。

---

## 待验证假设（未作确认）

- 爆炸位移被 sharedDisplayScale 缩放的幅度（P3-7）——需渲染实测。
- StrictMode 下多模型 layout 使用首挂载克隆场景（dev-only 疑点）。
- ControlBar 在 <360px 视口可能横向溢出（未实测）。
- `#/node/:id` 在 GH Pages 真实刷新（hash 路由逻辑成立，未真机复现）。
