# 建筑构造交互教材 — 项目全景文档

## 1. 项目定位

**建筑构造交互系统**（Building Construction Interactive System）是面向建筑学教育的开源 Web 应用。通过 **三维可视化、Blender 动画、交互式构件探索、结构化课程体系**，帮助学生和从业者直观理解建筑构造的空间逻辑。

```
定位：教学系统操作中枢
用户：建筑学大三学生
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

---

## 3. 架构全景

```
main.tsx
  └── RouterProvider (HashRouter)
        └── AppLayout (全局导航栏 + <Outlet/>)
              ├── /                 → HomePage           (主控制台)
              ├── /curriculum       → CurriculumPage      (8 模块网格)
              ├── /curriculum/:moduleId → SectionSubPage  (子章节)
              ├── /curriculum/cases → CasesPage           (案例应用)
              ├── /textbook/:sectionId → TextbookPage     (课本, lazy)
              ├── /library          → LibraryPage         (节点库, 仅屋顶分类)
              ├── /node/:nodeId     → NodeDetail (lazy) ⭐ 核心交互页
              ├── /resources        → ResourcesPage       (拓展链接工具箱)
              ├── /data             → DataAnalysis (lazy) (学习数据分析)
              ├── /ai               → AIPage (lazy)       (AI 建筑学助教)
              └── /games            → GamesPage (lazy)    (作业训练)
```

### HomePage 侧栏布局

```
HomePage
  ├── 左侧栏 (w-sidebar, 24rem)
  │   ├── 标题 "建筑构造" (48px) + 装饰线
  │   ├── 导航菜单 (8 项，扁平无分组，flex-1 justify-center + gap-3)
  │   │   ├── 构造原理    → /curriculum
  │   │   ├── 节点库      → /library
  │   │   ├── 案例应用    → /curriculum/cases  (已迁移至独立 CasesPage)
  │   │   ├── 基础学习    → /textbook/roof-membrane
  │   │   ├── 作业训练    → /games
  │   │   ├── 数据分析    → /data
  │   │   ├── 拓展链接    → /resources
  │   │   └── AI 问答     → /ai
  │   ├── 登录按钮 (模拟用户系统，未登录显示"用户登录"，已登录显示用户名+退出)
  │   ├── 统计卡片 (构造节点 / 分类 / 交互视图)
  │   └── 标语 "探索建筑构造的空间逻辑"
  └── 右侧 (flex-1) 3D 场景
      ├── 顶部导航栏 (贡献节点 + 关于项目)
      ├── Canvas (MenuBackground, GLB 背景模型)
      └── 右下角控制 (场景切换 + 旋转切换 + 阴影切换)
```

### NodeDetail 内部架构（核心页面）

```
NodeDetail.tsx (编排器, ~200行)
  ├── Header (面包屑)
  ├── Body (三栏 flex)
  │   ├── NodeDiagramPanel (520px)     ← 剖面图
  │   ├── ModelViewer (flex-1, ~380行)  ← 3D 视口 ⭐
  │   │   ├── SceneModel               ← GLB + AnimationMixer + 边缘线 + 高亮(门控) + 命中代理
  │   │   ├── CameraTracker            ← 动态锚点：Box3 → controls.target.lerp
  │   │   ├── SceneLights              ← 2 方向光 + 环境光 (可控 castShadow)
  │   │   └── ShadowPlane              ← 地面阴影 (可控显隐)
  │   └── ConstructionKnowledgePanel (360px) ← ⭐ 手风琴构件面板 + 双向3D联动 + 排序
  └── Floating Timeline (居中浮动，02-2 风格)
        ├── 收起爆炸 (ChevronsLeft)
        ├── 进度条 slider
        ├── 播放爆炸 (ChevronsRight)
        ├── 旋转切换 (RotateCw + R 键提示)
        └── 阴影切换 (Sun)
```

### ConstructionKnowledgePanel — 手风琴交互系统

```
面板布局:
  Header (节点名称 + 描述 + 分类标签)
  ───────────────────────
  构件列表 (按 order 降序: 顶层→底层)
  ├── 保护层 (40厚细石混凝土毛面)     ← 折叠态: GLB真名 + 厚度 + 材质
  │   └── [展开]                      ← 点击/3D联动 展开
  │       ├── 厚度: 40mm
  │       ├── 材料: 细石混凝土毛面
  │       ├── 说明: ...
  │       └── ▲ 收起
  ├── 防水层 (4厚SBS改性沥青...)      ← 其他卡片自动下移 (layout动画)
  ...

