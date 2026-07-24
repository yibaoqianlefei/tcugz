import { useState, useEffect, useLayoutEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getNodeDefinition } from "./data/nodeDefinitions";
import { useNodeStore } from "./store/nodeStore";
import { animControls } from "./components/viewer/animationController";
import ModelViewer from "./components/viewer/ModelViewer";
import NodeDiagramPanel from "./components/viewer/NodeDiagramPanel";
import ConstructionKnowledgePanel from "./components/viewer/ConstructionKnowledgePanel";
import { RotateCw, ChevronsLeft, ChevronsRight, Sun, Link2 } from "lucide-react";
import { useAnalysisStore } from "./store/analysisStore";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { resolveNodeModelSources } from "./utils/resolveNodeModelSources";

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

  const [autoRotate, setAutoRotate] = useState(true);
  const [showShadows, setShowShadows] = useState(true);
  const linkageEnabled = useNodeStore((s) => s.linkageEnabled);
  const setLinkageEnabled = useNodeStore((s) => s.setLinkageEnabled);
  const totalDuration = 4; // 96 frames @ 24fps

  // ── Reset store when switching nodes (fires before paint) ──
  useLayoutEffect(() => {
    useNodeStore.getState().resetNodeInteractionState();
  }, [nodeId]);

  // ── noAnimation nodes: set progress to 1 after reset ──
  const noAnimation = !!node?.model?.noAnimation;
  useEffect(() => {
    if (noAnimation) {
      useNodeStore.getState().setAnimationProgress(1);
    }
  }, [nodeId, noAnimation]);

  // ── Track visited node (only record valid nodes) ──
  const addVisitedNode = useAnalysisStore((s) => s.addVisitedNode);
  useEffect(() => {
    if (nodeId && node) addVisitedNode(nodeId);
  }, [nodeId, node, addVisitedNode]);

  // ── Play explosion (forward) — locked for noAnimation nodes ──
  const playExplosion = () => {
    if (noAnimation) return;
    if (animationProgress >= 1) {
      setAnimationProgress(0);
      animControls.setTime(0);
    }
    animControls.play();
  };

  // ── Collapse explosion (reverse playback) — locked for noAnimation nodes ──
  const collapseExplosion = () => {
    if (noAnimation) return;
    if (animationProgress <= 0) return;
    animControls.playReverse();
  };

  // ── Slider change — locked for noAnimation nodes ──
  const onSliderChange = (value: number) => {
    if (noAnimation) return;
    animControls.pause();
    setAnimationProgress(value);
    animControls.setTime(value * totalDuration);
  };

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

  /* ── Resolve model sources (Phase 2: supports 1–3 models) ── */
  const modelSources = resolveNodeModelSources(node);
  const hasModel = modelSources.length > 0;
  const isMultiModel = modelSources.length >= 2;

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
                    autoRotate={autoRotate}
                    showShadows={showShadows}
                    modelPath={isMultiModel ? undefined : modelSources[0].src}
                    modelPaths={isMultiModel ? modelSources : undefined}
                    modelScale={model?.scale}
                    modelGroups={model?.groups}
                    noAnimation={node.model?.noAnimation}
                    nonInteractive={node.model?.nonInteractive}
                  />
                </ErrorBoundary>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-muted-soft text-sm">模型数据缺失</p>
                </div>
              )}

              {/* Floating timeline — 02-2 style */}
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10
                  flex items-center gap-0.5 sm:gap-2
                  px-2 sm:px-4 py-2 sm:py-2.5
                  bg-canvas border border-hairline rounded-xl"
                onPointerDown={(e) => e.stopPropagation()}
              >
            {/* ── Collapse ── */}
            <button
              onClick={collapseExplosion}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center
                text-muted-soft hover:text-primary hover:bg-hairline
                transition-all duration-200 relative shrink-0"
              title="收起爆炸"
            >
              <ChevronsLeft size={16} className="sm:size-[18px]" strokeWidth={1.5} />
            </button>

            {/* ── Slider ── */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={animationProgress}
              onChange={(e) => onSliderChange(Number(e.target.value))}
              className="w-14 sm:w-24 md:w-32 h-6 py-1 bg-hairline rounded-full appearance-none cursor-pointer
                accent-primary shrink
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                sm:[&::-webkit-slider-thumb]:w-4 sm:[&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-primary/30
                [&::-webkit-slider-thumb]:shadow-sm
                [&::-webkit-slider-thumb]:hover:border-primary
                [&::-webkit-slider-thumb]:transition-colors"
              style={{ touchAction: "none" }}
            />

            {/* ── Play explosion ── */}
            <button
              onClick={playExplosion}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center
                text-muted-soft hover:text-primary hover:bg-hairline
                transition-all duration-200 relative shrink-0"
              title="播放爆炸"
            >
              <ChevronsRight size={16} className="sm:size-[18px]" strokeWidth={1.5} />
            </button>

            {/* ── Divider ── */}
            <div className="w-px h-5 bg-hairline mx-0.5 sm:mx-1 shrink-0" />

            {/* ── Auto-rotate toggle ── */}
            <button
              onClick={() => setAutoRotate((v) => !v)}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center
                transition-all duration-300 relative shrink-0
                ${autoRotate ? "bg-hairline" : ""}`}
              title={autoRotate ? "暂停旋转 (R)" : "自动旋转 (R)"}
            >
              <RotateCw
                size={16}
                className={`sm:size-[18px] transition-colors duration-300 ${
                  autoRotate ? "text-primary" : "text-muted-soft"
                }`}
                strokeWidth={1.5}
                style={{ animation: autoRotate ? "spin 3s linear infinite" : "none" }}
              />
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] text-muted-soft hidden sm:block">R</span>
            </button>

            {/* ── Divider ── */}
            <div className="w-px h-5 bg-hairline mx-0.5 sm:mx-1 shrink-0" />

            {/* ── Linkage toggle ── */}
            <button
              onClick={() => setLinkageEnabled(!linkageEnabled)}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center
                transition-all duration-300 relative shrink-0
                ${linkageEnabled ? "bg-hairline" : ""}`}
              title={linkageEnabled ? "联动已开启：点击关闭" : "联动已关闭：点击开启"}
            >
              <Link2
                size={16}
                className={`sm:size-[18px] transition-colors duration-300 ${
                  linkageEnabled ? "text-primary" : "text-muted-soft"
                }`}
                strokeWidth={1.5}
              />
            </button>

            {/* ── Divider ── */}
            <div className="w-px h-5 bg-hairline mx-0.5 sm:mx-1 shrink-0" />

            {/* ── Shadow toggle ── */}
            <button
              onClick={() => setShowShadows((v) => !v)}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center
                transition-all duration-300 relative shrink-0
                ${showShadows ? "bg-hairline" : ""}`}
              title={showShadows ? "关闭阴影" : "开启阴影"}
            >
              <Sun
                size={16}
                className={`sm:size-[18px] transition-colors duration-300 ${
                  showShadows ? "text-primary" : "text-muted-soft"
                }`}
                strokeWidth={1.5}
              />
            </button>
          </div>
        </div>

        {/* Right: knowledge panel */}
        <ConstructionKnowledgePanel />
      </div>
    </div>
  );
}
