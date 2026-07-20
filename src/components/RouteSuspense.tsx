import { Suspense, lazy, type ComponentType } from "react";
import { Link, useLocation } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary";

/* ── Lazy fallback spinner ──────────────────────────────────── */

export function LazyFallback() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

/* ── Lazy-loaded page components ────────────────────────────── */

export const AIExtendPage = lazy(() => import("../pages/AIExtendPage"));
export const NodeDetail = lazy(() => import("../NodeDetail"));
export const GamesPage = lazy(() => import("../pages/GamesPage"));
export const TextbookPage = lazy(() => import("../pages/TextbookPage"));
export const AIPage = lazy(() => import("../pages/AIPage"));
export const DataAnalysis = lazy(() => import("../pages/DataAnalysis"));

/* ── Route error fallback (chunk load failure) ──────────────── */

function RouteErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 text-center">
      <h2 className="text-xl font-medium text-ink mb-3">页面加载失败</h2>
      <p className="text-sm text-muted mb-2 max-w-md">
        页面资源加载失败，请检查网络后重试
      </p>
      {import.meta.env.DEV && (
        <p className="text-xs text-muted-soft mb-6 font-mono max-w-lg break-all">
          {error.message}
        </p>
      )}
      <div className="flex gap-4 mt-4">
        <button
          onClick={() => window.location.reload()}
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

/* ── Suspense + ErrorBoundary wrapper ─────────────────────────── */

interface RouteSuspenseProps {
  component: ComponentType;
}

export function RouteSuspense({ component: Page }: RouteSuspenseProps) {
  const location = useLocation();
  const resetKey = `${location.pathname}${location.search}`;

  return (
    <ErrorBoundary
      resetKey={resetKey}
      fallback={(opts) => <RouteErrorFallback error={opts.error} />}
    >
      <Suspense fallback={<LazyFallback />}>
        <Page />
      </Suspense>
    </ErrorBoundary>
  );
}
