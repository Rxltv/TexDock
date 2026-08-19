import {
  deriveProgressState,
  getResumePage,
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

  type NavigationState = 'blocked' | 'available' | 'completed';

  function getNavigationState(link: HTMLAnchorElement, current: ProgressState): NavigationState {
    const sectionId = link.dataset.progressTargetSection;
    const lessonId = link.dataset.progressTargetLesson;
    const pageId = link.dataset.progressTargetPage;
    const available = !canPersist || isProgressRouteAvailable({ sectionId, lessonId, pageId }, current, graph);
    if (!available) return 'blocked';
    if (pageId) return current.completedPageIds.includes(pageId) ? 'completed' : 'available';
    if (lessonId && current.completedLessons.includes(lessonId)) return 'completed';
    if (sectionId && current.completedSections.includes(sectionId)) return 'completed';
    return 'available';
  }

  function setLinkAvailability(
    link: HTMLAnchorElement,
    stateOrAvailable: NavigationState | boolean,
  ): void {
    const navigationState: NavigationState = typeof stateOrAvailable === 'boolean'
      ? stateOrAvailable ? 'available' : 'blocked'
      : stateOrAvailable;
    const available = navigationState !== 'blocked';
    const href = link.dataset.progressHref;
    link.dataset.progressState = navigationState;
    link.classList.toggle('nav-link--available', navigationState === 'available');
    link.classList.toggle('nav-link--completed', navigationState === 'completed');
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
    link.classList.remove('nav-link--available', 'nav-link--completed');
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
      setLinkAvailability(link, getNavigationState(link, current));
    });

    const section = graph.sections.find((item) => item.id === currentSection);
    const progressLabel = document.querySelector<HTMLElement>('[data-progress-label]');
    if (progressLabel && section) progressLabel.textContent = `Sección ${section.order} de ${graph.sections.length}`;
    const meter = document.querySelector<HTMLElement>('[data-progress-meter]');
    if (meter) meter.style.width = `${percentage}%`;
    const percent = document.querySelector<HTMLElement>('[data-progress-percent]');
    if (percent) percent.textContent = `${percentage} %`;
    const cta = document.querySelector<HTMLElement>('[data-course-cta]');
    if (cta) {
      const resumePage = canPersist ? getResumePage(current, graph) : null;
      const startHref = cta.dataset.courseStartHref;
      if (resumePage?.href) {
        cta.setAttribute('href', resumePage.href);
        cta.textContent = percentage === 100
          ? 'Repasar curso básico'
          : 'Continuar donde te quedaste';
      } else {
        if (startHref) cta.setAttribute('href', startHref);
        cta.textContent = percentage === 100 ? 'Repasar curso básico' : 'Comenzar curso básico';
      }
    }
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
  if (currentPage) state.currentPage = currentPage;
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

  const navigationLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('[data-progress-navigation]'),
  );
  const preventBlockedNavigation = (event: Event) => {
    const link = event.currentTarget as HTMLAnchorElement;
    if (link.classList.contains('nav-link--disabled')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };
  navigationLinks.forEach((link) => {
    link.addEventListener('click', preventBlockedNavigation);
    link.addEventListener('keydown', preventBlockedNavigation);
  });
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
    const detail = (event as CustomEvent<{
      pageId?: string;
      sectionId?: string;
      lessonId?: string;
    }>).detail;
    const pageId = detail?.pageId;
    if (!pageId || state.completedPageIds.includes(pageId)) return;
    const page = graph.pages.find((item) => item.id === pageId);
    const lesson = page ? graph.lessons.find((item) => item.id === page.lessonId) : undefined;
    if (!isProgressRouteAvailable({
      sectionId: detail.sectionId ?? lesson?.sectionId,
      lessonId: detail.lessonId ?? lesson?.id,
      pageId,
    }, state, graph)) return;
    commit({
      ...state,
      currentPage: pageId,
      completedPageIds: [...state.completedPageIds, pageId],
    });
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
      navigationLinks.forEach((link) => {
        link.removeEventListener('click', preventBlockedNavigation);
        link.removeEventListener('keydown', preventBlockedNavigation);
      });
      eventTarget.removeEventListener(EXERCISE_APPROVED_EVENT, approveExercise);
      eventTarget.removeEventListener(PAGE_VISITED_EVENT, visitPage);
    },
  };
}
