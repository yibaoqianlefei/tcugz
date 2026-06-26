import { useState, useEffect, useCallback, useRef } from "react";
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
  ExternalLink,
  Sun,
  LogIn,
  LogOut,
  ChevronRight,
} from "lucide-react";
import MenuBackground from "../components/viewer/MenuBackground";
import LoadingOverlay from "../components/viewer/LoadingOverlay";
import backgroundScenes from "../data/backgroundScenes";
import { nodesIndex } from "../data/nodesIndex";
import { useAuthStore } from "../store/authStore";
import courseModules from "../data/courseModules";
// @ts-expect-error — .js section files (allowJs enabled)
import introSections from "../data/sections/introSections.js";
// @ts-expect-error — .js section files
import wallSections from "../data/sections/wallSections.js";
// @ts-expect-error — .js section files
import windowSections from "../data/sections/windowSections.js";
// @ts-expect-error — .js section files
import foundationSections from "../data/sections/foundationSections.js";
// @ts-expect-error — .js section files
import floorSections from "../data/sections/floorSections.js";
// @ts-expect-error — .js section files
import stairsSections from "../data/sections/stairsSections.js";
// @ts-expect-error — .js section files
import roofSections from "../data/sections/roofSections.js";
// @ts-expect-error — .js section files
import deformationJointSections from "../data/sections/deformationJointSections.js";

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

/* ── Section data lookup ──────────────────────────────────── */
interface SectionItem {
  id: string;
  title: string;
  description: string;
  nodeIds: string[];
  available: boolean;
}

const sectionMap: Record<string, SectionItem[]> = {
  introduction: introSections,
  wall: wallSections,
  "door-window": windowSections,
  foundation: foundationSections,
  floor: floorSections,
  stairs: stairsSections,
  roof: roofSections,
  "deformation-joint": deformationJointSections,
};

/* ── Console dump: 8 modules + sections ────────────────────── */
console.group("📚 构造原理 — 8 个主模块及其子章节");
courseModules.forEach((mod) => {
  const secs = sectionMap[mod.id] || [];
  console.log(
    `\n📁 ${mod.icon} ${mod.title} (${mod.id})${secs.length ? ` — ${secs.length} 个子章节` : " — 暂无子章节"}`,
  );
  secs.forEach((s) => {
    console.log(`   ├─ ${s.title} [${s.id}] ${s.available ? "✅" : "⏳"}`);
  });
});
console.groupEnd();

/* ── Module-level menu definition ──────────────────────────── */
interface MenuChildDef {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  sections?: SectionItem[];
}

interface MenuItemDef {
  icon: any;
  label: string;
  id: string;
  to?: string;
  children?: MenuChildDef[];
}

const menuItems: MenuItemDef[] = [
  { icon: BookOpen, label: "构造原理", id: "curriculum",
    children: courseModules.map((m) => ({
      id: m.id,
      label: m.title,
      icon: m.icon,
      description: m.description,
      sections: sectionMap[m.id] || [],
    })),
  },
  { icon: Layers, label: "节点库", id: "library", to: "/library" },
  { icon: Briefcase, label: "案例应用", id: "cases", to: "/curriculum/cases" },
  { icon: GraduationCap, label: "基础学习", id: "textbook", to: "/textbook/roof-membrane" },
  { icon: Hammer, label: "作业训练", id: "games", to: "/games" },
  { icon: BarChart3, label: "数据分析", id: "data", to: "/data" },
  { icon: ExternalLink, label: "拓展链接", id: "resources", to: "/resources" },
  { icon: Sparkles, label: "AI 问答", id: "ai", to: "/ai" },
];

