import { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { getFriendlyKatexError } from '../../lib/latex/getFriendlyKatexError';
import { mathExamples } from '../../lib/latex/mathExamples';
import type { MathExample } from '../../lib/latex/mathExamples';
import LatexCodeEditor from '../editor/LatexCodeEditor';

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

export default function MathPlayground() {
  const [input, setInput] = useState(DEFAULT_EXPRESSION);
  const [previewInput, setPreviewInput] = useState(DEFAULT_EXPRESSION);
  const [activeExampleId, setActiveExampleId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <div className="math-playground">
      <h1>Práctica LaTeX</h1>

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
      >
        {preview.status === 'idle' && (
          <span className="status-idle">{preview.statusMessage}</span>
        )}
        {preview.status === 'valid' && (
          <span className="status-valid">{preview.statusMessage}</span>
        )}
        {preview.status === 'error' && (
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
