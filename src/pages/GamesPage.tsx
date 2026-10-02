import { useCallback, useState, type DragEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Check, Eye, Lightbulb, RotateCcw, X } from 'lucide-react';
import SectionPageHeader from '../components/SectionPageHeader';
import TrainingModel from '../components/training/TrainingModel';
import { trainingModes, trainingQuestions, questionsForMode, getTrainingNode, type TrainingQuestion, type TrainingModeInfo } from '../data/training';
import { useTrainingStore, freshTrainingDraft } from '../store/trainingStore';
import { isAnswerComplete, moveTrainingItem, placeTrainingPart } from '../utils/trainingEvaluation';
import './training.css';

function TrainingCatalog() {
  const { progress, storageAvailable } = useTrainingStore();
  const records = Object.values(progress.records);
  const mistakes = trainingQuestions.filter(question => progress.records[question.id]?.hadMistake);
  return <div className="site-page training-page">
    <SectionPageHeader title="作业训练" eyebrow="PRACTICE / 从观察到应用" description="转动模型、识别构件、理解层次，再尝试方案判断与装配。每次练习都可以暂停，稍后继续。" />
    <main className="training-catalog">
      <div className="training-summary"><div><strong>{records.filter(record => record.solved).length}<small> / {trainingQuestions.length}</small></strong><span>已答对题目</span></div><div><strong>{records.filter(record => record.firstCorrect).length}</strong><span>首次独立答对</span></div><div><strong>{mistakes.length}</strong><span>错题记录</span></div><p>{storageAvailable ? '进度保存在当前浏览器，无需登录即可练习。' : '当前浏览器无法保存进度，离开或刷新后可能丢失作答。'}</p></div>
      <div className="training-section-heading"><h2>选择一种训练方式</h2><span>8 种模式 · 自主练习</span></div>
      <div className="training-mode-grid">
        {trainingModes.map((mode, index) => {
          const questions = questionsForMode(mode.id);
          const solved = questions.filter(question => progress.records[question.id]?.solved).length;
          const started = questions.some(question => progress.drafts[question.id] || progress.records[question.id]);
          const node = getTrainingNode(mode);
          return <Link key={mode.id} to={`/games/${mode.id}`} className="training-mode-card" aria-label={`${started ? '继续' : '开始'}${mode.title}`}>
            <div className="training-card-image">{node?.thumbnail || node?.diagram ? <img src={node.thumbnail ?? node.diagram!.path} alt={`${node.title}示意图`} loading="lazy" /> : <span className="training-card-shape" aria-hidden="true">◇</span>}<span>{String(index + 1).padStart(2, '0')} / {mode.level}</span></div>
            <div className="training-card-copy"><h3>{mode.title}</h3><p>{mode.description}</p><div><span>{questions.length} 题 · {mode.minutes}</span><strong>{started ? `${solved}/${questions.length} 已答对 · 继续` : '开始练习'}</strong></div></div>
          </Link>;
        })}
      </div>
      {mistakes.length > 0 && <section className="training-mistakes" aria-labelledby="training-mistakes-title"><div className="training-section-heading"><h2 id="training-mistakes-title">错题回顾</h2><span>保留错误经历，便于再次练习</span></div><div className="training-mistake-list">{mistakes.map(question => <Link key={question.id} to={`/games/${question.mode}?question=${question.id}`}><span>{question.title}</span><small>{progress.records[question.id].lastCorrect ? '已订正 · 可再次练习' : '待订正'}</small></Link>)}</div></section>}
      <p className="training-storage-note">本板块为自主练习，记录仅保存在当前浏览器；暂不提供教师收作业或跨设备成绩同步。</p>
    </main>
  </div>;
}

