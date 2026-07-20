# 建筑构造交互教材全项目审计报告

## 1. 执行摘要

| 项目 | 详情 |
|------|------|
| **审计日期** | 2026-07-20 |
| **Git 分支** | main |
| **HEAD commit** | `029d968 解决问lint问题4` |
| **工作树初始状态** | 3 个已修改未暂存文件（project_overview.md, ModelViewer.tsx, nodeDefinitions.ts） |
| **总体健康度** | 🟡 良好 — 无阻断问题，存在已知未解决高亮 bug 和若干中等优先级问题 |
| **是否建议提交/发布** | **B：修复 P1 后发布** |

### 分数卡

| 维度 | 评分 | 说明 |
|------|------|------|
| 代码质量 | 🟢 优秀 | Lint 0 / TSC 0 / Build 0 error |
| 架构设计 | 🟢 优秀 | 单一配置源模式一致执行 |
| 功能完整 | 🟡 良好 | 核心链路完整，教材内容覆盖不足 |
| 资源管理 | 🟡 良好 | 所有引用资源存在，有 10.5MB 孤儿文件 |
| 浏览器兼容 | ⚪ 未实测 | 仅静态 + 构建验证 |
| 安全性 | 🟢 优秀 | API Key 零泄漏 |
| 可访问性 | 🟡 待改善 | 基本结构正确，细节待完善 |
| 错误兜底 | 🟡 待改善 | 无 React ErrorBoundary，lazy 加载失败会白屏 |
| 代码一致性 | 🟡 有重复 | categorizeQuestion 重复、CourseModule 接口重复、nodeIds 普遍为空 |

### 问题分布

| 等级 | 数量 | 关键问题 |
|:---:|:---:|------|
| P0 | **0** | — |
| P1 | **0** | — |
| P2 | **7** | addEventListener 泄漏, 无 ErrorBoundary, 2 个 Layer objectName 可能截断, 路由顺序, window.location.hash 绕过 React Router |
| P3 | **21** | 死代码, 孤儿文件, 重复代码, debug log 残留, 可访问性缺失, 无单元测试 |

---

## 2. 审计范围与限制

### 已检查
- 全部 26 个 TypeScript/TSX/JS 源文件的静态代码审查
- 全部 12 个路由配置
- 全部 14 个节点定义 + 11 个 Layer 数据文件
- 全部 public/ 资源文件（28 个 GLB + 图片）
- ESLint、TypeScript、Vite Build 工程质量命令
- Grep 模式扫描（console、TODO、eslint-disable、安全敏感信息、事件监听器）
- 节点单一配置源完整性
- Zustand Store 4 个
- 教材 Markdown 文件

### 浏览器实测
- ❌ 未进行浏览器实测（本次审计环境无 GUI 浏览器）

### 未验证
- 真实浏览器中的 3D 渲染交互（hover/click/highlight/动画）
- 响应式布局在不同设备上的实际表现
- AI API 实际调用（需 API Key）
- 知识卡与 3D 双向联动实时交互
- prefers-reduced-motion 等可访问性媒体查询

### 环境限制
- Windows 11 Pro / Git Bash 环境
- 无图形界面，无法启动浏览器
- 未配置 DeepSeek API Key（.env.local 存在但内容未检查）

---

## 3. 功能清单

