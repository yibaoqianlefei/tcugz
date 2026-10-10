import { lazy, Suspense, useEffect, useRef, useState, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useCompanionStore } from '../../store/companionStore';
import { ErrorBoundary } from '../ErrorBoundary';
import CompanionContextBridge from './CompanionContextBridge';
import CompanionPet from './CompanionPet';
import './companion.css';

const CompanionPanel = lazy(() => import('./CompanionPanel'));

export default function CompanionWidget() {
  const { pathname } = useLocation();
  const open = useCompanionStore(state => state.open);
  const hidden = useCompanionStore(state => state.hidden);
  const busy = useCompanionStore(state => state.busy);
  const openedOnce = useCompanionStore(state => state.hasOpened);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const [occluded, setOccluded] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  useEffect(() => {
    const observer = new MutationObserver(() => setOccluded(document.body.classList.contains('mobile-nav-open') || Boolean(document.querySelector('.node-detail-grid[data-diagram-open="true"], [aria-modal="true"]:not(.companion-panel)'))));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-diagram-open', 'aria-modal'], childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const clampPosition = () => setPosition(current => current ? { left: Math.max(8, Math.min(current.left, innerWidth - 80)), top: Math.max(8, Math.min(current.top, innerHeight - 90)) } : null);
    window.addEventListener('resize', clampPosition);
    return () => window.removeEventListener('resize', clampPosition);
  }, []);
  const pointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current) return;
    const dx = event.clientX - current.x, dy = event.clientY - current.y;
    if (Math.hypot(dx, dy) < 7 && !current.moved) return;
    current.moved = true;
    setPosition({ left: Math.max(8, Math.min(current.left + dx, innerWidth - 80)), top: Math.max(8, Math.min(current.top + dy, innerHeight - 90)) });
  };
  const pointerUp = () => {
    if (drag.current?.moved) {
      suppressClick.current = true;
      setPosition(current => current ? { ...current, left: current.left < innerWidth / 2 ? 12 : innerWidth - 84 } : null);
    }
    drag.current = null;
  };
  return <><CompanionContextBridge />{createPortal(
    <div className="companion-root" data-page={pathname.startsWith('/node/') ? 'node' : 'other'} hidden={hidden || occluded}>
      {openedOnce && <ErrorBoundary fallback={<div className="companion-fallback"><p>伙伴面板暂不可用。</p><button onClick={() => useCompanionStore.getState().setOpen(false)}>收起</button></div>}>
        <Suspense fallback={open ? <div className="companion-fallback" role="status">正在准备构造伙伴…</div> : null}><CompanionPanel onResetPosition={() => setPosition(null)} launcher={launcher} /></Suspense>
      </ErrorBoundary>}
      <button ref={launcher} type="button" className="companion-launcher" aria-label={open ? '收起构造伙伴' : '打开构造伙伴'} aria-expanded={open} aria-controls="construction-companion-panel" title="构造伙伴 · 点击提问，拖动停靠" style={position && !open ? { left: position.left, top: position.top, right: 'auto', bottom: 'auto' } : undefined}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => { drag.current = null; }}
        onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } useCompanionStore.getState().setOpen(!open); }}>
        <CompanionPet thinking={busy} /><span className="companion-launcher-label">构造伙伴</span>
      </button>
    </div>, document.body,
  )}</>;
}
