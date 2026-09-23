import { Navigate, useParams } from "react-router-dom";
import courseModules from "../data/courseModules";

// Keep old module bookmarks working without rendering retired navigation pages.
export default function LegacyCurriculumRedirect() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const moduleExists = courseModules.some((module) => module.id === moduleId);
  return <Navigate to={moduleExists ? `/textbook/${moduleId}` : "/"} replace />;
}
