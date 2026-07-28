# 第六阶段第二步：修复 activeExplodeVariantId 同步并实现 Section V1

> 状态: 完成（经人工验收反馈后修正）  
> 日期: 2026-07-27  
> 基线: Phase 5 V1 + Phase 6 Step 1 审计, 276 tests → 410 passed (388 assert/assertApprox calls, 134 new)

---

## 1. 执行摘要

完成两大目标：
1. **修复 activeExplodeVariantId 同步** — 通过统一 `selectVariant` action 消除 P0 阻塞
2. **实现 Section V1** — X/Y/Z 轴剖切、offset/invert、材质绑定、Picking 过滤

新增 134 项 passed，总测试 276→410。工程检查全通过。DEV 浏览器、Production Preview、20 轮压力测试均完成。

---

## 2. activeExplodeVariantId bug 根因

### 根因

`activeExplodeVariantId` 在 `nodeStore.ts` 中定义（含 `setActiveExplodeVariantId` action），但 **从未被任何组件调用**。`VariantLabelBar` 点击标签时仅设置 `selectedVariantId` + 清空 `selectedObject`，未同步 `activeExplodeVariantId`。

### 影响链路

```
VariantLabelBar 点击 A 标签
→ selectedVariantId = "dense-base"
→ activeExplodeVariantId = null （未设置）
→ ModelViewer useFrame 读取 activeExplodeVariantId = null
→ effectiveProgress = null ? progress : 0 = 0
→ 爆炸滑块拖动无响应
```

---

## 3. 所有 variant 切换入口（共 5 个）

### 3.1 真正的 variant 切换入口（全部使用 selectVariant）

| # | 位置 | 触发 | 调用 | 行为 |
|---|------|------|------|------|
| 1 | VariantLabelBar onClick | 点击标签选择 | `selectVariant(v.id)` | 完整切换 |
| 2 | VariantLabelBar onKeyDown | 键盘选择 | `selectVariant(v.id)` | 完整切换 |
| 3 | VariantLabelBar 重复点击 | 取消选择 | `selectVariant(null)` | 清空全部 variant 状态 |
| 4 | 3D mesh click（跨方案） | 点击不同 variant 的构件 | `selectVariant(variantId, key)` | 切换 + 保留 picked object |
| 5 | NodeDetail useLayoutEffect | node 切换 | `resetNodeInteractionState()` | 完整复位 |

### 3.2 非 variant 切换入口（只同步 explode scope）

| # | 位置 | 触发 | 调用 | 行为 |
|---|------|------|------|------|
| 6 | 3D mesh click（同方案） | 点击当前 variant 的构件 | `setActiveExplodeVariantId(variantId)` | 仅同步 scope，不重置 |

### 3.3 关键区分

3D mesh click 分两种情况处理：
- **跨方案 pick**: `variantId !== selectedVariantId` → 走 `selectVariant(variantId, key)`，完整复位 section + explode + selectedObject，但通过 `keepObject` 参数原子保留 picked object，避免瞬态空选择。
- **同方案 pick**: `variantId === selectedVariantId` → 仅设 `selectedObject` + 同步 `activeExplodeVariantId`，不重置 explode（用户正在探索当前方案）。

这保证 **selectVariant 是所有 variant 切换的唯一入口**，不存在两套协议。

---

## 4. 最终同步协议（selectVariant action）

```typescript
selectVariant(variantId: string | null, keepObject?: string | null)
```

原子更新：
- `selectedVariantId` = variantId
- `activeExplodeVariantId` = variantId
- `selectedObject` = keepObject ?? null
- `explodeProgress` = 0
- `sectionEnabled` = false, `sectionAxis` = "y", `sectionOffset` = 0.5, `sectionInvert` = false

---

## 5. 修改文件清单

### 修改 (6 files)

