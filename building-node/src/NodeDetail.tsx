import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { nodesIndex } from "./data/nodesIndex";
import { useNodeStore } from "./store/nodeStore";
import { animControls } from "./components/viewer/ModelViewer";
import ModelViewer from "./components/viewer/ModelViewer";
import NodeDiagramPanel from "./components/viewer/NodeDiagramPanel";
import ConstructionKnowledgePanel from "./components/viewer/ConstructionKnowledgePanel";
import { Play, Pause, RotateCw } from "lucide-react";

/**
 * NodeDetail V1 — construction education layout.
 * Left: 520px diagram | Center: 3D (flex-1) + floating timeline | Right: 360px knowledge
 */
export default function NodeDetail() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const node = nodesIndex.find((n) => n.id === nodeId);
  const isPlaying = useNodeStore((s) => s.isPlaying);
  const animationProgress = useNodeStore((s) => s.animationProgress);
  const setIsPlaying = useNodeStore((s) => s.setIsPlaying);
  const setAnimationProgress = useNodeStore((s) => s.setAnimationProgress);

  const [autoRotate, setAutoRotate] = useState(true);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const totalDuration = 4; // 96 frames @ 24fps
  const currentTime = animationProgress * totalDuration;
  const frameCount = 96;
  const currentFrame = Math.round(animationProgress * frameCount);

  // ── Auto-advance loop ──
  const advanceFrame = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const elapsed = timestamp - lastTimeRef.current;
    const nextProgress = Math.min(animationProgress + (elapsed / 1000) / totalDuration, 1);
    setAnimationProgress(nextProgress);
    animControls.setTime(nextProgress * totalDuration);
    lastTimeRef.current = timestamp;
    if (nextProgress < 1) {
      rafRef.current = requestAnimationFrame(advanceFrame);
    } else {
      animControls.pause();
      setIsPlaying(false);
    }
  }, [animationProgress, totalDuration, setAnimationProgress, setIsPlaying]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(advanceFrame);
    } else {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, advanceFrame]);

  // ── Toggle play/pause ──
  const togglePlay = () => {
    if (isPlaying) {
      animControls.pause();
    } else {
      if (animationProgress >= 1) {
        setAnimationProgress(0);
        animControls.setTime(0);
      }
      animControls.play();
    }
  };

  // ── Slider change ──
  const onSliderChange = (value: number) => {
    setAnimationProgress(value);
    animControls.setTime(value * totalDuration);
  };

  const fmtSec = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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
        <NodeDiagramPanel
          diagramImage={
            nodeId === "roof-drainage-01" ? "/images/roof-drainage-diagram.png" : undefined
          }
        />

        {/* Center: 3D viewport + floating timeline */}
        <div className="flex-1 flex min-w-0 relative">
          <ModelViewer autoRotate={autoRotate} />

          {/* Floating timeline — centered over 3D viewport, 02-2 style */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10
              flex items-center gap-1.5 sm:gap-2
              px-2 sm:px-4 py-2 sm:py-2.5
              bg-canvas border border-hairline rounded-xl
              shadow-[0_1px_3px_rgba(20,20,19,0.08)]"
          >
            {/* Play/Pause toggle */}
            <button
              onClick={togglePlay}
              className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-200 flex-shrink-0
                ${isPlaying
                  ? "bg-primary text-on-primary"
                  : "text-muted-soft hover:text-primary hover:bg-surface-card"
                }`}
              title={isPlaying ? "暂停" : "播放"}
            >
              {isPlaying ? (
                <Pause size={14} strokeWidth={2} />
              ) : (
                <Play size={14} strokeWidth={2} fill="currentColor" />
              )}
            </button>

            {/* Frame display */}
            <span className="text-[10px] text-muted-soft tabular-nums w-11 text-right flex-shrink-0">
              {currentFrame}/{frameCount}
            </span>

            {/* Slider — sole animation driver */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={animationProgress}
              onChange={(e) => onSliderChange(Number(e.target.value))}
              className="w-14 sm:w-24 md:w-32 h-1.5 appearance-none bg-hairline rounded-full cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-primary
                [&::-webkit-slider-thumb]:shadow-sm
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:hover:scale-110"
              style={{ accentColor: "#cc785c" }}
            />

            {/* Time display */}
            <span className="text-[10px] text-muted-soft tabular-nums w-[52px] flex-shrink-0">
              {fmtSec(currentTime)}
            </span>

            {/* Auto-rotate toggle */}
            <button
              onClick={() => setAutoRotate((v) => !v)}
              className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-200 flex-shrink-0
                ${autoRotate ? "text-primary" : "text-muted-soft hover:text-primary hover:bg-surface-card"}`}
              title={autoRotate ? "停止旋转" : "自动旋转"}
            >
              <RotateCw size={15} strokeWidth={1.5} className={autoRotate ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Right: knowledge panel */}
        <ConstructionKnowledgePanel />
      </div>
    </div>
  );
}