双向联动:
  面板点击 → setSelectedObject(name) + setExpandedId(name)
  3D 点击  → selectedObject 变化 → useEffect → fuzzyMatchLayer → setExpandedId(name)
  收起     → setExpandedId(null) + setSelectedObject(null)
  容错匹配 → normalizeName(): 去空格/下划线 + 统一中英文标点
           → fuzzyMatchLayer(): 精确 → 逐级剥离尾缀 → 模糊匹配
```

### ModelViewer 核心系统 (~380行)

| 子系统 | 实现 |
|--------|------|
| GLB 加载 | `useGLTF(path, true)` Draco 解码 |
| 动画 | 所有 AnimationClip 同时播放，`LoopOnce` 单次播放，`clampWhenFinished` 保持末帧 |
| 动画控制 | `_actions.forEach()` 批量控制 play/pause/reverse/setTime |
| 自动居中 | Box3 一次性居中 (加载时) |
| 边缘线 | `EdgesGeometry + LineSegments` 作为 mesh 子元素随动画移动，`raycast = () => {}` 禁用 |
| 高亮门控 | `animationProgress >= 0.99` 才启用（selector 阈值过滤，避免每帧重渲染）；收起自动清除 |
| 命中代理 | 每个子 Mesh 附 3% 放大不可见 proxy，仅 proxy 参与射线检测 |
| 材质隔离 | 初始化时克隆所有命名 Mesh 的 material，防止共享材质导致跨构件高亮泄露 |
| 逻辑名分组 | `meshMapRef: Map<逻辑名, Mesh[]>` — 多材质构件所有子 Mesh 聚合到同一逻辑名下 |
| 名称清理 | `cleanName()` 去掉 Three.js 自动加的后缀（`_1`, `.004` 等） |
| 父 Group 检测 | 优先用父 Group 名（多材质包裹），排除 Scene 根节点 |
| 高亮效果 | hover: emissive white 0.15 / selected: emissive `#d4a843`(亮金) 0.5 |
| 事件 | R3F `onPointerOver/Out/Click` + `findNamedMesh()` + 诊断日志 |
| 阴影 | PCFSoftShadowMap, 2048×2048, UI 开关 |
| 色调映射 | ACESFilmicToneMapping, exposure=1.0 |
| 相机 | 02-2 风格动态锚点：Box3 → controls.target.lerp(center, alpha) |
| 模型路径 | `MODEL_PATHS` 查表 + `getModelPath(nodeId)` |

### 高亮交互系统

```
初始化阶段:
  scene.traverse → 遍历所有 Mesh
    ├── 识别逻辑名: 优先父 Group 名（多材质），回退自身名（单材质）
    ├── meshMapRef[逻辑名] += [子Mesh]  ← 聚合分组
    ├── 创建 Proxy (3%放大, name=逻辑名)
    └── 材质克隆 → 每个 Mesh 独立 material 实例（防跨构件高亮泄露）

运行时命中:
  鼠标移动 → R3F Raycaster
    ↓
  命中 Proxy Mesh (唯一射线目标)
    ↓
  findNamedMesh:
    ├── 父 Group (type=Group, name≠Scene) → cleanName(parent.name)
    └── 自身 Mesh → cleanName(mesh.name)
    ↓
  cleanName: 去掉 Three.js 自动后缀 (_1, .004 等)
    ↓
  handlePointerOver/Click → progress 门控
    ↓
  setHoveredObject / setSelectedObject → Store

高亮应用:
  useEffect → setGroupEmissive(logicalName, color, intensity)
    ↓
  meshMapRef.get(logicalName) → Mesh[] (全部子 Mesh)
    ↓
  每个子 Mesh → 所有 material → emissive 修改（材质已独立，不泄露）

名称匹配 (面板):
  normalizeName: 空格/下划线 → 消除, 中英文标点 → 统一
  fuzzyMatchLayer: 精确 → 逐级剥离尾缀 [_\\d]+ → 模糊匹配
```

三层射线屏蔽:
- 可见 Mesh → `raycast = () => {}`
- 边缘线 → `raycast = () => {}`
- Proxy (3% 放大) → 唯一射线目标

Three.js GLB 加载时的名称变化（已自动处理）:
- 空格 → 下划线: `"1：1：6 水泥"` → `"1：1：6_水泥"`
- 多材质拆分: 加 `_1`, `_2` 后缀
- Mesh 名带 `.NNN`: `"01.004"` → `"01004"` (去掉小数点)

---

## 4. 目录结构（src/）

