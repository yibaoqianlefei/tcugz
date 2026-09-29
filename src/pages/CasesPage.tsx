import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { nodesIndex } from "../data/nodesIndex";

/* ── Case Card ─────────────────────────────────────────────── */
function CaseCard({ node, index }: { node: (typeof nodesIndex)[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      className="ui-resource-card flex h-full flex-col p-4
        hover:shadow-[0_8px_24px_rgba(20,20,19,0.07)] hover:-translate-y-0.5
        transition-all duration-200 group"
    >
      {/* Placeholder thumbnail */}
      <div className="w-full h-28 bg-surface-soft rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        <Building2 size={38} strokeWidth={1.25} className="text-muted-soft" />
      </div>

      {/* Case title */}
      <h3 className="text-base font-medium text-ink leading-snug">
        郓城案例 {node.title}
      </h3>

      {/* Description */}
      <p className="text-[13px] text-muted mt-1.5 leading-relaxed line-clamp-2">
        {node.description}
      </p>

      {/* Red tag */}
      <span className="self-start mt-3 text-xs font-medium text-muted bg-surface-soft px-2 py-1 rounded-full">
        模型开发中
      </span>
    </motion.div>
  );
}

/* ── CasesPage ──────────────────────────────────────────────── */
export default function CasesPage() {
  const caseNodes = nodesIndex.filter((n) => n.category === "案例");

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* ── Header ── */}
      <header className="max-w-6xl mx-auto w-full px-6 md:px-10 pt-9 pb-7 md:pt-12 md:pb-9">
        <p className="ui-eyebrow mb-2">案例学习</p>
        <motion.h1
          className="ui-page-heading"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          案例应用
        </motion.h1>
        <motion.p
          className="ui-supporting-text mt-2 max-w-2xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          精选实际建筑案例，应用构造知识进行直观解析。
        </motion.p>
      </header>

      {/* ── Grid ── */}
      <main className="flex-1 px-6 md:px-10 pb-16 max-w-6xl mx-auto w-full">
        {caseNodes.length === 0 ? (
          <div className="text-center py-20 text-muted-soft text-sm">
            暂无案例数据
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {caseNodes.map((node, i) => (
              <CaseCard key={node.id} node={node} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
