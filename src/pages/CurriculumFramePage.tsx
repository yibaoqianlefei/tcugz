import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useNavigationType, useParams } from 'react-router-dom';
import curriculum from '../data/curriculumDocuments.json';
import SectionPageHeader from '../components/SectionPageHeader';
import SiteHeader from '../components/SiteHeader';
import { useCompanionStore } from '../store/companionStore';
import { initDirectoryMotion } from '../ui/directoryMotion.js';
import { lessonMedia } from '../components/textbook/lessonMedia';
import InlineLessonModels from '../components/textbook/InlineLessonModels';
import BookNavigation from '../components/textbook/BookNavigation';
import { lessonNodeRoute, recalledLessonVisit, rememberLessonVisit, validLessonVisit } from '../utils/lessonNodeNavigation';
import { resolveLearningUnit } from '../utils/curriculumLearning';

const siteBase = import.meta.env.BASE_URL;
const documents = new Set(curriculum.documents);
const wideReaderQuery = '(min-width: 1280px)';

function scrollReaderTo(iframe: HTMLIFrameElement | null, id: string, instant = false) {
  const target = iframe?.contentDocument?.getElementById(id);
  if (!iframe || !target) return;
  const headerHeight = document.querySelector('.site-subpage-topbar')?.getBoundingClientRect().height ?? 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: window.scrollY + iframe.getBoundingClientRect().top + target.getBoundingClientRect().top - headerHeight - 24, behavior: instant || reduceMotion ? 'instant' : 'smooth' });
}

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
  const location = useLocation();
  const navigationType = useNavigationType();
  const [restore] = useState(() => (navigationType === 'POP' ? recalledLessonVisit(location.key, documentPath) : undefined)
    ?? validLessonVisit(location.state?.lessonRestore, documentPath));
  const frame = useRef<HTMLIFrameElement>(null);
  const cleanup = useRef<(() => void) | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [navigation, setNavigation] = useState({ to: '/', label: '返回学习首页', breadcrumb: '建筑构造 / 课程学习' });
  const loaded = useRef(false);
  const [readerDocument, setReaderDocument] = useState<Document | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  const [wideReader, setWideReader] = useState(() => window.matchMedia(wideReaderQuery).matches);
  const [directoryOpen, setDirectoryOpen] = useState(() => window.matchMedia(wideReaderQuery).matches && (restore?.viewportWidth === window.innerWidth ? restore.directoryOpen : true));
  const directoryTrigger = useRef<HTMLButtonElement>(null);
  const lesson = Object.values(lessonMedia).find(item => item.path === documentPath);
  const source = `${siteBase}lesson/${documentPath}`;
  const sectionLinks = useMemo(() => [...readerDocument?.querySelectorAll<HTMLElement>('.article h2[id]') ?? []].map(section => ({ id: section.id, title: section.textContent?.trim() ?? '' })), [readerDocument]);
  useEffect(() => {
    if (!readerDocument || !loaded.current) return;
    const query = new URLSearchParams(location.search);
    const unit = resolveLearningUnit(documentPath, query.get('unit'), query.get('model'));
    if (!unit) return;
    const id = window.requestAnimationFrame(() => scrollReaderTo(frame.current, `unit-${unit.id}`));
    return () => window.cancelAnimationFrame(id);
  }, [documentPath, location.search, readerDocument]);
  const closeDirectory = useCallback(() => {
    setDirectoryOpen(false);
    window.requestAnimationFrame(() => directoryTrigger.current?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    const media = window.matchMedia(wideReaderQuery);
    const changed = (event: MediaQueryListEvent) => {
      const focused = document.activeElement;
      const restoreDirectoryFocus = Boolean(focused?.closest('#book-toc, .book-directory-edge-trigger'));
      setWideReader(event.matches);
      setDirectoryOpen(event.matches);
      if (restoreDirectoryFocus) window.requestAnimationFrame(() => directoryTrigger.current?.focus({ preventScroll: true }));
    };
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);

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
    setReaderDocument(doc);
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
    if (lesson) doc.documentElement.dataset.readerLayout = 'book';
    if (courseHeader) courseHeader.style.display = 'none';
    // Restore static reading disclosures before measuring the iframe. Viewer menus
    // are transient portals and are deliberately excluded from these indexes.
    const readingDetails = [...doc.querySelectorAll<HTMLDetailsElement>('details')].filter(details => !details.closest('.lesson-model-mount'));
    if (restore?.openDetails) readingDetails.forEach((details, index) => { details.open = restore.openDetails!.includes(index); });
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
    let refreshReading = () => {};
    const scheduleResize = () => {
      if (disposed || resizeTimer) return;
      resizeTimer = window.setTimeout(() => {
        resizeTimer = 0;
        resize();
        refreshReading();
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
    // The iframe must have its full height before restoring a reading position.
    window.scrollTo({ top: 0, behavior: 'instant' });
    const requestedFigure = restore?.figureId ?? new URLSearchParams(location.search).get('model');
    const requestedUnit = restore?.unitId ?? new URLSearchParams(location.search).get('unit');
    const returnUnit = resolveLearningUnit(documentPath, requestedUnit, requestedFigure);
    const returnFigure = lesson?.figures.find(figure => figure.id === requestedFigure || figure.knowledgeId === returnUnit?.id);
    let restoreFrame = 0;
    void doc.fonts.ready.then(() => {
      if (disposed) return;
      restoreFrame = window.requestAnimationFrame(() => {
        if (disposed) return;
        resize();
        if (restore?.viewportWidth === window.innerWidth) window.scrollTo({ top: restore.scrollTop, behavior: 'instant' });
        else if (returnUnit) scrollReaderTo(iframe, `unit-${returnUnit.id}`, true);
        else if (returnFigure) scrollReaderTo(iframe, returnFigure.id, true);
        if (returnFigure) doc.querySelector<HTMLAnchorElement>(`#${returnFigure.id} .lesson-model-link`)?.focus({ preventScroll: true });
      });
    });
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
      setActiveSection(active ?? '');
      if (!lesson && sidebar && sidebarInner && articleLayout) {
        const wide = doc.documentElement.clientWidth > 1100;
        sidebarInner.style.maxHeight = wide ? `${Math.max(240, window.innerHeight - headerHeight - 60)}px` : '';
        const desired = headerHeight + 24 - frameTop - articleLayout.getBoundingClientRect().top;
        const limit = Math.max(0, articleLayout.offsetHeight - sidebar.offsetHeight);
        sidebar.style.transform = wide ? `translateY(${Math.max(0, Math.min(desired, limit))}px)` : '';
      }
    };
    const scheduleReading = () => { if (!readingFrame) readingFrame = window.requestAnimationFrame(updateReading); };
    refreshReading = scheduleReading;
    window.addEventListener('scroll', scheduleReading, { passive: true });
    window.addEventListener('resize', scheduleReading);
    doc.addEventListener('load', scheduleReading, true);
    doc.addEventListener('toggle', scheduleReading, true);
    updateReading();

    // Native new-tab and standalone links carry the same source chapter as SPA navigation.
    for (const anchor of doc.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      const url = new URL(anchor.href, doc.location.href);
      const nodeId = url.hash.match(/^#\/node\/([^/?#]+)/)?.[1];
      if (url.origin !== window.location.origin || url.pathname !== siteBase || !nodeId || !lesson) continue;
      const figure = anchor.closest<HTMLElement>('.lesson-figure');
      const figureId = lesson.figures.find(item => item.id === figure?.id && item.nodeId === nodeId)?.id;
      const unitId = anchor.closest<HTMLElement>('[data-knowledge-unit]')?.dataset.knowledgeUnit
        ?? new URLSearchParams(url.hash.split('?')[1]).get('unit') ?? undefined;
      anchor.href = `${siteBase}#${lessonNodeRoute(nodeId, documentPath, figureId, unitId)}`;
    }
    const followLink = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || event.button !== 0 || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (anchor.target === '_blank') return;
      const url = new URL(anchor.href, iframe.contentWindow?.location.href);
      if (url.origin !== window.location.origin) return;
      const coursePrefix = `${siteBase}lesson/`;
      if (url.pathname === iframe.contentWindow?.location.pathname && url.hash && !url.hash.startsWith('#/')) {
        const target = doc.getElementById(decodeURIComponent(url.hash.slice(1)));
        if (target) {
          event.preventDefault();
          scrollReaderTo(iframe, target.id);
          return;
        }
      }
      if (url.pathname.startsWith(coursePrefix)) {
        event.preventDefault();
        navigate(`/lesson/${url.pathname.slice(coursePrefix.length)}${url.search}`);
      } else if (url.hash.startsWith('#/') && url.pathname === siteBase) {
        event.preventDefault();
        const nodeId = url.hash.match(/^#\/node\/([^/?#]+)/)?.[1];
        if (nodeId && lesson) {
          const figureId = lesson.figures.find(item => item.id === anchor.closest('.lesson-figure')?.id && item.nodeId === nodeId)?.id;
          const unitId = anchor.closest<HTMLElement>('[data-knowledge-unit]')?.dataset.knowledgeUnit
            ?? new URLSearchParams(url.hash.split('?')[1]).get('unit') ?? undefined;
          const visit = { path: documentPath, scrollTop: window.scrollY, viewportWidth: window.innerWidth, directoryOpen: document.querySelector('.book-reader-shell')?.getAttribute('data-directory-open') === 'true', figureId, unitId, openDetails: readingDetails.flatMap((details, index) => details.open ? [index] : []) };
          rememberLessonVisit(location.key, visit);
          navigate(lessonNodeRoute(nodeId, documentPath, figureId, unitId), { state: { lessonVisit: visit } });
        } else navigate(url.hash.slice(1));
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
      window.cancelAnimationFrame(restoreFrame);
      doc.removeEventListener('click', followLink);
      doc.removeEventListener('selectionchange', selectionChanged);
      if (useCompanionStore.getState().detail?.route === courseContext.route) useCompanionStore.getState().publishDetail(null);
    };
  };

  if (failed) return <CourseProblem missing={false} retry={() => { setFailed(false); setAttempt(value => value + 1); }} />;
  return <div className={lesson ? 'book-reader-shell' : undefined} data-directory-open={lesson && wideReader && directoryOpen}>
    <SiteHeader {...navigation} className={lesson ? 'book-reader-topbar' : undefined} />
    {lesson && <div className="lesson-reading-progress" role="progressbar" aria-label="本节阅读进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>}
    <div className={lesson ? 'book-reader-layout' : undefined} data-directory-open={lesson && wideReader && directoryOpen}>
      {lesson && <BookNavigation path={documentPath} wide={wideReader} open={directoryOpen} triggerRef={directoryTrigger} onToggle={() => setDirectoryOpen(value => !value)} sections={sectionLinks} activeSection={activeSection} onClose={closeDirectory} onSection={id => {
        if (!wideReader) closeDirectory();
        // Let the modal's scroll lock release before moving the reading page.
        window.requestAnimationFrame(() => scrollReaderTo(frame.current, id));
      }} />}
      <iframe key={attempt} ref={frame} src={source} title="课程章节" onLoad={onLoad} onError={() => { cleanup.current?.(); cleanup.current = null; setFailed(true); }} className="curriculum-frame" />
    </div>
    {readerDocument && lesson && <InlineLessonModels doc={readerDocument} lesson={lesson} paused={false} />}
  </div>;
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
