import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import courseModules from "../data/courseModules";
import { nodesIndex } from "../data/nodesIndex";
import { markdownComponents } from "../components/textbook/MarkdownComponents";
import ChapterHero from "../components/textbook/ChapterHero";
import RelatedModelsPanel from "../components/textbook/RelatedModelsPanel";
import ChapterTOC from "../components/textbook/ChapterTOC";
import PrevNextChapter from "../components/textbook/PrevNextChapter";

/* ── Section lookup ── */
import introSections from "../data/sections/introSections";
import wallSections from "../data/sections/wallSections";
import windowSections from "../data/sections/windowSections";
import foundationSections from "../data/sections/foundationSections";
import floorSections from "../data/sections/floorSections";
import stairsSections from "../data/sections/stairsSections";
import roofSections from "../data/sections/roofSections";
import deformationJointSections from "../data/sections/deformationJointSections";

const ALL_SECTIONS: Record<string, any[]> = {
  introduction: introSections, wall: wallSections, "door-window": windowSections,
  foundation: foundationSections, floor: floorSections, stairs: stairsSections,
  roof: roofSections, "deformation-joint": deformationJointSections,
};

/* ── Static MD imports ── */
import wallsIndex from "../data/textbook/walls/index.md?raw";
import wallsPartitions from "../data/textbook/walls/partitions.md?raw";
import wallsDesign from "../data/textbook/walls/wall-design-requirements.md?raw";
import roofIndex from "../data/textbook/roof/index.md?raw";

const MD_MAP: Record<string, string> = {
  "wall/index": wallsIndex, "wall/wall-partition": wallsPartitions,
  "wall/wall-design-requirements": wallsDesign, "roof/index": roofIndex,
};

/* ── Module category → node filter ── */
const MODULE_CATEGORY_MAP: Record<string, string> = {
  wall: "墙体", roof: "屋顶",
};

export default function TextbookPage() {
  const { sectionId, moduleId, chapterId } = useParams<{
    sectionId?: string; moduleId?: string; chapterId?: string;
  }>();

  /* ── Resolve context ── */
  const ctx = useMemo(() => {
    if (moduleId && chapterId) {
      const mod = courseModules.find((m) => m.id === moduleId);
      if (!mod) return null;
      const secs = ALL_SECTIONS[moduleId] || [];
      const sec = secs.find((s: any) => s.id === chapterId);
      return { module: mod, section: sec ?? null, sections: secs, isModule: false, moduleId };
    }
    const id = sectionId || moduleId;
    if (!id) return null;
    const mod = courseModules.find((m) => m.id === id);
    if (mod) {
      const secs = ALL_SECTIONS[mod.id] || [];
      return { module: mod, sections: secs, isModule: true, moduleId: mod.id };
    }
    for (const [mId, secs] of Object.entries(ALL_SECTIONS)) {
      const sec = secs.find((s: any) => s.id === id);
      if (sec) {
        const parent = courseModules.find((m) => m.id === mId);
        return { module: parent!, section: sec, sections: secs, isModule: false, moduleId: mId };
      }
    }
    return null;
  }, [sectionId, moduleId, chapterId]);

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

  const { module: mod, section, sections, isModule } = ctx;
  const modId = ctx.moduleId;
  const chapId = chapterId || section?.id;
  const category = MODULE_CATEGORY_MAP[modId] || "";

  const displayTitle = isModule ? mod.title : (section as any)?.title ?? mod.title;
  const displayDesc = isModule ? mod.description : (section as any)?.description ?? "";

  /* ── Markdown content ── */
  const fileKey = isModule ? `${modId}/index` : `${modId}/${chapId}`;
  const mdContent = MD_MAP[fileKey] ?? "";

  /* ── Related nodes ── */
  const sectionNodeIds: string[] = section?.nodeIds ?? [];
  const categoryNodes = category
    ? nodesIndex.filter((n) => n.category === category).map((n) => n.id)
    : [];
  const relatedNodeIds = sectionNodeIds.length > 0 ? sectionNodeIds : categoryNodes;

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-10 py-8">
        {/* ── Breadcrumb ── */}
        <nav className="mb-6 text-sm text-muted-soft">
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

        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}>
          <ChapterHero
            moduleTitle={mod.title}
            chapterTitle={displayTitle}
            description={displayDesc}
          />
        </motion.div>

        <div className="flex gap-10 mt-8">
          {/* ── Left: Article ── */}
          <article className="flex-1 min-w-0 max-w-[760px]">
            {isModule ? (
              /* Module overview: chapter list */
              <div>
                {mdContent ? (
                  <div className="prose prose-stone max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {mdContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-hairline rounded-2xl p-12 text-center">
                    <p className="text-muted-soft text-sm">模块概述正在建设中</p>
                  </div>
                )}
                {sections.length > 0 && (
                  <section className="mt-10 pt-8 border-t border-hairline">
                    <h2 className="text-xl font-serif font-normal text-ink mb-4">章节列表</h2>
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
                  </section>
                )}
              </div>
            ) : (
              /* Chapter page: markdown article */
              <div>
                {mdContent ? (
                  <div className="prose prose-stone max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {mdContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-hairline rounded-2xl p-12 text-center">
                    <p className="text-muted-soft text-sm">章节内容正在建设中</p>
                  </div>
                )}

                {/* Prev/Next */}
                <PrevNextChapter
                  sections={sections}
                  currentChapterId={chapId}
                  moduleId={modId}
                />
              </div>
            )}
          </article>

          {/* ── Right: Sidebar ── */}
          <aside className="hidden lg:block w-[320px] flex-shrink-0">
            <div className="sticky top-24">
              <RelatedModelsPanel nodeIds={relatedNodeIds} />
              {!isModule && mdContent && <ChapterTOC markdown={mdContent} />}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