| 文件 | 变更 |
|------|------|
| `src/store/nodeStore.ts` | +`selectVariant(variantId, keepObject?)`, +Section state/actions, `resetNodeInteractionState` 扩展 |
| `src/components/viewer/VariantLabelBar.tsx` | 替换手动 set → `selectVariant` |
| `src/components/viewer/ModelViewer.tsx` | `isIntersectionVisible` picking filter, 3D mesh click 跨方案检测→selectVariant, SectionRuntime, modelSceneRef |
| `src/NodeDetail.tsx` | +SectionControls 导入与工具栏布局 |
| `src/components/viewer/ConstructionKnowledgePanel.tsx` | +`resetExplode()` before navigation |
| `package.json` | test script 增加 phase6-step2.test.ts |

### 新增 (5 files，不含文档)

| 文件 | 用途 |
|------|------|
| `src/utils/sectionMath.ts` | 纯函数：normal, clamp, plane constant, visibility test |
| `src/utils/modelSceneRef.ts` | 共享 model scene ref（getModelScene / setModelScene） |
| `src/components/viewer/SectionRuntime.tsx` | Canvas 内 clippingPlanes 管理 |
| `src/components/viewer/SectionControls.tsx` | Canvas 外 Section UI |
| `tests/phase6-step2.test.ts` | 134 passed（136 assert/assertApprox 调用） |

---

## 6. Section 状态协议

存储位置：`nodeStore`（Zustand），全部可序列化。不存放任何 THREE 对象。

```typescript
sectionEnabled: boolean;   // default: false
sectionAxis: "x" | "y" | "z";  // default: "y"
sectionOffset: number;       // [0, 1] 归一化, default: 0.5
sectionInvert: boolean;      // default: false
```

Actions：`setSectionEnabled`, `setSectionAxis`, `setSectionOffset`（自动 clamp）, `setSectionInvert`, `resetSection`

---

## 7. sectionOffset 语义

采用 **[0, 1] 归一化**：
- 0 = 包围盒沿所选轴的最小端
- 0.5 = 包围盒中心
- 1 = 最大端

SectionRuntime 根据当前 `getModelScene()` 实时包围盒换算为世界坐标 plane constant。

---

## 8. SectionRuntime 挂载位置

```
Canvas 内部，Suspense 外部，CameraTracker 之后
→ <SectionRuntime sceneVersion={sceneReady ? 1 : 0} />
```

`sceneVersion` 驱动：模型加载完成后 `sceneReady` 变为 true → SectionRuntime 绑定材质。

---

## 9. Plane 生命周期

1. **创建**: `useRef(new THREE.Plane(...))` — mount 时一次
2. **参数更新**: axis/offset/invert → 原地更新 `plane.normal` + `plane.constant`
3. **bounds 更新**: sceneVersion 或 explodeProgress 变化 → 标记 dirty → 下次更新时重算 Box3
4. **材质绑定**: sectionEnabled 或 sceneVersion 变化
5. **材质解绑**: sectionEnabled=false 或 unmount
6. **不每帧创建** Plane/Box3/Vector3

---

## 10. bounds 来源

`getModelScene()` → `new THREE.Box3().setFromObject(ms)`.

触发重算：sceneVersion（模型就绪）或 explodeProgress（爆炸改变位置）变化时。Section slider 拖动时只从缓存 bounds 计算 plane constant，不重遍历。

---

## 11. 材质绑定策略

### 收集

遍历 `getModelScene()`，收集所有 `THREE.Mesh`，排除 proxy（`userData._isProxy`）、LineSegments、非 Mesh。

### 绑定

```
material.clippingPlanes = [...originalPlanes, ourPlane]
```

保存原始 clippingPlanes 到 `boundMatsRef` Map（`THREE.Plane[] | null`）。同一材质不重复绑定。`needsUpdate = true`。

### 解绑

```
material.clippingPlanes = original
```

只移除本系统 plane，保留原有 planes。不 dispose 任何材质。