function TrainingWorkbench({ mode }: { mode: TrainingModeInfo }) {
  const { progress, storageAvailable, updateAnswer, showHint, submit, retry, setCurrent } = useTrainingStore();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const questions = questionsForMode(mode.id);
  const requestedId = params.get('question');
  const question = questions.find(question => question.id === requestedId) ?? questions.find(question => question.id === progress.current[mode.id]) ?? questions[0];
  const index = questions.indexOf(question);
  const draft = progress.drafts[question.id] ?? freshTrainingDraft(question);
  const node = getTrainingNode(question)!;
  const answer = draft.answer;
  const [focused, setFocused] = useState<Record<string, string>>({});
  const [separated, setSeparated] = useState(false);
  const [correctPath, setCorrectPath] = useState(false);
  const [modelStatus, setModelStatus] = useState<{ path: string; status: 'ready' | 'error' } | null>(null);
  const variantId = question.mode === 'scenario' ? answer.selection ?? node.variants![0].id : undefined;
  const modelConfig = variantId ? node.variants!.find(variant => variant.id === variantId)?.model : node.model;
  const modelPath = modelConfig?.path ?? '';
  const onModelStatus = useCallback((path: string, status: 'ready' | 'error') => setModelStatus(current => current?.path === path && current.status === status ? current : { path, status }), []);
  const ready = modelStatus?.path === modelPath && modelStatus.status === 'ready';
  const anonymous = question.mode === 'identify' || question.mode === 'diagram';
  const selected = question.mode === 'path' ? answer.order : answer.selection && question.mode !== 'scenario' ? [answer.selection] : focused[question.id] ? [focused[question.id]] : [];
  const focus = (id: string) => setFocused(current => ({ ...current, [question.id]: id }));
  const choose = (id: string) => {
    if (draft.submitted) return;
    if (question.mode === 'identify' || question.mode === 'diagram') updateAnswer(question, { ...answer, selection: id });
    else if (question.mode === 'path') updateAnswer(question, { ...answer, order: answer.order.includes(id) ? answer.order : [...answer.order, id] });
    else if (question.mode === 'assemble') {
      const part = focused[question.id] ?? question.parts[0].id;
      updateAnswer(question, { ...answer, placements: placeTrainingPart(answer.placements, id, part) });
    } else focus(id);
  };
  const drop = (event: DragEvent, targetIndex: number) => {
    event.preventDefault();
    if (draft.submitted) return;
    const id = event.dataTransfer.getData('text/plain');
    const oldIndex = answer.order.indexOf(id);
    if (oldIndex < 0) return;
    const order = [...answer.order];
    order.splice(oldIndex, 1);
    order.splice(targetIndex, 0, id);
    updateAnswer(question, { ...answer, order });
  };
  const goTo = (next: TrainingQuestion) => {
    setCurrent(mode.id, next.id);
    setCorrectPath(false);
    navigate(`/games/${mode.id}?question=${next.id}`);
  };
  const partName = (id: string) => question.parts.find(part => part.id === id)?.name ?? id;
  const retryQuestion = () => { retry(question); setCorrectPath(false); };
  const complete = isAnswerComplete(question, answer);
  const result = draft.result;
  const placements = question.mode === 'assemble' ? answer.placements : undefined;
  const hidden = question.mode === 'diagnose' && !draft.submitted ? question.hiddenParts ?? [] : [];
  return <div className="site-page training-page training-workbench">
    <header className="training-workbench-heading"><div><span className="site-eyebrow">{mode.level} / {mode.title}</span><h1>{question.title}</h1></div><div className="training-question-progress"><span>第 {index + 1} / {questions.length} 题</span><progress value={index + 1} max={questions.length} aria-label="当前题目进度" /></div></header>
    <div className="training-workbench-grid">
      <section className={`training-visual${question.figure ? ' has-diagram' : ''}`} aria-label="模型观察区">
        <div className="training-visual-toolbar"><span>{node.title}</span>{question.mode !== 'scenario' && question.mode !== 'assemble' && <button onClick={() => setSeparated(value => !value)} aria-pressed={separated}><Eye size={15} />{separated ? '合拢观察' : '分开观察'}</button>}</div>
        <TrainingModel path={modelPath} parts={question.parts} groups={node.model?.groups} selected={selected} hidden={hidden} placements={placements} trace={question.mode === 'path' ? correctPath && draft.submitted ? question.answer.order : answer.order : undefined} separated={separated} anonymous={anonymous} disabled={draft.submitted || !ready} onSelect={choose} onStatus={onModelStatus} />
        <p className="training-model-instructions">拖动转动模型 · 滚轮缩放{question.mode === 'assemble' ? ' · 选择构件后点击位置字母放置' : ' · 点击构件或字母观察'}</p>
        {question.figure && <figure className="training-diagram"><div className="training-diagram-image"><img src={node.diagram!.path} alt={question.figure.caption} /><span style={{ left: `${question.figure.x}%`, top: `${question.figure.y}%` }} aria-label="图纸圈示位置 1">1</span></div><figcaption>{question.figure.caption}</figcaption></figure>}
      </section>
      <section className="training-task" aria-label="作答区域">
        <span className="training-task-kicker">本题任务</span><p className="training-prompt">{question.prompt}</p>
        {!ready && <p className="training-status" role="status">{modelStatus?.status === 'error' ? '模型未就绪，重试加载后再提交。' : '正在准备模型，加载完成后即可作答。'}</p>}

        {(question.mode === 'identify' || question.mode === 'diagram' || question.mode === 'path') && <div className={`training-component-choices${anonymous ? ' letter-only' : ''}`} role="group" aria-label="选择模型构件">{question.parts.map((part, partIndex) => <button key={part.id} className={selected.includes(part.id) ? 'selected' : ''} aria-pressed={selected.includes(part.id)} disabled={!ready || draft.submitted} onClick={() => choose(part.id)}><b>{String.fromCharCode(65 + partIndex)}</b>{anonymous ? null : part.name}{!anonymous && selected.includes(part.id) && <Check size={16} aria-hidden="true" />}</button>)}</div>}

        {question.mode === 'match' && <div className="training-pairs">{question.parts.map(part => {
          const correct = answer.pairs[part.id] === question.answer.pairs?.[part.id];
          return <div key={part.id} className={draft.submitted ? correct ? 'correct' : 'incorrect' : ''}><button className="training-part-name" onClick={() => focus(part.id)} aria-label={`观察${part.name}`}>{part.name}</button><select aria-label={`${part.name}的作用`} value={answer.pairs[part.id] ?? ''} disabled={draft.submitted} onChange={event => updateAnswer(question, { ...answer, pairs: { ...answer.pairs, [part.id]: event.target.value } })}><option value="">选择功能</option>{question.choices!.map(choice => <option key={choice.id} value={choice.id}>{choice.label}</option>)}</select>{draft.submitted && <span aria-label={correct ? '配对正确' : '配对错误'}>{correct ? '✓' : '×'}</span>}</div>;
        })}</div>}

        {(question.mode === 'order' || question.mode === 'path') && <div className="training-sequence"><div className="training-sequence-heading"><strong>{question.mode === 'order' ? '从内向外排列' : '你的路径'}</strong>{question.mode === 'path' && !draft.submitted && <button disabled={!answer.order.length} onClick={() => updateAnswer(question, { ...answer, order: answer.order.slice(0, -1) })}>撤回一步</button>}</div>{!answer.order.length && <p className="training-sequence-empty">依次点选模型构件，建立路径。</p>}<ol>{answer.order.map((id, itemIndex) => <li key={id} draggable={!draft.submitted} onDragStart={event => event.dataTransfer.setData('text/plain', id)} onDragOver={event => event.preventDefault()} onDrop={event => drop(event, itemIndex)} className={draft.submitted ? question.answer.order?.[itemIndex] === id ? 'correct' : 'incorrect' : ''}><span className="training-sequence-number">{itemIndex + 1}</span><button className="training-part-name" onClick={() => focus(id)}>{partName(id)}</button><div className="training-sequence-controls"><button disabled={draft.submitted || itemIndex === 0} aria-label={`上移${partName(id)}`} onClick={() => updateAnswer(question, { ...answer, order: moveTrainingItem(answer.order, itemIndex, -1) })}><ArrowUp size={16} /></button><button disabled={draft.submitted || itemIndex === answer.order.length - 1} aria-label={`下移${partName(id)}`} onClick={() => updateAnswer(question, { ...answer, order: moveTrainingItem(answer.order, itemIndex, 1) })}><ArrowDown size={16} /></button></div></li>)}</ol><small>可拖动行排序，也可使用上下移动按钮。</small></div>}

        {(question.mode === 'scenario' || question.mode === 'diagnose') && <fieldset className="training-choice-fieldset"><legend>{question.mode === 'scenario' ? '选择并观察方案' : '判断缺失构件'}</legend>{question.choices!.map(choice => <label key={choice.id} className={answer.selection === choice.id ? 'selected' : ''}><input type="radio" name={`selection-${question.id}`} value={choice.id} checked={answer.selection === choice.id} disabled={draft.submitted || !ready} onChange={() => updateAnswer(question, { ...answer, selection: choice.id })} />{choice.label}</label>)}</fieldset>}
        {question.reasons && <fieldset className="training-choice-fieldset"><legend>选择判断理由</legend>{question.reasons.map(choice => <label key={choice.id} className={answer.reason === choice.id ? 'selected' : ''}><input type="radio" name={`reason-${question.id}`} checked={answer.reason === choice.id} disabled={draft.submitted} onChange={() => updateAnswer(question, { ...answer, reason: choice.id })} />{choice.label}</label>)}</fieldset>}

        {question.mode === 'assemble' && <div className="training-assembly"><fieldset className="training-choice-fieldset"><legend>1. 选择待装配构件</legend>{question.parts.map(part => <label key={part.id} className={(focused[question.id] ?? question.parts[0].id) === part.id ? 'selected' : ''}><input type="radio" name={`inventory-${question.id}`} checked={(focused[question.id] ?? question.parts[0].id) === part.id} disabled={draft.submitted || !ready} onChange={() => focus(part.id)} />{part.name}</label>)}</fieldset><h3>2. 选择模型上的位置</h3>{question.slots!.map(slot => {
          const labelIndex = question.parts.findIndex(part => part.id === slot.id);
          return <div className="training-slot-row" key={slot.id}><button className="training-slot" disabled={draft.submitted || !ready} onClick={() => choose(slot.id)}><b>{String.fromCharCode(65 + labelIndex)}</b><span>{slot.label}<small>{answer.placements[slot.id] ? `已放入：${partName(answer.placements[slot.id])}` : '等待放入构件'}</small></span></button>{answer.placements[slot.id] && <button className="training-remove" disabled={draft.submitted} aria-label={`移除${slot.label}的构件`} onClick={() => updateAnswer(question, { ...answer, placements: Object.fromEntries(Object.entries(answer.placements).filter(([id]) => id !== slot.id)) })}><X size={16} /></button>}</div>;
        })}</div>}

        <div className="training-hint"><button disabled={draft.hinted || draft.submitted} onClick={() => showHint(question)}><Lightbulb size={16} />{draft.hinted ? '已查看提示' : '给我一点提示'}</button>{draft.hinted && <p>{question.hint}</p>}</div>
        {!draft.submitted && <><button className="training-button primary training-submit" disabled={!complete || !ready} onClick={() => submit(question)}>提交答案</button><p className="training-submit-help">{!complete ? '完成本题全部选择后即可提交。' : '提交后查看对应关系和解析。'}</p></>}
        {draft.submitted && result && <div className={`training-feedback ${result.correct ? 'correct' : 'incorrect'}`} role="status" aria-live="polite"><h2>{result.correct ? '答对了' : '再看一看对应关系'}</h2><span>{result.matched} / {result.total} 项对应正确{draft.hinted ? ' · 本次使用了提示' : ''}</span><p>{question.explanation}</p>{question.mode === 'path' && <button className="training-button" onClick={() => setCorrectPath(value => !value)}>{correctPath ? '查看我的路径' : '查看正确路径'}</button>}<div className="training-feedback-actions"><button className="training-button" onClick={retryQuestion}><RotateCcw size={15} />重新作答</button>{index < questions.length - 1 ? <button className="training-button primary" onClick={() => goTo(questions[index + 1])}>下一题</button> : <Link className="training-button primary" to="/games">返回训练中心</Link>}</div></div>}
        <Link to={`/node/${question.nodeId}`} className="training-reference" target="_blank" rel="noopener noreferrer">复习对应构造节点（新窗口）</Link>
        <p className="training-storage-note">{storageAvailable ? '作答自动保存在当前浏览器。首次独立答对记录不会因重试增加。' : '当前无法保存进度，刷新或离开后可能丢失作答。'}</p>
      </section>
    </div>
    <nav className="training-question-nav" aria-label="选择训练题目">{questions.map((item, itemIndex) => <button key={item.id} aria-current={item.id === question.id ? 'step' : undefined} onClick={() => goTo(item)}>{itemIndex + 1}. {item.title}{progress.records[item.id]?.solved && <Check size={14} aria-label="已答对" />}</button>)}</nav>
  </div>;
}

export default function GamesPage() {
  const { modeId } = useParams();
  if (!modeId) return <TrainingCatalog />;
  const mode = trainingModes.find(mode => mode.id === modeId);
  if (!mode) return <div className="site-page training-page"><SectionPageHeader title="未找到这项训练" eyebrow="PRACTICE / 作业训练" description="请通过右上角按钮返回训练中心，选择可用的训练模式。" /></div>;
  return <TrainingWorkbench key={modeId} mode={mode} />;
}
