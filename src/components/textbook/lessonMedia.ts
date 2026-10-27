import catalog from '../../data/lessonMedia.json';
import { lessonModelGuidance } from '../../../scripts/lib/lesson-model-guidance.mjs';

export interface LessonFigure {
  id: string;
  number: string;
  nodeId: string;
  nodeTitle: string;
  title: string;
  caption: string;
  focus: string[];
  imageAlt: string;
  image: string;
  hasModel: boolean;
  sectionId: string;
  sectionTitle: string;
  layerCount: number;
  initialZoom?: number;
}

export interface LessonMedia {
  key: string;
  title: string;
  path: string;
  intro: string;
  readingMinutes: number;
  figures: LessonFigure[];
}

export const lessonMedia = catalog as Record<string, LessonMedia>;

// Keep the frozen drawing/model audit intact; the model-only presentation has
// its own reviewed observation text and uses exactly the same node bindings.
export function modelLessonMedia(lesson: LessonMedia): LessonMedia {
  const plans: Record<string, { intro: string; figures: Array<{ nodeId: string; title?: string; caption: string; focus: string[]; initialZoom?: number }> }> = lessonModelGuidance;
  const guidance = plans[lesson.key];
  return { ...lesson, intro: guidance.intro, figures: lesson.figures.map((figure, index) => ({ ...figure, ...guidance.figures[index] })) };
}