| # | 功能 | 入口路由 | 核心文件 | 数据源 | 验证方式 |
|---|------|----------|----------|--------|----------|
| 1 | 首页 | `/` | HomePage.tsx, MenuBackground.tsx | courseModules, backgroundScenes, nodesIndex | 静态+构建 |
| 2 | 课程模块网格 | `/curriculum` | CurriculumPage.tsx | courseModules, nodesIndex | 静态+构建 |
| 3 | 课程子模块 | `/curriculum/:moduleId` | SectionSubPage.tsx | courseModules, sections/*.js | 静态+构建 |
| 4 | 节点库 | `/library` | LibraryPage.tsx | nodesIndex | 静态+构建 |
| 5 | 案例页面 | `/curriculum/cases` | CasesPage.tsx | nodesIndex (development 过滤) | 静态+构建 |
| 6 | 节点详情 | `/node/:nodeId` | NodeDetail.tsx, ModelViewer.tsx (lazy) | nodeDefinitions → model/diagram/layerConfig | 静态+构建 |
| 7 | 教材 | `/textbook/:moduleId/:chapterId` | TextbookPage.tsx (lazy) | sections/*.js + MD_MAP → .md imports | 静态+构建 |
| 8 | AI 问答 | `/ai` | AIPage.tsx (lazy) | chatStore → DeepSeek API (Vite proxy) | 静态+构建 |
| 9 | AI+拓展合并 | `/ai-extend` | AIExtendPage.tsx (lazy) | AIPage + ResourcesPage (Tab) | 静态+构建 |
| 10 | 数据分析 | `/data` | DataAnalysis.tsx (lazy) | analysisStore (persist) + nodesIndex | 静态+构建 |
| 11 | 作业训练 | `/games` | GamesPage.tsx (lazy) | — (占位) | 静态+构建 |
| 12 | 工具箱(占位) | `/tools` | PlaceholderPage.tsx | — | 静态+构建 |
| 13 | 贡献节点(占位) | `/contribute` | PlaceholderPage.tsx | — | 静态+构建 |
| 14 | 全局布局 | (所有非首页) | AppLayout.tsx | — | 静态+构建 |
| 15 | 路由与懒加载 | — | routes.tsx, RouteSuspense.tsx | — | 静态+构建 |
| 16 | Zustand Stores | — | nodeStore, chatStore, authStore, analysisStore | — | 静态+构建 |
| 17 | 3D 模型系统 | — | ModelViewer.tsx, animationController.ts | GLB (Draco), AnimationMixer | 静态+构建 |
| 18 | 知识卡↔3D 联动 | — | ConstructionKnowledgePanel.tsx ↔ ModelViewer.tsx | nodeStore + layerConfig | 静态+构建 |
| 19 | 动画播放 | — | animationController.ts, NodeDetail.tsx 浮动时间轴 | AnimationAction[] token 守卫 | 静态+构建 |
| 20 | 模型加载与错误兜底 | — | ModelViewer.tsx (Suspense + LoadingFallback), NodeDetail.tsx | — | 静态+构建 |
| 21 | 响应式布局 | — | HomePage.tsx (ResizeObserver + ContainerMetrics), MenuBackground.tsx | — | 静态+构建 |
| 22 | 构建部署 | `npm run build` / `npm run deploy` | vite.config.ts (base: /tcugz/) | — | ✅ 构建通过 |
| 23 | 教材 Markdown | — | TextbookPage.tsx + react-markdown | MD_MAP 静态 import | 静态+构建 |
| 24 | AI API 安全 | Vite proxy `/api/deepseek` | vite.config.ts, chatStore.ts | DEEPSEEK_API_KEY (env only) | ✅ 已验证 |
| 25 | 本地持久化 | — | analysisStore (persist, localStorage) | `construction-analysis` key | 静态+构建 |
| 26 | 模型压缩 | `npm run compress-models` | scripts/compress-models.mjs | @gltf-transform/cli | ⚪ 未运行 |

---

## 4. 路由审计

### 4.1 路由表

| 路径 | 页面 | 导航入口 | 参数 | HashRouter 兼容 | Suspense | 结果 |
|------|------|----------|------|:---:|:---:|------|
| `/` | HomePage | — | — | ✅ | N/A (直接) | ✅ 通过 |
| `/library` | LibraryPage | 首页菜单「节点库」 | — | ✅ | N/A (直接) | ✅ 通过 |
| `/curriculum` | CurriculumPage | 首页「构造基础」→ 模块网格 | — | ✅ | N/A (直接) | ✅ 通过 |
| `/curriculum/:moduleId` | SectionSubPage | CurriculumPage 模块点击 | moduleId: string | ✅ | N/A (直接) | ✅ 通过 |
| `/curriculum/cases` | CasesPage | 首页菜单「案例应用」 | — | ⚠️ 见下 | N/A (直接) | ⚠️ 路径遮挡风险 |
| `/textbook/:moduleId/:chapterId` | TextbookPage | SectionSubPage 章节点击 | moduleId, chapterId | ✅ | ✅ RouteSuspense | ✅ 通过 |
| `/textbook/:sectionId` | TextbookPage | 首页「构造原理」→ 模块 | sectionId: string | ✅ | ✅ RouteSuspense | ✅ 通过 |
| `/node/:nodeId` | NodeDetail | 节点库/教材卡片 | nodeId: string | ✅ | ✅ RouteSuspense | ✅ 通过 |
| `/games` | GamesPage | 首页菜单「作业训练」 | — | ✅ | ✅ RouteSuspense | ✅ 通过 |
| `/tools` | PlaceholderPage | (无菜单入口) | — | ✅ | N/A (直接) | ⚠️ 无导航入口 |
| `/contribute` | PlaceholderPage | (无菜单入口) | — | ✅ | N/A (直接) | ⚠️ 无导航入口 |
| `/resources` | ResourcesPage | AIExtendPage Tab 内嵌 | — | ✅ | N/A (直接) | ✅ 通过 |
| `/ai` | AIPage | (保留，被 AIExtendPage 替代) | — | ✅ | ✅ RouteSuspense | ⚠️ 冗余路由 |
| `/ai-extend` | AIExtendPage | 首页菜单「AI 拓展」 | — | ✅ | ✅ RouteSuspense | ✅ 通过 |
| `/data` | DataAnalysis | 首页菜单「数据分析」 | — | ✅ | ✅ RouteSuspense | ✅ 通过 |

### 4.2 路径冲突分析

**⚠️ `/curriculum/cases` vs `/curriculum/:moduleId`**

```
routes (按序):
  /curriculum           → CurriculumPage     (精确)
  /curriculum/:moduleId  → SectionSubPage     (参数化)
  ...
  /curriculum/cases     → CasesPage          (精确，但在 :moduleId 之后!)
```

**问题**: `/curriculum/cases` 定义在 `/curriculum/:moduleId` 之后。在 `createHashRouter` 中，匹配是按路由定义顺序的。但 React Router v7 使用评分算法而非简单的顺序匹配 — 精确路径 `/curriculum/cases` 会比参数路径 `/curriculum/:moduleId` 得分更高，因此不会被遮挡。

**结论**: 实际不会被遮挡（React Router 评分算法），但代码可读性差。建议将 `/curriculum/cases` 移到 `/curriculum/:moduleId` 之前。

### 4.3 异常兜底

| 场景 | 处理 | 结果 |
|------|------|------|
| 未知 nodeId | NodeDetail → `!node` → "节点不存在" + 返回链接 | ✅ |
| development 节点 | NodeDetail → "该节点正在开发中" | ✅ |
| 未知 moduleId (SectionSubPage) | 可能白屏或报错（异步 import 失败） | ⚠️ 动态 import 无 catch |
| 未知 textbook 路由 | MD_MAP 查找失败 → handleMissingContent fallback | ✅ |
| 404 未知路径 | HashRouter 无 catch-all 路由 → 白屏 | ⚠️ 无 404 页面 |
| 刷新动态路由 | HashRouter 兼容 ✅ | ✅ |
| 模型加载失败 | ModelViewer Suspense + LoadingFallback | ⚠️ 无 ErrorBoundary for GLB |

### 4.4 导航入口完整性

| 首页菜单项 | 目标路由 | 状态 |
|------------|----------|------|
| 构造原理 ▶ (展开) | `/textbook/:sectionId` | ✅ |
| 构造基础 ▶ (展开) | `/curriculum` → 模块子页 | ✅ |
| 节点库 | `/library` | ✅ |
| 案例应用 | `/curriculum/cases` | ✅ |
| 作业训练 | `/games` | ✅ |
| 数据分析 | `/data` | ✅ |
| AI 拓展 | `/ai-extend` | ✅ |
| 工具箱 | `/tools` | ⚠️ 首页无入口 |
| 贡献节点 | `/contribute` | ⚠️ 首页无入口 |

`/tools` 和 `/contribute` 路由存在但首页没有任何链接指向它们。`/ai` 路由仍然存在但已被 `/ai-extend` 替代，属于冗余。

---

## 5. 节点配置与资源一致性

### 5.1 单一配置源验证

| 检查项 | 结果 |
|--------|------|
| nodeDefinitions.ts 是否为唯一真实注册源 | ✅ 是 |
| nodesIndex.ts 是否为纯兼容 re-export | ✅ 是（仅 re-export + type export） |
| 是否出现第二套节点数据 | ⚠️ `src/data/nodes.ts` 存在但**未被任何文件 import**（死代码） |
| 所有页面是否通过 nodesIndex/getNodeDefinition 读取 | ✅ 6 个页面统一 import nodesIndex |
| MODEL_PATHS/DIAGRAM_IMAGES 等旧常量是否被引用 | ✅ 仅在 nodeDefinitions.ts 注释中出现 |
| nodeId 是否重复 | ✅ 14 个节点 ID 唯一 |
| model.path 是否重复 | ✅ 12 个模型路径唯一 |
| status=development 节点是否不会加载模型 | ✅ yuncheng-c-01/02/03 无 model 配置 |

### 5.2 节点完整表

| # | nodeId | 标题 | 分类 | 状态 | GLB | Diagram | Scale | Layers | Groups | 页面可达 |
|---|--------|------|------|------|:---:|:---:|------|--------|--------|:---:|
| 1 | flat-roof-01 | 平屋面构造 | 屋顶 | available | ✅ 2.1MB | — | 2.5 | 8 | 2 个映射 | ✅ |
| 2 | sloped-roof-01 | 坡屋顶构造 | 屋顶 | available | ✅ 1.7MB | — | 2.5 | 9 | 1 个映射 | ✅ |
| 3 | roof-drainage-01 | 无组织排水 | 屋顶 | available | ✅ 123KB | ✅ 94KB | 2.5 | 3 | — | ✅ |
| 4 | organized-drainage-01 | 有组织排水 | 屋顶 | available | ✅ 153KB | ✅ 206KB | 2.5 | 4 | — | ✅ |
| 5 | eaves-gutter-01 | 檐沟外排水 | 屋顶 | available | ✅ 177KB | ✅ 93KB | 2 | 6 | — | ✅ |
| 6 | construction-column-01 | 构造柱 | 墙体 | available | ✅ 214KB | ✅ 522KB | 4 | 7 | 4→马牙槎 | ✅ |
| 7 | apron-flashing-01 | 细石混凝土散水 | 墙体 | available | ✅ 326KB | ✅ 407KB | 2 | 9 | — | ✅ |
| 8 | stone-apron-01 | 块石散水 | 墙体 | available | ✅ 241KB | ✅ 317KB | 2 | 9 | 3 个变体 | ✅ |
| 9 | foam-insulation-01 | 泡沫塑料保温板 | 墙体 | available | ✅ 315KB | ✅ 248KB | 2 | 7 | — | ✅ |
| 10 | rockwool-insulation-01 | 岩棉防火保温板 | 墙体 | available | ✅ 336KB | ✅ 250KB | 2 | 7 | — | ✅ |
| 11 | concrete-steps-01 | 混凝土台阶 | 楼梯 | available | ✅ 125KB | ✅ 231KB | 2 | 5 | — | ✅ |
| 12 | yuncheng-c-01 | 01 | 案例 | development | ❌ | ❌ | — | — | — | ✅ (开发中) |
| 13 | yuncheng-c-02 | 02 | 案例 | development | ❌ | ❌ | — | — | — | ✅ (开发中) |
| 14 | yuncheng-c-03 | 03 | 案例 | development | ❌ | ❌ | — | — | — | ✅ (开发中) |

### 5.3 资源文件存在性

- **所有 12 个 GLB 文件**: ✅ 存在
- **所有 9 个 diagram 图片**: ✅ 存在
- **foam-insulation, rockwool-insulation, concrete-steps**: GLB + Diagram 均存在（project_overview.md 标记为 "—" 是过时的）

### 5.4 发现的资源问题

| # | 问题 | 等级 | 详情 |
|---|------|------|------|
| R1 | 孤儿 `-orig` 备份文件 | P3 | `Exhibition model-orig.glb` (4.6MB), `flat-roof-orig.glb` (2.2MB), `sloped-roof-orig.glb` (1.7MB), `construction-column-orig.glb` (2.0MB) — 总计约 **10.5MB** 未被引用，会随 public/ 部署 |
| R2 | 大 GLB 文件 | P3 | `Exhibition model.glb` 4.6MB，超过 3MB 阈值 |
| R3 | 死代码 `src/data/nodes.ts` | P3 | 306 字节，对 flat-roof-01 有冲突定义（parts: slab/beam/roof vs 正确 8 层），不被任何文件 import |

---

## 6. NodeDetail 与 3D 系统

### 6.1 NodeDetail 功能流程

| 场景 | 处理方式 | 验证状态 |
|------|----------|:---:|
| 有效节点 (available) | 三栏布局 + ModelViewer key={nodeId} + KnowledgePanel | 静态 ✅ |
| 未知节点 (!node) | "节点不存在" + 返回链接 | 静态 ✅ |
| development 节点 | "该节点正在开发中" | 静态 ✅ |
| 节点切换 (key={nodeId}) | React key 强制重挂载整个 ModelViewer | 静态 ✅ |
| useLayoutEffect 重置 | resetNodeInteractionState() 在 paint 前调用 | 静态 ✅ |
| animationProgress/selectedObject/hoveredObject/isPlaying 重置 | resetNodeInteractionState 一次性清零 | 静态 ✅ |
| 模型加载状态 | Suspense + LoadingFallback (线框方块) | 静态 ✅ |
| 模型加载失败 | GLB load error → 无 ErrorBoundary（仅 Suspense） | ⚠️ 无兜底 |
| 剖面图显示 | NodeDiagramPanel (520px) | 静态 ✅ |
| 图片缩放 | NodeDiagramPanel (需查看实现) | ⚪ 未验证 |
| 阴影开关 | setShowShadows → ModelViewer + RendererSetup | 静态 ✅ |
| 联动开关 | linkageEnabled → ConstructionKnowledgePanel | 静态 ✅ |
| 构件排序 | layers.sort((a,b) => (b.order ?? 0) - (a.order ?? 0)) | 静态 ✅ |
| 截图工具 | 未发现实现 | ❌ 功能缺失 |
| 返回 | Link to="/library" + 面包屑 | ✅ |
| 访问记录 | addVisitedNode(nodeId) → analysisStore | 静态 ✅ |

### 6.2 3D 模型系统 (ModelViewer.tsx)

| 检查项 | 结果 |
|--------|------|
| GLTF/Draco 加载 | ✅ `useGLTF(path, true)` |
| 自动居中 | ✅ Box3.getCenter → position.set(-cx, -cy, -cz) |
| 自动缩放 | ✅ `_scaleCache` Map 缓存，clamp(0.3, 5) |
| ResizeObserver | ✅ containerRef ResizeObserver → containerWidth |
| 视口自适应缩放 | ✅ useFrame lerp targetScale |
| 相机目标跟踪 | ✅ CameraTracker → controls.target.lerp(center, alpha) |
| OrbitControls | ✅ drei OrbitControls |
| 用户拖拽暂停跟踪 | ✅ addEventListener("start"/"end") → _isUserDragging |
| 动画 Mixer 初始化 | ✅ AnimationMixer + LoopOnce + clampWhenFinished |
| AnimationAction 注册 | ✅ registerAnimationActions(actions) → token guarded |
| token cleanup 防竞态 | ✅ Symbol guard |
| 播放/暂停/正向爆炸/反向收起 | ✅ animControls |
| 时间轴拖动 | ✅ setTime(t * totalDuration) |
| 边界自动暂停 (0%/100%) | ✅ useFrame 检测 t >= d / t <= 0 |
| 节点切换 Mixer 清理 | ✅ cleanup: stopAllAction + uncacheRoot + unregister |
| 材质 clone 与隔离 | ✅ 初始化时 clone 所有命名 Mesh 的 material |
| 多材质支持 | ✅ Array.isArray(material) 处理 |
| 边缘线 | ✅ EdgesGeometry + LineBasicMaterial，raycast disabled |
| _hitbox 检测 | ✅ isHitboxName + visible=false |
| 代理 hitbox | ✅ 6% 放大 proxy Mesh (无 hitbox 时) |
| PointerEvent stopPropagation | ✅ |
| 点击空白取消选择 | ✅ setSelectedObject(current === name ? null : name) |
| hover/select 优先级 | ✅ selected 覆盖 hover（deterministic effect） |
| 高亮门控 | ✅ animationProgress >= 0.99 启用 |

### 6.3 发现的 3D 系统问题

| # | 问题 | 等级 | 文件:行 | 详情 |
|---|------|------|---------|------|
| M1 | addEventListener 无对应 removeEventListener | P2 | ModelViewer.tsx:491-492 | CameraTracker 中 `controls.addEventListener("start"/"end")` 但清理函数未移除监听器。节点切换时旧 OrbitControls 可能残留监听器（虽然 R3F dispose 可能隐式清理） |
| M2 | useFrame 中重复 new Box3 + new Vector3 | P3 | ModelViewer.tsx:267-269, 496-498 | 每帧分配新对象 → GC 压力。CameraTracker 已通过 boxRef/centerRef 优化，但 viewport scale useFrame 仍每帧 new Box3 |
| M3 | ModelViewer 无 ErrorBoundary | P2 | ModelViewer.tsx | GLB 加载失败仅靠 Suspense，无 ErrorBoundary 兜底 Three.js 运行时异常 |
| M4 | 模块级 `_modelScene` / `_controls` / `_isUserDragging` | P3 | ModelViewer.tsx:35-37 | 模块级变量在多 ModelViewer 实例间可能共享（实际上页面只有一个 Canvas，但若未来扩展会有问题） |
| M5 | GLB debug console.log 14 处 | P3 | ModelViewer.tsx:84-387 | 生产构建应移除或使用条件编译 |
| M6 | SceneModel effect 中 `animationProgress >= 0.99` 门控 | P3 | ModelViewer.tsx:393 | handlePointerOver 通过 `getState()` 读取，但 useFrame 中的边界自动暂停 setAnimationProgress 可能导致一帧内状态不一致 |

---

## 7. 知识卡双向联动

### 7.1 联动流程分析

| 交互 | 代码路径 | 验证状态 |
|------|----------|:---:|
| 悬停 3D → hover 高亮 | onPointerOver → findNamedMesh → setHoveredObject → effect → setGroupHighlight("hover") | 静态 ✅ |
| 移出 3D → 恢复 | onPointerOut → setHoveredObject(null) → effect → prev 恢复 | 静态 ✅ |
| 点击 3D → selected 高亮 | onClick → findNamedMesh → setSelectedObject | 静态 ✅ |
| 再次点击 → 取消 | selectedObject === name → setSelectedObject(null) | 静态 ✅ |
| 点击 3D → 知识卡展开 | ConstructionKnowledgePanel linkedExpandedId 派生自 selectedObject | 静态 ✅ |
| 点击知识卡 → 3D 高亮 | handleToggle → setSelectedObject(canonicalName(objectName)) | 静态 ✅ |
| 再次点击知识卡 → 收起 | handleToggle → setSelectedObject(null) (联动开时) | 静态 ✅ |
| 关闭联动 → 互不干扰 | linkageEnabled=false → manualState 接管 | 静态 ✅ |
| 重开联动 → 状态同步 | linkedExpandedId useMemo 重新计算 | 静态 ✅ |
| 无匹配构件 → 不展开 | findMatchingLayer 返回 undefined → linkedExpandedId=null | 静态 ✅ |
| 多 mesh 构件 → 全组高亮 | meshMapRef: Map<逻辑名, Mesh[]> → forEach 设置 | 静态 ✅ |
| 多材质构件 → 全材质同步 | Array.isArray → mats.forEach | 静态 ✅ |
| 动画门控 | animationProgress >= 0.99 / >= 1 (hover/click) | 静态 ✅ |
| 节点切换 → 旧状态清除 | useLayoutEffect resetNodeInteractionState + key={nodeId} 重挂载 | 静态 ✅ |

### 7.2 关键模型 Groups 回归

| Node | Group 映射 | canonicalName 流程 | 静态验证 |
|------|-----------|-------------------|:---:|
| construction-column-01: 01→马牙槎 | `COLUMN_GROUPS["01"]` → `"马牙槎"` | step 1: 精确匹配 → 返回 `"马牙槎"` | ✅ |
| construction-column-01: 02→马牙槎 | `COLUMN_GROUPS["02"]` → `"马牙槎"` | 同上 | ✅ |
| construction-column-01: 03→马牙槎 | `COLUMN_GROUPS["03"]` → `"马牙槎"` | 同上 | ✅ |
| construction-column-01: 04→马牙槎 | `COLUMN_GROUPS["04"]` → `"马牙槎"` | 同上 | ✅ |
| stone-apron-01: 全角冒号+dot | `STONE_GROUPS["120厚块石,1：2.5水泥砂浆灌缝.001"]` → 标准化名称 | step 1: 精确匹配 | ✅ |
| stone-apron-01: 无dot变体 | `STONE_GROUPS["120厚块石,1：25水泥砂浆灌缝001"]` | step 1: 精确匹配 | ✅ |
| stone-apron-01: 无后缀变体 | `STONE_GROUPS["120厚块石,1：25水泥砂浆灌缝"]` | step 1: 精确匹配 | ✅ |
| flat-roof-01: 40厚细石混凝土毛面 | `"40厚细石混凝土毛面001"` → `"40厚细石混凝土毛面"` | step 1: 精确匹配 | ✅ |
| flat-roof-01: 钢筋混凝土屋面 | `"钢筋混凝土屋面002"` → `"钢筋混凝土屋面"` | step 1: 精确匹配 | ✅ |
| sloped-roof-01: 钢筋混凝土屋面板 | `"钢筋混凝土屋面板001"` → `"钢筋混凝土屋面板"` | step 1: 精确匹配 | ✅ |

### 7.3 名称匹配潜在问题

| # | 问题 | 等级 | 详情 |
|---|------|------|------|
| L1 | slopedRoofLayers 中 objectName 末尾有中文逗号 | P2 | `"40厚细石混凝土捣实压光配双向单层4钢筋，"` — 末尾 `，` 疑似截断错误。GLB 中的实际 mesh 名可能无此逗号，导致 `getLayerInfo()` 匹配失败 |
| L2 | apronFlashingLayers 中 objectName 不完整 | P2 | `"150厚粒径10~40卵石灌M2.5混合砂浆（或150厚3：7"` — 未闭合的括号，明显截断 |
| L3 | stoneApronLayers 中全角波浪号 | P3 | `"素土夯实，向外坡 3%～5%"` 使用 `～` (U+FF5E) 而非 `~` (U+007E)，Blender 导出可能不同 |
| L4 | LayerInfo 接口不一致 | P3 | flatRoof/slopedRoof 有 `order` 字段，其他 9 个文件无。sort 时 b.order ?? 0 → 无 order 的 layers 全部归零 |

---

## 8. 教材系统

### 8.1 教材数据完整性

| 模块 ID | 模块标题 | sections 文件 | 章节数 | available 章节 | MD_MAP 条目 | Markdown 文件 | 相关节点 |
|---------|----------|---------------|--------|:---:|------|------|------|
| introduction | 绪论 | introSections.js | ? | ? | 0 | 0 个 .md | — |
| wall | 墙体 | wallSections.js | 5 | 1 (wall-design-requirements) | 3 | 3 个 .md | construction-column-01 |
| door-window | 门窗 | windowSections.js | ? | ? | 0 | 0 个 .md | — |
| foundation | 基础与地基 | foundationSections.js | ? | ? | 0 | 0 个 .md | — |
| floor | 楼地层 | floorSections.js | ? | ? | 0 | 0 个 .md | — |
| stairs | 楼梯 | stairsSections.js | 5 | 0 | 0 | 0 个 .md | — |
| roof | 屋顶 | roofSections.js | 3 | 0 | 1 | 1 个 .md | — |
| deformation-joint | 变形缝 | deformationJointSections.js | ? | ? | 0 | 0 个 .md | — |

**关键发现**:
- 8 个模块中，仅 **wall** 和 **roof** 有 Markdown 教材内容
- **8 个模块**有 sections 文件但大部分 `available: false`
- wall 模块 5 个章节中仅 1 个 (`wall-design-requirements`) 设为 available
- roof 模块 3 个章节全部 unavailable（与有 MD 内容矛盾）
- sections 文件为 `.js` 而非 `.ts`（无类型检查覆盖）

### 8.2 教材页面功能

| 功能 | 状态 |
|------|:---:|
| 双参数路由 | ✅ `/textbook/:moduleId/:chapterId` |
| 单参数路由 | ✅ `/textbook/:sectionId` (模块概述) |
| 左右双栏布局 | ✅ (Markdown 70% + 相关节点卡片 320px) |
| react-markdown 渲染 | ✅ |
| CalloutBlock 组件 | ✅ (TypeScript 类型守卫) |
| 模型卡片 (ModelNodeCard) | ✅ |
| 内部链接/外部链接 | ✅ |
| 前后章节导航 | ⚪ 未验证 |
| 未知章节兜底 | ✅ handleMissingContent |
| 缺失 Markdown 兜底 | ✅ handleMissingContent → "即将上线" |
| 图片 alt | ⚪ 未验证 |

---

## 9. 首页与响应式布局

### 9.1 首页功能

| 功能 | 状态 |
|------|:---:|
| 双列树状布局 | ✅ 静态 |
| 3D 背景加载 (Exhibition model) | ✅ 静态 |
| 场景切换 (墙体↔屋顶) | ✅ backgroundScenes[2] |
| LoadingOverlay (5 bars + spinner) | ✅ 静态 |
| loadedSceneIndex 竞态保护 | ✅ 旧 callback 的 stale index 永不匹配当前 |
| 阴影开关 | ✅ showShadows |
| 导航菜单 8 项 | ✅ 全部指向有效路由 |
| 登录按钮 + 统计卡片 | ✅ (模拟登录) |
| SubMenuPanel 手风琴 | ✅ activeModuleId 单展开 |

### 9.2 响应式布局

| 断点/尺寸 | 验证方式 | 状态 |
|-----------|:---:|:---:|
| 1440×900 | 静态代码 | ⚪ 未实测 |
| 1024×768 | 静态代码 | ⚪ 未实测 |
| 768×1024 | 静态代码 | ⚪ 未实测 |
| 390×844 (手机) | 静态代码 | ⚪ 未实测 |
| 超窄窗口溢出 | 静态代码 | ⚪ 未实测 |

**静态分析**:
- ContainerMetrics: currentWidth + initialWidth lazy capture ✅
- MenuBackground: refWidth fallback 链 `initialContainerWidth || containerWidth || 1200` ✅
- 模型缩放: `baseScale * ratio`, ratio clamped to [0.4, 1] ✅
- 侧栏宽度: 24rem (384px) + 260px 右列
- 知识面板: `hidden lg:flex` (360px) — 小屏下隐藏

### 9.3 首页问题

| # | 问题 | 等级 | 详情 |
|---|------|------|------|
| H1 | `loadedSceneIndex` anti-race 依赖 stale closure | P3 | handleBgLoaded = `useCallback(() => setLoadedSceneIndex(sceneIndex), [sceneIndex])` — 依赖数组正确，但若场景切换快于模型加载，可能出现旧场景的 loaded 回调设置错误的 index。不过 bgLoading 的派生逻辑 `loadedSceneIndex !== sceneIndex` 确保了只有匹配的 loaded 才消除 loading |
| H2 | backgroundScenes 使用 flat-roof.glb 作为"屋顶"场景 | P3 | 与模型查看器共用模型，加载 2.1MB 较大 |
| H3 | 首页无 `<meta name="viewport">` 控制 | P3 | 依赖浏览器默认 viewport，可能影响移动端缩放 |

---

## 10. AI、数据分析及其他页面

### 10.1 AI 问答 (AIPage)

| 检查项 | 结果 |
|--------|------|
| API Key 仅服务端/Vite proxy | ✅ DEEPSEEK_API_KEY 在 vite.config.ts env 读取 |
| 前端 bundle 零暴露 | ✅ chatStore 用 `/api/deepseek` 相对路径 |
| `.env.local` gitignored | ✅ `*.local` 在 .gitignore |
| 错误响应类型 | ✅ DeepSeekErrorResponse interface |
| 网络失败提示 | ✅ catch → error state |
| API 非 2xx | ✅ `!res.ok` → throw Error |
| JSON 解析异常 | ✅ `.catch(() => ({}))` |
| 空输入 | ⚪ 未验证 |
| 重复提交 | ⚪ 未验证（isLoading 门控可能存在竞态） |
| loading 状态 | ✅ chatStore.isLoading |
| 清空聊天 | ✅ clearChat() → 重置为 WELCOME |
| SYSTEM_PROMPT | ✅ 建筑学助教角色提示词 |
| XSS/Markdown 输出风险 | ⚪ 未验证（取决于渲染方式） |
| 消息列表 key | ✅ `msg-${Date.now()}-${counter}` |

### 10.2 AIExtendPage

| 检查项 | 结果 |
|--------|------|
| Tab 切换 | ✅ AI 问答 / 拓展链接 |
| lazy 加载两个子页面 | ✅ `lazy(() => import(...))` |
| Tab 保留状态 | ⚪ 未验证（切换 Tab 时子组件是否保持挂载） |

### 10.3 数据分析 (DataAnalysis)

| 检查项 | 结果 |
|--------|------|
| 三种图表渲染 | ✅ RadialBarChart + BarChart + PieChart |
| 空数据状态 | ✅ `visitedNodes.length === 0` → 空状态引导 |
| Tooltip/Label | ✅ 自定义 label 渲染（含趋势箭头） |
| 响应式容器 | ✅ ResponsiveContainer |
| 极端数值兜底 | ⚠️ TOTAL_NODES=3 硬编码，实际有 11 个 available 节点 |
| NaN/Infinity 防护 | ⚠️ `Math.max(1, Math.round(totalInteractions * 1.8))` 对 NaN 仅防到 1 |
| seed demo data | ⚠️ 仅 seed 3 个节点（hardcoded IDs），其他 available 节点无 stats |
| DataAnalysis 硬编码节点 ID 列表 | P3 | `seedNodes = ["roof-drainage-01", "flat-roof-01", "organized-drainage-01"]` 应使用 `nodeDefinitions` |

### 10.4 其他页面

| 页面 | 功能状态 | 问题 |
|------|:---:|------|
| GamesPage (作业训练) | 占位 | "拖拽式构件组装游戏正在建设中" — 无实际功能 |
| PlaceholderPage (/tools) | 占位 | 页面存在但首页无入口 |
| PlaceholderPage (/contribute) | 占位 | 页面存在但首页无入口 |
| CasesPage | 展示 development 节点 | yuncheng-c-01/02/03 仅为 ID 和描述，无模型 |
| ResourcesPage | 手风琴 + 外链 | "建筑盒子" URL 为空 → `href="#"` + `cursor-not-allowed` |

---

## 11. 状态管理

### 11.1 Stores 审计

| Store | 持久化 | State 字段 | 问题 |
|-------|:---:|------|------|
| nodeStore | ❌ | selectedObject, hoveredObject, isPlaying, animationProgress, linkageEnabled | ✅ 无问题 |
| chatStore | ❌ | messages, isLoading, error | ⚠️ `_msgCounter` 模块级变量跨组件共享 |
| authStore | ❌ | isLoggedIn, userName | ✅ 简单 |
| analysisStore | ✅ localStorage | visitedNodes, aiQuestions, totalInteractions | ⚠️ `Date.now()` 在 persist middleware 中可能导致 SSR/hydration 不一致（当前无 SSR，不影响） |

### 11.2 Store 详细问题

| # | 问题 | 等级 | 详情 |
|---|------|------|------|
| S1 | chatStore `_msgCounter` 模块级变量 | P3 | `let _msgCounter = 0` 在模块作用域，若未来有多个 chat 实例会共享计数 |
| S2 | chatStore messages 无限增长 | P3 | 无消息数量上限，长时间对话后内存和渲染性能下降 |
| S3 | nodeStore 无持久化 | P3 | 已确认设计选择：页面切换时通过 useLayoutEffect reset 清除状态 |
| S4 | analysisStore visitedNodes 去重但无上限 | P3 | visitedNodes 数组持续增长，11 个节点完成后继续追加统计数据 |
| S5 | analysisStore persist key 无版本号 | P3 | `construction-analysis` 若 State 结构变更，旧数据可能导致解析错误 |

---

## 12. 安全审计

| 检查项 | 结果 |
|--------|------|
| API Key 前端暴露 | ✅ 零暴露 — 仅 vite.config.ts proxy 层读取 |
| `.env.local` gitignored | ✅ |
| `.env.example` 含 placeholder | ✅ `sk-your-key-here` |
| XSS 风险 (AI 输出) | ⚪ 取决于 react-markdown 配置 |
| 外链 `rel="noopener noreferrer"` | ✅ ResourcesPage 对外链使用 |
| 空 URL 链接 | ✅ ResourcesPage "建筑盒子" → `e.preventDefault()` |
| `dangerouslySetInnerHTML` | 未检测到使用 |
| CSP/CORS headers | ⚪ 未配置 |
| npm audit | ⚪ 未运行 |

---

## 13. 性能与资源

### 13.1 构建产物分析

| 产物 | 大小 | Gzip | 评估 |
|------|------|------|------|
| index.js (主 bundle) | 484 KB | 152 KB | 🟡 接近 500KB 阈值 |
| r3f.js (Three+R3F) | 977 KB | 263 KB | 🟡 超过 500KB，但已手动分包 |
| DataAnalysis.js | 354 KB | 104 KB | 🟡 Recharts + 数据 |
| TextbookPage.js | 171 KB | 52 KB | 🟢 可接受 |
| NodeDetail.js | 23 KB | 7 KB | 🟢 良好 |
| index.css | 48 KB | 9 KB | 🟢 良好 |
| 其他 lazy chunks | 0.6-7 KB | <4 KB | 🟢 良好 |

### 13.2 资源大小超标

| 文件 | 大小 | 阈值 | 处理建议 |
|------|------|------|------|
| Exhibition model.glb | 4.6 MB | 3 MB | 再次压缩或降低纹理分辨率 |
| Exhibition model-orig.glb | 4.6 MB | 3 MB | 移除（孤儿文件） |
| flat-roof-orig.glb | 2.2 MB | — | 移除（孤儿文件） |
| sloped-roof-orig.glb | 1.7 MB | — | 移除（孤儿文件） |
| construction-column-orig.glb | 2.0 MB | — | 移除（孤儿文件） |

### 13.3 构建警告

| 警告类型 | 数量 | 详情 |
|----------|:---:|------|
| INEFFECTIVE_DYNAMIC_IMPORT | 8 | sections/*.js 被 SectionSubPage 动态 import，同时被 HomePage/TextbookPage 静态 import → 动态拆分失效 |
| Chunk > 500KB | 2 | `r3f-CNmiLasN.js` (977KB), 接近 `index-CTgJmS2I.js` (484KB) |

---

## 14. 可访问性

由于未进行浏览器实测，以下仅基于静态代码分析：

| 检查项 | 评估 | 详情 |
|--------|:---:|------|
| button 使用真实 button | 🟢 良好 | 大部分交互使用 `<button>` |
| Link vs div click | 🟢 良好 | 导航使用 `<Link>` |
| 图片 alt | ⚪ 未验证 | diagram 图片和 Markdown 图片 alt 未知 |
| 表单 label | ⚪ 未验证 | AI 输入框 label 未知 |
| 键盘 Tab/Enter/Space | ⚪ 未验证 | 需要浏览器测试 |
| focus 可见性 | ⚪ 未验证 | Tailwind focus ring 配置未知 |
| aria-label | 🟡 部分 | 按钮有 title 属性，但无 aria-label |
| 对话框焦点 | N/A | 无模态对话框 |
| 颜色对比度 | 🟡 部分 | `text-muted` (#6c6a64) 在 `bg-canvas` (#faf9f5) 上对比度约 5.2:1 (合格)；`text-muted-soft` 可能不足 |
| 仅靠颜色表达状态 | ⚠️ | 3D 高亮仅靠颜色 (hover 白/selected 金) 表达选中状态 — 无法被色盲用户感知。建议添加 outline/轮廓方案 |
| prefers-reduced-motion | ❌ 未支持 | framer-motion 动画无 reduced-motion 检查 |
| Canvas 替代说明 | ❌ 缺失 | 3D Canvas 无 `<canvas>` 的 aria-label 或替代文本 |
| Loading 状态播报 | ❌ 缺失 | 无 `aria-live` 或 loading 状态播报 |
| 移动端触控目标 | 🟡 部分 | 按钮最小尺寸约 28px，略小于 44px 推荐值 |

---

## 15. 工程质量命令结果

| 命令 | Exit Code | 耗时 | Errors | Warnings | 是否新增 |
|------|:---:|------|:---:|------|:---:|
| `npm run lint` | 0 | ~3s | 0 | 0 | N/A |
| `npx tsc --noEmit` | 0 | ~4s | 0 | 0 | N/A |
| `npm run build` | 0 | ~1s | 0 | 10 (8 INEFFECTIVE_DYNAMIC_IMPORT + 2 chunk size) | 预存 |
| `git diff --check` | 0 | <1s | 0 | 2 (LF/CRLF 替换警告) | 预存 |

### 15.1 Console 语句 (20 处)

| 文件 | 数量 | 类型 |
|------|:---:|------|
| ModelViewer.tsx | 14 | `console.log` (debug) |
| HomePage.tsx | 2 | `console.log` (debug) |
| ConstructionKnowledgePanel.tsx | 1 | `console.warn` (诊断，DEV guarded) |
| nodeDefinitions.ts | 1 | `console.error` (error handling) |
| MenuBackground.tsx | 1 | `console.warn` (error boundary) |
| vite.config.ts | 1 | `console.log` (proxy key prefix log) |

**评估**: ModelViewer.tsx 的 14 处 debug log 应在生产构建前移除或条件编译。其他 6 处为合理的错误/警告日志。

### 15.2 eslint-disable 审查 (5 处)

| 位置 | 规则 | 合理性 |
|------|------|:---:|
| MenuBackground.tsx:117 | `react-hooks/immutability` | ✅ 合理 — `gl.shadowMap` 是 Three.js 外部对象 |
| MenuBackground.tsx:120 | `react-hooks/immutability` | ✅ 合理 — `gl.toneMapping` 是 Three.js 外部对象 |
| ModelViewer.tsx:46 | `react-hooks/immutability` | ✅ 合理 — 同上 |
| ModelViewer.tsx:49 | `react-hooks/immutability` | ✅ 合理 — 同上 |
| DataAnalysis.tsx:100 | `react-hooks/exhaustive-deps` | ⚠️ 需审查 — `useEffect` 仅运行一次 seed demo data，空 `[]` 是设计意图，但内部引用 `addVisitedNode`/`addAIQuestion` 等 store actions（稳定引用，安全） |

### 15.3 无 TODO/FIXME/HACK/XXX

✅ 代码库无技术债务标记。

### 15.4 无 `as any` / `ts-ignore`

✅ 所有 TypeScript 类型安全，零 `as any` 或 `@ts-ignore`。

---

## 16. 问题总表

### P0 — 阻断 (0 个)

无阻断问题。

### P1 — 高 (0 个)

无高优先级问题。已知的 white MeshPhysicalMaterial 高亮 bug 已在 §17 单列。

### P2 — 中 (7 个)

| 编号 | 功能模块 | 文件:行 | 问题 | 影响 | 建议 |
|------|----------|---------|------|------|------|
| P2-1 | 3D 系统 | ModelViewer.tsx:491-492 | addEventListener 无 removeEventListener | 节点反复切换可能累积监听器 | 在 CameraTracker cleanup 中移除 |
| P2-2 | 3D 系统 | ModelViewer.tsx | 无 ErrorBoundary 兜底 GLB 运行时错误 | GLB 加载后 Three.js 运行时异常可能导致白屏 | 添加 ModelErrorBoundary |
| P2-3 | 知识卡联动 | slopedRoofLayers.ts:41 | objectName 末尾中文逗号 `"40厚细石混凝土捣实压光配双向单层4钢筋，"` | 该构件的知识卡匹配可能失败 | 核对 GLB 实际 mesh 名，修正或移除逗号 |
| P2-4 | 知识卡联动 | apronFlashingLayers.ts:71 | objectName 截断 `"150厚粒径10~40卵石灌M2.5混合砂浆（或150厚3：7"` (未闭合括号) | 该构件的知识卡匹配可能失败 | 核对 GLB 实际 mesh 名，补全 objectName |
| P2-5 | 路由 | routes.tsx:28-29 | `/curriculum/cases` 在 `/curriculum/:moduleId` 之后 | 代码可读性差，虽 React Router 评分算法不会遮挡 | 移动 `/curriculum/cases` 到 `/curriculum/:moduleId` 之前 |
| P2-6 | 首页 | HomePage.tsx:383 | `window.location.hash = '#/textbook/...'` 绕过 React Router | 导航时触发完整 hash 重新解析，丢失 React 状态，不在 SPA 内导航 | 替换为 `<Link>` 或 `navigate()` |
| P2-7 | 全局 | RouteSuspense.tsx, AIExtendPage.tsx | 所有 lazy 页面无 ErrorBoundary | 动态 import chunk 加载失败（网络错误）会导致整个应用崩溃 | 在 Suspense 外层包裹 ErrorBoundary |

### P3 — 低 (21 个)

| 编号 | 模块 | 文件 | 问题 |
|------|------|------|------|
| P3-1 | 数据 | src/data/nodes.ts | 孤儿死代码 (306B)，含冲突的 flat-roof-01 定义 |
| P3-2 | 资源 | public/models/*/ | 4 个 `-orig.glb` 孤儿备份文件 (~10.5MB) |
| P3-3 | 资源 | public/models/background/ | Exhibition model.glb 4.6MB 超 3MB 阈值 |
| P3-4 | 3D | ModelViewer.tsx:84-387 | 14 处 debug console.log 应在生产构建移除 |
| P3-5 | 3D | ModelViewer.tsx:267-269 | useFrame 中每帧 new Box3 + new Vector3 |
| P3-6 | 数据 | DataAnalysis.tsx:23 | TOTAL_NODES=3 硬编码 (实际 11 个 available) |
| P3-7 | 数据 | DataAnalysis.tsx:81-83 | seedNodes 硬编码节点 ID 列表 |
| P3-8 | 数据 | 9 个 layer 文件 | LayerInfo 接口不一致 (5 个有 order，6 个无) |
| P3-9 | 路由 | routes.tsx | 无 404 catch-all 路由 |
| P3-10 | 路由 | routes.tsx | `/ai` 路由冗余 (被 `/ai-extend` 替代) |
| P3-11 | 路由 | routes.tsx | `/tools` / `/contribute` 无首页导航入口 |
| P3-12 | 可访问性 | 全局 | prefers-reduced-motion 无支持 |
| P3-13 | 可访问性 | 全局 | Canvas 无替代文本 |
| P3-14 | 存储 | chatStore.ts | messages 无上限，长时间对话可能内存增长 |
| P3-15 | 代码 | DataAnalysis.tsx + AIPage.tsx | `categorizeQuestion()` 函数在两个文件中完全重复 | 
| P3-16 | 数据 | courseModules.ts | 全部 8 个模块 `nodeIds` 为空数组，导致 CurriculumPage 显示 "0 个节点" |
| P3-17 | 代码 | SectionSubPage.tsx + TextbookPage.tsx + HomePage.tsx | `CourseModule` / `CourseSection` 接口在 3 个文件中独立定义（无共享类型导出） |
| P3-18 | 首页 | LibraryPage.tsx | 页脚 3 个链接全部使用 `href="#"` (死链接) |
| P3-19 | 首页 | HomePage.tsx | 模块级 `console.group`/`console.log` 在每次 import 时打印全部课程数据 |
| P3-20 | 首页 | CurriculumPage.tsx | `grayscale` 类名在 emoji 图标上使用 — 非标准 Tailwind 工具类，可能无效 |
| P3-21 | 测试 | nameUtils.ts | `canonicalName()` 标记为 "SINGLE SOURCE OF TRUTH" 但无单元测试覆盖 |

