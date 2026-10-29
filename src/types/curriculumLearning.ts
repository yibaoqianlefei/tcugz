export interface DiagramEvidence {
  id: string;
  title: string;
  path: string;
  scope: string;
  exclusions: string[];
  checkedOn: string;
  status: 'reviewed';
  sources: Array<{ standard: string; clause: string; pages: string; url: string; statusUrl?: string; appliesTo: string }>;
  reviews: Array<{ round: number; result: string }>;
}

export interface LearningModel {
  nodeId: string; title: string; objects: string[]; difference: string;
  role: 'core' | 'comparison' | 'extension'; primary: boolean;
}
export interface KnowledgeUnit {
  id: string; lesson: string; anchor: string; sectionId: string; title: string;
  question: string; principle: string; observe: string[]; conclusion: string; boundary: string;
  models: LearningModel[];
  assessment: { question: string; criteria: string[] };
  prerequisiteIds: string[]; conceptIds: string[]; relatedPrinciples: string[];
  applications: string[]; diagramIds: string[];
}
export interface LessonLearningPlan {
  outcome: string; prerequisite: string; prerequisiteIds: string[]; intro: string;
  units: KnowledgeUnit[]; diagrams: string[]; relatedPrinciples: string[]; applications: string[];
  kind: 'reading' | 'practice';
}
export interface NodeLearningContext {
  lessonKey: string; lessonTitle: string; lessonPath: string; figureId?: string;
  knowledgeId: string; question: string; principle: string; task: string;
  objects: string[]; boundary: string; primary: boolean;
  relatedPrinciples: string[]; applications: string[];
}
