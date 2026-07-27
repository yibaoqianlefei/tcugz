# 建筑构造交互教材 — 项目全景文档

## 1. 项目定位

**建筑构造交互系统**（Building Construction Interactive System）是面向建筑学教育的开源 Web 应用。通过 **三维可视化、多方案对比、程序化爆炸、交互式构件探索、结构化课程体系**，帮助学生和从业者直观理解建筑构造的空间逻辑。

```
定位：教学系统操作中枢
用户：建筑学学生
气质：architectural / editorial / paper-like / calm academic
核心链路：模型 → 方案 → 构件 → 知识 → 教材
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
| 3D 动画 | AnimationMixer (Blender → GLB) + 程序化 Explode | 构件展开/爆炸动画 |
| 图表 | Recharts 2 | 学习数据分析可视化 |
| 样式 | Tailwind CSS v4 | 原子化 CSS + `@theme` 自定义 token |
| 路由 | React Router DOM 7 | Hash 路由（支持静态部署） |
| 状态 | Zustand 5 (含 persist 中间件) | 全局状态 + localStorage 持久化 |
| 图标 | lucide-react | UI 图标 |
| AI | DeepSeek API (chat/completions) | AI 建筑学助教问答 |
| 压缩 | @gltf-transform/cli (WebP + Draco) | 模型纹理压缩 + 几何压缩 |
| 测试 | tsx + Playwright | 纯逻辑单测 (276) + Headless 浏览器验收 |

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
      │   │   ├── 📂 构造基础 ▶     ← 展开: 8模块
      │   │   ├── 节点库      → /library
      │   │   ├── 案例应用    → /curriculum/cases
      │   │   ├── 作业训练    → /games
      │   │   ├── 数据分析    → /data
      │   │   └── AI 拓展     → /ai-extend
      │   ├── 登录按钮 + 统计卡片 + 标语 (flex-shrink-0 固定底部)
      │
      ├── 右列 SubMenuPanel (AnimatePresence, 模块手风琴)
      │
      └── 右侧 (flex-1) 3D 场景
          ├── Canvas (MenuBackground)
          └── 右下角控制 (场景切换 + 旋转 + 阴影)
```

### NodeDetail 内部架构（核心页面）

```
NodeDetail.tsx (编排器, ~350行)
  ├── 统一配置读取: getNodeDefinition(nodeId)             ← ⭐ 单一配置源
  │     ├── node.model / presentationMode / variants
  │     ├── resolveNodeModelSources(node) → 1~3 model entries
  │     ├── resolveVariantExplodeConfig()  → Phase 5 explode 配置
  │     └── node.status → "available" | "development"
  ├── Header (面包屑)
  ├── VariantLabelBar (多方案节点, Phase 3) ← A/B/C 标签栏
  ├── Body (三栏 flex)
  │   ├── NodeDiagramPanel (520px)     ← 剖面图
  │   ├── ErrorBoundary (resetKey=nodeId:multiModelKey)
  │   │   └── ModelViewer (~830行) + animationController (75行)  ← 3D 视口 ⭐
  │   │   ├── SceneModel × 1~3         ← GLB + cloneSceneWithMaterials + 高亮 + variant identity
  │   │   ├── MultiModelGroup           ← Phase 2: 多模型布局 + Phase 5: Explode 驱动
  │   │   ├── CameraTracker            ← 动态锚点：整体 Box3 → controls.target.lerp
  │   │   ├── SceneLights              ← 2 方向光 + 环境光
  │   │   └── ShadowPlane              ← 地面阴影
  │   └── ConstructionKnowledgePanel (360px) ← Phase 3-4: 多方案知识联动
  └── Floating Timeline (居中浮动)
        ├── 收起/播放爆炸 (多方案禁用)
        ├── 滑块: explodeProgress (多方案) / animationProgress (普通)
        ├── 旋转切换 (RotateCw + R 键提示)
        └── 阴影切换 (Sun) + 联动开关 (Link2)
```

---

## 4. 多方案系统（Phase 2–5）

### 调用链总览

