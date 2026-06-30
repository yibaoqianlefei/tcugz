import { useState, Suspense, lazy } from "react";
import { MessageCircle, ExternalLink } from "lucide-react";

/* ── Lazy-load tab content ── */
const AIPage = lazy(() => import("./AIPage"));
const ResourcesPage = lazy(() => import("./ResourcesPage"));

function TabFallback() {
  return (
    <div className="flex-1 flex items-center justify-center bg-canvas">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

type Tab = "ai" | "resources";

const tabs: { key: Tab; label: string; icon: typeof MessageCircle }[] = [
  { key: "ai", label: "AI 问答", icon: MessageCircle },
  { key: "resources", label: "拓展链接", icon: ExternalLink },
];

export default function AIExtendPage() {
  const [activeTab, setActiveTab] = useState<Tab>("ai");

  return (
    <div className="h-full flex flex-col bg-canvas overflow-hidden">
      {/* ── Tab bar ── */}
      <div className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 bg-canvas border-b border-hairline">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? "bg-white border border-hairline text-primary shadow-sm"
                  : "text-muted-soft hover:text-muted hover:bg-surface-card"
                }`}
            >
              <Icon size={16} strokeWidth={1.5} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 min-h-0">
        <Suspense fallback={<TabFallback />}>
          {activeTab === "ai" ? <AIPage /> : <ResourcesPage />}
        </Suspense>
      </div>
    </div>
  );
}
