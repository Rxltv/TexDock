import type { SafeLatexPreviewResult } from './safeLatexPreview';

export type PreviewDisplayKind = 'valid' | 'empty' | 'unsupported' | 'partial' | 'invalid';

export type PreviewDisplayState =
  | { kind: 'valid'; paragraphs: string[] }
  | { kind: 'empty'; errors: string[] }
  | { kind: 'unsupported'; paragraphs: string[]; commands: string[] }
  | { kind: 'partial'; errors: string[]; lastValidParagraphs: string[] }
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
    (result.previewBlocks?.length ?? 0) > 0 ||
    result.tables.length > 0 ||
    result.figures.length > 0 ||
    result.footnotes.length > 0 ||
    result.hasBibliography ||
    result.citations.length > 0 ||
    result.references.length > 0 ||
    result.outline.length > 0 ||
    result.formattingUses.length > 0 ||
    result.abstractParagraphs.length > 0 ||
    (result.hasMaketitle && (result.title !== null || result.author !== null || result.date !== null));

  if (hasErrors) {
    if (hasParagraphs) {
      return { kind: 'partial', errors: result.errors, lastValidParagraphs };
    }
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
    case 'partial':
      return 'Vista previa parcial';
    case 'invalid':
      return 'Revisa el documento';
  }
}
