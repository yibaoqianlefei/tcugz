/**
 * Phase 2 — resolve multi-model sources from a NodeDefinition.
 *
 * Priority (for nodes with presentationMode === "variants"):
 *   1. variants  → extract { id, src, scale } for each valid variant (max 3)
 *   2. Fallback: single-model legacy `model` field
 *
 * Normal nodes (presentationMode !== "variants" or absent):
 *   Uses legacy `model` field only, returns 1-element array.
 *
 * Invalid entries (empty src, missing id, invalid scale) are filtered.
 */

import type { NodeDefinition } from "../data/nodeDefinitions";

export interface ResolvedModelSource {
  id: string;
  src: string;
  scale: number;
  source: "model" | "variants";
  /** Label shown on variant selection UI (e.g. "A", "B", "C"). */
  label?: string;
  /** Title shown on variant selection UI (e.g. "密实材料垫层"). */
  title?: string;
}

const MAX_MODELS = 3;

export function resolveNodeModelSources(
  node: NodeDefinition,
): ResolvedModelSource[] {
  const isVariantsNode = node.presentationMode === "variants";

  if (isVariantsNode && Array.isArray(node.variants) && node.variants.length > 0) {
    const sources: ResolvedModelSource[] = [];

    for (const v of node.variants) {
      if (sources.length >= MAX_MODELS) break;
      const src = v.model?.path;
      if (!src || !v.id) continue;
      const scale = v.model?.scale;
      if (scale != null && scale <= 0) continue;
      sources.push({
        id: v.id,
        src,
        scale: scale ?? 1,
        source: "variants",
        label: v.label,
        title: v.title,
      });
    }

    if (sources.length > 0) return sources;
  }

  // Fallback: legacy single-model field
  if (node.model?.path) {
    return [
      {
        id: node.id,
        src: node.model.path,
        scale: node.model.scale,
        source: "model",
      },
    ];
  }

  return [];
}
