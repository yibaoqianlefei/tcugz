import { createHashRouter } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import LibraryPage from "./pages/LibraryPage";
import CurriculumPage from "./pages/CurriculumPage";
import SectionSubPage from "./pages/SectionSubPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import ResourcesPage from "./pages/ResourcesPage";
import CasesPage from "./pages/CasesPage";
import {
  AIExtendPage,
  NodeDetail,
  GamesPage,
  TextbookPage,
  AIPage,
  DataAnalysis,
  RouteSuspense,
} from "./components/RouteSuspense";

export const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/library", element: <LibraryPage /> },
      // Curriculum: module grid → section drill-down
      { path: "/curriculum", element: <CurriculumPage /> },
      { path: "/curriculum/:moduleId", element: <SectionSubPage /> },
      { path: "/textbook/:moduleId/:chapterId", element: <RouteSuspense component={TextbookPage} /> },
      { path: "/textbook/:sectionId", element: <RouteSuspense component={TextbookPage} /> },
      { path: "/node/:nodeId", element: <RouteSuspense component={NodeDetail} /> },
      { path: "/games", element: <RouteSuspense component={GamesPage} /> },
      { path: "/tools", element: <PlaceholderPage title="工具箱" /> },
      { path: "/contribute", element: <PlaceholderPage title="贡献节点" /> },
      { path: "/curriculum/cases", element: <CasesPage /> },
      { path: "/resources", element: <ResourcesPage /> },
      { path: "/ai", element: <RouteSuspense component={AIPage} /> },
      { path: "/ai-extend", element: <RouteSuspense component={AIExtendPage} /> },
      { path: "/data", element: <RouteSuspense component={DataAnalysis} /> },
    ],
  },
]);