---

## 17. 已知未解决问题

### 🔴 flat-roof-01 / 40厚细石混凝土毛面 — 白色 MeshPhysicalMaterial 高亮不可见

| 属性 | 详情 |
|------|------|
| **节点** | flat-roof-01 (平屋面构造) |
| **构件** | 40厚细石混凝土毛面 (保护层, order=8) |
| **材质类型** | `MeshPhysicalMaterial` (白色/灰色外观) |
| **已确认工作正常** | 射线命中 ✅、名称解析 ✅、meshMap 命中 ✅、材质不共享 ✅、emissive/color 赋值持久 ✅、确定性 Effect 无覆盖 ✅ |
| **已尝试方案** | ① 提高 emissive 强度 ② 确定性 priority-based effect ③ color/emissive 双通道回退 ④ 极端 emissive 测试值 |
| **当前状态** | 🔴 仍未通过真实浏览器视觉验收 |
| **本轮审计** | ⚪ 未在浏览器复现（无 GUI 环境），未添加调试代码，未修改实现 |
| **建议后续调查** | ① 浏览器 DevTools 逐帧检查实际渲染对象 ② 检查是否父 Mesh/Occluder 遮挡 ③ 验证 `renderOrder` / `depthTest` 影响 ④ 尝试 Outline/边缘线方案替代 emissive/color 高亮 ⑤ 检查 R3F reconcile 是否正确应用 material 变更 |

