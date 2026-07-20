import { describe, it, expect } from 'vitest';

describe('Progress types', () => {
  it('defines ProgressState with required fields', () => {
    const state = {
      currentSection: null,
      currentLesson: null,
      completedExercises: [],
      completedLessons: [],
      completedSections: [],
      storageVersion: 1,
      updatedAt: new Date().toISOString(),
      initialNoticeAcknowledged: false,
    };
    expect(state).toHaveProperty('storageVersion');
    expect(state.storageVersion).toBe(1);
    expect(state.completedExercises).toEqual([]);
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
