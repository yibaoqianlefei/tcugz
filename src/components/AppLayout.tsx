import { Outlet, useLocation, Link, useNavigationType } from "react-router-dom";
import { useLayoutEffect, useRef } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import LearningHomePage from "../pages/LearningHomePage";
import SiteHeader from "./SiteHeader";
import CompanionWidget from "./companion/CompanionWidget";
import { nodeReturnTarget } from '../utils/lessonNodeNavigation';

/**
 * Root-level error fallback — shown when any (eager or lazy) route throws
 * during render, so a single page error never blanks the whole app.
 */
function PageErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="site-error-state">
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
          className="site-button"
        >
          重试
        </button>
        <Link
          to="/"
          className="site-button site-button--secondary"
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
  const { pathname, search, key, state } = useLocation();
  const navigationType = useNavigationType();
  const scrollPositions = useRef(new Map<string, number>());
  const lastVisit = useRef<{ key: string; pathname: string } | null>(null);
  const departing = useRef(false);
  const isHome = pathname === "/";
  const isAuth = pathname === "/auth";
  const isLesson = pathname.startsWith('/lesson/');
  const parent: { to: string; label: string; state?: unknown } = pathname.startsWith('/curriculum/cases/')
    ? { to: '/curriculum/cases', label: '返回案例应用' }
    : pathname.startsWith('/games/')
    ? { to: '/games', label: '返回作业训练' }
    : pathname.startsWith('/node/')
    ? nodeReturnTarget(pathname, search, state)
    : pathname.startsWith('/textbook/')
      ? { to: pathname.includes('/introduction') ? '/?section=introduction' : '/?section=modules', label: '返回学习首页' }
      : { to: '/', label: '返回学习首页' };

  useLayoutEffect(() => {
    const route = pathname + search;
    const changingCaseTopic = pathname.startsWith('/curriculum/cases/') && lastVisit.current?.pathname === pathname;
    const changingLibraryFilter = pathname === '/library' && lastVisit.current?.pathname === pathname;
    if (!isHome && !isLesson && !changingCaseTopic && !changingLibraryFilter && lastVisit.current?.key !== key) {
      const returningToLibrary = pathname === '/library' && lastVisit.current?.pathname.startsWith('/node/');
      const returningToTraining = pathname === '/games' && lastVisit.current?.pathname.startsWith('/games/');
      const returningToCases = pathname === '/curriculum/cases' && lastVisit.current?.pathname.startsWith('/curriculum/cases/');
      let savedTrainingScroll = 0;
      if (pathname === '/games') {
        try {
          const stored = Number(sessionStorage.getItem('construction-training-scroll'));
          savedTrainingScroll = Number.isFinite(stored) ? Math.max(0, stored) : 0;
        } catch { /* Browser session storage is optional. */ }
      }
      const top = returningToLibrary || returningToTraining || returningToCases || navigationType === 'POP' ? scrollPositions.current.get(route) ?? savedTrainingScroll : 0;
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
    <div className={`site-app${isHome ? ' site-app--home' : ''}${pathname.startsWith('/node/') ? ' site-app--node' : ''}`}>
      {!isHome && !isAuth && !isLesson && (
        <SiteHeader to={parent.to} label={parent.label} state={parent.state} breadcrumb={pathname === '/library' || pathname.startsWith('/node/') ? '建筑构造 / 构造节点' : undefined} />
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
      <CompanionWidget />
    </div>
  );
}

export default AppLayout;
