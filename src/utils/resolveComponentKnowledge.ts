/**
 * Phase 4 — unified component knowledge resolver.
 *
 * Given a node definition, the current selectedObject (optionally scoped),
 * and selectedVariantId, returns resolved knowledge for the clicked
 * component.  Handles both multi-variant and normal single-model nodes.
 */

import type { NodeDefinition, VariantComponentKnowledge } from "../data/nodeDefinitions";
import { parseScopedKey } from "./variantIdentity";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

export interface ResolvedKnowledge {
  /** The variant id if this is a multi-variant node, null for normal nodes. */
  variantId: string | null;
  /** The variant label (e.g. "A") if available. */
  variantLabel: string | null;
  /** The variant title (e.g. "密实材料垫层") if available. */
  variantTitle: string | null;
  /** The raw object name (without scoped-key prefix). */
  objectName: string;
  /** Matched knowledge entry, or null if not found. */
  component: VariantComponentKnowledge | null;
  /** Whether the mesh was selected but no knowledge is configured for it. */
  isUnconfigured: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   Resolver
   ═══════════════════════════════════════════════════════════════ */

/**
 * Resolve component knowledge from the current selection state.
 *
 * Multi-variant nodes:
 *   - Parse `selectedObject` scoped key → variantId + objectName
 *   - Look up matching `VariantComponentKnowledge` within that variant
 *   - The scoped key's variantId is the single source of truth
 *
 * Normal single-model nodes:
 *   - `selectedObject` is a plain mesh name
 *   - `variantId` is null — no variant-level knowledge is returned
 *   - The caller's existing layerConfig lookup handles knowledge
 */
export function resolveComponentKnowledge(opts: {
  node: NodeDefinition;
  selectedObject: string | null;
  /** Reserved for future scoped-key consistency checks (Phase 4+). */
  selectedVariantId: string | null;
}): ResolvedKnowledge | null {
  const { node, selectedObject } = opts;
  if (!node || !selectedObject) return null;

  const { variantId, objectName } = parseScopedKey(selectedObject);

  // Multi-variant node
  if (node.presentationMode === "variants" && node.variants && variantId) {
    const variant = node.variants.find((v) => v.id === variantId);
    if (!variant) {
      return null;
    }

    const knowledgeList = variant.componentKnowledge ?? [];
    // Try exact match first, then aliases
    const match: VariantComponentKnowledge | null =
      knowledgeList.find((k) => k.objectName === objectName) ??
      knowledgeList.find(
        (k) => k.aliases !== undefined && k.aliases.includes(objectName),
      ) ??
      null;

    return {
      variantId,
      variantLabel: variant.label ?? null,
      variantTitle: variant.title ?? null,
      objectName,
      component: match,
      isUnconfigured: match === null,
    };
  }

  // Normal single-model node: no variant knowledge layer
  // (the existing layerConfig-based lookup handles this)
  return {
    variantId: null,
    variantLabel: null,
    variantTitle: null,
    objectName,
    component: null,
    isUnconfigured: false, // let layerConfig handle this
  };
}
