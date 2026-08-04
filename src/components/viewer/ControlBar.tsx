/**
 * ControlBar — the single shared bottom control-bar shell for NodeDetail.
 *
 * BOTH single-model nodes and multi-model nodes render this same component
 * (no variant-count branching → no "advanced control bar" replacement).
 *
 * Rendering is driven exclusively by the `visible` whitelist
 * (NODE_DETAIL_PRIMARY_CONTROLS from src/utils/nodeDetailControls).  It never
 * iterates runtime capabilities, so Section / Camera Lock / axis / reverse /
 * debug controls can never appear here regardless of node type or debug flags.
 *
 * Visible surface (e706b641 "图二"):
 *   [收起] [爆炸滑块] [展开] | [重置 R] | [联动] | [光照]
 *
 * Layout is anchored to the CENTRAL 3D viewport (parent is `relative`), not
 * the browser window, and sized by content so it never spans the whole canvas.
 */

import type { ReactNode } from "react";
import { ChevronsLeft, ChevronsRight, Link2, RotateCw, Sun } from "lucide-react";
import type { NodeDetailControl } from "../../utils/nodeDetailControls";

export interface ControlBarProps {
  /** Whitelisted groups to render (NODE_DETAIL_PRIMARY_CONTROLS). */
  visible: readonly NodeDetailControl[];
  /** Explode group — disabled when the node has no interactive explode. */
  explodeDisabled: boolean;
  sliderValue: number;
  onSliderChange: (value: number) => void;
  onCollapse: () => void;
  onExpand: () => void;
  onReset: () => void;
  linkageEnabled: boolean;
  onToggleLinkage: () => void;
  showShadows: boolean;
  onToggleLighting: () => void;
}

const BTN =
  "w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center " +
  "transition-all duration-200 relative shrink-0 " +
  "text-muted-soft hover:text-primary hover:bg-hairline " +
  "disabled:opacity-30 disabled:cursor-not-allowed";

const ACTIVE = "bg-primary/10 text-primary border border-primary/30";

function Divider() {
  return <div className="w-px h-6 lg:h-7 bg-hairline shrink-0" aria-hidden="true" />;
}

export default function ControlBar(props: ControlBarProps) {
  const {
    visible,
    explodeDisabled,
    sliderValue,
    onSliderChange,
    onCollapse,
    onExpand,
    onReset,
    linkageEnabled,
    onToggleLinkage,
    showShadows,
    onToggleLighting,
  } = props;

  // Build the visible groups, then join them with dividers so no group ever
  // leaves an empty divider behind when it is not in the whitelist.
  const groups: ReactNode[] = [];

  if (visible.includes("explode")) {
    groups.push(
      <div key="explode" className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onCollapse}
          disabled={explodeDisabled}
          className={BTN}
          title="收起爆炸"
          aria-label="收起爆炸"
        >
          <ChevronsLeft size={18} className="lg:size-5" strokeWidth={1.5} />
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={sliderValue}
          onChange={(e) => onSliderChange(Number(e.target.value))}
          disabled={explodeDisabled}
          aria-label="爆炸程度"
          title="爆炸程度"
          className="w-28 sm:w-32 lg:w-40 h-6 py-1 bg-hairline rounded-full appearance-none cursor-pointer
            accent-primary shrink
            disabled:opacity-30 disabled:cursor-not-allowed
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
        <button
          type="button"
          onClick={onExpand}
          disabled={explodeDisabled}
          className={BTN}
          title="播放爆炸"
          aria-label="播放爆炸"
        >
          <ChevronsRight size={18} className="lg:size-5" strokeWidth={1.5} />
        </button>
      </div>,
    );
  }

  if (visible.includes("reset")) {
    groups.push(
      <button
        key="reset"
        type="button"
        onClick={onReset}
        className={BTN}
        title="重置 (R)"
        aria-label="重置 (R)"
      >
        <RotateCw size={18} className="lg:size-5" strokeWidth={1.5} />
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] text-muted-soft">
          R
        </span>
      </button>,
    );
  }

  if (visible.includes("link")) {
    groups.push(
      <button
        key="link"
        type="button"
        onClick={onToggleLinkage}
        aria-pressed={linkageEnabled}
        className={`${BTN} ${linkageEnabled ? ACTIVE : "border border-transparent"}`}
        title={linkageEnabled ? "联动已开启：点击关闭" : "联动已关闭：点击开启"}
        aria-label={linkageEnabled ? "联动已开启：点击关闭" : "联动已关闭：点击开启"}
      >
        <Link2 size={18} className="lg:size-5" strokeWidth={1.5} />
      </button>,
    );
  }

  if (visible.includes("lighting")) {
    groups.push(
      <button
        key="lighting"
        type="button"
        onClick={onToggleLighting}
        aria-pressed={showShadows}
        className={`${BTN} ${showShadows ? ACTIVE : "border border-transparent"}`}
        title={showShadows ? "关闭阴影" : "开启阴影"}
        aria-label={showShadows ? "关闭阴影" : "开启阴影"}
      >
        <Sun size={18} className="lg:size-5" strokeWidth={1.5} />
      </button>,
    );
  }

  return (
    <div
      role="toolbar"
      aria-label="模型控制栏"
      className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10
        flex items-center gap-1.5 sm:gap-2 lg:gap-3
        px-4 sm:px-5 lg:px-6 py-2.5 lg:py-3
        bg-canvas border border-hairline rounded-2xl shadow-sm"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {groups.map((group, i) => (
        <div key={`grp-${i}`} className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
          {i > 0 && <Divider />}
          {group}
        </div>
      ))}
    </div>
  );
}
