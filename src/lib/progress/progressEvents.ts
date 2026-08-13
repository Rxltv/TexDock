import type { ProgressState } from './types';

export const PROGRESS_UPDATED_EVENT = 'texdock:progress-updated';
export const EXERCISE_APPROVED_EVENT = 'texdock:exercise-approved';
export const PAGE_VISITED_EVENT = 'texdock:page-visited';

export interface ExerciseApprovedDetail {
  exerciseId: string;
}

export interface PageVisitedDetail {
  pageId: string;
  sectionId: string;
  lessonId: string;
}

export function emitProgressUpdated(state: ProgressState): void {
  window.dispatchEvent(new CustomEvent(PROGRESS_UPDATED_EVENT, { detail: state }));
}

export function emitExerciseApproved(exerciseId: string): void {
  window.dispatchEvent(new CustomEvent<ExerciseApprovedDetail>(EXERCISE_APPROVED_EVENT, {
    detail: { exerciseId },
  }));
}

export function emitPageVisited(detail: PageVisitedDetail): void {
  window.dispatchEvent(new CustomEvent<PageVisitedDetail>(PAGE_VISITED_EVENT, { detail }));
}
