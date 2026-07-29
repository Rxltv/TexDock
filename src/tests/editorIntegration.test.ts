import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
  copyEditorContent,
  createLatexEditorState,
  mountLatexCodeEditor,
  notifyEditorChange,
  resolveEditorAction,
} from '../components/editor/LatexCodeEditor';
import {
  buildSafeLatexWorkspaceSnapshot,
} from '../components/editor/SafeLatexWorkspace';
import MathPlayground, {
  canExportCurrentExpression,
  DEFAULT_EXPRESSION,
  renderMathPreview,
  selectMathExample,
} from '../components/playground/MathPlayground';
import SafeLatexPreviewPanel from '../components/preview/SafeLatexPreviewPanel';
import { mathExamples } from '../lib/latex/mathExamples';
import { zoneStateField } from '../lib/editor/latexZoneDecorations';
import type { ValidationRule } from '../lib/exercises/validateExercise';

const exerciseView = readFileSync(
  new URL('../components/content/ExerciseView.astro', import.meta.url),
  'utf8',
);
const exampleView = readFileSync(
  new URL('../components/content/ExampleView.astro', import.meta.url),
  'utf8',
);
const editorSource = readFileSync(
  new URL('../components/editor/LatexCodeEditor.tsx', import.meta.url),
  'utf8',
);
const workspaceSource = readFileSync(
  new URL('../components/editor/SafeLatexWorkspace.tsx', import.meta.url),
  'utf8',
);
const playgroundSource = readFileSync(
  new URL('../components/playground/MathPlayground.tsx', import.meta.url),
  'utf8',
);
const laboratoryPage = readFileSync(
  new URL('../pages/laboratorio.astro', import.meta.url),
  'utf8',
);

const INITIAL_DOCUMENT = [
  '\\documentclass{article}',
  '\\begin{document}',
  'Inicial',
  '\\end{document}',
].join('\n');

function editableState(initialCode = INITIAL_DOCUMENT) {
  return createLatexEditorState({
    initialCode,
    ariaLabel: 'Editor de prueba',
    readOnly: false,
  });
}

