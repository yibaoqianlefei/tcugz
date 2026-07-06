import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import courseModules from "../data/courseModules";
import { nodesIndex } from "../data/nodesIndex";

/* ── Section lookup tables ── */
import introSections from "../data/sections/introSections";
import wallSections from "../data/sections/wallSections";
import windowSections from "../data/sections/windowSections";
import foundationSections from "../data/sections/foundationSections";
import floorSections from "../data/sections/floorSections";
import stairsSections from "../data/sections/stairsSections";
import roofSections from "../data/sections/roofSections";
import deformationJointSections from "../data/sections/deformationJointSections";

const ALL_SECTIONS: Record<string, any[]> = {
  introduction: introSections,
  wall: wallSections,
  "door-window": windowSections,
  foundation: foundationSections,
  floor: floorSections,
  stairs: stairsSections,
  roof: roofSections,
  "deformation-joint": deformationJointSections,
};

const MODULE_CATEGORY_MAP: Record<string, string> = {
  wall: "墙体",
  roof: "屋顶",
};

/* ── Static .md import map (Vite doesn't support template-literal dynamic ?raw) ── */
import wallsIndex from "../data/textbook/walls/index.md?raw";
import wallsPartitions from "../data/textbook/walls/partitions.md?raw";
import wallsDesign from "../data/textbook/walls/wall-design-requirements.md?raw";
import roofIndex from "../data/textbook/roof/index.md?raw";

const MD_MAP: Record<string, string> = {
  "wall/index": wallsIndex,
  "wall/wall-partition": wallsPartitions,
  "wall/wall-design-requirements": wallsDesign,
  "roof/index": roofIndex,
};

