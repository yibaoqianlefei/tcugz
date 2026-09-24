import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export type LayoutPreset = "balanced" | "model" | "diagram" | "custom";
type Sizes = { left: number; right: number };

const STORAGE_KEY = "node-detail-panel-layout-v1";
const MIN_LEFT = 280;
const MIN_RIGHT = 300;
const MIN_VIEWPORT = 600;
const MAX_LEFT = 600;
const MAX_RIGHT = 600;
const DEFAULT_SIZES: Sizes = { left: 360, right: 320 };

function fit(sizes: Sizes, width: number): Sizes {
  const available = Math.max(MIN_LEFT + MIN_RIGHT, width - MIN_VIEWPORT);
  let left = Math.min(MAX_LEFT, Math.max(MIN_LEFT, sizes.left));
  let right = Math.min(MAX_RIGHT, Math.max(MIN_RIGHT, sizes.right));
  if (left + right > available) {
    const excess = left + right - available;
    const leftRoom = left - MIN_LEFT;
    const rightRoom = right - MIN_RIGHT;
    const room = leftRoom + rightRoom;
    if (room > 0) {
      left -= excess * leftRoom / room;
      right -= excess * rightRoom / room;
    }
  }
  const roundedLeft = Math.round(left);
  return { left: roundedLeft, right: Math.min(Math.round(right), Math.floor(available - roundedLeft)) };
}

function presetSizes(preset: Exclude<LayoutPreset, "custom">, width: number): Sizes {
  if (preset === "model") return fit({ left: 280, right: 300 }, width);
  if (preset === "diagram") return fit({ left: 480, right: 320 }, width);
  return fit({ left: Math.min(440, width * 0.26), right: Math.min(380, width * 0.23) }, width);
}

export function useNodePanelLayout() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [preset, setPreset] = useState<LayoutPreset>("balanced");
  const [sizes, setSizes] = useState<Sizes>(DEFAULT_SIZES);
  const [isResizing, setIsResizing] = useState(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Discard the preference written by older versions; this layout is now
    // intentionally session-local and resets on every node entry.
    try { localStorage.removeItem(STORAGE_KEY); }
    catch { /* Layout remains usable when storage is unavailable. */ }
  }, []);

  useEffect(() => {
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(container);
    return () => observer.disconnect();
  }, [container]);

  const current = width > 0
    ? preset === "custom" ? fit(sizes, width) : presetSizes(preset, width)
    : sizes;

  useLayoutEffect(() => {
    if (!container) return;
    container.style.setProperty("--diagram-width", `${current.left}px`);
    container.style.setProperty("--knowledge-width", `${current.right}px`);
  }, [container, current.left, current.right]);

  useEffect(() => () => dragCleanupRef.current?.(), []);

  const selectPreset = useCallback((next: Exclude<LayoutPreset, "custom">) => {
    setPreset(next);
    if (width) setSizes(presetSizes(next, width));
  }, [width]);

  const adjust = useCallback((side: "left" | "right", delta: number) => {
    if (!width) return;
    const base = preset === "custom" ? fit(sizes, width) : presetSizes(preset, width);
    const available = width - MIN_VIEWPORT;
    const next = side === "left"
      ? { left: Math.max(MIN_LEFT, Math.min(MAX_LEFT, available - base.right, base.left + delta)), right: base.right }
      : { left: base.left, right: Math.max(MIN_RIGHT, Math.min(MAX_RIGHT, available - base.left, base.right - delta)) };
    setSizes(next);
    setPreset("custom");
  }, [width, preset, sizes]);

  const beginDrag = useCallback((side: "left" | "right", event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || !container || width < 1280) return;
    event.preventDefault();
    dragCleanupRef.current?.();
    const startX = event.clientX;
    const base = current;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    let pending = base;
    let frame = 0;
    let moved = false;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    setIsResizing(true);
    const paint = () => {
      frame = 0;
      container.style.setProperty("--diagram-width", `${pending.left}px`);
      container.style.setProperty("--knowledge-width", `${pending.right}px`);
    };
    const move = (e: PointerEvent) => {
      const delta = e.clientX - startX;
      const available = width - MIN_VIEWPORT;
      pending = side === "left"
        ? { left: Math.max(MIN_LEFT, Math.min(MAX_LEFT, available - base.right, base.left + delta)), right: base.right }
        : { left: base.left, right: Math.max(MIN_RIGHT, Math.min(MAX_RIGHT, available - base.left, base.right - delta)) };
      moved = moved || pending.left !== base.left || pending.right !== base.right;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const stop = (commit: boolean) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      if (frame) cancelAnimationFrame(frame);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      dragCleanupRef.current = null;
      if (commit) {
        if (moved) {
          paint();
          setSizes(pending);
          setPreset("custom");
        }
        setIsResizing(false);
      }
    };
    const onEnd = () => stop(true);
    dragCleanupRef.current = () => stop(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  }, [container, width, current]);

  return { setContainer, sizes: current, preset, isResizing, selectPreset, adjust, beginDrag };
}
