# 建筑构造交互教材 — 项目全景文档

## 1. 项目定位

**建筑构造交互系统**（Building Construction Interactive System）是面向建筑学教育的开源 Web 应用。通过 **三维可视化、Blender 动画、交互式构件探索、结构化课程体系**，帮助学生和从业者直观理解建筑构造的空间逻辑。

```
定位：教学系统操作中枢
用户：建筑学学生
气质：architectural / editorial / paper-like / calm academic
核心链路：模型 → 构件 → 知识 → 教材
```

---

## 2. 技术栈

| 层 | 技术 | 用途 |
|----|------|------|
| 框架 | React 19 | UI |
| 构建 | Vite 8 | 打包 + HMR + API 代理(DeepSeek) |
| 类型 | TypeScript 6 | 类型检查 |
| 3D 渲染 | Three.js 0.184 + @react-three/fiber 9.6 + @react-three/drei 10.7 | Canvas、GLB 加载、OrbitControls |
| 动画 | framer-motion 12 | UI 过渡、手风琴面板、弹窗 |
| 3D 动画 | AnimationMixer (Blender → GLB, 96帧) | 构件展开/合拢动画 |
| 图表 | Recharts 2 | 学习数据分析可视化 |
| 样式 | Tailwind CSS v4 | 原子化 CSS + `@theme` 自定义 token |
| 路由 | React Router DOM 7 | Hash 路由（支持静态部署） |
| 状态 | Zustand 5 (含 persist 中间件) | 全局状态 + localStorage 持久化 |
| 图标 | lucide-react | UI 图标 |
| AI | DeepSeek API (chat/completions) | AI 建筑学助教问答 |
| 压缩 | @gltf-transform/cli (WebP + Draco) | 模型纹理压缩 + 几何压缩 |

---

## 3. 架构全景

```
main.tsx
  └── RouterProvider (HashRouter)
        └── AppLayout (全局导航栏 + <Outlet/>)
              ├── /                     → HomePage           (主控制台)
              ├── /curriculum           → CurriculumPage      (8 模块网格)
              ├── /curriculum/:moduleId → SectionSubPage  (子章节)
              ├── /curriculum/cases     → CasesPage           (案例应用)
              ├── /textbook/:sectionId → TextbookPage     (课本, lazy)
              ├── /library              → LibraryPage         (节点库)
              ├── /node/:nodeId         → NodeDetail (lazy) ⭐ 核心交互页
              ├── /resources            → ResourcesPage       (拓展链接)
              ├── /data                 → DataAnalysis (lazy) (学习数据分析)
              ├── /ai                   → AIPage (lazy)       (AI 问答, 保留)
              ├── /ai-extend            → AIExtendPage (lazy) ⭐ AI+拓展合并
              └── /games                → GamesPage (lazy)    (作业训练)
```

### AIExtendPage — Tab 切换合并页

```
AIExtendPage
  ├── Tab "AI 问答"     → lazy(AIPage)     (DeepSeek 对话 + 小g助教)
  └── Tab "拓展链接"     → lazy(ResourcesPage) (空间设计/建筑规范/热门网址)
```

### HomePage 侧栏布局 — 双列树状目录

```
HomePage
  └── motion.aside (layout, 动态宽度: 24rem → 24rem+260px)
      ├── 左列 (w-sidebar, 24rem, flex-shrink-0)
      │   ├── 标题 "建筑构造" (48px) + 装饰线
      │   ├── 导航菜单 (pt-8, overflow-y-auto 隐藏滚动条)
      │   │   ├── 📂 构造原理 ▶     ← 展开: 建筑保温/防水/隔热/隔声
      │   │   ├── 📂 构造基础 ▶     ← 展开: 8模块 (绪论/墙体/门窗/基础/楼地层/楼梯/屋顶/变形缝)
      │   │   ├── 节点库      → /library
      │   │   ├── 案例应用    → /curriculum/cases
      │   │   ├── 作业训练    → /games
      │   │   ├── 数据分析    → /data
      │   │   └── AI 拓展     → /ai-extend
      │   ├── 登录按钮 + 统计卡片 + 标语 (flex-shrink-0 固定底部)
      │
      ├── 右列 (AnimatePresence, width: 0↔260px, 平滑滑入/滑出)
      │   └── SubMenuPanel
      │       ├── 模块手风琴列表 (activeModuleId 单展开)
      │       └── overflow-y-auto 隐藏滚动条
      │
      └── 右侧 (flex-1) 3D 场景
          ├── Canvas (MenuBackground, 视口自适应缩放)
          └── 右下角控制 (场景切换 + 旋转 + 阴影)
```

