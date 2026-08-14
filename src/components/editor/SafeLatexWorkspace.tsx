import { useState, useRef, useEffect, useMemo, useCallback, useId } from 'react';
import LatexCodeEditor from './LatexCodeEditor';
import SafeLatexPreviewPanel from '../preview/SafeLatexPreviewPanel';
import { parseSafeLatexPreview } from '../../lib/latex/safeLatexPreview';
import type { SafeLatexPreviewResult } from '../../lib/latex/safeLatexPreview';
import { validateExercise } from '../../lib/exercises/validateExercise';
import type { ValidationRule, ValidationResult } from '../../lib/exercises/validateExercise';
import type { ObjectiveState } from '../../lib/latex/previewDisplay';
import { emitExerciseApproved } from '../../lib/progress/progressEvents';

type EditorAction = 'copy' | 'clear' | 'restore';

export interface SafeLatexWorkspaceProps {
  initialCode: string;
  ariaLabel: string;
  objective?: string;
  actions?: EditorAction[];
  readOnly?: boolean;
  validationRules?: ValidationRule[];
  successFeedback?: string;
  exerciseId?: string;
}

export function computeObjectiveState(
  validationResult: ValidationResult | null,
  docValid: boolean,
): ObjectiveState {
  if (!validationResult) {
    return { kind: 'not-applicable', messages: [] };
  }
  if (!docValid) {
    return {
      kind: 'pending',
      messages: validationResult.feedback.length > 0
        ? validationResult.feedback
        : ['Repara los errores del documento antes de completar el objetivo.'],
    };
  }
  if (validationResult.valid) {
    return { kind: 'fulfilled', messages: validationResult.feedback };
  }
  return {
    kind: 'pending',
    messages: validationResult.failedRules.map((rule) => rule.message),
  };
}

export interface SafeLatexWorkspaceSnapshot {
  result: SafeLatexPreviewResult;
  validationResult: ValidationResult | null;
  objectiveState: ObjectiveState;
}

export function buildSafeLatexWorkspaceSnapshot(
  code: string,
  validationRules?: ValidationRule[],
): SafeLatexWorkspaceSnapshot {
  const result = parseSafeLatexPreview(code);
  const validationResult = validationRules && validationRules.length > 0
    ? validateExercise(code, validationRules)
    : null;
  return {
    result,
    validationResult,
    objectiveState: computeObjectiveState(validationResult, result.valid),
  };
}