---

## 18. 建议修复批次

### 批次 A：P2 问题 (建议优先)

| 文件 | 问题 | 风险 | 回归测试 |
|------|------|------|----------|
| apronFlashingLayers.ts | 补全截断的 objectName | 低 | 核对 GLB 实际 mesh 名 |
| slopedRoofLayers.ts | 移除末尾中文逗号 | 低 | 核对 GLB 实际 mesh 名 |
| ModelViewer.tsx | 添加 removeEventListener cleanup | 低 | 反复切换节点测试 |
| ModelViewer.tsx | 添加 ModelErrorBoundary | 中 | 加载损坏的 GLB 测试 |
| routes.tsx | 移动 `/curriculum/cases` 到参数路由之前 | 低 | 验证案例页正常访问 |

### 批次 B：节点与 3D 稳定性

| 文件 | 问题 | 风险 | 回归测试 |
|------|------|------|----------|
| ModelViewer.tsx | 移除 14 处 debug console.log | 极低 | npm run build |
| ModelViewer.tsx | useFrame 对象池化 | 低 | 性能回归测试 |
| stoneApronLayers.ts | 检查全角波浪号匹配 | 低 | stone-apron-01 构件联动测试 |

### 批次 C：教材和内容一致性

| 文件 | 问题 | 风险 | 回归测试 |
|------|------|------|----------|
| DataAnalysis.tsx | TOTAL_NODES 动态计算 | 低 | 数据分析页验证 |
| DataAnalysis.tsx | seedNodes 使用 nodeDefinitions | 低 | 同上 |
| nodes.ts | 删除死代码文件 | 极低 | grep 确认无引用 |
| 9 个 layer 文件 | 统一 LayerInfo 接口 | 中 | 全节点知识卡验证 |

