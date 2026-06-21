import { motion, AnimatePresence } from "framer-motion";

const BAR_COLORS = [
  "bg-hairline",
  "bg-surface-cream-strong",
  "bg-primary/20",
  "bg-primary/40",
  "bg-primary",
] as const;

const BAR_WIDTHS = ["32%", "40%", "50%", "58%", "62%"] as const;

const barVariants: any = {
  hidden: { opacity: 0, x: -28, y: 0 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    y: [0, -3, 0],
    transition: {
      opacity: { delay: i * 0.18, duration: 0.55, ease: "easeOut" },
      x: { delay: i * 0.18, duration: 0.6, ease: "easeOut" },
      y: {
        delay: i * 0.18 + 0.6,
        duration: 1.8,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      },
    },
  }),
  exit: {
    opacity: 0,
    transition: { duration: 0.35, ease: "easeIn" },
  },
};

const containerVariants: any = {
  exit: {
    opacity: 0,
    transition: { duration: 0.4, ease: "easeIn" },
  },
};

export default function LoadingOverlay({ isLoading }: { isLoading: boolean }) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-canvas/90"
          variants={containerVariants}
          exit="exit"
        >
          {/* 5 animated bars */}
          <div className="flex flex-col items-center gap-3">
            {BAR_COLORS.map((color, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={barVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`h-1 rounded-full ${color} ${i === BAR_COLORS.length - 1 ? "shadow-[0_0_10px_rgba(204,120,92,0.15)]" : ""}`}
                style={{ width: BAR_WIDTHS[i] }}
              />
            ))}
          </div>

          {/* Spinner + text */}
          <motion.div
            className="mt-6 flex flex-col items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-transparent animate-spin" />
            <p className="text-xs text-primary/60 font-light tracking-wider">
              模型加载中...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