function getExpandedChildren(id: string | null): MenuChildDef[] | null {
  if (!id) return null;
  return menuItems.find((m) => m.id === id)?.children ?? null;
}
/* ── Left Column — Main Menu ────────────────────────────────── */
function MenuContent({
  expandedId,
  setExpandedId,
  onModalOpen,
}: {
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onModalOpen: () => void;
}) {
  const totalNodes = nodesIndex.length;
  const categories = [...new Set(nodesIndex.map((n) => n.category))];

  // Auth state
  const { isLoggedIn, userName, login, logout } = useAuthStore();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show"
      className="flex flex-col h-full pt-page-pt pb-page-pb">
      {/* ── Title ── */}
      <div className="flex-shrink-0">
        <motion.h1
          className="text-[48px] font-normal font-serif tracking-tight text-ink"
          variants={titleContainerVariants}>
          {"建筑构造".split("").map((ch, i) => (
            <motion.span key={i} variants={charVariants} className="inline-block">{ch}</motion.span>
          ))}
        </motion.h1>
        <motion.div
          className="w-16 h-[2px] bg-primary rounded-full mt-6"
          variants={lineVariants} />
      </div>

      {/* ── Navigation: scrollable menu area ── */}
      <nav
        className="flex-1 flex flex-col gap-3 pt-8 overflow-y-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {menuItems.map((item) => {
          const isExpanded = expandedId === item.id;
          const hasChildren = !!item.children;

          return (
            <motion.div key={item.label} variants={itemVariants}>
              {hasChildren ? (
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className={`w-full flex items-center gap-3 pl-3 h-menu-item-h rounded-[12px]
                    transition-all duration-300 ease-out cursor-pointer group text-left
                    hover:bg-primary/12 hover:shadow-md hover:-translate-y-[1px] active:scale-[0.98]
                    ${isExpanded ? "bg-primary/8 ring-1 ring-primary/20" : ""}`}
                >
                  <item.icon size={22} strokeWidth={1.5}
                    className={`flex-shrink-0 transition-colors duration-300 ${isExpanded ? "text-primary" : "text-muted-soft group-hover:text-primary"}`} />
                  <span className={`text-[22px] font-medium transition-colors duration-300 ${isExpanded ? "text-primary" : "text-muted group-hover:text-primary"}`}>
                    {item.label}
                  </span>
                  <ChevronRight size={18} strokeWidth={1.5}
                    className={`ml-auto transition-all duration-300 ${isExpanded ? "text-primary rotate-90" : "text-muted-soft group-hover:text-primary"}`} />
                </button>
              ) : item.to ? (
                <Link to={item.to}
                  className="w-full flex items-center gap-3 pl-3 h-menu-item-h rounded-[12px]
                    transition-all duration-300 ease-out
                    hover:bg-primary/12 hover:shadow-md hover:-translate-y-[1px] active:scale-[0.98] cursor-pointer group text-left"
                >
                  <item.icon size={22} strokeWidth={1.5}
                    className="flex-shrink-0 transition-colors duration-300 text-muted-soft group-hover:text-primary" />
                  <span className="text-[22px] font-medium transition-colors duration-300 text-muted group-hover:text-primary">
                    {item.label}
                  </span>
                </Link>
              ) : null}
            </motion.div>
          );
        })}
      </nav>

      {/* ── Login / User ── */}
      <motion.div variants={itemVariants} className="mb-3 flex-shrink-0">
        <button
          onClick={() => isLoggedIn ? logout() : setLoginModalOpen(true)}
          className="w-full flex items-center gap-[10px] pl-[12px] h-menu-item-h rounded-[12px]
            text-left transition-all duration-300 ease-out
            hover:bg-primary/12 hover:shadow-md hover:-translate-y-[1px] active:scale-[0.98] cursor-pointer group"
        >
          {isLoggedIn ? (
            <>
              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] text-primary font-semibold">{userName[0]}</span>
              </div>
              <span className="text-[22px] font-medium text-muted group-hover:text-primary transition-colors">
                {userName}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); logout(); }}
                className="ml-auto text-muted-soft hover:text-primary transition-colors p-1"
                title="退出登录"
              >
                <LogOut size={16} strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <>
              <LogIn size={20} strokeWidth={1.5}
                className="flex-shrink-0 transition-colors duration-300 text-muted-soft group-hover:text-primary" />
              <span className="text-[22px] font-medium transition-colors duration-300 text-muted group-hover:text-primary">
                用户登录
              </span>
            </>
          )}
        </button>
      </motion.div>

      {/* ── Stats (fixed bottom) ── */}
      <motion.div variants={itemVariants} className="flex-shrink-0 border-t border-hairline pt-5">
        <div className="flex gap-3">
          <StatCard value={totalNodes} label="构造节点" />
          <StatCard value={categories.length} label="分类" />
          <StatCard value="3D" label="交互视图" />
        </div>
        <p className="text-xs text-muted-soft mt-3 leading-relaxed">
          三维可视化 · 交互式学习
        </p>
      </motion.div>

      <motion.p className="text-xs text-muted-soft tracking-wide flex-shrink-0 mt-4" variants={itemVariants}>
        探索建筑构造的空间逻辑
      </motion.p>

      {/* ── Login Modal ── */}
      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLogin={(name) => { login(name); setLoginModalOpen(false); }}
      />
    </motion.div>
  );
}

