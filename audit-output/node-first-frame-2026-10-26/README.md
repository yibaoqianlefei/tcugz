# 交互节点首屏取景审计与调整 · 2026-10-26

## 结论

**首屏取景过大已修正：留白系数 `SINGLE_MODEL_FIT_PADDING` 1.1 → 1.3。**

| 指标 | 改前 (1.1) | 改后 (1.3) |
|---|---|---|
| 主轴占比中位数 | 80.8% | **67.5%** |
| 主轴占比 p90 | 89.2% | **75.0%** |
| 主轴 >85% 的节点 | 28 / 79 | **0** |
| 面积覆盖中位数 | 16.3% | 11.7% |
| 四边余量中位数 | 11.4% | 19.3% |
| 主轴 <45%（偏小） | 0 | 1（极扁的无梁楼板 41.7%） |

留白系数与占屏的换算：`最长边最多占画面 100 / padding %`。实测扫描：

| padding | 主轴中位数 | 主轴 p90 | 面积中位数 | 余量中位数 | 主轴 >85% |
|---|---|---|---|---|---|
| 1.1（原值） | 81.0% | 89% | 16.6% | 11.4% | 27 |
| 1.2 | 73.5% | 81% | 13.6% | 15.7% | 0 |
| **1.3（采用）** | **67.5%** | **75%** | **11.3%** | **19.3%** | **0** |
| 1.4 | 63.0% | 69.5% | 9.8% | 22.9% | 0 |
| 1.5 | 59.0% | 65% | 8.6% | 26.4% | 0 |

要更松只改这一个常量即可。扫描直接调用生产代码 `computeSingleModelCameraFit`，与查看器同源。

## 两处前版结论的更正

1. ~~"首屏方位角横跨 −32.68°～−2.88°，分三个簇"~~ —— 当时在页面打开约 7 秒后读相机，而自动旋转默认开启（约 4.5°/s），读到的是转过 20°～35° 之后的姿态。**暂停自动旋转后重测：79 个节点首屏方位角全部 0.00°（−0.26°～0），仰角全部 8.18°。**
2. ~~"适配视图只改距离不改朝向，需要修"~~ —— 适配确实只改距离；上一版看到的"每点一次转 12–13°"是两次点击之间自动旋转继续转。**没有按这条改代码。**

## 首屏视角（`initialView`，9 个节点）

取景大小修好后，仍有节点"首屏只看得到一个面"（整面墙体正对相机）。给 `NodeModelConfig` 增加可选 `initialView`（不写 = 默认正面视角），用 15° 步进扫描选方向，只对收益明确的 9 个写入：

| 节点 | 方位角 | 最大单构件占比 | 可见构件 |
|---|---|---|---|
| handrail-wall-bent-bracket-01 | 0° → 30° | 74.4% → 38.2% | 4 → 4 |
| handrail-brick-wall-wood-pad-bracket-01 | 0° → 30° | 77.9% → 46.4% | 4 → 4 |
| handrail-wall-end-plate-01 | 0° → 165° | 72.9% → 49.5% | 3 → 3 |
| handrail-brick-wall-forked-bar-01 | 0° → 165° | 71.3% → 48.9% | 3 → 3 |
| foam-insulation-01 | 0° → 165° | 76.2% → 47.5% | 2 → 3 |
| rockwool-insulation-01 | 0° → 165° | 73.0% → 46.3% | 3 → 4 |
| passive-solar-wall-01 | 0° → 45° | 67.3% → 37.5% | 5 → 7 |
| profiled-steel-composite-slab-01 | 0° → 75° | 67.2% → 43.2% | 4 → 4 |
| stair-flight-offset-multiple-01 | 0° → 90° | 65.9% → 52.7% | 3 → 3 |

> 这 9 个节点的"改前"数字同时包含旧的留白系数与旧的正面视角，因此少数节点的主轴占比会变大（例如弯管托架 57.1% → 65.4%），属于视角改变带来的正常变化。

## 仍需调整（7 个）

- **首屏单面主导（6 个）**：`block-wall-core-column-01`（96%）、`construction-column-01`（88%）、`stair-composition-01`（72%）、`stair-flight-offset-one-01`、`stair-flight-flush-buried-01`、`combined-foundation-box-01`。15° 步进扫描里没有任何方向能显著改善，主导面来自模型本身的空间关系，需要改模型（切开遮挡面/半透明）或改取景策略（默认半分解）。
- **取景偏小（1 个）**：`cast-ribbed-floor-01`（主轴 41.7%，短边 21.9%）——模型本身极扁。

其它观察：`stair-composition-01`、`cast-ribbed-floor-01` 首屏最大的面是 `model.nonInteractive` 兜底网格（点不了）；12 个节点只有 1–2 个可选构件。

## 文件

| 文件 | 内容 |
|---|---|
| `index.html` | 报告正文：结论、留白扫描表、改前/改后对照、`initialView` 明细、仍需调整、全量明细 |
| `data.json` | 逐节点数据：改前/改后主轴、覆盖、单面占比、`initialView`、判定标签 |
| `summary.txt` | 逐行文本摘要 |
| `shots/` | 改前首屏截图（padding 1.1，无 `initialView`） |
| `after/` | 改后首屏截图（padding 1.3 + `initialView`） |

## 代码改动

| 文件 | 改动 |
|---|---|
| `src/utils/viewerCamera.ts` | `SINGLE_MODEL_FIT_PADDING` 1.1 → 1.3（注释里记录扫描结论） |
| `src/data/nodeDefinitions.ts` | `NodeModelConfig` 新增可选 `initialView`；9 个节点写入方向 |
| `src/components/viewer/ModelViewer.tsx` | 接收 `initialView`，仅首次适配、单模型时生效 |
| `src/NodeDetail.tsx` | 传 `initialView` |

未设置 `initialView` 的节点只受留白系数影响，行为一致。

## 验证

- `npm run lint`、`tsc -b`：0
- 37 个测试套件（含 `single-model-camera-fit`、`phase6-camera-fit`、`nodeDetail-controls`、`node-definition-contract`、`node-assets`）：全绿
- 79 个节点重新实测：主轴中位数 80.8% → 67.5%，>85% 的 28 个 → 0，无裁切
- 控制台错误 0

## 复现

```bash
npm run dev -- --host ::

# 改前/改后都要先暂停自动旋转
OUT_DIR=tmp/first-frame2 node tmp/measure-first-frame2.mjs   # padding 1.1 基线
OUT_DIR=tmp/first-frame4 node tmp/measure-first-frame2.mjs   # padding 1.3

CAMS=tmp/first-frame4/cameras.json OUT=tmp/first-frame4/framing.json node tmp/rasterize-framing3.mjs
node --import tsx tmp/padding-sweep.mjs                       # 留白系数扫描
node tmp/build-report5.mjs                                    # 生成报告
```

`tmp/` 已被 `.gitignore` 忽略；结论以本目录 `index.html` / `data.json` 为准。

## 已知限制

- 光栅化只考虑不透明三角形与深度缓冲，忽略材质透明度与贴图。
- 留白系数是全局常量；`cast-ribbed-floor-01` 这类极扁模型因此在 1.3 下偏小，如需可按节点覆写。
- 3 个多模型变体节点（`wall-damp-proof-course`、`cantilever-slab-01`、`independent-foundation-01`）用 `MultiModelGroup` 自己的布局与 `CAMERA_FIT_PADDING`，本次未调整。
- 首屏只是"第一眼"：自动旋转默认开启（约 4.5°/s），首屏姿态只在最初一两秒成立。
