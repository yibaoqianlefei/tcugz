import SectionPageHeader from '../components/SectionPageHeader';
import ContentEmptyState from '../components/ContentEmptyState';

export default function PlaceholderPage({ title = '页面', description = '本板块尚未提供内容。' }: { title?: string; description?: string }) {
  return <div className="site-page">
    <SectionPageHeader title={title} eyebrow="EXPLORE / 拓展学习" description={description} />
    <main className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      <ContentEmptyState description={description} />
    </main>
  </div>;
}
