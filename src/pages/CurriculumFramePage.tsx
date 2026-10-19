import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import curriculum from '../data/curriculumDocuments.json';
import SectionPageHeader from '../components/SectionPageHeader';
import SiteHeader from '../components/SiteHeader';
import { useCompanionStore } from '../store/companionStore';
import { initDirectoryMotion } from '../ui/directoryMotion.js';
import { lessonMedia } from '../components/textbook/lessonMedia';
import LessonExplorer from '../components/textbook/LessonExplorer';

const siteBase = import.meta.env.BASE_URL;
const documents = new Set(curriculum.documents);

function CourseProblem({ missing, retry }: { missing: boolean; retry?: () => void }) {
  const title = missing ? '未找到该课程章节' : '课程加载失败';
  useEffect(() => { document.title = `${title} · 建筑构造`; }, [title]);
  return <>
    <SiteHeader />
    <div className="site-page">
      <SectionPageHeader title={title} eyebrow="COURSE / 课程状态" description={missing ? '该章节地址不存在，请返回学习首页选择课程。' : '课程内容暂时无法读取，请重试。'} />
      {retry && <div className="site-container site-page-main"><button onClick={retry} className="site-button">重新加载课程</button></div>}
    </div>
  </>;
}

/** Keep the document isolated; measure its content independently of frame vh. */
function CourseDocument({ documentPath }: { documentPath: string }) {
  const navigate = useNavigate();
  const frame = useRef<HTMLIFrameElement>(null);
  const cleanup = useRef<(() => void) | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [navigation, setNavigation] = useState({ to: '/', label: '返回学习首页', breadcrumb: '建筑构造 / 课程学习' });
  const loaded = useRef(false);
  const [exploring, setExploring] = useState<{ figure: string; tab: 'diagram' | 'model' } | null>(null);
  const [progress, setProgress] = useState(0);
  const figureTrigger = useRef<HTMLAnchorElement | null>(null);
  const lesson = Object.values(lessonMedia).find(item => item.path === documentPath);
  const source = `${siteBase}lesson/${documentPath}`;

  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  useEffect(() => {
    loaded.current = false;
    const timeout = window.setTimeout(() => {
      if (!loaded.current) {
        cleanup.current?.();
        cleanup.current = null;
        setFailed(true);
      }
    }, 15000);
    return () => {
      window.clearTimeout(timeout);
      cleanup.current?.();
    };
  }, [attempt]);

  const onLoad = () => {
    cleanup.current?.();
    cleanup.current = null;
    const iframe = frame.current;
    const doc = iframe?.contentDocument;
    // Static hosts can return the SPA homepage with HTTP 200 for missing files.
    if (!iframe || !doc?.querySelector('.page-head h1, .wall-intro h1')) {
      setFailed(true);
      return;
    }
    loaded.current = true;
    document.title = doc.title || '建筑构造 · 交互式教材';
    // The host owns the sticky header. A standalone document keeps its own.
    const courseHeader = doc.querySelector<HTMLElement>('.topbar');
    const back = courseHeader?.querySelector<HTMLAnchorElement>('.back, .wall-back');
    const breadcrumb = courseHeader?.querySelector('.crumb, .course-brand span')?.textContent?.trim() || '建筑构造 / 课程学习';
    if (back) {
      const destination = new URL(back.href, doc.location.href);
      const prefix = `${siteBase}lesson/`;
      const to = destination.pathname.startsWith(prefix)
        ? `/lesson/${destination.pathname.slice(prefix.length)}`
        : destination.pathname === siteBase && destination.hash.startsWith('#/') ? destination.hash.slice(1) : '/';
      setNavigation({ to, label: back.querySelector('span:last-child')?.textContent?.trim() || back.textContent?.replace('←', '').trim() || '返回学习首页', breadcrumb });
    }
    doc.documentElement.dataset.embedded = 'true';
    if (courseHeader) courseHeader.style.display = 'none';
    const courseContext = { kind: 'course' as const, route: `/lesson/${documentPath}`, title: doc.querySelector('h1')?.textContent?.trim() ?? '课程章节', coursePath: documentPath };
    const selectionChanged = () => useCompanionStore.getState().publishDetail({ ...courseContext, selectedText: doc.getSelection()?.toString().slice(0, 1000) || undefined });
    useCompanionStore.getState().publishDetail(courseContext);
    doc.addEventListener('selectionchange', selectionChanged);
    let disposed = false;
    const resize = () => {
      if (disposed || !iframe.isConnected || iframe.contentDocument !== doc) return;
      const layout = doc.querySelector<HTMLElement>('.layout, .wall-page');
      if (layout) {
        const headerHeight = document.querySelector('.site-subpage-topbar')?.getBoundingClientRect().height ?? 0;
        const app = document.querySelector('.site-app');
        const bottomSpace = app ? parseFloat(getComputedStyle(app).paddingBottom) || 0 : 0;
        layout.style.minHeight = `${Math.max(0, window.innerHeight - headerHeight - bottomSpace)}px`;
      }
      const height = Math.ceil(doc.body.getBoundingClientRect().height);
      if (height > 0 && iframe.style.height !== `${height}px`) iframe.style.height = `${height}px`;
    };
    // Queue cross-document writes outside the observer's rendering cycle.
    // A parent requestAnimationFrame can still run before the child delivery.
    let resizeTimer = 0;
    const scheduleResize = () => {
      if (disposed || resizeTimer) return;
      resizeTimer = window.setTimeout(() => {
        resizeTimer = 0;
        resize();
      }, 0);
    };
    // Observing in the document's own window avoided skipped notifications
    // during the browser checks that repeatedly replace the iframe.
    const childWindow = iframe.contentWindow as Window & typeof globalThis;
    const observer = new childWindow.ResizeObserver(scheduleResize);
    observer.observe(doc.body);
    const hostObserver = new MutationObserver(scheduleResize);
    hostObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-companion-dock'] });
    window.addEventListener('resize', scheduleResize);
    resize();
    // Hash navigation can restore the old page's scroll after the mount effect.
    // Reset once the replacement document has its final height.
    window.scrollTo({ top: 0, behavior: 'instant' });
    const disposeDirectoryMotion = initDirectoryMotion(doc);
    const article = doc.querySelector<HTMLElement>('.article');
    const sidebar = doc.querySelector<HTMLElement>('.lesson-sidebar');
    const sidebarInner = doc.querySelector<HTMLElement>('.lesson-sidebar-inner');
    const articleLayout = doc.querySelector<HTMLElement>('.article-layout');
    const sections = [...doc.querySelectorAll<HTMLElement>('.article h2[id]')];
    const tocLinks = [...doc.querySelectorAll<HTMLAnchorElement>('.article-toc a')];
    let readingFrame = 0;
    const updateReading = () => {
      readingFrame = 0;
      if (disposed || !article || !iframe.isConnected) return;
      const headerHeight = document.querySelector('.site-subpage-topbar')?.getBoundingClientRect().height ?? 0;
      const frameTop = iframe.getBoundingClientRect().top;
      const articleTop = frameTop + article.getBoundingClientRect().top;
      const distance = Math.max(1, article.offsetHeight - window.innerHeight + headerHeight + 40);
      setProgress(Math.max(0, Math.min(100, Math.round((headerHeight - articleTop) / distance * 100))));
      let active = sections[0]?.id;
      for (const section of sections) if (frameTop + section.getBoundingClientRect().top <= headerHeight + 100) active = section.id;
      for (const link of tocLinks) {
        if (link.hash === `#${active}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
      if (sidebar && sidebarInner && articleLayout) {
        const wide = doc.documentElement.clientWidth > 1100;
        sidebarInner.style.maxHeight = wide ? `${Math.max(240, window.innerHeight - headerHeight - 60)}px` : '';
        const desired = headerHeight + 24 - frameTop - articleLayout.getBoundingClientRect().top;
        const limit = Math.max(0, articleLayout.offsetHeight - sidebar.offsetHeight);
        sidebar.style.transform = wide ? `translateY(${Math.max(0, Math.min(desired, limit))}px)` : '';
      }
    };
    const scheduleReading = () => { if (!readingFrame) readingFrame = window.requestAnimationFrame(updateReading); };
    window.addEventListener('scroll', scheduleReading, { passive: true });
    window.addEventListener('resize', scheduleReading);
    doc.addEventListener('load', scheduleReading, true);
    doc.addEventListener('toggle', scheduleReading, true);
    updateReading();

    const followLink = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || event.button !== 0 || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const figureId = anchor.dataset.lessonFigure;
      if (figureId && lesson?.figures.some(figure => figure.id === figureId)) {
        event.preventDefault();
        figureTrigger.current = anchor;
        setExploring({ figure: figureId, tab: anchor.dataset.lessonView === 'model' ? 'model' : 'diagram' });
        return;
      }
      if (anchor.target === '_blank') return;
      const url = new URL(anchor.href, iframe.contentWindow?.location.href);
      if (url.origin !== window.location.origin) return;
      const coursePrefix = `${siteBase}lesson/`;
      if (url.pathname === iframe.contentWindow?.location.pathname && url.hash && !url.hash.startsWith('#/')) {
        const target = doc.getElementById(decodeURIComponent(url.hash.slice(1)));
        if (target) {
          event.preventDefault();
          const headerHeight = document.querySelector('.site-subpage-topbar')?.getBoundingClientRect().height ?? 0;
          const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          window.scrollTo({ top: window.scrollY + iframe.getBoundingClientRect().top + target.getBoundingClientRect().top - headerHeight - 24, behavior: reduceMotion ? 'instant' : 'smooth' });
          return;
        }
      }
      if (url.pathname.startsWith(coursePrefix)) {
        event.preventDefault();
        navigate(`/lesson/${url.pathname.slice(coursePrefix.length)}`);
      } else if (url.hash.startsWith('#/') && url.pathname === siteBase) {
        event.preventDefault();
        navigate(url.hash.slice(1));
      }
    };
    doc.addEventListener('click', followLink);
    cleanup.current = () => {
      disposed = true;
      observer.disconnect();
      hostObserver.disconnect();
      disposeDirectoryMotion();
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', scheduleResize);
      window.removeEventListener('scroll', scheduleReading);
      window.removeEventListener('resize', scheduleReading);
      doc.removeEventListener('load', scheduleReading, true);
      doc.removeEventListener('toggle', scheduleReading, true);
      window.cancelAnimationFrame(readingFrame);
      doc.removeEventListener('click', followLink);
      doc.removeEventListener('selectionchange', selectionChanged);
      if (useCompanionStore.getState().detail?.route === courseContext.route) useCompanionStore.getState().publishDetail(null);
    };
  };

  if (failed) return <CourseProblem missing={false} retry={() => { setFailed(false); setAttempt(value => value + 1); }} />;
  const closeExplorer = () => {
    setExploring(null);
    window.requestAnimationFrame(() => figureTrigger.current?.isConnected && figureTrigger.current.focus({ preventScroll: true }));
  };
  return <><SiteHeader {...navigation} />{lesson && <div className="lesson-reading-progress" role="progressbar" aria-label="本节阅读进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>}<iframe key={attempt} ref={frame} src={source} title="课程章节" onLoad={onLoad} onError={() => { cleanup.current?.(); cleanup.current = null; setFailed(true); }} className="curriculum-frame" />{exploring && lesson && <LessonExplorer lesson={lesson} initialFigure={exploring.figure} initialTab={exploring.tab} onClose={closeExplorer} />}</>;
}

export default function CurriculumFramePage() {
  const { '*': documentPath = '' } = useParams();
  if (documentPath === 'introduction/index.html' || documentPath === 'principles/index.html') {
    return <Navigate to={`/?section=${documentPath.split('/')[0]}`} replace />;
  }
  return documents.has(documentPath)
    ? <CourseDocument key={documentPath} documentPath={documentPath} />
    : <CourseProblem missing />;
}
