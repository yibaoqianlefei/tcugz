import { useParams, Link } from "react-router-dom";
import { nodesIndex } from "./data/nodesIndex";
import { useNodeStore } from "./store/nodeStore";
import { animControls } from "./components/viewer/ModelViewer";
import ModelViewer from "./components/viewer/ModelViewer";
import NodeDiagramPanel from "./components/viewer/NodeDiagramPanel";
import ConstructionKnowledgePanel from "./components/viewer/ConstructionKnowledgePanel";
import { Pause, Play, ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * NodeDetail — 3-column interactive construction node page.
 * Left: diagram (320px) | Center: 3D viewer (flex-1) | Right: knowledge (360px)
 */
export default function NodeDetail() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const node = nodesIndex.find((n) => n.id === nodeId);
  const isPlaying = useNodeStore((s) => s.isPlaying);
  const animationProgress = useNodeStore((s) => s.animationProgress);

  return (
    <div className="h-screen flex flex-col bg-canvas overflow-hidden">
      {/* ── Header bar ── */}
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

      {/* ── Main 3-column body ── */}
      <div className="flex-1 flex min-h-0">
        <NodeDiagramPanel />
        <ModelViewer />
        <ConstructionKnowledgePanel />
      </div>

      {/* ── Bottom animation control bar ── */}
      <footer className="flex-shrink-0 bg-canvas border-t border-hairline z-30">
        {/* Button row */}
        <div className="flex items-center justify-center gap-1.5 px-4 pt-2.5 pb-1.5">
          <button
            onClick={animControls.reset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              text-muted hover:text-primary hover:bg-surface-card transition-colors"
            title="收起 (重置动画到起点)"
          >
            <ChevronsLeft size={15} strokeWidth={1.5} />
            <span className="hidden sm:inline">收起</span>
          </button>

          <button
            onClick={animControls.play}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium
              bg-primary text-on-primary hover:bg-primary-active transition-colors shadow-sm"
            title="播放动画"
          >
            <Play size={15} strokeWidth={1.5} fill="currentColor" />
            <span className="hidden sm:inline">播放</span>
          </button>

          <button
            onClick={animControls.pause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              text-muted hover:text-primary hover:bg-surface-card transition-colors"
            title="暂停动画"
          >
            <Pause size={15} strokeWidth={1.5} />
            <span className="hidden sm:inline">暂停</span>
          </button>

          <button
            onClick={animControls.expand}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              text-muted hover:text-primary hover:bg-surface-card transition-colors"
            title="展开 (跳到动画终点)"
          >
            <ChevronsRight size={15} strokeWidth={1.5} />
            <span className="hidden sm:inline">展开</span>
          </button>

          {/* Playing indicator */}
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-hairline">
            <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-green-500 animate-pulse" : "bg-muted-soft"}`} />
            <span className="text-[10px] text-muted-soft">
              {isPlaying ? "播放中" : "已暂停"}
            </span>
          </div>
        </div>

        {/* ── Timeline slider row ── */}
        <div className="flex items-center gap-3 px-6 pb-2.5">
          <span className="text-[10px] text-muted-soft tabular-nums w-5 text-right">0</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={animationProgress}
            onChange={(e) => {
              const v = Number(e.target.value);
              animControls.setTime(v * 48); // 48 frames = clip duration
              useNodeStore.getState().setAnimationProgress(v);
            }}
            className="flex-1 h-1.5 appearance-none bg-hairline rounded-full cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-primary
              [&::-webkit-slider-thumb]:shadow-sm
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110"
            style={{ accentColor: "#cc785c" }}
          />
          <span className="text-[10px] text-muted-soft tabular-nums w-5">48</span>
          <span className="text-[10px] text-muted tabular-nums w-8 text-right">
            {Math.round(animationProgress * 100)}%
          </span>
        </div>
      </footer>
    </div>
  );
}
