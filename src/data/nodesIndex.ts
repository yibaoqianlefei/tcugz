/**
 * 兼容导出层 — 所有节点数据已迁移至 nodeDefinitions.ts。
 *
 * 此文件仅保留与旧代码的接口兼容，不再独立维护节点数据。
 * 新代码请直接使用 getNodeDefinition()。
 */

export {
  nodeDefinitions,
  nodeDefinitions as nodesIndex,
  getNodeDefinition,
  getNodeData,
} from "./nodeDefinitions";

export type {
  NodeDefinition,
  NodeLayerInfo,
  NodeLayerConfig,
} from "./nodeDefinitions";