```
src/
├── main.tsx                              # 入口
├── routes.tsx                            # 路由（HashRouter，13 条路由）
├── index.css                             # Tailwind v4 @theme + 全局样式
├── NodeDetail.tsx                        # ⭐ 核心：三栏交互 + 动画 + 阴影 + 模型查表
│
├── components/
│   ├── AppLayout.tsx                     # 全局导航栏
│   └── viewer/
│       ├── ModelViewer.tsx               # ⭐ 3D 视口 (~380行)
│       ├── MenuBackground.tsx            # 首页 3D 背景 + 可控阴影
│       ├── LoadingOverlay.tsx            # 加载动画
│       ├── NodeDiagramPanel.tsx          # 左面板：剖面图 (520px)
│       └── ConstructionKnowledgePanel.tsx # ⭐ 手风琴面板 + 双向3D联动 + 排序 + 容错匹配
│
├── pages/
│   ├── HomePage.tsx                      # 主控制台：菜单 + 统计 + 登录 + 阴影
│   ├── CurriculumPage.tsx                # 8 模块网格
│   ├── SectionSubPage.tsx                # 子章节卡片
│   ├── TextbookPage.tsx                  # 课本阅读 (lazy)
│   ├── LibraryPage.tsx                   # 节点库 (仅屋顶分类, 排除案例)
│   ├── CasesPage.tsx                     # ⭐ 案例应用 (yuncheng 节点, 模型开发中)
│   ├── ResourcesPage.tsx                 # ⭐ 拓展链接工具箱 (flex-wrap卡片 + 真实URL)
│   ├── DataAnalysis.tsx                  # ⭐ 学习数据分析 (Recharts 3图表 + 演示数据, lazy)
│   ├── AIPage.tsx                        # ⭐ AI 建筑学助教 (DeepSeek, lazy)
│   ├── GamesPage.tsx                     # 作业训练 (lazy)
│   └── PlaceholderPage.tsx               # 通用占位
│
├── data/
│   ├── menu.ts                           # 侧栏菜单 (扁平, 8项)
│   ├── nodesIndex.ts                     # 8 节点索引 + 懒加载 + 缩略图
│   ├── courseModules.ts                  # 8 模块定义
│   ├── backgroundScenes.ts               # 首页 3D 场景
│   ├── roofDrainageLayers.ts             # 无组织排水构件 (3层, objectName=GLB名)
│   ├── organizedDrainageLayers.ts        # 有组织排水构件 (4层)
│   ├── flatRoofLayers.ts                 # ⭐ 平屋面构件 (8层, order排序, GLB真名)
│   ├── flatRoof.ts                       # 平屋面详细数据
│   ├── membraneRoof.ts                   # 卷材防水屋面
│   ├── roofInsulation.ts                 # 保温屋面
│   ├── roofDrainage.ts                   # 无组织排水
│   ├── organizedDrainage.ts              # 有组织排水
│   └── sections/ (10 个 .js)            # 各模块子章节
│
├── store/
│   ├── nodeStore.ts                      # Zustand：hover/select/play/progress
│   ├── chatStore.ts                      # ⭐ AI 聊天：messages/isLoading/error + DeepSeek API
│   ├── authStore.ts                      # ⭐ 模拟登录：isLoggedIn/userName/login/logout
│   └── analysisStore.ts                  # ⭐ 学习分析：visitedNodes/aiQuestions/totalInteractions (persist)
│
└── assets/
```

---

## 5. Stores 总览

| Store | Key | 持久化 | 功能 |
|-------|-----|--------|------|
| `nodeStore` | — | 否 | 3D 悬停/选中/动画进度 |
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
| `/library` | LibraryPage | 直接 | 节点库(仅屋顶) |
| `/node/:nodeId` | NodeDetail | lazy | ⭐ 核心交互 |
| `/resources` | ResourcesPage | 直接 | 拓展链接 |
| `/data` | DataAnalysis | lazy | 学习数据 |
| `/ai` | AIPage | lazy | AI 问答 |
| `/games` | GamesPage | lazy | 作业训练 |
| `/tools` | PlaceholderPage | 直接 | 占位 |
| `/contribute` | PlaceholderPage | 直接 | 占位 |

---

## 8. 节点清单

