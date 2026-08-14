import { describe, expect, it } from 'vitest';
import {
  buildProgressGraph,
  deriveProgressState,
  getLessonState,
  getProgressPercentage,
  getSectionState,
  isProgressRouteAvailable,
} from '../lib/progress/courseProgress';
import { createInitialProgress } from '../lib/progress/progressStore';

const graph = buildProgressGraph(
  [{ id: 's1', order: 1 }, { id: 's2', order: 2 }, { id: 's3', order: 3 }],
  [
    { id: 'l1', sectionId: 's1', order: 1 },
    { id: 'l2', sectionId: 's1', order: 2 },
    { id: 'l3', sectionId: 's1', order: 3 },
    { id: 'l4', sectionId: 's2', order: 1 },
    { id: 'l5', sectionId: 's3', order: 1 },
  ],
  [
    { id: 'p1', lessonId: 'l1', order: 1 },
    { id: 'p1-next', lessonId: 'l1', order: 2 },
    { id: 'p2', lessonId: 'l2', order: 1 },
    { id: 'p3', lessonId: 'l3', order: 1 },
    { id: 'p4', lessonId: 'l4', order: 1 },
    { id: 'p5', lessonId: 'l5', order: 1 },
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
    const state = deriveProgressState({
      ...createInitialProgress(),
      completedExerciseIds: ['e1'],
      completedPageIds: ['p2', 'p3'],
    }, graph);
    expect(state.completedLessons).toEqual(['l1', 'l2', 'l3']);
    expect(state.completedSections).toEqual(['s1']);
    expect(getSectionState('s2', state, graph)).toBe('unlocked');
    expect(getProgressPercentage(state, graph)).toBe(60);
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

  it('requires the immediate previous lesson, not any earlier completed lesson', () => {
    const state = deriveProgressState({
      ...createInitialProgress(),
      completedExerciseIds: ['e1'],
    }, graph);
    expect(getLessonState('l2', state, graph)).toBe('unlocked');
    expect(getLessonState('l3', state, graph)).toBe('locked');
  });

  it('requires the immediate previous section when there are three sections', () => {
    const state = { ...createInitialProgress(), completedSections: ['s1'] };
    expect(getSectionState('s2', state, graph)).toBe('unlocked');
    expect(getSectionState('s3', state, graph)).toBe('locked');
  });

  it('keeps the first lesson of a locked parent section locked', () => {
    const initial = deriveProgressState(createInitialProgress(), graph);
    expect(getLessonState('l1', initial, graph)).toBe('unlocked');
    expect(getLessonState('l4', initial, graph)).toBe('locked');
  });

  it('derives fail-closed route availability from reset state', () => {
    const reset = deriveProgressState(createInitialProgress(), graph);
    expect(isProgressRouteAvailable({}, reset, graph)).toBe(true);
    expect(isProgressRouteAvailable({ sectionId: 's1' }, reset, graph)).toBe(true);
    expect(isProgressRouteAvailable({ sectionId: 's1', lessonId: 'l1', pageId: 'p1' }, reset, graph)).toBe(true);
    expect(isProgressRouteAvailable({ sectionId: 's1', lessonId: 'l2', pageId: 'p2' }, reset, graph)).toBe(false);
    expect(isProgressRouteAvailable({ sectionId: 's2', lessonId: 'l4', pageId: 'p4' }, reset, graph)).toBe(false);
  });

  it('does not mark an empty section complete in reset state', () => {
    const emptyGraph = buildProgressGraph(
      [{ id: 'empty', order: 1 }, { id: 'later', order: 2 }],
      [{ id: 'later-lesson', sectionId: 'later', order: 1 }],
      [{ id: 'later-page', lessonId: 'later-lesson', order: 1 }],
      [],
    );
    const reset = deriveProgressState(createInitialProgress(), emptyGraph);
    expect(reset.completedSections).toEqual([]);
    expect(getSectionState('later', reset, emptyGraph)).toBe('locked');
  });

  it('rejects mismatched and unknown page route metadata', () => {
    const state = deriveProgressState({
      ...createInitialProgress(),
      completedExerciseIds: ['e1'],
    }, graph);
    expect(isProgressRouteAvailable({ sectionId: 's1', lessonId: 'l2', pageId: 'p2' }, state, graph)).toBe(true);
    expect(isProgressRouteAvailable({ sectionId: 's1', lessonId: 'l2', pageId: 'p4' }, state, graph)).toBe(false);
    expect(isProgressRouteAvailable({ sectionId: 'missing' }, state, graph)).toBe(false);
  });

  it('requires the immediate previous page before accepting a deep URL', () => {
    const initial = deriveProgressState(createInitialProgress(), graph);
    expect(isProgressRouteAvailable({ sectionId: 's1', lessonId: 'l1', pageId: 'p1-next' }, initial, graph)).toBe(false);
    const firstPageVisited = deriveProgressState({
      ...initial,
      completedPageIds: ['p1'],
    }, graph);
    expect(isProgressRouteAvailable({ sectionId: 's1', lessonId: 'l1', pageId: 'p1-next' }, firstPageVisited, graph)).toBe(true);
  });

  it('checks the target page when deciding whether Continue is available', () => {
    const reset = deriveProgressState(createInitialProgress(), graph);
    expect(isProgressRouteAvailable({ sectionId: 's1', lessonId: 'l1', pageId: 'p1-next' }, reset, graph)).toBe(false);
  });
});
