# 建筑构造交互教材 — 项目全景文档

## 1. 项目定位

**建筑构造交互系统**（Building Construction Interactive System）是一个面向建筑学教育的开源 Web 应用。通过 **三维可视化、交互式分解视图、结构化课程体系**，帮助学生和从业者直观理解建筑构造的空间逻辑。

```
定位：教学系统操作中枢（非 Demo，非营销站）
用户：建筑学大三学生
气质：architectural / editorial / paper-like / calm academic / minimal luxury
```

---

## 2. 技术栈

| 层 | 技术 | 版本 | 用途 |
|----|------|------|------|
| 框架 | React | 19.2 | UI |
| 构建 | Vite | 8.0 | 打包 + HMR |
| 类型 | TypeScript | 6.0 | 类型检查 |
| 3D | Three.js / @react-three/fiber / @react-three/drei | 0.184 / 9.6 / 10.7 | 3D 场景渲染 |
| 样式 | Tailwind CSS v4 | 4.3 | 原子化 CSS + `@theme` 自定义 token |
| 动效 | Framer Motion | 12.4 | 页面过渡 + 悬浮 + 加载动画 |
| 路由 | React Router DOM | 7.18 | Hash 路由（支持静态部署） |
| 状态 | Zustand | 5.0 | 轻量全局状态 |
| 图标 | lucide-react + react-icons | 1.21 / 5.6 | UI 图标库 |
| 数据 | 本地 TS/JS 文件 + 动态 import | — | 课程/节点/章节数据 |
| 模型 | GLB (Draco 压缩) | — | 3D 建筑模型 |

---

## 3. 架构全景

```
┌─────────────────────────────────────────────────────────┐
│                     main.tsx                            │
│              RouterProvider(router)                     │
└─────────────────────┬───────────────────────────────────┘
                      │
              ┌───────┴───────┐
              │   AppLayout   │  ← 全局导航栏（非首页/非登录页）
              │   <Outlet />  │
              └───────┬───────┘
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌─────────┐  ┌──────────┐  ┌──────────┐
   │ HomePage│  │Curriculum│  │ Library  │  ...
   └────┬────┘  │  Page    │  │  Page    │
        │       └────┬─────┘  └──────────┘
   ┌────┴────┐      │
   │ Sidebar │  ┌───┴──────────┐
   │ (384px) │  │SectionSubPage │  ← 子章节卡片 + drill-down
   └─────────┘  └───┬──────────┘
   ┌──────────────┐│
   │MenuBackground││  ┌──────────────┐
   │ (3D Scene)   ││  │TextbookPage   │  ← 课本阅读 + 模型卡片
   └──────────────┘│  └──────────────┘
   ┌──────────────┐│
   │LoadingOverlay││  ┌──────────────┐
   └──────────────┘│  │ NodeDetail    │  ← 3D 分解视图
                    │  └──────────────┘
                    │  ┌──────────────┐
                    │  │ GamesPage     │  ← 拖拽组装（占位）
                    │  └──────────────┘
```

---

## 4. 目录结构（src/）

