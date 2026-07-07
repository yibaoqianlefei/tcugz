import type { ComponentPropsWithoutRef } from "react";
import FigureBlock from "./FigureBlock";
import CalloutBlock from "./CalloutBlock";

export const markdownComponents = {
  h1: ({ children, ...props }: ComponentPropsWithoutRef<"h1">) => (
    <h1 className="text-3xl font-serif font-normal text-ink mt-0 mb-4" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="text-xl font-serif font-normal text-ink mt-10 mb-4 border-l-2 border-primary pl-4" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="text-base font-medium text-body-strong mt-6 mb-2" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: ComponentPropsWithoutRef<"p">) => (
    <p className="text-base text-body leading-[1.8] mb-4" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul className="list-disc pl-6 mb-4 space-y-1.5" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: ComponentPropsWithoutRef<"ol">) => (
    <ol className="list-decimal pl-6 mb-4 space-y-1.5" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: ComponentPropsWithoutRef<"li">) => (
    <li className="text-base text-body leading-relaxed" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: ComponentPropsWithoutRef<"blockquote">) => (
    <CalloutBlock {...props}>{children}</CalloutBlock>
  ),
  img: ({ src, alt }: ComponentPropsWithoutRef<"img">) => (
    <FigureBlock src={src ?? ""} alt={alt} />
  ),
  table: ({ children }: ComponentPropsWithoutRef<"table">) => (
    <div className="overflow-x-auto my-5 rounded-xl border border-hairline bg-white">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: ComponentPropsWithoutRef<"thead">) => (
    <thead className="bg-surface-soft">{children}</thead>
  ),
  tbody: ({ children }: ComponentPropsWithoutRef<"tbody">) => (
    <tbody className="divide-y divide-hairline/50">{children}</tbody>
  ),
  tr: ({ children }: ComponentPropsWithoutRef<"tr">) => (
    <tr className="even:bg-surface-soft/30">{children}</tr>
  ),
  th: ({ children }: ComponentPropsWithoutRef<"th">) => (
    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted uppercase tracking-wider border-b border-hairline">
      {children}
    </th>
  ),
  td: ({ children }: ComponentPropsWithoutRef<"td">) => (
    <td className="px-4 py-2 text-sm text-body">{children}</td>
  ),
  a: ({ href, children }: ComponentPropsWithoutRef<"a">) => {
    const isExternal = /^https?:\/\//.test(href ?? "");
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="text-primary hover:underline decoration-primary/30 underline-offset-2"
      >
        {children}
      </a>
    );
  },
  code: ({ children }: ComponentPropsWithoutRef<"code">) => (
    <code className="bg-surface-card px-1.5 py-0.5 rounded text-sm text-body-strong font-normal">
      {children}
    </code>
  ),
};
