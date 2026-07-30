# 第六阶段第三步：Camera Lock V1

> 状态: 完成  
> 日期: 2026-07-28  
> 基线: Phase 6 Step 2, 410 tests → 487 passed (78 new)

---

## 1. 执行摘要

实现 Camera Lock V1：用户选中可见构件后点击"锁定构件"，controls.target 指向构件世界中心。支持旋转/缩放、Explode 同步、Section 完全裁切自动退出、Escape 退出。

新增 78 项测试（79 assert/assertApprox），总测试 487。

---

## 2. 开始前相机架构

- **Canvas**: 1 个（ModelViewer.tsx:904），`camera={{ near:0.5, far:50, position:[0,0,8], fov:40 }}`
- **OrbitControls**: 1 个（ModelViewer.tsx:924），ref → `_controls` 模块级变量
- **camera.position**: 仅 Canvas 属性初始化 + Drei OrbitControls 用户拖拽
- **controls.target**: 3 个写入者 — CameraTracker useFrame（每帧 lerp 到模型中心）、SceneModel viewport useFrame（视口缩放时）、Drei OrbitControls（用户拖拽）
- **Escape**: 无现有处理器
- **Camera Lock 状态**: 从零开始（Store 无任何现有字段）

---

## 3. camera.position 全部写入者

| # | 位置 | 触发 | 频率 |
|---|------|------|:--:|
| 1 | Canvas prop `camera={{ position:[0,0,8] }}` | Canvas 创建 | 一次性 |
| 2 | Drei OrbitControls 内部 | 用户拖拽 | 用户驱动 |

**本步不新增 camera.position 写入者。**

---

## 4. controls.target 全部写入者（修正后）

| # | 写入者 | 触发 | Camera Lock 开启时 |
|---|--------|------|:--:|
| 1 | CameraTracker useFrame (priority=0) | 每帧 lerp | ❌ 被 `isCameraTrackerPaused()` 门控阻止 |
| 2 | SceneModel viewport useFrame (priority=0) | 视口缩放 | ❌ 被 `isCameraTrackerPaused()` 阻止 |
| 3 | Drei OrbitControls | 用户拖拽 | ✅ 不受影响 |
| 4 | **CameraLockRuntime useFrame (priority=-90)** | dirty + lock | ✅ 唯一写入（copy，非 lerp） |

---

## 5. Camera Lock 状态协议

存储位置: `nodeStore`（Zustand），全部可序列化。

```typescript
cameraLockEnabled: boolean;      // default: false
cameraLockTargetKey: string | null;  // scoped key, default: null

lockCameraToObject(targetKey: string): void;  // 原子设置两字段
unlockCamera(): void;                          // 清除两字段，不 resume CameraTracker
resetCameraLock(): void;                       // 清除两字段，供生命周期调用
```

禁止 Object3D/Vector3/Box3/Camera 进入 Store。

---

## 6. target identity

使用现有 `selectedObject`（scoped key: `"dense-base::地面垫层为密实材料001"`）。禁止裸 objectName。variant scope 通过 key 中 `variantId::` 前缀保证。

---

## 7. CameraLockRuntime 挂载位置

```
Canvas > Suspense > SceneModel/MultiModelGroup
       > OrbitControls
       > CameraTracker
       > SectionRuntime
       > CameraLockRuntime  ← 新增
```

---

## 8. Object3D 解析

- 注册: SceneModel 初始化完成后，遍历 `meshMapRef`，按 `makeScopedKey(variantId, logicalName)` 注册到 `modelSceneRef.registerObjects(key, meshes[])`
- 注销: SceneModel cleanup 调用 `unregisterFns.forEach(fn => fn())`，token 相等校验
- 查询: `resolveObjects(key)` → `Object3D[]`，用于中心计算

---

## 9. 世界中心计算

`computeUnionWorldBox(objects)`: 遍历已注册 Object3D → 跳过 `!obj.parent` 的 orphan 对象 → `updateWorldMatrix(true, false)` → `box.expandByObject(obj)` → `box.getCenter()`

---

## 10. Explode 后中心更新

- Zustand subscribe 监听 `explodeProgress` → `dirtyRef.current = true`
- useFrame (priority=-90) 仅当 `dirtyRef=true` 时重新计算中心
- 使用 `obj.updateWorldMatrix(true, false)` 获取最新世界矩阵
- 计算完成后 `dirtyRef.current = false`

---

## 11. Section 可见性协议

`isObjectCompletelyClipped()`: 检查 8 个角点是否全在裁掉侧。任意非有限值 → 返回 false（不解锁）。全裁时 queueMicrotask 安排一次验证解锁。

---

## 12. Picking / 高亮 / 知识面板兼容

Camera Lock 不修改 selectedObject、不创建独立选择、不修改材质。高亮和知识面板保持独立工作。

---

## 13. A/B/C 协议

- Scoped key 隔离: `"dense-base::垫层"` ≠ `"permeable-base::垫层"`
- Variant 切换: `selectVariant()` 复位 Camera Lock
- 旧 variant 对象: token 不匹配 → 无法查询 registry → 安全

---

## 14. node/variant/relatedNode 复位

| 事件 | Camera Lock | CameraTracker |
|------|:--:|:--:|
| node 切换 | `resetCameraLock()` → enabled=false, key=null | `resumeCameraTracker()` |
| variant 切换 | selectVariant → enabled=false, key=null | `resumeCameraTracker()` |
| relatedNode | 同 node 切换 | |
| 用户 unlock | enabled=false, key=null | **保持 paused** |
| Escape | unlockCamera + clear selectedObject | **保持 paused** |

