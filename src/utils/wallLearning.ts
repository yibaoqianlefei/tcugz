import { getNodeLearningContext, learningRoute } from './curriculumLearning';
import type { NodeLearningContext } from '../types/curriculumLearning';

export type WallLearningContext = NodeLearningContext;

export function getWallLearningContext(nodeId?: string): WallLearningContext | undefined {
  return getNodeLearningContext(nodeId);
}

export function wallLearningRoute(context: WallLearningContext): string {
  return learningRoute(context);
}
