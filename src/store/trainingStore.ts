import { create } from 'zustand';
import { TRAINING_BANK_VERSION, trainingQuestions, type TrainingAnswer, type TrainingQuestion } from '../data/training';
import { evaluateTrainingAnswer, initialTrainingAnswer, isAnswerComplete, type TrainingResult } from '../utils/trainingEvaluation';

export const TRAINING_STORAGE_KEY = 'construction-training-v1';
export interface TrainingDraft { answer: TrainingAnswer; submitted: boolean; hinted: boolean; result?: TrainingResult; }
export interface TrainingRecord { attempts: number; solved: boolean; firstCorrect: boolean; hadMistake: boolean; lastCorrect: boolean; reviewedAt: number; }
interface Progress { drafts: Record<string, TrainingDraft>; records: Record<string, TrainingRecord>; current: Record<string, string>; }
interface TrainingState {
  progress: Progress;
  storageAvailable: boolean;
  updateAnswer: (question: TrainingQuestion, answer: TrainingAnswer) => void;
  showHint: (question: TrainingQuestion) => void;
  submit: (question: TrainingQuestion) => void;
  retry: (question: TrainingQuestion) => void;
  setCurrent: (mode: string, questionId: string) => void;
}
const empty = (): Progress => ({ drafts: {}, records: {}, current: {} });
export function freshTrainingDraft(question: TrainingQuestion): TrainingDraft { return { answer: initialTrainingAnswer(question), submitted: false, hinted: false }; }
function readProgress(): { progress: Progress; storageAvailable: boolean } {
  try {
    if (typeof localStorage === 'undefined') return { progress: empty(), storageAvailable: false };
    const raw = localStorage.getItem(TRAINING_STORAGE_KEY);
    if (!raw) return { progress: empty(), storageAvailable: true };
    const data = JSON.parse(raw);
    if (data.version !== TRAINING_BANK_VERSION) return { progress: empty(), storageAvailable: true };
    const progress = empty();
    for (const question of trainingQuestions) {
      const draft = data.progress?.drafts?.[question.id];
      if (draft && Array.isArray(draft.answer?.order) && draft.answer.order.every((id: unknown) => typeof id === 'string') && draft.answer.pairs && typeof draft.answer.pairs === 'object' && !Array.isArray(draft.answer.pairs) && draft.answer.placements && typeof draft.answer.placements === 'object' && !Array.isArray(draft.answer.placements)) {
        const partIds = question.parts.map(part => part.id);
        const choiceIds = (question.choices ?? question.parts).map(choice => choice.id);
        const answer: TrainingAnswer = {
          selection: choiceIds.includes(draft.answer.selection) ? draft.answer.selection : undefined,
          reason: question.reasons?.some(reason => reason.id === draft.answer.reason) ? draft.answer.reason : undefined,
          order: [...new Set<string>(draft.answer.order.filter((id: string) => partIds.includes(id)))],
          pairs: Object.fromEntries(Object.entries(draft.answer.pairs).filter(([id, value]) => partIds.includes(id) && question.choices?.some(choice => choice.id === value))) as Record<string, string>,
          placements: Object.fromEntries(Object.entries(draft.answer.placements).filter(([id, value]) => question.slots?.some(slot => slot.id === id) && partIds.includes(value as string))) as Record<string, string>,
        };
        const submitted = draft.submitted === true && isAnswerComplete(question, answer);
        progress.drafts[question.id] = { answer, submitted, hinted: draft.hinted === true, result: submitted ? evaluateTrainingAnswer(question, answer) : undefined };
      }
      const record = data.progress?.records?.[question.id];
      if (record && Number.isInteger(record.attempts) && record.attempts > 0) progress.records[question.id] = { attempts: record.attempts, solved: record.solved === true, firstCorrect: record.firstCorrect === true, hadMistake: record.hadMistake === true, lastCorrect: record.lastCorrect === true, reviewedAt: Number.isFinite(record.reviewedAt) ? record.reviewedAt : 0 };
    }
    for (const [mode, id] of Object.entries(data.progress?.current ?? {})) if (trainingQuestions.some(question => question.mode === mode && question.id === id)) progress.current[mode] = id as string;
    return { progress, storageAvailable: true };
  } catch { return { progress: empty(), storageAvailable: false }; }
}

export const useTrainingStore = create<TrainingState>((set, get) => {
  const commit = (progress: Progress) => {
    let storageAvailable = true;
    try { localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify({ version: TRAINING_BANK_VERSION, progress })); } catch { storageAvailable = false; }
    set({ progress, storageAvailable });
  };
  const updateDraft = (question: TrainingQuestion, update: (draft: TrainingDraft) => TrainingDraft) => {
    const progress = get().progress;
    commit({ ...progress, drafts: { ...progress.drafts, [question.id]: update(progress.drafts[question.id] ?? freshTrainingDraft(question)) }, current: { ...progress.current, [question.mode]: question.id } });
  };
  return {
    ...readProgress(),
    updateAnswer: (question, answer) => updateDraft(question, draft => draft.submitted ? draft : { ...draft, answer }),
    showHint: question => updateDraft(question, draft => ({ ...draft, hinted: true })),
    // A hint already seen cannot become an independent first attempt by retrying.
    retry: question => updateDraft(question, draft => ({ ...freshTrainingDraft(question), hinted: draft.hinted })),
    setCurrent: (mode, questionId) => {
      if (!trainingQuestions.some(question => question.mode === mode && question.id === questionId)) return;
      const progress = get().progress;
      commit({ ...progress, current: { ...progress.current, [mode]: questionId } });
    },
    submit: question => {
      const progress = get().progress;
      const draft = progress.drafts[question.id] ?? freshTrainingDraft(question);
      if (draft.submitted || !isAnswerComplete(question, draft.answer)) return;
      const result = evaluateTrainingAnswer(question, draft.answer);
      const previous = progress.records[question.id];
      const record: TrainingRecord = { attempts: (previous?.attempts ?? 0) + 1, solved: Boolean(previous?.solved || result.correct), firstCorrect: previous?.firstCorrect ?? (result.correct && !draft.hinted), hadMistake: Boolean(previous?.hadMistake || !result.correct), lastCorrect: result.correct, reviewedAt: Date.now() };
      commit({ ...progress, drafts: { ...progress.drafts, [question.id]: { ...draft, submitted: true, result } }, records: { ...progress.records, [question.id]: record }, current: { ...progress.current, [question.mode]: question.id } });
    },
  };
});
