export interface ProgressState {
  currentSection: string | null;
  currentLesson: string | null;
  completedExercises: string[];
  completedLessons: string[];
  completedSections: string[];
  storageVersion: number;
  updatedAt: string;
  initialNoticeAcknowledged: boolean;
}

export type SectionState = 'locked' | 'unlocked' | 'completed';
