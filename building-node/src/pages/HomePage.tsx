import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Hammer,
  BookOpen,
  Info,
  GitPullRequest,
  X,
  Pause,
  Play,
  Briefcase,
  GraduationCap,
  Sparkles,
  BarChart3,
  SwitchCamera,
} from "lucide-react";
import MenuBackground from "../components/viewer/MenuBackground";
import LoadingOverlay from "../components/viewer/LoadingOverlay";
import backgroundScenes from "../data/backgroundScenes";
import { nodesIndex } from "../data/nodesIndex";

/* ── Animation variants ───────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, x: -24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 20 },
  },
} as const;

const titleContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
} as const;

const charVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] as const },
  },
} as const;

const lineVariants = {
  hidden: { opacity: 0, scaleX: 0 },
  show: {
    opacity: 1,
    scaleX: 1,
    transition: { duration: 0.5, ease: "easeOut" as const, delay: 0.4 },
  },
} as const;

/* ── Menu Item ─────────────────────────────────────────────── */
function MenuItem({ item, onClick, onMouseEnter }: {
  item: { icon: any; label: string; to?: string; disabled?: boolean; onMouseEnter?: () => void };
  onClick?: () => void;
  onMouseEnter?: () => void;
}) {
  const disabled = item.disabled;

  const content = (
    <>
      <item.icon size={18} strokeWidth={1.5}
        className={`flex-shrink-0 transition-colors duration-300 ${disabled ? "text-black/15" : "text-muted-soft group-hover:text-primary"}`} />
      <span className={`text-[18px] font-medium transition-colors duration-300 ${disabled ? "text-black/15" : "text-muted group-hover:text-primary"}`}>
        {item.label}
      </span>
      {disabled && (
        <span className="ml-auto text-[10px] text-muted-soft/40 font-normal">即将上线</span>
      )}
    </>
  );

  const baseClass =
    "w-full flex items-center gap-[10px] pl-[12px] h-menu-item-h rounded-[10px]" +
    " transition-all duration-300 ease-out" +
    (disabled
      ? " cursor-not-allowed"
      : " hover:bg-primary/12 hover:shadow-md hover:-translate-y-[1px] active:scale-[0.98] cursor-pointer group text-left");

  if (disabled) {
    return <div className={baseClass}>{content}</div>;
  }

  if (onClick) {
    return <button onClick={onClick} onMouseEnter={onMouseEnter} className={baseClass}>{content}</button>;
  }

  return <Link to={item.to!} onMouseEnter={onMouseEnter} className={baseClass}>{content}</Link>;
}

