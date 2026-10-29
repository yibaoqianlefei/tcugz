import catalog from '../data/lessonMedia.json';
import { getNodeLearningContexts, resolveLearningUnit } from './curriculumLearning';

const lessons = Object.values(catalog);

export interface LessonVisit {
  path: string;
  scrollTop: number;
  viewportWidth: number;
  directoryOpen: boolean;
  figureId?: string;
  unitId?: string;
  openDetails?: number[];
}

const visits = new Map<string, LessonVisit>();

export function validLessonVisit(value: unknown, path: string): LessonVisit | undefined {
  if (!value || typeof value !== 'object') return;
  const visit = value as LessonVisit;
  if (visit.path !== path || !Number.isFinite(visit.scrollTop) || visit.scrollTop < 0
    || !Number.isFinite(visit.viewportWidth) || visit.viewportWidth <= 0 || typeof visit.directoryOpen !== 'boolean'
    || (visit.openDetails !== undefined && (!Array.isArray(visit.openDetails) || !visit.openDetails.every(index => Number.isInteger(index) && index >= 0)))) return;
  return visit;
}

/** Save each history entry separately, so repeated visits never overwrite one another. */
export function rememberLessonVisit(key: string, visit: LessonVisit) {
  visits.set(key, visit);
  try { sessionStorage.setItem(`lesson-visit:${key}`, JSON.stringify(visit)); } catch { /* In-memory history still works. */ }
}

export function recalledLessonVisit(key: string, path: string) {
  let visit: unknown = visits.get(key);
  if (!visit) {
    try { visit = JSON.parse(sessionStorage.getItem(`lesson-visit:${key}`) ?? 'null'); } catch { /* Storage is optional. */ }
  }
  return validLessonVisit(visit, path);
}

export function lessonNodeRoute(nodeId: string, path: string, figureId?: string, unitId?: string) {
  const query = new URLSearchParams({ lesson: path });
  if (figureId) query.set('figure', figureId);
  if (unitId) query.set('unit', unitId);
  return `/node/${nodeId}?${query}`;
}

/** Only an existing textbook chapter and its audited node binding can be a model return target. */
export function nodeReturnTarget(pathname: string, search: string, state?: unknown): { to: string; label: string; state?: unknown } {
  const routeState = state as { lessonVisit?: unknown; libraryReturnTo?: unknown } | null;
  const query = new URLSearchParams(search);
  const lesson = lessons.find(item => item.path === query.get('lesson'));
  const figureId = query.get('figure');
  const nodeId = pathname.match(/^\/node\/([^/]+)$/)?.[1];
  const figure = lesson?.figures.find(item => item.id === figureId && item.nodeId === nodeId);
  const unit = lesson ? resolveLearningUnit(lesson.path, query.get('unit'), figureId) : undefined;
  const contexts = getNodeLearningContexts(nodeId).filter(context => context.lessonPath === lesson?.path);
  const association = contexts.find(context => (!query.get('unit') || context.knowledgeId === query.get('unit'))
    && (!figureId || figure || context.knowledgeId === unit?.id));
  if (lesson && association) {
    const visit = validLessonVisit(routeState?.lessonVisit, lesson.path);
    return {
      to: `/lesson/${lesson.path}?unit=${encodeURIComponent(association.knowledgeId)}`,
      label: '返回教材章节',
      state: visit ? { lessonRestore: visit } : undefined,
    };
  }
  const library = routeState?.libraryReturnTo;
  return {
    to: typeof library === 'string' && /^\/library(?:\?|$)/.test(library) ? library : '/library',
    label: '返回构造节点',
  };
}
