import { deriveProgressState } from './courseProgress';
import {
  EXERCISE_APPROVED_EVENT,
  PAGE_VISITED_EVENT,
} from './progressEvents';
import {
  clearProgress,
  createInitialProgress,
  loadProgress,
  saveProgress,
  type StorageLike,
} from './progressStore';
import type { ProgressCourseGraph, ProgressState } from './types';

export interface ProgressRuntimeOptions {
  graph: ProgressCourseGraph;
  document: Document;
  eventTarget: Window;
  storage: StorageLike | null;
  currentSection?: string;
  currentLesson?: string;
  currentPage?: string;
  confirmReset?: () => boolean;
}

export interface ProgressRuntime {
  getState(): ProgressState;
  reset(): boolean;
  destroy(): void;
}

export function mountProgressRuntime(options: ProgressRuntimeOptions): ProgressRuntime {
  const {
    graph,
    document,
    eventTarget,
    storage,
    currentSection,
    currentLesson,
    currentPage,
    confirmReset = () => true,
  } = options;
  let state = loadProgress(storage);
  let resetButton: HTMLButtonElement | null = null;

  function updateUi(current: ProgressState): void {
    const completedLessons = current.completedLessons.length;
    const percentage = graph.lessons.length
      ? Math.round((completedLessons / graph.lessons.length) * 100)
      : 0;

    document.querySelectorAll<HTMLElement>('[data-progress-section]').forEach((element) => {
      const id = element.dataset.progressSection;
      const section = graph.sections.find((item) => item.id === id);
      const previous = graph.sections
        .filter((item) => item.order < (section?.order ?? 0))
        .sort((a, b) => b.order - a.order)[0];
      const label = current.completedSections.includes(id || '')
        ? 'Completada'
        : !previous || current.completedSections.includes(previous.id) ? 'Disponible' : 'Bloqueada';
      element.dataset.progressState = label.toLowerCase();
      const status = element.querySelector<HTMLElement>('[data-progress-status]');
      if (status) status.textContent = label;
    });

    document.querySelectorAll<HTMLElement>('[data-progress-lesson]').forEach((element) => {
      const id = element.dataset.progressLesson;
      const lesson = graph.lessons.find((item) => item.id === id);
      if (!lesson) return;
      const previous = graph.lessons
        .filter((item) => item.sectionId === lesson.sectionId && item.order < lesson.order)
        .sort((a, b) => b.order - a.order)[0];
      const started = lesson.requiredExerciseIds.some((exerciseId) => current.completedExerciseIds.includes(exerciseId))
        || lesson.pageIds.some((pageId) => current.completedPageIds.includes(pageId));
      const label = current.completedLessons.includes(lesson.id)
        ? 'Completada'
        : started ? 'En progreso' : !previous || current.completedLessons.includes(previous.id) ? 'Disponible' : 'Bloqueada';
      element.dataset.progressState = label.toLowerCase().replace(' ', '-');
      const status = element.querySelector<HTMLElement>('[data-progress-status]');
      if (status) status.textContent = label;
    });

    const section = graph.sections.find((item) => item.id === currentSection);
    const progressLabel = document.querySelector<HTMLElement>('[data-progress-label]');
    if (progressLabel && section) progressLabel.textContent = `Sección ${section.order} de ${graph.sections.length}`;
    const meter = document.querySelector<HTMLElement>('[data-progress-meter]');
    if (meter) meter.style.width = `${percentage}%`;
    const percent = document.querySelector<HTMLElement>('[data-progress-percent]');
    if (percent) percent.textContent = `${percentage} %`;
    const cta = document.querySelector<HTMLElement>('[data-course-cta]');
    if (cta) cta.textContent = percentage === 100
      ? 'Repasar curso básico'
      : percentage > 0 ? 'Continuar curso básico' : 'Comenzar curso básico';
    if (resetButton) resetButton.hidden = current.completedLessons.length === 0
      && current.completedExerciseIds.length === 0
      && current.completedPageIds.length === 0;
  }

  function commit(nextState: ProgressState, persist = true): void {
    state = deriveProgressState(nextState, graph);
    if (persist) saveProgress(state, storage);
    updateUi(state);
  }

  if (currentSection) state.currentSection = currentSection;
  if (currentLesson) state.currentLesson = currentLesson;
  if (currentPage && !state.completedPageIds.includes(currentPage)) {
    state.completedPageIds = [...state.completedPageIds, currentPage];
  }

  resetButton = document.querySelector<HTMLButtonElement>('[data-progress-reset]');
  commit(state);

  const notice = document.querySelector<HTMLElement>('[data-progress-notice]');
  const noticeDismiss = document.querySelector<HTMLButtonElement>('[data-progress-notice-dismiss]');
  if (!state.initialNoticeAcknowledged) notice?.removeAttribute('hidden');
  const dismissNotice = () => {
    notice?.setAttribute('hidden', '');
    commit({ ...state, initialNoticeAcknowledged: true });
  };
  noticeDismiss?.addEventListener('click', dismissNotice);

  const reset = () => {
    if (!confirmReset()) return false;
    clearProgress(storage);
    state = createInitialProgress();
    updateUi(state);
    notice?.removeAttribute('hidden');
    return true;
  };
  resetButton?.addEventListener('click', reset);

  const approveExercise = (event: Event) => {
    const exerciseId = (event as CustomEvent<{ exerciseId?: string }>).detail?.exerciseId;
    if (!exerciseId || state.completedExerciseIds.includes(exerciseId)) return;
    commit({ ...state, completedExerciseIds: [...state.completedExerciseIds, exerciseId] });
  };
  const visitPage = (event: Event) => {
    const pageId = (event as CustomEvent<{ pageId?: string }>).detail?.pageId;
    if (!pageId || state.completedPageIds.includes(pageId)) return;
    commit({ ...state, completedPageIds: [...state.completedPageIds, pageId] });
  };
  eventTarget.addEventListener(EXERCISE_APPROVED_EVENT, approveExercise);
  eventTarget.addEventListener(PAGE_VISITED_EVENT, visitPage);

  return {
    getState: () => state,
    reset,
    destroy: () => {
      noticeDismiss?.removeEventListener('click', dismissNotice);
      resetButton?.removeEventListener('click', reset);
      eventTarget.removeEventListener(EXERCISE_APPROVED_EVENT, approveExercise);
      eventTarget.removeEventListener(PAGE_VISITED_EVENT, visitPage);
    },
  };
}