### NodeDetail 内部架构（核心页面）

```
NodeDetail.tsx (编排器, ~275行)
  ├── 统一配置读取: getNodeDefinition(nodeId)             ← ⭐ 单一配置源
  │     ├── node.model     → modelPath / modelScale / modelGroups
  │     ├── node.diagram   → diagramImage
  │     ├── node.layerConfig → ConstructionKnowledgePanel
  │     └── node.status    → "available" | "development" 状态区分
  ├── Header (面包屑)
  ├── Body (三栏 flex)
  │   ├── NodeDiagramPanel (520px)     ← 剖面图
  │   ├── ModelViewer (flex-1, 557行)  ← 3D 视口 ⭐
  │   │   ├── SceneModel               ← GLB + AnimationMixer + 边缘线 + 高亮(门控)
  │   │   │                              + hitbox/proxy 命中系统 + 材质克隆 + 名称标准化
  │   │   ├── CameraTracker            ← 动态锚点：Box3 → controls.target.lerp
  │   │   ├── SceneLights              ← 2 方向光 + 环境光 (可控 castShadow)
  │   │   └── ShadowPlane              ← 地面阴影 (可控显隐)
  │   └── ConstructionKnowledgePanel (360px) ← ⭐ 手风琴面板 + 双向3D联动 + 联动开关
  └── Floating Timeline (居中浮动，02-2 风格)
        ├── 收起爆炸 (ChevronsLeft)
        ├── 进度条 slider
        ├── 播放爆炸 (ChevronsRight)
        ├── 旋转切换 (RotateCw + R 键提示)
        └── 阴影切换 (Sun) + 联动开关 (Link2)
```

### ModelViewer 核心系统 (557行)

| 子系统 | 实现 |
|--------|------|
| GLB 加载 | `useGLTF(path, true)` Draco 解码 |
| 动画 | 所有 AnimationClip 同时播放，`LoopOnce` 单次播放，`clampWhenFinished` 保持末帧 |
| 动画控制 | `_actions.forEach()` 批量控制 play/pause/reverse/setTime |
| 自动缩放 | Box3 一次性计算（排除 hitbox/proxy），`_scaleCache` 缓存，可配置 modelScale |
| 视口自适应 | ResizeObserver → containerWidth → useFrame lerp 平滑过渡 |
| 自动居中 | Box3 居中（排除 hitbox/proxy） |
| 边缘线 | `EdgesGeometry + LineSegments` 作为 mesh 子元素随动画移动，`raycast = () => {}` |
| 高亮门控 | `animationProgress >= 0.99` 启用（selector 阈值过滤），收起自动清除 |
| 命中系统 | **双模式**: Blender `_hitbox` 包围盒（优先）\| 代码 6% 放大代理（回退） |
| 材质隔离 | 初始化时克隆所有命名 Mesh 的 material，防跨构件高亮泄露 |
| 逻辑名分组 | `meshMapRef: Map<逻辑名, Mesh[]>` — 多材质/子构件聚合到同一逻辑名 |
| 名称标准化 | `src/utils/nameUtils.ts` — `canonicalName()` + `isHitboxName()` |
| 高亮效果 | hover: emissive white 0.4 / selected: emissive `#d4a843`(亮金) 0.5 |
| 事件 | R3F `onPointerOver/Out/Click` + `findNamedMesh()` |
| 阴影 | PCFShadowMap, 2048×2048, UI 开关 |
| 色调映射 | ACESFilmicToneMapping, exposure=1.0 |
| 相机 | 02-2 风格动态锚点：Box3 → controls.target.lerp(center, alpha)，拖拽时暂停 |

