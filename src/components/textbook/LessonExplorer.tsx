import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Box, ChevronLeft, ChevronRight, Info, X } from 'lucide-react';
import { modelLessonMedia, type LessonMedia } from './lessonMedia';
import { ErrorBoundary } from '../ErrorBoundary';
import './lesson-explorer.css';

const LessonModelViewer = lazy(() => import('./LessonModelViewer'));

interface Props {
  lesson: LessonMedia;
  initialFigure: string;
  onClose: () => void;
}

/** A native modal keeps keyboard focus and reading position in the host page. */
export default function LessonExplorer({ lesson, initialFigure, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(() => Math.max(0, lesson.figures.findIndex(figure => figure.id === initialFigure)));
  const [notesOpen, setNotesOpen] = useState(false);
  const figure = modelLessonMedia(lesson).figures[index];
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    const previousGutter = document.documentElement.style.scrollbarGutter;
    document.documentElement.style.scrollbarGutter = 'stable';
    document.body.style.overflow = 'hidden';
    element?.showModal();
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.scrollbarGutter = previousGutter;
    };
  }, []);

  return <dialog ref={dialog} className="lesson-explorer" aria-labelledby="lesson-explorer-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === dialog.current) onClose(); }}>
    <div className="lesson-explorer-shell">
      <header className="lesson-explorer-header">
        <div><span className="lesson-explorer-kicker">{lesson.title}</span><h2 id="lesson-explorer-title">{figure.title}</h2></div>
        <div className="lesson-explorer-actions"><button className="lesson-explorer-info" onClick={() => setNotesOpen(value => !value)} aria-label={notesOpen ? '收起研读说明' : '研读说明'} aria-expanded={notesOpen} aria-controls="lesson-explorer-notes"><Info size={18} /><span>{notesOpen ? '收起说明' : '研读说明'}</span></button><button className="lesson-explorer-close" onClick={onClose} autoFocus aria-label="关闭模型研读，返回正文"><X size={20} /></button></div>
      </header>
      <div className={`lesson-explorer-body${notesOpen ? ' has-notes' : ''}`}>
        <div className="lesson-explorer-main">
          <div className="lesson-media-panel lesson-media-panel--model" aria-label={figure.title}>
            <ErrorBoundary resetKey={figure.nodeId} fallback={<div className="lesson-media-message" role="alert"><strong>模型界面暂时无法加载</strong><p>请返回正文继续阅读，刷新页面后重试模型。</p></div>}><Suspense fallback={<div className="lesson-media-message" role="status">正在准备三维模型…</div>}><LessonModelViewer key={figure.nodeId} nodeId={figure.nodeId} /></Suspense></ErrorBoundary>
          </div>
          {lesson.figures.length > 1 && <div className="lesson-explorer-navigation"><button disabled={index === 0} onClick={() => setIndex(index - 1)} aria-label="上一模型"><ChevronLeft size={18} /></button><span>{figure.number} / {String(lesson.figures.length).padStart(2, '0')}</span><button disabled={index === lesson.figures.length - 1} onClick={() => setIndex(index + 1)} aria-label="下一模型"><ChevronRight size={18} /></button></div>}
        </div>
        {notesOpen && <aside className="lesson-explorer-notes" id="lesson-explorer-notes" aria-label="研读说明">
          <span className="lesson-explorer-kicker">对应正文</span><p className="lesson-section-reference">{figure.sectionTitle}</p><p>{figure.caption}</p>
          <div className="lesson-observation"><h3>带着问题观察</h3><ol>{figure.focus.map((focus, i) => <li key={focus}><span>{String(i + 1).padStart(2, '0')}</span>{focus}</li>)}</ol></div>
          <p className="lesson-model-note">模型用于理解构造关系，尺寸及做法应结合正文条件判断。</p>
          <Link to={`/node/${figure.nodeId}`} onClick={onClose} className="lesson-explorer-node-link">进入完整节点<Box size={16} /><ArrowUpRight size={16} /></Link>
          <button className="lesson-explorer-return" onClick={onClose}><ArrowLeft size={16} />继续阅读本节</button>
        </aside>}
      </div>
    </div>
  </dialog>;
}
