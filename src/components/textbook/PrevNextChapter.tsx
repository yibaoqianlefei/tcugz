import { useMemo } from "react";
import { Link } from "react-router-dom";

interface SectionInfo {
  id: string;
  title: string;
  available: boolean;
}

interface Props {
  sections: SectionInfo[];
  currentChapterId: string;
  moduleId: string;
}

export default function PrevNextChapter({ sections, currentChapterId, moduleId }: Props) {
  const { prev, next } = useMemo(() => {
    const available = sections.filter((s) => s.available);
    const idx = available.findIndex((s) => s.id === currentChapterId);
    return {
      prev: idx > 0 ? available[idx - 1] : null,
      next: idx < available.length - 1 ? available[idx + 1] : null,
    };
  }, [sections, currentChapterId]);

  if (!prev && !next) return null;

  return (
    <nav className="mt-12 pt-8 border-t border-hairline grid grid-cols-2 gap-4">
      {prev ? (
        <Link
          to={`/textbook/${moduleId}/${prev.id}`}
          className="group p-4 rounded-xl border border-hairline bg-surface-card hover:border-primary/30 hover:shadow-sm transition-all duration-200"
        >
          <span className="text-xs text-muted-soft">← 上一章</span>
          <p className="text-sm font-medium text-body mt-1 group-hover:text-primary transition-colors">
            {prev.title}
          </p>
        </Link>
      ) : <div />}
      {next ? (
        <Link
          to={`/textbook/${moduleId}/${next.id}`}
          className="group p-4 rounded-xl border border-hairline bg-surface-card hover:border-primary/30 hover:shadow-sm transition-all duration-200 text-right"
        >
          <span className="text-xs text-muted-soft">下一章 →</span>
          <p className="text-sm font-medium text-body mt-1 group-hover:text-primary transition-colors">
            {next.title}
          </p>
        </Link>
      ) : <div />}
    </nav>
  );
}
