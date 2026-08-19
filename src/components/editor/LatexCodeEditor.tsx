import { useEffect, useRef, useState, useCallback } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, type ViewUpdate } from '@codemirror/view';
import { EditorState, Prec } from '@codemirror/state';
import {
  StreamLanguage,
  HighlightStyle,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
  bracketMatching,
} from '@codemirror/language';
import { indentWithTab } from '@codemirror/commands';
import { tags } from '@lezer/highlight';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { minimalSetup } from 'codemirror';
import {
  autocompletion,
  acceptCompletion,
  completionKeymap,
  completionStatus,
  currentCompletions,
  hasNextSnippetField,
  hasPrevSnippetField,
  nextSnippetField,
  prevSnippetField,
  selectedCompletion,
  selectedCompletionIndex,
  setSelectedCompletion,
  snippet,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete';
import { latexZoneDecorations } from '../../lib/editor/latexZoneDecorations';

// Paleta de sintaxis LaTeX basada en los tokens del proyecto (funciona en
// tema claro y oscuro sin duplicar definiciones).
const latexHighlightStyle = HighlightStyle.define([
  // Comandos LaTeX (\documentclass, \title, \maketitle...)
  { tag: tags.keyword, color: 'var(--color-code)', fontWeight: '600' },
  // \begin/\end, escapes (\\, \%) y estilo por defecto de comandos
  { tag: tags.tagName, color: 'var(--color-math)' },
  // Números, opciones (10pt, 12pt, T1, utf8) y argumentos de entorno
  { tag: tags.atom, color: 'var(--color-practice)' },
  // Argumentos de texto estructural
  { tag: tags.string, color: 'var(--color-math)' },
  // Comentarios %
  { tag: tags.comment, color: 'var(--color-text-secondary)', fontStyle: 'italic' },
  // Llaves y corchetes visibles pero neutros
  { tag: tags.bracket, color: 'var(--color-text)' },
  // Errores de sintaxis
  { tag: tags.invalid, color: 'var(--color-danger)' },
]);

type EditorAction = 'copy' | 'clear' | 'restore';

function createEnvironmentCompletion(environment: string, detail: string): Completion {
  const opening = `\\begin{${environment}}`;
  const closing = `\\end{${environment}}`;
  return {
    label: opening,
    type: 'keyword',
    detail,
    apply: (view, completion, from, to) => {
      const followingCode = view.state.sliceDoc(to);
      if (followingCode.trimStart().startsWith(closing)) {
        view.dispatch({
          changes: { from, to, insert: `${opening}\n  ` },
          selection: { anchor: from + opening.length + 3 },
        });
        return;
      }
      snippet(`${opening}\n  \${0}\n${closing}`)(view, completion, from, to);
    },
  };
}

export const LATEX_COMPLETIONS: Completion[] = [
  { label: '\\frac', type: 'function', detail: 'fracción' },
  { label: '\\sqrt', type: 'function', detail: 'raíz' },
  { label: '\\sum', type: 'function', detail: 'sumatoria' },
  { label: '\\int', type: 'function', detail: 'integral' },
  { label: '\\lim', type: 'function', detail: 'límite' },
  { label: '\\mathbf', type: 'function', detail: 'negrita matemática' },
  { label: '\\text', type: 'function', detail: 'texto matemático' },
  { label: '\\begin', type: 'keyword', detail: 'entorno' },
  { label: '\\end', type: 'keyword', detail: 'cierre' },
  { label: '\\documentclass', type: 'keyword', detail: 'clase de documento' },
  { label: '\\usepackage', type: 'keyword', detail: 'paquete' },
  { label: '\\left', type: 'function', detail: 'delimitador izquierdo' },
  { label: '\\right', type: 'function', detail: 'delimitador derecho' },
  createEnvironmentCompletion('equation', 'Entorno de ecuación'),
  createEnvironmentCompletion('aligned', 'Entorno alineado'),
  createEnvironmentCompletion('align', 'Entorno alineado'),
  createEnvironmentCompletion('matrix', 'Matriz'),
  createEnvironmentCompletion('pmatrix', 'Matriz con paréntesis'),
  createEnvironmentCompletion('bmatrix', 'Matriz con corchetes'),
  createEnvironmentCompletion('vmatrix', 'Matriz con barras'),
  createEnvironmentCompletion('array', 'Arreglo'),
  createEnvironmentCompletion('cases', 'Casos por tramos'),
  createEnvironmentCompletion('itemize', 'Lista con viñetas'),
  createEnvironmentCompletion('enumerate', 'Lista numerada'),
];

export function latexCompletionSource(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/\\[a-zA-Z]*$/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  return {
    from: word.from,
    options: LATEX_COMPLETIONS.filter((completion) => completion.label.startsWith(word.text)),
    validFor: /\\[a-zA-Z]*$/,
  };
}

function applyFirstLatexCompletion(view: EditorView): boolean {
  const head = view.state.selection.main.head;
  const before = view.state.sliceDoc(0, head);
  const match = before.match(/\\[a-zA-Z]*$/);
  if (!match) return false;
  const completion = LATEX_COMPLETIONS
    .filter((option) => option.label.startsWith(match[0]) && option.label !== match[0])
    .sort((left, right) => left.label.length - right.label.length)[0];
  if (!completion) return false;
  if (typeof completion.apply === 'function') {
    completion.apply(view, completion, head - match[0].length, head);
    return true;
  }
  const insert = typeof completion.apply === 'string' ? completion.apply : completion.label;
  view.dispatch({
    changes: { from: head - match[0].length, to: head, insert },
  });
  return true;
}

function indentForward(view: EditorView): boolean {
  if (hasNextSnippetField(view.state)) return nextSnippetField(view);
  return indentWithTab.run?.(view) ?? false;
}

function indentBackward(view: EditorView): boolean {
  if (hasPrevSnippetField(view.state)) return prevSnippetField(view);
  return indentWithTab.shift?.(view) ?? false;
}

const ACTION_LABELS: Record<EditorAction, string> = {
  copy: 'Copiar',
  clear: 'Limpiar',
  restore: 'Restaurar',
};

export function resolveEditorAction(
  action: Exclude<EditorAction, 'copy'>,
  initialCode: string,
  readOnly: boolean,
): string | null {
  if (readOnly) return null;
  return action === 'clear' ? '' : initialCode;
}

function legacyCopy(text: string): boolean {
  const doc = document as unknown as {
    execCommand(command: 'copy'): boolean;
  };
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return doc.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}

export async function copyEditorContent(
  text: string,
  writeClipboard: (content: string) => Promise<void>,
  fallbackCopy: (content: string) => boolean,
): Promise<boolean> {
  try {
    await writeClipboard(text);
    return true;
  } catch {
    try {
      return fallbackCopy(text);
    } catch {
      return false;
    }
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  const previousFocus = document.activeElement as HTMLElement | null;
  const writeClipboard = navigator.clipboard?.writeText
    ? navigator.clipboard.writeText.bind(navigator.clipboard)
    : async () => {
      throw new Error('Clipboard API no disponible');
    };

  try {
    return await copyEditorContent(text, writeClipboard, legacyCopy);
  } finally {
    if (previousFocus && document.contains(previousFocus)) {
      try {
        previousFocus.focus();
      } catch {
        // El elemento pudo dejar de aceptar foco durante la operación.
      }
    }
  }
}

export interface LatexCodeEditorProps {
  initialCode: string;
  value?: string;
  ariaLabel: string;
  readOnly?: boolean;
  className?: string;
  actions?: EditorAction[];
  enableAutocomplete?: boolean;
  onChange?: (code: string) => void;
}

export function getChangedEditorCode(update: Pick<ViewUpdate, 'docChanged' | 'state'>): string | null {
  return update.docChanged ? update.state.doc.toString() : null;
}

export function notifyEditorChange(
  update: Pick<ViewUpdate, 'docChanged' | 'state'>,
  onChange?: (code: string) => void,
): string | null {
  const code = getChangedEditorCode(update);
  if (code !== null) onChange?.(code);
  return code;
}

export interface LatexEditorStateOptions {
  initialCode: string;
  ariaLabel: string;
  readOnly: boolean;
  enableAutocomplete?: boolean;
  onChange?: (code: string) => void;
}

export function createLatexEditorState({
  initialCode,
  ariaLabel,
  readOnly,
  enableAutocomplete = false,
  onChange,
}: LatexEditorStateOptions): EditorState {
  return EditorState.create({
    doc: initialCode,
    extensions: [
      minimalSetup,
      lineNumbers(),
      highlightActiveLine(),
      bracketMatching(),
      StreamLanguage.define(stex),
      syntaxHighlighting(latexHighlightStyle),
      EditorView.lineWrapping,
      latexZoneDecorations(),
      ...(enableAutocomplete ? [
        indentUnit.of('  '),
        indentOnInput(),
        autocompletion({
          activateOnTyping: true,
          maxRenderedOptions: 8,
          selectOnOpen: true,
          override: [latexCompletionSource],
        }),
        Prec.high(EditorView.domEventHandlers({
          keydown(event, view) {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              const completions = currentCompletions(view.state);
              if (completionStatus(view.state) === 'active' && completions.length > 0) {
                const currentIndex = selectedCompletionIndex(view.state)
                  ?? (event.key === 'ArrowDown' ? -1 : completions.length);
                const direction = event.key === 'ArrowDown' ? 1 : -1;
                const nextIndex = (currentIndex + direction + completions.length) % completions.length;
                view.dispatch({ effects: setSelectedCompletion(nextIndex) });
                event.preventDefault();
                return true;
              }
            }
            if (event.key !== 'Enter' && event.key !== 'Tab') return false;
            const acceptsCompletion = event.key === 'Enter' || !event.shiftKey;
            if (acceptsCompletion && completionStatus(view.state) === 'active') {
              if (!selectedCompletion(view.state)) {
                view.dispatch({ effects: setSelectedCompletion(0) });
              }
              if (acceptCompletion(view)) {
                event.preventDefault();
                return true;
              }
            }
            if (event.key === 'Tab' && !event.shiftKey && applyFirstLatexCompletion(view)) {
              event.preventDefault();
              return true;
            }
            if (event.key === 'Tab' && (event.shiftKey ? indentBackward(view) : indentForward(view))) {
              event.preventDefault();
              return true;
            }
            if (!applyFirstLatexCompletion(view)) return false;
            event.preventDefault();
            return true;
          },
        })),
        Prec.high(keymap.of([
          { key: 'Enter', run: acceptCompletion },
          { key: 'Tab', run: indentForward, shift: indentBackward },
          ...completionKeymap,
        ])),
      ] : []),
      EditorView.updateListener.of((update) => {
        notifyEditorChange(update, onChange);
      }),
      EditorView.theme({
        '&': {
          backgroundColor: 'var(--color-bg)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-text)',
          minHeight: '120px',
          height: '100%',
          minWidth: '0',
          width: '100%',
          maxWidth: '100%',
        },
        '&.cm-focused': {
          outline: '2px solid var(--color-code)',
          outlineOffset: '-2px',
        },
        '.cm-scroller': {
          overflow: 'auto',
        },
        '.cm-content': {
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8125rem',
          lineHeight: '1.5',
          caretColor: 'var(--color-editor-caret)',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          color: 'var(--color-text-secondary)',
        },
        '.cm-activeLine': {
          backgroundColor: 'color-mix(in srgb, var(--color-surface-elevated) 65%, transparent)',
        },
        '&.cm-focused .cm-selectionBackground, & .cm-selectionBackground': {
          backgroundColor: 'var(--color-code-soft) !important',
        },
        '.cm-matchingBracket': {
          backgroundColor: 'var(--color-code-soft)',
          outline: '1px solid color-mix(in srgb, var(--color-code) 40%, transparent)',
        },
      }),
      EditorView.contentAttributes.of({
        'aria-label': ariaLabel,
        ...(readOnly ? { 'aria-readonly': 'true' } : {}),
      }),
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
    ],
  });
}

type CreateEditorView = (
  config: ConstructorParameters<typeof EditorView>[0],
) => EditorView;

export function mountLatexCodeEditor(
  parent: HTMLElement,
  state: EditorState,
  createView: CreateEditorView = (config) => new EditorView(config),
): EditorView {
  return createView({ state, parent });
}

export default function LatexCodeEditor({
  initialCode,
  value,
  ariaLabel,
  readOnly = false,
  className = '',
  actions,
  enableAutocomplete = false,
  onChange,
}: LatexCodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const initialCodeRef = useRef(initialCode);
  const onChangeRef = useRef(onChange);
  const applyingExternalValueRef = useRef(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    initialCodeRef.current = initialCode;
  }, [initialCode]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!editorRef.current) return;

    const editor = mountLatexCodeEditor(
      editorRef.current,
      createLatexEditorState({
        initialCode: value ?? initialCode,
        ariaLabel,
        readOnly,
        enableAutocomplete,
        onChange: (code) => {
          if (!applyingExternalValueRef.current) {
            onChangeRef.current?.(code);
          }
        },
      }),
    );

    viewRef.current = editor;

    return () => {
      editor.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    };
  }, []);

  const getEditorContent = useCallback((): string => {
    const view = viewRef.current;
    if (!view) return '';
    return view.state.doc.toString();
  }, []);

  const setEditorContent = useCallback((content: string) => {
    const view = viewRef.current;
    if (!view) return;
    if (view.state.doc.toString() === content) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
    });
  }, []);

  useEffect(() => {
    if (value !== undefined) {
      applyingExternalValueRef.current = true;
      try {
        setEditorContent(value);
      } finally {
        applyingExternalValueRef.current = false;
      }
    }
  }, [setEditorContent, value]);

  const showCopyMessage = useCallback((message: string) => {
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
    if (!mountedRef.current) return;
    setCopyMessage(message);
    copyTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setCopyMessage(null);
      }
      copyTimerRef.current = null;
    }, 2000);
  }, []);

  const handleCopy = useCallback(async () => {
    const content = getEditorContent();
    const prevActive = document.activeElement as HTMLElement | null;
    try {
      const copied = await copyEditorContent(
        content,
        (text) => navigator.clipboard.writeText(text),
        (text) => {
          const result = legacyCopy(text);
          if (prevActive && document.contains(prevActive)) {
            prevActive.focus();
          }
          return result;
        },
      );
      showCopyMessage(copied ? 'Código copiado' : 'No se pudo copiar el código');
    } catch {
      showCopyMessage('No se pudo copiar el código');
      if (prevActive && document.contains(prevActive)) {
        try {
          prevActive.focus();
        } catch {
          // El elemento pudo dejar de aceptar foco durante la operación.
        }
      }
    }
  }, [getEditorContent, showCopyMessage]);

  const handleClear = useCallback(() => {
    const nextCode = resolveEditorAction(
      'clear',
      initialCodeRef.current,
      readOnly,
    );
    if (nextCode === null) return;
    setEditorContent(nextCode);
    viewRef.current?.focus();
  }, [readOnly, setEditorContent]);

  const handleRestore = useCallback(() => {
    const nextCode = resolveEditorAction(
      'restore',
      initialCodeRef.current,
      readOnly,
    );
    if (nextCode === null) return;
    setEditorContent(nextCode);
    viewRef.current?.focus();
  }, [readOnly, setEditorContent]);

  const deduplicatedActions = actions
    ? actions.filter((a, i, arr) => arr.indexOf(a) === i)
    : [];

  const visibleActions = deduplicatedActions.filter(
    (a) => !readOnly || a === 'copy',
  );

  const hasActions = visibleActions.length > 0;

  return (
      <div className="latex-editor-wrapper">
        <div
          ref={editorRef}
          className={`editor-mount ${className}`}
          aria-label={readOnly ? `${ariaLabel} (solo lectura)` : ariaLabel}
        />
        {hasActions && (
          <div className="editor-actions" role="toolbar" aria-label="Acciones del editor">
            {visibleActions.map((action) => (
              <button
                key={action}
                type="button"
                className="editor-actions-btn"
                onClick={() => {
                  if (action === 'copy') handleCopy();
                  else if (action === 'clear') handleClear();
                  else if (action === 'restore') handleRestore();
                }}
              >
                {ACTION_LABELS[action]}
              </button>
            ))}
          </div>
        )}
        {hasActions && (
          <div
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {copyMessage}
          </div>
        )}
        <style>{`
          .latex-editor-wrapper {
            position: relative;
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            min-width: 0;
            width: 100%;
            max-width: 100%;
          }
          .editor-mount {
            flex: 1;
            min-height: 120px;
            min-width: 0;
            width: 100%;
            max-width: 100%;
            overflow: auto;
          }
          .editor-actions {
            display: flex;
            align-items: center;
            gap: var(--space-xs, 0.5rem);
            margin-top: var(--space-xs, 0.5rem);
            flex-wrap: wrap;
            flex-shrink: 0;
          }
          .editor-actions-btn {
            font-family: var(--font-sans);
            font-size: 0.8125rem;
            font-weight: 600;
            padding: var(--space-xs, 0.25rem) var(--space-sm, 0.5rem);
            background: var(--color-surface);
            color: var(--color-text);
            border: 1px solid var(--color-border);
            border-radius: var(--radius, 4px);
            cursor: pointer;
            line-height: 1.4;
          }
          .editor-actions-btn:hover {
            background: var(--color-bg);
            border-color: var(--color-text-secondary);
          }
          .editor-actions-btn:focus-visible {
            outline: 2px solid var(--color-code);
            outline-offset: 2px;
          }
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }
        `}</style>
      </div>
  );
}
