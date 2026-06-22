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
    title: "",
    items: [
      { label: "构造原理", icon: "📖", path: "/curriculum" },
      { label: "节点库", icon: "📚", path: "/library" },
      { label: "案例应用", icon: "💼", path: "/curriculum/cases" },
      { label: "基础学习", icon: "🎓", path: "/textbook/roof-membrane" },
      { label: "作业训练", icon: "🔨", path: "/games" },
      { label: "AI 问答", icon: "✨", path: "/ai" },
      { label: "数据分析", icon: "📊", path: null, disabled: true },
      { label: "拓展链接", icon: "🔗", path: "/resources" },
    ],
  },
];
