import { createRoot } from 'react-dom/client';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import LatexCodeEditor from '../../components/editor/LatexCodeEditor';
import {
  createMathSvg,
  isMathJaxSvgRuntimeLoaded,
} from '../../lib/latex/exportMathSvg';
import MathPlayground from '../../components/playground/MathPlayground';
import SafeLatexWorkspace from '../../components/editor/SafeLatexWorkspace';
import CopyCodeButton from '../../components/library/CopyCodeButton';
import { mountProgressRuntime } from '../../lib/progress/progressRuntime';

export const browserTestInitialCode = [
  '\\documentclass{article}',
  '\\begin{document}',
  'Código inicial',
  '\\end{document}',
].join('\n');

declare global {
  interface Window {
    editorBrowserTest: {
      changes: string[];
      dispatchCode(code: string): void;
      getCode(): string;
      isReadOnly(): boolean;
      hasLoadedMathJax(): boolean;
      createSvg(latex: string): Promise<string>;
      dispatchFormula(code: string): void;
      getFormulaCode(): string;
      getProgress(): unknown;
      setExerciseCode(code: string): void;
      approveExercise(): void;
      resetProgress(): void;
    };
  }
}

const changes: string[] = [];
const exerciseRootElement = document.getElementById('exercise-root');
if (!exerciseRootElement) throw new Error('Falta el contenedor del ejercicio del fixture.');

function getView(): EditorView {
  const editor = document.querySelector<HTMLElement>('.cm-editor');
  const view = editor ? EditorView.findFromDOM(editor) : null;
  if (!view) throw new Error('EditorView no está montado.');
  return view;
}

window.editorBrowserTest = {
  changes,
  dispatchCode(code) {
    const view = getView();
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: code,
      },
    });
  },
  getCode() {
    return getView().state.doc.toString();
  },
  isReadOnly() {
    return getView().state.facet(EditorState.readOnly);
  },
  hasLoadedMathJax() {
    return isMathJaxSvgRuntimeLoaded();
  },
  createSvg(latex) {
    return createMathSvg(latex);
  },
  dispatchFormula(code) {
    const view = getFormulaView();
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: code,
      },
    });
  },
  getFormulaCode() {
    return getFormulaView().state.doc.toString();
  },
  getProgress() {
    return progressRuntime.getState();
  },
  setExerciseCode(code) {
    const editor = exerciseRootElement.querySelector<HTMLElement>('.cm-editor');
    const view = editor ? EditorView.findFromDOM(editor) : null;
    if (!view) throw new Error('El workspace del ejercicio no está montado.');
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } });
  },
  approveExercise() {
    const button = [...exerciseRootElement.querySelectorAll('button')]
      .find((candidate) => candidate.textContent === 'Comprobar respuesta');
    if (!button) throw new Error('No se encontró Comprobar respuesta.');
    (button as HTMLButtonElement).click();
  },
  resetProgress() {
    const button = document.querySelector<HTMLButtonElement>('[data-progress-reset]');
    if (!button) throw new Error('No se encontró el reinicio del progreso.');
    button.click();
  },
};

const root = document.getElementById('root');
if (!root) throw new Error('Falta el contenedor React del fixture.');
const formulaRoot = document.getElementById('formula-root');
if (!formulaRoot) throw new Error('Falta el contenedor de Fórmulas del fixture.');
const formulaRootElement: HTMLElement = formulaRoot;
const libraryRoot = document.getElementById('library-root');
if (!libraryRoot) throw new Error('Falta el contenedor de biblioteca del fixture.');

const exerciseCode = [
  '\\documentclass{article}',
  '\\begin{document}',
  'Respuesta',
  '\\end{document}',
].join('\n');
const exerciseRule = [{
  id: 'fixture-text',
  type: 'REQUIRE_TEXT' as const,
  required: true,
  scope: 'BODY' as const,
  target: 'Respuesta',
  feedback: 'Falta la respuesta.',
}];
const progressGraph = {
  sections: [
    { id: 's1', order: 1, lessonIds: ['l1', 'l2'] },
    { id: 's2', order: 2, lessonIds: ['l3'] },
  ],
  lessons: [
    { id: 'l1', sectionId: 's1', order: 1, pageIds: ['p1'], requiredExerciseIds: ['fixture-exercise'] },
    { id: 'l2', sectionId: 's1', order: 2, pageIds: ['p2'], requiredExerciseIds: [] },
    { id: 'l3', sectionId: 's2', order: 1, pageIds: ['p3'], requiredExerciseIds: [] },
  ],
  pages: [
    { id: 'p1', lessonId: 'l1', order: 1 },
    { id: 'p2', lessonId: 'l2', order: 1 },
    { id: 'p3', lessonId: 'l3', order: 1 },
  ],
  exerciseIds: ['fixture-exercise'],
};
const progressRuntime = mountProgressRuntime({
  graph: progressGraph,
  document,
  eventTarget: window,
  storage: window.localStorage,
  currentSection: 's1',
  currentLesson: 'l1',
});

createRoot(root).render(
  <LatexCodeEditor
    initialCode={browserTestInitialCode}
    ariaLabel="Editor LaTeX de integración"
    actions={['copy', 'clear', 'restore']}
    onChange={(code) => changes.push(code)}
  />,
);

function getFormulaView(): EditorView {
  const editor = formulaRootElement.querySelector<HTMLElement>('.cm-editor');
  const view = editor ? EditorView.findFromDOM(editor) : null;
  if (!view) throw new Error('El editor de Fórmulas no está montado.');
  return view;
}

createRoot(formulaRootElement).render(<MathPlayground />);
createRoot(exerciseRootElement).render(
  <SafeLatexWorkspace
    initialCode={exerciseCode}
    ariaLabel="Código del ejercicio de integración"
    objective="Escribe la respuesta"
    validationRules={exerciseRule}
    exerciseId="fixture-exercise"
  />,
);
createRoot(libraryRoot).render(<CopyCodeButton code={'\\documentclass{article}'} />);
