export interface MenuItem {
  label: string;
  icon: string;
  path: string | null;
  disabled?: boolean;
}

export interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export const menu: MenuGroup[] = [
  {
    title: "教学资源",
    items: [
      { label: "构造原理", icon: "📖", path: "/curriculum" },
      { label: "节点库", icon: "📚", path: "/library" },
      { label: "案例应用", icon: "💼", path: "/curriculum/cases" },
    ],
  },
  {
    title: "学生实践",
    items: [
      { label: "自主学习", icon: "🎓", path: "/textbook/roof-membrane" },
      { label: "作业训练", icon: "🔨", path: "/games" },
    ],
  },
  {
    title: "AI 与评价",
    items: [
      { label: "AI 助手", icon: "✨", path: null, disabled: true },
      { label: "评价分析", icon: "📊", path: null, disabled: true },
    ],
  },
];
