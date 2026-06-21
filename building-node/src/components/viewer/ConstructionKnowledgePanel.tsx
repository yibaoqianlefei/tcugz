import { useNodeStore } from "../../store/nodeStore";
import { useParams } from "react-router-dom";
import { nodesIndex } from "../../data/nodesIndex";
import { roofDrainageLayers, getLayerInfo } from "../../data/roofDrainageLayers";

/**
 * ConstructionKnowledgePanel — right panel (360px)
 * Shows node title, description, and selected object info.
 * Clicking a layer card selects the corresponding model object (reverse linkage).
 */
export default function ConstructionKnowledgePanel() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const node = nodesIndex.find((n) => n.id === nodeId);
  const selectedObject = useNodeStore((s) => s.selectedObject);
  const setSelectedObject = useNodeStore((s) => s.setSelectedObject);

  const layerInfo = selectedObject ? getLayerInfo(selectedObject) : undefined;

  return (
    <div
      className="hidden lg:flex flex-col flex-shrink-0 bg-canvas border-l border-hairline overflow-y-auto"
      style={{ width: 360 }}
    >
      {/* ── Node Info Header ── */}
      <div className="flex-shrink-0 px-5 py-5 border-b border-hairline">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-5 bg-primary rounded-full flex-shrink-0" />
          <h2 className="text-lg font-normal font-serif text-ink tracking-tight">
            {node?.title ?? "未知节点"}
          </h2>
        </div>
        {node?.description && (
          <p className="text-sm text-muted leading-relaxed">{node.description}</p>
        )}
        {node?.category && (
          <div className="mt-3">
            <span className="text-[10px] font-medium text-muted-soft uppercase tracking-wider bg-surface-card px-2 py-0.5 rounded-full">
              {node.category}
            </span>
          </div>
        )}
      </div>

      {/* ── Selected Object Detail ── */}
      <div className="flex-1 px-5 py-5">
        {selectedObject && layerInfo ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <h3 className="text-sm font-semibold text-ink">{layerInfo.name}</h3>
              <span className="text-[10px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full ml-auto">
                已选中
              </span>
            </div>

            {/* Detail fields */}
            <div className="bg-surface-card border border-hairline rounded-xl p-4 space-y-3">
              <Field label="厚度" value={layerInfo.thickness} />
              <Field label="材料" value={layerInfo.material} />
              <Field label="说明" value={layerInfo.description} />
            </div>

            {/* Deselect button */}
            <button
              onClick={() => setSelectedObject(null)}
              className="w-full py-2 rounded-lg text-xs text-muted-soft hover:text-muted hover:bg-surface-card transition-colors"
            >
              取消选中
            </button>
          </div>
        ) : selectedObject && !layerInfo ? (
          /* Object selected but no layer data mapped */
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <span className="text-sm font-semibold text-ink">{selectedObject}</span>
            </div>
            <p className="text-xs text-muted-soft">
              此构件尚未配置教学数据。
            </p>
            <button
              onClick={() => setSelectedObject(null)}
              className="w-full py-2 rounded-lg text-xs text-muted-soft hover:text-muted hover:bg-surface-card transition-colors"
            >
              取消选中
            </button>
          </div>
        ) : (
          /* ── No selection: show layer list (reverse linkage) ── */
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
              构件列表
            </h3>
            <p className="text-[10px] text-muted-soft mb-2">
              点击构件名称查看详情
            </p>

            {roofDrainageLayers.map((layer) => {
              const isActive = selectedObject === layer.objectName;
              return (
                <button
                  key={layer.objectName}
                  onClick={() => setSelectedObject(
                    isActive ? null : layer.objectName
                  )}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200
                    ${isActive
                      ? "bg-primary/5 border-primary/30 shadow-sm"
                      : "bg-surface-card border-hairline hover:border-primary/20 hover:bg-surface-cream-strong/50"
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? "bg-primary" : "bg-muted-soft"}`}
                    />
                    <span className={`text-sm font-medium ${isActive ? "text-primary" : "text-body"}`}>
                      {layer.name}
                    </span>
                  </div>
                  <div className="ml-4 flex gap-3 text-[10px] text-muted-soft">
                    <span>{layer.thickness}</span>
                    <span>{layer.material}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 px-5 py-3 border-t border-hairline">
        <p className="text-[10px] text-muted-soft text-center">
          建筑构造交互系统
        </p>
      </div>
    </div>
  );
}

/* ── Helper: detail field ── */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium text-muted-soft uppercase tracking-wider">
        {label}
      </span>
      <p className="text-sm text-body mt-0.5 leading-relaxed">{value}</p>
    </div>
  );
}