```
NodeDetail
  ├── resolveNodeModelSources(node) → [{id, src, scale, label, title} × 1~3]
  ├── resolveVariantExplodeConfig({node, variantId}) → ResolvedVariantExplodeConfig
  │
  └── ModelViewer (modelPaths? / modelPath)
        ├── Single-model path: SceneModel ×1 (GLTF Animation, backward compat)
        │
        └── Multi-model path: MultiModelGroup
              ├── SceneModel ×N (noAnimation, noGlobalRef)
              │     ├── cloneSceneWithMaterials(sourceScene)  ← 材质隔离
              │     ├── writeVariantIdentity(scene, identity)   ← Phase 3
              │     ├── meshMapRef per-instance
              │     └── Picking: scoped key `${variantId}::${objectName}`
              │
              ├── layoutModels() → computeMultiModelLayout(widths)
              │
              └── ExplodeDriver (Phase 5)
                    ├── 一次性 traverse 构建 target cache
                    │     cache key = `${nodeId}::${variantId}::${objectName}`
                    │     basePosition = [local.x, local.y, local.z]
                    ├── useFrame: effectiveProgress = (variantId===activeId ? progress : 0)
                    └── computeExplodedPosition({base, direction, distance, progress}) → position.set()
```

### Variant Identity 协议

```
每个克隆 scene 根节点:
  scene.userData.__variantIdentity = { variantId, variantIndex, label, title, src }

向上解析:
  resolveVariantIdentity(mesh) → 沿 parent 链查找 → VariantIdentity | null

Scoped key:
  makeScopedKey(variantId, objectName) → "variantId::objectName"
  parseScopedKey(key) → { variantId, objectName }
  只按第一个 "::" 拆分，objectName 可包含 "::"
```

### Explode 系统

```
状态:
  nodeStore.explodeProgress (0–1, clampExplodeProgress)
  nodeStore.activeExplodeVariantId (string | null)

作用域:
  A active → A=progress, B=0, C=0
  null    → 全部=0

复位:
  切换 variant → progress=0, active=新variant
  切换 node   → progress=0, active=null
  relatedNode → progress=0, active=null
  空白点击    → progress 不变

缓存:
  一次性 traverse (非 per-frame)
  目标: Mesh 直接子对象, 跳过 proxy/LineSegments/父Group
  父子规则: 父为 target → 跳过子 (父移则子随)

位置更新:
  绝对赋值: position.set(next), 非 "position += offset"
  公式: basePosition + normalizedDirection × safeDistance × localProgress
  0→1→0 精确归位 (无漂移)
```

---

## 5. Stores 总览

| Store | Key | 持久化 | 功能 |
|-------|-----|--------|------|
| `nodeStore` | — | 否 | 3D 悬停/选中/动画进度/联动开关 + **explodeProgress** + **activeExplodeVariantId** + `resetNodeInteractionState()` |
| `chatStore` | — | 否 | AI 对话消息/加载/错误 + DeepSeek API |
| `authStore` | — | 否 | 模拟用户登录/登出 |
| `analysisStore` | `construction-analysis` | ✅ localStorage | 访问节点/提问分类/交互次数 |

### nodeStore 完整字段

| 字段 | 类型 | Phase | 用途 |
|------|------|:--:|------|
| `selectedObject` | `string \| null` | 1 | mesh 选择 (多方案: `variantId::objectName`) |
| `hoveredObject` | `string \| null` | 1 | mesh hover |
| `selectedVariantId` | `string \| null` | 3 | 方案标签选中 |
| `hoveredVariantId` | `string \| null` | 3 | 方案标签 hover |
| `animationProgress` | `number` (0–1) | 1 | GLTF Animation 进度 (普通节点) |
| `isPlaying` | `boolean` | 1 | AnimationMixer 播放状态 |
| `explodeProgress` | `number` (0–1) | 5 | 程序化 Explode 进度 (多方案) |
| `activeExplodeVariantId` | `string \| null` | 5 | 当前 Explode active scope |
| `linkageEnabled` | `boolean` | 1 | 知识面板联动开关 |

---

## 6. 目录结构（src/）

