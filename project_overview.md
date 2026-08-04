# 建筑构造交互教材 — 项目全景文档

## 1. 项目定位

**建筑构造交互系统**（Building Construction Interactive System）是面向建筑学教育的开源 Web 应用。通过 **三维可视化、多方案对比、程序化爆炸、剖面裁切、构件锁定、交互式构件探索、结构化课程体系**，帮助学生和从业者直观理解建筑构造的空间逻辑。

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
| 状态 | Zustand 5 | 全局状态 |
| 图标 | lucide-react | UI 图标 |
| AI | DeepSeek API (chat/completions) | AI 建筑学助教问答 |
| 压缩 | @gltf-transform/cli (WebP + Draco) | 模型纹理压缩 + 几何压缩 |
| 测试 | tsx + Playwright | 纯逻辑单测 + Headless 浏览器验收 |

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

### NodeDetail 内部架构（核心页面）

```
NodeDetail.tsx (编排器)
  ├── 统一配置读取: getNodeDefinition(nodeId)             ← ⭐ 单一配置源
  │     ├── node.model / presentationMode / variants
  │     ├── resolveNodeModelSources(node) → 1~3 model entries
  │     ├── resolveVariantExplodeConfig()  → Phase 5 explode 配置
  │     └── node.status → "available" | "development"
  ├── Header (面包屑)
  ├── VariantLabelBar (多方案节点) ← A/B/C 标签栏
  ├── Body (三栏 flex)
  │   ├── NodeDiagramPanel           ← 剖面图
  │   ├── ErrorBoundary (resetKey=nodeId)
  │   │   └── ModelViewer (~1250行)  ← 3D 视口 ⭐
  │   │   │   ├── SceneModel × 1~3   ← GLB + 材质克隆 + 高亮 + Picking + variant identity
  │   │   │   ├── MultiModelGroup    ← 5 层旋转层级 + 多模型布局 + Explode
  │   │   │   ├── CameraTracker      ← 一次性相机适配 + target + 距离拟合
  │   │   │   ├── SceneLights        ← 动态方向光 + 阴影相机自适应
  │   │   │   ├── ShadowPlane        ← 动态阴影接收平面
  │   │   │   ├── SectionRuntime     ← Phase 6 Step 2: clippingPlanes 裁切
  │   │   │   └── CameraLockRuntime  ← Phase 6 Step 3: 相机锁定构件
  │   └── ConstructionKnowledgePanel ← 多方案知识面板
  ├── SectionControls                ← 剖面裁切 UI 控件
  ├── CameraLockControls             ← 相机锁定 UI 按钮
  └── Floating Timeline (居中浮动)
        ├── 收起/播放爆炸 (多方案禁用)
        ├── 滑块: explodeProgress (多方案) / animationProgress (普通)
        ├── 旋转切换 + 阴影切换 + 联动开关
```

---

## 4. 多方案系统 — 5 层旋转层级

### 完整层级（MultiModelGroup）

```
MultiModelGroup (groupRef, 单位变换)
├── VariantLayoutRoot A       # position.x = fixedLayoutX — 固定排列位置
│   └── VariantRotationPivot A   # rotation.y = self-rotation — 独立自转
│       └── VariantDisplayScale A # scale = sharedDisplayScale — 统一比例
│           └── VariantCenterOffset A # position = -canonicalCenter — 几何中心校正
│               └── SceneModel A     # scale=1, position=0 — 原始 GLB (skipAutoLayout)
├── VariantLayoutRoot B       # (同上结构)
└── VariantLayoutRoot C       # (同上结构)
```

**关键数学不变量**：几何中心 C 经过 `CenterOffset(-C)` → (0,0,0)，经过 `DisplayScale(S)` → S×(0,0,0) = (0,0,0) **对任意 S 成立**。改变 DisplayScale 永远不会移动旋转中心。

### 布局算法

1. 重置所有模型到 scale=1，计算仅可见 Mesh 的 canonical 包围盒（排除 proxy、LineSegments）
2. 计算 **单一** `sharedDisplayScale = TARGET_DISPLAY_HEIGHT / maxCanonicalHeight`（所有模型共用，保留真实体量差异）
3. 分别设置 `DisplayScale.scale = sharedDisplayScale`、`CenterOffset.position = -canonicalCenter`
4. 计算 layoutX：`cursorX += scaledWidth + gap`，整体居中
5. 计算静态联合包围盒（rotation envelope — 覆盖 360° Y 轴旋转）
6. 相机一次性适配整组：`controls.target = unionCenter`，`camera.position` 按 FOV 拟合距离

### 布局常量

