import CenteredDiagramImage from "./CenteredDiagramImage";
import sourceDrawings from "../../data/nodeDiagramLayouts.json";

/**
 * NodeDiagramPanel — responsive diagram panel, the primary cognitive view.
 * Displays 2D section diagram. Pure image area — layer interaction
 * belongs in ConstructionKnowledgePanel (right panel).
 */
export default function NodeDiagramPanel({ diagramImage, subtitle }: { diagramImage?: string; subtitle?: string }) {
  const drawing = sourceDrawings.find(record => diagramImage?.endsWith(record.path));
  const panelImage = drawing && diagramImage?.replace(drawing.path, drawing.panel);
  return (
    <div className="node-diagram flex flex-col min-w-0 min-h-0 bg-canvas border-r border-hairline overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-hairline">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-ink">构造图纸</h3>
            <p className="text-xs text-muted mt-0.5 leading-snug">
              {subtitle ?? "结合模型辨认构件位置与连接关系"}
            </p>
          </div>
          <span className="text-xs text-muted bg-surface-soft px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
            主认知视图
          </span>
        </div>
      </div>

      {/* Portrait plates use the available width; short windows scroll instead of shrinking labels. */}
      <div key={diagramImage} className={panelImage ? "node-diagram-sheet flex-1 min-h-0 overflow-auto p-2 md:p-3" : "flex flex-1 min-h-0 items-center justify-center overflow-hidden p-4 md:p-5"} tabIndex={panelImage ? 0 : undefined} aria-label={panelImage ? "构造图纸阅读区，可上下滚动" : undefined}>
        {diagramImage ? (
          <CenteredDiagramImage src={diagramImage} displaySrc={panelImage} fitWidth={!!panelImage} alt="构造图纸，点击查看完整图纸" openOriginal />
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
      <div className="flex-shrink-0 px-4 py-2 border-t border-hairline bg-surface-soft/50">
        <p className="text-xs text-muted text-center">
          {panelImage ? "滚动查看完整图纸 · 点击图纸查看大图" : "点击 3D 构件或右侧面板查看构造详情"}
        </p>
      </div>
    </div>
  );
}
