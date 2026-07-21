import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import LatexCodeEditor from './LatexCodeEditor';
import SafeLatexPreviewPanel from '../preview/SafeLatexPreviewPanel';
import { parseSafeLatexPreview } from '../../lib/latex/safeLatexPreview';
import type { SafeLatexPreviewResult } from '../../lib/latex/safeLatexPreview';

type EditorAction = 'copy' | 'clear' | 'restore';

export interface SafeLatexWorkspaceProps {
  initialCode: string;
  ariaLabel: string;
  actions?: EditorAction[];
  readOnly?: boolean;
}

export default function SafeLatexWorkspace({
  initialCode,
  ariaLabel,
  actions,
  readOnly = false,
}: SafeLatexWorkspaceProps) {
  const [debouncedCode, setDebouncedCode] = useState(initialCode);
  const rawCodeRef = useRef(initialCode);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastValidRef = useRef<SafeLatexPreviewResult | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleChange = useCallback((newCode: string) => {
    rawCodeRef.current = newCode;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setDebouncedCode(newCode);
    }, 250);
  }, []);

  const result = useMemo(() => parseSafeLatexPreview(debouncedCode), [debouncedCode]);

  useEffect(() => {
    if (result.valid && result.paragraphs.length > 0) {
      lastValidRef.current = result;
    }
  }, [result]);

  const lastValid = lastValidRef.current;

  return (
    <div className="safe-latex-workspace" role="group" aria-label="Espacio de trabajo LaTeX">
      <div className="workspace-editor-section">
        <LatexCodeEditor
          initialCode={initialCode}
          ariaLabel={ariaLabel}
          readOnly={readOnly}
          actions={actions}
          onChange={handleChange}
        />
      </div>
      <div className="workspace-preview-section">
        <SafeLatexPreviewPanel
          result={result}
          lastValidResult={result.valid ? null : lastValid}
        />
      </div>
      <style>{`
        .safe-latex-workspace {
          display: flex;
          flex-direction: column;
          gap: var(--space-md, 1rem);
        }
        .workspace-preview-section {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm, 4px);
          padding: var(--space-md, 0.75rem);
          background: var(--color-surface);
          min-height: 6rem;
        }
      `}</style>
    </div>
  );
}
