import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

describe('navegación pública de Fase 1D', () => {
  it('expone las rutas públicas desde Header y Footer con url()', () => {
    const header = source('../components/navigation/Header.astro');
    const footer = source('../components/navigation/Footer.astro');
    for (const path of ['/aprender', '/biblioteca', '/laboratorio', '/acerca']) {
      expect(header).toContain(`url('${path}')`);
      expect(footer).toContain(`url('${path}')`);
    }
    expect(header).toContain('https://github.com/Rxltv/TexDock');
    expect(footer).toContain('https://github.com/Rxltv/TexDock');
  });

  it('mantiene Acerca de como ruta pública y corrige su repositorio', () => {
    const about = source('../pages/acerca/index.astro');
    expect(about).toContain('<BaseLayout');
    expect(about).toContain('id="main-content"');
    expect(about).toContain('https://github.com/Rxltv/TexDock');
    expect(about).not.toContain('anomalyco/TexDock');
  });
});
