import SectionPageHeader from "../components/SectionPageHeader";
import ContentEmptyState from "../components/ContentEmptyState";
import { motion, useReducedMotion } from "framer-motion";
import { Circle, BrainCircuit } from "lucide-react";
import {
  RadialBarChart,
  RadialBar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useAnalysisStore } from "../store/analysisStore";
import { nodesIndex } from "../data/nodesIndex";

/* ── Constants ──────────────────────────────────────────────── */
/* 进度分母必须来自真实节点数。原为写死的 3，导致仅访问 3 个节点
   即显示「学习进度 100%」（真实节点数见 nodesIndex）。 */
const TOTAL_NODES = nodesIndex.length;
/* SVG charts resolve the same CSS tokens as the rest of the interface. */
const CHART_COLORS = {
  primary: "var(--ui-blue)",
  hairline: "var(--ui-line)",
  ink: "var(--ui-ink)",
  muted: "var(--ui-muted)",
};

const AI_CATEGORIES = ["构造做法", "材料特性", "空间逻辑", "其他"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  "构造做法": CHART_COLORS.primary,
  "材料特性": "var(--ui-blue-hover)",
  "空间逻辑": CHART_COLORS.muted,
  "其他": "var(--ui-line-strong)",
};

/* ── Node name lookup ───────────────────────────────────────── */
function getNodeTitle(id: string): string {
  return nodesIndex.find((n) => n.id === id)?.title ?? id;
}

