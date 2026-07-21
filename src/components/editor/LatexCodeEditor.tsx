import { useEffect, useRef, useState, useCallback } from 'react';
import { EditorView, lineNumbers } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { StreamLanguage } from '@codemirror/language';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { minimalSetup } from 'codemirror';

type EditorAction = 'copy' | 'clear' | 'restore';

const ACTION_LABELS: Record<EditorAction, string> = {
  copy: 'Copiar',
  clear: 'Limpiar',
  restore: 'Restaurar',
};

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

export interface LatexCodeEditorProps {
  initialCode: string;
  ariaLabel: string;
  readOnly?: boolean;
  className?: string;
  actions?: EditorAction[];
  onChange?: (code: string) => void;
}

export default function LatexCodeEditor({ initialCode, ariaLabel, readOnly = false, className = '', actions, onChange }: LatexCodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const initialCodeRef = useRef(initialCode);
  const onChangeRef = useRef(onChange);
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

    const editor = new EditorView({
      state: EditorState.create({
        doc: initialCode,
        extensions: [
          minimalSetup,
          lineNumbers(),
          StreamLanguage.define(stex),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged && onChangeRef.current) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            '&': {
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text)',
              minHeight: '120px',
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
              backgroundColor: 'transparent',
            },
            '&.cm-focused .cm-selectionBackground, & .cm-selectionBackground': {
              backgroundColor: 'var(--color-code-soft) !important',
            },
          }),
          EditorView.contentAttributes.of({
            'aria-label': ariaLabel,
            ...(readOnly ? { 'aria-readonly': 'true' } : {}),
          }),
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
        ],
      }),
      parent: editorRef.current,
    });

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
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
    });
  }, []);

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
    try {
      await navigator.clipboard.writeText(content);
      showCopyMessage('Código copiado');
    } catch {
      const prevActive = document.activeElement as HTMLElement | null;
      try {
        legacyCopy(content);
        showCopyMessage('Código copiado');
      } catch {
        showCopyMessage('No se pudo copiar el código');
      } finally {
        if (prevActive && document.contains(prevActive)) {
          prevActive.focus();
        }
      }
    }
  }, [getEditorContent, showCopyMessage]);

  const handleClear = useCallback(() => {
    if (readOnly) return;
    setEditorContent('');
    viewRef.current?.focus();
  }, [readOnly, setEditorContent]);

  const handleRestore = useCallback(() => {
    if (readOnly) return;
    setEditorContent(initialCodeRef.current);
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
        className={className}
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
        }
        .editor-actions {
          display: flex;
          align-items: center;
          gap: var(--space-xs, 0.5rem);
          margin-top: var(--space-xs, 0.5rem);
          flex-wrap: wrap;
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
