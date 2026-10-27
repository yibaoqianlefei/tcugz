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
 * Visible surface:
 *   [收起] [爆炸滑块] [展开] | [旋转] | [透视] | [独立展示] | [联动] | [光照]
 *
 * Layout is anchored to the CENTRAL 3D viewport (parent is `relative`), not
 * the browser window, and sized by content so it never spans the whole canvas.
 */

import type { ReactNode } from "react";
import { BoxSelect, ChevronsLeft, ChevronsRight, Link2, Rotate3d, ScanEye, Sun } from "lucide-react";
import type { NodeDetailControl } from "../../utils/nodeDetailControls";
import '../../styles/model-ui.css';

export interface ControlBarProps {
  placement?: 'overlay' | 'flow';
  leadingControls?: ReactNode;
  rotationDisabled?: boolean;
  xrayEnabled?: boolean;
  xrayDisabled?: boolean;
  onToggleXray?: () => void;
  isolateSelection?: boolean;
  onToggleIsolation?: () => void;
  /** Whitelisted groups to render (NODE_DETAIL_PRIMARY_CONTROLS). */
  visible: readonly NodeDetailControl[];
  /** Explode group — disabled when the node has no interactive explode. */
  explodeDisabled: boolean;
  sliderValue: number;
  onSliderChange: (value: number) => void;
  onCollapse: () => void;
  onExpand: () => void;
  /** Rotation toggle — true while the model auto-rotates (pressed/active). */
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  linkageEnabled: boolean;
  onToggleLinkage: () => void;
  showShadows: boolean;
  onToggleLighting: () => void;
}

const BTN =
  "site-tool-button node-control-button model-control-button";

const ACTIVE = "is-active";

function Divider() {
  return <div className="model-control-divider" aria-hidden="true" />;
}

export default function ControlBar(props: ControlBarProps) {
  const {
    visible,
    explodeDisabled,
    sliderValue,
    onSliderChange,
    onCollapse,
    onExpand,
    autoRotate,
    onToggleAutoRotate,
    linkageEnabled,
    onToggleLinkage,
    showShadows,
    onToggleLighting,
    placement = 'overlay',
    rotationDisabled = false,
    leadingControls,
    xrayEnabled = false,
    xrayDisabled = false,
    onToggleXray,
    isolateSelection = false,
    onToggleIsolation,
  } = props;

  // Build the visible groups, then join them with dividers so no group ever
  // leaves an empty divider behind when it is not in the whitelist.
  const groups: Array<{ id: string; element: ReactNode }> = [];
  const addGroup = (id: string, element: ReactNode) => groups.push({ id, element });
  if (leadingControls) addGroup('leading', leadingControls);

  if (visible.includes("explode")) {
    addGroup('explode',
      <div key="explode" className="model-explode-controls">
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
          aria-valuetext={`已展开 ${Math.round(sliderValue * 100)}%`}
          title="爆炸程度"
          className="node-explode-slider model-explode-slider"
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

  if (visible.includes("rotate")) {
    addGroup('rotate',
      <button
        key="rotate"
        type="button"
        onClick={onToggleAutoRotate}
        disabled={rotationDisabled}
        aria-pressed={autoRotate}
        className={`${BTN} ${autoRotate ? ACTIVE : ""}`}
        title={autoRotate ? "暂停旋转" : "开启旋转"}
        aria-label={autoRotate ? "暂停旋转" : "开启旋转"}
      >
        <Rotate3d size={18} className="lg:size-5" strokeWidth={1.5} />
      </button>,
    );
  }

  if (visible.includes("xray")) {
    addGroup('xray',
      <button key="xray" type="button" onClick={onToggleXray} disabled={xrayDisabled || !onToggleXray}
        aria-pressed={xrayEnabled} className={`${BTN} ${xrayEnabled ? ACTIVE : ''}`}
        title={xrayEnabled ? '关闭透视' : '开启透视'} aria-label={xrayEnabled ? '关闭透视' : '开启透视'}>
        <ScanEye size={18} className="lg:size-5" strokeWidth={1.5} />
      </button>,
    );
  }

  if (visible.includes("isolate")) {
    addGroup('isolate',
      <button key="isolate" type="button" role="switch"
        aria-checked={isolateSelection}
        aria-label="独立展示：只显示选中的构件"
        title={isolateSelection ? '关闭独立展示' : '独立展示：只显示选中的构件'}
        disabled={!onToggleIsolation} onClick={onToggleIsolation}
        className={`${BTN} ${isolateSelection ? ACTIVE : ''}`}>
        <BoxSelect size={18} className="lg:size-5" strokeWidth={1.5} />
      </button>,
    );
  }

  if (visible.includes("link")) {
    addGroup('link',
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
    addGroup('lighting',
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
      className={`model-control-bar model-control-bar--${placement}${placement === 'overlay' ? ' node-control-bar' : ''}${leadingControls ? ' model-control-bar--with-leading' : ''}`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {groups.map(({ id, element }, i) => (
        <div key={id} className={`model-control-group model-control-group--${id}`}>
          {i > 0 && <Divider />}
          {element}
        </div>
      ))}
    </div>
  );
}
