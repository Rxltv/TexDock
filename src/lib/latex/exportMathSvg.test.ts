import { describe, expect, it, vi } from 'vitest';
import {
  createMathSvg,
  DEFAULT_SVG_FILENAME,
  downloadSvg,
  MAX_LATEX_EXPORT_LENGTH,
  MathSvgExportError,
  type SvgDownloadEnvironment,
} from './exportMathSvg';

describe('createMathSvg', () => {
  it('rechaza entradas vacías antes de cargar MathJax', async () => {
    await expect(createMathSvg('  \n ')).rejects.toMatchObject({
      code: 'EMPTY_EXPRESSION',
    });
  });

  it('aplica un límite razonable de longitud', async () => {
    await expect(
      createMathSvg('x'.repeat(MAX_LATEX_EXPORT_LENGTH + 1)),
    ).rejects.toMatchObject({
      code: 'EXPRESSION_TOO_LONG',
    });
  });

  it('rechaza comandos capaces de introducir recursos o estilos', async () => {
    const unsafeExpressions = [
      '\\href{https://example.com}{x}',
      '\\includegraphics{https://example.com/image.png}',
      '\\style{background:url(https://example.com)}{x}',
      '\\require{html}',
    ];

    for (const expression of unsafeExpressions) {
      await expect(createMathSvg(expression)).rejects.toMatchObject({
        code: 'UNSAFE_EXPRESSION',
      });
    }
  });
});

describe('downloadSvg', () => {
  function createEnvironment(click = vi.fn()) {
    const remove = vi.fn();
    const link = {
      href: '',
      download: '',
      click,
      remove,
    };
    const appendChild = vi.fn();
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:texdock-svg');
    const revokeObjectURL = vi.fn((_url: string) => undefined);
    const environment = {
      document: {
        body: { appendChild },
        createElement: vi.fn(() => link),
      },
      createObjectURL,
      revokeObjectURL,
    } as unknown as SvgDownloadEnvironment;

    return {
      appendChild,
      createObjectURL,
      environment,
      link,
      remove,
      revokeObjectURL,
    };
  }

  it('descarga mediante Blob, usa el nombre esperado y limpia todos los recursos', async () => {
    const fixture = createEnvironment();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>';

    downloadSvg(svg, undefined, fixture.environment);

    expect(fixture.createObjectURL).toHaveBeenCalledOnce();
    const blob = fixture.createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('image/svg+xml;charset=utf-8');
    await expect(blob.text()).resolves.toBe(svg);
    expect(fixture.link.href).toBe('blob:texdock-svg');
    expect(fixture.link.download).toBe(DEFAULT_SVG_FILENAME);
    expect(fixture.appendChild).toHaveBeenCalledWith(fixture.link);
    expect(fixture.link.click).toHaveBeenCalledOnce();
    expect(fixture.remove).toHaveBeenCalledOnce();
    expect(fixture.revokeObjectURL).toHaveBeenCalledWith('blob:texdock-svg');
  });

  it('revoca la URL y elimina el enlace aunque el clic falle', () => {
    const fixture = createEnvironment(vi.fn(() => {
      throw new Error('Fallo simulado');
    }));

    expect(() => downloadSvg('<svg/>', undefined, fixture.environment))
      .toThrow(MathSvgExportError);
    expect(fixture.remove).toHaveBeenCalledOnce();
    expect(fixture.revokeObjectURL).toHaveBeenCalledWith('blob:texdock-svg');
  });
});