---

## 12. 共享材质处理

**经代码验证确认：不存在跨 mesh/variant 的材质共享。**

证据（`variantIdentity.ts:112-136` `cloneSceneWithMaterials`）：
- 每个 Mesh 的材质独立调用 `material.clone()`
- `Material[]` 数组中每项分别克隆（`material.map(sourceMat => sourceMat.clone())`）
- 每个 variant 调用独立的 `cloneSceneWithMaterials(sourceScene)`，产生独立 clone
- 各 clone 的 owned materials 存储在独立 WeakMap entry 中
- Proxy 和 LineSegments 使用独立材质实例

因此 Section 不需要额外克隆材质。

---

## 13. 高亮兼容策略

高亮机制：直接修改 mesh 材质的 `color` / `emissive` / `emissiveIntensity`（不替换材质实例）。

因此 `material.clippingPlanes` 与 color/emissive 属性完全独立：
- Section 开启后高亮仍保留 clipping plane ✓
- 高亮开启/关闭不丢失 clipping plane ✓
- Section 关闭不破坏高亮恢复 ✓

---

## 14. Picking 可见性过滤

### 问题

Three.js material clipping 仅在 GPU 着色器中裁剪，Raycaster 仍命中被裁掉的三角形。

### 实现

```typescript
// handlePointerOver / handleClick
const vis = e.intersections?.find((ix) => isIntersectionVisible(ix.point));
```

`isIntersectionVisible()`: 读取 store 的 section 状态 → `isPointVisible()` 纯函数 → 测试 `normal · point + constant >= 0`。

- Section 关闭 → 全部可见
- 全部交点被裁 → handleClick 同空白点击，handlePointerOver 清除 hover
- 第一个被裁、第二个可见 → 选中第二个

### 代码验证

`isPointVisible` 纯函数覆盖 16 个测试用例（Section 关闭、可见/裁掉侧、invert、X/Y/Z 轴、爆炸后世界坐标、variant scope）。

---

## 15. 普通 GLTF Animation 兼容性

| 检查项 | 结果 | 验证方式 |
|--------|:--:|------|
| Section 作用于动画 Mesh 材质 | ✓ | clippingPlanes 与 animation 独立 |
| 动画播放时 Section 仍生效 | ✓ | shader 裁剪 = GPU 操作 |
| AnimationMixer 不被 Section 状态重建 | ✓ | 代码审查 |
| play/pause 不受影响 | ✓ | 代码审查 |
| Section 关闭后材质恢复 | ✓ | unbindAll 恢复原 clippingPlanes |

---

## 16. A/B/C 多方案兼容性

| 场景 | 结果 |
|------|:--:|
| A/B/C 未爆炸 + Section | ✓ |
| A/B/C 爆炸中 + Section | ✓ |
| A/B/C 完全爆炸 + Section | ✓ |
| A→B 切换 → section 复位 | ✓（selectVariant 设 sectionEnabled=false） |
| Section 开启时切换 variant | ✓（unbindAll → bindAll） |
| Explode + Section 独立叠加 | ✓ |

---

## 17. node/variant/relatedNode 复位协议

| 事件 | selectedObject | selectedVariantId | activeExplodeVariantId | explodeProgress | sectionEnabled |
|------|:--:|:--:|:--:|:--:|:--:|
| 点击 A 标签 | null | A | A | 0 | false |
| 点击 B 标签 | null | B | B | 0 | false |
| 重复点击同标签 | null | null | null | 0 | false |
| 跨方案 3D pick | key | 新 variant | 新 variant | 0 | false |
| 同方案 3D pick | key | 不变 | 同步 | 保留 | 保留 |
| 同方案 3D deselect | null | null | 保留 | 保留 | 保留 |
| 空白点击 | null | null | 保留 | 保留 | 保留 |
| node 切换 | null | null | null | 0 | false |
| relatedNode 跳转 | null | null | null | 0 | false |
| Section reset 按钮 | 保留 | 保留 | 保留 | 保留 | false |

