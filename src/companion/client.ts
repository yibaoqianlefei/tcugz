import type { CompanionContext, CompanionCorpus, CompanionMessage, CompanionReply } from './types';
import { answerFromSite, retrieveSources, validateReply } from './knowledge';

export const companionApiUrl = import.meta.env.VITE_COMPANION_API_URL?.trim() ?? '';
let corpusPromise: Promise<CompanionCorpus> | undefined;
export function loadCompanionCorpus(): Promise<CompanionCorpus> {
  corpusPromise ??= fetch(`${import.meta.env.BASE_URL}data/companion-knowledge.json`).then(async response => {
    if (!response.ok) throw new Error('站内资料暂时无法读取');
    const corpus = await response.json() as CompanionCorpus;
    if (corpus.version !== 1 || !Array.isArray(corpus.sources) || !Array.isArray(corpus.training)) throw new Error('站内资料版本不正确');
    return corpus;
  }).catch(error => { corpusPromise = undefined; throw error; });
  return corpusPromise;
}
export async function requestCompanionReply(question: string, context: CompanionContext, messages: CompanionMessage[], signal: AbortSignal): Promise<CompanionReply> {
  const corpus = await loadCompanionCorpus();
  signal.throwIfAborted();
  // Training help remains curated and deterministic, including with a model configured.
  if (!companionApiUrl || context.kind === 'training') return answerFromSite(corpus, question, context);
  const sources = retrieveSources(corpus, question, context);
  if (!sources.length || sources.some(source => source.empty)) return answerFromSite(corpus, question, context);
  const response = await fetch(companionApiUrl, {
    method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context, messages: messages.slice(-6).map(message => ({ role: message.role, text: message.text.slice(0, 1800) })) }),
  });
  if (!response.ok) throw new Error(response.status === 429 ? '问答次数较多，请稍后再试' : 'AI 服务暂不可用，可以查看站内资料');
  return validateReply(await response.json(), sources);
}
