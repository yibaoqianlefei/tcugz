# 测试有效性审计报告（Phase 2）

审计时点：2026-08-04，HEAD `b37f9c2`。只读，未修改任何被测文件（除 `nodeDefinitions.ts` 的 `import.meta.env` 最小守卫，见下）。

## 评级标准

```
A：直接验证真实生产行为（导入真实生产代码/数据）
B：部分使用生产代码，但大量依赖 mock 或字面模拟
C：主要验证测试内复制的逻辑（self-simulation）
D：只做源码字符串/正则检查
```

## 各测试文件评级

| 文件 | src 导入数 | 源码 assert 点 | 运行时断言数 | 评级 | 真正保护的生产行为 |
| ---- | ----: | ----: | ----: | ---- | ---- |
| resolveNodeModelSources.test.ts | 7 | 133 | 142 | A | 模型源解析、变体作用域键、材质克隆隔离、知识解析器（真实 import） |
| explodeLayout.test.ts | 2 | 59 | 69 | A | 爆炸配置/位移/clamp 数学（真实 import） |
| explodeRuntime.test.ts | 2 | 46 | 65 | B | 爆炸运行时状态；store 用字面对象模拟默认值（弱） |
| phase6-multi-model-rotation.test.ts | **0** | 60 | **≈881** | **C** | 无——自写 simulateHierarchy/Layout 验证"设计数学"，不验证真实实现 |
| phase6-camera-fit.test.ts | 1 | 31 | 59 | A | 联合相机拟合纯函数（真实 import cameraFit.ts） |
| nodeDetail-controls.test.ts | 2 | 29 | 65 | A | 控制栏白名单 + 删除验证 + R 重置（真实 import nodeStore） |
| interaction-fixes.test.ts | 4 | 38 | 38 | A | 交互门 + 动画重置 + scoped key（真实生产函数，Phase 1 新增） |
| node-definition-contract.test.ts（新） | 5 | 39 | 268 | A | 节点定义协议（真实 nodeDefinitions/nodesIndex/types/readers） |
| node-assets.test.ts（新） | 2 | 4 | 217 | A | 节点引用资产存在性（真实配置收集 + public 映射） |
| node-behavior-archetypes.test.ts（新） | 7 | 38 | 47 | A | 三类代表节点真实行为（真实节点/门/重置/键） |

## 重点：phase6-multi-model-rotation.test.ts

- **评级：C**
- **src 生产代码 import 数量：0**
- **自写模拟断言数量：≈881（60 个 assert 调用点经 for 循环展开）**
- **真正保护的生产行为：无**。测试内部重写了 hierarchy/layout 数学（`simulateHierarchy`/`simulateLayout`），验证的是"设计规格"而非真实实现。真实实现在 ModelViewer 内联（`layoutModels.ts` 未被产品使用），因此该测试通过与否与产品代码无关。
- **本轮是否修改：否**。按任务 §9.2 规定，不删除 881 条旧断言、不大面积重写。
- **后续建议**：作为"设计规格文档"保留或逐步替换为对真实 `layoutModels`/ModelViewer 提取纯函数的测试；在可提取真实布局纯函数后再替换。

## 结论

- 当前测试数量（1319+532=1851 断言）不等于真实覆盖质量——其中 **881 条（≈48%）来自自写模拟**，保护的是重实现的数学。
- 新增的 3 组（532 条）全部导入真实生产代码/数据，覆盖：节点协议、资产引用、三类节点真实行为。
- 可暂时保留：phase6-multi-model-rotation（作为设计规格）、explodeRuntime（B 级，弱但无害）。
- 未来应逐步替换：phase6-multi-model-rotation → 真实布局纯函数测试。
- 本轮实际替换：无旧断言被删除；新增 3 个测试文件、1 个辅助函数。
- 未处理：无。
