import { useEffect, useRef, useState, useCallback } from 'react';
import { EditorView, lineNumbers, highlightActiveLine, type ViewUpdate } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { StreamLanguage, HighlightStyle, syntaxHighlighting, bracketMatching } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { minimalSetup } from 'codemirror';
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
    return fallbackCopy(text);
  }
}

export interface LatexCodeEditorProps {
  initialCode: string;
  value?: string;
  ariaLabel: string;
  readOnly?: boolean;
  className?: string;
  actions?: EditorAction[];
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
  onChange?: (code: string) => void;
}

export function createLatexEditorState({
  initialCode,
  ariaLabel,
  readOnly,
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
          width: '100%',
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
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {copyMessage}
        </div>
        <style>{`
          .latex-editor-wrapper {
            position: relative;
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            width: 100%;
          }
          .editor-mount {
            flex: 1;
            min-height: 120px;
            width: 100%;
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
