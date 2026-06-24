import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function PlaceholderPage({ title = "页面" }: { title?: string }) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="bg-white rounded-xl border border-hairline shadow-[0_1px_3px_rgba(20,20,19,0.08)] p-8 max-w-md w-full text-center"
      >
        <h2 className="text-2xl font-normal font-serif text-ink tracking-tight mb-3">{title}</h2>
        <div className="w-10 h-0.5 bg-primary rounded-full mx-auto mb-4" />
        <p className="text-muted text-sm mb-6">此页面正在建设中</p>
        <Link
          to="/"
          className="inline-flex px-5 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-medium
            hover:bg-primary-active transition-colors"
        >
          返回主控制台
        </Link>
      </motion.div>
    </div>
  );
}
