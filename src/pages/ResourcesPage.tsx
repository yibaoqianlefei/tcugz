import { Building2, Ruler, Globe2, ChevronDown, type LucideIcon } from 'lucide-react';
import SectionPageHeader from '../components/SectionPageHeader';

interface ResourceSection { title: string; icon: LucideIcon; links: { label: string; url: string }[] }
const sections: ResourceSection[] = [
  { title: '空间设计', icon: Building2, links: [{ label: '建筑学长', url: 'https://www.archcollege.com' }, { label: '建筑盒子', url: '' }] },
  { title: '建筑规范', icon: Ruler, links: [{ label: '建标库', url: 'https://jianbiaoku.com' }] },
  { title: '热门网址', icon: Globe2, links: [{ label: 'goood谷德', url: 'https://www.gooood.cn' }] },
];

function ResourceCard({ section }: { section: ResourceSection }) {
  const Icon = section.icon;
  return <details className="ui-resource-card group overflow-hidden">
    <summary className="flex cursor-pointer list-none items-center gap-4 p-5 hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-primary">
      <Icon size={26} strokeWidth={1.4} className="shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
        <p className="mt-1 text-xs text-muted">{section.links.length} 个链接</p>
      </div>
      <ChevronDown size={18} className="shrink-0 text-primary group-open:rotate-180" aria-hidden="true" />
    </summary>
    <div className="flex flex-col gap-2 border-t border-hairline p-5">
      {section.links.map(link => link.url
        ? <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="rounded-md border border-hairline px-4 py-3 text-sm font-medium text-primary-active hover:bg-surface-soft">{link.label}</a>
        : <span key={link.label} className="rounded-md border border-hairline px-4 py-3 text-sm text-muted">{link.label} · 暂无链接</span>)}
    </div>
  </details>;
}

export default function ResourcesPage() {
  return <div className="site-page">
    <SectionPageHeader title="学习资源" eyebrow="RESOURCES / 拓展链接" description="常用建筑设计资源与工具链接。" />
    <main className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
        {sections.map(section => <ResourceCard key={section.title} section={section} />)}
      </div>
    </main>
  </div>;
}
