import type { NodeModelVariant } from "../../data/nodeDefinitions";

/** Readable comparison before the learner chooses an A/B/C construction. */
export default function VariantComparisonOverview({ variants }: { variants: NodeModelVariant[] }) {
  const commonNames = variants[0]?.components
    ?.map((component) => component.name)
    .filter((name) => variants.every((variant) => variant.components?.some((component) => component.name === name))) ?? [];
  const commonNameSet = new Set(commonNames);

  return (
    <section aria-label="方案对比" className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-ink">构造方案对比</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          先比较三种做法的关键差异，再选择方案查看模型构件和详细做法。
        </p>
      </div>

      {commonNames.length > 0 && (
        <div className="rounded-lg border border-hairline bg-surface-card px-3 py-2.5">
          <p className="text-[11px] font-medium text-muted">共同构件</p>
          <p className="mt-1 text-xs leading-relaxed text-body">{commonNames.join("、")}</p>
        </div>
      )}

      <div className="space-y-2.5">
        {variants.map((variant) => {
          const distinctNames = variant.components
            ?.map((component) => component.name)
            .filter((name) => !commonNameSet.has(name)) ?? [];
          const points = variant.differenceSummary?.length
            ? variant.differenceSummary
            : variant.description ? [variant.description] : [];

          return (
            <article key={variant.id} className="rounded-xl border border-hairline bg-surface-card p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {variant.label}
                </span>
                <h4 className="min-w-0 text-xs font-medium text-ink">{variant.title}</h4>
              </div>
              {points.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs leading-relaxed text-body">
                  {points.map((point) => <li key={point}>• {point}</li>)}
                </ul>
              )}
              {distinctNames.length > 0 && (
                <p className="mt-2 border-t border-hairline pt-2 text-[11px] leading-relaxed text-muted">
                  <span className="font-medium">区别构件：</span>{distinctNames.join("、")}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
