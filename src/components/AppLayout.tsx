import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";

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
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === "/";
  const isAuth = pathname === "/auth";

  // Derived: can go back if browser history has entries before this page
  const canGoBack = window.history.length > 1;

  function handleBack() {
    navigate(-1);
  }

  return (
    <>
      {!isHome && !isAuth && (
        <nav className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 md:px-10 bg-canvas border-b border-hairline">
          <div className="flex items-center gap-2">
            {canGoBack && (
              <>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 cursor-pointer text-muted hover:text-primary transition-colors duration-200 hover:bg-surface-card rounded-lg px-2 py-1 -ml-2"
                  title="返回上一页"
                >
                  <ChevronLeft size={18} strokeWidth={1.5} />
                  <span className="text-sm font-medium">返回</span>
                </button>
                <span className="text-muted-soft select-none">|</span>
              </>
            )}
            <Link
              to="/"
              className="text-sm font-medium text-muted tracking-tight hover:text-primary transition-colors"
            >
              建筑构造交互系统
            </Link>
          </div>
        </nav>
      )}
      <ErrorBoundary
        resetKey={pathname}
        fallback={(opts) => <PageErrorFallback error={opts.error} reset={opts.reset} />}
      >
        <Outlet />
      </ErrorBoundary>
    </>
  );
}

export default AppLayout;
