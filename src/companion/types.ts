export type CompanionPageKind = 'home' | 'node' | 'course' | 'case' | 'training' | 'other';
export interface CompanionContext {
  kind: CompanionPageKind;
  route: string;
  title: string;
  nodeId?: string;
  variantId?: string;
  objectName?: string;
  objectTitle?: string;
  caseId?: string;
  topicId?: string;
  questionId?: string;
  submitted?: boolean;
  coursePath?: string;
  selectedText?: string;
}
export interface KnowledgeSource {
  id: string;
  title: string;
  route: string;
  text: string;
  kind: 'node' | 'component' | 'course' | 'case';
  nodeId?: string;
  variantId?: string;
  objectName?: string;
  aliases?: string[];
  caseId?: string;
  topicId?: string;
  empty?: boolean;
}
export interface TrainingHelp {
  id: string;
  title: string;
  mode: string;
  prompt: string;
  hint: string;
  explanation: string;
}
export interface CompanionCorpus {
  version: number;
  sources: KnowledgeSource[];
  training: TrainingHelp[];
}
export interface CompanionReply {
  text: string;
  sources: KnowledgeSource[];
  mode: 'site' | 'model' | 'hint';
}
export interface CompanionMessage extends CompanionReply {
  id: string;
  role: 'user' | 'assistant';
  contextTitle: string;
}