```
src/
├── main.tsx                          # 入口：挂载 RouterProvider
├── routes.tsx                        # 路由配置（Hash 路由）
├── index.css                         # Tailwind v4 @theme + 全局样式
├── NodeDetail.tsx                    # 3D 节点详情页（lazy）
│
├── components/
│   ├── AppLayout.tsx                 # 全局导航栏（sticky header + <Outlet/>）
│   ├── viewer/
│   │   ├── MenuBackground.tsx        # ⭐ 3D 场景核心：GLB 加载/阴影/错误边界
│   │   └── LoadingOverlay.tsx        # 加载动画：5 条交错浮动条 + spinner
│   │
│   ├── Title.tsx                     # [legacy] 品牌标题动画
│   ├── Sidebar.tsx                   # [legacy] 左侧导航栏
│   ├── HomeLayout.tsx                # [legacy] 首页布局
│   ├── InfoCard.tsx                  # [legacy] 构件信息卡片
│   ├── ExplodeSlider.tsx             # [legacy] 展开滑块
│   ├── Model.tsx                     # [legacy] 示例 3D 模型
│   ├── Scene.tsx                     # [legacy] 示例 3D 场景
│   └── Viewer3D.tsx                  # [legacy] 3D 查看器
│
├── pages/
│   ├── HomePage.tsx                  # ⭐ 首页：侧栏 + 3D 场景 + 统计
│   ├── CurriculumPage.tsx            # 课程模块网格（8 模块）
│   ├── SectionSubPage.tsx            # 子章节卡片 + drill-down
│   ├── TextbookPage.tsx              # 课本内容页（lazy）
│   ├── LibraryPage.tsx               # 节点库网格（按分类）
│   ├── GamesPage.tsx                 # 作业训练（占位，lazy）
│   └── PlaceholderPage.tsx           # 通用占位页
│
├── data/
│   ├── tokens.ts                     # 设计 token（colors/spacing/typography/radius）
│   ├── menu.ts                       # 侧栏菜单结构
│   ├── nodesIndex.ts                 # 节点索引 + 懒加载器（8 节点）
│   ├── courseModules.ts              # 8 个课程模块定义
│   ├── backgroundScenes.ts           # 首页 3D 背景场景配置
│   ├── roofSections.ts               # 屋顶课本章节（8 章节）
│   ├── flatRoof.ts                   # 平屋面节点数据（6 层 + GLB 路径）
│   ├── membraneRoof.ts               # 卷材防水屋面（6 层）
│   ├── roofInsulation.ts             # 保温屋面（9 层）
│   ├── roofDrainage.ts               # 无组织排水（3 层）
│   ├── organizedDrainage.ts          # 有组织排水（4 层）
│   └── sections/                     # 10 个子章节数据文件（.js, lazy import）
│       ├── introSections.js          # 绪论 - 6 节
│       ├── wallSections.js           # 墙体 - 5 节
│       ├── windowSections.js         # 门窗 - 2 节
│       ├── foundationSections.js     # 基础与地基 - 6 节
│       ├── floorSections.js          # 楼地层 - 5 节
│       ├── stairsSections.js         # 楼梯 - 5 节
│       ├── roofSections.js           # 屋顶 - 3 节
│       ├── deformationJointSections.js # 变形缝 - 3 节
│       ├── caseSections.js           # 案例 - 1 父 + 3 子（含 drill-down）
│       └── structureSections.js      # 结构 - 空（待建）
│
├── store/
│   └── nodeStore.ts                  # Zustand：selected + explode 状态
│
└── assets/                           # Vite 模板遗留（可清理）
```

---

## 5. 设计系统

### 5.1 色彩体系（Claude/Anthropic 风格）

| Token | 值 | 角色 |
|-------|-----|------|
| `canvas` | `#faf9f5` | 页面底色 |
| `surface-soft` | `#f5f0e8` | 柔和表面 |
| `surface-card` | `#efe9de` | 卡片表面 |
| `surface-cream-strong` | `#e8e0d2` | 强调卡片 |
| `surface-dark` | `#181715` | 深色表面 |
| `primary` | `#cc785c` | 主色（暖珊瑚） |
| `primary-active` | `#a9583e` | 按下态 |
| `ink` | `#141413` | 主文字 |
| `body` | `#3d3d3a` | 正文 |
| `muted` | `#6c6a64` | 次要文字 |
| `hairline` | `#e6dfd8` | 分割线 |

完整 token 定义：`src/index.css`（Tailwind `@theme`）和 `src/data/tokens.ts`（JS 引用）

### 5.2 字体

| 用途 | 字体 |
|------|------|
| 展示/标题 | Noto Sans SC（500 weight） |
| 正文/导航 | Noto Sans SC（400 weight） |
| 代码 | JetBrains Mono |

OpenType 特性：`cv02, cv03, cv04, cv11`（中文字形变体）

### 5.3 动效

- 页面进入：`staggerChildren: 0.08`，spring 弹簧缓动
- 卡片 hover：`-translate-y-1` + `scale-[1.01]` + 边框变 coral
- 标题动画：逐字 stagger（0.06s/字）
- 加载动画：5 条交错浮动 bar + spinner

---

## 6. 路由系统

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | HomePage | 主控制台（侧栏 + 3D 场景） |
| `/curriculum` | CurriculumPage | 8 模块网格 |
| `/curriculum/:moduleId` | SectionSubPage | 子章节卡片列表 |
| `/textbook/:sectionId` | TextbookPage | 课本阅读页（lazy） |
| `/library` | LibraryPage | 节点库（按分类网格） |
| `/node/:nodeId` | NodeDetail | 3D 节点分解视图（lazy） |
| `/games` | GamesPage | 作业训练（lazy，占位） |
| `/tools` | PlaceholderPage | 工具箱（占位） |
| `/contribute` | PlaceholderPage | 贡献节点（占位） |
| `/curriculum/cases` | PlaceholderPage | 案例应用（占位） |

路由类型：`createHashRouter`（支持 GitHub Pages 等静态部署）

---

## 7. 数据架构

### 7.1 三层结构

```
Module (courseModules.ts)
  └─ Section (sections/*.js)          ← 子章节，可含 children 实现 drill-down
       ├─ Node (nodesIndex.ts)        ← 3D 交互节点
       │    └─ Layer Data (flatRoof.ts 等)  ← 构件层定义 + GLB 路径
       └─ Textbook (roofSections.ts)  ← 课本内容引用
```

### 7.2 节点清单

