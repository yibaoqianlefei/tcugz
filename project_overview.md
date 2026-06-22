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
| 构建 | Vite 8 | 打包 + HMR |
| 类型 | TypeScript 6 | 类型检查 |
| 3D 渲染 | Three.js 0.184 + @react-three/fiber 9.6 + @react-three/drei 10.7 | Canvas、GLB 加载、OrbitControls |
| 动画 | framer-motion 12 | UI 过渡、加载动画 |
| 3D 动画 | AnimationMixer (Blender → GLB, 96帧) | 构件展开/合拢动画 |
| 样式 | Tailwind CSS v4 | 原子化 CSS + `@theme` 自定义 token |
| 路由 | React Router DOM 7 | Hash 路由（支持静态部署） |
| 状态 | Zustand 5 | 轻量全局状态 |
| 图标 | lucide-react | UI 图标 |

---

## 3. 架构全景

```
main.tsx
  └── RouterProvider (HashRouter)
        └── AppLayout (全局导航栏 + <Outlet/>)
              ├── /              → HomePage          (主控制台)
              ├── /curriculum    → CurriculumPage     (8 模块网格)
              ├── /curriculum/:moduleId → SectionSubPage (子章节)
              ├── /textbook/:sectionId → TextbookPage   (课本)
              ├── /library       → LibraryPage       (节点库，含剖面截图缩略图)
              ├── /node/:nodeId  → NodeDetail (lazy) ⭐ 核心交互页
              ├── /resources     → ResourcesPage     (拓展链接)
              └── /games         → GamesPage (lazy)  (作业训练)
```

### HomePage 侧栏布局

```
HomePage
  ├── 左侧栏 (w-sidebar, 24rem)
  │   ├── 标题 "建筑构造" (48px) + 装饰线
  │   ├── 导航菜单 (8 项，扁平无分组，flex-1 justify-center + gap-3 居中紧凑排布)
  │   │   ├── 构造原理    → /curriculum
  │   │   ├── 节点库      → /library
  │   │   ├── 案例应用    → /curriculum/cases
  │   │   ├── 基础学习    → /textbook/roof-membrane
  │   │   ├── 作业训练    → /games
  │   │   ├── AI 问答     (即将上线)
  │   │   ├── 数据分析    (即将上线)
  │   │   └── 拓展链接    → /resources
  │   ├── 统计卡片 (边框分隔，三列紧凑：构造节点 / 分类 / 交互视图)
  │   └── 标语 "探索建筑构造的空间逻辑"
  └── 右侧 (flex-1) 3D 场景
      ├── 顶部导航栏 (贡献节点 + 关于项目)
      ├── Canvas (MenuBackground, GLB 背景模型)
      └── 右下角控制 (场景切换 + 旋转切换 + 阴影切换)
```

### NodeDetail 内部架构（核心页面）

```
NodeDetail.tsx (编排器, ~190行)
  ├── Header (面包屑)
  ├── Body (三栏 flex)
  │   ├── NodeDiagramPanel (520px)     ← 剖面图 (roof-drainage / organized-drainage 已有图片)
  │   ├── ModelViewer (flex-1, ~380行)  ← 3D 视口 ⭐
  │   │   ├── SceneModel               ← GLB + AnimationMixer + 边缘线 + 高亮(门控) + 命中代理
  │   │   ├── CameraTracker            ← 动态锚点：Box3 → controls.target.lerp
  │   │   ├── SceneLights              ← 2 方向光 + 环境光 (可控 castShadow)
  │   │   └── ShadowPlane              ← 地面阴影 (可控显隐)
  │   └── ConstructionKnowledgePanel (360px) ← 构件列表 + 详情 + 双向联动
  └── Floating Timeline (居中浮动，02-2 风格)
        ├── 收起爆炸 (ChevronsLeft)
        ├── 进度条 slider
        ├── 播放爆炸 (ChevronsRight)
        ├── 旋转切换 (RotateCw + R 键提示)
        └── 阴影切换 (Sun)
```

### ModelViewer 核心系统 (~380行)

