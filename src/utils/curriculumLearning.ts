import catalog from '../data/curriculumLearning.json';
import legacy from '../data/legacyLessonFigures.json';
import type { KnowledgeUnit, LessonLearningPlan, NodeLearningContext } from '../types/curriculumLearning';

export const curriculumLearning = catalog as unknown as {
  units: Record<string, KnowledgeUnit>;
  lessons: Record<string, LessonLearningPlan & { key: string; title: string; path: string }>;
  nodes: Record<string, { primary?: NodeLearningContext; related: NodeLearningContext[] }>;
};
export function getNodeLearningContexts(nodeId?: string) {
  if (!nodeId) return [];
  const record = curriculumLearning.nodes[nodeId];
  return record ? [record.primary, ...record.related].filter((value): value is NodeLearningContext => Boolean(value)) : [];
}
/** A valid source course takes precedence over the default primary position. */
export function getNodeLearningContext(nodeId?: string, search = ''): NodeLearningContext | undefined {
  const contexts = getNodeLearningContexts(nodeId);
  const query = new URLSearchParams(search);
  const source = query.get('lesson');
  const unit = query.get('unit');
  const oldFigure = query.get('figure');
  const mapped = source && oldFigure ? (legacy as Record<string, Record<string, { nodeId: string; knowledgeId?: string | null }>>)[source]?.[oldFigure] : undefined;
  return contexts.find(context => context.lessonPath === source && (!unit || context.knowledgeId === unit)
    && (!oldFigure || context.figureId === oldFigure || (mapped && mapped.nodeId === nodeId && (!mapped.knowledgeId || mapped.knowledgeId === context.knowledgeId))))
    ?? contexts.find(context => context.primary);
}
export function learningRoute(context: NodeLearningContext): string {
  return `/lesson/${context.lessonPath}?unit=${encodeURIComponent(context.knowledgeId)}`;
}
/** Resolve modern unit IDs and frozen pre-upgrade figure IDs to the same place. */
export function resolveLearningUnit(path: string, unitId?: string | null, figureId?: string | null) {
  const lesson = Object.values(curriculumLearning.lessons).find(item => item.path === path);
  if (!lesson) return;
  if (unitId) return lesson.units.find(unit => unit.id === unitId);
  if (!figureId) return;
  const old = (legacy as Record<string, Record<string, { nodeId: string; knowledgeId?: string | null }>>)[path]?.[figureId];
  return lesson.units.find(unit => old?.knowledgeId ? unit.id === old.knowledgeId
    : old ? unit.models.some(model => model.nodeId === old.nodeId)
      : `model-${unit.id.replace(/\./g, '-')}` === figureId)
    // A former off-topic model returns to this lesson's central question.
    // It does not recreate a now-invalid course-to-node association.
    ?? (old ? lesson.units[0] : undefined);
}
