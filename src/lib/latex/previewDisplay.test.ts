import { describe, it, expect } from 'vitest';
import { classifyPreviewResult, getStatusMessage } from './previewDisplay';
import type { ObjectiveState } from './previewDisplay';
import type { SafeLatexPreviewResult } from './safeLatexPreview';

function makeResult(overrides: Partial<SafeLatexPreviewResult>): SafeLatexPreviewResult {
  return {
    valid: true,
    documentClass: 'article',
    documentClassOption: null,
    packages: [],
    title: null,
    author: null,
    date: null,
    hasMaketitle: false,
    abstractLabel: null,
    abstractParagraphs: [],
    hasTableOfContents: false,
    outline: [],
    formattingUses: [],
    paragraphs: [],
    tables: [],
    figures: [],
    footnotes: [],
    bibliographyEntries: [],
    citations: [],
    bibliographyLimitations: [],
    hasBibliography: false,
    bibliographyWidth: null,
    references: [],
    referenceLimitations: [],
    hyperrefEnabled: false,
    cleverefEnabled: false,
    unsupportedCommands: [],
    errors: [],
    ...overrides,
  };
}

describe('classifyPreviewResult', () => {
  it('classifies as valid when document has errors is false and paragraphs exist', () => {
    const result = makeResult({ paragraphs: ['Texto'] });
    const state = classifyPreviewResult(result, []);
    expect(state.kind).toBe('valid');
    if (state.kind === 'valid') {
      expect(state.paragraphs).toEqual(['Texto']);
    }
  });

  it('classifies as empty when no errors, no unsupported, no paragraphs', () => {
    const result = makeResult({ paragraphs: [] });
    const state = classifyPreviewResult(result, []);
    expect(state.kind).toBe('empty');
  });

  it('classifies a safe figure as visible content', () => {
    const result = makeResult({
      figures: [{
        items: [{
          image: {
            src: '/imagenes/curso/seccion-11/imagen.png',
            fileName: 'imagen.png',
            alt: 'Planta de referencia del curso',
            widthPercent: 60,
            widthCm: null,
            angle: 0,
          },
          caption: null,
          labels: [],
          containerWidthPercent: null,
        }],
        caption: 'Planta',
        centered: true,
        placement: null,
        floating: true,
      }],
    });
    expect(classifyPreviewResult(result, []).kind).toBe('valid');
  });

  it('classifies an empty safe bibliography as visible educational content', () => {
    const result = makeResult({
      hasBibliography: true,
      bibliographyWidth: '9',
    });
    expect(classifyPreviewResult(result, []).kind).toBe('valid');
  });

  it('classifies as unsupported when unsupported commands exist', () => {
    const result = makeResult({
      paragraphs: [],
      unsupportedCommands: ['\\textbf'],
    });
    const state = classifyPreviewResult(result, []);
    expect(state.kind).toBe('unsupported');
    if (state.kind === 'unsupported') {
      expect(state.commands).toEqual(['\\textbf']);
    }
  });

  it('classifies as unsupported even when paragraphs also exist', () => {
    const result = makeResult({
      paragraphs: ['Texto visible'],
      unsupportedCommands: ['\\textbf'],
    });
    const state = classifyPreviewResult(result, []);
    expect(state.kind).toBe('unsupported');
    if (state.kind === 'unsupported') {
      expect(state.paragraphs).toEqual(['Texto visible']);
    }
  });

  it('classifies as invalid when there are errors', () => {
    const result = makeResult({
      valid: false,
      errors: ['Falta \\begin{document}.'],
    });
    const state = classifyPreviewResult(result, []);
    expect(state.kind).toBe('invalid');
    if (state.kind === 'invalid') {
      expect(state.errors).toEqual(['Falta \\begin{document}.']);
    }
  });

  it('classifies as partial when valid blocks coexist with an error', () => {
    const result = makeResult({
      valid: false,
      paragraphs: ['Texto todavía visible'],
      errors: ['Falta \\) para cerrar la expresión matemática en línea.'],
    });
    const state = classifyPreviewResult(result, []);
    expect(state.kind).toBe('partial');
  });

  it('passes lastValidParagraphs in invalid state', () => {
    const result = makeResult({
      valid: false,
      errors: ['Falta \\end{document}.'],
    });
    const state = classifyPreviewResult(result, ['Vista previa anterior']);
    expect(state.kind).toBe('invalid');
    if (state.kind === 'invalid') {
      expect(state.lastValidParagraphs).toEqual(['Vista previa anterior']);
    }
  });
});

describe('ObjectiveState', () => {
  it('not-applicable cuando no hay reglas de validación', () => {
    const state: ObjectiveState = { kind: 'not-applicable', messages: [] };
    expect(state.kind).toBe('not-applicable');
  });

  it('pending cuando hay reglas sin cumplir', () => {
    const state: ObjectiveState = { kind: 'pending', messages: ['Falta fontenc en el preámbulo.'] };
    expect(state.kind).toBe('pending');
    expect(state.messages[0]).toContain('fontenc');
  });

  it('fulfilled cuando todas las reglas se cumplen', () => {
    const state: ObjectiveState = { kind: 'fulfilled', messages: [] };
    expect(state.kind).toBe('fulfilled');
  });
});

describe('getStatusMessage', () => {
  it('returns correct message for valid state', () => {
    expect(getStatusMessage('valid')).toBe('Vista previa actualizada');
  });

  it('returns correct message for empty state', () => {
    expect(getStatusMessage('empty')).toBe('Documento vacío');
  });

  it('returns correct message for unsupported state', () => {
    expect(getStatusMessage('unsupported')).toBe('Función no disponible');
  });

  it('returns correct message for invalid state', () => {
    expect(getStatusMessage('invalid')).toBe('Revisa el documento');
  });

  it('returns correct message for partial state', () => {
    expect(getStatusMessage('partial')).toBe('Vista previa parcial');
  });
});
