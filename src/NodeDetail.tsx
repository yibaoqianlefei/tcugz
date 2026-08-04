import { useState, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getNodeDefinition } from "./data/nodeDefinitions";
import { useNodeStore } from "./store/nodeStore";
import { resumeCameraTracker } from "./utils/modelSceneRef";
import { animControls } from "./components/viewer/animationController";
import ModelViewer from "./components/viewer/ModelViewer";
import NodeDiagramPanel from "./components/viewer/NodeDiagramPanel";
import ConstructionKnowledgePanel from "./components/viewer/ConstructionKnowledgePanel";
import { useAnalysisStore } from "./store/analysisStore";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { resolveNodeModelSources } from "./utils/resolveNodeModelSources";
import { resolveVariantExplodeConfig } from "./utils/explodeLayout";
import type { ExplodeVariantConfig } from "./components/viewer/ModelViewer";
import VariantLabelBar from "./components/viewer/VariantLabelBar";
import ControlBar from "./components/viewer/ControlBar";
import { resolveVisibleControls } from "./utils/nodeDetailControls";

/**
 * NodeDetail V1 — construction education layout.
 * Left: 520px diagram | Center: 3D (flex-1) + floating timeline | Right: 360px knowledge
 *
 * 所有节点配置统一来自 src/data/nodeDefinitions.ts（单一配置源）。
 */
