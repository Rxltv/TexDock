export const MAX_LATEX_EXPORT_LENGTH = 2_000;
export const DEFAULT_SVG_FILENAME = 'formula-texdock.svg';

type MathSvgExportErrorCode =
  | 'EMPTY_EXPRESSION'
  | 'EXPRESSION_TOO_LONG'
  | 'UNSAFE_EXPRESSION'
  | 'MATHJAX_UNAVAILABLE'
  | 'INVALID_SVG'
  | 'UNSAFE_SVG'
  | 'DOWNLOAD_FAILED';

export class MathSvgExportError extends Error {
  readonly code: MathSvgExportErrorCode;

  constructor(code: MathSvgExportErrorCode, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'MathSvgExportError';
    this.code = code;
  }
}

interface MathJaxSvgRuntime {
  convertLatexToSvg(latex: string): Promise<SVGSVGElement>;
}

const BLOCKED_TEX_COMMANDS = new RegExp(
  String.raw`\\(?:href|url|includegraphics|require|autoload|htmlClass|htmlId|htmlStyle|class|cssId|style|bbox|color|definecolor|input|include|openin|openout|read|write|special|directlua|javascript)\b`,
  'i',
);

const ALLOWED_SVG_ELEMENTS = new Set([
  'svg',
  'defs',
  'g',
  'path',
  'use',
  'rect',
  'line',
  'polyline',
  'polygon',
  'circle',
  'ellipse',
  'title',
  'desc',
]);

