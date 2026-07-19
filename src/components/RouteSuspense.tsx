import { Suspense, lazy, type ComponentType } from "react";

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

/* ── Suspense wrapper ────────────────────────────────────────── */

interface RouteSuspenseProps {
  component: ComponentType;
}

export function RouteSuspense({ component: Page }: RouteSuspenseProps) {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Page />
    </Suspense>
  );
}
