import { Link } from 'react-router-dom';
import { Layers3 } from 'lucide-react';
import { nodesIndex } from '../data/nodesIndex';

function NodeCard({ node }: { node: typeof nodesIndex[number] }) {
  return <Link to={`/node/${node.id}`} className="ui-resource-card group flex h-full flex-col p-4 hover:border-primary/35 hover:-translate-y-0.5 transition-[border-color,transform] duration-200" aria-label={`查看${node.title}`}>
      <div className="mb-3 flex h-28 w-full items-center justify-center overflow-hidden rounded-lg bg-surface-soft">
        {node.thumbnail
          ? <img src={node.thumbnail} alt={`${node.title}构造图`} loading="lazy" className="h-full w-full object-contain" />
          : <Layers3 size={32} strokeWidth={1.1} className="text-primary/55" aria-hidden="true" />}
      </div>
      <h3 className="text-base font-medium leading-snug text-ink group-hover:text-primary-active transition-colors">{node.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{node.description}</p>
      <span className="mt-auto pt-3 text-xs font-medium text-primary-active">{node.status === 'development' ? '查看节点状态' : '查看构造'}</span>
  </Link>;
}

export default function LibraryPage() {
  const libraryNodes = nodesIndex.filter(node => node.category !== '案例');
  const categories = [...new Set(libraryNodes.map(node => node.category))];

  return <div className="site-page">
    <header className="site-page-header mx-auto w-full max-w-6xl px-6 md:px-10">
      <span className="site-eyebrow">NODE LIBRARY / 按部位浏览</span>
      <h1 className="site-page-title">构造节点库</h1>
      <p className="site-page-intro">按建筑部位探索 {libraryNodes.length} 个构造节点。打开图纸与三维模型，观察构件之间的空间关系。</p>
    </header>
    <main className="mx-auto w-full max-w-6xl px-6 pb-16 md:px-10">
      {categories.map((category, categoryIndex) => {
        const categoryNodes = libraryNodes.filter(node => node.category === category);
        return <section key={category} className="pt-10" aria-labelledby={`library-category-${categoryIndex}`}>
          <div className="mb-4 flex items-end justify-between gap-4 border-b border-hairline pb-2">
            <div><span className="site-eyebrow">{String(categoryIndex + 1).padStart(2, '0')} / CATEGORY</span><h2 id={`library-category-${categoryIndex}`} className="site-section-title mt-3">{category}</h2></div>
            <span className="text-sm text-muted-soft">{categoryNodes.length} 个节点</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categoryNodes.map(node => <NodeCard key={node.id} node={node} />)}
          </div>
        </section>;
      })}
    </main>
  </div>;
}
