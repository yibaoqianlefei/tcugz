import { useCallback, useEffect, useState } from 'react';
import TrainingModel from '../components/training/TrainingModel';
import { getTrainingNode, trainingModes, trainingQuestions } from '../data/training';
import { evaluateTrainingAnswer, initialTrainingAnswer } from '../utils/trainingEvaluation';

const question = trainingQuestions.find(item => item.id === 'identify-gutter')!;
const node = getTrainingNode(question)!;
const base = import.meta.env.BASE_URL;
const trainingLink = `${base}#/games/identify?question=${question.id}`;
const moreModes = trainingModes.filter(mode => mode.id === 'order' || mode.id === 'assemble');

export default function TrainingPreview({ visual }: { visual: HTMLElement }) {
  const [started, setStarted] = useState(() => visual.closest('.hero-slide')?.getAttribute('aria-hidden') === 'false');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selection, setSelection] = useState<string>();
  const [submitted, setSubmitted] = useState(false);
  const [hinted, setHinted] = useState(false);
  const [separated, setSeparated] = useState(false);
  const ready = status === 'ready';
  const result = submitted && selection ? evaluateTrainingAnswer(question, { ...initialTrainingAnswer(question), selection }) : undefined;
  const onStatus = useCallback((_path: string, next: 'ready' | 'error') => setStatus(next), []);
  const choose = (id: string) => { if (ready && !submitted) setSelection(id); };

  useEffect(() => {
    const activate = (event: Event) => { if ((event as CustomEvent<number>).detail === 2) setStarted(true); };
    window.addEventListener('preview-hero-change', activate);
    return () => window.removeEventListener('preview-hero-change', activate);
  }, []);

  return <div className="practice-preview">
    <div className="showcase-top"><span><i className="showcase-mark" /> PRACTICE STUDIO</span><a href={`${base}#/games`}>{trainingModes.length} 种模式 · {trainingQuestions.length} 题</a></div>
    <div className="practice-preview-scene">
      {started ? <TrainingModel path={node.model!.path} parts={question.parts} selected={selection ? [selection] : []} hidden={[]} separated={separated} anonymous disabled={!ready || submitted} fitPadding={separated ? 1.5 : 1.16} onSelect={choose} onStatus={onStatus} /> : <div className="practice-preview-placeholder">转动模型，发现构件之间的关系</div>}
      <button className="practice-preview-observe" disabled={!ready} aria-pressed={separated} onClick={() => setSeparated(value => !value)}>{separated ? '合拢观察' : '分开观察'}</button>
      <span className="practice-preview-gesture">拖动观察 · 点选构件</span>
    </div>
    <div className="practice-preview-task"><div><span>模型构件辨识 / 首页试练</span><h3>{question.title}</h3></div><p>选出承接屋面雨水的水平沟槽。</p></div>
    <div className="practice-preview-choices" role="group" aria-label="首页训练作答">
      {question.parts.map((part, index) => <button key={part.id} disabled={!ready || submitted} aria-pressed={selection === part.id} className={selection === part.id ? result ? result.correct ? 'is-correct' : 'is-incorrect' : 'is-selected' : ''} onClick={() => choose(part.id)}><b>{String.fromCharCode(65 + index)}</b></button>)}
    </div>
    <div className={`practice-preview-feedback${result ? result.correct ? ' is-correct' : ' is-incorrect' : ''}`} role="status" aria-live="polite">
      <span>{result ? result.correct ? `答对了。${question.explanation}` : `再观察一下：${question.hint}` : status === 'error' ? '模型暂不可用，可重试或进入训练中心。' : ready ? hinted ? question.hint : selection ? '已选择构件，提交后查看解析。' : '点击模型或字母选择构件。' : '模型准备中…'}</span>
      {submitted ? <button onClick={() => { setSelection(undefined); setSubmitted(false); setHinted(false); }}>再试一次</button> : <div className="practice-preview-answer-actions"><button disabled={!ready || hinted} onClick={() => setHinted(true)}>提示</button><button className="practice-preview-submit" disabled={!ready || !selection} onClick={() => setSubmitted(true)}>提交答案</button></div>}
    </div>
    <div className="practice-preview-footer"><a className="practice-preview-continue" href={trainingLink}>继续这项训练</a><div><span>也可尝试</span>{moreModes.map(mode => <a key={mode.id} href={`${base}#/games/${mode.id}`}>{mode.title}</a>)}</div></div>
  </div>;
}
