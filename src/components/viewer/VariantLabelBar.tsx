/**
 * Multi-variant selection inside the shared knowledge column.
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
import type { NodeModelVariant } from "../../data/nodeDefinitions";

export default function VariantLabelBar({
  variants,
}: {
  variants: Pick<NodeModelVariant, "id" | "label" | "title">[];
}) {
  const selectedVariantId = useNodeStore((s) => s.selectedVariantId);
  const hoveredVariantId = useNodeStore((s) => s.hoveredVariantId);
  const selectVariant = useNodeStore((s) => s.selectVariant);
  const setHoveredVariantId = useNodeStore((s) => s.setHoveredVariantId);

  if (variants.length < 2) return null;

  return (
    <div
      className="flex-shrink-0 border-b border-hairline px-5 py-4"
      role="group"
      aria-label="方案选择"
    >
      <p className="text-xs font-medium text-muted">构造方案</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {variants.map((v) => {
          const isSelected = selectedVariantId === v.id;
          const isHovered = hoveredVariantId === v.id;

          return (
            <button
              key={v.id}
              type="button"
              aria-pressed={isSelected}
              aria-label={`方案 ${v.label}: ${v.title}`}
              title={v.title}
              className={[
                "flex min-w-0 flex-col items-center gap-1 px-1 py-2 rounded-lg text-xs transition-all duration-200",
                "border outline-none",
                isSelected
                  ? "bg-primary/10 border-primary/40 text-primary font-medium"
                  : isHovered
                    ? "bg-surface-card border-primary/25 text-body"
                    : "bg-surface-card border-hairline text-muted hover:border-primary/20 hover:text-body",
              ].join(" ")}
              onClick={() => {
                // Keep variant, selection and explode scope in sync.
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
              <span className="w-full truncate text-center text-[11px] leading-tight">{v.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
