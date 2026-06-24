import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { nodesIndex } from "../data/nodesIndex";
import roofSections from "../data/roofSections";

function ModelCard({ nodeId }: { nodeId: string }) {
  const node = nodesIndex.find((n) => n.id === nodeId);
  if (!node) return null;

  return (
    <Link
      to={`/node/${node.id}`}
      className="block bg-surface-card border border-hairline rounded-xl p-6
        hover:shadow-[0_1px_3px_rgba(20,20,19,0.08)]
        hover:-translate-y-1 hover:scale-[1.01]
        hover:border-primary/30
        transition-all duration-300 ease-out
        cursor-pointer group mt-6"
    >
      <h4 className="text-base font-normal font-serif text-ink group-hover:text-primary transition-colors">
        {node.title}
      </h4>
      <p className="text-sm text-muted mt-1.5 leading-relaxed">{node.description}</p>
      <span className="inline-block mt-3 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        打开交互模型 →
      </span>
    </Link>
  );
}

export default function TextbookPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const section = roofSections.find((s: any) => s.id === sectionId);
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    if (!section) return;
    // Use markdown content or description
    const text = `## ${section.title}\n\n${section.description}\n\n内容正在建设中。`;
    setContent(text);
  }, [section]);

  if (!section) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted text-lg">未找到该章节</p>
          <Link to="/curriculum" className="text-primary text-sm mt-3 inline-block hover:underline">
            返回课程目录
          </Link>
        </div>
      </div>
    );
  }

  const nodeIds = section.nodeIds || [];

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <main className="flex-1 px-6 md:px-10 py-10 max-w-3xl mx-auto w-full">
        {/* Breadcrumb */}
        <div className="mb-6">
          <span className="text-sm text-muted-soft">
            <Link to="/curriculum" className="text-primary hover:text-primary-active transition-colors">课程目录</Link>
            <span className="mx-1.5 text-muted-soft">›</span>
            <Link to="/curriculum/roof" className="text-primary hover:text-primary-active transition-colors">屋顶</Link>
            <span className="mx-1.5 text-muted-soft">›</span>
            <span className="text-muted">{section.title}</span>
          </span>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-normal font-serif text-ink tracking-tight">
            {section.title}
          </h1>
          <p className="mt-2 text-muted text-base">{section.description}</p>
        </motion.div>

        {/* Markdown content */}
        <motion.div
          className="mt-8 prose prose-sm max-w-none
            prose-headings:font-serif prose-headings:text-ink prose-headings:font-normal
            prose-p:text-body prose-p:leading-relaxed
            prose-strong:text-body-strong
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          dangerouslySetInnerHTML={{
            __html: content
              .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-serif text-ink font-normal mt-10 mb-4">$1</h1>')
              .replace(/^## (.*$)/gim, '<h2 class="text-xl font-serif text-ink font-normal mt-8 mb-3">$1</h2>')
              .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium text-body-strong mt-6 mb-2">$1</h3>')
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-body-strong">$1</strong>')
              .replace(/\n\n/g, '</p><p class="text-body leading-relaxed mb-4">')
              .replace(/^- (.*$)/gim, '<li class="text-body ml-4 mb-1">$1</li>'),
          }}
        />

        {/* 3D model cards */}
        {nodeIds.length > 0 && (
          <div className="mt-12 pt-8 border-t border-hairline">
            <h3 className="text-lg font-normal font-serif text-ink mb-2">交互模型</h3>
            <p className="text-sm text-muted-soft mb-4">点击下方模型进行 3D 交互探索</p>
            {nodeIds.map((id: string) => (
              <ModelCard key={id} nodeId={id} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
