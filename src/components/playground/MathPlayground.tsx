import { useState, useRef, useEffect, useCallback } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { getFriendlyKatexError } from '../../lib/latex/getFriendlyKatexError';
import { mathExamples } from '../../lib/latex/mathExamples';

const DEFAULT_EXPRESSION = '\\int_0^1 x^2\\,dx = \\frac{1}{3}';
const RENDER_DELAY = 200;

export default function MathPlayground() {
  const [input, setInput] = useState(DEFAULT_EXPRESSION);
  const [status, setStatus] = useState<'idle' | 'valid' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [activeExampleId, setActiveExampleId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const renderExpression = useCallback((expr: string) => {
    const container = previewRef.current;
    if (!container) return;

    container.innerHTML = '';

    if (!expr.trim()) {
      setStatus('idle');
      setStatusMessage('Escribe una expresión LaTeX para visualizarla');
      setErrorDetail(null);
      return;
    }

    try {
      katex.render(expr, container, {
        displayMode: true,
        throwOnError: true,
        output: 'htmlAndMathml',
        trust: false,
        strict: 'warn',
      });
      setStatus('valid');
      setStatusMessage('Expresión válida');
      setErrorDetail(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      const friendly = getFriendlyKatexError(msg);
      container.innerHTML = '';
      setStatus('error');
      setStatusMessage(friendly.friendly);
      setErrorDetail(friendly.technical);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      renderExpression(input);
    }, RENDER_DELAY);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [input, renderExpression]);

  useEffect(() => {
    renderExpression(DEFAULT_EXPRESSION);
  }, []);

  const handleExampleClick = (ex: typeof mathExamples[number]) => {
    setInput(ex.latex);
    setActiveExampleId(ex.id);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    renderExpression(ex.latex);
  };

  return (
    <div className="math-playground">
      <h1>Práctica LaTeX</h1>

      <div className="playground-layout">
        <section className="input-panel">
          <label htmlFor="latex-input" id="latex-input-label">
            Expresión LaTeX
          </label>
          <textarea
            id="latex-input"
            value={input}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            spellCheck={false}
            aria-labelledby="latex-input-label"
          />
        </section>

        <section className="preview-panel">
          <div
            ref={previewRef}
            className="preview-container"
            aria-label="Vista previa de la expresión"
            role="img"
          />
        </section>
      </div>

      <div
        className="status-message"
        role="status"
        aria-live="polite"
      >
        {status === 'idle' && (
          <span className="status-idle">{statusMessage}</span>
        )}
        {status === 'valid' && (
          <span className="status-valid">{statusMessage}</span>
        )}
        {status === 'error' && (
          <div className="status-error">
            <p>{statusMessage}</p>
            {errorDetail && (
              <details>
                <summary>Detalle técnico</summary>
                <pre>{errorDetail}</pre>
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
