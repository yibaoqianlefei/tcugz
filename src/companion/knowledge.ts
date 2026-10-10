import type { CompanionContext, CompanionCorpus, CompanionReply, KnowledgeSource } from './types';

const normalize = (text: string) => text.toLowerCase().replace(/[\s，。？、（）()：:]/g, '');
function tokens(text: string): string[] {
  const clean = normalize(text).replace(/请|帮我|讲解|解释|当前|这个|一下|什么|为什么|如何|有什么|作用|介绍|模型|构件/g, '');
  return [...new Set([...clean.matchAll(/[a-z0-9_-]{2,}|[\u4e00-\u9fff]{2,}/g)].flatMap(match => {
    const word = match[0];
    return [word, ...Array.from({ length: Math.max(0, word.length - 1) }, (_, i) => word.slice(i, i + 2))];
  }))];
}
export function retrieveSources(corpus: CompanionCorpus, question: string, context: CompanionContext): KnowledgeSource[] {
  const words = tokens(`${question} ${context.selectedText ?? ''}`);
  const contextual = /当前|这个|选中|所选|本页|这层|这段|这句话|这里|节点|构件|模型|讲解/.test(question) || words.length === 0;
  const matches = corpus.sources.map(source => {
    let score = 0;
    const title = normalize(source.title);
    const body = normalize(source.text);
    for (const word of words) score += title.includes(word) ? word.length * 4 : body.includes(word) ? Math.min(word.length, 4) : 0;
    const sameNode = Boolean(context.nodeId && source.nodeId === context.nodeId);
    const sameVariant = !context.variantId || source.variantId === context.variantId;
    if (score > 0 || contextual) {
      if (sameNode && sameVariant) score += 12;
      if (sameNode && sameVariant && context.objectName && [source.objectName, ...(source.aliases ?? [])].includes(context.objectName)) score += 100;
      if (context.coursePath && source.route === `/lesson/${context.coursePath}`) score += 100;
      if (context.caseId && source.caseId === context.caseId) score += source.topicId === context.topicId ? 60 : 20;
    }
    // Explicit numeric requests must not borrow dimensions from another node/variant.
    if (/厚度|尺寸|配比|规范/.test(question) && context.nodeId && (!sameNode || !sameVariant)) return { source, score: 0 };
    return { source, score };
  });
  return matches.filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map(item => item.source);
}

export function answerFromSite(corpus: CompanionCorpus, question: string, context: CompanionContext): CompanionReply {
  if (context.kind === 'training' && context.questionId) {
    const help = corpus.training.find(item => item.id === context.questionId);
    if (help) return {
      text: context.submitted ? `作答后回顾\n\n${help.explanation}` : `先观察，再判断\n\n${help.hint}\n\n可以转动模型或分开观察，再回到题目完成选择。`,
      sources: [], mode: 'hint',
    };
  }
  let sources = retrieveSources(corpus, question, context);
  const currentCourse = sources.find(source => source.kind === 'course' && source.route === context.route);
  if (currentCourse?.empty) return {
    text: `「${currentCourse.title}」的正文尚未提供，当前不能依据这章做详细讲解。可以进入构造节点，选择已提供知识卡片的构件继续学习。`,
    sources: [currentCourse], mode: 'site',
  };
  if (!sources.length) return {
    text: '目前没有找到足够的站内资料。可以换一个构造名称，或进入节点页面选择具体构件再问。我不会补写图中未标注的厚度、材料或规范条款。',
    sources: [], mode: 'site',
  };
  if (context.objectName && /选中|这个|构件|这层/.test(question)) {
    const selected = sources.find(source => source.nodeId === context.nodeId && (!context.variantId || source.variantId === context.variantId) && [source.objectName, ...(source.aliases ?? [])].includes(context.objectName!));
    if (selected) sources = [selected];
  }
  if (/规范|标准|条文|国标/.test(question)) return {
    text: '当前站内卡片尚未提供可核验的现行规范条款，不能据此确定规范编号或适用要求。可先查看对应图纸和卡片；具体条款需要补充有效版本的规范资料后核对。',
    sources, mode: 'site',
  };
  const excerpts = sources.map(source => `【${source.title}】\n${source.text.slice(0, 700)}`).join('\n\n');
  return {
    text: `为你找到以下站内资料：\n\n${excerpts}\n\n这些是当前网站的教学记录；具体尺寸和做法请结合对应图纸核对，资料未标注的内容不能据此推定。`,
    sources, mode: 'site',
  };
}

/** Accept only IDs from the retrieved corpus. Never render provider-supplied URLs or HTML. */
export function validateReply(value: unknown, allowed: KnowledgeSource[]): CompanionReply {
  if (!value || typeof value !== 'object') throw new Error('回答格式不正确');
  const response = value as { text?: unknown; sourceIds?: unknown };
  if (typeof response.text !== 'string' || !response.text.trim() || response.text.length > 16000) throw new Error('回答内容不完整');
  if (!Array.isArray(response.sourceIds)) throw new Error('回答来源不完整');
  const ids = response.sourceIds;
  if (!ids.length || ids.some(id => typeof id !== 'string' || !allowed.some(source => source.id === id))) throw new Error('回答来源未通过核对');
  return { text: response.text, sources: allowed.filter(source => ids.includes(source.id)), mode: 'model' };
}