| 子系统 | 实现 |
|--------|------|
| GLB 加载 | `useGLTF(path, true)` Draco 解码 |
| 动画 | 所有 AnimationClip 同时播放，`LoopOnce` 单次播放，`clampWhenFinished` 保持末帧 |
| 动画控制 | `_actions.forEach()` 批量控制 play/pause/reverse/setTime |
| 自动居中 | Box3 一次性居中 (加载时) |
| 边缘线 | `EdgesGeometry + LineSegments` 作为 mesh 子元素随动画移动，`raycast = () => {}` 禁用射线 |
| 高亮门控 | `animationProgress >= 0.99` 才启用高亮；收起爆炸自动清除视觉高亮 |
| 命中代理 | 每个命名 mesh 附 3% 放大不可见 proxy mesh，仅 proxy 参与射线检测，提高命中精度 |
| 高亮效果 | hover: emissive white 0.15 / selected: emissive #cc785c 0.4 |
| 事件 | R3F `onPointerOver/Out/Click` + `findNamedMesh()` 向上查找父 Mesh |
| 阴影 | PCFSoftShadowMap, 2048×2048, 可通过 UI 开关 |
| 色调映射 | ACESFilmicToneMapping, exposure=1.0 |
| 相机 | 02-2 风格动态锚点：每帧 Box3 取中心 → `controls.target.lerp(center, alpha)` |
| 用户优先 | OrbitControls drag 时暂停跟随，松手立即恢复 |

### 高亮交互系统详细设计

```
事件流程:
  鼠标移动 → R3F Raycaster
    ↓
  命中不可见 Proxy Mesh (3% 放大)
    ↓ (命中代理继承原 mesh 的 name)
  findNamedMesh(e.object) 解析构件名
    ↓
  handlePointerOver → 检查 progress >= 0.99
    ↓
  setHoveredObject(name) → Zustand Store
    ↓
  useEffect [highlightEnabled, hoveredObject, selectedObject]
    ↓
  meshMapRef.get(name) → 修改 emissive

三层射线屏蔽:
  可见 Mesh      → raycast = () => {}  (禁用)
  边缘线 LineSegments → raycast = () => {}  (禁用)
  不可见 Proxy   → 唯一射线目标 (3% 放大)

门控逻辑:
  progress >= 0.99 → 悬停高亮启用
  progress >= 1    → 点击选中启用
  progress < 0.99  → 清除所有视觉高亮 (状态保留)
  收回爆炸         → highlightEnabled 变为 false → effect 自动清除高亮
```

### 相机系统

```
每帧：
  Box3.setFromObject(scene)        ← 当前动画状态包围盒
  box.getCenter(dynamicCenter)      ← 实时几何中心
  controls.target.lerp(center, alpha) ← 02-2 风格 fast lerp (tau=0.125s)

用户拖拽 → _isUserDragging=true → 跳过
松手 → _isUserDragging=false → 立即恢复跟随

只动 controls.target，不动 camera.position
→ OrbitControls 保持用户视角和距离不变
```

### 阴影开关系统

```
HomePage:
  showShadows state → MenuBackground.showShadows prop
    → RendererSetup: gl.shadowMap.enabled = showShadows
    → ShadowLight: castShadow = showShadows
    → ShadowPlane: 条件渲染 {showShadows && <ShadowPlane />}

NodeDetail:
  showShadows state → ModelViewer.showShadows prop
    → 同上的三层控制
```

---

## 4. 目录结构（src/）

