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
| 3D 动画 | AnimationMixer (Blender → GLB) | 构件展开/合拢动画 |
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
              ├── /           → HomePage          (主控制台)
              ├── /curriculum → CurriculumPage     (8 模块网格)
              ├── /curriculum/:moduleId → SectionSubPage (子章节)
              ├── /textbook/:sectionId → TextbookPage   (课本)
              ├── /library    → LibraryPage       (节点库)
              ├── /node/:nodeId → NodeDetail (lazy) ⭐ 核心交互页
              └── /games      → GamesPage (lazy)  (占位)
```

### NodeDetail 内部架构（核心页面）

```
NodeDetail.tsx (编排器)
  ├── Header (面包屑)
  ├── Body (三栏 flex)
  │   ├── NodeDiagramPanel (320px)     ← 剖面图占位
  │   ├── ModelViewer (flex-1)          ← 3D 视口
  │   │   ├── SceneModel               ← GLB + AnimationMixer + 高亮 + 事件
  │   │   ├── SceneLights              ← 2 方向光 + 环境光
  │   │   └── ShadowPlane              ← 地面阴影
  │   └── ConstructionKnowledgePanel (360px) ← 构件列表 + 详情
  └── Footer (动画控制栏 + 时间轴)
```

---

## 4. 目录结构（src/，44 文件，2284 行）

```
src/
├── main.tsx                            # 入口
├── routes.tsx                          # 路由（HashRouter，10 条路由）
├── index.css                           # Tailwind v4 @theme + 全局样式
├── NodeDetail.tsx                      # ⭐ 核心：三栏交互 + 动画控制
│
├── components/
│   ├── AppLayout.tsx                   # 全局导航栏
│   └── viewer/
│       ├── ModelViewer.tsx             # ⭐ 3D 视口：GLB + mixer + 高亮 + 事件
│       ├── MenuBackground.tsx          # 首页 3D 背景
│       ├── LoadingOverlay.tsx          # 加载动画（5 条 bar）
│       ├── NodeDiagramPanel.tsx        # 左面板：剖面图占位 (320px)
│       └── ConstructionKnowledgePanel.tsx # ⭐ 右面板：构件列表 + 双向联动 (360px)
│
├── pages/
│   ├── HomePage.tsx                    # 主控制台：侧栏 + 3D 背景
│   ├── CurriculumPage.tsx              # 8 模块网格
│   ├── SectionSubPage.tsx              # 子章节卡片 + drill-down
│   ├── TextbookPage.tsx                # 课本阅读 (lazy)
│   ├── LibraryPage.tsx                 # 节点库网格
│   ├── GamesPage.tsx                   # 作业训练（占位，lazy）
│   └── PlaceholderPage.tsx             # 通用占位
│
├── data/
│   ├── tokens.ts                       # 设计 token（备用，主 token 在 index.css）
│   ├── menu.ts                         # 侧栏菜单结构
│   ├── nodesIndex.ts                   # 8 节点索引 + 懒加载器
│   ├── nodes.ts                        # 旧节点定义
│   ├── courseModules.ts                # 8 模块定义
│   ├── backgroundScenes.ts             # 首页 3D 场景配置
│   ├── roofSections.ts                 # 屋顶课本章节
│   ├── roofDrainageLayers.ts           # ⭐ 排水屋面构件数据映射
│   ├── flatRoof.ts                     # 平屋面数据
│   ├── membraneRoof.ts                 # 卷材防水屋面
│   ├── roofInsulation.ts               # 保温屋面
│   ├── roofDrainage.ts                 # 无组织排水
│   ├── organizedDrainage.ts            # 有组织排水
│   └── sections/ (10 个 .js)          # 各模块子章节定义
│
├── store/
│   └── nodeStore.ts                    # Zustand：hover/select/play/progress
│
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

---

## 6. NodeDetail 核心系统

### 6.1 3D 渲染

| 项目 | 配置 |
|------|------|
| 色调映射 | ACESFilmicToneMapping, exposure=1.0 |
| 阴影 | PCFSoftShadowMap, 2048×2048 |
| 灯光 | 主光 [8,12,6] #fffdf7 + 补光 [-5,3,-3] #d4e3f0 + 环境光 |
| 背景 | #f5f5f7 |
| 地面 | shadowPlane, opacity=0.25 |

### 6.2 动画系统

| 功能 | 实现 |
|------|------|
| 加载 | `useGLTF(path, true)` Draco 解码 |
| 播放 | 所有 AnimationClip 同时 `action.play()` |
| 暂停 | `_actions.forEach(a => a.paused = true)` |
| 收起 | `a.time = 0 + mixer.update(0)` |
| 展开 | `a.time = clip.duration + mixer.update(0)` |
| 时间轴 | Range slider → `setTime(v * 48)` |
| delta 钳制 | `Math.min(delta, 0.033)` |
| 自动居中 | `Box3().setFromObject(scene)` → 位移到原点 |

