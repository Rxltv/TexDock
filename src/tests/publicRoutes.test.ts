import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

describe('navegación pública de Fase 1E', () => {
  it('limita Header y Footer a los cuatro destinos aprobados', () => {
    const header = source('../components/navigation/Header.astro');
    const footer = source('../components/navigation/Footer.astro');

    for (const navigation of [header, footer]) {
      expect(navigation).toContain("url('/')");
      expect(navigation).toContain("url('/aprender')");
      expect(navigation).toContain("url('/laboratorio')");
      expect(navigation).toContain('https://github.com/Rxltv/TexDock');
      expect(navigation).not.toMatch(/Biblioteca|Acerca de|url\('\/(?:biblioteca|acerca)'\)/);
    }

    const footerNav = footer.match(/<nav[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
    expect(footerNav.match(/<a\b/g)).toHaveLength(4);
  });

  it('retira las rutas públicas de Biblioteca y Acerca de', () => {
    expect(existsSync(new URL('../pages/biblioteca/index.astro', import.meta.url))).toBe(false);
    expect(existsSync(new URL('../pages/acerca/index.astro', import.meta.url))).toBe(false);
  });
});
