import { Building2 } from 'lucide-react';
import { nodesIndex } from '../data/nodesIndex';
import SectionPageHeader from '../components/SectionPageHeader';
import ContentEmptyState from '../components/ContentEmptyState';

function CaseCard({ node }: { node: typeof nodesIndex[number] }) {
  return <article className="ui-resource-card flex h-full flex-col p-4">
    <div className="mb-3 flex h-28 w-full items-center justify-center overflow-hidden rounded-lg bg-surface-soft">
      <Building2 size={38} strokeWidth={1.25} className="text-primary/55" aria-hidden="true" />
    </div>
    <h3 className="text-base font-medium leading-snug text-ink">郓城案例 {node.title}</h3>
    <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{node.description}</p>
    <span className="site-status-chip mt-3 self-start">暂无模型</span>
  </article>;
}

export default function CasesPage() {
  const caseNodes = nodesIndex.filter(node => node.category === '案例');
  return <div className="site-page">
    <SectionPageHeader title="案例应用" eyebrow="CASE STUDIES / 案例学习" description="从实际建筑案例出发，理解构造知识的应用。" />
    <main className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      {caseNodes.length === 0
        ? <ContentEmptyState description="暂无案例数据。" />
        : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {caseNodes.map(node => <CaseCard key={node.id} node={node} />)}
        </div>}
    </main>
  </div>;
}
