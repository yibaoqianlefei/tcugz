/**
 * Phase 6 Step 2 — SectionControls (Canvas-external UI).
 *
 * Renders section toggle, X/Y/Z axis selectors, offset slider,
 * invert toggle, and reset button.  Only writes to nodeStore —
 * never touches THREE, materials, or the renderer.
 */

import { useNodeStore } from "../../store/nodeStore";
import type { SectionAxis } from "../../utils/sectionMath";
import { Scissors, RotateCcw } from "lucide-react";

const AXES: { key: SectionAxis; label: string }[] = [
  { key: "x", label: "X 轴" },
  { key: "y", label: "Y 轴" },
  { key: "z", label: "Z 轴" },
];

export default function SectionControls() {
  const sectionEnabled = useNodeStore((s) => s.sectionEnabled);
  const sectionAxis = useNodeStore((s) => s.sectionAxis);
  const sectionOffset = useNodeStore((s) => s.sectionOffset);
  const sectionInvert = useNodeStore((s) => s.sectionInvert);

  const setSectionEnabled = useNodeStore((s) => s.setSectionEnabled);
  const setSectionAxis = useNodeStore((s) => s.setSectionAxis);
  const setSectionOffset = useNodeStore((s) => s.setSectionOffset);
  const setSectionInvert = useNodeStore((s) => s.setSectionInvert);
  const resetSection = useNodeStore((s) => s.resetSection);

  return (
    <div
      className="flex items-center gap-0.5 sm:gap-1.5 flex-shrink-0"
      role="group"
      aria-label="剖切控制"
    >
      {/* ── Section enable / disable ── */}
      <button
        onClick={() => setSectionEnabled(!sectionEnabled)}
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center
          transition-all duration-200 relative shrink-0
          ${sectionEnabled ? "bg-primary/10 text-primary" : "text-muted-soft hover:text-primary hover:bg-hairline"}`}
        title={sectionEnabled ? "关闭剖切" : "开启剖切"}
        aria-pressed={sectionEnabled}
        aria-label={sectionEnabled ? "关闭剖切" : "开启剖切"}
      >
        <Scissors size={14} className="sm:size-[16px]" strokeWidth={1.5} />
      </button>

      {/* ── Divider ── */}
      <div className="w-px h-5 bg-hairline mx-0.5 shrink-0" />

      {/* ── Axis selectors ── */}
      {AXES.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setSectionAxis(key)}
          disabled={!sectionEnabled}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center
            text-[10px] sm:text-xs font-medium
            transition-all duration-200 relative shrink-0
            disabled:opacity-30 disabled:cursor-not-allowed
            ${sectionAxis === key && sectionEnabled
              ? "bg-primary/10 text-primary border border-primary/30"
              : "text-muted-soft hover:text-primary hover:bg-hairline border border-transparent"
            }`}
          title={`剖切轴: ${label}`}
          aria-pressed={sectionAxis === key && sectionEnabled}
          aria-label={`剖切轴 ${label}`}
        >
          {label}
        </button>
      ))}

      {/* ── Divider ── */}
      <div className="w-px h-5 bg-hairline mx-0.5 shrink-0" />

      {/* ── Offset slider ── */}
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={sectionOffset}
        onChange={(e) => setSectionOffset(Number(e.target.value))}
        disabled={!sectionEnabled}
        aria-label="剖切位置"
        title="剖切位置"
        className="w-10 sm:w-16 h-6 py-1 bg-hairline rounded-full appearance-none cursor-pointer
          accent-primary shrink-0
          disabled:opacity-30 disabled:cursor-not-allowed
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-white
          [&::-webkit-slider-thumb]:border-2
          [&::-webkit-slider-thumb]:border-primary/30
          [&::-webkit-slider-thumb]:shadow-sm
          [&::-webkit-slider-thumb]:hover:border-primary
          [&::-webkit-slider-thumb]:transition-colors"
        style={{ touchAction: "none" }}
      />

      {/* ── Invert toggle ── */}
      <button
        onClick={() => setSectionInvert(!sectionInvert)}
        disabled={!sectionEnabled}
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center
          text-[10px] sm:text-xs font-medium
          transition-all duration-200 relative shrink-0
          disabled:opacity-30 disabled:cursor-not-allowed
          ${sectionInvert && sectionEnabled
            ? "bg-primary/10 text-primary border border-primary/30"
            : "text-muted-soft hover:text-primary hover:bg-hairline border border-transparent"
          }`}
        title="反转剖切方向"
        aria-pressed={sectionInvert && sectionEnabled}
        aria-label="反转剖切方向"
      >
        反
      </button>

      {/* ── Divider ── */}
      <div className="w-px h-5 bg-hairline mx-0.5 shrink-0" />

      {/* ── Reset ── */}
      <button
        onClick={resetSection}
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center
          transition-all duration-200 relative shrink-0
          text-muted-soft hover:text-primary hover:bg-hairline`}
        title="重置剖切"
        aria-label="重置剖切"
      >
        <RotateCcw size={12} className="sm:size-[14px]" strokeWidth={1.5} />
      </button>
    </div>
  );
}
