export default function ContentEmptyState({ description = '本板块尚未提供内容。' }: { description?: string }) {
  return <section className="site-empty-state" aria-label="内容状态">
    <span className="site-eyebrow">CONTENT / 内容状态</span>
    <h2 className="site-section-title mt-5">暂无内容</h2>
    <p className="site-page-intro mt-3">{description}</p>
  </section>;
}
