import SectionPageHeader from '../components/SectionPageHeader';
import ContentEmptyState from '../components/ContentEmptyState';

export default function PlaceholderPage({ title = '页面', description }: { title?: string; description?: string }) {
  const intro = title === '工具箱' ? '建筑构造学习与设计的辅助工具。' : '构造节点的补充与共建。';
  return <div className="site-page">
    <SectionPageHeader title={title} eyebrow="EXPLORE / 拓展学习" description={intro} />
    <main className="site-container site-page-main">
      <ContentEmptyState description={description ?? (title === '工具箱' ? '当前尚未提供工具。可以先浏览节点，对照图纸与三维模型学习构造。' : '当前尚未提供投稿入口。可以先浏览已有节点，了解课程中的构造表达。')} />
    </main>
  </div>;
}
