import type {
  LessonState,
  ProgressCourseGraph,
  ProgressState,
  SectionState,
} from './types';

interface GraphSectionInput { id: string; order: number }
interface GraphLessonInput { id: string; sectionId: string; order: number }
interface GraphPageInput { id: string; lessonId: string; order: number }
interface GraphExerciseInput { id: string; pageId: string; required: boolean }

export function buildProgressGraph(
  sections: GraphSectionInput[],
  lessons: GraphLessonInput[],
  pages: GraphPageInput[],
  exercises: GraphExerciseInput[],
): ProgressCourseGraph {
  const orderedLessons = [...lessons].sort((a, b) => a.order - b.order);
  const orderedPages = [...pages].sort((a, b) => a.order - b.order);
  return {
    sections: [...sections]
      .sort((a, b) => a.order - b.order)
      .map((section) => ({
        id: section.id,
        order: section.order,
        lessonIds: orderedLessons
          .filter((lesson) => lesson.sectionId === section.id)
          .map((lesson) => lesson.id),
      })),
    lessons: orderedLessons.map((lesson) => {
      const lessonPages = orderedPages.filter((page) => page.lessonId === lesson.id);
      const pageIds = lessonPages.map((page) => page.id);
      return {
        id: lesson.id,
        sectionId: lesson.sectionId,
        order: lesson.order,
        pageIds,
        requiredExerciseIds: exercises
          .filter((exercise) => exercise.required && pageIds.includes(exercise.pageId))
          .map((exercise) => exercise.id),
      };
    }),
    pages: orderedPages.map((page) => ({
      id: page.id,
      lessonId: page.lessonId,
      order: page.order,
    })),
    exerciseIds: exercises.map((exercise) => exercise.id),
  };
}

function includesAll(values: string[], required: string[]): boolean {
  return required.every((value) => values.includes(value));
}

export function deriveProgressState(
  state: ProgressState,
  graph: ProgressCourseGraph,
): ProgressState {
  const exerciseIds = new Set(graph.exerciseIds);
  const pageIds = new Set(graph.pages.map((page) => page.id));
  const completedExercises = state.completedExerciseIds.filter((id) => exerciseIds.has(id));
  const completedPages = state.completedPageIds.filter((id) => pageIds.has(id));
  const completedLessons = graph.lessons
    .filter((lesson) => {
      const exercisesComplete = includesAll(completedExercises, lesson.requiredExerciseIds);
      const pagesComplete = lesson.requiredExerciseIds.length === 0
        ? lesson.pageIds.length > 0 && includesAll(completedPages, lesson.pageIds.slice(-1))
        : true;
      return exercisesComplete && pagesComplete;
    })
    .map((lesson) => lesson.id);

  const completedSections = graph.sections
    .filter((section) => includesAll(completedLessons, section.lessonIds))
    .map((section) => section.id);

  return {
    ...state,
    completedExerciseIds: completedExercises,
    completedPageIds: completedPages,
    completedLessons,
    completedSections,
  };
}

export function getLessonState(
  lessonId: string,
  state: ProgressState,
  graph: ProgressCourseGraph,
): LessonState {
  if (state.completedLessons.includes(lessonId)) return 'completed';
  const lesson = graph.lessons.find((item) => item.id === lessonId);
  if (!lesson) return 'locked';
  const previous = graph.lessons
    .filter((item) => item.sectionId === lesson.sectionId)
    .sort((a, b) => a.order - b.order)
    .find((item) => item.order < lesson.order);
  return !previous || state.completedLessons.includes(previous.id) ? 'unlocked' : 'locked';
}

export function getSectionState(
  sectionId: string,
  state: ProgressState,
  graph: ProgressCourseGraph,
): SectionState {
  if (state.completedSections.includes(sectionId)) return 'completed';
  const section = graph.sections.find((item) => item.id === sectionId);
  if (!section) return 'locked';
  const previous = graph.sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .find((item) => item.order < section.order);
  return !previous || state.completedSections.includes(previous.id) ? 'unlocked' : 'locked';
}

export function getProgressPercentage(state: ProgressState, graph: ProgressCourseGraph): number {
  const total = graph.lessons.length;
  if (total === 0) return 0;
  return Math.round((state.completedLessons.length / total) * 100);
}
