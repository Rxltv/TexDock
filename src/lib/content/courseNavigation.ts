export interface NavigationSection {
  id: string;
  order: number;
}

export interface NavigationLesson {
  id: string;
  sectionId: string;
  order: number;
  title?: string;
}

export interface NavigationPage {
  id: string;
  lessonId: string;
  slug: string;
  order: number;
  title?: string;
}

export interface CourseNavigationEntry {
  sectionId: string;
  lessonId: string;
  pageId: string;
  pageSlug: string;
  sectionOrder: number;
  lessonOrder: number;
  pageOrder: number;
  pageIndexInLesson: number;
  totalPagesInLesson: number;
}

export interface AdjacentResult {
  previous: CourseNavigationEntry | null;
  current: CourseNavigationEntry | null;
  next: CourseNavigationEntry | null;
}

function sorted<T>(items: T[], by: (item: T) => number): T[] {
  return [...items].sort((a, b) => by(a) - by(b));
}

function getSectionIds(sections: NavigationSection[]): Set<string> {
  return new Set(sections.map((s) => s.id));
}

function getLessonIds(lessons: NavigationLesson[]): Set<string> {
  return new Set(lessons.map((l) => l.id));
}

export function buildCourseSequence(
  sections: NavigationSection[],
  lessons: NavigationLesson[],
  pages: NavigationPage[],
): CourseNavigationEntry[] {
  const knownSections = getSectionIds(sections);
  const knownLessons = getLessonIds(lessons);

  for (const lesson of lessons) {
    if (!knownSections.has(lesson.sectionId)) {
      throw new Error(
        `La lección "${lesson.id}" referencia la sección "${lesson.sectionId}", pero no existe ninguna sección con ese id.`,
      );
    }
  }

  for (const page of pages) {
    if (!knownLessons.has(page.lessonId)) {
      throw new Error(
        `La página "${page.id}" referencia la lección "${page.lessonId}", pero no existe ninguna lección con ese id.`,
      );
    }
  }

  const orderedSections = sorted(sections, (s) => s.order);
  const result: CourseNavigationEntry[] = [];

  for (const section of orderedSections) {
    const sectionLessons = sorted(
      lessons.filter((l) => l.sectionId === section.id),
      (l) => l.order,
    );

    for (const lesson of sectionLessons) {
      const lessonPages = sorted(
        pages.filter((p) => p.lessonId === lesson.id),
        (p) => p.order,
      );
      const totalPages = lessonPages.length;

      for (let i = 0; i < lessonPages.length; i++) {
        const page = lessonPages[i];
        result.push({
          sectionId: section.id,
          lessonId: lesson.id,
          pageId: page.id,
          pageSlug: page.slug,
          sectionOrder: section.order,
          lessonOrder: lesson.order,
          pageOrder: page.order,
          pageIndexInLesson: i,
          totalPagesInLesson: totalPages,
        });
      }
    }
  }

  return result;
}

export function getAdjacentPages(
  sequence: CourseNavigationEntry[],
  currentPageId: string,
): AdjacentResult {
  const idx = sequence.findIndex((e) => e.pageId === currentPageId);

  if (idx === -1) {
    return { previous: null, current: null, next: null };
  }

  return {
    previous: idx > 0 ? sequence[idx - 1] : null,
    current: sequence[idx],
    next: idx < sequence.length - 1 ? sequence[idx + 1] : null,
  };
}

export function getFirstPageOfLesson(
  sequence: CourseNavigationEntry[],
  lessonId: string,
): CourseNavigationEntry | null {
  return sequence.find((e) => e.lessonId === lessonId) || null;
}

export function getFirstPageOfSection(
  sequence: CourseNavigationEntry[],
  sectionId: string,
): CourseNavigationEntry | null {
  return sequence.find((e) => e.sectionId === sectionId) || null;
}

export function buildPagePath(
  sectionId: string,
  lessonId: string,
  pageSlug: string,
): string;
export function buildPagePath(entry: CourseNavigationEntry): string;
export function buildPagePath(
  sectionIdOrEntry: string | CourseNavigationEntry,
  lessonId?: string,
  pageSlug?: string,
): string {
  if (typeof sectionIdOrEntry === 'object') {
    return `/aprender/${sectionIdOrEntry.sectionId}/${sectionIdOrEntry.lessonId}/${sectionIdOrEntry.pageSlug}/`;
  }
  return `/aprender/${sectionIdOrEntry}/${lessonId}/${pageSlug}/`;
}
