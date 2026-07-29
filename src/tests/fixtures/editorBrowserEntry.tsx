import { createRoot } from 'react-dom/client';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import LatexCodeEditor from '../../components/editor/LatexCodeEditor';
import {
  createMathSvg,
  isMathJaxSvgRuntimeLoaded,
} from '../../lib/latex/exportMathSvg';
import MathPlayground from '../../components/playground/MathPlayground';

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
    };
  }
}

const changes: string[] = [];

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
};

const root = document.getElementById('root');
if (!root) throw new Error('Falta el contenedor React del fixture.');
const formulaRoot = document.getElementById('formula-root');
if (!formulaRoot) throw new Error('Falta el contenedor de Fórmulas del fixture.');
const formulaRootElement: HTMLElement = formulaRoot;

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
