import { DEFAULT_DOCUMENT } from './busytexCompiler';

export const DEFAULT_PROJECT_NAME = 'Proyecto sin título';

export function hasUnsavedEditorChanges(source: string, projectName: string): boolean {
  return source !== DEFAULT_DOCUMENT || projectName !== DEFAULT_PROJECT_NAME;
}