| 常量 | 值 | 说明 |
|------|------|------|
| `EDGE_GAP_RATIO` | 0.38 | 间距 = 平均显示宽度 × 38% |
| `EDGE_GAP_MIN` | 0.28 | 最小间距 |
| `EDGE_GAP_MAX` | 1.00 | 最大间距 |
| `AUTO_ROTATE_SPEED` | 0.12 rad/s | 约 52 秒/周，delta 驱动 + euclideanModulo 防溢出 |
| `TARGET_DISPLAY_HEIGHT` | 3.0 | 最高模型的目标显示高度（fov=40, camera z≈8） |

### 调用链

```
NodeDetail
  ├── resolveNodeModelSources(node) → [{id, src, scale, label, title} × 1~3]
  ├── resolveVariantExplodeConfig({node, variantId}) → ResolvedVariantExplodeConfig
  │
  └── ModelViewer (modelPaths? / modelPath)
        ├── Single-model path: SceneModel ×1 (GLTF Animation, backward compat)
        │
        └── Multi-model path: MultiModelGroup
              ├── SceneModel ×N (noAnimation, noGlobalRef, skipAutoLayout)
              │     ├── cloneSceneWithMaterials(sourceScene)  ← 材质隔离
              │     ├── writeVariantIdentity(scene, identity)   ← Phase 3
              │     ├── meshMapRef per-instance
              │     └── Picking: scoped key `${variantId}::${objectName}`
              │
              ├── layoutModels() → 5 层层级应用 + 布局
              │
              ├── Self-rotation useFrame: pivot.rotation.y += dt × AUTO_ROTATE_SPEED
              │
              └── Explode driver (Phase 5)
                    ├── 一次性 traverse 构建 target cache
                    ├── useFrame(priority=-100): effectiveProgress = scope 隔离
                    └── computeExplodedPosition() → position.set()
```

### Variant Identity 协议

```
每个克隆 scene 根节点:
  scene.userData.__variantIdentity = { variantId, variantIndex, label, title, src }

Scoped key:
  makeScopedKey(variantId, objectName) → "variantId::objectName"
  parseScopedKey(key) → { variantId, objectName }
```

---

## 5. 功能系统

### Explode 系统（Phase 5）

| 字段 | 说明 |
|------|------|
| `nodeStore.explodeProgress` | 0–1，clampExplodeProgress |
| `nodeStore.activeExplodeVariantId` | 当前 active scope |
| 作用域规则 | A active → A=progress, B=0, C=0；null → 全部=0 |
| 位置更新 | 绝对赋值 `position.set(next)`，非增量 |
| 公式 | `basePosition + direction × distance × localProgress` |
| Cache key | `nodeId::variantId::objectName` |

### 剖面裁切 Section V1（Phase 6 Step 2）

```
状态:
  nodeStore.sectionEnabled / sectionAxis ("x"|"y"|"z") / sectionOffset / sectionInvert

实现:
  SectionRuntime: 管理 clippingPlanes → unbindAll/bindAll per material
  sectionMath.ts: 纯函数 — getSectionNormal, clampSectionOffset, 
    resolveSectionPlaneConstant, isPointVisible, isObjectCompletelyClipped (8 角点检测)

关键行为:
  - gl.localClippingEnabled 管理（保存/恢复先前值）
  - ShadowPlane + SceneLights 阴影相机动态适配
  - 裁切面 Picking 过滤（isIntersectionVisible）
  - 全部裁切时 Camera Lock 自动退出
```

### 相机锁定 Camera Lock V1（Phase 6 Step 3）

```
状态:
  nodeStore.cameraLockEnabled / cameraLockTargetKey

实现:
  CameraLockRuntime: useFrame(priority=-90), dirtyRef, queueMicrotask unlock
  CameraLockControls: UI 按钮（Crosshair 图标）
  modelSceneRef: Object3D 注册表 + CameraTracker pause gate

协议:
  - Lock → controls.target = 构件世界中心（一次性 copy，非 lerp）
  - Explode 进度变化 → dirtyRef → 下一帧更新 target
  - Section 完全裁切 → queueMicrotask 验证 → 自动 unlock
  - Escape → unlock + clear selectedObject
  - Variant/node 切换 → resetCameraLock + resumeCameraTracker
```

---

## 6. Stores 总览

| Store | 持久化 | 功能 |
|-------|:--:|------|
| `nodeStore` | 否 | 3D 选择/悬停/动画/爆炸/剖面/相机锁/联动 |
| `chatStore` | 否 | AI 对话消息/加载/错误 + DeepSeek API |
| `authStore` | 否 | 模拟用户登录/登出 |
| `analysisStore` | localStorage | 访问节点/提问分类/交互次数 |

### nodeStore 完整字段