const REMOTE_OR_DANGEROUS_URL = /(?:javascript\s*:|data\s*:|https?\s*:|\/\/)/i;
const DANGEROUS_STYLE = /(?:url\s*\(|@import|expression\s*\(|javascript\s*:|-moz-binding|background\s*:)/i;

let mathJaxPromise: Promise<MathJaxSvgRuntime> | null = null;

export function isMathJaxSvgRuntimeLoaded(): boolean {
  return mathJaxPromise !== null;
}

function reportDevelopmentFailure(stage: string, error: unknown): void {
  if (!import.meta.env.DEV) return;

  const originalError = error instanceof Error && error.cause
    ? error.cause
    : error;
  const stack = originalError instanceof Error ? originalError.stack : undefined;
  console.error(
    `[TexDock] Falló la exportación SVG durante ${stage}.`,
    originalError,
    stack,
  );
}

function validateLatexInput(latex: string): void {
  if (!latex.trim()) {
    throw new MathSvgExportError(
      'EMPTY_EXPRESSION',
      'Escribe una fórmula antes de descargarla.',
    );
  }
  if (latex.length > MAX_LATEX_EXPORT_LENGTH) {
    throw new MathSvgExportError(
      'EXPRESSION_TOO_LONG',
      `La fórmula supera el límite de ${MAX_LATEX_EXPORT_LENGTH} caracteres.`,
    );
  }
  if (BLOCKED_TEX_COMMANDS.test(latex)) {
    throw new MathSvgExportError(
      'UNSAFE_EXPRESSION',
      'La fórmula contiene un comando no permitido para la exportación.',
    );
  }
}

async function initializeMathJax(): Promise<MathJaxSvgRuntime> {
  try {
    const runtime = await import('./mathJaxSvgRuntime');
    if (typeof runtime.convertLatexToSvg !== 'function') {
      throw new Error('MathJax no expuso la API de conversión esperada.');
    }
    return runtime;
  } catch (error) {
    reportDevelopmentFailure('la carga e inicialización del runtime de MathJax', error);
    throw new MathSvgExportError(
      'MATHJAX_UNAVAILABLE',
      'No se pudo cargar el generador SVG. Inténtalo de nuevo.',
      error,
    );
  }
}

async function loadMathJax(): Promise<MathJaxSvgRuntime> {
  if (!mathJaxPromise) {
    mathJaxPromise = initializeMathJax().catch((error) => {
      mathJaxPromise = null;
      throw error;
    });
  }
  return mathJaxPromise;
}

function hasValidViewBox(svg: SVGSVGElement): boolean {
  const values = (svg.getAttribute('viewBox') ?? '')
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  return values.length === 4
    && values.every(Number.isFinite)
    && values[2] > 0
    && values[3] > 0;
}

function forceBlackFormula(svg: SVGSVGElement): void {
  svg.removeAttribute('style');
  svg.setAttribute('color', 'black');
  svg.setAttribute('fill', 'black');

  for (const element of svg.querySelectorAll('*')) {
    element.removeAttribute('style');
    if (element.hasAttribute('color')) element.setAttribute('color', 'black');

    const fill = element.getAttribute('fill');
    if (fill && !/^(?:none|transparent)$/i.test(fill)) {
      element.setAttribute('fill', 'black');
    }

    const stroke = element.getAttribute('stroke');
    if (stroke && !/^(?:none|transparent)$/i.test(stroke)) {
      element.setAttribute('stroke', 'black');
    }
  }
}

export function validateMathSvg(svg: SVGSVGElement): void {
  if (svg.localName.toLowerCase() !== 'svg') {
    throw new MathSvgExportError('INVALID_SVG', 'La salida generada no es un SVG válido.');
  }
  if (svg.namespaceURI !== 'http://www.w3.org/2000/svg') {
    throw new MathSvgExportError('INVALID_SVG', 'El SVG no utiliza el espacio de nombres esperado.');
  }
  if (svg.getAttribute('xmlns') !== 'http://www.w3.org/2000/svg' || !hasValidViewBox(svg)) {
    throw new MathSvgExportError('INVALID_SVG', 'El SVG generado no contiene un viewBox válido.');
  }

  for (const element of [svg, ...svg.querySelectorAll('*')]) {
    const tagName = element.localName.toLowerCase();
    if (!ALLOWED_SVG_ELEMENTS.has(tagName)) {
      throw new MathSvgExportError(
        'UNSAFE_SVG',
        `El SVG generado contiene un elemento no permitido: ${tagName}.`,
      );
    }

    if (
      tagName === 'rect'
      && (
        element.hasAttribute('data-background')
        || (
          element.parentNode === svg
          && element.getAttribute('width') === '100%'
          && element.getAttribute('height') === '100%'
        )
      )
    ) {
      throw new MathSvgExportError('UNSAFE_SVG', 'El SVG generado contiene un fondo no permitido.');
    }

    for (const attribute of element.getAttributeNames()) {
      const name = attribute.toLowerCase();
      const value = element.getAttribute(attribute) ?? '';

      if (name.startsWith('on')) {
        throw new MathSvgExportError('UNSAFE_SVG', 'El SVG contiene un atributo de evento.');
      }
      if (name === 'style' && DANGEROUS_STYLE.test(value)) {
        throw new MathSvgExportError('UNSAFE_SVG', 'El SVG contiene estilos no seguros.');
      }
      if (
        (name === 'href' || name === 'xlink:href')
        && !value.startsWith('#')
      ) {
        throw new MathSvgExportError('UNSAFE_SVG', 'El SVG contiene una referencia externa.');
      }
      if (
        name !== 'xmlns'
        && name !== 'xmlns:xlink'
        && REMOTE_OR_DANGEROUS_URL.test(value)
      ) {
        throw new MathSvgExportError('UNSAFE_SVG', 'El SVG contiene una URL no permitida.');
      }
    }
  }
}

export async function createMathSvg(latex: string): Promise<string> {
  validateLatexInput(latex);

  const mathJax = await loadMathJax();
  let generatedSvg: SVGSVGElement;
  try {
    generatedSvg = await mathJax.convertLatexToSvg(latex);
  } catch (error) {
    reportDevelopmentFailure('la conversión TeX → SVG', error);
    throw new MathSvgExportError(
      'INVALID_SVG',
      'No se pudo generar el SVG. Revisa la sintaxis de la fórmula.',
      error,
    );
  }

  try {
    if (!(generatedSvg instanceof SVGSVGElement)) {
      throw new MathSvgExportError(
        'INVALID_SVG',
        'MathJax no generó una raíz SVG reconocible.',
      );
    }

    const svg = generatedSvg.cloneNode(true) as SVGSVGElement;
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.removeAttribute('role');
    svg.removeAttribute('focusable');
    svg.removeAttribute('aria-hidden');
    forceBlackFormula(svg);
    validateMathSvg(svg);

    return new XMLSerializer().serializeToString(svg);
  } catch (error) {
    reportDevelopmentFailure('la validación de seguridad del SVG', error);
    if (error instanceof MathSvgExportError) throw error;
    throw new MathSvgExportError(
      'INVALID_SVG',
      'El SVG generado no pudo validarse.',
      error,
    );
  }
}

export interface SvgDownloadEnvironment {
  document: Pick<Document, 'body' | 'createElement'>;
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
}

function browserDownloadEnvironment(): SvgDownloadEnvironment {
  return {
    document,
    createObjectURL: URL.createObjectURL.bind(URL),
    revokeObjectURL: URL.revokeObjectURL.bind(URL),
  };
}

export function downloadSvg(
  svg: string,
  filename = DEFAULT_SVG_FILENAME,
  environment = browserDownloadEnvironment(),
): void {
  let objectUrl: string | null = null;
  let link: HTMLAnchorElement | null = null;

  try {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    objectUrl = environment.createObjectURL(blob);
    link = environment.document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    environment.document.body.appendChild(link);
    link.click();
  } catch (error) {
    reportDevelopmentFailure('la descarga del Blob', error);
    throw new MathSvgExportError(
      'DOWNLOAD_FAILED',
      'No se pudo iniciar la descarga del SVG.',
      error,
    );
  } finally {
    try {
      link?.remove();
    } finally {
      if (objectUrl) environment.revokeObjectURL(objectUrl);
    }
  }
}