### 6.3 交互系统

| 功能 | 实现 |
|------|------|
| 悬停 | R3F `onPointerOver/Out` + emissiveIntensity=0.15 |
| 选中 | R3F `onClick` + emissive="#cc785c" intensity=0.4 |
| 优先级 | Selected > Hover > Default |
| 不遍历 | shadow flag + meshMap 在 useEffect 一次性构建 |

### 6.4 知识面板

| 功能 | 实现 |
|------|------|
| 无选中 | 显示全部构件列表（名称 + 厚度 + 材料） |
| 有选中 | 显示名称 / 厚度 / 材料 / 说明 + 取消选中按钮 |
| 模型→面板 | 点击 3D 构件 → `getLayerInfo(name)` → 显示详情 |
| 面板→模型 | 点击构件卡片 → `setSelectedObject(name)` → 模型高亮 |
| 数据映射 | `roofDrainageLayers.ts`（objectName ↔ 教学信息） |

### 6.5 状态管理 (Zustand)

```ts
selectedObject: string | null   // 选中构件名
hoveredObject: string | null    // 悬停构件名
isPlaying: boolean              // 播放状态
animationProgress: number       // 0-1 进度
```

---

## 7. 路由表

| 路由 | 页面 | 加载 |
|------|------|------|
| `/` | HomePage | 直接 |
| `/curriculum` | CurriculumPage | 直接 |
| `/curriculum/:moduleId` | SectionSubPage | 直接 |
| `/textbook/:sectionId` | TextbookPage | lazy |
| `/library` | LibraryPage | 直接 |
| `/node/:nodeId` | NodeDetail | lazy |
| `/games` | GamesPage | lazy |
| `/tools` | PlaceholderPage | 直接 |
| `/contribute` | PlaceholderPage | 直接 |
| `/curriculum/cases` | PlaceholderPage | 直接 |

---

## 8. 节点清单

| ID | 标题 | 分类 | GLB 模型 | 层数据 |
|----|------|------|----------|--------|
| `flat-roof-01` | 平屋面构造 | 屋顶 | ✅ 6 层 GLB | ✅ |
| `membrane-roof-01` | 卷材防水屋面 | 屋顶 | ✅ 6 层 GLB | ✅ |
| `roof-insulation-01` | 保温构造 | 屋顶 | ✅ 9 层 GLB | ✅ |
| `roof-drainage-01` | 无组织排水 | 屋顶 | ✅ 3 构件 GLB | ✅ 有动画 |
| `organized-drainage-01` | 有组织排水 | 屋顶 | ✅ 4 层 GLB | ✅ |
| `yuncheng-c-01` | 郓城案例 01 | 案例 | ⚠ | ⚠ |
| `yuncheng-c-02` | 郓城案例 02 | 案例 | ⚠ | ⚠ |
| `yuncheng-c-03` | 郓城案例 03 | 案例 | ⚠ | ⚠ |

---

## 9. 当前状态

### 完成

| 功能 | 状态 |
|------|------|
| 首页：侧栏 + 3D 背景 + 统计 + 场景切换 | ✅ |
| 课程目录：8 模块 → 子章节 drill-down | ✅ |
| 节点库：分类卡片网格 | ✅ |
| NodeDetail：三栏布局 + GLB 加载 | ✅ |
| NodeDetail：多 clip 动画 + 播放/暂停/收起/展开 | ✅ |
| NodeDetail：时间轴 slider | ✅ |
| NodeDetail：自动居中 | ✅ |
| NodeDetail：构件高亮（hover + selected） | ✅ |
| NodeDetail：知识面板双向联动 | ✅ |
| NodeDetail：构件数据映射 | ✅ |
| 设计 token 系统 | ✅ |
| 代码拆分（lazy routes + 子章节独立 chunk） | ✅ |

### 待完成

| 功能 | 优先级 |
|------|--------|
| 更多节点补充构件数据（类似 roofDrainageLayers） | 高 |
| 剖面图上传 + 集成 | 中 |
| 拖拽组装游戏 | 中 |
| 郓城案例模型迁移 | 低 |
| 课本内容填充 | 低 |
| 用户认证 + 学习进度 | 低 |

---

## 10. 设计原则

1. **教学主线优先**：所有功能服务"模型→构件→知识→教材"链路，不做技术炫技
2. **克制复杂度**：禁止后处理特效、物理引擎、动态阴影系统、2D/3D 同步
3. **Blender 动画驱动**：动画由 Blender 制作并导出为 GLB，不写程序化 explode 数学
4. **双向联动**：3D 模型 ↔ 知识面板，点击任一侧触发另一侧
5. **稳定优先**：一次性遍历、无 window listener、delta 钳制

---

## 11. 开发命令

```bash
npm run dev          # localhost:5173
npm run build        # 生产构建
npx tsc --noEmit     # 类型检查
```

---

_最后更新：2026-06-21_