/* ── Right Column — Sub-menu Panel ──────────────────────────── */
function SubMenuPanel({
  expandedId,
}: {
  expandedId: string;
  onClose?: () => void;
}) {
  const children = getExpandedChildren(expandedId);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  if (!children) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Modules + Sections (scrollable, hidden scrollbar) */}
      <div
        className="flex-1 overflow-y-auto px-4 [&::-webkit-scrollbar]:hidden"
        style={{ paddingTop: "180px", scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        <div className="space-y-0.5">
          {children.map((mod, mi) => {
            const isActive = activeModuleId === mod.id;
            const hasSections = mod.sections && mod.sections.length > 0;

            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: mi * 0.05 }}
              >
                {/* ── Module header (clickable) ── */}
                <button
                  onClick={() => setActiveModuleId(isActive ? null : mod.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-3 rounded-[8px]
                    text-left transition-all duration-200 cursor-pointer
                    ${isActive
                      ? "bg-primary/8 text-primary"
                      : "hover:bg-primary/5 text-muted hover:text-primary"
                    }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-200 ${isActive ? "bg-primary" : "bg-muted-soft/40"}`} />
                  <span className="text-lg font-medium truncate">
                    {mod.label}
                  </span>
                  <span className="text-xs text-muted-soft ml-auto flex-shrink-0">
                    {hasSections ? mod.sections!.length : 0}
                  </span>
                  <ChevronRight size={16} strokeWidth={1.5}
                    className={`flex-shrink-0 transition-all duration-200 ${isActive ? "text-primary rotate-90" : "text-muted-soft"}`} />
                </button>

                {/* ── Sections (accordion) ── */}
                <AnimatePresence initial={false}>
                  {isActive && hasSections && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="ml-6 mt-0.5 mb-2 space-y-0.5 border-l-2 border-hairline pl-3">
                        {mod.sections!.map((sec, si) => (
                          <motion.button
                            key={sec.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15, delay: si * 0.03 }}
                            onClick={() => console.log("选中了章节:", sec.title, "| 所属模块:", mod.label)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px]
                              text-left text-base text-muted
                              hover:bg-primary/8 hover:text-primary
                              transition-all duration-200 cursor-pointer"
                          >
                            <span className="w-1 h-1 rounded-full bg-muted-soft/30 flex-shrink-0" />
                            <span className="truncate">{sec.title}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty state */}
                {isActive && !hasSections && (
                  <AnimatePresence>
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-sm text-muted-soft ml-9 pl-1.5 py-1.5 italic overflow-hidden"
                    >
                      暂无子章节
                    </motion.p>
                  </AnimatePresence>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Login Modal ────────────────────────────────────────────── */
function LoginModal({
  open,
  onClose,
  onLogin,
}: {
  open: boolean;
  onClose: () => void;
  onLogin: (name: string) => void;
}) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userName = name.trim() || "学生";
    onLogin(userName);
    setName("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/20" onClick={onClose} />
          <motion.div
            className="relative bg-canvas rounded-xl border border-hairline shadow-[0_4px_24px_rgba(20,20,19,0.12)] p-8 max-w-sm w-full"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-surface-card hover:bg-hairline text-muted-soft hover:text-body transition-colors"
            >
              <X size={16} />
            </button>

            <h2 className="text-lg font-medium text-ink mb-1">用户登录</h2>
            <p className="text-xs text-muted mb-6">模拟教学系统</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted-soft block mb-1">用户名</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="张三 / 李四"
                  className="w-full h-10 px-4 rounded-xl bg-surface-card border border-hairline
                    text-sm text-body placeholder:text-muted-soft/50
                    focus:outline-none focus:border-primary/40 focus:bg-white
                    transition-colors duration-200"
                />
              </div>
              <div>
                <label className="text-xs text-muted-soft block mb-1">密码</label>
                <input
                  type="password"
                  placeholder="任意密码"
                  className="w-full h-10 px-4 rounded-xl bg-surface-card border border-hairline
                    text-sm text-body placeholder:text-muted-soft/50
                    focus:outline-none focus:border-primary/40 focus:bg-white
                    transition-colors duration-200"
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-primary text-white text-sm font-medium
                  hover:bg-primary-active transition-colors active:scale-[0.98]"
              >
                登录
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Small stat card for sidebar ── */
function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex-1 bg-surface-card rounded-lg border border-hairline px-3 py-2 text-center">
      <div className="text-lg font-semibold text-primary tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-soft">{label}</div>
    </div>
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

/* ── Home Page ─────────────────────────────────────────────── */
export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [bgLoading, setBgLoading] = useState(true);
  const [showShadows, setShowShadows] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const currentScene = backgroundScenes[sceneIndex];
  const container3dRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // ResizeObserver: track 3D viewport width for model scale adjustment
  useEffect(() => {
    const el = container3dRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
      {/* ── Left Sidebar (two-column: main menu + sub-menu panel) ── */}
      <motion.aside
        layout
        transition={{ duration: 0.28, ease: "easeInOut" }}
        className="hidden md:flex flex-shrink-0 h-screen overflow-hidden bg-canvas"
      >
        {/* ── Left column: main menu (fixed width) ── */}
        <div className="w-sidebar flex-shrink-0 flex flex-col h-full px-10 border-r border-hairline bg-canvas">
          <MenuContent
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            onModalOpen={() => setModalOpen(true)}
          />
        </div>

        {/* ── Right column: sub-menu panel (animated width) ── */}
        <AnimatePresence initial={false}>
          {expandedId && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="overflow-hidden bg-canvas border-r border-hairline flex-shrink-0"
              style={{ minWidth: 0 }}
            >
              <div style={{ width: 340 }} className="h-full">
                <SubMenuPanel
                  expandedId={expandedId}
                  onClose={() => setExpandedId(null)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* ── Right: 3D Scene ── */}
      <div ref={container3dRef} className="hidden md:block flex-1 h-full relative min-w-0">
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
            showShadows={showShadows}
            layoutKey={expandedId ? 1 : 0}
            containerWidth={containerWidth}
          />
        </Canvas>

        {/* Loading overlay */}
        <LoadingOverlay isLoading={bgLoading} />

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
          {/* Shadow toggle */}
          <button
            onClick={() => setShowShadows((v) => !v)}
            className="w-11 h-11 rounded-full bg-canvas border border-hairline flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-surface-card"
            title={showShadows ? "关闭阴影" : "开启阴影"}
          >
            <Sun size={17} className={showShadows ? "text-primary" : "text-muted-soft hover:text-primary"} />
          </button>
        </div>
      </div>

      {/* ── Mobile: nav only ── */}
      <div className="flex md:hidden w-full h-full bg-canvas flex-col justify-center px-8">
        <MenuContent
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          onModalOpen={() => setModalOpen(true)}
        />
      </div>

      <AboutModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
