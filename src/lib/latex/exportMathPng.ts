export const DEFAULT_PNG_FILENAME = 'formula-texdock.png';
export const DEFAULT_PNG_SCALE = 4;
export const DEFAULT_PNG_PADDING = 16;
export const MAX_PNG_SCALE = 4;
export const MAX_PNG_DIMENSION = 4_096;
export const MAX_PNG_PIXELS = 16_777_216;

export interface MathPngOptions {
  scale?: number;
  padding?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxPixels?: number;
}

type MathPngExportErrorCode =
  | 'EMPTY_SVG'
  | 'INVALID_OPTIONS'
  | 'INVALID_DIMENSIONS'
  | 'IMAGE_LOAD_FAILED'
  | 'CANVAS_UNAVAILABLE'
  | 'RASTERIZATION_FAILED'
  | 'ENCODING_FAILED'
  | 'DOWNLOAD_FAILED';

export class MathPngExportError extends Error {
  readonly code: MathPngExportErrorCode;

  constructor(code: MathPngExportErrorCode, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'MathPngExportError';
    this.code = code;
  }
}

export interface MathPngLayout {
  canvasWidth: number;
  canvasHeight: number;
  drawWidth: number;
  drawHeight: number;
  offsetX: number;
  offsetY: number;
  padding: number;
  scale: number;
}

interface SvgDimensions {
  width: number | null;
  height: number | null;
  viewBoxWidth: number | null;
  viewBoxHeight: number | null;
}

interface PngImage {
  naturalWidth: number;
  naturalHeight: number;
  onload: ((event: Event) => void) | null;
  onerror: ((event: Event | string) => void) | null;
  src: string;
}

interface PngCanvas {
  width: number;
  height: number;
  getContext(contextId: '2d'): Pick<
    CanvasRenderingContext2D,
    'clearRect' | 'drawImage'
  > | null;
  toBlob(callback: BlobCallback, type?: string, quality?: number): void;
}

export interface MathPngEnvironment {
  createImage(): PngImage;
  createCanvas(): PngCanvas;
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
}

export interface PngDownloadEnvironment {
  document: Pick<Document, 'body' | 'createElement'>;
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
}

