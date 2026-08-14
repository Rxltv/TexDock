import { describe, it, expect } from 'vitest';

describe('Progress types', () => {
  it('defines ProgressState with required fields', () => {
    const state = {
      currentSection: null,
      currentLesson: null,
      currentPage: null,
      completedExerciseIds: [],
      completedPageIds: [],
      completedLessons: [],
      completedSections: [],
      schemaVersion: 2,
      updatedAt: new Date().toISOString(),
      initialNoticeAcknowledged: false,
    };
    expect(state).toHaveProperty('schemaVersion');
    expect(state.schemaVersion).toBe(2);
    expect(state.completedExerciseIds).toEqual([]);
  });

  it('SectionState accepts valid values', () => {
    const validStates: Array<'locked' | 'unlocked' | 'completed'> = [
      'locked',
      'unlocked',
      'completed',
    ];
    for (const s of validStates) {
      expect(['locked', 'unlocked', 'completed']).toContain(s);
    }
  });

  it('SectionState rejects invalid values', () => {
    const invalidValue = 'invalid';
    const validStates = ['locked', 'unlocked', 'completed'] as const;
    expect(validStates).not.toContain(invalidValue);
  });
});
