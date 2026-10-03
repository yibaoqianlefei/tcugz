import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import SectionPageHeader from '../components/SectionPageHeader';
import CaseExperience from '../components/cases/CaseExperience';
import { getSavoyeTopic, savoye, type CaseTopicId } from '../data/caseStudies';

function Reflection({ topic }: { topic: ReturnType<typeof getSavoyeTopic> }) {
  const [answer, setAnswer] = useState<number | null>(null);
  return <section className="case-reflection" aria-label="案例理解自测">
    <h3>{topic.question}</h3>
    <div>{topic.choices.map((choice, index) => <button key={choice} className={answer === index ? 'is-selected' : ''} aria-pressed={answer === index} onClick={() => setAnswer(index)}>{choice}</button>)}</div>
    <div className="case-reflection-feedback" role="status">{answer === null ? '选择一个答案，检验你的理解。' : answer === topic.answer ? `理解正确。${topic.explanation}` : `再想一想。${topic.explanation}`}</div>
  </section>;
}

function SavoyeStudy() {
  const [searchParams, setSearchParams] = useSearchParams();
  const topic = getSavoyeTopic(searchParams.get('topic'));
  const selectTopic = (id: CaseTopicId) => setSearchParams({ topic: id }, { replace: true, preventScrollReset: true });
  return <div className="site-page">
    <SectionPageHeader title={savoye.title} eyebrow="CASE STUDY / 从整体到构造" description={savoye.description} />
    <main className="case-study-page">
      <div className="case-study-meta"><span>{savoye.location}</span><span>{savoye.period}</span><span>{savoye.architects}</span></div>
      <div className="case-study-layout">
        <div className="case-study-viewer"><CaseExperience selectedTopic={topic.id} onTopicChange={selectTopic} /></div>
        <section className="case-study-reading" aria-live="polite"><span>{topic.number} / {topic.subtitle}</span><h2>{topic.title}</h2><h3>观察建筑</h3><p>{topic.observation}</p><h3>理解构造</h3><p>{topic.principle}</p><div className="case-study-links"><Link to={topic.course.to}>{topic.course.title}</Link><Link to={topic.practice.to}>{topic.practice.title}</Link><small>{topic.practice.note}</small></div></section>
      </div>
      <Reflection key={topic.id} topic={topic} />
      <section className="case-study-sources"><span>资料与实景对照</span><p>模型依据官方项目描述制作，用于观察整体构件关系，未复原配筋、排水节点及施工尺寸。通过下方官方资料查看实景与历史记录。</p>{savoye.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>)}</section>
    </main>
  </div>;
}

export default function CaseStudyPage() {
  const { caseId } = useParams();
  if (caseId !== savoye.id) return <main className="case-study-page"><h1>未找到该建筑案例</h1><p>请从案例目录选择已有项目。</p><Link className="site-back-link" to="/curriculum/cases">返回案例应用</Link></main>;
  return <SavoyeStudy />;
}
