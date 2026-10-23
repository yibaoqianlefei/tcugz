import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, PanelLeft, Search } from 'lucide-react';
import BrandMark from '../BrandMark';
import CompactDirectoryScrollbar from './CompactDirectoryScrollbar';
import { containsLesson, filterLessonNavigation, lessonCount, lessonNavigation } from './lessonNavigation';
import type { LessonNavigationItem } from './lessonNavigation';
import './book-reader.css';

export interface ReaderSection { id: string; title: string }

interface Props {
  path: string;
  wide: boolean;
  open: boolean;
  sections: ReaderSection[];
  activeSection: string;
  onClose: () => void;
  onToggle: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onSection: (id: string) => void;
}

const captions: Record<string, string> = {
  introduction: '认识建筑与构造', basics: '从构件到连接', principles: '理解性能与要求', practice: '把知识转化为方案',
};

export default function BookNavigation({ path, wide, open, sections, activeSection, onClose, onToggle, triggerRef, onSection }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => filterLessonNavigation(lessonNavigation, query), [query]);

  useLayoutEffect(() => {
    const element = dialog.current;
    if (wide || !element) return;
    if (open && !element.open) {
      element.showModal();
      element.querySelector<HTMLButtonElement>('[data-drawer-close]')?.focus();
    }
    if (!open && element.open) element.close();
  }, [wide, open]);

  useEffect(() => {
    if (wide || !open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [wide, open]);

  useLayoutEffect(() => {
    if (!open || !scroll.current) return;
    const container = scroll.current;
    const current = container.querySelector<HTMLElement>('[aria-current="page"]');
    if (!current) return;
    const box = current.getBoundingClientRect();
    const bounds = container.getBoundingClientRect();
    if (box.top < bounds.top || box.bottom > bounds.bottom) {
      container.scrollTop += box.top - bounds.top - Math.min(80, container.clientHeight / 4);
    }
  }, [path, wide, open, query]);

  const renderItems = (items: LessonNavigationItem[], depth = 0) => <ul className={`book-toc-list book-toc-list--${depth}`}>
    {items.map((item, index) => <li key={item.id}>
      {item.children ? <>
        {depth === 0 && (index === 0 || item.id === 'practice') && <div className="book-toc-label">{item.id === 'practice' ? '探索实践' : '学习课程'}<span>{item.id === 'practice' ? 'EXPLORE' : 'LEARN'}</span></div>}
        <details className={`book-toc-group${depth === 0 && containsLesson(item, path) ? ' book-toc-group--active' : ''}`} open={Boolean(query.trim()) || containsLesson(item, path)}>
        <summary><span className="book-toc-group-copy"><span>{item.title}</span>{depth === 0 && <span className="book-toc-caption">{captions[item.id]}</span>}</span><small>{item.children.length}</small><ChevronRight size={15} aria-hidden="true" /></summary>
        {renderItems(item.children, depth + 1)}
      </details></> : <>
        <Link to={`/lesson/${item.path}`} className="book-toc-lesson" aria-current={item.path === path ? 'page' : undefined} onClick={() => { if (!wide) onClose(); }}>
          <span className="book-toc-number" aria-hidden="true">{item.number}</span><span className="book-toc-link-text">{item.title}</span>
        </Link>
        {item.path === path && sections.length > 0 && <ul className="book-toc-sections" aria-label="当前章节小节">
          {sections.map(section => <li key={section.id}><button type="button" aria-current={section.id === activeSection ? 'location' : undefined} onClick={() => onSection(section.id)}><span className="book-toc-link-text">{section.title}</span></button></li>)}
        </ul>}
      </>}
    </li>)}
  </ul>;

  const brand = <Link to="/" className="book-toc-brand" aria-label="建筑构造 · 返回学习首页"><BrandMark /><span className="book-toc-brand-copy"><strong>建筑构造</strong><span>INTERACTIVE<br />TEXTBOOK</span></span></Link>;
  const content = <div id="book-toc-content" className="book-toc-content" hidden={wide && !open}>
    <div className="book-toc-heading"><h2 id="book-toc-title">教材目录</h2><span>全书 {lessonCount} 节</span></div>
    <div className="book-toc-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="搜索教材章节" placeholder="搜索章节" value={query} onChange={event => setQuery(event.target.value)} /></div>
    <div className="book-toc-scroll-region"><div id="book-toc-scroll" ref={scroll} className="book-toc-scroll" data-compact-scroll="true"><nav aria-label="全书章节导览">{filtered.length ? renderItems(filtered) : <p className="book-toc-empty">没有找到相关章节</p>}</nav></div><CompactDirectoryScrollbar viewportRef={scroll} active={open} /></div>
  </div>;

  const edgeToggle = (drawer = false) => <button ref={drawer ? undefined : triggerRef} type="button" className={`book-toc-edge-toggle${drawer ? '' : ' book-directory-edge-trigger'}`} data-drawer-close={drawer || undefined} aria-label={open ? '收起教材目录' : '展开教材目录'} aria-controls="book-toc-content" aria-expanded={open} onClick={drawer ? onClose : onToggle}><PanelLeft size={16} aria-hidden="true" /></button>;

  return wide
    ? <aside id="book-toc" className="book-toc book-toc--sidebar" data-open={open} aria-label="教材目录">{brand}{edgeToggle()}{content}{!open && <span className="book-toc-collapsed-label" aria-hidden="true">教材<br />目录</span>}</aside>
    : <>{!open && edgeToggle()}<dialog id="book-toc" ref={dialog} className="book-toc book-toc--drawer" aria-labelledby="book-toc-title" onCancel={onClose} onClose={onClose} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>{brand}{edgeToggle(true)}{content}</dialog></>;
}