| 字段 | 类型 | Phase | 用途 |
|------|------|:--:|------|
| `selectedObject` | `string \| null` | 1 | mesh 选择 (scoped key) |
| `hoveredObject` | `string \| null` | 1 | mesh hover |
| `selectedVariantId` | `string \| null` | 3 | 方案标签选中 |
| `hoveredVariantId` | `string \| null` | 3 | 方案标签 hover |
| `animationProgress` | `number` (0–1) | 1 | GLTF Animation 进度 |
| `isPlaying` | `boolean` | 1 | AnimationMixer 播放状态 |
| `explodeProgress` | `number` (0–1) | 5 | 程序化 Explode 进度 |
| `activeExplodeVariantId` | `string \| null` | 5 | Explode active scope |
| `linkageEnabled` | `boolean` | 1 | 知识面板联动开关 |
| `sectionEnabled` | `boolean` | 6.2 | 剖面裁切开关 |
| `sectionAxis` | `"x" \| "y" \| "z"` | 6.2 | 裁切轴 |
| `sectionOffset` | `number` | 6.2 | 裁切位置 (clamped) |
| `sectionInvert` | `boolean` | 6.2 | 裁切方向反转 |
| `cameraLockEnabled` | `boolean` | 6.3 | 相机锁定开关 |
| `cameraLockTargetKey` | `string \| null` | 6.3 | 锁定目标 scoped key |

关键 action：
- `selectVariant(variantId, keepObject?)` — 原子设置 scheme 选择 + explode scope + 重置 section + cameraLock
- `resetNodeInteractionState()` — 全量复位（node 切换时调用）

---

## 7. 目录结构（src/）

```
src/
├── main.tsx
├── routes.tsx
├── NodeDetail.tsx                        # ⭐ 核心编排
│
├── components/
│   ├── AppLayout.tsx / ErrorBoundary.tsx / RouteSuspense.tsx
│   └── viewer/
│       ├── ModelViewer.tsx               # ⭐ 3D 视口 (~1250行)
│       │   ├── SceneModel               # GLB加载+克隆+高亮+Picking+动画
│       │   ├── MultiModelGroup           # 5层旋转层级+布局+Explode
│       │   ├── CameraTracker            # 一次性相机适配(含距离拟合)
│       │   ├── SceneLights              # 动态方向光+阴影相机
│       │   └── ShadowPlane              # 动态阴影接收平面
│       ├── animationController.ts        # GLTF Animation 单例控制器
│       ├── VariantLabelBar.tsx           # A/B/C 标签 UI
│       ├── ConstructionKnowledgePanel.tsx # 多方案知识面板
│       ├── NodeDiagramPanel.tsx
│       ├── MenuBackground.tsx
│       ├── LoadingOverlay.tsx
│       ├── SectionRuntime.tsx            # Phase 6.2: clippingPlanes
│       ├── SectionControls.tsx           # Phase 6.2: 裁切 UI
│       ├── CameraLockRuntime.tsx         # Phase 6.3: 相机锁定运行时
│       ├── CameraLockControls.tsx        # Phase 6.3: 锁定按钮
│       └── variants/                     # 多方案组件
│
├── pages/
│   ├── HomePage.tsx / CurriculumPage.tsx / SectionSubPage.tsx
│   ├── TextbookPage.tsx / LibraryPage.tsx / CasesPage.tsx
│   ├── DataAnalysis.tsx / AIPage.tsx / AIExtendPage.tsx
│   ├── ResourcesPage.tsx / GamesPage.tsx / PlaceholderPage.tsx
│
├── data/
│   ├── nodeDefinitions.ts                # ⭐ 单一配置源
│   ├── nodesIndex.ts / nodes.ts / courseModules.ts
│   ├── *_Layers.ts                       # 各节点层数据
│   └── sections/ (*.js)                  # 子章节
│
├── utils/
│   ├── nameUtils.ts                      # canonicalName() + isHitboxName()
│   ├── resolveNodeModelSources.ts        # 节点→模型列表解析
│   ├── layoutModels.ts                   # 多模型排列纯函数
│   ├── variantIdentity.ts                # 身份协议+材质克隆+scoped key
│   ├── resolveComponentKnowledge.ts      # 多方案知识解析
│   ├── explodeLayout.ts                  # Explode 纯函数
│   ├── modelSceneRef.ts                  # 模型场景全局引用+Object3D注册表+CameraTracker gate
│   └── sectionMath.ts                    # 剖面裁切纯函数
│
├── store/
│   ├── nodeStore.ts / chatStore.ts / authStore.ts / analysisStore.ts
│
└── assets/
```

---

## 8. 路由表

| 路由 | 页面 | 加载 | 说明 |
|------|------|:--:|------|
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

## 9. 节点清单

### 多方案节点

| ID | 标题 | 方案 | GLB |
|----|------|------|-----|
| `wall-damp-proof-course` | 墙身防潮层的位置 | A: 密实材料垫层 | `damp-proof-a-v2.glb` |
| | | B: 透水材料垫层 | `damp-proof-b-v2.glb` |
| | | C: 室内外地面有高差 | `damp-proof-c-v2.glb` |