export default function SafeLatexWorkspace({
  initialCode,
  ariaLabel,
  objective,
  actions,
  readOnly = false,
  validationRules,
  successFeedback,
  exerciseId,
}: SafeLatexWorkspaceProps) {
  const objectiveHeadingId = `${useId()}-objective`;
  const [debouncedCode, setDebouncedCode] = useState(initialCode);
  const [checkedSnapshot, setCheckedSnapshot] = useState<SafeLatexWorkspaceSnapshot | null>(null);
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

  const { result } = useMemo(
    () => buildSafeLatexWorkspaceSnapshot(debouncedCode, validationRules),
    [debouncedCode, validationRules],
  );

  const checkedObjectiveState = checkedSnapshot?.objectiveState ?? {
    kind: 'pending' as const,
    messages: ['Escribe una respuesta y pulsa «Comprobar respuesta».'],
  };

  const handleCheck = useCallback(() => {
    const snapshot = buildSafeLatexWorkspaceSnapshot(rawCodeRef.current, validationRules);
    setCheckedSnapshot(snapshot);
    if (exerciseId && snapshot.validationResult?.valid && snapshot.result.valid) {
      emitExerciseApproved(exerciseId);
    }
  }, [exerciseId, validationRules]);

  useEffect(() => {
    if (
      result.valid
      && (
        result.paragraphs.length > 0
        || (result.previewBlocks?.length ?? 0) > 0
        || result.tables.length > 0
        || result.figures.length > 0
        || result.footnotes.length > 0
        || result.hasBibliography
        || result.citations.length > 0
        || result.references.length > 0
        || result.outline.length > 0
        || result.formattingUses.length > 0
      )
    ) {
      lastValidRef.current = result;
    }
  }, [result]);

  const lastValid = lastValidRef.current;

  return (
    <div className="safe-latex-workspace" role="group" aria-label="Espacio de trabajo LaTeX">
      {objective && checkedObjectiveState.kind !== 'not-applicable' && (
        <section
          className={`workspace-objective workspace-objective--${checkedObjectiveState.kind}`}
          aria-labelledby={objectiveHeadingId}
          aria-live="polite"
        >
          <div className="workspace-objective-copy">
            <p className="workspace-objective-label">Objetivo del ejercicio</p>
            <p className="workspace-objective-text">{objective}</p>
          </div>
          <div className="workspace-objective-status">
            <p
              className="workspace-objective-status-title"
              id={objectiveHeadingId}
            >
              {checkedObjectiveState.kind === 'fulfilled' ? 'Objetivo cumplido' : 'Objetivo pendiente'}
            </p>
            {checkedObjectiveState.kind === 'fulfilled' ? (
              <p className="workspace-objective-message">
                {successFeedback || checkedObjectiveState.messages[0] || 'Ejercicio completado correctamente.'}
              </p>
            ) : checkedObjectiveState.messages.length > 0 ? (
              <ul className="workspace-objective-requirements">
                {checkedObjectiveState.messages.map((message, index) => (
                  <li key={`${message}-${index}`}>{message}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      )}
      <div className="workspace-editor-section">
        <h4 className="workspace-section-heading">Editor</h4>
        <LatexCodeEditor
          initialCode={initialCode}
          ariaLabel={ariaLabel}
          readOnly={readOnly}
          actions={actions}
          onChange={handleChange}
        />
        {validationRules && validationRules.length > 0 && (
          <button type="button" className="workspace-check-button" onClick={handleCheck}>
            Comprobar respuesta
          </button>
        )}
      </div>
      <div className="workspace-preview-section">
        <SafeLatexPreviewPanel
          result={result}
          lastValidResult={result.valid ? null : lastValid}
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
        .workspace-objective {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(14rem, 0.75fr);
          gap: var(--space-md, 1rem);
          padding: var(--space-sm, 0.75rem) var(--space-md, 1rem);
          border: 1px solid var(--color-border-strong);
          border-left: 4px solid var(--color-practice);
          border-radius: var(--radius-sm, 4px);
          background: var(--color-bg);
        }
        .workspace-objective--fulfilled {
          border-left-color: var(--color-success);
        }
        .workspace-objective-copy,
        .workspace-objective-status {
          min-width: 0;
        }
        .workspace-objective-label,
        .workspace-objective-status-title {
          margin: 0 0 var(--space-xs, 0.25rem);
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .workspace-objective-label {
          color: var(--color-text-secondary);
        }
        .workspace-objective-status-title {
          color: var(--color-practice);
        }
        .workspace-objective--fulfilled .workspace-objective-status-title {
          color: var(--color-success);
        }
        .workspace-check-button {
          align-self: flex-start;
          margin-top: var(--space-sm, 0.5rem);
          padding: var(--space-xs, 0.25rem) var(--space-sm, 0.5rem);
          border: 1px solid var(--color-practice);
          border-radius: var(--radius, 6px);
          background: var(--color-practice-soft);
          color: var(--color-text);
          cursor: pointer;
          font-weight: 600;
        }
        .workspace-check-button:focus-visible {
          outline: 2px solid var(--color-focus);
          outline-offset: 2px;
        }
        .workspace-objective-text,
        .workspace-objective-message {
          margin: 0;
          line-height: 1.55;
          overflow-wrap: anywhere;
        }
        .workspace-objective-text {
          font-weight: 600;
        }
        .workspace-objective-message {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }
        .workspace-objective-requirements {
          margin: 0;
          padding-left: 1.2rem;
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .workspace-objective-requirements li + li {
          margin-top: 0.2rem;
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
          .workspace-objective {
            grid-template-columns: 1fr;
            gap: var(--space-sm, 0.5rem);
          }
        }
      `}</style>
    </div>
  );
}