```
src/
├── main.tsx
├── routes.tsx
├── index.css
├── NodeDetail.tsx                        # ⭐ 核心编排
│
├── components/
│   ├── AppLayout.tsx
│   ├── ErrorBoundary.tsx
│   ├── RouteSuspense.tsx
│   └── viewer/
│       ├── ModelViewer.tsx               # ⭐ 3D 视口 (~830行)
│       │   ├── SceneModel               # GLB加载+克隆+高亮+Picking+动画
│       │   ├── MultiModelGroup           # Phase 2-5: 多模型布局+Explode
│       │   ├── CameraTracker
│       │   ├── SceneLights
│       │   └── ShadowPlane
│       ├── animationController.ts         # GLTF Animation 单例控制器
│       ├── VariantLabelBar.tsx           # Phase 3: A/B/C 标签 UI
│       ├── ConstructionKnowledgePanel.tsx # Phase 4: 多方案知识面板
│       ├── NodeDiagramPanel.tsx
│       ├── MenuBackground.tsx
│       └── LoadingOverlay.tsx
│
├── pages/
│   ├── HomePage.tsx / CurriculumPage.tsx / SectionSubPage.tsx
│   ├── TextbookPage.tsx / LibraryPage.tsx / CasesPage.tsx
│   ├── DataAnalysis.tsx / AIPage.tsx / AIExtendPage.tsx
│   ├── ResourcesPage.tsx / GamesPage.tsx / PlaceholderPage.tsx
│
├── data/
│   ├── nodeDefinitions.ts                # ⭐ 单一配置源 (15节点)
│   ├── nodesIndex.ts
│   ├── courseModules.ts
│   ├── backgroundScenes.ts
│   ├── *_Layers.ts                       # 各节点层数据 (13个)
│   ├── *.ts                              # 详细课程数据
│   ├── sections/ (*.js)                  # 子章节
│   └── textbook/                         # MD 教材
│
├── utils/
│   ├── nameUtils.ts                      # canonicalName() + isHitboxName()
│   ├── resolveNodeModelSources.ts        # Phase 2: 节点→模型列表解析
│   ├── layoutModels.ts                   # Phase 2: 多模型排列纯函数
│   ├── variantIdentity.ts                # Phase 3: 身份协议+材质隔离+scoped key
│   ├── resolveComponentKnowledge.ts      # Phase 4: 多方案知识解析
│   └── explodeLayout.ts                  # Phase 5: Explode 纯函数
│
├── store/
│   ├── nodeStore.ts
│   ├── chatStore.ts
│   ├── authStore.ts
│   └── analysisStore.ts
│
└── assets/
```

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
| `/resources` | ResourcesPage | 直接 | 拓展链接 |
| `/data` | DataAnalysis | lazy | 学习数据 |
| `/ai` | AIPage | lazy | AI 问答 |
| `/ai-extend` | AIExtendPage | lazy | AI+拓展合并 |
| `/games` | GamesPage | lazy | 作业训练 |

---

## 8. 节点清单

### 普通节点 (12)

| ID | 标题 | 分类 | modelScale | 层数 | 动画 |
|----|------|------|:--:|:--:|:--:|
| `flat-roof-01` | 平屋面构造 | 屋顶 | 2.5 | 8 | GLTF Animation |
| `sloped-roof-01` | 坡屋顶构造 | 屋顶 | 2.5 | 9 | GLTF Animation |
| `roof-drainage-01` | 无组织排水 | 屋顶 | 2.5 | 3 | GLTF Animation |
| `organized-drainage-01` | 有组织排水 | 屋顶 | 2.5 | 4 | GLTF Animation |
| `eaves-gutter-01` | 檐沟外排水 | 屋顶 | 2 | 6 | GLTF Animation |
| `construction-column-01` | 构造柱 | 墙体 | 4 | 7 | GLTF Animation |
| `apron-flashing-01` | 细石混凝土散水 | 墙体 | 2 | 9 | GLTF Animation |
| `stone-apron-01` | 块石散水 | 墙体 | 2 | 9 | GLTF Animation |
| `foam-insulation-01` | 泡沫塑料保温板 | 墙体 | 2 | 7 | noAnimation |
| `rockwool-insulation-01` | 岩棉防火保温板 | 墙体 | 2 | 7 | noAnimation |
| `faced-plinth-01` | 贴面勒脚 | 墙体 | 2 | 5 | noAnimation |
| `stone-plinth-01` | 石砌勒脚 | 墙体 | 2 | 4 | noAnimation |
| `plaster-plinth-01` | 抹灰勒脚 | 墙体 | 2 | 5 | noAnimation |
| `rc-elevated-steps-01` | 钢筋混凝土架空台阶 | 楼梯 | 2 | 7 | — |
| `stair-composition-01` | 楼梯的组成 | 楼梯 | 3.5 | 6 | noAnimation |
| `concrete-steps-01` | 混凝土台阶 | 楼梯 | 2 | 5 | GLTF Animation |

### 多方案节点 (1)