### 命中系统（双模式）

```
初始化:
  ┌─ Pass 1: 检测 Blender _hitbox 组件 → hasHitbox Set
  └─ Pass 2: 逐 mesh 处理
       ├── _hitbox mesh → visible=false, raycast 保留 → 接收点击
       ├── 有 hitbox 的组件实体 → raycast=disabled → 只渲染不参与命中
       └── 无 hitbox 的组件 → 创建 6% 放大代理 (proxy) → 回退方案

运行时命中:
  鼠标 → R3F Raycaster
    ↓ 命中 hitbox (优先) 或 proxy (回退)
    ↓
  findNamedMesh → canonicalName(obj.name)
    ↓ _hitbox 后缀自动剥离 → "钢筋_hitbox" → "钢筋"
    ↓
  handlePointerOver/Click → progress 门控
    ↓
  setHoveredObject / setSelectedObject → Store
```

### 高亮应用流程

```
store.selectedObject 变化
  ↓
useEffect → setGroupEmissive(logicalName, color, intensity)
  ↓
meshMapRef.get(logicalName) → Mesh[] (全部子 Mesh)
  ↓
每个子 Mesh → 所有 material → emissive 修改（材质已克隆，不泄露）
```

### 名称标准化系统

Three.js GLB 加载时的名称变化（`canonicalName()` 自动处理）：
- 空格 → 下划线: `"1：1：6 水泥"` → `"1：1：6_水泥"`
- 多材质拆分: 加 `_1`, `_2` 后缀
- Blender 重复后缀 `.NNN`: 优先剥离（早于删 dot），`"墙体.007"` → `"墙体"`
- Blender hitbox: `"钢筋_hitbox"` → `"钢筋"` (isHitboxName 检测 + 后缀剥离)
- 构件分组: `"01"`→`"马牙槎"` (MODEL_GROUPS 显式映射)
- 双 dot 名称: MODEL_GROUPS 覆写（如 `"120厚块石,1：2.5水泥砂浆灌缝.001"` → `"120厚块石,1：25水泥砂浆灌缝"`）

---

## 4. 目录结构（src/）

