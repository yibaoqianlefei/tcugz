import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, BookOpen, ChevronDown, Lightbulb, MapPin, Settings2, Square, Trash2, X } from 'lucide-react';
import { useCompanionStore } from '../../store/companionStore';
import { useTrainingStore } from '../../store/trainingStore';
import { useAnalysisStore } from '../../store/analysisStore';
import { trainingQuestions } from '../../data/training';
import { companionApiUrl, loadCompanionCorpus, requestCompanionReply } from '../../companion/client';
import { answerFromSite } from '../../companion/knowledge';
import type { CompanionMessage } from '../../companion/types';
import CompanionPet from './CompanionPet';

export default function CompanionPanel({ onResetPosition, launcher }: { onResetPosition: () => void; launcher: RefObject<HTMLButtonElement | null> }) {
  const open = useCompanionStore(state => state.open);
  const context = useCompanionStore(state => state.context);
  const messages = useCompanionStore(state => state.messages);
  const draft = useCompanionStore(state => state.draft);
  const busy = useCompanionStore(state => state.busy);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const stayAtEnd = useRef(true);
  const request = useRef<AbortController | null>(null);
  const lastQuestion = useRef('');
  const close = () => { useCompanionStore.getState().setOpen(false); launcher.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    input.current?.focus({ preventScroll: true });
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (document.body.classList.contains('mobile-nav-open') || document.querySelector('.node-detail-grid[data-diagram-open="true"], [aria-modal="true"]:not(.companion-panel)')) return;
      event.preventDefault(); event.stopImmediatePropagation();
      useCompanionStore.getState().setOpen(false);
      launcher.current?.focus({ preventScroll: true });
    };
    window.addEventListener('keydown', escape, true);
    return () => window.removeEventListener('keydown', escape, true);
  }, [open, launcher]);
  useEffect(() => {
    if (open && stayAtEnd.current && transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [messages, busy, open]);
  useEffect(() => () => request.current?.abort(), []);

  const send = async (question = draft, siteOnly = false) => {
    if (!question.trim() || useCompanionStore.getState().busy) return;
    const snapshot = { ...useCompanionStore.getState().context };
    const state = useCompanionStore.getState();
    const text = question.trim().slice(0, 1500);
    const questionId = snapshot.kind === 'training' ? snapshot.questionId : undefined;
    const training = questionId && trainingQuestions.find(question => question.id === questionId);
    if (training && !snapshot.submitted) useTrainingStore.getState().showHint(training);
    const message: CompanionMessage = { id: crypto.randomUUID(), role: 'user', text, sources: [], mode: 'site', contextTitle: snapshot.objectTitle ? `${snapshot.title} · ${snapshot.objectTitle}` : snapshot.title };
    state.addMessage(message); state.setDraft(''); state.setBusy(true);
    setError(''); lastQuestion.current = text; stayAtEnd.current = true;
    const controller = new AbortController();
    request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(new Error('问答响应超时，请重试')), 25000);
    try {
      const reply = siteOnly ? answerFromSite(await loadCompanionCorpus(), text, snapshot) : await requestCompanionReply(text, snapshot, state.messages, controller.signal);
      controller.signal.throwIfAborted();
      useCompanionStore.getState().addMessage({ id: crypto.randomUUID(), role: 'assistant', contextTitle: message.contextTitle, ...reply });
      useAnalysisStore.getState().addAIQuestion(/材料|保温|钢筋|厚度/.test(text) ? '材料特性' : /层次|空间|顺序/.test(text) ? '空间逻辑' : '构造做法', reply.mode === 'model' ? 'model' : 'site');
    } catch (cause) {
      if (controller.signal.aborted && !(controller.signal.reason instanceof Error && controller.signal.reason.name !== 'AbortError')) setError('已停止生成，可以重新提问。');
      else setError(cause instanceof Error ? cause.message : '资料暂时无法读取，请重试。');
      useCompanionStore.getState().setDraft(text);
    } finally {
      window.clearTimeout(timeout); request.current = null; useCompanionStore.getState().setBusy(false);
    }
  };
  const quickQuestions = context.kind === 'training'
    ? [context.submitted ? '解释本题知识' : '给我一点学习提示']
    : context.objectName ? ['解释选中构件', '这个构件的材料和厚度是什么？'] : ['讲解当前内容', '屋面排水有哪些构造节点？'];
  return <section id="construction-companion-panel" className="companion-panel" role="dialog" aria-label="构造伙伴问答" hidden={!open}>
    <header className="companion-panel-head"><div className="companion-mini-pet"><CompanionPet thinking={busy}/></div><div><h2>构造伙伴</h2><p>{companionApiUrl ? 'AI 问答 · 站内来源' : '站内资料 · 随页学习'}</p></div><button className="companion-icon-button" aria-label="伙伴设置" aria-expanded={settings} onClick={() => setSettings(value => !value)}><Settings2 size={17}/></button><button className="companion-icon-button" aria-label="关闭问答面板" onClick={close}><ChevronDown size={20}/></button></header>
    <div className="companion-context"><MapPin size={14}/><span>{context.title}{context.objectTitle && ` · ${context.objectTitle}`}</span></div>
    {settings && <div className="companion-settings"><span>对话仅在本次打开的网站中保留。</span><div><button disabled={busy} onClick={() => { useCompanionStore.getState().clearMessages(); setError(''); }}><Trash2 size={14}/>清空对话</button><button onClick={onResetPosition}>恢复停靠</button><button onClick={() => { request.current?.abort(); useCompanionStore.getState().setHidden(true); }}><X size={14}/>隐藏伙伴</button></div><small>可从首页 AI 拓展入口唤回。</small></div>}
    <div className="companion-transcript" ref={transcript} onScroll={() => { const element = transcript.current; if (element) stayAtEnd.current = element.scrollHeight - element.scrollTop - element.clientHeight < 60; }}>
      {!messages.length && <div className="companion-welcome"><span className="companion-welcome-kicker">从一个构件开始</span><h3>一起读懂建筑构造。</h3><p>我会根据当前页面查找课程和构件资料。选中模型构件后，可以直接问它的作用。</p><div className="companion-welcome-mark" aria-hidden="true">梁 · 层 · 节点</div></div>}
      {messages.map(message => <article key={message.id} className={`companion-message is-${message.role}`}><div className="companion-message-meta"><span>{message.role === 'user' ? '你' : message.mode === 'hint' ? '学习提示' : message.mode === 'model' ? '构造伙伴 · AI' : '构造伙伴 · 站内资料'}</span><span title={message.contextTitle}>{message.contextTitle}</span></div><p>{message.text}</p>{message.sources.length > 0 && <div className="companion-sources">{message.sources.map(source => <Link key={source.id} to={source.route} onClick={() => { if (matchMedia('(max-width: 600px)').matches) close(); }}><BookOpen size={13}/><span>{source.title}</span><span aria-hidden="true">↗</span></Link>)}</div>}</article>)}
      {busy && <div className="companion-thinking" role="status"><span/>正在查找当前资料…</div>}
      {error && <div className="companion-error" role="alert"><p>{error}</p><button onClick={() => void send(lastQuestion.current, true)}>查看站内资料</button></div>}
    </div>
    <div className="companion-quick-questions">{quickQuestions.map(question => <button key={question} disabled={busy} onClick={() => void send(question)}><Lightbulb size={13}/>{question}</button>)}</div>
    {context.kind === 'training' && !context.submitted && <p className="companion-training-note">本题帮助会记为已使用提示。</p>}
    <form className="companion-input" onSubmit={event => { event.preventDefault(); void send(); }}><textarea ref={input} value={draft} rows={2} maxLength={1500} aria-label="向构造伙伴提问" placeholder="问问构件作用、材料或构造关系…" onChange={event => useCompanionStore.getState().setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }}/>{busy ? <button type="button" aria-label="停止生成" onClick={() => request.current?.abort()}><Square size={16}/></button> : <button type="submit" aria-label="发送问题" disabled={!draft.trim()}><ArrowUp size={20}/></button>}</form>
    <p className="companion-panel-note">{companionApiUrl ? '回答请结合来源核对。' : '当前依据站内资料回答，尚未接入生成式 AI。'}</p>
  </section>;
}
