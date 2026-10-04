import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import SectionPageHeader from '../components/SectionPageHeader';
import CaseExperience from '../components/cases/CaseExperience';
import { getCaseTopic, getCaseStudy, type CaseTopic, type CaseStudy, type CaseTopicId } from '../data/caseStudies';

function Reflection({ topic }: { topic: CaseTopic }) {
  const [answer, setAnswer] = useState<number | null>(null);
  return <section className="case-reflection" aria-label="案例理解自测">
    <h3>{topic.question}</h3>
    <div>{topic.choices.map((choice, index) => <button key={choice} className={answer === index ? 'is-selected' : ''} aria-pressed={answer === index} onClick={() => setAnswer(index)}>{choice}</button>)}</div>
    <div className="case-reflection-feedback" role="status">{answer === null ? '选择一个答案，检验你的理解。' : answer === topic.answer ? `理解正确。${topic.explanation}` : `再想一想。${topic.explanation}`}</div>
  </section>;
}

function BuildingStudy({ study }: { study: CaseStudy }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const topic = getCaseTopic(study, searchParams.get('topic'));
  const selectTopic = (id: CaseTopicId) => setSearchParams({ topic: id }, { replace: true, preventScrollReset: true });
  return <div className="site-page">
    <SectionPageHeader title={study.title} eyebrow="CASE STUDY / 从整体到构造" description={study.description} />
    <main className="case-study-page">
      <div className="case-study-meta"><span>{study.location}</span><span>{study.period}</span><span>{study.architects}</span></div>
      <div className="case-study-layout">
        <div className="case-study-viewer"><CaseExperience study={study} selectedTopic={topic.id} onTopicChange={selectTopic} /></div>
        <section className="case-study-reading" aria-live="polite"><span>{topic.number} / {topic.subtitle}</span><h2>{topic.title}</h2><h3>观察建筑</h3><p>{topic.observation}</p><h3>理解构造</h3><p>{topic.principle}</p><div className="case-study-links"><Link to={topic.course.to}>{topic.course.title}</Link><Link to={topic.practice.to}>{topic.practice.title}</Link><small>{topic.practice.note}</small></div></section>
      </div>
      <Reflection key={topic.id} topic={topic} />
      <section className="case-study-sources"><span>资料与模型对照</span><p>{study.id === 'farnsworth-house' ? '主体、柱网、平台及服务核心依据 HABS 2009 年实测图重建。材料纹理、型钢小截面及洁具外形近似；地面和绿植为展示装饰。未复原隐蔽管线、配筋及完整防水层。模型用于教学观察，不作为施工依据。' : '模型用于观察整体构件关系，比例与细部简化。'}通过下方原始资料核对建筑。</p>{study.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>)}{study.id === 'farnsworth-house' && <details className="case-drawing-reference"><summary>展开实测平面与剖面对照</summary>{[['plan','平面 · HABS 图 3'],['sections','立面与剖面 · HABS 图 5'],['core','服务核心 · HABS 图 6']].map(([file,title])=><figure key={file}><a href={`${import.meta.env.BASE_URL}images/cases/farnsworth-${file}.png`} target="_blank" rel="noopener noreferrer"><img loading="lazy" src={`${import.meta.env.BASE_URL}images/cases/farnsworth-${file}.png`} alt={title} /></a><figcaption>{title} · 美国国会图书馆</figcaption></figure>)}</details>}</section>
    </main>
  </div>;
}

export default function CaseStudyPage() {
  const { caseId } = useParams();
  const study = getCaseStudy(caseId);
  if (!study) return <main className="case-study-page"><h1>未找到该建筑案例</h1><p>请从案例目录选择已有项目。</p><Link className="site-back-link" to="/curriculum/cases">返回案例应用</Link></main>;
  return <BuildingStudy key={study.id} study={study} />;
}
