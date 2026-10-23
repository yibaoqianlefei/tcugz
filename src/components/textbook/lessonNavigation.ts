import { articles, groups, modules } from '../../../scripts/lib/textbook-catalog.mjs';

export interface LessonNavigationItem {
  id: string;
  title: string;
  path?: string;
  number?: string;
  children?: LessonNavigationItem[];
}

function lessons(group: string): LessonNavigationItem[] {
  return articles.filter(article => article.group === group).map((article, index) => ({
    id: article.path, title: article.title, path: article.path, number: String(index + 1).padStart(2, '0'),
  }));
}

// Use the same titles, sequence and article paths as the textbook generator.
export const lessonNavigation: LessonNavigationItem[] = [
  { id: 'introduction', title: groups.introduction.title, children: lessons('introduction') },
  { id: 'basics', title: '构造基础', children: Object.entries(modules).map(([id, group]) => ({
    id, title: group.title, children: lessons(id),
  })) },
  { id: 'principles', title: groups.principles.title, children: lessons('principles') },
  { id: 'practice', title: groups.practice.title, children: lessons('practice') },
];

export const lessonCount = articles.length;

export function containsLesson(item: LessonNavigationItem, path: string): boolean {
  return item.path === path || Boolean(item.children?.some(child => containsLesson(child, path)));
}

export function filterLessonNavigation(items: LessonNavigationItem[], query: string): LessonNavigationItem[] {
  const value = query.trim().toLocaleLowerCase();
  if (!value) return items;
  return items.flatMap(item => {
    if (item.title.toLocaleLowerCase().includes(value)) return [item];
    const children = item.children && filterLessonNavigation(item.children, value);
    return children?.length ? [{ ...item, children }] : [];
  });
}
