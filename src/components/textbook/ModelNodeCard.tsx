import { Link } from "react-router-dom";
import { getNodeDefinition } from "../../data/nodeDefinitions";

interface Props {
  nodeId: string;
  layerCount?: number;
}

export default function ModelNodeCard({ nodeId, layerCount }: Props) {
  const node = getNodeDefinition(nodeId);

  if (!node) {
    return (
      <div className="rounded-xl border border-hairline/50 bg-surface-soft/50 p-4 text-center">
        <p className="text-xs text-muted-soft">节点数据缺失</p>
      </div>
    );
  }

  return (
    <Link
      to={`/node/${node.id}`}
      className="block bg-surface-card border border-hairline rounded-xl p-4
        hover:border-primary/30 hover:shadow-sm hover:-translate-y-0.5
        transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-normal font-serif text-ink group-hover:text-primary transition-colors truncate">
            {node.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-soft bg-surface-soft px-1.5 py-0.5 rounded">
              {node.category}
            </span>
            {layerCount ? (
              <span className="text-[10px] text-muted-soft">{layerCount} 层构件</span>
            ) : null}
          </div>
        </div>
        <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1">
          交互 →
        </span>
      </div>
    </Link>
  );
}
