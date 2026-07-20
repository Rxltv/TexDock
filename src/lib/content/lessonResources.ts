import { getCollection, type CollectionEntry } from 'astro:content';

export interface LessonResourceOptions {
  includeDrafts?: boolean;
}

export type ExampleData = CollectionEntry<'example'>['data'];
export type ExerciseData = CollectionEntry<'exercise'>['data'];

type HasLessonIdAndOrder = {
  lessonId: string;
  order: number;
  status: string;
};

export function filterByLessonId<T extends HasLessonIdAndOrder>(
  items: T[],
  lessonId: string,
): T[] {
  return items.filter((item) => item.lessonId === lessonId);
}

export function excludeByStatus<T extends HasLessonIdAndOrder>(
  items: T[],
  ...statuses: string[]
): T[] {
  const excluded = new Set(statuses);
  return items.filter((item) => !excluded.has(item.status));
}

export function sortByOrder<T extends HasLessonIdAndOrder>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export function prepareLessonResources<T extends HasLessonIdAndOrder>(
  items: T[],
  lessonId: string,
  options?: LessonResourceOptions,
): T[] {
  const byLesson = filterByLessonId(items, lessonId);
  const withoutArchived = excludeByStatus(byLesson, 'archived');
  const filtered = options?.includeDrafts
    ? withoutArchived
    : excludeByStatus(withoutArchived, 'draft');
  return sortByOrder(filtered);
}

export async function getExamplesByLessonId(
  lessonId: string,
  options?: LessonResourceOptions,
): Promise<ExampleData[]> {
  const entries = await getCollection('example');
  return prepareLessonResources(
    entries.map((e) => e.data),
    lessonId,
    options,
  );
}

export async function getExercisesByLessonId(
  lessonId: string,
  options?: LessonResourceOptions,
): Promise<ExerciseData[]> {
  const entries = await getCollection('exercise');
  return prepareLessonResources(
    entries.map((e) => e.data),
    lessonId,
    options,
  );
}
