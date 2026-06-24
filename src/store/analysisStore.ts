import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ── Types ─────────────────────────────────────────────────── */
export interface AIQuestionEntry {
  category: string;
  date: string;
}

interface AnalysisState {
  visitedNodes: string[];
  aiQuestions: AIQuestionEntry[];
  totalInteractions: number;

  addVisitedNode: (nodeId: string) => void;
  addAIQuestion: (category: string) => void;
  clearAllData: () => void;
}

/* ── Store ──────────────────────────────────────────────────── */
export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({
      visitedNodes: [],
      aiQuestions: [],
      totalInteractions: 0,

      addVisitedNode: (nodeId: string) => {
        set((s) => {
          if (s.visitedNodes.includes(nodeId)) {
            // Already visited — increment interactions but don't duplicate
            return { totalInteractions: s.totalInteractions + 1 };
          }
          return {
            visitedNodes: [...s.visitedNodes, nodeId],
            totalInteractions: s.totalInteractions + 1,
          };
        });
      },

      addAIQuestion: (category: string) => {
        set((s) => ({
          aiQuestions: [
            ...s.aiQuestions,
            { category, date: new Date().toISOString().slice(0, 10) },
          ],
          totalInteractions: s.totalInteractions + 1,
        }));
      },

      clearAllData: () => {
        set({
          visitedNodes: [],
          aiQuestions: [],
          totalInteractions: 0,
        });
      },
    }),
    {
      name: "construction-analysis",
    },
  ),
);
