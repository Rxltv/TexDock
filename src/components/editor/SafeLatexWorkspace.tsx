import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import LatexCodeEditor from './LatexCodeEditor';
import SafeLatexPreviewPanel from '../preview/SafeLatexPreviewPanel';
import { parseSafeLatexPreview } from '../../lib/latex/safeLatexPreview';
import type { SafeLatexPreviewResult } from '../../lib/latex/safeLatexPreview';
import { validateExercise } from '../../lib/exercises/validateExercise';
import type { ValidationRule, ValidationResult } from '../../lib/exercises/validateExercise';
import type { ObjectiveState } from '../../lib/latex/previewDisplay';

type EditorAction = 'copy' | 'clear' | 'restore';

export interface SafeLatexWorkspaceProps {
  initialCode: string;
  ariaLabel: string;
  actions?: EditorAction[];
  readOnly?: boolean;
  validationRules?: ValidationRule[];
  successFeedback?: string;
}

function computeObjectiveState(
  validationResult: ValidationResult | null,
  docValid: boolean,
): ObjectiveState {
  if (!validationResult) {
    return { kind: 'not-applicable', messages: [] };
  }
  if (!docValid) {
    return { kind: 'not-applicable', messages: [] };
  }
  if (validationResult.valid) {
    return { kind: 'fulfilled', messages: validationResult.feedback };
  }
  const requiredFailed = validationResult.failedRules.filter(
    (r) => validationResult.unsupportedRules.some((u) => u.id === r.id) || true,
  );
  return { kind: 'pending', messages: requiredFailed.map((r) => r.message) };
}

export default function SafeLatexWorkspace({
  initialCode,
  ariaLabel,
  actions,
  readOnly = false,
  validationRules,
  successFeedback,
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

  const validationResult = useMemo(() => {
    if (!validationRules || validationRules.length === 0) return null;
    return validateExercise(debouncedCode, validationRules);
  }, [debouncedCode, validationRules]);

  const objectiveState = useMemo(
    () => computeObjectiveState(validationResult, result.valid),
    [validationResult, result.valid],
  );

  useEffect(() => {
    if (result.valid && result.paragraphs.length > 0) {
      lastValidRef.current = result;
    }
  }, [result]);

  const lastValid = lastValidRef.current;

  return (
    <div className="safe-latex-workspace" role="group" aria-label="Espacio de trabajo LaTeX">
      <div className="workspace-editor-section">
        <h4 className="workspace-section-heading">Editor</h4>
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
          objectiveState={objectiveState}
          successFeedback={successFeedback}
        />
      </div>
      <style>{`
        .safe-latex-workspace {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md, 1rem);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius, 6px);
          padding: var(--space-md, 1rem);
          min-height: 300px;
          align-items: stretch;
          background: var(--color-surface);
        }
        .workspace-section-heading {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--color-text-secondary);
          margin: 0 0 var(--space-sm, 0.5rem);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          flex-shrink: 0;
          padding: 0 var(--space-xs, 0.25rem);
        }
        .workspace-editor-section,
        .workspace-preview-section {
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 200px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm, 4px);
          padding: var(--space-sm, 0.5rem);
          word-break: break-word;
          overflow-wrap: break-word;
          background: var(--color-bg);
        }
        .workspace-preview-section {
          background: var(--color-surface);
        }
        @media (max-width: 768px) {
          .safe-latex-workspace {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}