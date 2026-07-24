import type { NodeModelVariant, VariantSelection } from "./variantTypes";

/* ═══════════════════════════════════════════════════════════════
   VariantDiagramPanel — left column for multi-variant nodes.
   Shows construction section drawings for the selected variant
   (or an overview in "all" mode).
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  variants: NodeModelVariant[];
  selection: VariantSelection;
  onSelect: (variantId: string) => void;
}

export default function VariantDiagramPanel({
  variants,
  selection,
  onSelect,
}: Props) {
  const selectedVariant =
    selection.mode === "selected"
      ? variants.find((v) => v.id === selection.variantId)
      : null;

  return (
    <div className="flex flex-col bg-canvas border-r border-hairline overflow-hidden min-h-0">
      {/* ── Header ── */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-hairline">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-ink">
              {selectedVariant
                ? `方案 ${selectedVariant.label} 剖面图`
                : "构造做法对照图"}
            </h3>
            <p className="text-[11px] text-muted-soft mt-0.5">
              {selectedVariant
                ? selectedVariant.title
                : "点击缩略图查看方案"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main diagram area ── */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-y-auto">
        {selectedVariant ? (
          selectedVariant.diagram ? (
            <img
              src={selectedVariant.diagram}
              alt={`方案 ${selectedVariant.label} 剖面图`}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-center max-w-[240px]">
              <div className="w-16 h-16 rounded-2xl bg-surface-card flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-muted-soft"
                  fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                  />
                </svg>
              </div>
              <p className="text-xs text-muted-soft leading-relaxed">
                {`方案 ${selectedVariant.label} 剖面图待上传`}
              </p>
            </div>
          )
        ) : (
          /* ── All mode: show thumbnail overview ── */
          <div className="flex flex-col items-center gap-4 w-full max-w-[280px]">
            <div className="w-16 h-16 rounded-2xl bg-surface-card flex items-center justify-center">
              <svg
                className="w-7 h-7 text-muted-soft"
                fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
                />
              </svg>
            </div>
            <p className="text-xs text-muted-soft text-center leading-relaxed">
              通用构造剖面图
            </p>
            <div className="w-full space-y-1.5">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onSelect(v.id)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-hairline
                    text-xs text-muted hover:text-primary hover:border-primary/30
                    transition-colors flex items-center gap-2"
                >
                  <span className="w-5 h-5 rounded bg-surface-card flex items-center justify-center
                    text-[10px] font-semibold text-muted-soft shrink-0">
                    {v.label}
                  </span>
                  <span className="truncate">{v.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Thumbnail strip (when a variant is selected) ── */}
      <div className="flex-shrink-0 px-3 py-2.5 border-t border-hairline bg-surface-soft/50">
        <div className="flex items-center gap-1.5 justify-center">
          {variants.map((v) => {
            const isActive =
              selection.mode === "selected" && selection.variantId === v.id;
            return (
              <button
                key={v.id}
                onClick={() => onSelect(v.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors
                  ${isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-soft hover:text-muted hover:bg-surface-card"
                  }`}
              >
                {v.label}
              </button>
            );
          })}
          <span className="text-[10px] text-muted-soft mx-1">|</span>
          <button
            onClick={() => onSelect(variants[0]?.id ?? "")}
            className="text-[10px] text-muted-soft hover:text-primary transition-colors"
          >
            查看大图
          </button>
        </div>
      </div>
    </div>
  );
}
