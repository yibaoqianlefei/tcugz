import type { NodeModelVariant, VariantSelection } from "./variantTypes";

/* ═══════════════════════════════════════════════════════════════
   VariantInfoPanel — shows the current selection's description
   and difference summary.
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  nodeTitle: string;
  variants: NodeModelVariant[];
  selection: VariantSelection;
  onSelect: (variantId: string) => void;
  onShowAll: () => void;
}

export default function VariantInfoPanel({
  nodeTitle,
  variants,
  selection,
  onSelect,
  onShowAll,
}: Props) {
  const selectedVariant =
    selection.mode === "selected"
      ? variants.find((v) => v.id === selection.variantId)
      : null;

  if (selection.mode === "all" || !selectedVariant) {
    return (
      <div className="flex-shrink-0 px-5 py-4 border-t border-hairline bg-canvas">
        <h3 className="text-sm font-medium text-ink mb-1">{nodeTitle}</h3>
        <p className="text-xs text-muted-soft mb-3">
          点击模型或标签查看方案差异
        </p>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => onSelect(v.id)}
              className="px-3 py-1.5 rounded-lg border border-hairline text-xs text-muted
                hover:text-primary hover:border-primary/30 transition-colors"
            >
              <span className="font-semibold mr-1">{v.label}</span>
              {v.title}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 px-5 py-4 border-t border-hairline bg-canvas">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary rounded-full flex-shrink-0" />
          <span className="text-base font-semibold text-ink">
            {selectedVariant.label}
          </span>
          <span className="text-sm text-muted">{selectedVariant.title}</span>
        </div>
        <button
          onClick={onShowAll}
          className="text-xs text-primary hover:underline shrink-0"
        >
          返回全部展示
        </button>
      </div>

      {selectedVariant.description && (
        <p className="text-sm text-body leading-relaxed mb-3">
          {selectedVariant.description}
        </p>
      )}

      {selectedVariant.differenceSummary &&
        selectedVariant.differenceSummary.length > 0 && (
          <ul className="space-y-1">
            {selectedVariant.differenceSummary.map((item, i) => (
              <li
                key={i}
                className="text-xs text-muted pl-4 relative
                  before:content-['•'] before:absolute before:left-1 before:text-primary/60"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
