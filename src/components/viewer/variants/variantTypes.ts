/** Variant display mode: "all" shows all three models, "selected" focuses one. */
export type VariantSelection =
  | { mode: "all" }
  | { mode: "selected"; variantId: string };

/** Per-variant model configuration. */
export interface NodeModelVariant {
  id: string;
  label: string;
  title: string;
  description?: string;
  /** Optional per-variant section diagram image path. */
  diagram?: string;

  model: {
    path: string;
    scale?: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
  };

  differenceSummary?: string[];
  /** Optional per-variant component/construction-layer list (text only in V1). */
  components?: VariantComponent[];
}

/** Text-only construction component entry for the teaching panel. */
export interface VariantComponent {
  name: string;
  material?: string;
  thickness?: string;
  note?: string;
}

/** Layout result for a single variant — width + world-space position. */
export interface LayoutSlot {
  variantId: string;
  /** X offset from the combined scene center for this variant's wrapper group. */
  x: number;
  /** Bounding-box width of this variant's normalized model. */
  width: number;
}

/* ── Validation ────────────────────────────────────────────── */

export interface VariantValidationError {
  variantId: string;
  field: string;
  message: string;
}

/**
 * Validate variants array. Returns list of errors (empty = valid).
 * Performed at component mount, not build time.
 */
export function validateVariants(
  variants: NodeModelVariant[],
): VariantValidationError[] {
  const errors: VariantValidationError[] = [];

  if (!Array.isArray(variants)) {
    return [{ variantId: "(root)", field: "variants", message: "variants 不是数组" }];
  }
  if (variants.length < 2) {
    errors.push({
      variantId: "(root)",
      field: "variants",
      message: `variants 至少需要 2 个，当前 ${variants.length} 个`,
    });
  }

  const seenIds = new Set<string>();

  for (const v of variants) {
    const id = v.id ?? "(missing)";

    if (!v.id) errors.push({ variantId: id, field: "id", message: "缺少 id" });
    else if (seenIds.has(v.id))
      errors.push({ variantId: id, field: "id", message: `id "${v.id}" 重复` });
    else seenIds.add(v.id);

    if (!v.label) errors.push({ variantId: id, field: "label", message: "缺少 label" });
    if (!v.title) errors.push({ variantId: id, field: "title", message: "缺少 title" });
    if (!v.model?.path)
      errors.push({ variantId: id, field: "model.path", message: "缺少 model.path" });

    if (v.model?.scale != null && v.model.scale <= 0) {
      errors.push({
        variantId: id,
        field: "model.scale",
        message: `model.scale 必须 > 0，当前 ${v.model.scale}`,
      });
    }

    if (v.model?.position) {
      const [x, y, z] = v.model.position;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        errors.push({
          variantId: id,
          field: "model.position",
          message: `position 包含非有限值: [${x}, ${y}, ${z}]`,
        });
      }
    }

    if (v.model?.rotation) {
      const [x, y, z] = v.model.rotation;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        errors.push({
          variantId: id,
          field: "model.rotation",
          message: `rotation 包含非有限值: [${x}, ${y}, ${z}]`,
        });
      }
    }
  }

  return errors;
}
