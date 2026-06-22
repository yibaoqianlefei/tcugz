import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, Circle } from "lucide-react";
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
const TOTAL_NODES = 8;
const CHART_COLORS = {
  primary: "#cc785c",
  hairline: "#e6dfd8",
  ink: "#141413",
};

const AI_CATEGORIES = ["构造做法", "材料特性", "空间逻辑", "其他"] as const;

function categorizeQuestion(text: string): string {
  const lower = text.toLowerCase();
  if (/防水|卷材|涂料|密封|渗透|水/.test(lower)) return "构造做法";
  if (/排水|雨水|天沟|落水管|雨水口|排水坡度/.test(lower)) return "构造做法";
  if (/保温|隔热|热桥|冷桥|节能|温度/.test(lower)) return "材料特性";
  if (/结构|承重|荷载|钢筋|混凝土|强度/.test(lower)) return "材料特性";
  if (/空间|层次|顺序|上下|前后|组合|三维/.test(lower)) return "空间逻辑";
  if (/做法|施工|步骤|流程|工艺/.test(lower)) return "构造做法";
  return "其他";
}
const CATEGORY_COLORS: Record<string, string> = {
  "构造做法": CHART_COLORS.primary,
  "材料特性": CHART_COLORS.hairline,
  "空间逻辑": CHART_COLORS.ink,
  "其他": "#9b948b",
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
  const visitedNodes = useAnalysisStore((s) => s.visitedNodes);
  const aiQuestions = useAnalysisStore((s) => s.aiQuestions);
  const totalInteractions = useAnalysisStore((s) => s.totalInteractions);

  const progress = visitedNodes.length;
  const progressPct = Math.round((progress / TOTAL_NODES) * 100);

  // ── Seed demo data on first visit (dev only) ──
  const addVisitedNode = useAnalysisStore((s) => s.addVisitedNode);
  const addAIQuestion = useAnalysisStore((s) => s.addAIQuestion);

  useEffect(() => {
    if (visitedNodes.length > 0 || aiQuestions.length > 0) return;

    // Simulate a semester of learning
    const seedNodes = [
      "roof-drainage-01", "membrane-roof-01", "flat-roof-01",
      "organized-drainage-01", "roof-insulation-01",
    ];
    const seedQuestions: string[] = [
      "防水层如何避免渗漏", "保温材料怎么选", "屋面排水坡度设计",
      "卷材搭接有什么要求", "结构层受力分析", "保护层厚度规范",
      "找平层施工工艺", "防水卷材种类对比", "雨水斗的工作原理",
      "天沟和檐沟的区别", "什么是热桥效应", "屋顶空间层次讲解",
      "变形缝如何处理", "混凝土强度等级选择", "涂料防水和卷材防水的优劣",
    ];

    seedNodes.forEach((id) => addVisitedNode(id));
    // Add a few more visits to create frequency pattern
    addVisitedNode("roof-drainage-01");
    addVisitedNode("roof-drainage-01");
    addVisitedNode("membrane-roof-01");

    seedQuestions.forEach((q) => {
      const cat = categorizeQuestion(q);
      addAIQuestion(cat);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Radial bar data ──
  const radialData = [{ name: "进度", value: progressPct, fill: CHART_COLORS.primary }];

  // ── Bar chart data (node visit frequency with mock counts) ──
  const barData = visitedNodes
    .slice(0, 5)
    .map((id, i) => ({
      name: getNodeTitle(id),
      count: Math.max(10, 90 - i * 15), // mock frequency (real counts in store's future version)
    }))
    .reverse();

  // ── Pie data (AI question categories) ──
  const categoryCounts: Record<string, number> = {};
  aiQuestions.forEach((q) => {
    categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
  });
  const pieData = AI_CATEGORIES.map((cat) => ({
    name: cat,
    value: categoryCounts[cat] || 0,
  }));

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* ── Header ── */}
      <header className="pt-12 pb-8 md:pt-16 md:pb-10 px-6 text-center">
        <motion.h1
          className="text-3xl md:text-4xl font-normal font-serif text-ink tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          学习数据
        </motion.h1>
        <motion.div
          className="w-12 h-[2px] bg-hairline rounded-full mt-5 mx-auto"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        />

        {/* Total interactions badge */}
        {totalInteractions > 0 && (
          <motion.p
            className="mt-4 text-xs text-muted-soft"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            总交互次数：<span className="font-semibold text-primary tabular-nums">{totalInteractions}</span>
          </motion.p>
        )}
      </header>

      {/* ── Cards ── */}
      <main className="flex-1 px-6 md:px-10 pb-20 max-w-5xl mx-auto w-full">
        {visitedNodes.length === 0 && aiQuestions.length === 0 ? (
          /* ── Empty state ── */
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="w-20 h-20 rounded-full bg-surface-card border border-hairline flex items-center justify-center mb-6">
              <Compass size={32} strokeWidth={1} className="text-muted-soft" />
            </div>
            <h2 className="text-lg font-medium text-ink mb-2">快去探索节点吧</h2>
            <p className="text-sm text-muted max-w-sm leading-relaxed mb-6">
              你还没有任何学习记录。访问构造节点、与 AI 助教对话后，这里会展示你的学习数据。
            </p>
            <Link
              to="/library"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-active transition-colors"
            >
              浏览节点库
            </Link>
          </motion.div>
        ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Card 1: 学习进度 — RadialBar */}
          <motion.div
            variants={cardVariants}
            className="bg-white border border-hairline rounded-2xl p-6 flex flex-col items-center min-h-[280px] shadow-[0_1px_3px_rgba(20,20,19,0.04)]"
          >
            <span className="text-xs text-muted-soft uppercase tracking-wider mb-1 self-start">
              学习进度
            </span>
            <div className="flex-1 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height={200}>
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
                <span className="text-3xl font-semibold text-ink tabular-nums">
                  {progressPct}%
                </span>
                <span className="text-[11px] text-muted-soft mt-0.5">
                  已完成 {progress}/{TOTAL_NODES} 个
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: 构件热力 — Horizontal BarChart */}
          <motion.div
            variants={cardVariants}
            className="bg-white border border-hairline rounded-2xl p-6 flex flex-col min-h-[280px] shadow-[0_1px_3px_rgba(20,20,19,0.04)]"
          >
            <span className="text-xs text-muted-soft uppercase tracking-wider mb-1 self-start">
              构件热力
            </span>
            <div className="flex-1 w-full">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart
                    data={barData}
                    layout="vertical"
                    margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
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
                      tick={{ fontSize: 12, fill: "#6c6a64" }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Bar
                      dataKey="count"
                      fill={CHART_COLORS.primary}
                      radius={[0, 4, 4, 0]}
                      barSize={18}
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
            className="bg-white border border-hairline rounded-2xl p-6 flex flex-col min-h-[280px] shadow-[0_1px_3px_rgba(20,20,19,0.04)]"
          >
            <span className="text-xs text-muted-soft uppercase tracking-wider mb-1 self-start">
              AI 问答画像
            </span>
            <div className="flex-1 w-full flex items-center">
              {pieData.some((d) => d.value > 0) ? (
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
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-muted-soft">
                  暂无提问数据
                </div>
              )}
              {/* Legend */}
              <div className="flex flex-col gap-1.5 ml-1">
                {AI_CATEGORIES.map((cat) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                    />
                    <span className="text-[11px] text-muted">{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
        )}
      </main>
    </div>
  );
}
