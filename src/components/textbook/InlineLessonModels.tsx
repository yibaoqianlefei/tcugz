import { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LessonMedia } from './lessonMedia';
import { ErrorBoundary } from '../ErrorBoundary';

const LessonModelViewer = lazy(() => import('./LessonModelViewer'));

/** Keep the canvas beside its audited paragraph in the isolated reader. */
export default function InlineLessonModels({ doc, lesson, paused }: { doc: Document; lesson: LessonMedia; paused: boolean }) {
  const [active, setActive] = useState('');
  const slots = lesson.figures.flatMap(figure => {
    const mount = doc.querySelector<HTMLElement>(`[data-lesson-model="${figure.id}"] .lesson-model-mount`);
    return mount ? [{ figure, mount }] : [];
  });

  useLayoutEffect(() => {
    doc.documentElement.setAttribute('data-models-embedded', 'true');
    return () => { doc.documentElement.removeAttribute('data-models-embedded'); };
  }, [doc]);

  useEffect(() => {
    let scheduled = 0;
    const update = () => {
      scheduled = 0;
      const frame = doc.defaultView?.frameElement;
      if (!frame?.isConnected || paused) return;
      const frameTop = frame.getBoundingClientRect().top;
      const header = document.querySelector('.site-subpage-topbar')?.getBoundingClientRect().height ?? 64;
      const center = (window.innerHeight + header) / 2;
      const candidates = [...doc.querySelectorAll<HTMLElement>('[data-lesson-model]')].map(slot => {
        const rect = slot.getBoundingClientRect();
        return { id: slot.dataset.lessonModel!, top: frameTop + rect.top, bottom: frameTop + rect.bottom, focused: slot.matches(':focus-within'), idleFocused: Boolean(slot.querySelector('[data-model-idle]:focus-within')) };
      }).filter(slot => slot.bottom > header && slot.top < window.innerHeight);
      // One visible model at a time avoids exhausting mobile WebGL contexts.
      // Tabbing to the unloaded viewer must not remove the focused button.
      const next = candidates.some(slot => slot.idleFocused) ? undefined : candidates.find(slot => slot.focused) ?? candidates.sort((a, b) => Math.abs((a.top + a.bottom) / 2 - center) - Math.abs((b.top + b.bottom) / 2 - center))[0];
      setActive(next?.id ?? '');
    };
    const schedule = () => { if (!scheduled) scheduled = window.requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    doc.addEventListener('focusin', schedule);
    doc.addEventListener('toggle', schedule, true);
    doc.addEventListener('load', schedule, true);
    update();
    return () => {
      window.cancelAnimationFrame(scheduled);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      doc.removeEventListener('focusin', schedule);
      doc.removeEventListener('toggle', schedule, true);
      doc.removeEventListener('load', schedule, true);
    };
  }, [doc, paused]);

  const activate = (id: string, mount: HTMLElement) => {
    const frame = doc.defaultView?.frameElement;
    if (!frame) return;
    const header = document.querySelector('.site-subpage-topbar')?.getBoundingClientRect().height ?? 64;
    window.scrollTo({ top: window.scrollY + frame.getBoundingClientRect().top + mount.getBoundingClientRect().top - header - 20, behavior: 'instant' });
    const group = mount.closest<HTMLElement>('[data-lesson-model]');
    if (group) { group.tabIndex = -1; group.focus({ preventScroll: true }); }
    setActive(id);
  };

  return slots.map(({ figure, mount }) => createPortal(
    active === figure.id && !paused
      ? <ErrorBoundary resetKey={figure.nodeId} fallback={<div className="lesson-model-idle" role="alert"><strong>模型界面暂时无法加载</strong><span>可继续阅读正文，刷新页面后重试模型。</span><button type="button" onClick={() => window.location.reload()}>刷新页面重试</button></div>}><Suspense fallback={<div className="lesson-model-idle" role="status">正在准备三维构造…</div>}><LessonModelViewer key={figure.nodeId} nodeId={figure.nodeId} inline /></Suspense></ErrorBoundary>
      : <div className="lesson-model-idle" data-model-idle><span className="lesson-model-idle-symbol" aria-hidden="true">◇</span><strong>{figure.nodeTitle}</strong><span>{paused ? '模型已在展开视图中打开' : '阅读到这里，直接观察三维构造'}</span><button type="button" disabled={paused} onClick={() => activate(figure.id, mount)}>在此观察模型</button></div>,
    mount, figure.id,
  ));
}
