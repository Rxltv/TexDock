import { useEffect, useRef, useState } from 'react';
import {
  BUSYTEX_REMOTE_ENDPOINT,
  BusyTeXCompiler,
  DEFAULT_DOCUMENT,
} from '../../lib/editor/busytexCompiler';

type CompilerStatus = 'initializing' | 'ready' | 'compiling' | 'success' | 'failure';

export interface EditorCompilerCoreProps {
  assetBasePath: string;
}

export default function EditorCompilerCore({ assetBasePath }: EditorCompilerCoreProps) {
  const [source, setSource] = useState(DEFAULT_DOCUMENT);
  const [status, setStatus] = useState<CompilerStatus>('initializing');
  const [engineReady, setEngineReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Inicializando compilador…');
  const [initializationMs, setInitializationMs] = useState<number | null>(null);
  const [compileMs, setCompileMs] = useState<number | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const compilerRef = useRef<BusyTeXCompiler | null>(null);
  const pdfUrlRef = useRef<string | null>(null);

  function clearPdf() {
    if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    pdfUrlRef.current = null;
    setPdfUrl(null);
  }

  useEffect(() => {
    let active = true;
    setEngineReady(false);
    const compiler = new BusyTeXCompiler({
      assetBasePath,
      remoteEndpoint: BUSYTEX_REMOTE_ENDPOINT,
      onDownloadProgress: (percent) => {
        if (active) setStatusMessage(`Inicializando compilador… ${percent}%`);
      },
    });
    compilerRef.current = compiler;
    const started = performance.now();

    compiler.initialize()
      .then(() => {
        if (!active) return;
        setInitializationMs(performance.now() - started);
        setEngineReady(true);
        setStatus('ready');
        setStatusMessage('Listo');
      })
      .catch(() => {
        if (!active) return;
        setEngineReady(false);
        setStatus('failure');
        setStatusMessage('No se pudo inicializar el compilador.');
      });

    return () => {
      active = false;
      compiler.terminate();
      compilerRef.current = null;
      clearPdf();
    };
  }, [assetBasePath]);

  async function handleCompile() {
    const compiler = compilerRef.current;
    if (!compiler || !engineReady || status === 'compiling') return;

    setStatus('compiling');
    setStatusMessage('Compilando…');
    const started = performance.now();
    try {
      const result = await compiler.compile(source);
      setCompileMs(performance.now() - started);
      if (!result.success || !result.pdf) {
        clearPdf();
        setStatus('failure');
        setStatusMessage('Compilación fallida.');
        return;
      }

      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
      const pdfBytes = new Uint8Array(result.pdf);
      const nextPdfUrl = URL.createObjectURL(new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }));
      pdfUrlRef.current = nextPdfUrl;
      setPdfUrl(nextPdfUrl);
      setStatus('success');
      setStatusMessage('PDF generado');
    } catch {
      setCompileMs(performance.now() - started);
      clearPdf();
      setStatus('failure');
      setStatusMessage('Compilación fallida.');
    }
  }

  const busy = !engineReady || status === 'compiling';

  return (
    <section className="editor-compiler-core" aria-labelledby="editor-core-title">
      <div className="editor-core-heading">
        <div>
          <p className="editor-core-kicker">Fase 2B</p>
          <h1 id="editor-core-title">Compilador LaTeX</h1>
          <p>Prueba mínima de pdfLaTeX real en un Web Worker.</p>
        </div>
        <span className="editor-core-engine">BusyTeX · pdfLaTeX</span>
      </div>

      <div className="editor-core-panel">
        <label htmlFor="main-tex">main.tex</label>
        <textarea
          id="main-tex"
          value={source}
          onChange={(event) => setSource(event.target.value)}
          spellCheck={false}
          aria-describedby="editor-core-status"
        />
        <button type="button" onClick={handleCompile} disabled={busy}>
          Compilar
        </button>
      </div>

      <p
        id="editor-core-status"
        className={`editor-core-status editor-core-status--${status}`}
        role="status"
        aria-live="polite"
      >
        {statusMessage}
        {initializationMs !== null && status !== 'initializing' ? ` · motor ${initializationMs.toFixed(0)} ms` : ''}
        {compileMs !== null && status !== 'initializing' ? ` · compilación ${compileMs.toFixed(0)} ms` : ''}
      </p>

      {pdfUrl && status === 'success' && (
        <div className="editor-core-result">
          <p>PDF generado correctamente.</p>
          <a href={pdfUrl} target="_blank" rel="noreferrer">Abrir PDF</a>
        </div>
      )}

      <style>{`
        .editor-compiler-core {
          width: min(100% - 2rem, 58rem);
          margin: 0 auto;
          padding: var(--space-xl) 0;
        }
        .editor-core-heading {
          align-items: flex-start;
          display: flex;
          gap: var(--space-md);
          justify-content: space-between;
          margin-bottom: var(--space-lg);
        }
        .editor-core-kicker,
        .editor-core-engine {
          color: var(--color-text-secondary);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .editor-core-kicker { margin: 0 0 var(--space-xs); }
        .editor-core-heading h1 {
          font-family: var(--font-mono);
          font-size: clamp(1.6rem, 4vw, 2.5rem);
          margin: 0;
        }
        .editor-core-heading p:last-child { color: var(--color-text-secondary); margin-bottom: 0; }
        .editor-core-engine { border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--space-xs) var(--space-sm); }
        .editor-core-panel {
          background: var(--color-surface);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          padding: var(--space-md);
        }
        .editor-core-panel label { font-family: var(--font-mono); font-weight: 700; }
        .editor-core-panel textarea {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          box-sizing: border-box;
          color: var(--color-text);
          font: 0.95rem/1.55 var(--font-mono);
          min-height: 16rem;
          padding: var(--space-md);
          resize: vertical;
          width: 100%;
        }
        .editor-core-panel textarea:focus-visible,
        .editor-core-panel button:focus-visible,
        .editor-core-result a:focus-visible {
          outline: 2px solid var(--color-focus);
          outline-offset: 2px;
        }
        .editor-core-panel button,
        .editor-core-result a {
          align-self: flex-start;
          background: var(--color-practice-soft);
          border: 1px solid var(--color-practice);
          border-radius: var(--radius-sm);
          color: var(--color-text);
          cursor: pointer;
          font: inherit;
          font-weight: 700;
          padding: var(--space-sm) var(--space-md);
          text-decoration: none;
        }
        .editor-core-panel button:disabled { cursor: wait; opacity: 0.6; }
        .editor-core-status { min-height: 1.5rem; margin: var(--space-md) 0; }
        .editor-core-status--failure { color: var(--color-danger); }
        .editor-core-status--success { color: var(--color-success); }
        .editor-core-result { border-left: 3px solid var(--color-success); padding-left: var(--space-md); }
        .editor-core-result p { margin-top: 0; }
        @media (max-width: 42rem) {
          .editor-core-heading { display: block; }
          .editor-core-engine { display: inline-block; margin-top: var(--space-sm); }
        }
      `}</style>
    </section>
  );
}
