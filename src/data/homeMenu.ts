/**
 * HomePage left-nav menu — single source of truth.
 *
 * Extracted from HomePage.tsx so the real menu configuration is importable by
 * tests (HomePage itself pulls in R3F/WebGL and cannot be imported under
 * Node/tsx).  Both MenuContent and SubMenuPanel read ONLY from this module.
 *
 * Top-level order (target):
 *   1. 绪论     — expandable (own 子章节 as navigable leaf children)
 *   2. 构造基础 — expandable (course modules, 绪论 moved out)
 *   3. 构造原理 — expandable
 *   4. 节点库   — link
 *   5. 案例应用 — link
 *   6. 作业训练 — link
 *   7. AI 拓展  — link
 *   (数据分析 entry removed — its page/route/assets are untouched)
 */
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Briefcase,
  GraduationCap,
  Hammer,
  Layers,
  Sparkles,
} from "lucide-react";
import courseModules from "./courseModules";
import introSections from "./sections/introSections.js";
import wallSections from "./sections/wallSections.js";
import windowSections from "./sections/windowSections.js";
import foundationSections from "./sections/foundationSections.js";
import floorSections from "./sections/floorSections.js";
import stairsSections from "./sections/stairsSections.js";
import roofSections from "./sections/roofSections.js";
import deformationJointSections from "./sections/deformationJointSections.js";

export interface SectionItem {
  id: string;
  title: string;
  description: string;
  nodeIds: string[];
  available: boolean;
  hasTextbook?: boolean;
}

/** Module id → its textbook sub-sections (unchanged data). */
export const sectionMap: Record<string, SectionItem[]> = {
  introduction: introSections,
  wall: wallSections,
  "door-window": windowSections,
  foundation: foundationSections,
  floor: floorSections,
  stairs: stairsSections,
  roof: roofSections,
  "deformation-joint": deformationJointSections,
};

export interface MenuChildDef {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  path?: string;
  sections?: SectionItem[];
}

export interface MenuItemDef {
  icon: LucideIcon;
  label: string;
  id: string;
  to?: string;
  children?: MenuChildDef[];
}

/** 绪论子章节 → navigable leaf children (same routes as before). */
const introChildren: MenuChildDef[] = introSections.map((s) => ({
  id: s.id,
  label: s.title,
  description: s.description,
  path: `/textbook/introduction/${s.id}`,
}));

export const menuItems: MenuItemDef[] = [
  // 1. 绪论 — promoted to a top-level expandable menu.
  { icon: BookOpen, label: "绪论", id: "introduction", children: introChildren },
  // 2. 构造基础 — 绪论 removed; keeps the remaining course modules.
  {
    icon: GraduationCap,
    label: "构造基础",
    id: "textbook",
    children: courseModules
      .filter((m) => m.id !== "introduction")
      .map((m) => ({
        id: m.id,
        label: m.title,
        icon: m.icon,
        description: m.description,
        sections: sectionMap[m.id] || [],
      })),
  },
  // 3. 构造原理 — unchanged children, moved after 构造基础.
  {
    icon: BookOpen,
    label: "构造原理",
    id: "curriculum",
    children: [
      { id: "thermal", label: "建筑保温", icon: "🔥", description: "建筑保温构造原理与设计" },
      { id: "waterproof", label: "建筑防水", icon: "💧", description: "建筑防水构造原理与设计" },
      { id: "insulation", label: "建筑隔热", icon: "☀️", description: "建筑隔热构造原理与设计" },
      { id: "acoustic", label: "建筑隔声", icon: "🔇", description: "建筑隔声构造原理与设计" },
      { id: "fire", label: "建筑防火", icon: "🧯", description: "建筑防火构造原理与设计" },
      { id: "moisture", label: "建筑防潮", icon: "💨", description: "建筑防潮构造原理与设计" },
    ],
  },
  { icon: Layers, label: "节点库", id: "library", to: "/library" },
  { icon: Briefcase, label: "案例应用", id: "cases", to: "/curriculum/cases" },
  { icon: Hammer, label: "作业训练", id: "games", to: "/games" },
  { icon: Sparkles, label: "AI 拓展", id: "ai-extend", to: "/ai-extend" },
];

export function getExpandedChildren(id: string | null): MenuChildDef[] | null {
  if (!id) return null;
  return menuItems.find((m) => m.id === id)?.children ?? null;
}