| ID | 标题 | 方案 | GLB |
|----|------|------|-----|
| `wall-damp-proof-course` | 墙身防潮层的位置 | A: 密实材料垫层 | `wall-damp-proof/地面垫层为密实材料.glb` (111KB) |
| | | B: 透水材料垫层 | `wall-damp-proof/地面垫层为透水材料.glb` (131KB) |
| | | C: 室内外地面有高差 | `wall-damp-proof/室内地面有高差.glb` (116KB) |

每个方案含 explode 配置 (3 目标/方案)、componentKnowledge (2 知识条目/方案)、label/title/description。

### 案例节点 (3, development)

| ID | 标题 |
|----|------|
| `yuncheng-c-01` | 郓城案例 01 |
| `yuncheng-c-02` | 郓城案例 02 |
| `yuncheng-c-03` | 郓城案例 03 |

---

## 9. 设计系统

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

---

## 10. 完成状态

### Phase 1 — 基线 ✅
- 三栏布局 + GLB + 动画 + 高亮 + Picking + 材质隔离
- CameraTracker + 边缘线 + PCF阴影 + 联动开关
- 14 节点 + 单一配置源 + 名称标准化

### Phase 2 — 多模型同屏 ✅ (commit `e494ca5`)
- 同一 Canvas 支持 1~3 个 GLB
- MultiModelGroup 水平排列
- `resolveNodeModelSources` 数据解析
- 18 纯逻辑测试

### Phase 3 — 方案身份与标签 ✅
- VariantLabelBar A/B/C 标签 + 双向同步
- Variant identity 协议 (userData)
- Scoped key: `variantId::objectName`
- `cloneSceneWithMaterials` 材质隔离 + `disposeClonedMaterials` 生命周期
- StrictMode 安全的 WeakMap 清理
- 110 测试基线

### Phase 4 — 构件知识联动 V1 ✅
- `resolveComponentKnowledge` 多方案知识解析
- `VariantComponentKnowledge` 类型: 图片/表格/关联节点
- ConstructionKnowledgePanel 四态渲染
- 同名 mesh 跨 variant 隔离 (协议级)
- 142 测试基线

### Phase 5 — 程序化 Explode V1 ✅
- `nodeStore.explodeProgress + activeExplodeVariantId`
- A/B/C 各 3 目标 Explode 配置
- Pure functions: clamp, localProgress, position, resolve
- useFrame 绝对位置赋值 + active scope 隔离
- Cache key: `nodeId::variantId::objectName`
- 父子规则: 保留配置祖先、跳过配置后代
- 普通节点 GLTF Animation 独立
- **276 测试基线** (142 + 69 explodeLayout + 65 explodeRuntime)

### 待完成

| 功能 | 优先级 |
|------|--------|
| Section 剖切 | 中 |
| 多方案 Explode 自动播放/惯性动画 | 低 |
| 拖拽组装游戏 | 中 |
| 郓城案例模型迁移 | 低 |
| 课本内容填充 | 中 |

---

## 11. 测试基础设施

```
npm test:
  npx tsx tests/resolveNodeModelSources.test.ts  (142 asserts)
  npx tsx tests/explodeLayout.test.ts             (69 asserts)
  npx tsx tests/explodeRuntime.test.ts            (65 asserts)
  ─────────────────────────────────────────────────────
  总计: 276

浏览器验收:
  DEV_URL=http://localhost:xxxx node tests/acceptance.mjs
  → variant-multi ×5, normal-column ×3, normal-flat-roof ×3, route-switch ×10
```

## 12. 开发命令

```bash
npm run dev              # localhost:5173
npm test                 # 276 纯逻辑测试
npm run build            # 生产构建
npm run lint             # ESLint
npx tsc --noEmit         # 类型检查
npm run compress-models  # 压缩 GLB
npm run deploy           # gh-pages 部署
```

## 13. 添加新节点（3 步）

1. **准备文件**: `public/models/{类别}/{节点名}/` + 剖面图 + `src/data/{节点名}Layers.ts`
2. **注册节点**: `nodeDefinitions.ts` 添加 `NodeDefinition`
3. **多方案节点**: 设置 `presentationMode: "variants"` + `variants[]` (含 model/explode/componentKnowledge)

---

## 14. Git 历史（关键 commit）

| Commit | 说明 |
|------|------|
| `e706b64` | Phase 1 基线 |
| `52f2028` | Phase 1 封板 |
| `e494ca5` | Phase 2 封板: multi-model variant presentation |
| `...` | Phase 3–5 (待封板) |

---

_最后更新：2026-07-27_