function reportDevelopmentFailure(stage: string, error: unknown): void {
  if (!import.meta.env.DEV) return;

  const originalError = error instanceof Error && error.cause
    ? error.cause
    : error;
  const stack = originalError instanceof Error ? originalError.stack : undefined;
  console.error(
    `[TexDock] Falló la exportación PNG durante ${stage}.`,
    originalError,
    stack,
  );
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function parseLength(value: string | null): number | null {
  if (!value) return null;
  const match = value.trim().match(
    /^([+]?(?:\d+(?:\.\d*)?|\.\d+))(px|pt|pc|in|cm|mm|q|em|ex)?$/i,
  );
  if (!match) return null;

  const numericValue = Number(match[1]);
  if (!isPositiveFinite(numericValue)) return null;
  const unit = (match[2] ?? 'px').toLowerCase();
  const pixelsPerUnit: Record<string, number> = {
    px: 1,
    pt: 96 / 72,
    pc: 16,
    in: 96,
    cm: 96 / 2.54,
    mm: 96 / 25.4,
    q: 96 / 101.6,
    em: 16,
    ex: 8,
  };
  const pixels = numericValue * pixelsPerUnit[unit];
  return isPositiveFinite(pixels) ? pixels : null;
}

function readSvgAttribute(attributes: string, name: string): string | null {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = attributes.match(
    new RegExp(`(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'),
  );
  return match?.[1] ?? match?.[2] ?? null;
}

function parseSvgDimensions(svg: string): SvgDimensions {
  const root = svg.match(/<svg\b([^>]*)>/i);
  if (!root) {
    throw new MathPngExportError(
      'INVALID_DIMENSIONS',
      'El SVG no contiene una raíz reconocible.',
    );
  }

  const attributes = root[1];
  const viewBoxValues = (readSvgAttribute(attributes, 'viewBox') ?? '')
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const hasValidViewBox = viewBoxValues.length === 4
    && viewBoxValues.every(Number.isFinite)
    && viewBoxValues[2] > 0
    && viewBoxValues[3] > 0;

  return {
    width: parseLength(readSvgAttribute(attributes, 'width')),
    height: parseLength(readSvgAttribute(attributes, 'height')),
    viewBoxWidth: hasValidViewBox ? viewBoxValues[2] : null,
    viewBoxHeight: hasValidViewBox ? viewBoxValues[3] : null,
  };
}

function resolveSourceDimensions(
  dimensions: SvgDimensions,
  naturalWidth: number,
  naturalHeight: number,
): { width: number; height: number } {
  if (
    dimensions.width !== null
    && dimensions.height !== null
  ) {
    return { width: dimensions.width, height: dimensions.height };
  }

  if (isPositiveFinite(naturalWidth) && isPositiveFinite(naturalHeight)) {
    return { width: naturalWidth, height: naturalHeight };
  }

  if (
    dimensions.viewBoxWidth !== null
    && dimensions.viewBoxHeight !== null
  ) {
    const aspectRatio = dimensions.viewBoxWidth / dimensions.viewBoxHeight;
    if (dimensions.width !== null) {
      return {
        width: dimensions.width,
        height: dimensions.width / aspectRatio,
      };
    }
    if (dimensions.height !== null) {
      return {
        width: dimensions.height * aspectRatio,
        height: dimensions.height,
      };
    }
    return {
      width: dimensions.viewBoxWidth,
      height: dimensions.viewBoxHeight,
    };
  }

  throw new MathPngExportError(
    'INVALID_DIMENSIONS',
    'No se pudieron determinar dimensiones válidas para la fórmula.',
  );
}

function normalizedOptions(options: MathPngOptions): Required<MathPngOptions> {
  const requested = {
    scale: options.scale ?? DEFAULT_PNG_SCALE,
    padding: options.padding ?? DEFAULT_PNG_PADDING,
    maxWidth: options.maxWidth ?? MAX_PNG_DIMENSION,
    maxHeight: options.maxHeight ?? MAX_PNG_DIMENSION,
    maxPixels: options.maxPixels ?? MAX_PNG_PIXELS,
  };

  if (
    !isPositiveFinite(requested.scale)
    || !Number.isFinite(requested.padding)
    || requested.padding < 0
    || !isPositiveFinite(requested.maxWidth)
    || !isPositiveFinite(requested.maxHeight)
    || !isPositiveFinite(requested.maxPixels)
  ) {
    throw new MathPngExportError(
      'INVALID_OPTIONS',
      'La configuración de exportación PNG contiene dimensiones no válidas.',
    );
  }

  return {
    scale: Math.min(requested.scale, MAX_PNG_SCALE),
    padding: Math.ceil(requested.padding),
    maxWidth: Math.floor(Math.min(requested.maxWidth, MAX_PNG_DIMENSION)),
    maxHeight: Math.floor(Math.min(requested.maxHeight, MAX_PNG_DIMENSION)),
    maxPixels: Math.floor(Math.min(requested.maxPixels, MAX_PNG_PIXELS)),
  };
}

export function calculateMathPngLayout(
  sourceWidth: number,
  sourceHeight: number,
  options: MathPngOptions = {},
): MathPngLayout {
  if (!isPositiveFinite(sourceWidth) || !isPositiveFinite(sourceHeight)) {
    throw new MathPngExportError(
      'INVALID_DIMENSIONS',
      'La fórmula tiene dimensiones no válidas para generar el PNG.',
    );
  }

  const limits = normalizedOptions(options);
  const minimumCanvasSide = limits.padding * 2 + 1;
  if (
    limits.maxWidth < minimumCanvasSide
    || limits.maxHeight < minimumCanvasSide
    || limits.maxPixels < minimumCanvasSide * minimumCanvasSide
  ) {
    throw new MathPngExportError(
      'INVALID_DIMENSIONS',
      'Los límites disponibles no permiten rasterizar la fórmula.',
    );
  }

  const layoutAtScale = (scale: number) => {
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const canvasWidth = Math.ceil(drawWidth) + limits.padding * 2;
    const canvasHeight = Math.ceil(drawHeight) + limits.padding * 2;
    return {
      canvasHeight,
      canvasWidth,
      drawHeight,
      drawWidth,
      fits: canvasWidth <= limits.maxWidth
        && canvasHeight <= limits.maxHeight
        && canvasWidth * canvasHeight <= limits.maxPixels,
    };
  };

  let scale = limits.scale;
  let candidate = layoutAtScale(scale);
  if (!candidate.fits) {
    let lower = 0;
    let upper = scale;
    for (let iteration = 0; iteration < 64; iteration += 1) {
      const middle = (lower + upper) / 2;
      if (layoutAtScale(middle).fits) lower = middle;
      else upper = middle;
    }
    scale = lower;
    candidate = layoutAtScale(scale);
  }

  if (
    !candidate.fits
    || candidate.drawWidth < 1
    || candidate.drawHeight < 1
    || !isPositiveFinite(scale)
  ) {
    throw new MathPngExportError(
      'INVALID_DIMENSIONS',
      'La fórmula es demasiado grande para exportarla como PNG de forma segura.',
    );
  }

  return {
    canvasWidth: candidate.canvasWidth,
    canvasHeight: candidate.canvasHeight,
    drawWidth: candidate.drawWidth,
    drawHeight: candidate.drawHeight,
    offsetX: (candidate.canvasWidth - candidate.drawWidth) / 2,
    offsetY: (candidate.canvasHeight - candidate.drawHeight) / 2,
    padding: limits.padding,
    scale,
  };
}

function browserMathPngEnvironment(): MathPngEnvironment {
  return {
    createImage: () => new Image(),
    createCanvas: () => document.createElement('canvas'),
    createObjectURL: URL.createObjectURL.bind(URL),
    revokeObjectURL: URL.revokeObjectURL.bind(URL),
  };
}

function loadImage(image: PngImage, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = (event) => reject(new MathPngExportError(
      'IMAGE_LOAD_FAILED',
      'No se pudo cargar el SVG para generar el PNG.',
      event,
    ));
    image.src = url;
  });
}

function encodeCanvas(canvas: PngCanvas): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new MathPngExportError(
            'ENCODING_FAILED',
            'El navegador no pudo codificar la fórmula como PNG.',
          ));
          return;
        }
        if (blob.type !== 'image/png') {
          reject(new MathPngExportError(
            'ENCODING_FAILED',
            'El navegador devolvió un formato de imagen inesperado.',
          ));
          return;
        }
        resolve(blob);
      }, 'image/png');
    } catch (error) {
      reject(new MathPngExportError(
        'ENCODING_FAILED',
        'No se pudo codificar el PNG de forma segura.',
        error,
      ));
    }
  });
}

export async function createMathPng(
  svg: string,
  options: MathPngOptions = {},
  environment: MathPngEnvironment = browserMathPngEnvironment(),
): Promise<Blob> {
  if (!svg.trim()) {
    throw new MathPngExportError(
      'EMPTY_SVG',
      'No hay un SVG válido para generar el PNG.',
    );
  }

  let stage = 'la validación de las dimensiones del SVG';
  let svgObjectUrl: string | null = null;
  let image: PngImage | null = null;

  try {
    const dimensions = parseSvgDimensions(svg);
    stage = 'la creación del objeto Image';
    image = environment.createImage();
    stage = 'la creación de la URL temporal del SVG';
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    svgObjectUrl = environment.createObjectURL(svgBlob);
    stage = 'la carga del SVG en Image';
    await loadImage(image, svgObjectUrl);

    stage = 'el cálculo de dimensiones y límites';
    const source = resolveSourceDimensions(
      dimensions,
      image.naturalWidth,
      image.naturalHeight,
    );
    const layout = calculateMathPngLayout(source.width, source.height, options);
    stage = 'la creación del canvas';
    const canvas = environment.createCanvas();
    canvas.width = layout.canvasWidth;
    canvas.height = layout.canvasHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new MathPngExportError(
        'CANVAS_UNAVAILABLE',
        'El navegador no permite crear el canvas necesario.',
      );
    }

    stage = 'el dibujo del SVG en canvas';
    try {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        image as unknown as CanvasImageSource,
        layout.offsetX,
        layout.offsetY,
        layout.drawWidth,
        layout.drawHeight,
      );
    } catch (error) {
      throw new MathPngExportError(
        'RASTERIZATION_FAILED',
        'No se pudo rasterizar la fórmula de forma segura.',
        error,
      );
    }

    stage = 'la codificación del canvas como PNG';
    return await encodeCanvas(canvas);
  } catch (error) {
    reportDevelopmentFailure(stage, error);
    if (error instanceof MathPngExportError) throw error;
    throw new MathPngExportError(
      'RASTERIZATION_FAILED',
      'No se pudo generar el PNG. Inténtalo de nuevo.',
      error,
    );
  } finally {
    if (image) {
      image.onload = null;
      image.onerror = null;
    }
    if (svgObjectUrl) environment.revokeObjectURL(svgObjectUrl);
  }
}

function browserPngDownloadEnvironment(): PngDownloadEnvironment {
  return {
    document,
    createObjectURL: URL.createObjectURL.bind(URL),
    revokeObjectURL: URL.revokeObjectURL.bind(URL),
  };
}

export function downloadPng(
  png: Blob,
  filename = DEFAULT_PNG_FILENAME,
  environment: PngDownloadEnvironment = browserPngDownloadEnvironment(),
): void {
  if (png.type !== 'image/png' || png.size === 0) {
    throw new MathPngExportError(
      'DOWNLOAD_FAILED',
      'El PNG generado no es válido para descargar.',
    );
  }

  let objectUrl: string | null = null;
  let link: HTMLAnchorElement | null = null;
  try {
    objectUrl = environment.createObjectURL(png);
    link = environment.document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    environment.document.body.appendChild(link);
    link.click();
  } catch (error) {
    reportDevelopmentFailure('la descarga del Blob PNG', error);
    throw new MathPngExportError(
      'DOWNLOAD_FAILED',
      'No se pudo iniciar la descarga del PNG.',
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