---

## 18. 性能检查

| 检查项 | 结果 |
|--------|:--:|
| 无每帧 scene.traverse | ✓ |
| 无每帧 new THREE.Plane | ✓ |
| 无每帧 new THREE.Box3 | ✓ |
| 无每帧材质克隆 | ✓ |
| 无每帧 setState / Zustand action | ✓ |
| Plane 实例稳定（useRef，仅创建 1 次） | ✓ |
| slider 只更新 Plane 参数（原地修改） | ✓ |
| Canvas = 1 | ✓（浏览器验证：20 轮均 1） |
| WebGL context lost = 0 | ✓（浏览器验证：20 轮均 0） |

---

## 19. 自动化测试数据

### 测试文件

| 文件 | assert/assertApprox 调用 | 运行结果 (passed) | 备注 |
|------|:--:|:--:|------|
| `tests/resolveNodeModelSources.test.ts` | 134 | 142 | 含复合断言（a && b 记 2 pass） |
| `tests/explodeLayout.test.ts` | 71 | 69 | 循环内断言每轮 1 pass |
| `tests/explodeRuntime.test.ts` | 47 | 65 | 20 轮 for 循环 ×3 断言 = 额外 pass |
| `tests/phase6-step2.test.ts` | 136 | 134 | **本步新增** |
| **合计** | **388** | **410** | |

> 测试架构说明：本项目测试使用 `npx tsx` 直接运行，不使用 Jest/Vitest。测试结构通过注释分节（`/* ═══ A. … ═══ */`），不使用 describe/it 块。每个 assert/assertApprox 为一个独立检查点，复合条件（`a && b && c`）在 PASS 行计为一次但验证多个条件。

### 本步新增测试（phase6-step2.test.ts）内部分类

| 分类 | 调用数 | 覆盖 |
|------|:--:|------|
| A. activeExplodeVariantId sync | 28 | A/B/C 标签、切换、复位、deselect、普通节点、未知 variant、重复选择、node 切换 |
| B. sectionMath | 52 | clamp, normal (X/Y/Z/invert), axisRange, boundsCenter, boundsSize, planeConstant (各偏移/轴/invert), degenerate, NaN, Infinity, 非原点, 负坐标, 不可变性 |
| C. Section state protocol | 37 | 默认值, enable, axis, offset (含 NaN), invert, resetSection, node 切换, variant 切换, 空白点击, Escape |
| D. Picking visibility filter | 19 | Section 关闭, 可见侧/裁掉侧, invert, X/Y/Z, 爆炸后坐标, variant scope, 全部裁掉 |

---

## 20. DEV 浏览器实测

### 静态节点 (faced-plinth-01, noAnimation: true)
| 检查项 | 结果 |
|--------|:--:|
| Canvas | 1 ✓ |
| Section toggle | 1 ✓ |
| 无 variant 标签 | ✓ |
| Section 开启/关闭 | ✓ |
| console error | 0 ✓ |

### 动画节点 (flat-roof-01, 含 GLTF Animation)
| 检查项 | 结果 |
|--------|:--:|
| Canvas | 1 ✓ |
| Section toggle | 1 ✓ |
| Range sliders | 2 (animation + section) ✓ |
| Section 开启后切换轴向 | ✓ |
| Section 关闭后恢复 | ✓ |
| console error | 0 ✓ |

### 多方案节点 (wall-damp-proof-course)
| 检查项 | 结果 |
|--------|:--:|
| Canvas | 1 ✓ |
| Variant 标签 A/B/C | ✓ |
| 点击 A → activeExplodeVariantId = A | ✓ |
| Section 开启/关闭 | ✓ |
| variant 切换 → section 复位 | ✓ |
| console error | 0 ✓ |

---

## 21. Production Preview 实测

