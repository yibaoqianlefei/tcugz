/**
 * Phase 3 — Variant label selection bar.
 *
 * Renders A/B/C labels for multi-variant nodes. Handles:
 *  - click label → select variant (bidirectional with 3D picking)
 *  - hover label → hover variant
 *  - keyboard accessible (Tab focus, Enter/Space select)
 *  - aria-pressed for screen readers
 *
 * Does NOT render for single-model nodes (hidden via parent conditional).
 */

import { useNodeStore } from "../../store/nodeStore";
import type { ResolvedModelSource } from "../../utils/resolveNodeModelSources";

export default function VariantLabelBar({
  variants,
}: {
  variants: ResolvedModelSource[];
}) {
  const selectedVariantId = useNodeStore((s) => s.selectedVariantId);
  const hoveredVariantId = useNodeStore((s) => s.hoveredVariantId);
  const selectVariant = useNodeStore((s) => s.selectVariant);
  const setHoveredVariantId = useNodeStore((s) => s.setHoveredVariantId);

  if (variants.length < 2) return null;

  return (
    <div
      className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2.5
        bg-canvas border-b border-hairline"
      role="group"
      aria-label="方案选择"
    >
      {variants.map((v) => {
        const isSelected = selectedVariantId === v.id;
        const isHovered = hoveredVariantId === v.id;

        return (
          <button
            key={v.id}
            type="button"
            aria-pressed={isSelected}
            aria-label={`方案 ${v.label}: ${v.title}`}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
              "border outline-none",
              isSelected
                ? "bg-primary/10 border-primary/40 text-primary font-medium"
                : isHovered
                  ? "bg-surface-card border-primary/25 text-body"
                  : "bg-surface-card border-hairline text-muted hover:border-primary/20 hover:text-body",
            ].join(" ")}
            onClick={() => {
              // Phase 6 Step 2: unified variant selection — atomic update
              // of selectedVariantId + activeExplodeVariantId + explodeProgress
              // + selectedObject via selectVariant action.
              if (isSelected) {
                selectVariant(null);
              } else {
                selectVariant(v.id);
              }
            }}
            onMouseEnter={() => setHoveredVariantId(v.id)}
            onMouseLeave={() => setHoveredVariantId(null)}
            onFocus={() => setHoveredVariantId(v.id)}
            onBlur={() => setHoveredVariantId(null)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (isSelected) {
                  selectVariant(null);
                } else {
                  selectVariant(v.id);
                }
              }
            }}
          >
            {v.label && (
              <span
                className={[
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  isSelected
                    ? "bg-primary text-white"
                    : "bg-hairline text-muted-soft",
                ].join(" ")}
              >
                {v.label}
              </span>
            )}
            <span className="leading-tight">{v.title ?? v.id}</span>
          </button>
        );
      })}
    </div>
  );
}