```
src/
├── main.tsx                            # 入口
├── routes.tsx                          # 路由（HashRouter，11 条路由）
├── index.css                           # Tailwind v4 @theme + 全局样式
├── NodeDetail.tsx                      # ⭐ 核心：三栏交互 + 动画控制 + 阴影开关
│
├── components/
│   ├── AppLayout.tsx                   # 全局导航栏
│   └── viewer/
│       ├── ModelViewer.tsx             # ⭐ 3D 视口：GLB + mixer + 相机 + 高亮门控 + 命中代理 (~380行)
│       ├── MenuBackground.tsx          # 首页 3D 背景 + 可控阴影
│       ├── LoadingOverlay.tsx          # 加载动画（5 条 bar）
│       ├── NodeDiagramPanel.tsx        # 左面板：剖面图 (520px)
│       └── ConstructionKnowledgePanel.tsx # ⭐ 右面板：构件列表 + 双向联动

├── pages/
│   ├── HomePage.tsx                    # 主控制台：侧栏菜单 + 统计 + 阴影开关
│   ├── CurriculumPage.tsx              # 8 模块网格
│   ├── SectionSubPage.tsx              # 子章节卡片 + drill-down
│   ├── TextbookPage.tsx                # 课本阅读 (lazy)
│   ├── LibraryPage.tsx                 # 节点库网格 (含剖面截图缩略图/emoji 兜底)
│   ├── ResourcesPage.tsx               # ⭐ 拓展链接：三列可展开卡片
│   ├── GamesPage.tsx                   # 作业训练（占位，lazy）
│   └── PlaceholderPage.tsx             # 通用占位

├── data/
│   ├── tokens.ts                       # 设计 token（备用）
│   ├── menu.ts                         # 侧栏菜单结构 (扁平，无分组)
│   ├── nodesIndex.ts                   # 8 节点索引 + 懒加载器 + 缩略图
│   ├── nodes.ts                        # 旧节点定义
│   ├── courseModules.ts                # 8 模块定义
│   ├── backgroundScenes.ts             # 首页 3D 场景配置
│   ├── roofSections.ts                 # 屋顶课本章节
│   ├── roofDrainageLayers.ts           # ⭐ 无组织排水构件数据 (3 层，objectName 匹配 GLB)
│   ├── organizedDrainageLayers.ts      # ⭐ 有组织排水构件数据 (4 层，objectName 匹配 GLB)
│   ├── flatRoof.ts                     # 平屋面数据
│   ├── membraneRoof.ts                 # 卷材防水屋面
│   ├── roofInsulation.ts               # 保温屋面
│   ├── roofDrainage.ts                 # 无组织排水
│   ├── organizedDrainage.ts            # 有组织排水
│   └── sections/ (10 个 .js)          # 各模块子章节定义

├── store/
│   └── nodeStore.ts                    # Zustand：hover/select/play/progress

└── assets/                             # Vite 模板遗留
```

---

## 5. 设计系统

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

### 字体

展示/正文统一使用 **Noto Sans SC**（400/500 weight），含 OpenType 中文字形变体 `cv02, cv03, cv04, cv11`

### 间距

| Token | 值 | 用途 |
|-------|-----|------|
| `sidebar` | 24rem (384px) | 侧栏宽度 |
| `panel-kw` | 360px | 知识面板宽度 |
| `menu-item-h` | 48px | 菜单项高度 |
| `section-gap` | 28px | 区块间距 |
| `page-pt` | 64px | 页面顶部内边距 |
| `page-pb` | 80px | 页面底部内边距 |

---

## 6. 路由表

| 路由 | 页面 | 加载 |
|------|------|------|
| `/` | HomePage | 直接 |
| `/curriculum` | CurriculumPage | 直接 |
| `/curriculum/:moduleId` | SectionSubPage | 直接 |
| `/textbook/:sectionId` | TextbookPage | lazy |
| `/library` | LibraryPage | 直接 |
| `/node/:nodeId` | NodeDetail | lazy |
| `/resources` | ResourcesPage | 直接 |
| `/games` | GamesPage | lazy |
| `/tools` | PlaceholderPage | 直接 |
| `/contribute` | PlaceholderPage | 直接 |
| `/curriculum/cases` | PlaceholderPage | 直接 |

---

## 7. 节点清单

| ID | 标题 | 分类 | GLB 模型 | 层数据 | 动画 | 剖面图 |
|----|------|------|----------|--------|------|--------|
| `flat-roof-01` | 平屋面构造 | 屋顶 | ✅ | ✅ | - | - |
| `membrane-roof-01` | 卷材防水屋面 | 屋顶 | ✅ | ✅ | - | - |
| `roof-insulation-01` | 保温构造 | 屋顶 | ✅ | ✅ | - | - |
| `roof-drainage-01` | 无组织排水 | 屋顶 | ✅ 3 构件 | ✅ | ✅ 96帧 | ✅ |
| `organized-drainage-01` | 有组织排水 | 屋顶 | ✅ 4 构件 | ✅ | ✅ 96帧 | ✅ |
| `yuncheng-c-01` | 郓城案例 01 | 案例 | ⚠ | ⚠ | ⚠ | - |
| `yuncheng-c-02` | 郓城案例 02 | 案例 | ⚠ | ⚠ | ⚠ | - |
| `yuncheng-c-03` | 郓城案例 03 | 案例 | ⚠ | ⚠ | ⚠ | - |

---

## 8. NodeDetail 功能清单