| ID | 标题 | 分类 | GLB 模型 | 层数据 | 动画 |
|----|------|------|----------|--------|------|
| `flat-roof-01` | 平屋面构造 | 屋顶 | ✅ flat-roof.glb (8 mesh) | ✅ 8层, order排序 | ✅ |
| `membrane-roof-01` | 卷材防水屋面 | 屋顶 | ✅ | ✅ | - |
| `roof-insulation-01` | 保温构造 | 屋顶 | ✅ | ✅ | - |
| `roof-drainage-01` | 无组织排水 | 屋顶 | ✅ 3 构件 | ✅ | ✅ 96帧 |
| `organized-drainage-01` | 有组织排水 | 屋顶 | ✅ 4 构件 | ✅ | ✅ 96帧 |
| `yuncheng-c-01` | 郓城案例 01 | 案例 | ⚠ | ⚠ | ⚠ |
| `yuncheng-c-02` | 郓城案例 02 | 案例 | ⚠ | ⚠ | ⚠ |
| `yuncheng-c-03` | 郓城案例 03 | 案例 | ⚠ | ⚠ | ⚠ |

---

## 9. 拓展链接工具箱

| 板块 | 子链接 | URL |
|------|--------|-----|
| 空间设计 | 建筑学长 | `https://www.archcollege.com` |
| | 建筑盒子 | 待补充 |
| 建筑规范 | 建标库 | `https://jianbiaoku.com` |
| 热门网址 | goood谷德 | `https://www.gooood.cn` |

布局：flex-wrap 自适应卡片 + 底部"本站坚持人工甄选 · 持续更新行业资源"

---

## 10. 数据分析页面

| 卡片 | 图表类型 | 数据 |
|------|----------|------|
| 学习进度 | RadialBarChart 圆环 | visitedNodes.length / 8 |
| 构件热力 | BarChart 横向条形 | 节点访问频次 + 趋势箭头 |
| AI 问答画像 | PieChart 环形饼图 | 分类: 构造做法/材料特性/空间逻辑/其他 |

顶部概览卡片：总交互次数 / 累计学习时长(~1.8min/次) / 本周活跃天数

数据埋点：NodeDetail 访问时记录 + AIPage 提问时自动分类记录

---

## 11. AI 问答系统

```
用户输入 → categorizeQuestion() 自动分类
         → analysisStore.addAIQuestion()
         → chatStore.sendMessage()
           → POST /api/deepseek/chat/completions (Vite 代理)
           → SYSTEM_PROMPT (建筑学助教)
         → 流式返回 → 气泡动画展示
```

安全：API Key 在 `.env.local` / Vite 代理层注入，前端代码零暴露

---

## 12. 完成状态

### 已完成 ✅

| 模块 | 功能 |
|------|------|
| 首页 | 侧栏菜单(8项) + 3D背景 + 场景切换 + 阴影开关 + 统计卡片 + 模拟登录 |
| 课程 | 8模块 → 子章节 drill-down |
| 节点库 | 分类网格 + 剖面截图缩略图 (案例已剥离) |
| 案例应用 | 独立 CasesPage + Building2 占位 + [模型开发中] 标签 |
| NodeDetail | 三栏布局 + GLB + 动画 + 反向播放 + 时间轴 |
| NodeDetail | 边缘线 + 命中代理 + 高亮门控 + 双向3D手风琴联动 |
| NodeDetail | 动态相机 + 阴影开关 + 构件排序 + GLB真名匹配 |
| 拓展链接 | flex-wrap卡片 + 真实URL + 底部标语文案 |
| 数据分析 | 3种Recharts图表 + 演示数据种子 + 空状态兜底 |
| AI 问答 | DeepSeek API + 建筑学助教提示词 + lazy加载 |
| 状态管理 | 4 Stores (node/chat/auth/analysis) |
| 安全 | Vite 代理隐藏 API Key |

### 待完成

| 功能 | 优先级 |
|------|--------|
| 更多节点补充构件数据 + 剖面图 | 高 |
| 拓展链接补充"建筑盒子"URL | 中 |
| 拖拽组装游戏 | 中 |
| 郓城案例模型迁移 | 低 |
| 课本内容填充 | 低 |

---

## 13. 设计原则

1. **教学主线优先**：所有功能服务"模型→构件→知识→教材"链路
2. **克制复杂度**：禁止后处理特效、物理引擎
3. **Blender 动画驱动**：动画由 Blender 制作导出为 GLB
4. **双向联动**：3D 模型 ↔ 知识面板（手风琴 + 容错匹配）
5. **稳定优先**：一次性遍历、无 window listener、delta 钳制
6. **相机用户优先**：只动 target 不动 position，拖拽时暂停跟随
7. **命中精度优先**：proxy mesh + 射线屏蔽 + 门控

---

## 14. 开发命令

```bash
npm run dev          # localhost:5173 (需 .env.local 配置 DEEPSEEK_API_KEY)
npm run build        # 生产构建
npx tsc --noEmit     # 类型检查
```

---

_最后更新：2026-06-22_
