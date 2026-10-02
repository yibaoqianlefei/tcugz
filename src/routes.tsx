import { createHashRouter, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import CurriculumFramePage from "./pages/CurriculumFramePage";
import LibraryPage from "./pages/LibraryPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import ResourcesPage from "./pages/ResourcesPage";
import CasesPage from "./pages/CasesPage";
import LegacyCurriculumRedirect from "./components/LegacyCurriculumRedirect";
import {
  NodeDetail,
  GamesPage,
  DataAnalysis,
  RouteSuspense,
} from "./components/RouteSuspense";

export const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: null },
      { path: "/lesson/*", element: <CurriculumFramePage /> },
      { path: "/library", element: <LibraryPage /> },
      { path: "/curriculum", element: <Navigate to="/" replace /> },
      { path: "/curriculum/cases", element: <CasesPage /> },
      { path: "/curriculum/:moduleId", element: <LegacyCurriculumRedirect /> },
      { path: "/textbook/:moduleId/:chapterId", element: <LegacyCurriculumRedirect /> },
      { path: "/textbook/:sectionId", element: <LegacyCurriculumRedirect /> },
      { path: "/node/:nodeId", element: <RouteSuspense component={NodeDetail} /> },
      { path: "/games", element: <RouteSuspense component={GamesPage} /> },
      { path: "/games/:modeId", element: <RouteSuspense component={GamesPage} /> },
      { path: "/tools", element: <PlaceholderPage title="工具箱" /> },
      { path: "/contribute", element: <PlaceholderPage title="贡献节点" /> },
      { path: "/resources", element: <ResourcesPage /> },
      { path: "/ai", element: <PlaceholderPage title="AI 助教" /> },
      { path: "/ai-extend", element: <PlaceholderPage title="AI 拓展" /> },
      { path: "/data", element: <RouteSuspense component={DataAnalysis} /> },
    ],
  },
]);
