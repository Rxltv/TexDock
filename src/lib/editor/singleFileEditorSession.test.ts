import { describe, expect, it } from 'vitest';
import { DEFAULT_DOCUMENT } from './busytexCompiler';
import {
  DEFAULT_PROJECT_NAME,
  hasUnsavedEditorChanges,
} from './singleFileEditorSession';

describe('single-file editor session', () => {
  it('starts clean with the default source and project name', () => {
    expect(hasUnsavedEditorChanges(DEFAULT_DOCUMENT, DEFAULT_PROJECT_NAME)).toBe(false);
  });

  it('becomes dirty when the source changes', () => {
    expect(hasUnsavedEditorChanges(`${DEFAULT_DOCUMENT}\n`, DEFAULT_PROJECT_NAME)).toBe(true);
  });

  it('becomes dirty when the project name changes', () => {
    expect(hasUnsavedEditorChanges(DEFAULT_DOCUMENT, 'Mi primer proyecto')).toBe(true);
  });

  it('becomes clean again when both values return to their defaults', () => {
    expect(hasUnsavedEditorChanges(DEFAULT_DOCUMENT, DEFAULT_PROJECT_NAME)).toBe(false);
  });
});
