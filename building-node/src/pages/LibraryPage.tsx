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
        className="block bg-surface-card border border-hairline rounded-xl p-6
          hover:shadow-[0_1px_3px_rgba(20,20,19,0.08)]
          hover:-translate-y-1.5 hover:scale-[1.01]
          hover:border-primary/30
          transition-all duration-300 ease-out
          cursor-pointer group"
      >
        <div className="w-full h-24 bg-surface-soft rounded-xl mb-4 flex items-center justify-center overflow-hidden group-hover:bg-hairline/70 transition-colors">
          {node.thumbnail ? (
            <img src={node.thumbnail} alt={node.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">{categoryIcons[node.category] || "📦"}</span>
          )}
        </div>

        <h3 className="text-lg font-normal font-serif text-ink group-hover:text-primary transition-colors tracking-tight">
          {node.title}
        </h3>
        <p className="text-sm text-muted mt-1.5 leading-relaxed line-clamp-2">
          {node.description}
        </p>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          进入节点
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}

export default function LibraryPage() {
  const categories = [...new Set(nodesIndex.map((n) => n.category))];

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="pt-12 pb-8 md:pt-16 md:pb-10 px-6 text-center">
        <motion.h1
          className="text-3xl md:text-4xl font-normal font-serif text-ink tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          节点库
        </motion.h1>
        <motion.p
          className="mt-2 text-muted text-base max-w-lg mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          浏览所有建筑构造节点，选择感兴趣的系统进行交互式探索。
        </motion.p>
      </header>

      <main className="flex-1 px-6 md:px-10 pb-20 max-w-5xl mx-auto w-full">
        {categories.map((category) => {
          const categoryNodes = nodesIndex.filter((n) => n.category === category);
          return (
            <section key={category} className="mb-14">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-primary rounded-full flex-shrink-0" />
                <h2 className="text-xl text-body font-medium tracking-tight">{category}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {categoryNodes.map((node, i) => (
                  <NodeCard key={node.id} node={node} index={i} />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="border-t border-hairline py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
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