/* ── Animation variants ─────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

/* ── DataAnalysis ───────────────────────────────────────────── */
export default function DataAnalysis() {
  const reducedMotion = useReducedMotion();
  const visitedNodes = useAnalysisStore((s) => s.visitedNodes);
  const aiQuestions = useAnalysisStore((s) => s.aiQuestions);
  const totalInteractions = useAnalysisStore((s) => s.totalInteractions);
  const visitCounts = useAnalysisStore((s) => s.visitCounts);
  const recordedQuestions = aiQuestions.filter(question => question.source === 'site' || question.source === 'model');

  const progress = visitedNodes.length;
  const progressPct = Math.round((progress / TOTAL_NODES) * 100);

  // ── Radial bar data ──
  const radialData = [{ name: "进度", value: progressPct, fill: CHART_COLORS.primary }];

  // Old versions never recorded frequency; preserve history without inventing counts.
  const barData = Object.keys(visitCounts)
    .sort((a, b) => visitCounts[b] - visitCounts[a])
    .slice(0, 5)
    .map((id) => ({
      name: getNodeTitle(id),
      count: visitCounts[id],
    }))
    .reverse();

  // ── Pie data (AI question categories) ──
  const categoryCounts: Record<string, number> = {};
  recordedQuestions.forEach((q) => {
    categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
  });
  const pieData = AI_CATEGORIES.map((cat) => ({
    name: cat,
    value: categoryCounts[cat] || 0,
  }));

  return (
    <div className="site-page flex flex-col">
      <SectionPageHeader title="学习数据" eyebrow="LEARNING / 学习记录" description="查看构造学习进度与节点交互记录。" />
      <section className="site-container site-data-summary" aria-label="学习记录概览">
        {aiQuestions.some(question => !question.source) && <p className="text-sm text-muted mb-4">历史问答记录已保留；因旧版含模拟数据，未计入新版伙伴问答统计。</p>}
        <div className="site-data-metrics">
          <div><strong>{totalInteractions}</strong><span>累计交互（含历史记录）</span></div>
          <div><strong>{visitedNodes.length}</strong><span>已访问节点</span></div>
          <div><strong>{recordedQuestions.length}</strong><span>新版伙伴问答</span></div>
        </div>
      </section>

      {/* ── Cards ── */}
      <main className="site-container flex-1 pb-16">
        {visitedNodes.length === 0 && aiQuestions.length === 0 ? (
          <ContentEmptyState title="从一个节点开始" description="访问构造节点、与构造伙伴交流后，这里会展示你的学习进度与交互记录。" />
        ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial={reducedMotion ? false : 'hidden'}
          animate="show"
        >
          {/* Card 1: 学习进度 — RadialBar */}
          <motion.div
            variants={cardVariants}
            className="site-data-card p-6 flex flex-col min-h-[280px]"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-4 bg-primary rounded-full inline-block flex-shrink-0" />
              <span className="text-sm font-medium text-muted">学习进度</span>
            </div>

            <div className="flex-1 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height={190}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="75%"
                  outerRadius="95%"
                  barSize={12}
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius="50%"
                    fill={CHART_COLORS.primary}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-bold text-ink tabular-nums tracking-tight">
                  {progressPct}%
                </span>
                <span className="text-sm text-muted mt-1">
                  已完成 {progress}/{TOTAL_NODES} 个节点
                </span>
              </div>
            </div>

            {/* Recent node */}
            {visitedNodes.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-soft pt-1">
                <Circle size={6} fill={CHART_COLORS.primary} stroke="none" className="flex-shrink-0" />
                <span>最近探索：{getNodeTitle(visitedNodes[visitedNodes.length - 1])}</span>
              </div>
            )}
          </motion.div>

          {/* Card 2: 构件热力 — Horizontal BarChart */}
          <motion.div
            variants={cardVariants}
            className="site-data-card p-6 flex flex-col min-h-[280px]"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-4 bg-primary rounded-full inline-block flex-shrink-0" />
              <span className="text-sm font-medium text-muted">节点访问（新版记录）</span>
            </div>
            <div className="flex-1 w-full">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart
                    data={barData}
                    layout="vertical"
                    margin={{ top: 4, right: 40, bottom: 4, left: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={CHART_COLORS.hairline}
                      horizontal={false}
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: CHART_COLORS.muted }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Bar
                      dataKey="count"
                      fill={CHART_COLORS.primary}
                      radius={[0, 4, 4, 0]}
                      barSize={18}
                      label={({ x, y, width, value }: { x?: unknown; y?: unknown; width?: unknown; value?: unknown }) => {
                        const nx = Number(x) || 0;
                        const ny = Number(y) || 0;
                        const nw = Number(width) || 0;
                        const nv = typeof value === "number" ? value : 0;
                        // We use SVG foreignObject-free approach: render label text + Unicode arrow
                        // For now: show value with ↑/↓ prefix as SVG text
                        return (
                          <g>
                            <text
                              x={nx + nw + 6}
                              y={ny + 14}
                              fill={CHART_COLORS.muted}
                              fontSize={12}
                              textAnchor="start"
                            >
                              {nv}
                            </text>
                          </g>
                        );
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-muted-soft">
                  暂无访问数据
                </div>
              )}
            </div>
          </motion.div>

          {/* Card 3: AI 问答画像 — PieChart */}
          <motion.div
            variants={cardVariants}
            className="site-data-card p-6 flex flex-col min-h-[280px]"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-4 bg-primary rounded-full inline-block flex-shrink-0" />
              <span className="text-sm font-medium text-muted">伙伴问答（新版记录）</span>
            </div>
            <div className="flex-1 w-full flex items-center">
              {pieData.some((d) => d.value > 0) ? (
                <>
                  <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={80}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={CATEGORY_COLORS[entry.name]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="flex flex-col gap-1.5 ml-1">
                    {AI_CATEGORIES.map((cat) => (
                      <div key={cat} className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                        />
                        <span className="text-[13px] text-muted">{cat}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* ── Empty state ── */
                <div className="flex-1 flex flex-col items-center justify-center relative">
                  <BrainCircuit
                    size={64}
                    strokeWidth={1}
                    className="text-muted-soft opacity-20 absolute"
                  />
                  <h3 className="text-sm font-medium text-ink relative z-10">
                    探索你的学习画像
                  </h3>
                  <p className="text-xs text-muted mt-1.5 text-center relative z-10 max-w-[200px]">
                    打开构造伙伴提问，逐步形成学习记录
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
        )}
      </main>
    </div>
  );
}