export default function NodeDetail() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const node = getNodeDefinition(nodeId);
  const animationProgress = useNodeStore((s) => s.animationProgress);
  const setAnimationProgress = useNodeStore((s) => s.setAnimationProgress);
  const explodeProgress = useNodeStore((s) => s.explodeProgress);
  const setExplodeProgress = useNodeStore((s) => s.setExplodeProgress);
  const activeExplodeVariantId = useNodeStore((s) => s.activeExplodeVariantId);

  const [showShadows, setShowShadows] = useState(true);
  const linkageEnabled = useNodeStore((s) => s.linkageEnabled);
  const setLinkageEnabled = useNodeStore((s) => s.setLinkageEnabled);
  const totalDuration = 4;

  // ── Reset store when switching nodes (fires before paint) ──
  useLayoutEffect(() => {
    useNodeStore.getState().resetNodeInteractionState();
    // Phase 6 Step 3: also reset Camera Lock + resume CameraTracker
    useNodeStore.getState().resetCameraLock();
    resumeCameraTracker();
  }, [nodeId]);

  // ── noAnimation nodes: set progress to 1 after reset ──
  const noAnimation = !!node?.model?.noAnimation;
  useEffect(() => {
    if (noAnimation) {
      useNodeStore.getState().setAnimationProgress(1);
    }
  }, [nodeId, noAnimation]);

  // ── Phase 6 Step 3: Escape handler (single page-level listener) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const store = useNodeStore.getState();
      if (store.cameraLockEnabled) {
        store.unlockCamera();
        store.setSelectedObject(null);
        // Section, Explode, variant, animation untouched
        return;
      }
      // Fallback: clear selection
      store.setSelectedObject(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    useNodeStore.getState().resetNodeInteractionState();
    resumeCameraTracker();
    if (node?.model?.noAnimation) {
      useNodeStore.getState().setAnimationProgress(1);
    }
    useNodeStore.getState().requestCameraRefit();
  }, [node]);

  // ── R — reset (visible on the control bar's reset button).  Hidden
  //    advanced features (X/Y/Z axis, section, reverse, camera lock, target)
  //    have no keyboard bindings, so a stray keypress can never change the
  //    model state.  Ignored while typing in inputs/textareas. ──
  useEffect(() => {
    const handleR = (e: KeyboardEvent) => {
      if (e.key !== "r" && e.key !== "R") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
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

  /* ── Resolve model sources (Phase 2: supports 1–3 models) ── */
  // Must compute BEFORE early returns (hooks ordering)
  const modelSources = node ? resolveNodeModelSources(node) : [];
  const hasModel = modelSources.length > 0;
  const isMultiModel = modelSources.length >= 2;

  /* ── Resolve explode configs (Phase 5: multi-model only) ── */
  const explodeConfigs: ExplodeVariantConfig[] | undefined = useMemo(() => {
    if (!isMultiModel || !node) return undefined;
    return modelSources.map((ms) => ({
      variantId: ms.id,
      config: resolveVariantExplodeConfig({ node, variantId: ms.id }),
    }));
  }, [isMultiModel, node, modelSources]);

  const hasExplodeConfig = isMultiModel && explodeConfigs?.some((c) => c.config.enabled);
  // activeExplodeVariantId is consumed by ModelViewer via store; read here for reactive re-render
  void activeExplodeVariantId;

  /* ── Visible control-bar whitelist — identical for single- and multi-model.
       Never widened by variant count or debug flags. ── */
  const visibleControls = resolveVisibleControls();

  /* ── Node not found ── */
  if (!node) {
    return (
      <div className="h-screen flex flex-col bg-canvas overflow-hidden items-center justify-center">
        <p className="text-muted text-lg">节点不存在</p>
        <Link to="/library" className="text-primary text-sm mt-3 hover:underline">返回节点库</Link>
      </div>
    );
  }

  /* ── Node under development ── */
  if (node.status === "development") {
    return (
      <div className="h-screen flex flex-col bg-canvas overflow-hidden items-center justify-center">
        <p className="text-muted text-lg">该节点正在开发中</p>
        <p className="text-muted-soft text-sm mt-1">{node.description}</p>
        <Link to="/library" className="text-primary text-sm mt-3 hover:underline">返回节点库</Link>
      </div>
    );
  }

  /* ── Available node — must have model & layerConfig ── */
  const { model, diagram, layerConfig } = node;

  return (
    <div className="h-screen flex flex-col bg-canvas overflow-hidden">
      {/* ── Header ── */}
      <header className="flex-shrink-0 flex items-center justify-between h-12 px-5 bg-canvas border-b border-hairline z-30">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/library" className="text-muted-soft hover:text-primary transition-colors">
            节点库
          </Link>
          <span className="text-muted-soft">›</span>
          <span className="text-muted font-medium">{node.title}</span>
        </div>
        {node.category && (
          <span className="text-[10px] font-medium text-muted-soft uppercase tracking-wider bg-surface-card px-2 py-0.5 rounded-full">
            {node.category}
          </span>
        )}
      </header>

      {/* ── Variant label bar (Phase 3: only for multi-variant nodes) ── */}
      {isMultiModel && <VariantLabelBar variants={modelSources} />}

      {/* ── Body ── */}
      <div className="flex-1 flex min-h-0">
        {/* Left: 2D diagram */}
        <NodeDiagramPanel diagramImage={diagram?.path} />

        {/* Center: 3D viewport + floating timeline */}
        <div className="flex-1 flex min-w-0 relative">
              {hasModel && layerConfig ? (
                <ErrorBoundary
                  resetKey={`${nodeId}:${isMultiModel ? "multi" : modelSources[0].src}`}
                  fallback={(opts) => (
                    <div className="flex-1 h-full flex flex-col items-center justify-center bg-[#f5f5f7] gap-2">
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
                          返回节点库
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
                    showShadows={showShadows}
                    modelPath={isMultiModel ? undefined : modelSources[0].src}
                    modelPaths={isMultiModel ? modelSources : undefined}
                    modelScale={model?.scale}
                    modelGroups={model?.groups}
                    noAnimation={node.model?.noAnimation}
                    nonInteractive={node.model?.nonInteractive}
                    explodeConfigs={explodeConfigs}
                    nodeId={nodeId}
                  />
                </ErrorBoundary>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-muted-soft text-sm">模型数据缺失</p>
                </div>
              )}

              {/* ── Bottom control bar — same shell for single- and multi-model.
                     Renders ONLY the NODE_DETAIL_PRIMARY_CONTROLS whitelist
                     (explode | reset | link | lighting).  Section / Camera Lock
                     / axis / reverse stay as runtime-only capabilities — the
                     runtimes are inert while their store flags are off. ── */}
              <ControlBar
                visible={visibleControls}
                explodeDisabled={isMultiModel ? !hasExplodeConfig : noAnimation}
                sliderValue={isMultiModel ? explodeProgress : animationProgress}
                onSliderChange={onSliderChange}
                onCollapse={handleCollapse}
                onExpand={handleExpand}
                onReset={handleReset}
                linkageEnabled={linkageEnabled}
                onToggleLinkage={() => setLinkageEnabled(!linkageEnabled)}
                showShadows={showShadows}
                onToggleLighting={() => setShowShadows((v) => !v)}
              />
        </div>

        {/* Right: knowledge panel */}
        <ConstructionKnowledgePanel />
      </div>
    </div>
  );
}
