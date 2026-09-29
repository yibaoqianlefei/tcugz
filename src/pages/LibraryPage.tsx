import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiBookOpen, FiHelpCircle, FiGithub } from "react-icons/fi";
import { nodesIndex } from "../data/nodesIndex";

const categoryIcons: Record<string, string> = {
  "墙体": "🧱",
  "屋顶": "🏠",
  "楼梯": "📐",
  "地基与基础": "🏛️",
  "楼底层": "🪜",
  "门窗": "🪟",
};

function NodeCard({ node, index }: { node: typeof nodesIndex[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
    >
      <Link
        to={`/node/${node.id}`}
        className="ui-resource-card flex h-full flex-col p-4
          hover:shadow-[0_8px_24px_rgba(20,20,19,0.07)] hover:-translate-y-0.5
          hover:border-primary/35 transition-all duration-200 group"
      >
        <div className="w-full h-28 bg-surface-soft rounded-lg mb-3 flex items-center justify-center overflow-hidden">
          {node.thumbnail ? (
            <img src={node.thumbnail} alt={node.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl" aria-hidden="true">{categoryIcons[node.category] || "📦"}</span>
          )}
        </div>

        <h3 className="text-base font-medium text-ink group-hover:text-primary transition-colors leading-snug">
          {node.title}
        </h3>
        <p className="text-[13px] text-muted mt-1.5 leading-relaxed line-clamp-2">
          {node.description}
        </p>

        <div className="mt-auto pt-3 flex items-center gap-1.5 text-xs text-primary font-medium">
          查看构造
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}

export default function LibraryPage() {
  const libraryNodes = nodesIndex.filter((node) => node.category !== "案例");
  const categories = [...new Set(libraryNodes.map((node) => node.category))];

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="max-w-6xl mx-auto w-full px-6 md:px-10 pt-9 pb-7 md:pt-12 md:pb-9">
        <p className="ui-eyebrow mb-2">构造资源</p>
        <motion.h1
          className="ui-page-heading"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          节点库
        </motion.h1>
        <motion.p
          className="ui-supporting-text mt-2 max-w-2xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          按建筑部位浏览 {libraryNodes.length} 个构造节点，打开图纸与三维模型进行学习。
        </motion.p>
      </header>

      <main className="flex-1 px-6 md:px-10 pb-16 max-w-6xl mx-auto w-full">
        {categories.map((category) => {
          const categoryNodes = libraryNodes.filter((node) => node.category === category);
          return (
            <section key={category} className="mb-10">
              <div className="flex items-baseline gap-3 mb-4 pb-2 border-b border-hairline">
                <h2 className="ui-section-heading">{category}</h2>
                <span className="text-xs text-muted-soft tabular-nums">{categoryNodes.length} 个节点</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryNodes.map((node, i) => (
                  <NodeCard key={node.id} node={node} index={i} />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="border-t border-hairline py-7 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-soft">© 2026 建筑构造交互系统</span>
          <nav className="flex items-center gap-8">
            <a href="#" className="text-sm text-muted-soft hover:text-primary transition-colors flex items-center gap-1.5">
              <FiBookOpen size={14} />关于项目
            </a>
            <a href="#" className="text-sm text-muted-soft hover:text-primary transition-colors flex items-center gap-1.5">
              <FiHelpCircle size={14} />使用说明
            </a>
            <a href="#" className="text-sm text-muted-soft hover:text-primary transition-colors flex items-center gap-1.5">
              <FiGithub size={14} />GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
