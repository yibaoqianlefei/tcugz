import { Link } from 'react-router-dom';
import { Layers3 } from 'lucide-react';
import { nodesIndex } from '../data/nodesIndex';
import SectionPageHeader from '../components/SectionPageHeader';

function NodeCard({ node }: { node: typeof nodesIndex[number] }) {
  return <Link to={`/node/${node.id}`} className="ui-resource-card site-resource-card" aria-label={`查看${node.title}`}>
      <div className="site-resource-preview">
        {node.thumbnail
          ? <img src={node.thumbnail} alt={`${node.title}构造图`} loading="lazy" className="h-full w-full object-contain" />
          : <Layers3 size={32} strokeWidth={1.1} className="text-primary/55" aria-hidden="true" />}
      </div>
      <h3>{node.title}</h3>
      <p className="site-resource-description">{node.description}</p>
      <span className="site-resource-action">{node.status === 'development' ? '查看节点状态' : '查看构造'} <span aria-hidden="true">→</span></span>
  </Link>;
}

export default function LibraryPage() {
  const libraryNodes = nodesIndex.filter(node => node.category !== '案例');
  const categories = [...new Set(libraryNodes.map(node => node.category))];

  return <div className="site-page">
    <SectionPageHeader title="构造节点" eyebrow="NODE LIBRARY / 按部位浏览" description={`按建筑部位探索 ${libraryNodes.length} 个构造节点。打开图纸与三维模型，观察构件之间的空间关系。`} />
    <main className="site-container site-page-main">
      {categories.map((category, categoryIndex) => {
        const categoryNodes = libraryNodes.filter(node => node.category === category);
        return <section key={category} className="site-library-section" aria-labelledby={`library-category-${categoryIndex}`}>
          <div className="site-library-heading">
            <div><span className="site-eyebrow">{String(categoryIndex + 1).padStart(2, '0')} / CATEGORY</span><h2 id={`library-category-${categoryIndex}`} className="site-section-title">{category}</h2></div>
            <span>{categoryNodes.length} 个节点</span>
          </div>
          <div className="site-resource-grid">
            {categoryNodes.map(node => <NodeCard key={node.id} node={node} />)}
          </div>
        </section>;
      })}
    </main>
  </div>;
}
