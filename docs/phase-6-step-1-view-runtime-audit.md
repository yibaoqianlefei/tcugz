# 第六阶段第一步：Camera / Section / Controls 统一视图控制系统接入审计

> 状态: 审计完成  
> 日期: 2026-07-27  
> 基线: Phase 5 V1 (`explodeProgress + activeExplodeVariantId`), 276 tests

---

## 1. 执行摘要

全项目无 Section（clippingPlanes）实现。相机由 R3F Canvas 默认创建（`fov:40, near:0.5, far:50, position:[0,0,8]`），OrbitControls 由 Drei 声明式组件实例化并通过模块级 `_controls` ref 暴露。只有一个 Canvas（NodeDetail 3D 视口；首页 MenuBackground 使用独立 Canvas，不在本次审计范围）。相机写入者仅 2 处（CameraTracker useFrame + SceneModel 视口缩放 useFrame），均通过 lerp 操作 `controls.target`，不直接写 `camera.position`。

**关键发现：无 Section 实现，可直接从零接入。**

---

## 2. 真实文件与组件关系

```
NodeDetail.tsx
  └── ModelViewer.tsx (830行)
        ├── Canvas（R3F，camera={…} 自动创建 PerspectiveCamera）
        │     ├── RendererSetup（gl.shadowMap/toneMapping）
        │     ├── SceneLights + ShadowPlane
        │     ├── SceneModel ×N（单模型或经由 MultiModelGroup）
        │     │     ├── cloneSceneWithMaterials → 独立 scene
        │     │     ├── writeVariantIdentity → userData
        │     │     ├── meshMapRef + materialHighlightStateRef
        │     │     └── useFrame ×2: 视口缩放 + mixer 更新
        │     ├── MultiModelGroup（多方案）
        │     │     ├── layoutModels → computeMultiModelLayout
        │     │     ├── explodeTargetRef（9 targets）
        │     │     └── useFrame: explode 位置更新
        │     ├── OrbitControls（Drei）
        │     │     ref → _controls（模块级）
        │     ├── CameraTracker
        │     │     useEffect: setTimeout(80ms) → fit
        │     │     useFrame: lerp controls.target
        │     └── onPointerMissed → 清除 selectedObject + selectedVariantId
```

---

## 3. Camera 写入者清单

| # | 文件:位置 | 写入对象 | 触发时机 | 目的 | 冲突风险 |
|---|----------|------|------|------|:--:|
| 1 | `ModelViewer.tsx:829` | `camera.position` | Canvas 创建时一次性 | 初始位置 `[0,0,8]` + fov=40 | 否 |
| 2 | `ModelViewer.tsx:562` (CameraTracker useEffect) | `controls.target` | 模型加载后 80ms | 一次性 fit 包围盒中心 | 否 |
| 3 | `ModelViewer.tsx:568-577` (CameraTracker useFrame) | `controls.target` | 每帧 (damping=0.08) | lerp 到当前 `_modelScene` 中心 | **潜在**: 与 Section/Camera Lock 共享 target |
| 4 | `ModelViewer.tsx:292` (SceneModel useFrame) | `controls.target` | 每帧（视口缩放时） | lerp 到 `_modelScene` 中心 | **潜在**: 同 Camera Lock 竞争 |
| 5 | OrbitControls (Drei 内部) | `camera.position` / `controls.target` | 用户拖拽时 | 旋转/平移/缩放 | 否 (由 _isUserDragging 门控) |
| 6 | `MenuBackground.tsx:205-225` | `camera.position` / `controls.target` | 每帧 (独立 Canvas) | 首页 3D 背景平移 | 否 (独立 Canvas) |

**结论:**
- `camera.position` 直接写入仅 Canvas 初始化和 Drei OrbitControls（用户拖拽时）
- `controls.target` 写入者最多：CameraTracker useFrame + SceneModel useFrame + Drei 内部
- CameraTracker 和 SceneModel 的 controls.target 写入均使用 lerp（非直接赋值），damping 期间持续写入
- Drei OrbitControls 通过 `enableDamping dampingFactor={0.08}` 也在 damping 期间持续写 camera.position

