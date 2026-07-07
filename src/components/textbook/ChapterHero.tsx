interface Props {
  moduleTitle: string;
  chapterTitle: string;
  description?: string;
  learningGoals?: string[];
}

export default function ChapterHero({ moduleTitle, chapterTitle, description, learningGoals }: Props) {
  return (
    <header className="mb-8">
      <p className="text-xs text-muted-soft uppercase tracking-wider mb-2">{moduleTitle}</p>
      <h1 className="text-3xl font-serif font-normal text-ink tracking-tight">
        {chapterTitle}
      </h1>
      {description && (
        <p className="mt-2 text-base text-muted leading-relaxed max-w-[720px]">
          {description}
        </p>
      )}
      {learningGoals && learningGoals.length > 0 && (
        <div className="mt-4 rounded-xl border border-hairline bg-surface-soft/50 px-5 py-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">学习目标</p>
          <ul className="space-y-1">
            {learningGoals.map((goal, i) => (
              <li key={i} className="text-sm text-body leading-relaxed flex items-start gap-2">
                <span className="text-primary mt-1.5 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                {goal}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
