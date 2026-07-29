import { describe, expect, it, vi } from 'vitest';
import {
  calculateMathPngLayout,
  createMathPng,
  DEFAULT_PNG_FILENAME,
  downloadPng,
  MAX_PNG_DIMENSION,
  MAX_PNG_PIXELS,
  MathPngExportError,
  type MathPngEnvironment,
  type MathPngOptions,
  type PngDownloadEnvironment,
} from './exportMathPng';

const VALID_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg"',
  ' width="100px" height="50px" viewBox="0 0 100 50">',
  '<path d="M0 0h10v10z"/></svg>',
].join('');

interface RasterFixtureOptions {
  naturalWidth?: number;
  naturalHeight?: number;
  imageFails?: boolean;
  contextMissing?: boolean;
  drawFails?: boolean;
  encodingFails?: boolean;
  encodedBlob?: Blob | null;
}

function createRasterFixture(options: RasterFixtureOptions = {}) {
  const clearRect = vi.fn();
  const drawImage = vi.fn(() => {
    if (options.drawFails) throw new DOMException('Canvas contaminado', 'SecurityError');
  });
  const fillRect = vi.fn();
  const toBlobTypes: Array<string | undefined> = [];
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => options.contextMissing
      ? null
      : { clearRect, drawImage, fillRect }),
    toBlob: vi.fn((callback: BlobCallback, type?: string) => {
      toBlobTypes.push(type);
      if (options.encodingFails) {
        throw new DOMException('Canvas contaminado', 'SecurityError');
      }
      callback(options.encodedBlob === undefined
        ? new Blob(['png'], { type: 'image/png' })
        : options.encodedBlob);
    }),
  };
  const image = {
    naturalWidth: options.naturalWidth ?? 100,
    naturalHeight: options.naturalHeight ?? 50,
    onload: null as ((event: Event) => void) | null,
    onerror: null as ((event: Event | string) => void) | null,
    _src: '',
    get src() {
      return this._src;
    },
    set src(value: string) {
      this._src = value;
      queueMicrotask(() => {
        if (options.imageFails) this.onerror?.(new Event('error'));
        else this.onload?.(new Event('load'));
      });
    },
  };
  const createObjectURL = vi.fn((_blob: Blob) => 'blob:svg-source');
  const revokeObjectURL = vi.fn((_url: string) => undefined);
  const environment: MathPngEnvironment = {
    createImage: vi.fn(() => image),
    createCanvas: vi.fn(() => canvas),
    createObjectURL,
    revokeObjectURL,
  };

  return {
    canvas,
    clearRect,
    createObjectURL,
    drawImage,
    environment,
    fillRect,
    image,
    revokeObjectURL,
    toBlobTypes,
  };
}

