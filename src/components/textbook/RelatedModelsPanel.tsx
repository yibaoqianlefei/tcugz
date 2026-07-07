import ModelNodeCard from "./ModelNodeCard";

interface Props {
  nodeIds?: string[];
}

/**
 * Right-side panel showing chapter-related 3D construction models.
 * Accepts optional nodeIds from chapter config, falls back to empty.
 */
export default function RelatedModelsPanel({ nodeIds }: Props) {
  const ids = nodeIds ?? [];
  const displayIds = ids.slice(0, 5);

  return (
    <section className="mb-8">
      <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">
        本章相关构造模型
      </h3>
      {displayIds.length > 0 ? (
        <div className="space-y-2.5">
          {displayIds.map((id) => (
            <ModelNodeCard key={id} nodeId={id} />
          ))}
          {ids.length > 5 && (
            <p className="text-xs text-muted-soft text-center mt-2">
              共 {ids.length} 个模型，已显示前 5 个
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-soft leading-relaxed">
          暂无关联的 3D 构造模型
        </p>
      )}
    </section>
  );
}