### 批次 D：响应式与可访问性

| 文件 | 问题 | 风险 | 回归测试 |
|------|------|------|----------|
| 全局 CSS | 添加 prefers-reduced-motion 支持 | 中 | 系统动画开关测试 |
| ModelViewer Canvas | 添加 aria-label | 极低 | 无障碍审计 |
| 按钮组件 | 确保触控目标 ≥44px | 低 | 移动端测试 |

### 批次 E：性能与维护性

| 文件 | 问题 | 风险 | 回归测试 |
|------|------|------|----------|
| public/models/*/ | 移除 4 个 -orig 备份文件 (~10.5MB) | 极低 | npm run build |
| Exhibition model.glb | 进一步压缩 (目标 <3MB) | 中 | 3D 背景视觉验证 |
| 8 sections/*.js | 消除 INEFFECTIVE_DYNAMIC_IMPORT 警告 | 中 | npm run build |
| chatStore.ts | 添加消息数量上限 | 低 | AI 对话测试 |

---

## 19. 发布前验收清单

| # | 项目 | 状态 |
|---|------|:---:|
| 1 | `npm run lint` — 0 errors | ✅ |
| 2 | `npx tsc --noEmit` — 0 errors | ✅ |
| 3 | `npm run build` — 0 errors | ✅ |
| 4 | 所有路由可访问 | ⚪ 待浏览器验证 |
| 5 | 所有 available 节点的 3D 模型加载正常 | ⚪ 待浏览器验证 |
| 6 | 知识卡双向联动正常 | ⚪ 待浏览器验证 |
| 7 | 动画播放/暂停/反向/时间轴正常 | ⚪ 待浏览器验证 |
| 8 | 响应式布局在 4 种分辨率下正常 | ⚪ 待浏览器验证 |
| 9 | AI 问答可正常调用 | ⚪ 待 API 验证 |
| 10 | 无 console error/warning | ⚪ 待浏览器验证 |
| 11 | GitHub Pages base path `/tcugz/` 资源路径正确 | ⚪ 待部署验证 |
| 12 | 已知高亮 bug 有文档记录 | ✅ |
| 13 | 无 API Key 泄露 | ✅ |

---

## 20. 最终结论

### 总体评估: B — 修复 P1 后发布

**理由**:
- ✅ 工程质量优秀：Lint 0 / TSC 0 / Build 0 error
- ✅ 架构设计一致：节点单一配置源模式执行彻底
- ✅ 安全性良好：API Key 零泄漏
- ✅ 资源完整性好：所有引用的 GLB/图片/数据文件均存在
- 🟡 功能完整度：核心交互链完整，但教材内容覆盖率低（2/8 模块有 MD 内容）
- 🟡 存在 5 个 P2 问题需要修复（2 个 Layer objectName 可能截断、addEventListener 清理、ErrorBoundary、路由顺序）
- 🔴 已知白名单 PhysicalMaterial 高亮 bug 未解决（已文档化）
- ⚪ 无浏览器实测（本轮审计环境限制）

**建议**: 先修复 5 个 P2 问题，然后在真实浏览器中全面验证 3D 交互、响应式布局和路由导航。所有 P2 修复风险低，可单独 commit。

---

*审计工具: Claude Code + 3 并行 Agent (代码扫描 + 资源检查 + 页面深度审查) + ESLint + TypeScript 6 + Vite 8*
*审计耗时: ~4 分钟（3 Agent 并行 + 构建验证）*
*未修改任何业务代码*
*审计范围: 26 个源文件 + 28 个资源文件 + 4 个 Store + 14 个路由 + 14 个节点定义*
