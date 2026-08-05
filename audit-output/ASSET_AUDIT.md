# 模型资产审计报告

## GLB 盘点（public/models）

总 GLB 数：约 30 个，总大小 **21.7 MB**（含 4 个 `-orig.glb` 孤儿 ≈ **10.5 MB**，即近一半为死重）。

### 被引用 GLB（正常）

| 文件 | 体积 | 引用方 |
|---|---|---|
| background/Exhibition model.glb | 4.81 MB | 背景墙场景 + 菜单背景（backgroundScenes.ts:6、MenuBackground.tsx:173） |
| roof/flat-roof/flat-roof.glb | 2.21 MB | 节点 flat-roof-01 + 背景场景共用 |
| roof/sloped-roof/sloped-roof.glb | 1.76 MB | 节点 sloped-roof-01 |
| wall/construction-column/construction-column.glb | 0.22 MB | 节点 construction-column-01 |
| 其余 22 个 | ≤ 0.34 MB | 各自节点 |
| wall/wall-damp-proof/a/b/c-v2.glb | 0.11-0.13 MB ×3 | 多模型 3 变体 |

### 孤儿 GLB（未被任何引用，-orig 备份）

| 文件 | 体积 |
|---|---|
| background/Exhibition model-orig.glb | 4.82 MB |
| roof/flat-roof/flat-roof-orig.glb | 2.25 MB |
| roof/sloped-roof/sloped-roof-orig.glb | 1.79 MB |
| wall/construction-column/construction-column-orig.glb | 2.13 MB |
| **合计 ≈ 10.99 MB** | |

grep 全库 `.glb` 均无 `-orig` 命中 → 纯死重，被 `npm run build` 原样复制进 dist。

## 动画 GLB

- 有动画（AnimationMixer）：单模型动画节点（flat-roof、sloped-roof、roof-drainage、organized-drainage、eaves-gutter、construction-column、apron-flashing、stone-apron、foam-insulation、rockwool-insulation、rc-elevated-steps、concrete-steps），每个 1 段 clip，时长 ~4s，LoopOnce + clampWhenFinished。
- 无动画：6 个 noAnimation 节点（cast-ribbed-floor、faced/stone/plaster-plinth、stair-composition）与多模型 3 变体——与声明一致。
- `AnimationMixer` root 为克隆场景（cloneSceneWithMaterials），正确；页面卸载时 stopAllAction + uncacheRoot + disposeClonedMaterials。

## 图片 / diagram

- `public/images/` 15 张，与 15 个节点 diagram 对应，全部存在、无 0 字节。
- flat-roof-01、sloped-roof-01 无 diagram（null）——知识面板左栏空，允许但建议补。
- 教材正文 md 当前零图片。

## 命名 / 结构风险

- `Exhibition model.glb` 含**空格**（Windows 可加载；Linux/CI 脚本需引号，部署路径风险 P3）。
- 多模型 mesh 名含 Blender 后缀（"地面垫层为密实材料001"）→ 经 canonicalName 归一化；但 layerConfig 的 objectName 与之不匹配（P2-9）。
- 未执行 GLB 内部解析（不修改资产、只读审计）；异常包围盒/负缩放/重复材质等**未验证**（需临时脚本，本轮未做）。

## 建议

1. 删除 4 个 `-orig.glb` 孤儿（-10.99MB，约 50% 资产体积）。
2. 补 flat-roof / sloped-roof diagram。
3. 后续若执行模型分析脚本，核对材质/mesh 数量与单位比例（本轮仅目录级盘点）。
