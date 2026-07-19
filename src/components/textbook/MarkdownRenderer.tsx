import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getNodeDefinition } from "../../data/nodeDefinitions";

/* ── Helpers ─ */

function hasImageChild(children: ReactNode): boolean {
  if (!children) return false;
  if (Array.isArray(children)) {
    return children.some(
      (c) => c && typeof c === "object" && "type" in c && c.type === "img"
    );
  }
  return (
    typeof children === "object" &&
    "type" in children &&
    children.type === "img"
  );
}

/* ── Model card ─ */

function ModelCard({ nodeId }: { nodeId: string }) {
  const node = getNodeDefinition(nodeId);
  if (!node) return null;
  return (
    <Link
      to={`/node/${node.id}`}
      className="block bg-surface-card border border-hairline rounded-xl p-5 not-prose
        hover:shadow-[0_1px_3px_rgba(20,20,19,0.08)] hover:-translate-y-0.5
        hover:border-primary/30 transition-all duration-300 cursor-pointer group my-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-normal font-serif text-ink group-hover:text-primary transition-colors">
            {node.title}
          </h4>
          <p className="text-sm text-muted mt-1">{node.description}</p>
        </div>
        <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
          打开模型 →
        </span>
      </div>
    </Link>
  );
}

/* ── Table ─ */

function Table({ children }: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="overflow-x-auto my-5 rounded-lg border border-hairline">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}
function Th({ children }: ComponentPropsWithoutRef<"th">) {
  return (
    <th className="px-4 py-2.5 text-left font-medium text-muted bg-surface-soft border-b border-hairline text-xs uppercase tracking-wider">
      {children}
    </th>
  );
}
function Td({ children }: ComponentPropsWithoutRef<"td">) {
  return (
    <td className="px-4 py-2.5 text-body border-b border-hairline/50 last:border-b-0">
      {children}
    </td>
  );
}

/* ── Standalone image ─ */

function Img({ src, alt }: ComponentPropsWithoutRef<"img">) {
  return (
    <figure className="my-6">
      <img
        src={src}
        alt={alt ?? ""}
        className="rounded-xl border border-hairline max-w-full"
        loading="lazy"
      />
      {alt && (
        <figcaption className="text-center text-xs text-muted-soft mt-2">
          {alt}
        </figcaption>
      )}
    </figure>
  );
}

/* ── Clickable diagram (image wrapped in /node/:id link) ─ */

function DiagramCard({ nodeId, children }: { nodeId: string; children: ReactNode }) {
  const node = getNodeDefinition(nodeId);
  return (
    <Link
      to={`/node/${nodeId}`}
      className="block group cursor-pointer not-prose my-6"
    >
      <div className="rounded-xl border border-hairline overflow-hidden
        group-hover:border-primary/40 group-hover:shadow-md transition-all duration-300">
        {children}
      </div>
      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-sm text-muted group-hover:text-primary transition-colors">
          {node?.title ?? "3D 交互模型"}
        </span>
        <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          点击交互 →
        </span>
      </div>
    </Link>
  );
}

/* ── Custom link handler ─ */

function Anchor({ href, children }: ComponentPropsWithoutRef<"a">) {
  if (!href) return <span>{children}</span>;

  const nodeMatch = href.match(/^\/node\/([\w-]+)$/);

  // Image in node link → clickable diagram
  if (nodeMatch && hasImageChild(children)) {
    return <DiagramCard nodeId={nodeMatch[1]}>{children}</DiagramCard>;
  }

  // Text node link → model card
  if (nodeMatch) {
    return <ModelCard nodeId={nodeMatch[1]} />;
  }

  const isExternal = /^https?:\/\//.test(href);
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
}

/* ── Side-by-side layout (equal 2-column grid, no prose nesting) ─ */

function SideBySide({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6 not-prose">
      {children}
    </div>
  );
}

function CustomDiv({ className, children, ...props }: any) {
  if (className === "side") {
    return <SideBySide>{children}</SideBySide>;
  }
  return <div className={className} {...props}>{children}</div>;
}

/* ── Public ── */

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div
      className="prose prose-stone max-w-none
        prose-headings:font-serif prose-headings:text-ink prose-headings:font-normal
        prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
        prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
        prose-p:text-body prose-p:leading-relaxed
        prose-strong:text-body-strong
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-li:text-body prose-li:leading-relaxed
        prose-code:bg-surface-card prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal
        prose-code:before:content-none prose-code:after:content-none
        prose-img:rounded-xl
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: Table,
          th: Th,
          td: Td,
          img: Img,
          a: Anchor,
          div: CustomDiv,
          h2: ({ children, ...props }) => (
            <h2 className="text-2xl font-serif text-ink font-normal mt-10 mb-4" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-lg font-medium text-body-strong mt-8 mb-3" {...props}>
              {children}
            </h3>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
