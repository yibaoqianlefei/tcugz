export interface SubMenuItem {
  id: string;
  label: string;
  path: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  children?: SubMenuItem[];
  disabled?: boolean;
}

/** Flat menu list — items with `children` render as expandable parent nodes. */
export const menuItems: MenuItem[] = [
  {
    id: "curriculum",
    label: "构造原理",
    icon: "📖",
    children: [
      { id: "intro", label: "建筑构造概述", path: "/curriculum/intro" },
      { id: "walls", label: "墙体构造", path: "/curriculum/walls" },
      { id: "floors", label: "楼板构造", path: "/curriculum/floors" },
      { id: "stairs", label: "楼梯构造", path: "/curriculum/stairs" },
      { id: "foundations", label: "基础与地下室", path: "/curriculum/foundations" },
    ],
  },
  { id: "library", label: "节点库", icon: "📚", path: "/library" },
  { id: "cases", label: "案例应用", icon: "💼", path: "/curriculum/cases" },
  { id: "textbook", label: "基础学习", icon: "🎓", path: "/textbook/roof-membrane" },
  { id: "games", label: "作业训练", icon: "🔨", path: "/games" },
  { id: "data", label: "数据分析", icon: "📊", path: "/data" },
  { id: "ai-extend", label: "AI 拓展", icon: "✨", path: "/ai-extend" },
];