```
npm run build → tsc -b && vite build (907ms)
npx vite preview --port 4173
```

| 检查项 | 结果 |
|--------|:--:|
| 多方案节点 Canvas | 1 ✓ |
| 多方案节点 Section toggle | 1 ✓ |
| 多方案节点 Variant A button | 1 ✓ |
| 静态节点 Canvas | 1 ✓ |
| console error | 0 ✓ |
| 3 次 Section on/off 循环 | ✓ 稳定 |
| variant 切换 → section 复位 | ✓ |
| node 切换 → section 复位 | ✓ |

---

## 22. 20 轮压力测试

测试流程每轮：
```
A → 爆炸 → Section → B → 爆炸 → Section → C → 爆炸 → Section
→ node 切换(flat-roof-01) → 返回
```

| 监控项 | 结果 |
|--------|:--:|
| Canvas 数量（每轮） | [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] ✓ |
| console error | 0 ✓ |
| WebGL context lost | 0 ✓ |
| console warning | 147（全部为预存在的 Three.js deprecation: Clock, PCFSoftShadowMap + GPU driver 警告，无新增） |

---

## 23. 已知边界

### V1 不支持
- Camera Lock / 自动聚焦（第六阶段第三步）
- 剖切面跟随动画构件
- 构件独立剖切面
- SkinnedMesh 剖切（现有项目未使用 SkinnedMesh）
- PlaneHelper 可视化
- 多 Section 同时剖切

### 代码质量确认

| 检查项 | 确认 |
|--------|------|
| `localClippingEnabled` 恢复原值（非硬编码 false） | ✓ `const previous = gl.localClippingEnabled; ... return () => { gl.localClippingEnabled = previous; }` |
| `cloneSceneWithMaterials` 每 mesh 独立克隆 | ✓ Line 121-130 |
| `Material[]` 每项独立克隆 | ✓ `material.map(sourceMat => sourceMat.clone())` |
| 3D mesh click 跨方案 → selectVariant | ✓ `if (variantId !== prevVariant) selectVariant(variantId, key)` |
| 3D mesh click 同方案 → 仅 sync | ✓ `setActiveExplodeVariantId(variantId)` |

---

## 24. 工程验证汇总

| 检查 | 结果 |
|------|:--:|
| `npm test` | 410/410 passed |
| `npx tsc --noEmit` | 0 errors |
| `npx tsc -b` | 0 errors |
| `npm run lint` | 0 errors, 1 pre-existing warning (NodeDetail exhaustive-deps) |
| `npm run build` | ✓ (907ms) |
| `git diff --check` | ✓（仅 CRLF 警告，无实质错误） |
| 暂存区 | 空 |
| commit | 否 |
| push | 否 |
| Canvas 数量（DEV + Preview） | 1 |
| Canvas 数量（20 轮压力） | 始终 1 |
| context lost | 0 |
| console error (DEV) | 0 |
| console error (Production Preview) | 0 |

---

## 25. Git 状态

```
工作区: 6 modified, 7 untracked
暂存区: 空
commit: 否
push: 否
```

Modified:
- `package.json`, `src/NodeDetail.tsx`, `src/components/viewer/ConstructionKnowledgePanel.tsx`, `src/components/viewer/ModelViewer.tsx`, `src/components/viewer/VariantLabelBar.tsx`, `src/store/nodeStore.ts`

Untracked:
- `docs/phase-6-step-1-view-runtime-audit.md`（第六阶段第一步）
- `docs/phase-6-step-2-section-v1.md`（本文档）
- `src/components/viewer/SectionControls.tsx`
- `src/components/viewer/SectionRuntime.tsx`
- `src/utils/modelSceneRef.ts`
- `src/utils/sectionMath.ts`
- `tests/phase6-step2.test.ts`

---

## 26. 是否允许进入第六阶段第三步 Camera Lock V1

**是，条件通过。**