```
src/
├── main.tsx                              # 入口
├── routes.tsx                            # 路由（HashRouter，14 条路由）
├── index.css                             # Tailwind v4 @theme + 全局样式
├── NodeDetail.tsx                        # ⭐ 核心：三栏交互 + 动画 + 阴影 + 联动开关
│
├── components/
│   ├── AppLayout.tsx                     # 全局导航栏
│   └── viewer/
│       ├── ModelViewer.tsx               # ⭐ 3D 视口 (~530行)
│       ├── MenuBackground.tsx            # 首页 3D 背景 + 可控阴影
│       ├── LoadingOverlay.tsx            # 加载动画
│       ├── NodeDiagramPanel.tsx          # 左面板：剖面图 (520px)
│       └── ConstructionKnowledgePanel.tsx # ⭐ 手风琴面板 + 双向3D联动 + 联动开关
│
├── pages/
│   ├── HomePage.tsx                      # 主控制台：双列目录 + 3D背景 + 登录
│   ├── CurriculumPage.tsx                # 8 模块网格
│   ├── SectionSubPage.tsx                # 子章节卡片
│   ├── TextbookPage.tsx                  # 课本阅读 (lazy)
│   ├── LibraryPage.tsx                   # 节点库
│   ├── CasesPage.tsx                     # 案例应用
│   ├── ResourcesPage.tsx                 # 拓展链接工具箱
│   ├── DataAnalysis.tsx                  # 学习数据分析 (Recharts, lazy)
│   ├── AIPage.tsx                        # AI 建筑学助教 (DeepSeek, lazy)
│   ├── AIExtendPage.tsx                  # ⭐ AI问答+拓展链接 Tab合并页 (lazy)
│   ├── GamesPage.tsx                     # 作业训练 (lazy)
│   └── PlaceholderPage.tsx               # 通用占位
│
├── data/
│   ├── nodeDefinitions.ts                # ⭐ 节点单一配置源 (14个, 模型+层+图示)
│   ├── nodesIndex.ts                     # 兼容导出层 (不再独立维护数据)
│   ├── courseModules.ts                  # 8 模块定义
│   ├── backgroundScenes.ts               # 首页 3D 场景
│   ├── roofDrainageLayers.ts             # 无组织排水构件 (3层)
│   ├── organizedDrainageLayers.ts        # 有组织排水构件 (4层)
│   ├── flatRoofLayers.ts                 # 平屋面构件 (8层, order排序)
│   ├── slopedRoofLayers.ts              # 坡屋顶构件 (9层)
│   ├── constructionColumnLayers.ts       # 构造柱构件 (7层)
│   ├── apronFlashingLayers.ts            # 细石混凝土散水 (9层)
│   ├── concreteStepsLayers.ts            # 混凝土台阶 (5层)
│   ├── eavesGutterLayers.ts              # 檐沟外排水 (6层)
│   ├── stoneApronLayers.ts              # 块石散水 (9层)
│   ├── foamInsulationLayers.ts           # 泡沫塑料保温板 (7层)
│   ├── rockwoolInsulationLayers.ts       # 岩棉防火保温板 (7层)
│   ├── flatRoof.ts / membraneRoof.ts / roofInsulation.ts / roofDrainage.ts / organizedDrainage.ts / constructionColumn.ts  # 详细课程数据
│   ├── sections/ (*.js)                  # 各模块子章节 (39节)
│   └── textbook/                         # ⭐ 教材 Markdown 内容
│       ├── walls/                        # 墙体模块 (index + 3章)
│       └── roof/                         # 屋顶模块 (index)
│
├── utils/
│   └── nameUtils.ts                      # canonicalName() + isHitboxName()（接受 modelGroups 参数，无硬编码映射）
│
├── store/
│   ├── nodeStore.ts                      # Zustand：hover/select/play/progress/linkage
│   ├── chatStore.ts                      # AI 聊天：messages/isLoading/error + DeepSeek API
│   ├── authStore.ts                      # 模拟登录
│   └── analysisStore.ts                  # 学习分析：visitedNodes/aiQuestions/totalInteractions (persist)
│
└── assets/
```

---

## 5. Stores 总览

| Store | Key | 持久化 | 功能 |
|-------|-----|--------|------|
| `nodeStore` | — | 否 | 3D 悬停/选中/动画进度/联动开关 + `resetNodeInteractionState()` |
| `chatStore` | — | 否 | AI 对话消息/加载/错误 + DeepSeek API |
| `authStore` | — | 否 | 模拟用户登录/登出 |
| `analysisStore` | `construction-analysis` | ✅ localStorage | 访问节点/提问分类/交互次数 |

---

## 6. 设计系统

### 色彩

| Token | 值 | 用途 |
|-------|-----|------|
| `canvas` | `#faf9f5` | 页面底色 |
| `surface-card` | `#efe9de` | 卡片 |
| `primary` | `#cc785c` | 主色（暖珊瑚） |
| `primary-active` | `#a9583e` | 按下态 |
| `ink` | `#141413` | 标题 |
| `body` | `#3d3d3a` | 正文 |
| `muted` | `#6c6a64` | 次要文字 |
| `hairline` | `#e6dfd8` | 分割线 |

### 间距

