import { createRoot } from 'react-dom/client';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import LatexCodeEditor from '../../components/editor/LatexCodeEditor';

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
};

const root = document.getElementById('root');
if (!root) throw new Error('Falta el contenedor React del fixture.');

createRoot(root).render(
  <LatexCodeEditor
    initialCode={browserTestInitialCode}
    ariaLabel="Editor LaTeX de integración"
    actions={['copy', 'clear', 'restore']}
    onChange={(code) => changes.push(code)}
  />,
);
