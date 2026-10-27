/** Camera settings shared by node views and private textbook canvases. */
export const NODE_CAMERA_FOV = 40;
export const NODE_MAX_POLAR_ANGLE = Math.PI / 2.2;
export const CAMERA_REFIT_SECONDS = 0.28;
export const CAMERA_RESIZE_SETTLE_MS = 100;
/**
 * 单模型首屏留白系数：物体最长边约占画面的 100/padding %。
 * 1.1 → 最多 91%、实际中位数 81%（27/79 个节点超过 85%，画面几乎顶到边框）；
 * 1.3 → 最多 77%、中位数 68%，四边余量中位数 19%。
 * 数值来自 79 个节点的实测扫描（audit-output/node-first-frame-2026-10-26）。
 */
export const SINGLE_MODEL_FIT_PADDING = 1.3;
