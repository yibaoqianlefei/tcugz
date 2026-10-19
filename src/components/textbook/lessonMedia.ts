import catalog from '../../data/lessonMedia.json';

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
export const lessonAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