| Token | 值 | 用途 |
|-------|-----|------|
| `sidebar` | 24rem (384px) | 侧栏宽度 |
| `panel-kw` | 360px | 知识面板宽度 |
| `menu-item-h` | 48px | 菜单项高度 |

---

## 7. 路由表

| 路由 | 页面 | 加载 | 说明 |
|------|------|------|------|
| `/` | HomePage | 直接 | 主控制台 |
| `/curriculum` | CurriculumPage | 直接 | 8 模块网格 |
| `/curriculum/:moduleId` | SectionSubPage | 直接 | 子章节 |
| `/curriculum/cases` | CasesPage | 直接 | 案例应用 |
| `/textbook/:sectionId` | TextbookPage | lazy | 课本 |
| `/library` | LibraryPage | 直接 | 节点库 |
| `/node/:nodeId` | NodeDetail | lazy | ⭐ 核心交互 |
| `/resources` | ResourcesPage | 直接 | 拓展链接 (保留) |
| `/data` | DataAnalysis | lazy | 学习数据 |
| `/ai` | AIPage | lazy | AI 问答 (保留) |
| `/ai-extend` | AIExtendPage | lazy | ⭐ AI+拓展合并 |
| `/games` | GamesPage | lazy | 作业训练 |
| `/tools` | PlaceholderPage | 直接 | 占位 |
| `/contribute` | PlaceholderPage | 直接 | 占位 |

---

## 8. 节点清单

| ID | 标题 | 分类 | GLB 模型 | 层数据 | modelScale |
|----|------|------|----------|--------|-----------|
| `flat-roof-01` | 平屋面构造 | 屋顶 | 2.3MB | 8层 | 3.5(默认) |
| `sloped-roof-01` | 坡屋顶构造 | 屋顶 | 1.9MB | 9层 | 3.5(默认) |
| `roof-drainage-01` | 无组织排水 | 屋顶 | 123KB | 3层 | 3.5(默认) |
| `organized-drainage-01` | 有组织排水 | 屋顶 | 153KB | 4层 | 3.5(默认) |
| `construction-column-01` | 构造柱 | 墙体 | 214KB | 7层 | **4** |
| `apron-flashing-01` | 细石混凝土散水 | 墙体 | 326KB | 9层 | **2** |
| `eaves-gutter-01` | 檐沟外排水 | 屋顶 | 177KB | 6层 | **2** |
| `stone-apron-01` | 块石散水 | 墙体 | 241KB | 9层 | **2** |
| `foam-insulation-01` | 泡沫塑料保温板外保温 | 墙体 | — | 7层 | **2** |
| `rockwool-insulation-01` | 岩棉防火保温板外保温 | 墙体 | — | 7层 | **2** |
| `concrete-steps-01` | 混凝土台阶 | 楼梯 | — | 5层 | **2** |
| `yuncheng-c-01` | 郓城案例 01 | 案例 | ⚠ | ⚠ | - |
| `yuncheng-c-02` | 郓城案例 02 | 案例 | ⚠ | ⚠ | - |
| `yuncheng-c-03` | 郓城案例 03 | 案例 | ⚠ | ⚠ | - |

共 14 个节点：屋顶 5 个、墙体 5 个、楼梯 1 个、案例 3 个。

---

## 9. 拓展链接工具箱

| 板块 | 子链接 | URL |
|------|--------|-----|
| 空间设计 | 建筑学长 | `https://www.archcollege.com` |
| | 建筑盒子 | 待补充 |
| 建筑规范 | 建标库 | `https://jianbiaoku.com` |
| 热门网址 | goood谷德 | `https://www.gooood.cn` |

---

## 10. 数据分析页面

| 卡片 | 图表类型 | 数据 |
|------|----------|------|
| 学习进度 | RadialBarChart 圆环 | visitedNodes.length / 8 |
| 构件热力 | BarChart 横向条形 | 节点访问频次 + 趋势箭头 |
| AI 问答画像 | PieChart 环形饼图 | 分类: 构造做法/材料特性/空间逻辑/其他 |

