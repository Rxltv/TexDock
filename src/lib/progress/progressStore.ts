import type { ProgressState } from './types';

export const PROGRESS_STORAGE_KEY = 'texdock:progress';
export const PROGRESS_SCHEMA_VERSION = 2;
const LEGACY_PROGRESS_SCHEMA_VERSION = 1;
type LegacyProgressState = Omit<ProgressState, 'currentPage' | 'schemaVersion'> & {
  schemaVersion: typeof LEGACY_PROGRESS_SCHEMA_VERSION;
};

export function createInitialProgress(): ProgressState {
  return {
    currentSection: null,
    currentLesson: null,
    currentPage: null,
    completedExerciseIds: [],
    completedPageIds: [],
    completedLessons: [],
    completedSections: [],
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    updatedAt: new Date(0).toISOString(),
    initialNoticeAcknowledged: false,
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function hasCommonProgressState(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const state = value as Record<string, unknown>;
  return (state.currentSection === null || typeof state.currentSection === 'string')
    && (state.currentLesson === null || typeof state.currentLesson === 'string')
    && isStringArray(state.completedExerciseIds)
    && isStringArray(state.completedPageIds)
    && isStringArray(state.completedLessons)
    && isStringArray(state.completedSections)
    && typeof state.updatedAt === 'string'
    && Number.isFinite(Date.parse(state.updatedAt))
    && typeof state.initialNoticeAcknowledged === 'boolean';
}

function isProgressState(value: unknown): value is ProgressState {
  if (!hasCommonProgressState(value)) return false;
  const keys = Object.keys(value).sort();
  const expectedKeys = [
    'completedExerciseIds',
    'completedLessons',
    'completedPageIds',
    'completedSections',
    'currentLesson',
    'currentPage',
    'currentSection',
    'initialNoticeAcknowledged',
    'schemaVersion',
    'updatedAt',
  ].sort();
  return JSON.stringify(keys) === JSON.stringify(expectedKeys)
    && value.schemaVersion === PROGRESS_SCHEMA_VERSION
    && (value.currentPage === null || typeof value.currentPage === 'string');
}

function isLegacyProgressState(value: unknown): value is LegacyProgressState {
  if (!hasCommonProgressState(value)) return false;
  const keys = Object.keys(value).sort();
  const expectedKeys = [
    'completedExerciseIds',
    'completedLessons',
    'completedPageIds',
    'completedSections',
    'currentLesson',
    'currentSection',
    'initialNoticeAcknowledged',
    'schemaVersion',
    'updatedAt',
  ].sort();
  return JSON.stringify(keys) === JSON.stringify(expectedKeys)
    && value.schemaVersion === LEGACY_PROGRESS_SCHEMA_VERSION;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function loadProgress(storage?: StorageLike | null): ProgressState {
  if (!storage) return createInitialProgress();
  try {
    const raw = storage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return createInitialProgress();
    const parsed: unknown = JSON.parse(raw);
    if (isProgressState(parsed)) return parsed;
    if (isLegacyProgressState(parsed)) {
      return {
        ...parsed,
        currentPage: (parsed.completedPageIds as string[]).at(-1) ?? null,
        schemaVersion: PROGRESS_SCHEMA_VERSION,
      };
    }
    return createInitialProgress();
  } catch {
    return createInitialProgress();
  }
}

export function saveProgress(state: ProgressState, storage?: StorageLike | null): boolean {
  if (!storage) return false;
  try {
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({
      ...state,
      schemaVersion: PROGRESS_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
    }));
    return true;
  } catch {
    return false;
  }
}

export function clearProgress(storage?: StorageLike | null): void {
  try {
    storage?.removeItem(PROGRESS_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
  }
}