每个方案含 explode 配置、componentKnowledge、统一 `scale: 2`。

### 普通节点 (部分)

| ID | 标题 | 分类 | 动画 |
|----|------|------|:--:|
| `flat-roof-01` | 平屋面构造 | 屋顶 | GLTF Animation |
| `sloped-roof-01` | 坡屋顶构造 | 屋顶 | GLTF Animation |
| `roof-drainage-01` | 无组织排水 | 屋顶 | GLTF Animation |
| `organized-drainage-01` | 有组织排水 | 屋顶 | GLTF Animation |
| `construction-column-01` | 构造柱 | 墙体 | GLTF Animation |
| `apron-flashing-01` | 细石混凝土散水 | 墙体 | GLTF Animation |
| `faced-plinth-01` | 贴面勒脚 | 墙体 | noAnimation |
| `stone-plinth-01` | 石砌勒脚 | 墙体 | noAnimation |
| … | … | … | … |

---

## 10. 设计系统

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

## 11. 完成状态

### Phase 1 — 基线 ✅
- 三栏布局 + GLB + 动画 + 高亮 + Picking + 材质隔离
- CameraTracker + 边缘线 + PCF阴影 + 联动开关

### Phase 2 — 多模型同屏 ✅ (`e494ca5`)
- 同一 Canvas 支持 1~3 个 GLB
- `resolveNodeModelSources` 数据解析

### Phase 3 — 方案身份与标签 ✅
- VariantLabelBar A/B/C 标签 + scoped key
- `cloneSceneWithMaterials` 材质隔离

### Phase 4 — 构件知识联动 V1 ✅
- `resolveComponentKnowledge` + ConstructionKnowledgePanel 四态渲染

### Phase 5 — 程序化 Explode V1 ✅
- `explodeProgress + activeExplodeVariantId` + useFrame 驱动

### Phase 6 Step 1 — 视图运行时审计 ✅

### Phase 6 Step 2 — 剖面裁切 V1 ✅
- clippingPlanes + SectionRuntime + sectionMath.ts
- activeExplodeVariantId sync bug fix
- ShadowPlane/SceneLights 动态适配

### Phase 6 Step 3 — 相机锁定 V1 ✅
- CameraLockRuntime + Controls + Object3D 注册表
- CameraTracker pause gate + Escape 协议

### Phase 6 — 旋转中心修复 ✅
- 5 层旋转层级（DisplayScale + CenterOffset 分离）
- 独立自转（pivot.rotation.y，euclideanModulo）
- 中心校正数学不变量验证

### Phase 6 — 比例一致性修复 ✅
- 单⼀ sharedDisplayScale（替代每模型独立高度归一化）
- 相机距离拟合（FOV 自适应整组包围盒）

---

## 12. 约束与规范

- 禁止修改 GLB 几何体
- 禁止新增 Canvas 或 OrbitControls
- 禁止每帧 `scene.traverse`
- 禁止在 `useFrame` 中调用 Zustand action
- Camera Lock 禁止写 `camera.position`
- 仅使用等比缩放（`setScalar`），禁止非均匀缩放
- 多方案节点使用单一 `sharedDisplayScale`，禁止每模型独立归一化

---

## 13. 测试基础设施

```
npm test:
  npx tsx tests/resolveNodeModelSources.test.ts
  npx tsx tests/explodeLayout.test.ts
  npx tsx tests/explodeRuntime.test.ts
  npx tsx tests/phase6-step2.test.ts
  npx tsx tests/phase6-step3.test.ts
  npx tsx tests/phase6-multi-model-rotation.test.ts  ← 新增 (旋转中心+比例一致性)
```

纯逻辑测试，使用自定义 `assert`/`assertApprox` 函数。

---

## 14. 开发命令

```bash
npm run dev              # localhost:5173
npm test                 # 全量测试
npm run build            # tsc + vite build
npm run lint             # ESLint
npx tsc --noEmit         # 仅类型检查
npm run compress-models  # 压缩 GLB
npm run deploy           # gh-pages 部署
```

---

## 15. 添加新多方案节点

1. **准备 GLB 文件**: `public/models/{类别}/{节点名}/` 下放置 `*-a-v2.glb`、`*-b-v2.glb`、`*-c-v2.glb`
2. **注册节点**: `nodeDefinitions.ts` 添加 `NodeDefinition`，设置 `presentationMode: "variants"`
3. **配置 variants[]**: 每个方案含 `id`、`label`、`model.path`、`model.scale`（统一值）、`components`、`explode` 配置、`componentKnowledge`
4. **准备图层数据**: 创建 `src/data/{节点名}Layers.ts`

---

_最后更新：2026-07-30_
