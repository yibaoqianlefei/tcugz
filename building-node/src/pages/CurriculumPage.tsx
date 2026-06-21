import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import courseModules from "../data/courseModules";
import { nodesIndex } from "../data/nodesIndex";

function ModuleGrid() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="mb-12">
        <h1 className="text-3xl font-normal font-serif text-ink tracking-tight">课程目录</h1>
        <p className="mt-2 text-muted text-base">选择要学习的构造模块</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {courseModules.map((mod: any, i: number) => {
          const nodeCount = mod.nodeIds.filter((id: string) =>
            nodesIndex.some((n) => n.id === id)
          ).length;

          if (mod.available) {
            return (
              <motion.button
                key={mod.id}
                onClick={() => navigate(`/curriculum/${mod.id}`)}
                className="bg-surface-card border border-hairline rounded-xl p-8
                  hover:shadow-[0_1px_3px_rgba(20,20,19,0.08)]
                  hover:-translate-y-2 hover:scale-[1.02] hover:border-primary/30
                  transition-all duration-300 ease-out cursor-pointer text-left group"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: "easeOut" }}
              >
                <span className="text-4xl transition-transform duration-300 ease-out group-hover:scale-110 inline-block">
                  {mod.icon}
                </span>
                <h3 className="text-xl font-normal font-serif text-ink mt-5 group-hover:text-primary transition-colors tracking-tight">
                  {mod.title}
                </h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">{mod.description}</p>
                <span className="inline-block mt-4 text-xs font-medium text-primary bg-hairline px-3 py-1 rounded-full">
                  {nodeCount} 个节点
                </span>
              </motion.button>
            );
          }

          return (
            <motion.div
              key={mod.id}
              className="bg-surface-soft border border-hairline rounded-xl p-8 opacity-50 cursor-default text-left"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 0.5, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: "easeOut" }}
            >
              <span className="text-4xl grayscale">{mod.icon}</span>
              <h3 className="text-xl font-normal text-muted-soft mt-5 tracking-tight">{mod.title}</h3>
              <p className="text-sm text-muted-soft mt-2 leading-relaxed">{mod.description}</p>
              <span className="inline-block mt-4 text-xs text-muted-soft bg-hairline px-3 py-1 rounded-full">
                即将上线
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function CurriculumPage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <main className="flex-1 px-6 md:px-10 py-10 max-w-5xl mx-auto w-full">
        <ModuleGrid />
      </main>
    </div>
  );
}
