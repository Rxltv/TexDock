export interface ProgressState {
  currentSection: string | null;
  currentLesson: string | null;
  completedExerciseIds: string[];
  completedPageIds: string[];
  completedLessons: string[];
  completedSections: string[];
  schemaVersion: number;
  updatedAt: string;
  initialNoticeAcknowledged: boolean;
}

export type SectionState = 'locked' | 'unlocked' | 'completed';
export type LessonState = 'locked' | 'unlocked' | 'completed';

export interface ProgressPage {
  id: string;
  lessonId: string;
  order: number;
}

export interface ProgressLesson {
  id: string;
  sectionId: string;
  order: number;
  pageIds: string[];
  requiredExerciseIds: string[];
}

export interface ProgressSection {
  id: string;
  order: number;
  lessonIds: string[];
}

export interface ProgressCourseGraph {
  sections: ProgressSection[];
  lessons: ProgressLesson[];
  pages: ProgressPage[];
  exerciseIds: string[];
}
