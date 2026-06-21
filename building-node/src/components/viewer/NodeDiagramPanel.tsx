/**
 * NodeDiagramPanel — left panel (520px), the primary cognitive view.
 * Displays 2D section diagram. Pure image area — layer interaction
 * belongs in ConstructionKnowledgePanel (right panel).
 */
export default function NodeDiagramPanel({ diagramImage }: { diagramImage?: string }) {

  return (
    <div
      className="hidden lg:flex flex-col flex-shrink-0 bg-canvas border-r border-hairline overflow-hidden"
      style={{ width: 520 }}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-hairline">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-ink">构造剖面图</h3>
            <p className="text-[11px] text-muted-soft mt-0.5">
              由上至下：保护层 → 结构层
            </p>
          </div>
          <span className="text-[10px] text-muted-soft bg-surface-card px-2 py-0.5 rounded-full">
            主认知视图
          </span>
        </div>
      </div>

      {/* Diagram area — image only */}
      <div className="flex-1 flex items-center justify-center p-6">
        {diagramImage ? (
          <img
            src={diagramImage}
            alt="剖面图"
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-center max-w-[280px]">
            <div className="w-20 h-20 rounded-2xl bg-surface-card flex items-center justify-center">
              <svg
                className="w-8 h-8 text-muted-soft"
                fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-muted">剖面图待上传</p>
              <p className="text-xs text-muted-soft mt-1.5 leading-relaxed">
                上传 2D 构造剖面图后，将在此区域展示完整的建筑构造层级关系
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-hairline bg-surface-soft/50">
        <p className="text-[10px] text-muted-soft text-center">
          点击 3D 构件或右侧面板查看构造详情
        </p>
      </div>
    </div>
  );
}
