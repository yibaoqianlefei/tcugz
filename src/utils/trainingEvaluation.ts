import type { TrainingAnswer, TrainingQuestion } from '../data/training';

export interface TrainingResult { correct: boolean; matched: number; total: number; }
export function initialTrainingAnswer(question: TrainingQuestion): TrainingAnswer {
  const ids = question.parts.map(part => part.id);
  return { order: question.mode === 'order' ? [...ids.slice(1), ids[0]].filter(Boolean) : [], pairs: {}, placements: { ...question.startingPlacements } };
}
const exactIds = (actual: string[], expected: string[]) => actual.length === expected.length && new Set(actual).size === expected.length && actual.every(id => expected.includes(id));
export function isAnswerComplete(question: TrainingQuestion, answer: TrainingAnswer): boolean {
  if (question.mode === 'match') return exactIds(Object.keys(answer.pairs), question.parts.map(part => part.id)) && Object.values(answer.pairs).every(id => question.choices?.some(choice => choice.id === id));
  if (question.mode === 'order' || question.mode === 'path') return exactIds(answer.order, question.parts.map(part => part.id));
  if (question.mode === 'assemble') return exactIds(Object.keys(answer.placements), question.slots?.map(slot => slot.id) ?? []) && exactIds(Object.values(answer.placements), question.parts.map(part => part.id));
  if (question.reasons && !question.reasons.some(reason => reason.id === answer.reason)) return false;
  return Boolean(answer.selection && (question.choices ?? question.parts).some(choice => choice.id === answer.selection));
}
export function evaluateTrainingAnswer(question: TrainingQuestion, answer: TrainingAnswer): TrainingResult {
  let matched: number;
  let total: number;
  if (question.answer.order) {
    total = question.answer.order.length;
    matched = question.answer.order.filter((id, index) => answer.order[index] === id).length;
  } else if (question.answer.pairs || question.answer.placements) {
    const expected = question.answer.pairs ?? question.answer.placements!;
    const actual = question.answer.pairs ? answer.pairs : answer.placements;
    total = Object.keys(expected).length;
    matched = Object.entries(expected).filter(([key, value]) => actual[key] === value).length;
  } else {
    total = question.answer.reason ? 2 : 1;
    matched = Number(answer.selection === question.answer.selection) + (question.answer.reason ? Number(answer.reason === question.answer.reason) : 0);
  }
  return { correct: isAnswerComplete(question, answer) && matched === total, matched, total };
}
export function placeTrainingPart(placements: Record<string, string>, slot: string, part: string): Record<string, string> {
  return { ...Object.fromEntries(Object.entries(placements).filter(([key, value]) => key !== slot && value !== part)), [slot]: part };
}
export function moveTrainingItem(order: string[], index: number, offset: number): string[] {
  const target = index + offset;
  if (index < 0 || index >= order.length || target < 0 || target >= order.length) return order;
  const result = [...order];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}
