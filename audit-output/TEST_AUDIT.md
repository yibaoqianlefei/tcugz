# 测试体系审计报告

## 统计（实测运行计数）

| 文件 | 断言数 | 是否 import src | 保护对象 |
|---|---|---|---|
| resolveNodeModelSources.test.ts | 142 | ✅ | 模型源解析、多模型布局数学、变体身份/作用域键、材质克隆隔离、知识解析 |
| explodeLayout.test.ts | 69 | ✅ | 爆炸配置解析、clamp、位移数学 |
| explodeRuntime.test.ts | 65 | ✅ | 爆炸运行时状态、缓存键（store 用字面对象模拟） |
| phase6-multi-model-rotation.test.ts | 881 | ❌ **零 import** | 自写 simulateHierarchy/simulateLayout 的"设计数学" |
| phase6-camera-fit.test.ts | 59 | ✅ | 初始构图：并集框/宽高约束/padding/refit 守卫 |
| nodeDetail-controls.test.ts | 65 | ✅ | 控制栏白名单 + 废弃功能删除验证 + R 重置语义 |
| **合计** | **1281** | | |

另有 `tests/acceptance.mjs`（playwright 冒烟，需 `DEV_URL` 活服务，**不在 npm test**）。

## 价值分类

### 高价值行为测试
- phase6-camera-fit：真实 import `cameraFit.ts` 纯函数，直接保护联合相机拟合算法（多模型核心）。
- nodeDetail-controls：真实 import `nodeStore`，验证删除后无残留字段/文件/能力。
- resolveNodeModelSources / explodeLayout / explodeRuntime：真实 import，保护数据解析与爆炸数学。

### 合理结构测试
- explodeRuntime 用字面对象模拟 store（不 import 真实 store）——可接受但弱。

### 低价值 / 虚假防护
- **phase6-multi-model-rotation.test.ts（881 条）零 src import**：自写重实现，验证"设计数学"而非真实实现；大量断言为循环内对常量的恒真判断。真实 layoutModels 实现在 ModelViewer 内联（`layoutModels.ts` 未被使用）。测试数量虚高、保护虚假。→ 应改为 import 真实函数或明确标注为"设计规格文档"。

### 缺失保护（核心缺口）
| 缺口 | 影响 |
|---|---|
| 无节点数据源测试（id 唯一、status/available 一致性、无重复 slug） | 新增节点重复 id 不被 CI 拦截（仅 DEV 运行时校验） |
| 无资产存在性测试（nodeDefinitions 引用的 GLB/图片 vs public/） | 资源缺失只会在浏览器暴露 |
| 无路由测试（404、params 解析、/textbook/:sectionId vs :moduleId/:chapterId 歧义） | 路由回归无保护 |
| 无 Picking/selection、无动画 Mixer、无错误态（ErrorBoundary/加载失败）、无教材→节点跳转目标测试 | 交互与错误路径无保护 |
| acceptance.mjs（E2E）未纳入 npm test | CI 无浏览器级验证 |

## 工程覆盖问题

- `tsconfig.app.json` include 仅 `src` → **tests 不经 `tsc -b` 类型检查**（靠 tsx 转译直跑）。
- ESLint 覆盖 `**/*.{ts,tsx}` 含 tests ✅。
- `npm test` 顺序跑全部 6 套件 ✅，但不含浏览器 E2E。

## 结论

"1281 全过"不代表核心功能受保护——其中 881 条（69%）是模拟测试。真实有效保护集中在相机拟合与数据解析。**建议**：先补节点数据源 + 资产存在性 + 路由三组测试，再决定是否将 rotation 测试接入真实实现。
