import { useState, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getNodeDefinition } from "./data/nodeDefinitions";
import { useNodeStore } from "./store/nodeStore";
import { animControls } from "./components/viewer/animationController";
import ModelViewer from "./components/viewer/ModelViewer";
import NodeDiagramPanel from "./components/viewer/NodeDiagramPanel";
import ConstructionKnowledgePanel from "./components/viewer/ConstructionKnowledgePanel";
import { useAnalysisStore } from "./store/analysisStore";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { resolveNodeModelSources } from "./utils/resolveNodeModelSources";
import { resolveVariantExplodeConfig } from "./utils/explodeLayout";
import type { ExplodeVariantConfig } from "./components/viewer/ModelViewer";
import ControlBar from "./components/viewer/ControlBar";
import { resolveVisibleControls } from "./utils/nodeDetailControls";
import { useNodePanelLayout } from "./components/viewer/useNodePanelLayout";
import { Images, Maximize2, X } from "lucide-react";

/**
 * Responsive construction education layout with adjustable desktop panels.
 *
 * 所有节点配置统一来自 src/data/nodeDefinitions.ts（单一配置源）。
 */
export default function NodeDetail() {
  const { nodeId } = useParams<{ nodeId: string }>();
  return <NodeDetailContent key={nodeId ?? "missing"} nodeId={nodeId} />;
}

