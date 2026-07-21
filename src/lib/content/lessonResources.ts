import { getCollection, type CollectionEntry } from 'astro:content';

export interface LessonResourceOptions {
  includeDrafts?: boolean;
}

export type ExampleData = CollectionEntry<'example'>['data'];
export type ExerciseData = CollectionEntry<'exercise'>['data'];
export type LessonPageData = CollectionEntry<'lessonPage'>['data'];

type WithStatus = { status?: string };
type WithOrder = { order: number };
type WithPageId = { pageId: string };

export function filterByPageId<T extends WithPageId>(
  items: T[],
  pageId: string,
): T[] {
  return items.filter((item) => item.pageId === pageId);
}

export function excludeByStatus<T extends WithStatus>(
  items: T[],
  ...statuses: string[]
): T[] {
  const excluded = new Set(statuses);
  return items.filter((item) => item.status !== undefined && !excluded.has(item.status));
}

export function sortByOrder<T extends WithOrder>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export function preparePageResources<T extends WithPageId & WithStatus & WithOrder>(
  items: T[],
  pageId: string,
  options?: LessonResourceOptions,
): T[] {
  const byPage = filterByPageId(items, pageId);
  const withoutArchived = excludeByStatus(byPage, 'archived');
  const filtered = options?.includeDrafts
    ? withoutArchived
    : excludeByStatus(withoutArchived, 'draft');
  return sortByOrder(filtered);
}

export function filterByStatusForEnv<T extends WithStatus>(
  items: T[],
  isDev: boolean,
): T[] {
  const allowed = new Set(isDev ? ['published', 'draft'] : ['published']);
  return items.filter(
    (item) => item.status !== undefined && allowed.has(item.status),
  );
}

export async function getExamplesByPageId(
  pageId: string,
  options?: LessonResourceOptions,
): Promise<ExampleData[]> {
  const entries = await getCollection('example');
  return preparePageResources(
    entries.map((e) => e.data),
    pageId,
    options,
  );
}

export async function getExercisesByPageId(
  pageId: string,
  options?: LessonResourceOptions,
): Promise<ExerciseData[]> {
  const entries = await getCollection('exercise');
  return preparePageResources(
    entries.map((e) => e.data),
    pageId,
    options,
  );
}

export async function getLessonResourcesByPageId(
  pageId: string,
  options?: LessonResourceOptions,
): Promise<{ examples: ExampleData[]; exercises: ExerciseData[] }> {
  const [examples, exercises] = await Promise.all([
    getExamplesByPageId(pageId, options),
    getExercisesByPageId(pageId, options),
  ]);
  return { examples, exercises };
}
