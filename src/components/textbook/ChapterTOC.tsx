import { useMemo } from "react";

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface Props {
  markdown: string;
}

export default function ChapterTOC({ markdown }: Props) {
  const items = useMemo(() => extractHeadings(markdown), [markdown]);

  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">本章目录</h3>
      <nav className="space-y-1.5">
        {items.map((item, i) => (
          <a
            key={i}
            href={`#${item.id}`}
            className={`block text-sm leading-snug transition-colors hover:text-primary
              ${item.level === 3 ? "pl-3 text-muted-soft" : "text-body"}
            `}
          >
            {item.text}
          </a>
        ))}
      </nav>
    </section>
  );
}

function extractHeadings(md: string): TocItem[] {
  const items: TocItem[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    if (h2) { items.push({ id: slugify(h2[1]), text: h2[1], level: 2 }); continue; }
    const h3 = line.match(/^### (.+)/);
    if (h3) { items.push({ id: slugify(h3[1]), text: h3[1], level: 3 }); }
  }
  return items;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, "-")
    .replace(/^-|-$/g, "");
}