describe('integración de LatexCodeEditor con CodeMirror 6', () => {
  it('hidrata al cargar ejemplos y ejercicios, sin depender de visibilidad', () => {
    expect(exerciseView).toContain('client:load');
    expect(exampleView).toContain('client:load');
    expect(exerciseView).not.toContain('client:visible');
    expect(exampleView).not.toContain('client:visible');
  });

  it('crea el estado completo con el código inicial y decoraciones desde el primer render', () => {
    const state = editableState();
    expect(state.doc.toString()).toBe(INITIAL_DOCUMENT);
    expect(state.field(zoneStateField).size).toBeGreaterThan(0);
    expect(() => state.facet(EditorView.editable)).not.toThrow();
  });

  it('monta el estado en la referencia recibida y expone la destrucción de la vista', () => {
    const parent = {} as HTMLElement;
    const state = editableState();
    const destroy = vi.fn();
    const fakeView = { destroy } as unknown as EditorView;
    const createView = vi.fn(
      (_config: ConstructorParameters<typeof EditorView>[0]) => fakeView,
    );

    const view = mountLatexCodeEditor(parent, state, createView);
    expect(view).toBe(fakeView);
    expect(createView).toHaveBeenCalledOnce();
    expect(createView.mock.calls[0][0]).toMatchObject({ parent, state });

    view.destroy();
    expect(destroy).toHaveBeenCalledOnce();
  });

  it('permite escribir y borrar en el documento de CodeMirror', () => {
    let state = editableState('abc');
    state = state.update({ changes: { from: 3, insert: 'def' } }).state;
    expect(state.doc.toString()).toBe('abcdef');
    state = state.update({ changes: { from: 1, to: 5, insert: '' } }).state;
    expect(state.doc.toString()).toBe('af');
  });

  it('envía a onChange exactamente el documento actualizado y omite transacciones sin cambios', () => {
    const onChange = vi.fn();
    const updatedState = editableState('antes')
      .update({ changes: { from: 0, to: 5, insert: 'después' } })
      .state;

    expect(notifyEditorChange(
      { docChanged: true, state: updatedState } as never,
      onChange,
    )).toBe('después');
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('después');

    expect(notifyEditorChange(
      { docChanged: false, state: updatedState } as never,
      onChange,
    )).toBeNull();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('limpia y restaura exactamente el código inicial', () => {
    expect(resolveEditorAction('clear', INITIAL_DOCUMENT, false)).toBe('');
    expect(resolveEditorAction('restore', INITIAL_DOCUMENT, false)).toBe(INITIAL_DOCUMENT);
  });

  it('configura solo lectura en los facets de estado y vista y bloquea sus acciones mutables', () => {
    const state = createLatexEditorState({
      initialCode: INITIAL_DOCUMENT,
      ariaLabel: 'Código de referencia',
      readOnly: true,
    });
    expect(state.facet(EditorState.readOnly)).toBe(true);
    expect(state.facet(EditorView.editable)).toBe(false);
    expect(resolveEditorAction('clear', INITIAL_DOCUMENT, true)).toBeNull();
    expect(resolveEditorAction('restore', INITIAL_DOCUMENT, true)).toBeNull();
  });

  it('copia por Clipboard API y usa el fallback cuando la API falla', async () => {
    const writeClipboard = vi.fn(async () => undefined);
    const fallbackCopy = vi.fn(() => true);
    await expect(copyEditorContent('código', writeClipboard, fallbackCopy)).resolves.toBe(true);
    expect(writeClipboard).toHaveBeenCalledWith('código');
    expect(fallbackCopy).not.toHaveBeenCalled();

    const rejectedClipboard = vi.fn(async () => {
      throw new Error('Clipboard no disponible');
    });
    await expect(copyEditorContent('respaldo', rejectedClipboard, fallbackCopy)).resolves.toBe(true);
    expect(fallbackCopy).toHaveBeenCalledWith('respaldo');

    const brokenFallback = vi.fn(() => {
      throw new Error('Fallback no disponible');
    });
    await expect(copyEditorContent('sin copiar', rejectedClipboard, brokenFallback))
      .resolves.toBe(false);
  });

  it('usa el montaje probado en el efecto y mantiene el contenedor visible sin ocultar overflow', () => {
    expect(editorSource).toContain('mountLatexCodeEditor(');
    expect(editorSource).toContain('editor.destroy()');
    expect(editorSource).toContain('min-height: 120px');
    expect(editorSource).toContain('overflow: auto');
    expect(editorSource).not.toContain('.editor-mount {\n            flex: 1;\n            min-height: 0;\n            overflow: hidden;');
  });
});

describe('sincronización de SafeLatexWorkspace', () => {
  const rules: ValidationRule[] = [{
    id: 'fontenc-t1',
    type: 'REQUIRE_PACKAGE',
    required: true,
    scope: 'PREAMBLE',
    target: 'fontenc',
    expected: 'T1',
    feedback: 'Añade fontenc con T1 en el preámbulo.',
  }];

  it('calcula preview y validación a partir del mismo código actualizado', () => {
    const initial = buildSafeLatexWorkspaceSnapshot(INITIAL_DOCUMENT, rules);
    const updatedCode = [
      '\\documentclass{article}',
      '\\usepackage[T1]{fontenc}',
      '\\begin{document}',
      'Modificado',
      '\\end{document}',
    ].join('\n');
    const updated = buildSafeLatexWorkspaceSnapshot(updatedCode, rules);

    expect(initial.result.paragraphs).toEqual(['Inicial']);
    expect(initial.validationResult?.valid).toBe(false);
    expect(updated.result.paragraphs).toEqual(['Modificado']);
    expect(updated.validationResult?.valid).toBe(true);
    expect(updated.objectiveState.kind).toBe('fulfilled');
  });

  it('renderiza en el panel el contenido de la vista previa actualizada', () => {
    const snapshot = buildSafeLatexWorkspaceSnapshot(
      INITIAL_DOCUMENT.replace('Inicial', 'Vista sincronizada'),
    );
    const html = renderToStaticMarkup(createElement(SafeLatexPreviewPanel, {
      result: snapshot.result,
      lastValidResult: null,
    }));
    expect(html).toContain('Vista sincronizada');
    expect(html).toContain('Vista previa actualizada');
  });

  it('renderiza una figura segura con ruta y texto alternativo locales', () => {
    const snapshot = buildSafeLatexWorkspaceSnapshot([
      '\\documentclass{article}',
      '\\usepackage{graphicx}',
      '\\begin{document}',
      '\\begin{figure}',
      '\\centering',
      '\\includegraphics[width=0.6\\textwidth]{imagenes/curso/seccion-11/imagen.png}',
      '\\caption{Planta del experimento}',
      '\\end{figure}',
      '\\end{document}',
    ].join('\n'));
    const html = renderToStaticMarkup(createElement(SafeLatexPreviewPanel, {
      result: snapshot.result,
      lastValidResult: null,
    }));

    expect(html).toContain('src="/imagenes/curso/seccion-11/imagen.png"');
    expect(html).toContain('alt="Planta de referencia del curso"');
    expect(html).toContain('<figcaption>Planta del experimento</figcaption>');
  });

  it('mantiene el debounce antes de entregar el código al snapshot', () => {
    expect(workspaceSource).toContain('setTimeout(() =>');
    expect(workspaceSource).toContain('setDebouncedCode(newCode)');
    expect(workspaceSource).toContain('buildSafeLatexWorkspaceSnapshot(debouncedCode, validationRules)');
  });

  it('mantiene el objetivo fuera del editor y del panel de vista previa', () => {
    expect(workspaceSource).toContain('workspace-objective');
    expect(workspaceSource).toContain('Objetivo pendiente');
    expect(workspaceSource).toContain('Objetivo cumplido');
    expect(workspaceSource).toContain('<SafeLatexPreviewPanel');
    expect(workspaceSource).not.toContain('objectiveState={objectiveState}');
  });
});

describe('Fórmulas LaTeX', () => {
  it('usa el mismo LatexCodeEditor controlado y no un textarea alternativo', () => {
    expect(playgroundSource).toContain('<LatexCodeEditor');
    expect(playgroundSource).toContain('value={input}');
    expect(playgroundSource).not.toContain('<textarea');
    expect(laboratoryPage).toContain('<MathPlayground client:load />');
  });

  it('muestra el ejemplo inicial y una vista previa KaTeX desde el render inicial', () => {
    const preview = renderMathPreview(DEFAULT_EXPRESSION);
    expect(preview.status).toBe('valid');
    expect(preview.html).toContain('katex-display');

    const html = renderToStaticMarkup(createElement(MathPlayground));
    expect(html).toContain('Fórmulas LaTeX');
    expect(html).toContain('Escribe, visualiza y descarga fórmulas en SVG.');
    expect(html).toContain('katex-display');
    expect(html).toContain('Expresión LaTeX');
    expect(html).toContain('Descargar SVG');
    expect(html).toContain('Descargar PNG');
    expect(html.match(/aria-live=/g)).toHaveLength(1);
  });

  it('carga y representa los once ejemplos, incluido Determinante', () => {
    expect(mathExamples.map((example) => example.label)).toEqual([
      'Fracción',
      'Límite',
      'Integral',
      'Sumatoria',
      'Matriz',
      'Determinante',
      'Sistema con cases',
      'Derivada',
      'Raíz',
      'Vector',
      'Producto',
    ]);

    for (const example of mathExamples) {
      const selection = selectMathExample(example);
      expect(selection.input, example.label).toBe(example.latex);
      expect(selection.previewInput, example.label).toBe(example.latex);
      expect(renderMathPreview(selection.previewInput).status, example.label).toBe('valid');
    }

    const determinant = mathExamples.find((example) => example.id === 'determinant')!;
    expect(determinant.latex).toContain('\\det');
    expect(renderMathPreview(determinant.latex).html).toContain('katex-display');
  });

  it('mantiene editor y preview sincronizados tras cambiar varias veces de ejemplo', () => {
    const sequence = ['fraction', 'matrix', 'determinant', 'cases', 'product'];
    for (const id of sequence) {
      const example = mathExamples.find((candidate) => candidate.id === id)!;
      const selection = selectMathExample(example);
      expect(selection.input).toBe(selection.previewInput);
      expect(selection.activeExampleId).toBe(id);
    }
  });

  it('habilita la exportación solo para la expresión actual, válida y dentro del límite', () => {
    expect(canExportCurrentExpression('', '', 'idle', false)).toBe(false);
    expect(canExportCurrentExpression('\\frac{', '\\frac{', 'error', false)).toBe(false);
    expect(canExportCurrentExpression('x', 'x anterior', 'valid', false)).toBe(false);
    expect(canExportCurrentExpression('x', 'x', 'valid', true)).toBe(false);
    expect(canExportCurrentExpression('x'.repeat(2_001), 'x'.repeat(2_001), 'valid', false))
      .toBe(false);
    expect(canExportCurrentExpression('x', 'x', 'valid', false)).toBe(true);
  });

  it('mantiene MathJax fuera del render inicial y lo carga solo desde la utilidad de exportación', () => {
    const exportSource = readFileSync(
      new URL('../lib/latex/exportMathSvg.ts', import.meta.url),
      'utf8',
    );
    expect(playgroundSource).not.toMatch(/from ['"]mathjax/);
    expect(exportSource).not.toMatch(/from ['"]@mathjax/);
    expect(exportSource).toContain("await import('./mathJaxSvgRuntime')");
    expect(playgroundSource).toContain('await createMathSvg(input)');
    expect(playgroundSource).toContain(
      "await import('../../lib/latex/exportMathPng')",
    );
    expect(playgroundSource).not.toMatch(
      /import\s+\{[^}]*createMathPng[^}]*\}\s+from/,
    );
  });
});
