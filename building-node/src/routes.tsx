import { createHashRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import LibraryPage from "./pages/LibraryPage";
import CurriculumPage from "./pages/CurriculumPage";
import PlaceholderPage from "./pages/PlaceholderPage";

/* ── Lazy-loaded pages ── */
const NodeDetail = lazy(() => import("./NodeDetail"));
const GamesPage = lazy(() => import("./pages/GamesPage"));

function LazyFallback() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function withSuspense(Element: React.LazyExoticComponent<() => React.JSX.Element>) {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Element />
    </Suspense>
  );
}

export const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/library", element: <LibraryPage /> },
      { path: "/curriculum", element: <CurriculumPage /> },
      { path: "/curriculum/:moduleId", element: <CurriculumPage /> },
      { path: "/node/:nodeId", element: withSuspense(NodeDetail) },
      { path: "/games", element: withSuspense(GamesPage) },
      { path: "/tools", element: <PlaceholderPage title="工具箱" /> },
      { path: "/contribute", element: <PlaceholderPage title="贡献节点" /> },
      { path: "/curriculum/cases", element: <PlaceholderPage title="案例应用" /> },
      { path: "/textbook/roof-membrane", element: <PlaceholderPage title="自主学习" /> },
    ],
  },
]);