| 功能 | 实现 |
|------|------|
| 三栏布局 | 左 520px 剖面图 / 中 flex-1 3D / 右 360px 知识 |
| GLB 加载 | `useGLTF` + Draco 解码 |
| 多 clip 动画 | 所有 AnimationClip 同时播放 |
| 动画控制 | 播放/收起 + 反向播放 + 时间轴 slider |
| LoopOnce 单次 | `clampWhenFinished=true`，结束保持末帧 |
| 96 帧时间轴 | slider 0-1 映射 0-4s |
| 模型边缘线 | `EdgesGeometry` 跟随动画，不参与射线检测 |
| 命中代理 | 不可见 3% 放大 proxy mesh，提高 3D 命中精度 |
| 构件高亮 | hover emissive 白色 / selected emissive coral |
| 高亮门控 | progress >= 0.99 才启用，收起自动清除 |
| 构件选中 | R3F onPointerOver/Out/Click + findNamedMesh |
| 知识面板 | 构件列表 + 选中详情 + 双向联动 |
| 剖面图 | roof-drainage + organized-drainage 节点已有图纸 |
| 相机锚点 | 动态 Box3 中心跟随爆炸 |
| 用户优先 | 拖拽时暂停相机跟随 |
| 自动旋转 | OrbitControls autoRotate + UI 按钮控制 |
| 阴影开关 | 可开启/关闭阴影 (Sun 图标按钮) |

---

## 9. 状态管理 (Zustand)

```ts
selectedObject: string | null   // 选中构件名
hoveredObject: string | null    // 悬停构件名
isPlaying: boolean              // 播放状态
animationProgress: number       // 0-1 进度
```

---

## 10. 拓展链接页面

| 板块 | 子链接 | URL 状态 |
|------|--------|----------|
| 空间设计 | 建筑学长、建筑盒子 | 待添加 |
| 建筑规范 | 建标库 | 待添加 |
| 热门网址 | goood谷德 | 待添加 |

三列卡片水平排列（`items-start` 各行独立高度），点击展开子链接列表。

---

## 11. 当前状态与规划

### 完成

| 功能 | 状态 |
|------|------|
| 首页：侧栏菜单 + 统计卡片 + 阴影开关 | ✅ |
| 首页：3D 背景 + 场景切换 + 旋转控制 | ✅ |
| 课程目录：8 模块 → 子章节 drill-down | ✅ |
| 节点库：分类卡片网格 + 剖面截图缩略图 | ✅ |
| NodeDetail：三栏布局 + GLB 加载 | ✅ |
| NodeDetail：多 clip 动画 + LoopOnce 反向播放 | ✅ |
| NodeDetail：96 帧时间轴 slider (02-2 风格) | ✅ |
| NodeDetail：模型边缘线 | ✅ |
| NodeDetail：构件高亮门控 + 命中代理 | ✅ |
| NodeDetail：动态相机锚点（02-2 风格） | ✅ |
| NodeDetail：剖面图（roof-drainage + organized-drainage） | ✅ |
| NodeDetail：阴影开关 | ✅ |
| 拓展链接：三列可展开卡片 | ✅ |
| 设计 token 系统 | ✅ |
| 代码拆分 | ✅ |

### 待完成

| 功能 | 优先级 |
|------|--------|
| 更多节点补充构件数据 | 高 |
| 更多节点上传剖面图 | 中 |
| 拓展链接填充真实 URL | 中 |
| 拖拽组装游戏 | 中 |
| 郓城案例模型迁移 | 低 |
| 课本内容填充 | 低 |

---

## 12. 设计原则

1. **教学主线优先**：所有功能服务"模型→构件→知识→教材"链路
2. **克制复杂度**：禁止后处理特效、物理引擎
3. **Blender 动画驱动**：动画由 Blender 制作导出为 GLB
4. **双向联动**：3D 模型 ↔ 知识面板
5. **稳定优先**：一次性遍历、无 window listener、delta 钳制
6. **相机用户优先**：只动 target 不动 position，拖拽时暂停跟随
7. **命中精度优先**：proxy mesh + 射线屏蔽 + 门控，确保交互准确可靠

---

## 13. 开发命令

```bash
npm run dev          # localhost:5173
npm run build        # 生产构建
npx tsc --noEmit     # 类型检查
```

---

_最后更新：2026-06-22_
