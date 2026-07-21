import { buildCourseSequence, getFirstPageOfLesson, getFirstPageOfSection, buildPagePath } from './courseNavigation';
import type { NavigationLesson, NavigationPage } from './courseNavigation';

export interface SidebarSectionInput {
  id: string;
  title: string;
  order: number;
}

export interface SidebarSectionItem {
  id: string;
  title: string;
  order: number;
  href: string | null;
  hasVisiblePages: boolean;
}

export interface SidebarLessonItem {
  id: string;
  title: string;
  href: string | null;
}

export interface SidebarData {
  sections: SidebarSectionItem[];
  lessonsBySection: Record<string, SidebarLessonItem[]>;
  currentSectionId: string | null;
  currentLessonId: string | null;
}

export function buildSidebarData(
  sections: SidebarSectionInput[],
  lessons: NavigationLesson[],
  pages: NavigationPage[],
  currentSectionId: string | null,
  currentLessonId: string | null,
): SidebarData {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const navSections = sortedSections.map((s) => ({ id: s.id, order: s.order }));
  const sequence = buildCourseSequence(navSections, lessons, pages);

  const sectionsWithHref = sortedSections.map((s) => {
    const firstPage = getFirstPageOfSection(sequence, s.id);
    return {
      ...s,
      href: firstPage ? buildPagePath(firstPage) : null,
      hasVisiblePages: firstPage !== null,
    };
  });

  const lessonsBySection: Record<string, SidebarLessonItem[]> = {};

  for (const section of sectionsWithHref) {
    const sectionLessons = lessons
      .filter((l) => l.sectionId === section.id)
      .sort((a, b) => a.order - b.order);

    lessonsBySection[section.id] = sectionLessons.map((l) => {
      const firstPage = getFirstPageOfLesson(sequence, l.id);
      return {
        id: l.id,
        title: l.title || '',
        href: firstPage ? buildPagePath(firstPage) : null,
      };
    });
  }

  return {
    sections: sectionsWithHref,
    lessonsBySection,
    currentSectionId,
    currentLessonId,
  };
}
