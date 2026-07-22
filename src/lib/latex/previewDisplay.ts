import type { SafeLatexPreviewResult } from './safeLatexPreview';

export type PreviewDisplayKind = 'valid' | 'empty' | 'unsupported' | 'invalid';

export type PreviewDisplayState =
  | { kind: 'valid'; paragraphs: string[] }
  | { kind: 'empty'; errors: string[] }
  | { kind: 'unsupported'; paragraphs: string[]; commands: string[] }
  | { kind: 'invalid'; errors: string[]; lastValidParagraphs: string[] };

export type ObjectiveKind = 'not-applicable' | 'pending' | 'fulfilled';

export interface ObjectiveState {
  kind: ObjectiveKind;
  messages: string[];
}

export function classifyPreviewResult(
  result: SafeLatexPreviewResult,
  lastValidParagraphs: string[],
): PreviewDisplayState {
  const hasErrors = result.errors.length > 0;
  const hasUnsupported = result.unsupportedCommands.length > 0;
  const hasParagraphs =
    result.paragraphs.length > 0 ||
    result.abstractParagraphs.length > 0 ||
    (result.hasMaketitle && (result.title !== null || result.author !== null || result.date !== null));

  if (hasErrors) {
    return { kind: 'invalid', errors: result.errors, lastValidParagraphs };
  }

  if (hasUnsupported) {
    return { kind: 'unsupported', paragraphs: result.paragraphs, commands: result.unsupportedCommands };
  }

  if (!hasParagraphs) {
    return { kind: 'empty', errors: [] };
  }

  return { kind: 'valid', paragraphs: result.paragraphs };
}

export function getStatusMessage(kind: PreviewDisplayKind): string {
  switch (kind) {
    case 'valid':
      return 'Vista previa actualizada';
    case 'empty':
      return 'Documento vacío';
    case 'unsupported':
      return 'Función no disponible';
    case 'invalid':
      return 'Revisa el documento';
  }
}
