import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";

interface ResourceLink {
  label: string;
  url: string;
}

interface ResourceSection {
  title: string;
  icon: string;
  links: ResourceLink[];
}

const sections: ResourceSection[] = [
  {
    title: "空间设计",
    icon: "🏗️",
    links: [
      { label: "建筑学长", url: "" },
      { label: "建筑盒子", url: "" },
    ],
  },
  {
    title: "建筑规范",
    icon: "📐",
    links: [
      { label: "建标库", url: "" },
    ],
  },
  {
    title: "热门网址",
    icon: "🌐",
    links: [
      { label: "goood谷德", url: "" },
    ],
  },
];

function ResourceCard({ section }: { section: ResourceSection }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-surface-card border border-hairline rounded-2xl overflow-hidden transition-shadow duration-300 hover:shadow-[0_2px_8px_rgba(20,20,19,0.06)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors duration-200 hover:bg-surface-soft/50"
      >
        <span className="text-3xl flex-shrink-0">{section.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-ink">{section.title}</h3>
          <p className="text-xs text-muted-soft mt-0.5">
            {section.links.length} 个链接
          </p>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-shrink-0 text-muted-soft"
        >
          <ChevronDown size={20} strokeWidth={1.5} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-hairline pt-4">
              <div className="flex flex-wrap gap-3">
                {section.links.map((link) => {
                  const hasUrl = !!link.url;
                  return (
                    <a
                      key={link.label}
                      href={link.url || "#"}
                      target={hasUrl ? "_blank" : undefined}
                      rel={hasUrl ? "noopener noreferrer" : undefined}
                      onClick={(e) => { if (!hasUrl) e.preventDefault(); }}
                      className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg
                        min-w-[130px]
                        border border-[#e6dfd8] bg-white
                        transition-all duration-200
                        ${hasUrl
                          ? "hover:bg-[#efe9de] hover:border-primary/20 cursor-pointer group"
                          : "opacity-40 cursor-not-allowed"
                        }`}
                    >
                      <span className="text-sm font-medium text-body whitespace-nowrap">
                        {link.label}
                      </span>
                      <ArrowRight
                        size={14}
                        strokeWidth={1.5}
                        className={`flex-shrink-0 transition-transform duration-200
                          ${hasUrl ? "text-primary group-hover:translate-x-0.5" : "text-muted-soft"}`}
                      />
                    </a>
                  );
                })}
              </div>

              {/* ── Footer note ── */}
              <div className="border-t border-[#e6dfd8] mt-4 pt-3 text-center">
                <p className="text-[11px] text-muted tracking-wide">
                  本站坚持人工甄选 · 持续更新行业资源
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="pt-12 pb-8 md:pt-16 md:pb-10 px-6 text-center">
        <motion.h1
          className="text-3xl md:text-4xl font-normal font-serif text-ink tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          拓展链接
        </motion.h1>
        <motion.p
          className="mt-2 text-muted text-base max-w-lg mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          常用建筑设计资源与工具链接
        </motion.p>
      </header>

      <main className="flex-1 px-6 md:px-10 pb-20 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {sections.map((section) => (
            <ResourceCard key={section.title} section={section} />
          ))}
        </div>
      </main>
    </div>
  );
}