---

## 4. Controls 写入者清单

| # | 写入者 | controls 类型 | 实例持有者 | target 初始值 |
|---|-------|-------------|----------|------|
| 1 | `ModelViewer.tsx:848` | `OrbitControls` (Drei) | `_controls`（模块级） | 由 Drei/CameraTracker 首次 fit 后确定 |
| 2 | `CameraTracker (useEffect + useFrame)` | — | 通过 `_controls` 访问 | 模型 Box3 中心 |
| 3 | `SceneModel useFrame (viewport scale)` | — | 通过 `_controls` 访问 | — |

**OrbitControls 配置:**
```typescript
autoRotate={autoRotate}        // React state (true/false)
autoRotateSpeed={0.6}
enableDamping dampingFactor={0.08}
minDistance={1} maxDistance={40}
maxPolarAngle={Math.PI / 2.2}  // 限制垂直角度
enablePan
onStart={handleControlsStart}  // → _isUserDragging = true
onEnd={handleControlsEnd}      // → _isUserDragging = false
```

---

## 5. Section 现状

**当前项目没有可复用的正式 Section 运行时实现。**

全项目搜索确认：
- `clippingPlanes`: 0 matches
- `clippingPlane`: 0 matches
- `localClippingEnabled`: 0 matches
- `PlaneHelper`: 0 matches
- `renderer.localClippingEnabled`: 0 references（R3F 默认该值为 false）
- 剖切 UI: 不存在
- 剖切 Zustand 状态: 不存在
- 旧版剖切实验代码: 不存在
- `variants/` 目录（冻结）: 无 Section 相关代码

---

## 6. Picking / Highlight / Knowledge / Explode 链路

### 当前完整链路

```
Pointer Event (R3F onPointerOver/Out/Click)
  → Raycaster（Three.js 内建，使用移动后的 world matrix）
  → findNamedMesh(obj) → resolveName → logicalName
  → scoped key = makeScopedKey(variantId, objectName)
  → [多方案] "dense-base::地面垫层为密实材料001"
  → [单模型] "40厚细石混凝土毛面"
  → setHoveredObject / setSelectedObject → nodeStore
  → ConstructionKnowledgePanel
      → parseScopedKey → objectName
      → resolveComponentKnowledge({node, selectedObject, selectedVariantId})
      → VariantComponentKnowledge | null
```

### 关键确认

| 问题 | 答案 | 证据 |
|------|------|------|
| Picking 命中真实 Mesh 还是 proxy？ | 命中真实 Mesh（proxy 被 R3F 命中，但其 `raycast=()=>{}` 使自身不接收点击）。爆炸后 Mesh 移动，其 proxy 子对象跟随移动 | `ModelViewer.tsx:168-174` |
| 爆炸移动的是哪个 Object3D？ | 直接 Mesh 本身（`target.object.position.set`） | `ModelViewer.tsx:744` |
| Raycaster 是否使用移动后的世界矩阵？ | 是。Three.js R3F 自动使用 Object3D 当前 world matrix（position 更新后自动反映） | 无手动矩阵同步 |
| 高亮修改原材质还是克隆材质？ | 克隆材质（`cloneSceneWithMaterials` 已隔离）。高亮通过 `restoreMaterial` + emissive/color 修改 | `ModelViewer.tsx:325-363` |
| 多 Mesh 共享材质时是否串亮？ | 否。材质已隔离（`cloneSceneWithMaterials` 每 mesh 独立克隆材质） | `variantIdentity.ts:108-124` |
| 清空选择时如何恢复材质？ | `setGroupHighlight(name, "clear")` → `restoreMaterial` → WeakMap 恢复原始 color/emissive | `ModelViewer.tsx:410-418` |
| 剖切后被裁掉区域是否仍可能被 Raycaster 命中？ | **尚未实现 Section，无此问题。** 第六阶段接入后需确认：Raycaster 无视 clippingPlanes（GPU 裁剪），被裁掉区域的 mesh 仍会被射线命中 |