---

## 11. AI 问答系统

```
欢迎语: "你好！我是小g助教，专门帮同学们理解建筑构造知识。"

用户输入 → categorizeQuestion() 自动分类
         → analysisStore.addAIQuestion()
         → chatStore.sendMessage()
           → POST /api/deepseek/chat/completions (Vite 代理)
           → SYSTEM_PROMPT (建筑学助教)
         → 流式返回 → 气泡动画展示
```

安全：API Key 在 `.env.local` / Vite 代理层注入，前端代码零暴露

---

## 12. 模型压缩

所有超过 1MB 的 GLB 文件使用 WebP 纹理 + Draco 几何压缩：

| 模型 | 压缩前 | 压缩后 | 缩减 |
|------|--------|--------|------|
| Exhibition model | 5.8 MB | 4.7 MB | 19% |
| flat-roof | 18 MB | 2.3 MB | 87% |
| sloped-roof | 21 MB | 1.9 MB | 91% |
| construction-column | 2.1 MB | 0.2 MB | 90% |
| **总计** | **45 MB** | **9.1 MB** | **80%** |

自动脚本：`npm run compress-models`（扫描 `public/models/`，跳过 ≤1MB，WebP→Draco 两步压缩）

---

## 13. 完成状态

### 已完成 ✅

| 模块 | 功能 |
|------|------|
| 首页 | 双列树状目录 + 3D背景视口自适应 + 场景切换 + 阴影开关 + 模拟登录 |
| 课程 | 8模块 → 子章节 drill-down |
| 节点库 | 分类网格 + 剖面截图缩略图 |
| 案例应用 | 独立 CasesPage + [模型开发中] 标签 |
| NodeDetail | 三栏布局 + GLB + 动画 + 反向播放 + 时间轴 |
| NodeDetail | 边缘线 + 命中代理/hitbox + 高亮门控 + 双向3D手风琴联动 |
| NodeDetail | 动态相机 + 阴影开关 + 构件排序 + 联动开关 + 同步状态重置(hover/select/progress/playing) |
| NodeDetail | ModelViewer key={nodeId} 强制重挂 + 节点不存在兜底页 + nodeStore.resetNodeInteractionState |
| NodeDetail | 材质隔离 + 自动缩放 + 名称标准化(canonicalName唯一入口) |
| AI 拓展 | Tab合并页(AI问答+拓展链接) + lazy加载 |
| 数据分析 | 3种Recharts图表 + 演示数据 + 空状态兜底 |
| AI 问答 | DeepSeek API + 建筑学助教提示词 + lazy加载 |
| 状态管理 | 4 Stores (node/chat/auth/analysis) |
| 模型压缩 | WebP+Draco 自动化脚本 (`npm run compress-models`) |
| 命中系统 | 双模式：Blender _hitbox(优先) + 代码代理(回退) |
| 构造柱节点 | 7层构件 + 钢筋/箍筋hitbox + 马牙槎分组 |
| 混凝土台阶 | 5层构件（楼梯类别首节点） |
| 墙体节点 | 细石混凝土散水(9层) + 块石散水(9层) + 泡沫塑料保温板(7层) + 岩棉防火保温板(7层) |
| 檐沟节点 | 檐沟外排水(6层) |
| 教材系统 | 双参数路由 + MD静态导入 + 左右双栏 + 章节列表 + 模型关联 |
| 部署 | gh-pages 直接部署 (`npm run deploy`) |
| 安全 | Vite 代理隐藏 API Key |

### 待完成

| 功能 | 优先级 |
|------|--------|
| 更多墙体节点 | 高 |
| 拓展链接补充"建筑盒子"URL | 中 |
| 拖拽组装游戏 | 中 |
| 郓城案例模型迁移 | 低 |
| 课本内容填充 | 中 |

---

## 14. 教材系统

