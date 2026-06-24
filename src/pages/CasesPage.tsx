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
      className="bg-white border border-[#e6dfd8] rounded-lg p-6 shadow-sm
        hover:shadow-[0_2px_8px_rgba(20,20,19,0.08)] hover:-translate-y-1
        transition-all duration-300 ease-out
        relative group"
    >
      {/* Placeholder thumbnail */}
      <div className="w-full h-28 bg-surface-soft rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        <Building2 size={48} strokeWidth={1} className="text-muted-soft opacity-30" />
      </div>

      {/* Case title */}
      <h3 className="text-lg font-normal font-serif text-ink tracking-tight">
        郓城案例 {node.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted mt-1.5 leading-relaxed line-clamp-2">
        {node.description}
      </p>

      {/* Red tag */}
      <span className="absolute bottom-4 right-4 text-[10px] font-medium text-error bg-error/5 px-2 py-0.5 rounded-full">
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
      <header className="pt-12 pb-8 md:pt-16 md:pb-10 px-6 text-center">
        <motion.h1
          className="text-3xl md:text-4xl font-normal font-serif text-ink tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          案例应用
        </motion.h1>
        <motion.p
          className="mt-2 text-muted text-base max-w-lg mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          精选实际建筑案例，应用构造知识进行直观解析。
        </motion.p>
      </header>

      {/* ── Grid ── */}
      <main className="flex-1 px-6 md:px-10 pb-20 max-w-5xl mx-auto w-full">
        {caseNodes.length === 0 ? (
          <div className="text-center py-20 text-muted-soft text-sm">
            暂无案例数据
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {caseNodes.map((node, i) => (
              <CaseCard key={node.id} node={node} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