---

## 7. Explode 兼容性审计

### 与 Camera / Controls 的关系

| 方面 | 状态 | 说明 |
|------|:--:|------|
| Explode 修改 camera？ | 否 | 仅修改 target Mesh 的 `position` |
| Explode 修改 controls.target？ | 否 | CameraTracker 自动通过 `_modelScene`（组合 Group）更新 target |
| 爆炸后 Camera Lock 如何获取世界坐标？ | `object.getWorldPosition(tmpVec3)` | 读取实时更新的 world position |
| 是否需要复用 Explode target cache？ | **建议是** | `explodeTargetRef` 已按 `nodeId::variantId::objectName` 缓存目标引用 |
| 是否可复用该引用表提供 Object3D 查找？ | **可以** | 扩展到 Camera Lock 引用表 |

### activeExplodeVariantId 同步问题

**发现:** `VariantLabelBar.tsx` 的 onClick 仅设置 `selectedVariantId` 和 `selectedObject`，**未设置 `activeExplodeVariantId`**。这导致标签点击不激活 Explode。`activeExplodeVariantId` 从未被任何组件设置（仅有 store action `setActiveExplodeVariantId` 定义）。

**影响:** 用户点击标签后滑块虽未 disabled，但 `activeExplodeVariantId` 为 null → useFrame 中 `effectiveProgress=0` → 无爆炸位移。

**建议第六阶段第二步修复。** 不阻塞本步审计。

---

## 8. GLTF Animation 兼容性

### 普通节点动画链路

```
useGLTF → {scene, animations}
  → new AnimationMixer(scene)
  → mixer.clipAction(clip)
  → registerAnimationActions(actions)
  → animControls.play/playReverse/pause/setTime
  → useFrame: mixer.update(delta) + 边界检测
```

| 问题 | 答案 |
|------|------|
| 动画是否修改与 Explode 相同对象的 position？ | **是。** GLTF Animation 通过 keyframe 修改 `Object3D.position` |
| 如果同时修改，会产生什么冲突？ | 若同一对象同时接入 GLTF Animation 和程序化 Explode → 两套 useFrame 竞争写入同一 `position` |
| 当前普通动画节点是否启用程序化 Explode？ | **否。** `isMultiModel ? explodeProgress : animationProgress` 完全分离 |
| Camera Lock 是否应读取动画后的实时 world position？ | 是。`getWorldPosition()` 自动反映动画 keyframe 后的位置 |
| Section 是否天然兼容动画 Mesh？ | 是。clippingPlanes 作用于 shader，对动画/非动画 Mesh 均等 |
| 动画是否需要每帧更新剖切面？ | **否。** 静态剖切面（plane constant 不变）不需要每帧更新 |
| V1 是否应暂不支持"持续跟随动画构件"？ | **是。** V1 建议 Camera Lock 执行一次平滑聚焦，固定到计算结果 |

---

## 9. 状态所有权矩阵

