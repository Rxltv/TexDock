import {
  deriveProgressState,
  getLessonState,
  getSectionState,
  isProgressRouteAvailable,
} from './courseProgress';
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
  redirectHref?: string;
  navigate?: (href: string) => void;
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
    redirectHref = '/aprender/',
    navigate = (href) => eventTarget.location.assign(href),
    confirmReset = () => true,
  } = options;
  let state = deriveProgressState(loadProgress(storage), graph);
  const canPersist = storage !== null;
  let resetButton: HTMLButtonElement | null = null;
  const courseContent = document.querySelector<HTMLElement>('[data-course-content]');
  const currentRoute = {
    sectionId: currentSection,
    lessonId: currentLesson,
    pageId: currentPage,
  };

  if (canPersist && !isProgressRouteAvailable(currentRoute, state, graph)) {
    navigate(redirectHref);
    return {
      getState: () => state,
      reset: () => false,
      destroy: () => {},
    };
  }

  function setLinkAvailability(link: HTMLAnchorElement, available: boolean): void {
    const href = link.dataset.progressHref;
    if (available && href) {
      link.href = href;
      link.removeAttribute('aria-disabled');
      link.removeAttribute('tabindex');
      link.classList.remove('nav-link--disabled');
      return;
    }
    link.removeAttribute('href');
    link.setAttribute('aria-disabled', 'true');
    link.tabIndex = -1;
    link.classList.add('nav-link--disabled');
  }

  function updateUi(current: ProgressState): void {
    const completedLessons = current.completedLessons.length;
    const percentage = graph.lessons.length
      ? Math.round((completedLessons / graph.lessons.length) * 100)
      : 0;

    document.querySelectorAll<HTMLElement>('[data-progress-section]').forEach((element) => {
      const id = element.dataset.progressSection;
      if (!id) return;
      const sectionState = canPersist ? getSectionState(id, current, graph) : 'unlocked';
      const toggle = element.querySelector<HTMLButtonElement>('[data-progress-section-toggle]');
      const panel = element.querySelector<HTMLElement>('[data-progress-section-panel]');
      element.dataset.progressState = sectionState;
      if (!toggle) return;

      const locked = sectionState === 'locked';
      toggle.disabled = locked || !panel;
      if (toggle.disabled) toggle.setAttribute('aria-disabled', 'true');
      else toggle.removeAttribute('aria-disabled');

      if (locked || (courseContent?.hasAttribute('hidden') && currentSection && id !== currentSection)) {
        toggle.setAttribute('aria-expanded', 'false');
        if (panel) panel.hidden = true;
      } else if (courseContent?.hasAttribute('hidden') && id === currentSection) {
        toggle.setAttribute('aria-expanded', 'true');
        if (panel) panel.hidden = false;
      }
    });

    document.querySelectorAll<HTMLElement>('[data-progress-lesson]').forEach((element) => {
      const id = element.dataset.progressLesson;
      if (!id) return;
      const lessonState = canPersist ? getLessonState(id, current, graph) : 'unlocked';
      const link = element.querySelector<HTMLAnchorElement>('.subsection-link');
      element.dataset.progressState = lessonState;
      if (link) setLinkAvailability(link, lessonState !== 'locked');
    });

    document.querySelectorAll<HTMLAnchorElement>('[data-progress-navigation]').forEach((link) => {
      const sectionId = link.dataset.progressTargetSection;
      const lessonId = link.dataset.progressTargetLesson;
      const pageId = link.dataset.progressTargetPage;
      setLinkAvailability(
        link,
        !canPersist || isProgressRouteAvailable({ sectionId, lessonId, pageId }, current, graph),
      );
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

  const sectionToggles = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[data-progress-section-toggle]'),
  );
  const toggleSection = (event: Event) => {
    const toggle = event.currentTarget as HTMLButtonElement;
    if (toggle.disabled) return;
    const panelId = toggle.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    if (panel) panel.hidden = expanded;
  };
  sectionToggles.forEach((toggle) => toggle.addEventListener('click', toggleSection));

  commit(state);
  courseContent?.removeAttribute('hidden');
  courseContent?.removeAttribute('inert');
  courseContent?.removeAttribute('aria-busy');

  const notice = document.querySelector<HTMLElement>('[data-progress-notice]');
  const noticeText = document.querySelector<HTMLElement>('[data-progress-notice-text]');
  const noticeDismiss = document.querySelector<HTMLButtonElement>('[data-progress-notice-dismiss]');
  if (!canPersist && noticeText) {
    noticeText.textContent = 'El almacenamiento del navegador no está disponible. Puedes navegar por el curso, pero el progreso no se guardará.';
  }
  if (!state.initialNoticeAcknowledged) notice?.removeAttribute('hidden');
  const dismissNotice = () => {
    notice?.setAttribute('hidden', '');
    commit({ ...state, initialNoticeAcknowledged: true });
  };
  noticeDismiss?.addEventListener('click', dismissNotice);

  const reset = () => {
    if (!confirmReset()) return false;
    clearProgress(storage);
    state = deriveProgressState(createInitialProgress(), graph);
    if (canPersist && !isProgressRouteAvailable(currentRoute, state, graph)) {
      courseContent?.setAttribute('hidden', '');
      courseContent?.setAttribute('inert', '');
      courseContent?.setAttribute('aria-busy', 'true');
      navigate(redirectHref);
      return true;
    }
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
      sectionToggles.forEach((toggle) => toggle.removeEventListener('click', toggleSection));
      eventTarget.removeEventListener(EXERCISE_APPROVED_EVENT, approveExercise);
      eventTarget.removeEventListener(PAGE_VISITED_EVENT, visitPage);
    },
  };
}
