import { useEffect, useState } from 'react';
import BuildingModel from './BuildingModel';
import { getCaseTopic, featuredCase, type CaseStudy, type CaseTopicId } from '../../data/caseStudies';
import './cases.css';

const base = import.meta.env.BASE_URL;
export default function CaseExperience({ visual, study = featuredCase, selectedTopic, onTopicChange }: { visual?: HTMLElement; study?: CaseStudy; selectedTopic?: CaseTopicId; onTopicChange?: (id: CaseTopicId) => void }) {
  const [started, setStarted] = useState(() => !visual || visual.closest('.hero-slide')?.getAttribute('aria-hidden') === 'false');
  const [localSelected, setSelected] = useState<CaseTopicId | null>(null);
  const selected = selectedTopic ?? localSelected;
  const topic = getCaseTopic(study, selected);
  useEffect(() => {
    if (!visual) return;
    const activate = (event: Event) => { if ((event as CustomEvent<number>).detail === 1) setStarted(true); };
    window.addEventListener('preview-hero-change', activate);
    return () => window.removeEventListener('preview-hero-change', activate);
  }, [visual]);
  const select = (id: CaseTopicId) => { setSelected(id); onTopicChange?.(id); };
  return <div className={`case-experience${visual ? ' case-experience-showcase' : ''}`}>
    <div className="case-experience-header"><span>{study.english} / {study.period.split('–').at(-1)}</span>{visual ? <a href={`${base}#/curriculum/cases/${study.id}`}>查看分析</a> : <a href={study.sources[0].url} target="_blank" rel="noopener noreferrer">图纸与资料</a>}</div>
    <div className="case-experience-heading"><h3>{study.title}</h3><span>{study.location}</span></div>
    <div className="case-experience-model">{started ? <BuildingModel study={study} selected={selected} onSelect={select} showcase={!!visual} /> : <div className="case-model-placeholder">从建筑整体，发现构造关系</div>}</div>
    {!visual && <><div className="case-topic-tabs" role="group" aria-label="案例构造主题">{study.topics.map(item => <button key={item.id} aria-pressed={selected === item.id} onClick={() => select(item.id)}>{item.title}</button>)}</div>
    <div className="case-experience-caption" aria-live="polite"><div><strong>{selected ? topic.subtitle : '一座建筑，三个构造切入点'}</strong><p>{selected ? topic.summary : study.description}</p></div></div>
    <small className="case-model-note">{study.modelNote}</small></>}
  </div>;
}
