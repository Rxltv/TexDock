import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { getFriendlyKatexError } from '../../lib/latex/getFriendlyKatexError';
import {
  createMathSvg,
  downloadSvg,
  MAX_LATEX_EXPORT_LENGTH,
  MathSvgExportError,
} from '../../lib/latex/exportMathSvg';
import { mathExamples } from '../../lib/latex/mathExamples';
import type { MathExample } from '../../lib/latex/mathExamples';
import LatexCodeEditor, { copyTextToClipboard } from '../editor/LatexCodeEditor';

export const DEFAULT_EXPRESSION = '\\int_0^1 x^2\\,dx = \\frac{1}{3}';
const RENDER_DELAY = 200;

export interface MathPreviewResult {
  status: 'idle' | 'valid' | 'error';
  statusMessage: string;
  errorDetail: string | null;
  html: string;
}

export interface MathExampleSelection {
  input: string;
  previewInput: string;
  activeExampleId: string;
}

export function selectMathExample(example: MathExample): MathExampleSelection {
  return {
    input: example.latex,
    previewInput: example.latex,
    activeExampleId: example.id,
  };
}

export function renderMathPreview(expr: string): MathPreviewResult {
  if (!expr.trim()) {
    return {
      status: 'idle',
      statusMessage: 'Escribe una expresión LaTeX para visualizarla',
      errorDetail: null,
      html: '',
    };
  }

  try {
    return {
      status: 'valid',
      statusMessage: 'Expresión válida',
      errorDetail: null,
      html: katex.renderToString(expr, {
        displayMode: true,
        throwOnError: true,
        output: 'htmlAndMathml',
        trust: false,
        strict: 'warn',
      }),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    const friendly = getFriendlyKatexError(message);
    return {
      status: 'error',
      statusMessage: friendly.friendly,
      errorDetail: friendly.technical,
      html: '',
    };
  }
}

export function canExportCurrentExpression(
  input: string,
  previewInput: string,
  previewStatus: MathPreviewResult['status'],
  isExporting: boolean,
): boolean {
  return input.trim().length > 0
    && input.length <= MAX_LATEX_EXPORT_LENGTH
    && input === previewInput
    && previewStatus === 'valid'
    && !isExporting;
}

export default function MathPlayground() {
  const [input, setInput] = useState(DEFAULT_EXPRESSION);
  const [previewInput, setPreviewInput] = useState(DEFAULT_EXPRESSION);
  const [activeExampleId, setActiveExampleId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationFrameRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setPreviewInput(input);
    }, RENDER_DELAY);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [input]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
      if (generationFrameRef.current !== null) {
        cancelAnimationFrame(generationFrameRef.current);
      }
    };
  }, []);

  const showActionMessage = useCallback((message: string, clearAfter = 0) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    if (!mountedRef.current) return;
    setActionMessage(message);
    if (clearAfter > 0) {
      feedbackTimerRef.current = setTimeout(() => {
        if (mountedRef.current) setActionMessage(null);
        feedbackTimerRef.current = null;
      }, clearAfter);
    }
  }, []);

  const handleExampleClick = (ex: typeof mathExamples[number]) => {
    const selection = selectMathExample(ex);
    setInput(selection.input);
    setPreviewInput(selection.previewInput);
    setActiveExampleId(selection.activeExampleId);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  };

  const preview = useMemo(() => renderMathPreview(previewInput), [previewInput]);
  const canExport = canExportCurrentExpression(
    input,
    previewInput,
    preview.status,
    isExporting,
  );

  const handleCopy = useCallback(async () => {
    const copied = await copyTextToClipboard(input);
    showActionMessage(
      copied ? 'LaTeX copiado' : 'No se pudo copiar la fórmula. Selecciona el contenido e inténtalo de nuevo.',
      2_500,
    );
  }, [input, showActionMessage]);

  const handleDownload = useCallback(async () => {
    if (!canExport) return;

    setIsExporting(true);
    showActionMessage('Generando SVG…');
    try {
      await new Promise<void>((resolve) => {
        generationFrameRef.current = requestAnimationFrame(() => {
          generationFrameRef.current = null;
          resolve();
        });
      });
      if (!mountedRef.current) return;
      const svg = await createMathSvg(input);
      if (!mountedRef.current) return;
      downloadSvg(svg);
      showActionMessage('SVG descargado', 2_500);
    } catch (error) {
      const message = error instanceof MathSvgExportError
        ? error.message
        : 'No se pudo generar el SVG. Revisa la fórmula e inténtalo de nuevo.';
      showActionMessage(message, 4_000);
    } finally {
      if (mountedRef.current) setIsExporting(false);
    }
  }, [canExport, input, showActionMessage]);

  return (
    <div className="math-playground">
      <header className="playground-heading">
        <h1>Fórmulas LaTeX</h1>
        <p>Escribe, visualiza y descarga fórmulas en SVG.</p>
      </header>

      <div className="playground-layout">
        <section className="input-panel" aria-labelledby="latex-input-label">
          <h2 className="input-label" id="latex-input-label">
            Expresión LaTeX
          </h2>
          <LatexCodeEditor
            initialCode={DEFAULT_EXPRESSION}
            value={input}
            ariaLabel="Expresión LaTeX"
            onChange={(code) => {
              setInput(code);
              setActiveExampleId(null);
            }}
          />
        </section>

        <section className="preview-panel">
          <div
            className="preview-container"
            aria-label="Vista previa de la expresión"
            role="img"
            dangerouslySetInnerHTML={{ __html: preview.html }}
          />
        </section>
      </div>

      <div
        className="status-message"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {actionMessage ? (
          <span className={isExporting ? 'status-generating' : 'status-action'}>
            {actionMessage}
          </span>
        ) : preview.status === 'idle' ? (
          <span className="status-idle">{preview.statusMessage}</span>
        ) : preview.status === 'valid' ? (
          <span className="status-valid">{preview.statusMessage}</span>
        ) : (
          <div className="status-error">
            <p>{preview.statusMessage}</p>
            {preview.errorDetail && (
              <details>
                <summary>Detalle técnico</summary>
                <pre>{preview.errorDetail}</pre>
              </details>
            )}
          </div>
        )}
      </div>

      <div className="formula-actions" aria-label="Acciones de la fórmula">
        <button type="button" className="formula-action-btn" onClick={handleCopy}>
          Copiar LaTeX
        </button>
        <button
          type="button"
          className="formula-action-btn formula-action-btn--primary"
          disabled={!canExport}
          onClick={handleDownload}
        >
          {isExporting ? 'Generando SVG…' : 'Descargar SVG'}
        </button>
      </div>

      <section className="examples-section" aria-labelledby="examples-heading">
        <h2 id="examples-heading">Ejemplos rápidos</h2>
        <div className="examples-grid">
          {mathExamples.map((ex) => (
            <button
              key={ex.id}
              type="button"
              className="example-btn"
              aria-pressed={activeExampleId === ex.id}
              aria-label={`${ex.label}: ${ex.description}`}
              onClick={() => handleExampleClick(ex)}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
