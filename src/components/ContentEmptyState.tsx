import { Link } from 'react-router-dom';

export default function ContentEmptyState({ title = '暂无内容', description = '本板块尚未提供内容。' }: { title?: string; description?: string }) {
  return <section className="site-empty-state" aria-label="内容状态">
    <h2 className="site-section-title">{title}</h2>
    <p className="site-page-intro">{description}</p>
    <Link to="/library" className="site-button">浏览构造节点 <span aria-hidden="true">→</span></Link>
  </section>;
}
