import { useState, useCallback } from "react";
import type { NodeModelVariant, VariantSelection } from "./variantTypes";
import { validateVariants } from "./variantTypes";
import VariantScene from "./VariantScene";
import VariantLabels from "./VariantLabels";
import VariantToolbar from "./VariantToolbar";
import VariantDiagramPanel from "./VariantDiagramPanel";
import VariantTeachingPanel from "./VariantTeachingPanel";
import VariantLoadingOverlay from "./VariantLoadingOverlay";
import { VariantErrorBoundary } from "./VariantErrorBoundary";

/* ═══════════════════════════════════════════════════════════════
   VariantModelViewer — three-column teaching layout.

   Uses CSS grid-template-areas with media queries to render
   each component EXACTLY ONCE. Layout adapts:
   - ≥1280px:  diagram | 3D viewport | teaching panel
   - 1024px:   compressed three-column
   - <1024px:  viewport full-width, diagram + teaching below
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  nodeId: string;
  nodeTitle: string;
  /** Optional overall node description from NodeDefinition. */
  nodeDescription?: string;
  variants: NodeModelVariant[];
}

export default function VariantModelViewer({
  nodeId,
  nodeTitle,
  nodeDescription,
  variants,
}: Props) {
  /* ── State ── */
  const [selection, setSelection] = useState<VariantSelection>({ mode: "all" });
  const [resetToken, setResetToken] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);

  const handleSelect = useCallback((variantId: string) => {
    setSelection({ mode: "selected", variantId });
  }, []);

  const handleShowAll = useCallback(() => {
    setSelection({ mode: "all" });
  }, []);

  const handleReset = useCallback(() => {
    setResetToken((t) => t + 1);
  }, []);

  const handleLoadProgress = useCallback((count: number) => {
    setLoadedCount(count);
  }, []);

  /* ── Validate variants (after hooks) ── */
  const validationErrors = validateVariants(variants);

  if (validationErrors.length > 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f5f5f7] gap-2 p-8">
        <p className="text-sm text-muted">该节点的多方案模型配置不完整</p>
        {import.meta.env.DEV && (
          <ul className="text-[11px] text-muted-soft mt-2 space-y-1 font-mono max-w-md">
            {validationErrors.map((e, i) => (
              <li key={i}>
                [{e.variantId}] {e.field}: {e.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  /* ── Shared viewport column ── */
  const viewportColumn = (
    <ViewportColumn
      nodeId={nodeId}
      variants={variants}
      selection={selection}
      resetToken={resetToken}
      loadedCount={loadedCount}
      onSelect={handleSelect}
      onReset={handleReset}
      onShowAll={handleShowAll}
      onLoadProgress={handleLoadProgress}
    />
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="variant-grid">
        {/* ── Left: Diagram ── */}
        <div className="va-diagram">
          <VariantDiagramPanel
            variants={variants}
            selection={selection}
            onSelect={handleSelect}
          />
        </div>

        {/* ── Center: 3D Viewport + labels + toolbar ── */}
        <div className="va-viewport">
          {viewportColumn}
        </div>

        {/* ── Right: Teaching ── */}
        <div className="va-teaching">
          <VariantTeachingPanel
            nodeTitle={nodeTitle}
            nodeDescription={nodeDescription}
            variants={variants}
            selection={selection}
            onSelect={handleSelect}
            onShowAll={handleShowAll}
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ViewportColumn — center column: Canvas + labels + toolbar
   ═══════════════════════════════════════════════════════════════ */

function ViewportColumn({
  nodeId,
  variants,
  selection,
  resetToken,
  loadedCount,
  onSelect,
  onReset,
  onShowAll,
  onLoadProgress,
}: {
  nodeId: string;
  variants: NodeModelVariant[];
  selection: VariantSelection;
  resetToken: number;
  loadedCount: number;
  onSelect: (id: string) => void;
  onReset: () => void;
  onShowAll: () => void;
  onLoadProgress: (count: number) => void;
}) {
  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 bg-[#f5f5f7]">
      {/* ── 3D Viewport ── */}
      <div className="flex-1 flex min-h-0 relative">
        <VariantErrorBoundary nodeId={nodeId}>
          <VariantScene
            variants={variants}
            resetToken={resetToken}
            onLoadProgress={onLoadProgress}
          />
        </VariantErrorBoundary>
        <VariantLoadingOverlay
          loadedCount={loadedCount}
          totalCount={variants.length}
        />
      </div>

      {/* ── Labels ── */}
      <VariantLabels
        variants={variants}
        selection={selection}
        onSelect={onSelect}
      />

      {/* ── Toolbar ── */}
      <VariantToolbar
        selection={selection}
        onReset={onReset}
        onShowAll={onShowAll}
      />
    </div>
  );
}