export default function TextbookPage() {
  const { sectionId, moduleId, chapterId } = useParams<{
    sectionId?: string;
    moduleId?: string;
    chapterId?: string;
  }>();

  // ── Resolve context ──
  const ctx = (() => {
    // Dual-param: /textbook/:moduleId/:chapterId
    if (moduleId && chapterId) {
      const mod = courseModules.find((m) => m.id === moduleId);
      if (!mod) return null;
      const secs = ALL_SECTIONS[moduleId] || [];
      const sec = secs.find((s: any) => s.id === chapterId);
      return {
        module: mod,
        section: sec ?? null,
        sections: secs,
        isModule: false,
        category: MODULE_CATEGORY_MAP[moduleId] || "",
        chapterId,
      };
    }
    // Single-param: /textbook/:sectionId
    const id = sectionId || moduleId;
    if (!id) return null;
    const mod = courseModules.find((m) => m.id === id);
    if (mod) {
      const secs = ALL_SECTIONS[mod.id] || [];
      return {
        module: mod,
        sections: secs,
        isModule: true,
        category: MODULE_CATEGORY_MAP[mod.id] || "",
        chapterId: null,
      };
    }
    for (const [modId, secs] of Object.entries(ALL_SECTIONS)) {
      const sec = secs.find((s: any) => s.id === id);
      if (sec) {
        const parent = courseModules.find((m) => m.id === modId);
        return {
          module: parent!,
          section: sec,
          sections: secs,
          isModule: false,
          category: MODULE_CATEGORY_MAP[modId] || "",
          chapterId: id,
        };
      }
    }
    return null;
  })();

  // ── Lookup markdown content ──
  const fileKey = ctx?.isModule
    ? `${ctx.module.id}/index`
    : `${ctx?.module.id}/${(ctx as any)?.chapterId}`;
  const mdContent = (ctx && fileKey) ? (MD_MAP[fileKey] ?? "") : "";

  if (!ctx) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted text-lg">未找到该章节</p>
          <Link to="/textbook/introduction" className="text-primary text-sm mt-3 inline-block hover:underline">
            返回教材首页
          </Link>
        </div>
      </div>
    );
  }

  const { module: mod, section, sections, isModule, category } = ctx;
  const displayTitle = isModule ? mod.title : (section as any)?.title ?? mod.title;
  const displayDesc = isModule ? mod.description : (section as any)?.description ?? "";

  const relatedNodes = category
    ? nodesIndex.filter((n) => n.category === category)
    : [];

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto w-full p-8">
        {/* ── Breadcrumb ── */}
        <nav className="mb-8 text-sm text-muted-soft">
          <Link to="/" className="hover:text-primary transition-colors">首页</Link>
          <span className="mx-1.5">›</span>
          <span className="text-muted">构造基础</span>
          <span className="mx-1.5">›</span>
          <Link to={`/textbook/${mod.id}`} className="hover:text-primary transition-colors">
            {mod.title}
          </Link>
          {!isModule && (
            <>
              <span className="mx-1.5">›</span>
              <span className="text-muted">{displayTitle}</span>
            </>
          )}
        </nav>

        <div className="flex gap-10">
          {/* ── Left: Content ── */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <h1 className="text-3xl font-normal font-serif text-ink tracking-tight">
                {displayTitle}
              </h1>
              {displayDesc && (
                <p className="mt-2 text-muted text-base leading-relaxed">{displayDesc}</p>
              )}
            </motion.div>

            {/* ── Markdown content ── */}
            <motion.div
              className="mt-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            >
              {mdContent ? (
                <div
                  className="prose prose-stone max-w-none
                    prose-headings:font-serif prose-headings:text-ink prose-headings:font-normal
                    prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4
                    prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                    prose-p:text-body prose-p:leading-relaxed
                    prose-strong:text-body-strong
                    prose-table:border-collapse prose-table:w-full prose-table:my-4
                    prose-th:border prose-th:border-hairline prose-th:p-3 prose-th:text-left prose-th:text-sm prose-th:font-medium prose-th:bg-surface-soft
                    prose-td:border prose-td:border-hairline prose-td:p-3 prose-td:text-sm prose-td:text-body
                    prose-li:text-body prose-li:leading-relaxed
                    prose-a:text-primary
                  "
                  dangerouslySetInnerHTML={{
                    __html: mdContent
                      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium text-body-strong mt-6 mb-2">$1</h3>')
                      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-serif text-ink font-normal mt-8 mb-3">$1</h2>')
                      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-serif text-ink font-normal mt-8 mb-4">$1</h1>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-body-strong">$1</strong>')
                      .replace(/\n\n/g, '</p><p class="text-body leading-relaxed mb-4">')
                      .replace(/^- (.*$)/gim, '<li class="text-body ml-4 mb-1">$1</li>'),
                  }}
                />
              ) : (
                <div className="border-2 border-dashed border-hairline rounded-2xl p-12 text-center">
                  <p className="text-muted-soft text-sm">章节内容正在建设中</p>
                </div>
              )}

              {/* ── Module chapter list ── */}
              {isModule && sections.length > 0 && (
                <div className="mt-12 pt-8 border-t border-hairline">
                  <h2 className="text-xl font-normal font-serif text-ink mb-4">章节列表</h2>
                  <div className="grid gap-3">
                    {sections.map((sec: any) => (
                      <Link
                        key={sec.id}
                        to={`/textbook/${mod.id}/${sec.id}`}
                        className={`block p-4 rounded-xl border transition-all duration-200
                          ${sec.available
                            ? "bg-surface-card border-hairline hover:border-primary/30 hover:shadow-sm cursor-pointer"
                            : "bg-surface-soft/50 border-hairline/50 cursor-not-allowed opacity-60"
                          }`}
                        onClick={(e) => { if (!sec.available) e.preventDefault(); }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-body">{sec.title}</span>
                          <span className="text-[10px] text-muted-soft">
                            {sec.available ? "点击阅读 →" : "即将上线"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-soft mt-1">{sec.description}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Right: Sidebar (320px) ── */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-8">
              <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">
                本章相关构造模型
              </h3>
              {relatedNodes.length > 0 ? (
                <div className="space-y-3">
                  {relatedNodes.map((node) => (
                    <Link
                      key={node.id}
                      to={`/node/${node.id}`}
                      className="block bg-surface-card border border-hairline rounded-xl p-4
                        hover:border-primary/30 hover:shadow-sm hover:-translate-y-0.5
                        transition-all duration-200 cursor-pointer group"
                    >
                      <h4 className="text-sm font-normal font-serif text-ink group-hover:text-primary transition-colors">
                        {node.title}
                      </h4>
                      <p className="text-xs text-muted mt-1 line-clamp-2">{node.description}</p>
                      <span className="inline-block mt-2 text-[10px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        打开 3D 模型 →
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-soft leading-relaxed">暂无关联的 3D 构造模型</p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
