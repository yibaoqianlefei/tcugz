import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Box, ChevronLeft, ChevronRight, Image as ImageIcon, Minus, Plus, X } from 'lucide-react';
import { lessonAsset, type LessonMedia } from './lessonMedia';
import './lesson-explorer.css';

const LessonModelViewer = lazy(() => import('./LessonModelViewer'));

interface Props {
  lesson: LessonMedia;
  initialFigure: string;
  initialTab: 'diagram' | 'model';
  onClose: () => void;
}

/** A native modal keeps keyboard focus and reading position in the host page. */
export default function LessonExplorer({ lesson, initialFigure, initialTab, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(() => Math.max(0, lesson.figures.findIndex(figure => figure.id === initialFigure)));
  const [tab, setTab] = useState(initialTab);
  const [zoom, setZoom] = useState(1);
  const [imageFailed, setImageFailed] = useState(false);
  const figure = lesson.figures[index];
  const imageArea = useRef<HTMLDivElement>(null);
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

  const changeFigure = (next: number) => {
    setIndex(next);
    setZoom(1);
    setImageFailed(false);
    setTab('diagram');
    imageArea.current?.scrollTo(0, 0);
  };

  return <dialog ref={dialog} className="lesson-explorer" aria-labelledby="lesson-explorer-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === dialog.current) onClose(); }}>
    <div className="lesson-explorer-shell">
      <header className="lesson-explorer-header">
        <div><span className="lesson-explorer-kicker">图模研读 <span aria-hidden="true">/</span> {lesson.title}</span><h2 id="lesson-explorer-title">{figure.title}</h2></div>
        <button className="lesson-explorer-close" onClick={onClose} autoFocus aria-label="关闭图模研读，返回正文"><X size={20} /><span>返回正文</span></button>
      </header>
      <div className="lesson-explorer-body">
        <div className="lesson-explorer-main">
          <div className="lesson-explorer-tabs" role="tablist" aria-label="图模查看方式">
            <button id="lesson-diagram-tab" role="tab" aria-selected={tab === 'diagram'} aria-controls="lesson-media-panel" tabIndex={tab === 'diagram' ? 0 : -1} onClick={() => setTab('diagram')} onKeyDown={event => { if (figure.hasModel && ['ArrowRight', 'ArrowLeft'].includes(event.key)) { event.preventDefault(); setTab('model'); document.getElementById('lesson-model-tab')?.focus(); } }}><ImageIcon size={17} />二维图解</button>
            {figure.hasModel && <button id="lesson-model-tab" role="tab" aria-selected={tab === 'model'} aria-controls="lesson-media-panel" tabIndex={tab === 'model' ? 0 : -1} onClick={() => setTab('model')} onKeyDown={event => { if (['ArrowRight', 'ArrowLeft'].includes(event.key)) { event.preventDefault(); setTab('diagram'); document.getElementById('lesson-diagram-tab')?.focus(); } }}><Box size={17} />三维模型</button>}
            <span className="lesson-explorer-counter">图 {figure.number} / {String(lesson.figures.length).padStart(2, '0')}</span>
          </div>
          <div id="lesson-media-panel" role="tabpanel" aria-labelledby={tab === 'diagram' ? 'lesson-diagram-tab' : 'lesson-model-tab'} className={`lesson-media-panel${tab === 'model' ? ' lesson-media-panel--model' : ''}`}>
            {tab === 'diagram' ? <div className="lesson-diagram-view">
              <div className="lesson-diagram-scroll" ref={imageArea} tabIndex={0} aria-label="构造图，放大后可滚动查看">
                {imageFailed ? <div className="lesson-media-message" role="alert"><p>图解暂时无法加载</p><button onClick={() => setImageFailed(false)}>重试</button></div> : <img key={figure.image} src={lessonAsset(figure.image)} alt={figure.imageAlt} style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }} onError={() => setImageFailed(true)} />}
              </div>
              <div className="lesson-diagram-controls"><span>识别构件与连接</span><div><button disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - 0.5))} aria-label="缩小构造图"><Minus size={16} /></button><output aria-live="polite">{zoom * 100}%</output><button disabled={zoom >= 3} onClick={() => setZoom(value => Math.min(3, value + 0.5))} aria-label="放大构造图"><Plus size={16} /></button><a href={lessonAsset(figure.image)} target="_blank" rel="noopener noreferrer" aria-label="新标签页查看原图"><ArrowUpRight size={18} /></a></div></div>
            </div> : <Suspense fallback={<div className="lesson-media-message" role="status">正在准备三维模型…</div>}><LessonModelViewer key={figure.nodeId} nodeId={figure.nodeId} /></Suspense>}
          </div>
          <div className="lesson-explorer-navigation"><button disabled={index === 0} onClick={() => changeFigure(index - 1)}><ChevronLeft size={16} />上一图</button><span>{figure.nodeTitle}</span><button disabled={index === lesson.figures.length - 1} onClick={() => changeFigure(index + 1)}>下一图<ChevronRight size={16} /></button></div>
        </div>
        <aside className="lesson-explorer-notes">
          <span className="lesson-explorer-kicker">对应正文</span><p className="lesson-section-reference">{figure.sectionTitle}</p><p>{figure.caption}</p>
          <div className="lesson-observation"><h3>带着问题观察</h3><ol>{figure.focus.map((focus, i) => <li key={focus}><span>{String(i + 1).padStart(2, '0')}</span>{focus}</li>)}</ol></div>
          <p className="lesson-model-note">图与模型用于理解构造关系，尺寸及做法应结合正文条件判断。</p>
          <Link to={`/node/${figure.nodeId}`} onClick={onClose} className="lesson-explorer-node-link">进入完整节点<Box size={16} /><ArrowUpRight size={16} /></Link>
          <button className="lesson-explorer-return" onClick={onClose}><ArrowLeft size={16} />继续阅读本节</button>
        </aside>
      </div>
    </div>
  </dialog>;
}