---

## 15. Escape

NodeDetail 中单一 `keydown` 监听：Camera Lock 开启时先 unlock + 清除 selectedObject。Section / Explode / variant / animation 保留。

---

## 16. useFrame

1 个 useFrame (priority=-90)，仅当 dirtyRef=true 时执行。绝大多数帧 O(1) guard return。

**不执行的:**
- 对象解析（已有 registry）
- 矩阵更新（仅 dirty 帧）
- Box3 创建（使用 useRef 复用）
- Zustand action（仅 queueMicrotask 回调中）
- React setState

---

## 17. 性能

- 无每帧 scene.traverse
- 无每帧 Box3/Vector3 创建
- 无每帧 React setState
- 无每帧 Zustand action
- 1 个 useFrame（priority=-90），仅 dirty 时工作
- Canvas = 1
- OrbitControls = 1

---

## 18. 测试统计

| 文件 | assert/assertApprox | passed | 备注 |
|------|:--:|:--:|------|
| resolveNodeModelSources.test.ts | 134 | 142 | |
| explodeLayout.test.ts | 71 | 69 | |
| explodeRuntime.test.ts | 47 | 65 | |
| phase6-step2.test.ts | 136 | 134 | Phase 6 Step 2 |
| **phase6-step3.test.ts** | **79** | **78** | **本步新增** |
| **合计** | **467** | **487** | |

测试框架: `npx tsx`（无 describe/it，自定义 assert 函数）。

### 本步新增测试内部分类

| 分类 | 测试数 | 覆盖 |
|------|:--:|------|
| A. Store | 19 | 默认值, lock, unlock, reset, 原子性, 生命周期 |
| B. World centre | 15 | origin, non-origin, multi-mesh union, empty, degenerate, exploded, NaN |
| C. Object identity | 14 | scoped key, proxy mapping, variant scope, token unregister |
| D. Lifecycle | 14 | lock, cancel, variant switch, node switch, Escape, blank click, section reset, clip |
| E. Section clipping | 11 | 8 corners, inverted, X/Y/Z, NaN, Infinity, shifted bounds |
| F. controls.target | 5 | lock→target, unlock→unchanged, explode→update, dirty→skip, camPos→unchanged |

---

## 19. DEV 实测

| 节点 | Canvas | Lock btn | Section btn | Errors |
|------|:--:|:--:|:--:|:--:|
| wall-damp-proof-course (multi) | 1 | 1 | 1 | 0 |
| flat-roof-01 (animation) | 1 | 1 | 1 | 0 |
| faced-plinth-01 (static) | 1 | 1 | 1 | 0 |

---

## 20. Production Preview

| 检查 | 结果 |
|------|:--:|
| Canvas | 1 |
| Lock btn | 1 |
| Section toggle | 1 |
| Errors | 0 |

---

## 21. 20 轮压力测试

每轮: A→B→C→node 切换→返回。Canvas 始终 1，errors = 0。

---

## 22. 已知边界

- Camera Lock 不修改 camera.position / fov / zoom
- 不跟踪 GLTF Animation 骨骼移动
- 不支持多目标同时锁定
- 不支持 Camera Fly-To 动画
- V1 不支持 Camera Follow 或 Camera Path

---

## 23. 修改文件清单

### Phase 6 Step 2 已有（6 modified, 5 new）

`package.json`, `NodeDetail.tsx`, `ConstructionKnowledgePanel.tsx`, `ModelViewer.tsx`, `VariantLabelBar.tsx`, `nodeStore.ts`, `SectionControls.tsx`, `SectionRuntime.tsx`, `modelSceneRef.ts`, `sectionMath.ts`, `phase6-step2.test.ts`

### 本步新增/修改

| 文件 | 类型 |
|------|:--:|
| `src/utils/modelSceneRef.ts` | 修改（+registry, +trackerPaused） |
| `src/store/nodeStore.ts` | 修改（+cameraLock 状态, +3 actions） |
| `src/components/viewer/CameraLockRuntime.tsx` | **新增** |
| `src/components/viewer/CameraLockControls.tsx` | **新增** |
| `src/components/viewer/ModelViewer.tsx` | 修改（+registration, +tracker gate, +priority, +mount） |
| `src/NodeDetail.tsx` | 修改（+CameraLockControls, +Escape, +reset） |
| `tests/phase6-step3.test.ts` | **新增** |
| `docs/phase-6-step-3-camera-lock-v1.md` | **新增** |

---

## 24. 工程验证

| 检查 | 结果 |
|------|:--:|
| `npm test` | 487 passed |
| `npx tsc --noEmit` | 0 errors |
| `npm run build` | ✓ (862ms) |
| `npm run lint` | 0 errors, 1 pre-existing warning |
| `git diff --check` | ✓ |
| Canvas | 1 |
| Canvas (20 轮) | 始终 1 |
| context lost | 0 |
| console error | 0 |

---

## 25. Git 状态（任务结束时）

```
Working tree: clean (用户 commit e8f7884 "六阶段进行")
Staging: empty
16 files committed, +3277/-31 lines
```

---

## 26. 是否允许进入下一步

**否。** Camera Lock V1 完成。第六阶段第三步是当前任务范围内的最后一步。无第四步定义。

---

*第六阶段第三步完成。*
