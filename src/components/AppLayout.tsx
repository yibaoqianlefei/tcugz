import { Outlet, useLocation, Link, useNavigationType } from "react-router-dom";
import { useLayoutEffect, useRef } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import LearningHomePage from "../pages/LearningHomePage";

/**
 * Root-level error fallback — shown when any (eager or lazy) route throws
 * during render, so a single page error never blanks the whole app.
 */
function PageErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 text-center">
      <h2 className="text-xl font-medium text-ink mb-3">页面出错了</h2>
      <p className="text-sm text-muted mb-2 max-w-md">
        页面渲染时出现问题，请重试或返回首页
      </p>
      {import.meta.env.DEV && (
        <p className="text-xs text-muted-soft mb-6 font-mono max-w-lg break-all">
          {error.message}
        </p>
      )}
      <div className="flex gap-4 mt-4">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium
            hover:bg-primary-active transition-colors"
        >
          重试
        </button>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-lg border border-hairline text-sm text-muted
            hover:text-primary hover:border-primary/30 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

/**
 * Global layout wrapper — sticky nav bar on all non-home pages.
 */
function AppLayout() {
  const { pathname, search, key } = useLocation();
  const navigationType = useNavigationType();
  const scrollPositions = useRef(new Map<string, number>());
  const lastVisit = useRef<{ key: string; pathname: string } | null>(null);
  const departing = useRef(false);
  const isHome = pathname === "/";
  const isAuth = pathname === "/auth";
  const isLesson = pathname.startsWith('/lesson/');
  const parent = pathname.startsWith('/games/')
    ? { to: '/games', label: '返回训练中心' }
    : pathname.startsWith('/node/')
    ? { to: '/library', label: '返回节点库' }
    : pathname.startsWith('/textbook/')
      ? { to: pathname.includes('/introduction') ? '/?section=introduction' : '/?section=modules', label: '返回学习首页' }
      : { to: '/', label: '返回学习首页' };

  useLayoutEffect(() => {
    const route = pathname + search;
    if (!isHome && !isLesson && lastVisit.current?.key !== key) {
      const returningToLibrary = pathname === '/library' && lastVisit.current?.pathname.startsWith('/node/');
      const returningToTraining = pathname === '/games' && lastVisit.current?.pathname.startsWith('/games/');
      let savedTrainingScroll = 0;
      if (pathname === '/games') {
        try {
          const stored = Number(sessionStorage.getItem('construction-training-scroll'));
          savedTrainingScroll = Number.isFinite(stored) ? Math.max(0, stored) : 0;
        } catch { /* Browser session storage is optional. */ }
      }
      const top = returningToLibrary || returningToTraining || navigationType === 'POP' ? scrollPositions.current.get(route) ?? savedTrainingScroll : 0;
      window.scrollTo({ top, behavior: 'instant' });
    }
    lastVisit.current = { key, pathname };
    departing.current = false;
    if (isHome || isLesson) return;
    const rememberScroll = () => {
      if (!departing.current) {
        scrollPositions.current.set(route, window.scrollY);
        if (pathname === '/games') {
          try { sessionStorage.setItem('construction-training-scroll', String(window.scrollY)); } catch { /* Keep in-memory restoration available. */ }
        }
      }
    };
    const beforeNavigate = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || anchor.target === '_blank') return;
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin || !url.hash.startsWith('#/') || url.hash.slice(1) === route) return;
      // Snapshot before React replaces the tall list with the shorter workbench.
      scrollPositions.current.set(route, window.scrollY);
      if (pathname === '/games') {
        try { sessionStorage.setItem('construction-training-scroll', String(window.scrollY)); } catch { /* Keep in-memory restoration available. */ }
      }
      departing.current = true;
    };
    window.addEventListener('scroll', rememberScroll, { passive: true });
    document.addEventListener('click', beforeNavigate, true);
    return () => {
      window.removeEventListener('scroll', rememberScroll);
      document.removeEventListener('click', beforeNavigate, true);
    };
  }, [isHome, isLesson, pathname, search, key, navigationType]);

  return (
    <>
      {!isHome && !isAuth && !isLesson && (
        <header className="site-subpage-topbar">
          <Link to="/" className="site-subpage-brand">建筑构造 / 学习首页</Link>
          <Link to={parent.to} className="site-back-link"><span className="site-back-icon" aria-hidden="true">←</span>{parent.label}</Link>
        </header>
      )}
      <div style={{ display: isHome ? undefined : 'none' }} aria-hidden={!isHome} inert={!isHome}>
        <LearningHomePage active={isHome} />
      </div>
      <ErrorBoundary
        resetKey={pathname}
        fallback={(opts) => <PageErrorFallback error={opts.error} reset={opts.reset} />}
      >
        {!isHome && <Outlet />}
      </ErrorBoundary>
    </>
  );
}

export default AppLayout;
