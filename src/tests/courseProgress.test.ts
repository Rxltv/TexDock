import { describe, expect, it } from 'vitest';
import { buildProgressGraph, deriveProgressState, getLessonState, getProgressPercentage, getSectionState } from '../lib/progress/courseProgress';
import { createInitialProgress } from '../lib/progress/progressStore';

const graph = buildProgressGraph(
  [{ id: 's1', order: 1 }, { id: 's2', order: 2 }],
  [
    { id: 'l1', sectionId: 's1', order: 1 },
    { id: 'l2', sectionId: 's1', order: 2 },
    { id: 'l3', sectionId: 's2', order: 1 },
  ],
  [
    { id: 'p1', lessonId: 'l1', order: 1 },
    { id: 'p2', lessonId: 'l2', order: 1 },
    { id: 'p3', lessonId: 'l3', order: 1 },
  ],
  [{ id: 'e1', pageId: 'p1', required: true }],
);

describe('courseProgress', () => {
  it('completes an exercise lesson only after approval', () => {
    const initial = deriveProgressState(createInitialProgress(), graph);
    expect(initial.completedLessons).toEqual([]);
    const approved = deriveProgressState({ ...initial, completedExerciseIds: ['e1'] }, graph);
    expect(approved.completedLessons).toEqual(['l1']);
    expect(getLessonState('l2', approved, graph)).toBe('unlocked');
  });

  it('completes an exercise-free lesson at its last page', () => {
    const state = deriveProgressState({ ...createInitialProgress(), completedExerciseIds: ['e1'], completedPageIds: ['p2'] }, graph);
    expect(state.completedLessons).toEqual(['l1', 'l2']);
    expect(state.completedSections).toEqual(['s1']);
    expect(getSectionState('s2', state, graph)).toBe('unlocked');
    expect(getProgressPercentage(state, graph)).toBe(67);
  });

  it('ignores IDs that do not belong to the published course graph', () => {
    const state = deriveProgressState({
      ...createInitialProgress(),
      completedExerciseIds: ['unknown-exercise'],
      completedPageIds: ['unknown-page'],
    }, graph);
    expect(state.completedExerciseIds).toEqual([]);
    expect(state.completedPageIds).toEqual([]);
    expect(state.completedLessons).toEqual([]);
  });

  it('does not complete a lesson when an exercise approval is absent', () => {
    const state = deriveProgressState({
      ...createInitialProgress(),
      completedPageIds: ['p1'],
    }, graph);
    expect(state.completedLessons).toEqual([]);
    expect(getLessonState('l2', state, graph)).toBe('locked');
  });
});