| 状态/对象 | 数据类型 | 唯一所有者 | 写入入口 | 消费者 | node切换 | variant切换 | 空白点击 | Escape | relatedNode |
|---|---|---|---|---|---|---|---|---|---|
| `camera.position` | `THREE.Vector3` | Drei OrbitControls (内部) | — (由 Drei 管理) | Canvas | — | — | — | — | — |
| `controls.target` | `THREE.Vector3` | CameraTracker (lerp) | `CameraTracker.useFrame` | OrbitControls | reset | reset | 保留 | 保留 | reset |
| `_controls` ref | `OrbitControlsImpl \| null` | 模块级变量 | `OrbitControls ref` 回调 | CameraTracker, SceneModel | — | — | — | — | — |
| `_modelScene` ref | `THREE.Group \| null` | 模块级变量 | SceneModel/MultiModelGroup | CameraTracker | null | 重赋值 | 保留 | 保留 | null |
| `_isUserDragging` | `boolean` | 模块级变量 | `onStart/onEnd` | CameraTracker | false | false | — | — | false |
| `selectedObject` | `string \| null` | `nodeStore` | Picking/标签/面板 | Highlight, Knowledge | null | null | null | null | null |
| `selectedVariantId` | `string \| null` | `nodeStore` | VariantLabelBar | Highlight, Knowledge | null | 新variant | null | null | null |
| `explodeProgress` | `number` (0–1) | `nodeStore` | slider onChange | ExplodeDriver.useFrame | 0 | 0 | **保留** | **保留** | 0 |
| `activeExplodeVariantId` | `string \| null` | `nodeStore` | (待接入 VariantLabelBar) | ExplodeDriver.useFrame | null | 新variant | **保留** | **保留** | null |
| `sectionEnabled` | `boolean` | `nodeStore` (待建) | Section UI | SectionRuntime | false | false | **保留** | **保留** | false |
| `sectionAxis` | `"x" \| "y" \| "z"` | `nodeStore` (待建) | Section UI | SectionRuntime | "y" | "y" | **保留** | **保留** | "y" |
| `sectionOffset` | `number` (0–1) | `nodeStore` (待建) | Section UI | SectionRuntime | 0.5 | 0.5 | **保留** | **保留** | 0.5 |
| `sectionInvert` | `boolean` | `nodeStore` (待建) | Section UI | SectionRuntime | false | false | **保留** | **保留** | false |
| `cameraLockStatus` | `"idle" \| "focusing" \| "locked"` | `nodeStore` (待建) | CameraLockRuntime | CameraLockRuntime | "idle" | "idle" | "idle" | "idle" | "idle" |
| `cameraLockTargetKey` | `string \| null` | `nodeStore` (待建) | Picking (selectedObject变化时) | CameraLockRuntime | null | null | null | null | null |
| `cameraTransitionToken` | `number` | `CameraLockRuntime ref` (待建) | CameraLockRuntime | CameraLockRuntime | — | — | — | — | — |
| `explodeTargetRef` (Object3D引用) | `Map<string, {object, basePosition, ...}>` | `MultiModelGroup ref` | MultiModelGroup | ExplodeDriver.useFrame | rebuild | rebuild | — | — | rebuild |
| `clippingPlane` 实例 | `THREE.Plane` | `SectionRuntime ref` (待建) | SectionRuntime | renderer | — | — | — | — | — |

---

## 10. 生命周期与性能风险

### P0 — 阻塞性风险

| 风险 | 文件 | 条件 | 影响 | 阻塞6.2？ |
|------|------|------|------|:--:|
| `activeExplodeVariantId` 从未被设置 | `VariantLabelBar.tsx:55-65` | 点击标签后滑块拖动无响应 | Explode 功能不可用 | **是** — 需在6.2 Step 1修复 |
| Canvas 共享 `_controls` 全局变量 | `ModelViewer.tsx:40` | 不存在第二个 Canvas（已验证） | 当前无影响 | 否 |

### P1 — 会冲突的风险

| 风险 | 文件 | 条件 | 影响 | 阻塞6.2？ |
|------|------|------|------|:--:|
| CameraTracker + SceneModel 双写 `controls.target` | `ModelViewer.tsx:568-577, 292` | damping 期间持续 lerp | Camera Lock 若写同一 target 会竞争 | **是** — 需在 Camera Lock 中暂停 CameraTracker |
| 两个 useFrame 写 `controls.target` | `ModelViewer.tsx:292, 568-577` | 同一帧 | 引入第三个写入者(CameraLock)需仲裁 | **是** — 需唯一写入者协议 |
| `onPointerMissed` 清除 `selectedObject` 但不退出 Camera Lock | `ModelViewer.tsx:832-835` | Camera Lock 锁定中点击空白 | 不一致：Mesh选中清空但 Lock 未退出 | **是** — 需同步 `cameraLockStatus="idle"` |

