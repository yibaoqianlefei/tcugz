import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import courseModules from "../data/courseModules";

// ── Lazy section data loaders (file-based, no Supabase) ─────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sectionsMap: Record<string, () => Promise<any>> = {
  introduction: () => import("../data/sections/introSections"),
  wall: () => import("../data/sections/wallSections"),
  "door-window": () => import("../data/sections/windowSections"),
  foundation: () => import("../data/sections/foundationSections"),
  floor: () => import("../data/sections/floorSections"),
  stairs: () => import("../data/sections/stairsSections"),
  roof: () => import("../data/sections/roofSections"),
  "deformation-joint": () => import("../data/sections/deformationJointSections"),
  cases: () => import("../data/sections/caseSections"),
};

// ── Types ────────────────────────────────────────────────────
interface Section {
  id: string;
  title: string;
  description: string;
  nodeIds: string[];
  available: boolean;
  icon?: string;
  to?: string;
  hasTextbook?: boolean;
  children?: Section[];
}

// ── Section Card ─────────────────────────────────────────────
function SectionCard({ sec, index, onClick }: {
  sec: Section;
  index: number;
  onClick: (sec: Section) => void;
}) {
  const hasChildren = sec.children && sec.children.length > 0;
  const nodeCount = (sec.nodeIds || []).length;
  const linkTarget =
    sec.to ||
    (sec.hasTextbook ? `/textbook/${sec.id}` : null) ||
    (nodeCount > 0 ? `/node/${sec.nodeIds[0]}` : null);

  const isClickable = hasChildren || (sec.available && linkTarget);

  const content = (
    <>
      <span className="text-4xl transition-transform duration-300 ease-out group-hover:scale-110 inline-block">
        {sec.icon || "📄"}
      </span>
      <h3 className="text-xl font-normal font-serif text-ink mt-5 group-hover:text-primary transition-colors tracking-tight">
        {sec.title}
      </h3>
      <p className="text-sm text-muted mt-2 leading-relaxed">{sec.description}</p>
      {hasChildren && (
        <span className="inline-block mt-4 text-xs font-medium text-primary bg-hairline px-3 py-1 rounded-full">
          {sec.children!.length} 个子章节
        </span>
      )}
      {!hasChildren && nodeCount > 0 && (
        <span className="inline-block mt-4 text-xs font-medium text-primary bg-hairline px-3 py-1 rounded-full">
          {nodeCount} 个节点
        </span>
      )}
    </>
  );

  if (isClickable) {
    const sharedClass =
      "block w-full bg-surface-card border border-hairline rounded-xl p-8 " +
      "hover:shadow-[0_1px_3px_rgba(20,20,19,0.08)] " +
      "hover:-translate-y-2 hover:scale-[1.02] " +
      "hover:border-primary/30 " +
      "transition-all duration-300 ease-out cursor-pointer group text-left";

    return (
      <motion.div
        key={sec.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      >
        {hasChildren ? (
          <button onClick={() => onClick(sec)} className={sharedClass}>
            {content}
          </button>
        ) : (
          <Link to={linkTarget!} className={sharedClass}>
            {content}
          </Link>
        )}
      </motion.div>
    );
  }

  // Disabled card
  return (
    <motion.div
      key={sec.id}
      className="bg-surface-soft border border-hairline rounded-xl p-8 opacity-50 cursor-default text-left"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 0.5, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
    >
      <span className="text-4xl grayscale">{sec.icon || "📄"}</span>
      <h3 className="text-xl font-normal text-muted-soft mt-5 tracking-tight">{sec.title}</h3>
      <p className="text-sm text-muted-soft mt-2 leading-relaxed">{sec.description}</p>
      <span className="inline-block mt-4 text-xs text-muted-soft bg-hairline px-3 py-1 rounded-full">
        即将上线
      </span>
    </motion.div>
  );
}

// ── Section Sub Page ─────────────────────────────────────────
export default function SectionSubPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentSection, setParentSection] = useState<Section | null>(null);

  const moduleInfo = courseModules.find((m: any) => m.id === moduleId);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const loader = sectionsMap[moduleId!];
      if (!loader) { if (!cancelled) setSections([]); return; }
      try {
        const mod = await loader();
        if (!cancelled) setSections(mod.default || []);
      } catch {
        if (!cancelled) setSections([]);
      }
    }
    setLoading(true);
    load().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [moduleId]);

  // Reset drill-down on module change
  useEffect(() => { setParentSection(null); }, [moduleId]);

  const handleDrillDown = useCallback((sec: Section) => {
    setParentSection(sec);
  }, []);

  const handleBackToParent = useCallback(() => {
    setParentSection(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const displayedSections = parentSection ? parentSection.children || [] : sections;
  const pageTitle = parentSection ? parentSection.title : moduleInfo?.title || moduleId || "";
  const pageDesc = parentSection ? parentSection.description : (moduleInfo as any)?.description || "";

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <main className="flex-1 px-6 md:px-10 py-10 max-w-5xl mx-auto w-full">
        {/* Breadcrumb */}
        <div className="mb-2">
          <span className="text-sm text-muted-soft">
            <Link to="/curriculum" className="text-primary hover:text-primary-active transition-colors">
              课程目录
            </Link>
            <span className="mx-1.5 text-muted-soft">›</span>
            {parentSection ? (
              <>
                <button onClick={handleBackToParent}
                  className="text-primary hover:text-primary-active transition-colors cursor-pointer">
                  {(moduleInfo as any)?.title || moduleId}
                </button>
                <span className="mx-1.5 text-muted-soft">›</span>
                <span className="text-muted">{parentSection.title}</span>
              </>
            ) : (
              <span className="text-muted">{(moduleInfo as any)?.title || moduleId}</span>
            )}
          </span>
        </div>

        {/* Title */}
        <motion.div
          className="mb-10 mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-normal font-serif text-ink tracking-tight">{pageTitle}</h1>
          <p className="mt-2 text-muted text-base">{pageDesc}</p>
        </motion.div>

        {/* Back button when drilled down */}
        <AnimatePresence>
          {parentSection && (
            <motion.button
              onClick={handleBackToParent}
              className="mb-6 flex items-center gap-1.5 text-sm text-primary hover:text-primary-active transition-colors cursor-pointer"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <ChevronLeft size={18} />
              返回上级
            </motion.button>
          )}
        </AnimatePresence>

        {/* Card grid */}
        {displayedSections.length === 0 ? (
          <div className="text-center py-20 text-muted-soft">
            <p>暂无内容</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={parentSection ? parentSection.id : "root"}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {displayedSections.map((sec, i) => (
                <SectionCard key={sec.id} sec={sec} index={i} onClick={handleDrillDown} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