侧边栏"构造基础" → 模块点击 → 跳转 `/textbook/:moduleId`（模块概述+章节列表）。子章节点击 → `/textbook/:moduleId/:chapterId`（显示 Markdown 正文）。

### 教材页面布局（TextbookPage.tsx）

```
┌─ Breadcrumb (首页 › 构造基础 › 墙体 › 墙体的设计要求)
├─ 左侧 (~70%) ─────────────────────┐
│  ├── 标题 + 描述                  │
│  ├── Markdown 正文 (react-markdown) │
│  └── 模块章节列表 (isModule时)     │
├─ 右侧 (320px) ────────────────────┤
│  └── 本章相关构造模型卡片          │
└─────────────────────────────────────┘
```

### MD 内容机制

`src/data/textbook/` 下存 Markdown 文件，TextbookPage 顶部静态 import + MD_MAP 查找表（Vite 不支持模板字符串动态 `?raw`）。

### 添加新教材章的步骤

1. 在 `src/data/textbook/{模块id}/` 下新建 `.md` 文件
2. 在 TextbookPage.tsx 顶部 `import` + `MD_MAP` 加一行
3. 在对应 `sections/*.js` 中将章节设 `available: true`

---

## 15. 资源目录结构

```
public/
├── models/
│   ├── background/
│   │   └── Exhibition model.glb    (5.8MB, Draco)
│   ├── roof/
│   │   ├── flat-roof/
│   │   │   └── flat-roof.glb       (2.3MB, WebP)
│   │   ├── sloped-roof/
│   │   │   └── sloped-roof.glb     (1.9MB, WebP)
│   │   ├── eaves-gutter/
│   │   │   └── eaves-gutter.glb       (177KB)
│   │   ├── organized-drainage/
│   │   │   └── organized-drainage.glb (153KB)
│   │   └── roof-drainage/
│   │       └── roof-drainage.glb   (123KB)
│   ├── stairs/
│   │   └── concrete-steps/
│   │       └── concrete-steps.glb
│   └── wall/
│       ├── construction-column/
│       │   └── construction-column.glb (214KB, WebP+Draco)
│       ├── apron-flashing/
│       │   └── apron-flashing.glb      (326KB)
│       ├── stone-apron/
│       │   └── stone-apron.glb         (241KB)
│       ├── foam-insulation/
│       │   └── foam-insulation.glb
│       └── rockwool-insulation/
│           └── rockwool-insulation.glb
├── images/
│   ├── roof/
│   │   ├── roof-drainage-diagram.png
│   │   └── organized-drainage-diagram.png
│   ├── construction-column-diagram.png
│   ├── apron-flashing-diagram.png
│   ├── eaves-gutter-diagram.png
│   ├── stone-apron-diagram.png
│   ├── foam-insulation-diagram.png
│   └── rockwool-insulation-diagram.png
```

---

## 16. 添加新节点（3 步）

1. **准备文件**：`public/models/{类别}/{节点名}/{节点名}.glb` + 剖面图（可选）+ Blender hitbox（可选，命名 `{构件名}_hitbox`）+ `src/data/{节点名}Layers.ts`
2. **注册节点**：在 `src/data/nodeDefinitions.ts` 的 `nodeDefinitions` 数组中添加一条 `NodeDefinition`（含 model、diagram、layerConfig、loadContent 等字段）
3. **压缩模型**：运行 `npm run compress-models`

多材质构件、hitbox 后缀、名称标准化等由 `canonicalName()` 全自动处理。不再需要在 NodeDetail、ConstructionKnowledgePanel 等处分别注册。

---

## 17. 开发命令

```bash
npm run dev              # localhost:5173 (需 .env.local 配置 DEEPSEEK_API_KEY)
npm run build            # 生产构建
npm run compress-models  # 压缩 public/models/ 下 >1MB 的 GLB
npx tsc --noEmit         # 类型检查
```

---

_最后更新：2026-07-19_
