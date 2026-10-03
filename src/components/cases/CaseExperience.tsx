import { useEffect, useState } from 'react';
import SavoyeModel from './SavoyeModel';
import { getSavoyeTopic, savoye, savoyeTopics, type CaseTopicId } from '../../data/caseStudies';
import './cases.css';

const base = import.meta.env.BASE_URL;
export default function CaseExperience({ visual, selectedTopic, onTopicChange }: { visual?: HTMLElement; selectedTopic?: CaseTopicId; onTopicChange?: (id: CaseTopicId) => void }) {
  const [started, setStarted] = useState(() => !visual || visual.closest('.hero-slide')?.getAttribute('aria-hidden') === 'false');
  const [localSelected, setSelected] = useState<CaseTopicId | null>(null);
  const selected = selectedTopic ?? localSelected;
  const topic = getSavoyeTopic(selected);
  useEffect(() => {
    if (!visual) return;
    const activate = (event: Event) => { if ((event as CustomEvent<number>).detail === 1) setStarted(true); };
    window.addEventListener('preview-hero-change', activate);
    return () => window.removeEventListener('preview-hero-change', activate);
  }, [visual]);
  const select = (id: CaseTopicId) => { setSelected(id); onTopicChange?.(id); };
  return <div className="case-experience">
    <div className="case-experience-header"><span>VILLA SAVOYE / 1931</span><a href={savoye.sources[0].url} target="_blank" rel="noopener noreferrer">实景与资料</a></div>
    <div className="case-experience-heading"><h3>{savoye.title}</h3><span>{savoye.location}</span></div>
    <div className="case-experience-model">{started ? <SavoyeModel selected={selected} onSelect={select} /> : <div className="case-model-placeholder">从建筑整体，发现构造关系</div>}</div>
    <div className="case-topic-tabs" role="group" aria-label="案例构造主题">{savoyeTopics.map(item => <button key={item.id} aria-pressed={selected === item.id} onClick={() => select(item.id)}><span>{item.number}</span>{item.title}</button>)}</div>
    <div className="case-experience-caption" aria-live="polite"><div><strong>{selected ? topic.subtitle : '一座建筑，三个构造切入点'}</strong><p>{selected ? topic.summary : savoye.description}</p></div>{visual && <a href={`${base}#/curriculum/cases/${savoye.id}?topic=${topic.id}`}>查看分析</a>}</div>
    <small className="case-model-note">{savoye.modelNote}</small>
  </div>;
}
