import { describe, expect, it } from 'vitest';
import { clearProgress, createInitialProgress, loadProgress, saveProgress } from '../lib/progress/progressStore';

function storageFixture() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe('progressStore', () => {
  it('starts empty and recovers a saved state', () => {
    const storage = storageFixture();
    const initial = createInitialProgress();
    expect(loadProgress(storage)).toEqual(initial);
    const saved = { ...initial, completedExerciseIds: ['exercise-1'] };
    expect(saveProgress(saved, storage)).toBe(true);
    expect(loadProgress(storage).completedExerciseIds).toEqual(['exercise-1']);
  });

  it('migrates valid schema 1 progress without losing completed pages', () => {
    const storage = storageFixture();
    const initial = createInitialProgress();
    const legacy = { ...initial, currentPage: undefined, schemaVersion: 1 };
    const legacyRecord = { ...legacy };
    delete (legacyRecord as { currentPage?: unknown }).currentPage;
    legacyRecord.completedPageIds = ['page-1'];
    storage.setItem('texdock:progress', JSON.stringify(legacyRecord));

    const migrated = loadProgress(storage);
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.currentPage).toBe('page-1');
    expect(migrated.completedPageIds).toEqual(['page-1']);
  });

  it('ignores malformed or incompatible local data', () => {
    const storage = storageFixture();
    storage.setItem('texdock:progress', '{not-json');
    expect(loadProgress(storage)).toEqual(createInitialProgress());
    storage.setItem('texdock:progress', JSON.stringify({ schemaVersion: 99 }));
    expect(loadProgress(storage)).toEqual(createInitialProgress());
  });

  it.each([
    { completedExerciseIds: ['ok', 1] },
    { completedPageIds: 'not-an-array' },
    { completedLessons: [null] },
    { completedSections: [false] },
    { updatedAt: 'not-a-date' },
    { initialNoticeAcknowledged: 'yes' },
  ])('rejects structurally corrupt state: %j', (corruption) => {
    const storage = storageFixture();
    storage.setItem('texdock:progress', JSON.stringify({ ...createInitialProgress(), ...corruption }));
    expect(loadProgress(storage)).toEqual(createInitialProgress());
  });

  it('returns an empty state when storage is unavailable or throws', () => {
    expect(loadProgress(null)).toEqual(createInitialProgress());
    const blocked = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    expect(loadProgress(blocked)).toEqual(createInitialProgress());
    expect(saveProgress(createInitialProgress(), blocked)).toBe(false);
  });

  it('clears local progress without throwing', () => {
    const storage = storageFixture();
    saveProgress({ ...createInitialProgress(), completedPageIds: ['page-1'] }, storage);
    clearProgress(storage);
    expect(loadProgress(storage)).toEqual(createInitialProgress());
  });
});