| ID | 标题 | 分类 | 层数 | GLB 模型 |
|----|------|------|------|----------|
| `flat-roof-01` | 平屋面构造 | 屋顶 | 6 | ✅ |
| `membrane-roof-01` | 卷材防水屋面 | 屋顶 | 6 | ✅ |
| `roof-insulation-01` | 保温构造 | 屋顶 | 9 | ✅ |
| `roof-drainage-01` | 无组织排水 | 屋顶 | 3 | ✅ |
| `organized-drainage-01` | 有组织排水 | 屋顶 | 4 | ✅ |
| `yuncheng-c-01` | 郓城案例 01 | 案例 | — | ⚠ 模型待迁移 |
| `yuncheng-c-02` | 郓城案例 02 | 案例 | — | ⚠ 模型待迁移 |
| `yuncheng-c-03` | 郓城案例 03 | 案例 | — | ⚠ 模型待迁移 |

---

## 8. 当前功能清单

### ✅ 已完成

| 功能 | 状态 |
|------|------|
| 首页主控制台（侧栏导航 + 3D 场景） | ✅ |
| 3D 场景：GLB 模型加载 + 阴影 + 环境光 + 悬浮动画 | ✅ |
| 3D 场景：PCF 软阴影 + ACES Filmic 色调映射 | ✅ |
| 3D 场景：自动旋转 + 场景切换 + 加载动画 | ✅ |
| 左侧菜单：3 组导航 + 逐字标题动画 | ✅ |
| 节点库：分类卡片网格 + hover 动效 | ✅ |
| 课程目录：8 模块网格 → 子章节 drill-down | ✅ |
| 课本阅读页 + 3D 模型卡片链接 | ✅ |
| 3D 节点详情页（基础版） | ✅ |
| 设计 token 系统（30+ 色 + 9 级字 + 7 级间距） | ✅ |
| Tailwind CSS v4 集成 + 自定义 `@theme` | ✅ |
| 代码拆分（r3f / NodeDetail / Games / 子章节数据独立 chunk） | ✅ |
| Hash 路由（支持静态部署） | ✅ |

### ⚠ 待完善

| 功能 | 优先级 | 说明 |
|------|--------|------|
| NodeDetail 全层 GLB 加载 | 高 | 目前仅显示单个方块，需加载逐层模型 |
| 郓城案例模型迁移 | 高 | 3 个 yuncheng-c 模型从 02-2 迁移 |
| 子章节数据标记为"可用" | 中 | 目前所有 section 的 `available: false` |
| 课本内容填充 | 中 | 目前 textbook 内容为占位 Markdown |
| 拖拽组装游戏 | 中 | GamesPage 为占位 |
| 用户认证 | 低 | 02-2 有 Supabase auth，可迁移 |
| 管理后台 | 低 | 02-2 有 AdminContentPage |
| 截图笔记 | 低 | 02-2 有 ScreenshotTool + NotesPage |
| 移动端适配 | 中 | 目前仅桌面端 |

---

## 9. 未来规划

### Phase 1：核心 3D 体验（当前优先）

- [ ] NodeDetail 逐层 GLB 模型加载 + 分解动画
- [ ] 构件点击高亮 + 信息面板联动
- [ ] 视角 Gizmo（6 向切换）
- [ ] 图层标签（3D 空间文字标注）
- [ ] 爆炸展开平滑动画（lerp）

### Phase 2：课程内容

- [ ] 所有 8 个模块的子章节标记为 `available: true`
- [ ] 填充核心章节的课本内容（Markdown）
- [ ] 子章节与 3D 节点的深度链接
- [ ] 搜索 + 面包屑导航

### Phase 3：交互功能

- [ ] 拖拽组装游戏（参考 02-2 的 GamesPage + AssemblyLine + LayerCard）
- [ ] 截图工具 + 学习笔记
- [ ] 2D 构造图 + 3D 模型联动

### Phase 4：系统增强

- [ ] 用户认证（Supabase）
- [ ] 学习进度追踪
- [ ] 管理后台（内容编辑）
- [ ] 移动端响应式适配
- [ ] PWA 离线支持

---

## 10. 开发命令

```bash
npm run dev       # 开发服务器（localhost:5173）
npm run build     # 生产构建
npm run preview   # 预览生产构建
npx tsc --noEmit  # TypeScript 类型检查
```

---

## 11. 参考来源

| 来源 | 用途 |
|------|------|
| `D:\vscode project\02-2` | 原始项目：设计系统、3D 组件、课程数据、页面结构 |
| `D:\vscode project\awesome-design-md\design-md\claude\DESIGN.md` | Claude 设计语言参考 |
| `.design-sync/references/claude-DESIGN.md` | 本地副本 |
| `.design-sync/references/DESIGN-MAPPING.md` | 设计系统对照映射表 |

---

_最后更新：2026-06-21_
