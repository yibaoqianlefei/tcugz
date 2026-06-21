/**
 * NodeDiagramPanel — left panel (320px)
 * Placeholder for 2D section diagram. Image URL prop reserved for future use.
 */
export default function NodeDiagramPanel({ diagramImage }: { diagramImage?: string }) {
  return (
    <div
      className="hidden lg:flex flex-col flex-shrink-0 bg-canvas border-r border-hairline overflow-hidden"
      style={{ width: 320 }}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-hairline">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider">
          剖面图
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        {diagramImage ? (
          <img
            src={diagramImage}
            alt="剖面图"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            {/* Placeholder icon */}
            <div className="w-16 h-16 rounded-2xl bg-surface-card flex items-center justify-center">
              <svg
                className="w-7 h-7 text-muted-soft"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-muted">剖面图待上传</p>
              <p className="text-xs text-muted-soft mt-1 max-w-[200px]">
                后续将支持 2D 剖面图与 3D 模型联动查看
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="flex-shrink-0 px-5 py-3 border-t border-hairline">
        <p className="text-[10px] text-muted-soft text-center">
          点击 3D 构件查看详细信息
        </p>
      </div>
    </div>
  );
}
