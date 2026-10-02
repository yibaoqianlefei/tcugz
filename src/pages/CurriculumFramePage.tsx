import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import curriculum from '../data/curriculumDocuments.json';
import SectionPageHeader from '../components/SectionPageHeader';

const siteBase = import.meta.env.BASE_URL;
const documents = new Set(curriculum.documents);

function CourseProblem({ missing, retry }: { missing: boolean; retry?: () => void }) {
  const title = missing ? '未找到该课程章节' : '课程加载失败';
  useEffect(() => { document.title = `${title} · 建筑构造`; }, [title]);
  return <>
    <header className="site-subpage-topbar">
      <Link to="/" className="site-subpage-brand">建筑构造 / 学习首页</Link>
      <Link to="/" className="site-back-link"><span className="site-back-icon" aria-hidden="true">←</span>返回学习首页</Link>
    </header>
    <div className="site-page">
      <SectionPageHeader title={title} eyebrow="COURSE / 课程状态" description={missing ? '该章节地址不存在，请返回学习首页选择课程。' : '课程内容暂时无法读取，请重试。'} />
      {retry && <div className="mx-auto max-w-6xl px-6 py-10 md:px-10"><button onClick={retry} className="site-back-link">重新加载课程</button></div>}
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
  const loaded = useRef(false);
  const source = `${siteBase}curriculum/${documentPath}`;

  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  useEffect(() => {
    loaded.current = false;
    const timeout = window.setTimeout(() => { if (!loaded.current) setFailed(true); }, 15000);
    return () => {
      window.clearTimeout(timeout);
      cleanup.current?.();
    };
  }, [attempt]);

  const onLoad = () => {
    cleanup.current?.();
    const iframe = frame.current;
    const doc = iframe?.contentDocument;
    // Static hosts can return the SPA homepage with HTTP 200 for missing files.
    if (!iframe || !doc?.querySelector('.page-head h1, .wall-intro h1')) {
      setFailed(true);
      return;
    }
    loaded.current = true;
    document.title = doc.title || '建筑构造 · 交互式教材';
    const resize = () => {
      const layout = doc.querySelector<HTMLElement>('.layout, .wall-page');
      if (layout) layout.style.minHeight = `${window.innerHeight}px`;
      const height = Math.ceil(doc.body.getBoundingClientRect().height);
      if (height > 0 && iframe.style.height !== `${height}px`) iframe.style.height = `${height}px`;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(doc.body);
    window.addEventListener('resize', resize);
    resize();

    const followLink = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || event.button !== 0 || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const url = new URL(anchor.href, iframe.contentWindow?.location.href);
      if (url.origin !== window.location.origin) return;
      const coursePrefix = `${siteBase}curriculum/`;
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
      observer.disconnect();
      window.removeEventListener('resize', resize);
      doc.removeEventListener('click', followLink);
    };
  };

  if (failed) return <CourseProblem missing={false} retry={() => { setFailed(false); setAttempt(value => value + 1); }} />;
  return <iframe key={attempt} ref={frame} src={source} title="课程章节" onLoad={onLoad} onError={() => setFailed(true)} className="curriculum-frame" />;
}

export default function CurriculumFramePage() {
  const { '*': documentPath = '' } = useParams();
  return documents.has(documentPath)
    ? <CourseDocument key={documentPath} documentPath={documentPath} />
    : <CourseProblem missing />;
}
