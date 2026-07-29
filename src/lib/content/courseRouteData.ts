import {
  buildCourseSequence,
  buildPagePath,
  getAdjacentPages,
  type CourseNavigationEntry,
  type NavigationSection,
  type NavigationLesson,
  type NavigationPage,
} from './courseNavigation';

export function buildPageSlug(entry: CourseNavigationEntry): string {
  return `${entry.sectionId}/${entry.lessonId}/${entry.pageSlug}`;
}

export interface FilteredCourseData {
  sections: NavigationSection[];
  lessons: NavigationLesson[];
  pages: NavigationPage[];
  sequence: CourseNavigationEntry[];
}

export function isVisible(item: unknown, isDev: boolean): boolean {
  const status = (item as Record<string, unknown>).status;
  if (typeof status !== 'string') return false;
  if (status === 'archived') return false;
  if (isDev) return status === 'published' || status === 'draft';
  return status === 'published';
}

export function prepareCourseRouteData(
  sections: NavigationSection[],
  lessons: NavigationLesson[],
  pages: NavigationPage[],
  isDev: boolean,
): FilteredCourseData {
  const visibleLessons = lessons.filter((l) => isVisible(l, isDev));
  const visiblePages = pages.filter((p) => isVisible(p, isDev));
  const sequence = buildCourseSequence(sections, visibleLessons, visiblePages);
  return { sections, lessons: visibleLessons, pages: visiblePages, sequence };
}

export function getFirstPageHref(
  sections: NavigationSection[],
  lessons: NavigationLesson[],
  pages: NavigationPage[],
  isDev: boolean,
): string | null {
  const visibleLessons = lessons.filter((l) => isVisible(l, isDev));
  const visiblePages = pages.filter((p) => isVisible(p, isDev));
  const sequence = buildCourseSequence(sections, visibleLessons, visiblePages);
  const first = sequence[0];
  if (!first) return null;
  return buildPagePath(first);
}

export function buildPageRouteData(
  sequence: CourseNavigationEntry[],
  currentPageId: string,
): {
  entry: CourseNavigationEntry | null;
  previous: CourseNavigationEntry | null;
  next: CourseNavigationEntry | null;
  previousHref: string | null;
  nextHref: string | null;
} {
  const { previous, current, next } = getAdjacentPages(sequence, currentPageId);

  return {
    entry: current,
    previous,
    next,
    previousHref: previous ? buildPagePath(previous) : null,
    nextHref: next ? buildPagePath(next) : null,
  };
}
