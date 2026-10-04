import { Link } from 'react-router-dom';
import { nodesIndex } from '../data/nodesIndex';
import SectionPageHeader from '../components/SectionPageHeader';
import { featuredCase } from '../data/caseStudies';
import '../components/cases/cases.css';

export default function CasesPage() {
  const caseNodes = nodesIndex.filter(node => node.category === '案例');
  return <div className="site-page">
    <SectionPageHeader title="案例应用" eyebrow="CASE STUDIES / 从建筑理解构造" description="从真实建筑出发，把整体空间、构造部位与课程知识联系起来。" />
    <main className="case-study-page">
      <article className="case-project-card">
        <Link to={`/curriculum/cases/${featuredCase.id}`} className="case-project-cover" aria-label={`查看${featuredCase.title}案例`}><img src={`${import.meta.env.BASE_URL}${featuredCase.cover}`} alt="法恩斯沃斯住宅：钢框架、玻璃围护与入口平台" /></Link>
        <div className="case-project-copy"><span>{featuredCase.english} / {featuredCase.period}</span><h2>{featuredCase.title}</h2><span>{featuredCase.location}</span><p>{featuredCase.description}</p><p>实测图对照 · 完整建筑观察 · 理解自测</p><Link to={`/curriculum/cases/${featuredCase.id}`}>进入案例分析</Link></div>
      </article>
      {caseNodes.length > 0 && <details className="case-archive"><summary>原郓城项目资料 · {caseNodes.length} 项待整理</summary><p>保留原项目记录，目前暂无模型与分析正文。</p><ul>{caseNodes.map(node => <li key={node.id}>{node.description} · 暂无内容</li>)}</ul></details>}
    </main>
  </div>;
}