### P2 — 性能/材质风险

| 风险 | 文件 | 条件 | 影响 |
|------|------|------|------|
| clippingPlanes 作用于共享材质 | — | 若不克隆单模型节点材质 | 跨节点材质串扰 |
| R3F Raycaster 命中 clipping 裁掉的 mesh | — | Section 启用后 | 被裁掉部分仍可被选中 |
| `dampingFactor={0.08}` 持续运行 | `ModelViewer.tsx:853` | — | CPU 持续消耗（可接受） |

### P3 — 组织/注释风险

| 风险 | 文件 | 条件 |
|------|------|------|
| `_controls` 模块级变量无类型封装 | `ModelViewer.tsx:40` | — |
| `window.__multiModelDebug` 残留 | `ModelViewer.tsx:630,729-731` | DEV 下可访问（设计如此） |
| `variants/` 目录含旧版 `_controls` | `VariantScene.tsx:16` | 冻结代码，不影响运行时 |

---

## 11. 推荐最小架构

### 新增文件

```
src/
  components/viewer/
    SectionRuntime.tsx       # 挂载 clippingPlanes + Plane, 读取 store
    SectionControls.tsx     # Section UI (axis/offset/invert 滑块)
  store/
    nodeStore.ts             # 扩展 section + cameraLock 状态
  utils/
    sectionMath.ts          # 纯函数: computePlaneConstant, clampOffset
    cameraFocusMath.ts      # 纯函数: computeFocusDistance, lerpTarget
```

### 调用关系

```
SectionControls (React DOM UI, Canvas 外部)
  → nodeStore.setSectionAxis / setSectionOffset / setSectionInvert
  → SectionRuntime 读取 → THREE.Plane.constant 更新

CameraLock (触发: 双击构件 或 知识面板按钮)
  → nodeStore.setCameraLockTargetKey
  → CameraLockRuntime
      → resolve target Object3D（复用 explode cache + 新 Object3DRefTable）
      → getWorldPosition → computeFocusDistance → 插值
      → 单次平滑聚焦 → 锁定 camera

ViewRuntimeCoordinator (不新建显式组件, 在 CameraTracker 中集仲裁)
  → 读取 cameraLockStatus
  → 若 "idle": CameraTracker 正常工作
  → 若 "focusing": 暂停 CameraTracker, CameraLockRuntime 控制 camera
  → 若 "locked": 暂停 CameraTracker + SceneModel lerp, 固定 target

每层禁止:
  UI: 禁止持有 Three.js 对象
  Store: 禁止持有不可序列化对象
  Runtime: 禁止直接写 Store（只能读 Store, 写 Three.js 对象）
  Utils: 纯函数, 无副作用
```

### camera.position 唯一写入者

- **正常模式**: Drei OrbitControls（用户拖拽）
- **Camera Lock 聚焦中**: CameraLockRuntime.useFrame（插值 lerp）
- **Camera Lock 锁定中**: 无写入（暂停所有 auto-fit 和 lerp）
- **Camera Lock 退出**: 恢复 CameraTracker lerp

### controls.target 唯一写入者

- **正常模式**: CameraTracker.useFrame（每帧 lerp 到 `_modelScene` 中心）
- **Camera Lock 聚焦中**: CameraLockRuntime.useFrame（插值 lerp 到目标点）
- **Camera Lock 锁定中**: 无写入
- **Camera Lock 退出**: 恢复 CameraTracker

---

## 12. 冲突场景矩阵