/* ── Navigation Menu ───────────────────────────────────────── */
function MenuContent({ }: { onModalOpen: () => void }) {
  const menuGroups = [
    {
      title: "教学资源",
      items: [
        { icon: BookOpen, label: "构造原理", to: "/curriculum" },
        {
          icon: Layers, label: "节点库", to: "/library",
          onMouseEnter: () => {
            // Preload node model on hover
            useGLTF.preload("/models/membrane-roof-01/membrane-roof-01.glb", true);
          }
        },
        { icon: Briefcase, label: "案例应用", to: "/curriculum/cases" },
      ],
    },
    {
      title: "学生实践",
      items: [
        { icon: GraduationCap, label: "自主学习", to: "/textbook/roof-membrane" },
        { icon: Hammer, label: "作业训练", to: "/games" },
      ],
    },
    {
      title: "AI 与评价",
      items: [
        { icon: Sparkles, label: "AI 助手", disabled: true },
        { icon: BarChart3, label: "评价分析", disabled: true },
      ],
    },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show"
      className="flex flex-col h-full pt-page-pt pb-page-pb">
      {/* ── Title ── */}
      <div className="flex-shrink-0">
        <motion.h1
          className="text-[38px] font-normal font-serif tracking-tight text-ink"
          variants={titleContainerVariants}>
          {"建筑构造".split("").map((ch, i) => (
            <motion.span key={i} variants={charVariants} className="inline-block">{ch}</motion.span>
          ))}
        </motion.h1>
        <motion.div
          className="w-12 h-0.5 bg-primary rounded-full mt-6"
          variants={lineVariants} />
      </div>

      {/* ── Navigation ── */}
      <div className="flex-1 mt-6">
        {menuGroups.map((group) => (
          <motion.div key={group.title} variants={itemVariants} className="mb-section-gap">
            <p className="text-[12px] font-medium tracking-[0.08em] text-[#9b948b] mb-[12px]">
              {group.title}
            </p>
            {group.items.map((item) => (
              <MenuItem key={item.label} item={item} onMouseEnter={"onMouseEnter" in item ? (item as any).onMouseEnter : undefined} />
            ))}
          </motion.div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-[44px] h-[44px] rounded-full bg-hairline flex items-center justify-center text-primary text-base font-semibold flex-shrink-0">
            U
          </div>
          <div className="min-w-0">
            <p className="text-[16px] font-medium text-black/80 truncate">学生用户</p>
            <p className="text-[13px] text-black/40">建筑学</p>
          </div>
        </div>
      </div>

      <motion.p className="text-xs text-muted-soft mt-4 tracking-wide" variants={itemVariants}>
        探索建筑构造的空间逻辑
      </motion.p>
    </motion.div>
  );
}

/* ── About Modal ───────────────────────────────────────────── */
function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/20" onClick={onClose} />
          <motion.div
            className="relative bg-canvas rounded-xl border border-hairline shadow-[0_1px_3px_rgba(20,20,19,0.08)] p-8 max-w-md w-full"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <button onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-surface-card hover:bg-surface-cream-strong text-muted-soft hover:text-body transition-colors">
              <X size={16} />
            </button>
            <h2 className="text-xl font-normal font-serif text-ink tracking-tight mb-3">关于项目</h2>
            <p className="text-muted text-sm leading-relaxed mb-5">
              建筑构造交互系统是一个面向建筑学教育的开源工具，通过三维可视化和交互式分解视图，帮助学生和从业者直观理解建筑构造的空间逻辑。
            </p>
            <div className="space-y-2.5 text-sm text-muted">
              <div className="flex justify-between">
                <span className="text-muted-soft">版本</span>
                <span className="tabular-nums">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">许可协议</span>
                <span>MIT</span>
              </div>
            </div>
            <div className="mt-7 pt-5 border-t border-hairline text-center text-xs text-muted-soft">
              开源教育工具 · 探索建筑构造的空间逻辑
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Stats Card ────────────────────────────────────────────── */
function StatsOverlay() {
  const totalNodes = nodesIndex.length;
  const categories = [...new Set(nodesIndex.map((n) => n.category))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
      className="absolute left-8 bottom-8 z-20 flex flex-col gap-4"
    >
      {/* Title */}
      <div>
        <h2 className="text-2xl font-normal font-serif text-ink tracking-tight">
          建筑构造交互系统
        </h2>
        <p className="text-sm text-muted mt-1">三维可视化 · 交互式学习</p>
      </div>

      {/* Stats row */}
      <div className="flex gap-4">
        <div className="bg-canvas/85 backdrop-blur-md rounded-xl border border-hairline px-5 py-3 shadow-[0_1px_3px_rgba(20,20,19,0.04)]">
          <div className="text-2xl font-semibold text-primary tabular-nums">{totalNodes}</div>
          <div className="text-xs text-muted-soft mt-0.5">构造节点</div>
        </div>
        <div className="bg-canvas/85 backdrop-blur-md rounded-xl border border-hairline px-5 py-3 shadow-[0_1px_3px_rgba(20,20,19,0.04)]">
          <div className="text-2xl font-semibold text-primary tabular-nums">{categories.length}</div>
          <div className="text-xs text-muted-soft mt-0.5">分类</div>
        </div>
        <div className="bg-canvas/85 backdrop-blur-md rounded-xl border border-hairline px-5 py-3 shadow-[0_1px_3px_rgba(20,20,19,0.04)]">
          <div className="text-2xl font-semibold text-primary tabular-nums">3D</div>
          <div className="text-xs text-muted-soft mt-0.5">交互视图</div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Home Page ─────────────────────────────────────────────── */
export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [bgLoading, setBgLoading] = useState(true);
  const currentScene = backgroundScenes[sceneIndex];

  // Show loader when scene changes
  useEffect(() => {
    setBgLoading(true);
  }, [sceneIndex]);

  // Preload all background models on mount
  useEffect(() => {
    const paths = backgroundScenes.map((s) => s.modelPath).filter(Boolean);
    paths.forEach((p) => useGLTF.preload(p, true));
  }, []);

  const handleBgLoaded = useCallback(() => setBgLoading(false), []);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* ── Left Sidebar ── */}
      <aside className="hidden md:flex w-sidebar flex-shrink-0 bg-canvas border-r border-hairline flex-col h-full px-10">
        <MenuContent onModalOpen={() => setModalOpen(true)} />
      </aside>

      {/* ── Right: 3D Scene ── */}
      <div className="hidden md:block flex-1 h-full relative">
        {/* Top nav bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-end items-center h-10 px-4 bg-white/60 backdrop-blur-md border-b border-white/20">
          <Link to="/contribute"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-surface-card">
            <GitPullRequest size={14} strokeWidth={1.5} />
            <span>贡献节点</span>
          </Link>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-surface-card ml-1">
            <Info size={14} strokeWidth={1.5} />
            <span>关于项目</span>
          </button>
        </div>

        {/* 3D Canvas */}
        <Canvas
          camera={{ near: 1, far: 100, position: [0, 0.5, 4.0], fov: 40 }}
          dpr={[1, 1.5]}
          shadows
          gl={{ antialias: true, alpha: false }}
        >
          <MenuBackground
            key={sceneIndex}
            autoRotate={autoRotate}
            modelPath={currentScene.modelPath}
            position={currentScene.position as [number, number, number]}
            onLoaded={handleBgLoaded}
          />
        </Canvas>

        {/* Loading overlay */}
        <LoadingOverlay isLoading={bgLoading} />

        {/* Stats overlay — bottom left */}
        <StatsOverlay />

        {/* Bottom-right controls */}
        <div className="absolute bottom-8 right-8 z-20 flex gap-2">
          {/* Scene switcher */}
          <button
            onClick={() => setSceneIndex((prev) => (prev + 1) % backgroundScenes.length)}
            className="w-11 h-11 rounded-full bg-canvas border border-hairline flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-surface-card"
            title={`场景: ${currentScene.name}（点击切换）`}
          >
            <SwitchCamera size={17} className="text-muted-soft hover:text-primary" />
          </button>
          {/* Auto-rotate toggle */}
          <button
            onClick={() => setAutoRotate((v) => !v)}
            className="w-11 h-11 rounded-full bg-canvas border border-hairline flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-surface-card"
            title={autoRotate ? "暂停旋转" : "恢复旋转"}
          >
            {autoRotate ? (
              <Pause size={17} className="text-primary" />
            ) : (
              <Play size={17} className="text-muted-soft hover:text-primary" />
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile: nav only ── */}
      <div className="flex md:hidden w-full h-full bg-canvas flex-col justify-center px-8">
        <MenuContent onModalOpen={() => setModalOpen(true)} />
      </div>

      <AboutModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
