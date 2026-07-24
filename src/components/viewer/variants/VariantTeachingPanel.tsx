import type { NodeModelVariant, VariantSelection } from "./variantTypes";
import { X } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   VariantTeachingPanel — right column for multi-variant nodes.
   Shows node overview (all mode) or selected variant details.
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  nodeTitle: string;
  /** Optional overall node description from NodeDefinition. */
  nodeDescription?: string;
  variants: NodeModelVariant[];
  selection: VariantSelection;
  onSelect: (variantId: string) => void;
  onShowAll: () => void;
}

export default function VariantTeachingPanel({
  nodeTitle,
  nodeDescription,
  variants,
  selection,
  onSelect,
  onShowAll,
}: Props) {
  const selectedVariant =
    selection.mode === "selected"
      ? variants.find((v) => v.id === selection.variantId)
      : null;

  return (
    <div className="flex flex-col bg-canvas border-l border-hairline overflow-hidden min-h-0">
      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        {/* ── Header ── */}
        <div className="px-5 py-5 border-b border-hairline">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-5 bg-primary rounded-full flex-shrink-0" />
            <h2 className="text-base font-normal font-serif text-ink tracking-tight">
              {nodeTitle}
            </h2>
          </div>
          {nodeDescription && (
            <p className="text-sm text-muted leading-relaxed">
              {nodeDescription}
            </p>
          )}
        </div>

        {/* ── All mode: variant overview cards ── */}
        {selection.mode === "all" && (
          <div className="px-5 py-5">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
              构造方案
            </h3>
            <p className="text-[10px] text-muted-soft mb-3">
              点击模型、标签或剖面图查看对应做法
            </p>
            <div className="space-y-2.5">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onSelect(v.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors duration-200
                    bg-surface-card border-hairline hover:border-primary/20 hover:bg-surface-cream-strong/50`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0 bg-muted-soft" />
                    <span className="text-sm font-medium text-body">
                      {v.label} {v.title}
                    </span>
                  </div>
                  <div className="ml-4 text-[10px] text-muted-soft mt-1">
                    {v.description ?? v.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Selected mode: variant detail ── */}
        {selection.mode === "selected" && selectedVariant && (
          <div className="px-5 py-5 space-y-4">
            {/* Variant identity */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-primary rounded-full flex-shrink-0" />
                <span className="text-base font-semibold text-ink">
                  {selectedVariant.label}
                </span>
                <span className="text-sm text-muted">{selectedVariant.title}</span>
              </div>
              <button
                onClick={onShowAll}
                className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
              >
                <X size={12} strokeWidth={1.5} />
                返回全部展示
              </button>
            </div>

            {/* Description */}
            {selectedVariant.description && (
              <p className="text-sm text-body leading-relaxed">
                {selectedVariant.description}
              </p>
            )}

            {/* Difference summary */}
            {selectedVariant.differenceSummary &&
              selectedVariant.differenceSummary.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-medium text-muted-soft uppercase tracking-wider mb-2">
                    方案要点
                  </h4>
                  <ul className="space-y-1.5">
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
                </div>
              )}

            {/* Component list */}
            {selectedVariant.components &&
              selectedVariant.components.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-medium text-muted-soft uppercase tracking-wider mb-2">
                    构造层次
                  </h4>
                  <div className="border border-hairline rounded-lg overflow-hidden">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-hairline bg-surface-card">
                          <th className="text-left py-1.5 px-2.5 text-muted-soft font-medium">
                            名称
                          </th>
                          <th className="text-left py-1.5 px-2.5 text-muted-soft font-medium">
                            材料
                          </th>
                          <th className="text-right py-1.5 px-2.5 text-muted-soft font-medium">
                            厚度
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedVariant.components.map((c, i) => (
                          <tr
                            key={i}
                            className="border-b border-hairline/50 last:border-0"
                          >
                            <td className="py-1.5 px-2.5 text-body">{c.name}</td>
                            <td className="py-1.5 px-2.5 text-muted-soft">
                              {c.material ?? "—"}
                            </td>
                            <td className="py-1.5 px-2.5 text-muted-soft text-right">
                              {c.thickness ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 px-5 py-3 border-t border-hairline">
        <p className="text-[10px] text-muted-soft text-center">
          建筑构造交互系统 · 多方案对比教学
        </p>
      </div>
    </div>
  );
}
