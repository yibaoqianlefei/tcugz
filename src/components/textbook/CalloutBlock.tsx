import type { ReactNode, ReactElement } from "react";

/**
 * CalloutBlock — rendered from Markdown blockquote.
 * Detects prefixes: 重点/注意/易错/警告/拓展 and adjusts styling.
 */

type CalloutType = "tip" | "note" | "warning" | "danger" | "info";

const TYPE_MAP: Record<string, { type: CalloutType; label: string }> = {
  重点: { type: "tip", label: "重点" },
  注意: { type: "note", label: "注意" },
  易错: { type: "warning", label: "易错" },
  警告: { type: "danger", label: "警告" },
  拓展: { type: "info", label: "拓展" },
};

const STYLES: Record<CalloutType, { bg: string; border: string; icon: string; title: string }> = {
  tip:    { bg: "bg-primary/5",         border: "border-primary/20",         icon: "💡", title: "text-primary" },
  note:   { bg: "bg-blue-50",           border: "border-blue-200",           icon: "📝", title: "text-blue-700" },
  warning:{ bg: "bg-amber-50",          border: "border-amber-200",          icon: "⚠️", title: "text-amber-700" },
  danger: { bg: "bg-red-50",            border: "border-red-200",            icon: "🚫", title: "text-red-700" },
  info:   { bg: "bg-surface-cream-strong/30", border: "border-hairline",     icon: "📖", title: "text-muted" },
};

export default function CalloutBlock({ children }: { children: ReactNode }) {
  // Extract text from children
  const text = extractText(children);
  const detected = detectType(text);

  const style = STYLES[detected.type];
  const body = detected.body || text;

  return (
    <div className={`my-5 rounded-xl border ${style.border} ${style.bg} p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{style.icon}</span>
        <span className={`text-xs font-medium tracking-wide uppercase ${style.title}`}>
          {detected.label}
        </span>
      </div>
      <p className="text-sm text-body leading-relaxed">{body}</p>
    </div>
  );
}

/* ── Type guard: narrow ReactNode to a ReactElement with children ── */

type ElementWithChildren = ReactElement<{ children?: ReactNode }>;

function isReactElement(node: unknown): node is ElementWithChildren {
  return (
    typeof node === "object" &&
    node !== null &&
    "props" in node &&
    "type" in node
  );
}

/* ── Recursive text extraction from Markdown-parsed ReactNode tree ── */

function extractText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) {
    return children
      .map((c) => {
        if (typeof c === "string") return c;
        if (isReactElement(c)) return extractText(c.props.children);
        return "";
      })
      .join("");
  }
  if (isReactElement(children)) return extractText(children.props.children);
  return "";
}

function detectType(text: string): { type: CalloutType; label: string; body: string } {
  for (const [prefix, config] of Object.entries(TYPE_MAP)) {
    if (text.startsWith(prefix + "：") || text.startsWith(prefix + ":")) {
      return { type: config.type, label: config.label, body: text.slice(prefix.length + 1) };
    }
    if (text.startsWith(prefix)) {
      return { type: config.type, label: config.label, body: text.slice(prefix.length) };
    }
  }
  return { type: "note", label: "注意", body: text };
}