| 场景 | Section | Camera Lock | Explode | Picking/知识 |
|---|---|---|---|---|
| 普通静态节点 | 正常工作 | 可选 | 不适用 | 正常 |
| 普通动画节点 (GLTF Animation 播放中) | 正常工作 | V1: 一次性聚焦后锁定，不追踪动画 | 不适用 | 正常 |
| A/B/C 未爆炸 | 正常工作 | 可选 | progress=0 | scoped |
| A/B/C 爆炸中 | 正常工作 | 使用 `getWorldPosition` 读取最新世界坐标 | active scope | scoped |
| variant 切换 | **复位** Section(axis 保留，offset→0.5) | **复位** → idle | **复位** progress→0 | 清空 |
| node 切换 | **复位** 全部 | **复位** → idle | **复位** | 清空 |
| relatedNode 跳转 | **复位** 全部 | **复位** → idle | **复位** | 清空 |
| 空白点击 | **保留** Section | **退出** Camera Lock | **保留** | 清空选择 |
| Escape | **保留** Section | **退出** Camera Lock（先取消 transition） | **保留** | 清空选择 |

---

## 13. 第六阶段第二步实施顺序

1. **修复 activeExplodeVariantId 同步** — VariantLabelBar onClick 同时设置 `activeExplodeVariantId`
2. **nodeStore 扩展** — +`sectionEnabled`, `sectionAxis`, `sectionOffset`, `sectionInvert`, `cameraLockStatus`, `cameraLockTargetKey`
3. **sectionMath.ts** — computePlaneNormal, computePlaneConstant, clampOffset 纯函数 + 测试
4. **cameraFocusMath.ts** — Box3→Sphere, FOV→distance, min/maxDistance 纯函数 + 测试
5. **SectionRuntime.tsx** — 挂载 `THREE.Plane` + 设置 `renderer.localClippingEnabled` + `material.clippingPlanes`
6. **SectionControls.tsx** — UI 滑块 + axis toggle + invert
7. **CameraTracker 改造** — 集成 `cameraLockStatus` 仲裁（正常/聚焦/锁定三种模式）
8. **Object3D 引用表** — 扩展现有 `explodeTargetRef` 或新建 light refTable
9. **浏览器验收** — DEV + Production, 20轮压力
10. **封板** — 更新 project_overview.md

---

## 14. 测试计划

| 分类 | 文件 | 覆盖 |
|------|------|------|
| A. sectionMath | `tests/sectionMath.test.ts` | axis→normal, offset clamp, invert,边界, NaN/Infinity, 不修改输入 |
| B. cameraFocusMath | `tests/cameraFocusMath.test.ts` | Box3 中心, Sphere 半径, FOV→距离, aspect, padding, 退化, NaN |
| C. runtime 协议 | `tests/viewRuntime.test.ts` | lock 状态机, transition token 取消, node/variant/relatedNode reset, 空白/Escape 规则 |
| D. 浏览器验收 | `tests/acceptance.mjs` | Section + CameraLock 完整交互, 20轮, DEV+PROD |

---

## 15. 是否允许进入第六阶段第二步

**是，条件通过。**

阻塞项：
1. `activeExplodeVariantId` 同步修复（P0，第六阶段第二步 Step 1 修复）

非阻塞项（第二步中处理）：
- CameraTracker 暂停机制（P1，Camera Lock 实现时解决）
- `onPointerMissed` 退出 Camera Lock（P1）
- Section 从零接入（无遗留干扰）
- 材质克隆策略沿用 Phase 3 `cloneSceneWithMaterials`

---

## 16. 工程验证

| 检查 | 结果 |
|------|:--:|
| `npm test` | ✅ 276/276 |
| `npx tsc --noEmit` | ✅ 0 |
| `npx tsc -b` | ✅ 0 |
| `npm run lint` | ✅ 1 warning (exhaustive-deps) |
| `npm run build` | ✅ |
| `git diff --check` | ✅ |
| 暂存区 | 空 |
| commit | 否 |
| push | 否 |

本步实际修改文件: `docs/phase-6-step-1-view-runtime-audit.md`（新增）
未修改任何业务代码。

---

*审计完成。等待人工审阅。*
