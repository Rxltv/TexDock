import { useId } from 'react';
import type { SafeLatexPreviewResult } from '../../lib/latex/safeLatexPreview';
import { getStatusMessage } from '../../lib/latex/previewDisplay';
import type { PreviewDisplayKind } from '../../lib/latex/previewDisplay';

export interface SafeLatexPreviewPanelProps {
  result: SafeLatexPreviewResult;
  lastValidResult: SafeLatexPreviewResult | null;
}

export default function SafeLatexPreviewPanel({
  result,
  lastValidResult,
}: SafeLatexPreviewPanelProps) {
  const id = useId();
  const headingId = `${id}-heading`;

  const hasErrors = result.errors.length > 0;
  const hasUnsupported = result.unsupportedCommands.length > 0;
  const hasParagraphs = result.paragraphs.length > 0;
  const showLastValid = hasErrors && lastValidResult !== null && lastValidResult.paragraphs.length > 0;

  const displayKind: PreviewDisplayKind = hasErrors
    ? 'invalid'
    : hasUnsupported
      ? 'unsupported'
      : hasParagraphs
        ? 'valid'
        : 'empty';

  const statusMessage = getStatusMessage(displayKind);

  return (
    <div
      className="preview-panel"
      role="region"
      aria-labelledby={headingId}
    >
      <h4 className="preview-heading" id={headingId}>Vista previa</h4>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>

      {hasErrors && (
        <div className="preview-errors">
          <p className="preview-errors-title">Revisa el documento</p>
          <ul className="preview-errors-list">
            {result.errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {hasUnsupported && (
        <div className="preview-unsupported">
          <p className="preview-unsupported-title">Función no disponible</p>
          <p className="preview-unsupported-message">
            Esta función todavía no está disponible en la vista previa de TexDock.
          </p>
          {result.unsupportedCommands.length > 0 && (
            <p className="preview-unsupported-commands">
              Comandos detectados: {result.unsupportedCommands.map((cmd) => `\\${cmd.slice(1)}`).join(', ')}
            </p>
          )}
        </div>
      )}

      {showLastValid && (
        <div className="preview-last-valid">
          <p className="preview-last-valid-label">Última vista previa válida (no representa el código actual):</p>
          {lastValidResult.paragraphs.map((paragraph, i) => (
            <p key={i} className="preview-paragraph">{paragraph}</p>
          ))}
        </div>
      )}

      {hasParagraphs && (
        <div className="preview-content">
          {result.paragraphs.map((paragraph, i) => (
            <p key={i} className="preview-paragraph">{paragraph}</p>
          ))}
        </div>
      )}

      {displayKind === 'empty' && (
        <div className="preview-empty">
          <p className="preview-empty-title">Documento vacío</p>
          <p className="preview-empty-message">
            El cuerpo del documento está vacío. Escribe texto entre {'\\begin{document}'} y {'\\end{document}'}.
          </p>
        </div>
      )}

      {displayKind === 'valid' && (
        <div className="preview-valid">
          <span className="preview-valid-text">Vista previa actualizada</span>
        </div>
      )}

      <style>{`
        .preview-panel {
          font-size: 0.9375rem;
          line-height: 1.6;
          color: var(--color-text);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .preview-heading {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin: 0 0 var(--space-xs, 0.5rem);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }
        .preview-paragraph {
          margin: 0 0 var(--space-xs, 0.5rem);
        }
        .preview-paragraph:last-child {
          margin-bottom: 0;
        }
        .preview-errors {
          background: var(--color-bg);
          border: 1px solid var(--color-danger);
          border-radius: var(--radius-sm, 4px);
          padding: var(--space-sm, 0.5rem);
          margin-bottom: var(--space-sm, 0.5rem);
          flex-shrink: 0;
        }
        .preview-errors-title {
          font-weight: 600;
          color: var(--color-danger);
          margin: 0 0 var(--space-xs, 0.25rem);
        }
        .preview-errors-list {
          margin: 0;
          padding-left: 1.25rem;
          color: var(--color-danger);
        }
        .preview-errors-list li {
          margin-bottom: 0.25rem;
        }
        .preview-unsupported {
          background: var(--color-bg);
          border: 1px solid var(--color-warning);
          border-radius: var(--radius-sm, 4px);
          padding: var(--space-sm, 0.5rem);
          margin-bottom: var(--space-sm, 0.5rem);
          flex-shrink: 0;
        }
        .preview-unsupported-title {
          font-weight: 600;
          color: var(--color-warning);
          margin: 0 0 var(--space-xs, 0.25rem);
        }
        .preview-unsupported-message {
          color: var(--color-warning);
          margin: 0 0 var(--space-xs, 0.25rem);
        }
        .preview-unsupported-commands {
          color: var(--color-warning);
          margin: 0;
          font-family: var(--font-mono);
          font-size: 0.8125rem;
        }
        .preview-last-valid {
          background: var(--color-bg);
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-sm, 4px);
          padding: var(--space-sm, 0.5rem);
          margin-bottom: var(--space-sm, 0.5rem);
          flex-shrink: 0;
        }
        .preview-last-valid-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin: 0 0 var(--space-xs, 0.25rem);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .preview-empty {
          color: var(--color-text-secondary);
        }
        .preview-empty-title {
          font-weight: 600;
          margin: 0 0 var(--space-xs, 0.25rem);
        }
        .preview-empty-message {
          margin: 0;
          font-style: italic;
        }
        .preview-valid {
          margin-top: var(--space-xs, 0.25rem);
          flex-shrink: 0;
        }
        .preview-valid-text {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-success);
          text-transform: uppercase;
          letter-spacing: 0.05em;
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
