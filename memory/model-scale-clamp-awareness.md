---
name: model-scale-clamp-awareness
description: modelScale adjustments may appear ineffective when the model's native size is too large
metadata:
  type: feedback
  project: 建筑构造交互教材
---

modelScale is applied via `modelScale / maxDim` clamped to [0.3, 5].

If adjusting modelScale between small values (1, 2, 3, 4) produces no visible change, the model's native Blender dimensions are too large — all values result in `rawScale ≤ 0.3` and get clamped identically.

**How to detect**: If the user changes modelScale several times with no visual difference, immediately warn them and suggest trying a large value (e.g. 10-20) to break through the 0.3 lower clamp.

**How to apply**: When adding a new node with a large model, start with a higher modelScale (e.g. 5-10) or suggest the user resize the model in Blender before export.
