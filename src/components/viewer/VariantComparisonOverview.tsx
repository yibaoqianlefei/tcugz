import type { NodeModelVariant } from "../../data/nodeDefinitions";

/** Readable comparison before the learner chooses an A/B/C construction. */
export default function VariantComparisonOverview({ variants }: { variants: NodeModelVariant[] }) {
  const commonNames = variants[0]?.components
    ?.map((component) => component.name)
    .filter((name) => variants.every((variant) => variant.components?.some((component) => component.name === name))) ?? [];
  const commonNameSet = new Set(commonNames);

  return (
    <section aria-label="方案对比" className="space-y-2.5">
      <div>
        <h3 className="text-sm font-medium text-ink">构造方案对比</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          比较关键差异后，选择方案查看构件与做法。
        </p>
      </div>

      {commonNames.length > 0 && (
        <div className="rounded-lg border border-hairline bg-surface-soft px-3 py-2">
          <p className="text-xs font-medium text-muted">共同构件</p>
          <p className="mt-0.5 text-xs leading-relaxed text-body">{commonNames.join("、")}</p>
        </div>
      )}

      <div className="space-y-2">
        {variants.map((variant) => {
          const distinctNames = variant.components
            ?.map((component) => component.name)
            .filter((name) => !commonNameSet.has(name)) ?? [];
          const points = variant.differenceSummary?.length
            ? variant.differenceSummary
            : variant.description ? [variant.description] : [];

          return (
            <article key={variant.id} className="rounded-lg border border-hairline bg-white p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {variant.label}
                </span>
                <h4 className="min-w-0 text-sm font-medium text-ink">{variant.title}</h4>
              </div>
              {points.length > 0 && (
                <ul className="mt-1.5 space-y-0.5 text-xs leading-relaxed text-body">
                  {points.map((point) => <li key={point}>• {point}</li>)}
                </ul>
              )}
              {distinctNames.length > 0 && (
                <p className="mt-2 border-t border-hairline pt-2 text-xs leading-relaxed text-muted">
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
