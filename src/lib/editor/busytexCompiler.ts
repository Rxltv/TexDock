import type {
  BusyTexRunner,
  CompileResult,
  PdfLatex,
} from 'texlyre-busytex';
import { classifyBusyTeXResult, type BusyTeXCompileResult } from './compilationResult';

export const BUSYTEX_REMOTE_ENDPOINT = 'https://texlive2026.texlyre.org/';
export const DEFAULT_DOCUMENT = `\\documentclass{article}

\\begin{document}
Hola desde TexDock.
\\end{document}
`;

export interface BusyTeXCompilerOptions {
  assetBasePath: string;
  remoteEndpoint?: string;
  onDownloadProgress?: (percent: number) => void;
}

type BusyTeXModule = typeof import('texlyre-busytex');

let busyTeXModulePromise: Promise<BusyTeXModule> | null = null;

function loadBusyTeX(): Promise<BusyTeXModule> {
  busyTeXModulePromise ??= import('texlyre-busytex');
  return busyTeXModulePromise;
}

export class BusyTeXCompiler {
  private readonly options: BusyTeXCompilerOptions;
  private runner: BusyTexRunner | null = null;
  private pdflatex: PdfLatex | null = null;
  private initialization: Promise<void> | null = null;

  constructor(options: BusyTeXCompilerOptions) {
    this.options = options;
  }

  async initialize(): Promise<void> {
    if (this.runner?.isInitialized()) return;
    if (this.initialization) return this.initialization;

    this.initialization = (async () => {
      const { BusyTexRunner, PdfLatex } = await loadBusyTeX();
      const base = this.options.assetBasePath.replace(/\/$/, '');
      this.runner = new BusyTexRunner({
        busytexBasePath: base,
        engineMode: 'combined',
        preloadDataPackages: [`${base}/texlive-basic.js`],
        catalogDataPackages: [],
        verbose: false,
        onDownloadProgress: ({ percent }) => this.options.onDownloadProgress?.(percent),
      });
      await this.runner.initialize(true);
      this.pdflatex = new PdfLatex(this.runner);
    })();

    try {
      await this.initialization;
    } catch (error) {
      this.initialization = null;
      this.runner = null;
      this.pdflatex = null;
      throw error;
    }
  }

  async compile(source: string): Promise<BusyTeXCompileResult> {
    if (!this.pdflatex) {
      throw new Error('BusyTeX no está listo.');
    }

    const result: CompileResult = await this.pdflatex.compile({
      input: source,
      mainTexPath: 'main.tex',
      remoteEndpoint: this.options.remoteEndpoint ?? BUSYTEX_REMOTE_ENDPOINT,
      shellEscape: false,
      verbose: 'silent',
    });
    return classifyBusyTeXResult(result);
  }

  terminate(): void {
    this.runner?.terminate();
    this.runner = null;
    this.pdflatex = null;
    this.initialization = null;
  }
}
