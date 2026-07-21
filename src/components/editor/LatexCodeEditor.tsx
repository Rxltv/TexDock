import { useEffect, useRef } from 'react';
import { EditorView, lineNumbers } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { StreamLanguage } from '@codemirror/language';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { minimalSetup } from 'codemirror';

export interface LatexCodeEditorProps {
  initialCode: string;
  ariaLabel: string;
  readOnly?: boolean;
  className?: string;
}

export default function LatexCodeEditor({ initialCode, ariaLabel, readOnly = false, className = '' }: LatexCodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

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
          EditorView.theme({
            '&': {
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text)',
            },
            '&.cm-focused': {
              outline: '2px solid var(--color-accent)',
              outlineOffset: '-2px',
            },
            '.cm-content': {
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8125rem',
              lineHeight: '1.5',
              caretColor: 'var(--color-accent)',
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
              backgroundColor: 'var(--color-accent-dim) !important',
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

  return (
    <div
      ref={editorRef}
      className={className}
      aria-label={readOnly ? `${ariaLabel} (solo lectura)` : ariaLabel}
    />
  );
}