describe('calculateMathPngLayout', () => {
  it('conserva la relación de aspecto y aplica escala 4× cuando cabe', () => {
    const layout = calculateMathPngLayout(100, 50, { padding: 0 });

    expect(layout.scale).toBe(4);
    expect(layout.canvasWidth).toBe(400);
    expect(layout.canvasHeight).toBe(200);
    expect(layout.drawWidth / layout.drawHeight).toBe(2);
  });

  it('reduce proporcionalmente la escala al superar maxWidth', () => {
    const layout = calculateMathPngLayout(100, 50, {
      maxWidth: 300,
      padding: 0,
    });

    expect(layout.scale).toBeCloseTo(3);
    expect(layout.canvasWidth).toBe(300);
    expect(layout.drawWidth / layout.drawHeight).toBeCloseTo(2);
  });

  it('reduce proporcionalmente la escala al superar maxHeight', () => {
    const layout = calculateMathPngLayout(100, 50, {
      maxHeight: 100,
      padding: 0,
    });

    expect(layout.scale).toBeCloseTo(2);
    expect(layout.canvasHeight).toBe(100);
    expect(layout.drawWidth / layout.drawHeight).toBeCloseTo(2);
  });

  it('reduce la escala para respetar el máximo de píxeles', () => {
    const layout = calculateMathPngLayout(100, 100, {
      maxPixels: 40_000,
      padding: 0,
    });

    expect(layout.scale).toBeCloseTo(2);
    expect(layout.canvasWidth * layout.canvasHeight).toBeLessThanOrEqual(40_000);
  });

  it('añade margen transparente sin alterar el tamaño dibujado', () => {
    const withoutPadding = calculateMathPngLayout(100, 50, {
      padding: 0,
      scale: 1,
    });
    const withPadding = calculateMathPngLayout(100, 50, {
      padding: 12,
      scale: 1,
    });

    expect(withPadding.drawWidth).toBe(withoutPadding.drawWidth);
    expect(withPadding.drawHeight).toBe(withoutPadding.drawHeight);
    expect(withPadding.canvasWidth).toBe(withoutPadding.canvasWidth + 24);
    expect(withPadding.canvasHeight).toBe(withoutPadding.canvasHeight + 24);
    expect(withPadding.offsetX).toBeGreaterThanOrEqual(12);
    expect(withPadding.offsetY).toBeGreaterThanOrEqual(12);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rechaza dimensiones de origen no válidas: %s',
    (invalidDimension) => {
      expect(() => calculateMathPngLayout(invalidDimension, 10))
        .toThrow(MathPngExportError);
      expect(() => calculateMathPngLayout(10, invalidDimension))
        .toThrow(MathPngExportError);
    },
  );

  it('no permite que las opciones amplíen los límites duros de memoria', () => {
    const layout = calculateMathPngLayout(2_000, 2_000, {
      maxWidth: 20_000,
      maxHeight: 20_000,
      maxPixels: 100_000_000,
      padding: 0,
    });

    expect(layout.canvasWidth).toBeLessThanOrEqual(MAX_PNG_DIMENSION);
    expect(layout.canvasHeight).toBeLessThanOrEqual(MAX_PNG_DIMENSION);
    expect(layout.canvasWidth * layout.canvasHeight).toBeLessThanOrEqual(MAX_PNG_PIXELS);
  });
});

describe('createMathPng', () => {
  it('rechaza un SVG vacío', async () => {
    await expect(createMathPng(' \n ')).rejects.toMatchObject({
      code: 'EMPTY_SVG',
    });
  });

  it('rechaza un SVG sin viewBox ni dimensiones de respaldo válidas', async () => {
    const fixture = createRasterFixture({
      naturalWidth: 0,
      naturalHeight: 0,
    });

    await expect(createMathPng(
      '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      {},
      fixture.environment,
    )).rejects.toMatchObject({ code: 'INVALID_DIMENSIONS' });
    expect(fixture.revokeObjectURL).toHaveBeenCalledWith('blob:svg-source');
  });

  it('interpreta unidades MathJax y genera un Blob image/png', async () => {
    const fixture = createRasterFixture({
      naturalWidth: 0,
      naturalHeight: 0,
    });
    const svg = '<svg width="10ex" height="5ex" viewBox="0 0 100 50"></svg>';

    const png = await createMathPng(svg, { padding: 0 }, fixture.environment);

    expect(png.type).toBe('image/png');
    expect(fixture.canvas.width).toBe(320);
    expect(fixture.canvas.height).toBe(160);
  });

  it('mantiene el canvas transparente y solicita image/png a toBlob', async () => {
    const fixture = createRasterFixture();

    await createMathPng(VALID_SVG, undefined, fixture.environment);

    expect(fixture.clearRect).toHaveBeenCalledOnce();
    expect(fixture.fillRect).not.toHaveBeenCalled();
    expect(fixture.toBlobTypes).toEqual(['image/png']);
  });

  it('rechaza si canvas.toBlob devuelve null', async () => {
    const fixture = createRasterFixture({ encodedBlob: null });

    await expect(createMathPng(VALID_SVG, {}, fixture.environment))
      .rejects.toMatchObject({ code: 'ENCODING_FAILED' });
    expect(fixture.revokeObjectURL).toHaveBeenCalledWith('blob:svg-source');
  });

  it('revoca la URL y libera callbacks cuando Image falla', async () => {
    const fixture = createRasterFixture({ imageFails: true });

    await expect(createMathPng(VALID_SVG, {}, fixture.environment))
      .rejects.toMatchObject({ code: 'IMAGE_LOAD_FAILED' });
    expect(fixture.image.onload).toBeNull();
    expect(fixture.image.onerror).toBeNull();
    expect(fixture.revokeObjectURL).toHaveBeenCalledWith('blob:svg-source');
  });

  it('maneja drawImage fallido y un posible error de seguridad', async () => {
    const fixture = createRasterFixture({ drawFails: true });

    await expect(createMathPng(VALID_SVG, {}, fixture.environment))
      .rejects.toMatchObject({
        code: 'RASTERIZATION_FAILED',
        cause: expect.objectContaining({ name: 'SecurityError' }),
      });
    expect(fixture.revokeObjectURL).toHaveBeenCalledWith('blob:svg-source');
  });

  it('maneja un canvas sin contexto 2D', async () => {
    const fixture = createRasterFixture({ contextMissing: true });

    await expect(createMathPng(VALID_SVG, {}, fixture.environment))
      .rejects.toMatchObject({ code: 'CANVAS_UNAVAILABLE' });
  });

  it('maneja una excepción de seguridad durante la codificación', async () => {
    const fixture = createRasterFixture({ encodingFails: true });

    await expect(createMathPng(VALID_SVG, {}, fixture.environment))
      .rejects.toMatchObject({
        code: 'ENCODING_FAILED',
        cause: expect.objectContaining({ name: 'SecurityError' }),
      });
  });

  it('no modifica el SVG ni las opciones recibidas', async () => {
    const fixture = createRasterFixture();
    const svg = VALID_SVG;
    const options: MathPngOptions = {
      maxHeight: 900,
      maxPixels: 500_000,
      maxWidth: 1_000,
      padding: 9,
      scale: 3,
    };
    const optionsBefore = structuredClone(options);

    await createMathPng(svg, options, fixture.environment);

    expect(svg).toBe(VALID_SVG);
    expect(options).toEqual(optionsBefore);
    const sourceBlob = fixture.createObjectURL.mock.calls[0][0];
    await expect(sourceBlob.text()).resolves.toBe(VALID_SVG);
  });
});

describe('downloadPng', () => {
  function createDownloadFixture() {
    const remove = vi.fn();
    const link = {
      href: '',
      download: '',
      click: vi.fn(),
      remove,
    };
    const appendChild = vi.fn();
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:png-download');
    const revokeObjectURL = vi.fn((_url: string) => undefined);
    const environment = {
      document: {
        body: { appendChild },
        createElement: vi.fn(() => link),
      },
      createObjectURL,
      revokeObjectURL,
    } as unknown as PngDownloadEnvironment;
    return {
      appendChild,
      createObjectURL,
      environment,
      link,
      remove,
      revokeObjectURL,
    };
  }

  it('descarga con el nombre esperado y limpia enlace y object URL', () => {
    const fixture = createDownloadFixture();
    const png = new Blob(['png'], { type: 'image/png' });

    downloadPng(png, undefined, fixture.environment);

    expect(fixture.createObjectURL).toHaveBeenCalledWith(png);
    expect(fixture.link.download).toBe(DEFAULT_PNG_FILENAME);
    expect(fixture.link.click).toHaveBeenCalledOnce();
    expect(fixture.appendChild).toHaveBeenCalledWith(fixture.link);
    expect(fixture.remove).toHaveBeenCalledOnce();
    expect(fixture.revokeObjectURL).toHaveBeenCalledWith('blob:png-download');
  });

  it('rechaza Blobs vacíos o con MIME incorrecto', () => {
    const fixture = createDownloadFixture();

    expect(() => downloadPng(
      new Blob([], { type: 'image/png' }),
      undefined,
      fixture.environment,
    )).toThrow(MathPngExportError);
    expect(() => downloadPng(
      new Blob(['not png'], { type: 'text/plain' }),
      undefined,
      fixture.environment,
    )).toThrow(MathPngExportError);
  });
});