function NodeDetailContent({ nodeId }: { nodeId: string | undefined }) {
  const node = getNodeDefinition(nodeId);
  const animationProgress = useNodeStore((s) => s.animationProgress);
  const setAnimationProgress = useNodeStore((s) => s.setAnimationProgress);
  const explodeProgress = useNodeStore((s) => s.explodeProgress);
  const setExplodeProgress = useNodeStore((s) => s.setExplodeProgress);
  const activeExplodeVariantId = useNodeStore((s) => s.activeExplodeVariantId);

  // Each node visit starts with shadows off; the control bar can enable them on demand.
  const [showShadows, setShowShadows] = useState(false);
  const linkageEnabled = useNodeStore((s) => s.linkageEnabled);
  const setLinkageEnabled = useNodeStore((s) => s.setLinkageEnabled);
  // ── Rotation toggle — single source consumed by ModelViewer's autoRotate
  //    prop (OrbitControls for single-model, self-rotation useFrame for
  //    multi-model).  Reset to the product default by resetNodeInteractionState
  //    on node switch / R. ──
  const autoRotate = useNodeStore((s) => s.autoRotate);
  const setAutoRotate = useNodeStore((s) => s.setAutoRotate);
  const totalDuration = 4;
  const { setContainer, preset: layoutPreset, isResizing, selectPreset, adjust: adjustPanel, beginDrag } = useNodePanelLayout();
  const [diagramOpen, setDiagramOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"diagram" | "model" | "knowledge">("model");

  // ── Reset store when switching nodes (fires before paint) ──
  useLayoutEffect(() => {
    useNodeStore.getState().resetNodeInteractionState();
  }, [nodeId]);

  // ── noAnimation nodes: set progress to 1 after reset ──
  const noAnimation = !!node?.model?.noAnimation;

  /* ── Resolve model sources (Phase 2: supports 1–3 models) ── */
  // Must compute BEFORE early returns (hooks ordering) — also used by the
  // reset handler below.
  const modelSources = useMemo(() => node ? resolveNodeModelSources(node) : [], [node]);
  const hasModel = modelSources.length > 0;
  const isMultiModel = modelSources.length >= 2;
  const knowledgeNamesByVariant = useMemo(
    () => Object.fromEntries((node?.variants ?? []).map((variant) => [
      variant.id,
      (variant.componentKnowledge ?? []).flatMap((entry) => [entry.objectName, ...(entry.aliases ?? [])]),
    ])),
    [node],
  );

  useEffect(() => {
    if (noAnimation) {
      useNodeStore.getState().setAnimationProgress(1);
    }
  }, [nodeId, noAnimation]);

  // ── Escape handler (single page-level listener) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (diagramOpen) { setDiagramOpen(false); return; }
      // Clear selection
      useNodeStore.getState().setSelectedObject(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [diagramOpen]);

  // ── Track visited node (only record valid nodes) ──
  const addVisitedNode = useAnalysisStore((s) => s.addVisitedNode);
  useEffect(() => {
    if (nodeId && node) addVisitedNode(nodeId);
  }, [nodeId, node, addVisitedNode]);

  // ── Collapse (收拢) — multi-model drives the established explodeProgress
  //    (no algorithm rewrite); single-model reverses the AnimationMixer. ──
  const handleCollapse = () => {
    if (isMultiModel) {
      setExplodeProgress(0);
      return;
    }
    if (noAnimation) return;
    if (animationProgress <= 0) return;
    animControls.playReverse();
  };

  // ── Expand (展开) — multi-model drives explodeProgress to 1. ──
  const handleExpand = () => {
    if (isMultiModel) {
      setExplodeProgress(1);
      return;
    }
    if (noAnimation) return;
    if (animationProgress >= 1) {
      setAnimationProgress(0);
      animControls.setTime(0);
    }
    animControls.play();
  };

  // ── Reset (R) — restore the initial interaction state without touching the
  //    unified model scale / layoutX / spacing.  Clears selection, explosion
  //    and section/lock state, then asks CameraTracker to re-apply the initial
  //    composition (the multi-model union-box fit reproduces the approved
  //    framing — it does not change the fit definition). ──
  const handleReset = useCallback(() => {
    // Animated single-model: stop playback and rewind the REAL AnimationMixer
    // to frame 0 first, so the pose actually returns to the start and the
    // store progress (set to 0 below) is not bounced back by the next frame.
    if (!isMultiModel && !noAnimation) {
      animControls.rewindToStart();
    }
    useNodeStore.getState().resetNodeInteractionState();
    if (noAnimation) {
      useNodeStore.getState().setAnimationProgress(1);
    }
    useNodeStore.getState().requestCameraRefit();
  }, [isMultiModel, noAnimation]);

  // ── R — reset keyboard shortcut (the control-bar R button UI is removed,
  //    but the shortcut stays).  Hidden advanced features (X/Y/Z axis,
  //    section, reverse, camera lock, target) have no keyboard bindings, so a
  //    stray keypress can never change the model state.  Ignored while TYPING
  //    in a text-entry input/textarea, but NOT while a range slider is
  //    focused — after scrubbing the explode slider, R must still reset to
  //    the initial state. ──
  useEffect(() => {
    const handleR = (e: KeyboardEvent) => {
      if (e.key !== "r" && e.key !== "R") return;
      const target = e.target as HTMLElement | null;
      if (!target || target.isContentEditable) return;
      const tag = target.tagName;
      if (tag === "TEXTAREA") return;
      if (tag === "INPUT") {
        const type = target.getAttribute("type") ?? "text";
        // Only text-entry inputs swallow R (typing); range/number/checkbox do not.
        if (["text", "search", "number", "email", "password", "tel", "url"].includes(type)) return;
      }
      e.preventDefault();
      handleReset();
    };
    window.addEventListener("keydown", handleR);
    return () => window.removeEventListener("keydown", handleR);
  }, [handleReset]);

  // ── Slider change — routes to explodeProgress or animationProgress ──
  const onSliderChange = (value: number) => {
    if (isMultiModel) {
      setExplodeProgress(value);
      return;
    }
    if (noAnimation) return;
    animControls.pause();
    setAnimationProgress(value);
    animControls.setTime(value * totalDuration);
  };

  /* ── Resolve explode configs (Phase 5: multi-model only) ── */
  const explodeConfigs: ExplodeVariantConfig[] | undefined = useMemo(() => {
    if (!isMultiModel || !node) return undefined;
    return modelSources.map((ms) => ({
      variantId: ms.id,
      config: resolveVariantExplodeConfig({ node, variantId: ms.id }),
    }));
  }, [isMultiModel, node, modelSources]);

  const activeExplodeEnabled = !!activeExplodeVariantId && !!explodeConfigs?.some(
    (entry) => entry.variantId === activeExplodeVariantId && entry.config.enabled,
  );

  /* ── Visible control-bar whitelist — identical for single- and multi-model.
       Never widened by variant count or debug flags. ── */
  const visibleControls = resolveVisibleControls();

  /* ── Node not found ── */
  if (!node) {
    return (
      <div className="node-detail-page flex flex-col bg-canvas overflow-hidden items-center justify-center">
        <p className="text-muted text-lg">节点不存在</p>
        <Link to="/library" className="text-primary text-sm mt-3 hover:underline">返回构造节点</Link>
      </div>
    );
  }

  /* ── Node under development ── */
  if (node.status === "development") {
    return (
      <div className="node-detail-page flex flex-col bg-canvas overflow-hidden items-center justify-center">
        <p className="text-muted text-lg">该节点正在开发中</p>
        <p className="text-muted-soft text-sm mt-1">{node.description}</p>
        <Link to="/library" className="text-primary text-sm mt-3 hover:underline">返回构造节点</Link>
      </div>
    );
  }

  /* ── Available node — must have model & layerConfig ── */
  const { model, diagram, layerConfig } = node;

  return (
    <div className="node-detail-page flex flex-col bg-canvas overflow-hidden">
      {/* ── Header ── */}
      <header className="flex-shrink-0 flex items-center justify-between gap-3 min-h-12 px-4 md:px-5 bg-canvas border-b border-hairline z-20">
        <div className="flex items-center gap-2 text-sm min-w-0">
          <Link to="/library" className="text-muted-soft hover:text-primary transition-colors">
            构造节点
          </Link>
          <span className="text-muted-soft">›</span>
          <span className="text-muted font-medium truncate">{node.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => setDiagramOpen(true)} className="node-tablet-diagram-button items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-xs text-muted hover:text-primary" aria-label="查看构造剖面图">
            <Images size={15} /> 图纸
          </button>
          <div className="node-layout-presets items-center gap-1 rounded-lg border border-hairline bg-surface-soft/50 p-0.5" role="group" aria-label="三栏布局预设">
            {([ ["balanced", "均衡"], ["model", "专注模型"], ["diagram", "专注图纸"] ] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => selectPreset(value)} aria-pressed={layoutPreset === value} className={`rounded-md px-2 py-1 text-[11px] whitespace-nowrap transition-colors ${layoutPreset === value ? "bg-canvas text-primary shadow-sm" : "text-muted-soft hover:text-muted"}`}>{label}</button>
            ))}
          </div>
          {node.category && <span className="hidden sm:inline text-[10px] font-medium text-muted-soft uppercase tracking-wider bg-surface-card px-2 py-0.5 rounded-full">{node.category}</span>}
        </div>
      </header>

      <div className="node-mobile-tabs" role="tablist" aria-label="节点内容">
        {([ ["diagram", "图纸"], ["model", "3D 模型"], ["knowledge", "构件知识"] ] as const).map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={mobileTab === value} onClick={() => setMobileTab(value)} className={mobileTab === value ? "active" : ""}>{label}</button>
        ))}
      </div>

      {/* ── Body ── */}
      <div ref={setContainer} className="node-detail-grid flex-1 min-h-0" data-diagram-open={diagramOpen} data-mobile-tab={mobileTab}>
        {diagramOpen && <button type="button" className="node-diagram-backdrop" onClick={() => setDiagramOpen(false)} aria-label="关闭图纸面板" />}
        {/* Left: 2D diagram */}
        <NodeDiagramPanel diagramImage={diagram?.path} subtitle={diagram?.subtitle} />

        <button type="button" className="node-diagram-close" onClick={() => setDiagramOpen(false)} aria-label="关闭图纸面板" title="关闭图纸面板"><X size={18} /></button>

        <div className="node-divider node-divider-left" role="separator" aria-label="调整图纸与模型宽度" aria-orientation="vertical" tabIndex={0} onPointerDown={(e) => beginDrag("left", e)} onKeyDown={(e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); adjustPanel("left", e.key === "ArrowRight" ? 16 : -16); } }} />

        {/* Center: 3D viewport + floating timeline */}
        <div className="node-viewport flex min-w-0 min-h-0 relative">
              <button type="button" className="node-fit-button absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas/90 px-2.5 py-1.5 text-xs text-muted hover:text-primary shadow-sm" onClick={() => useNodeStore.getState().requestCameraRefit()} title="重新适配模型视图" aria-label="适配模型视图"><Maximize2 size={14} /> <span>适配视图</span></button>
              {hasModel && layerConfig ? (
                <ErrorBoundary
                  resetKey={`${nodeId}:${isMultiModel ? "multi" : modelSources[0].src}`}
                  fallback={(opts) => (
                    <div className="flex-1 h-full flex flex-col items-center justify-center bg-surface-soft gap-2">
                      <p className="text-sm text-muted">3D 模型加载失败</p>
                      <p className="text-xs text-muted-soft">模型资源暂时无法显示</p>
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={() => window.location.reload()}
                          className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium
                            hover:bg-primary-active transition-colors"
                        >
                          刷新页面
                        </button>
                        <Link
                          to="/library"
                          className="px-4 py-2 rounded-lg border border-hairline text-xs text-muted
                            hover:text-primary hover:border-primary/30 transition-colors"
                        >
                          返回构造节点
                        </Link>
                      </div>
                      {import.meta.env.DEV && (
                        <p className="text-[11px] text-muted-soft mt-3 font-mono max-w-md text-center break-all">
                          {opts.error.message}
                        </p>
                      )}
                    </div>
                  )}
                >
                  <ModelViewer
                    key={nodeId}
                    suspendResponsiveFit={isResizing}
                    showShadows={showShadows}
                    modelPath={isMultiModel ? undefined : modelSources[0].src}
                    modelPaths={isMultiModel ? modelSources : undefined}
                    modelScale={model?.scale}
                    modelGroups={model?.groups}
                    noAnimation={node.model?.noAnimation}
                    nonInteractive={node.model?.nonInteractive}
                    explodeConfigs={explodeConfigs}
                    knowledgeNamesByVariant={knowledgeNamesByVariant}
                    nodeId={nodeId}
                    autoRotate={autoRotate}
                  />
                </ErrorBoundary>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-muted-soft text-sm">模型数据缺失</p>
                </div>
              )}

              {/* ── Bottom control bar — same shell for single- and multi-model.
                     Renders ONLY the NODE_DETAIL_PRIMARY_CONTROLS whitelist
                     (explode | rotate | link | lighting).  Section / Camera Lock
                     / axis / reverse stay as runtime-only capabilities — the
                     runtimes are inert while their store flags are off. ── */}
              <ControlBar
                visible={visibleControls}
                explodeDisabled={isMultiModel ? !activeExplodeEnabled : noAnimation}
                sliderValue={isMultiModel ? explodeProgress : animationProgress}
                onSliderChange={onSliderChange}
                onCollapse={handleCollapse}
                onExpand={handleExpand}
                autoRotate={autoRotate}
                onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
                linkageEnabled={linkageEnabled}
                onToggleLinkage={() => setLinkageEnabled(!linkageEnabled)}
                showShadows={showShadows}
                onToggleLighting={() => setShowShadows((v) => !v)}
              />
        </div>

        <div className="node-divider node-divider-right" role="separator" aria-label="调整模型与知识宽度" aria-orientation="vertical" tabIndex={0} onPointerDown={(e) => beginDrag("right", e)} onKeyDown={(e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); adjustPanel("right", e.key === "ArrowRight" ? 16 : -16); } }} />

        {/* Right: knowledge panel */}
        <ConstructionKnowledgePanel isResizing={isResizing} />
      </div>
    </div>
  );
}
