import type { NodeModelVariant, VariantSelection } from "./variantTypes";

/* ═══════════════════════════════════════════════════════════════
   VariantLabels — A/B/C labels below the 3D viewport.
   Equal-width columns, keyboard-accessible buttons.
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  variants: NodeModelVariant[];
  selection: VariantSelection;
  onSelect: (variantId: string) => void;
}

export default function VariantLabels({ variants, selection, onSelect }: Props) {
  const selectedId =
    selection.mode === "selected" ? selection.variantId : null;

  return (
    <div
      role="radiogroup"
      aria-label="构造方案选择"
      className="flex-shrink-0 flex border-t border-hairline bg-canvas"
    >
      {variants.map((v) => {
        const isSelected = v.id === selectedId;
        return (
          <button
            key={v.id}
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(v.id)}
            className={`flex-1 flex flex-col items-center py-3 px-2 transition-colors duration-200
              border-b-2 min-w-0
              ${isSelected
                ? "border-primary bg-primary/3 text-primary"
                : "border-transparent text-muted-soft hover:text-muted hover:bg-hairline/50"
              }`}
          >
            <span
              className={`text-lg font-semibold leading-none mb-0.5 ${isSelected ? "text-primary" : ""}`}
            >
              {v.label}
            </span>
            <span className="text-[11px] leading-tight text-center px-1 truncate max-w-full">
              {v.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}
