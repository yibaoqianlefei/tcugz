import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

interface Metrics { max: number; top: number; height: number; value: number }
const empty: Metrics = { max: 0, top: 0, height: 0, value: 0 };

function measure(viewport: HTMLDivElement | null, track: HTMLDivElement | null): Metrics {
  if (!viewport || !track) return empty;
  const max = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
  const height = Math.min(track.clientHeight, Math.max(28, Math.min(64, track.clientHeight * viewport.clientHeight / Math.max(1, viewport.scrollHeight))));
  const value = Math.max(0, Math.min(max, viewport.scrollTop));
  return { max, height, value, top: max > 0 ? value / max * (track.clientHeight - height) : 0 };
}

/** A short thumb over a native scrolling directory; content keeps wheel/touch scrolling. */
export default function CompactDirectoryScrollbar({ viewportRef, active }: { viewportRef: RefObject<HTMLDivElement | null>; active: boolean }) {
  const rail = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; offset: number } | null>(null);
  const [metrics, setMetrics] = useState(empty);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = rail.current;
    if (!viewport || !track || !active) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      setMetrics(measure(viewport, track));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
      viewport.scrollTop += event.deltaY * unit;
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport);
    observer.observe(track);
    if (viewport.firstElementChild) observer.observe(viewport.firstElementChild);
    viewport.addEventListener('scroll', schedule, { passive: true });
    track.addEventListener('wheel', wheel, { passive: false });
    update();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      viewport.removeEventListener('scroll', schedule);
      track.removeEventListener('wheel', wheel);
      drag.current = null;
    };
  }, [viewportRef, active]);

  const move = (clientY: number, offset: number) => {
    const viewport = viewportRef.current;
    const track = rail.current;
    if (!viewport || !track) return;
    const current = measure(viewport, track);
    const travel = track.clientHeight - current.height;
    if (travel > 0) viewport.scrollTop = Math.max(0, Math.min(1, (clientY - track.getBoundingClientRect().top - offset) / travel)) * current.max;
  };

  return <div ref={rail} className="book-toc-scrollbar" role="scrollbar" aria-label="章节目录滚动位置" aria-controls="book-toc-scroll" aria-orientation="vertical" aria-valuemin={0} aria-valuemax={Math.round(metrics.max)} aria-valuenow={Math.round(metrics.value)} tabIndex={metrics.max > 1 && active ? 0 : -1} data-overflow={metrics.max > 1} onPointerDown={event => {
    if (event.button !== 0 || !metrics.max) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    const current = measure(viewportRef.current, event.currentTarget);
    const y = event.clientY - event.currentTarget.getBoundingClientRect().top;
    const offset = y >= current.top && y <= current.top + current.height ? y - current.top : current.height / 2;
    drag.current = { pointerId: event.pointerId, offset };
    event.currentTarget.setPointerCapture(event.pointerId);
    move(event.clientY, offset);
  }} onPointerMove={event => {
    if (drag.current?.pointerId === event.pointerId) move(event.clientY, drag.current.offset);
  }} onLostPointerCapture={() => { drag.current = null; }} onPointerUp={event => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = null;
  }} onKeyDown={event => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const targets: Record<string, number> = { ArrowDown: viewport.scrollTop + 40, ArrowUp: viewport.scrollTop - 40, PageDown: viewport.scrollTop + viewport.clientHeight * .9, PageUp: viewport.scrollTop - viewport.clientHeight * .9, Home: 0, End: viewport.scrollHeight };
    if (!(event.key in targets)) return;
    event.preventDefault();
    viewport.scrollTop = targets[event.key];
  }}><span className="book-toc-scrollbar-thumb" style={{ height: metrics.height, transform: `translateY(${metrics.top}px)` }} /></div>;
}
