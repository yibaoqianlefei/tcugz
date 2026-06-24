import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { nodesIndex } from "./data/nodesIndex";
import { useNodeStore } from "./store/nodeStore";
import { animControls } from "./components/viewer/ModelViewer";
import ModelViewer from "./components/viewer/ModelViewer";
import NodeDiagramPanel from "./components/viewer/NodeDiagramPanel";
import ConstructionKnowledgePanel from "./components/viewer/ConstructionKnowledgePanel";
import { RotateCw, ChevronsLeft, ChevronsRight, Sun } from "lucide-react";
import { useAnalysisStore } from "./store/analysisStore";

/* ── Model path lookup ──────────────────────────────────────── */
const MODEL_PATHS: Record<string, string> = {
  "flat-roof-01": "/models/flat-roof/flat-roof.glb",
  "organized-drainage-01": "/models/organized-drainage/organized-drainage.glb",
  "roof-drainage-01": "/models/roof-drainage/roof-drainage.glb",
};

const DIAGRAM_IMAGES: Record<string, string> = {
  "roof-drainage-01": "/images/roof-drainage-diagram.png",
  "organized-drainage-01": "/images/organized-drainage-diagram.png",
};

function getModelPath(nodeId: string): string {
  return MODEL_PATHS[nodeId] ?? "/models/roof-drainage/roof-drainage.glb";
}
function getDiagramImage(nodeId: string): string | undefined {
  return DIAGRAM_IMAGES[nodeId];
}

/**
 * NodeDetail V1 — construction education layout.
 * Left: 520px diagram | Center: 3D (flex-1) + floating timeline | Right: 360px knowledge
 */
export default function NodeDetail() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const node = nodesIndex.find((n) => n.id === nodeId);
  const animationProgress = useNodeStore((s) => s.animationProgress);
  const setAnimationProgress = useNodeStore((s) => s.setAnimationProgress);

  const [autoRotate, setAutoRotate] = useState(true);
  const [showShadows, setShowShadows] = useState(true);
  const totalDuration = 4; // 96 frames @ 24fps

  // ── Tracking: record node visit ──
  const addVisitedNode = useAnalysisStore((s) => s.addVisitedNode);
  useEffect(() => {
    if (nodeId) addVisitedNode(nodeId);
  }, [nodeId, addVisitedNode]);

  // ── Play explosion (forward) ──
  const playExplosion = () => {
    if (animationProgress >= 1) {
      setAnimationProgress(0);
      animControls.setTime(0);
    }
    animControls.play();
  };

  // ── Collapse explosion (reverse playback) ──
  const collapseExplosion = () => {
    if (animationProgress <= 0) return;
    animControls.playReverse();
  };

  // ── Slider change ──
  const onSliderChange = (value: number) => {
    animControls.pause();
    setAnimationProgress(value);
    animControls.setTime(value * totalDuration);
  };

  return (
    <div className="h-screen flex flex-col bg-canvas overflow-hidden">
      {/* ── Header ── */}
      <header className="flex-shrink-0 flex items-center justify-between h-12 px-5 bg-canvas border-b border-hairline z-30">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/library" className="text-muted-soft hover:text-primary transition-colors">
            节点库
          </Link>
          <span className="text-muted-soft">›</span>
          <span className="text-muted font-medium">{node?.title ?? "未知节点"}</span>
        </div>
        {node?.category && (
          <span className="text-[10px] font-medium text-muted-soft uppercase tracking-wider bg-surface-card px-2 py-0.5 rounded-full">
            {node.category}
          </span>
        )}
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex min-h-0">
        {/* Left: 2D diagram */}
        <NodeDiagramPanel diagramImage={getDiagramImage(nodeId!)} />

        {/* Center: 3D viewport + floating timeline */}
        <div className="flex-1 flex min-w-0 relative">
          <ModelViewer
            autoRotate={autoRotate}
            showShadows={showShadows}
            modelPath={getModelPath(nodeId!)}
          />

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
