import { Navigate, useLocation } from 'react-router-dom';
import curriculum from '../data/curriculumDocuments.json';

// Keep old module bookmarks working without rendering retired navigation pages.
export default function LegacyCurriculumRedirect() {
  const { pathname } = useLocation();
  const oldPath = pathname.replace(/^\/curriculum\//, '/textbook/');
  const routes: Record<string, string> = curriculum.legacyRoutes;
  return <Navigate to={routes[oldPath] ?? '/lesson/missing-page.html'} replace />;
}
