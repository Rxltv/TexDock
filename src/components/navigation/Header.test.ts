import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const header = readFileSync(new URL('./Header.astro', import.meta.url), 'utf8');
const navList = header.match(/<ul class="nav-links">([\s\S]*?)<\/ul>/)?.[1] ?? '';

describe('Header', () => {
  it('expone exactamente los cuatro destinos públicos aprobados', () => {
    expect(navList.match(/<li>/g)).toHaveLength(4);
    expect(navList).toContain("url('/')}>Inicio");
    expect(navList).toContain("url('/aprender')}>Aprender");
    expect(navList).toContain("url('/laboratorio')}>Fórmulas");
    expect(navList).toContain('>GitHub</a>');
    expect(navList).not.toMatch(/Biblioteca|Acerca de|\/biblioteca|\/acerca/);
  });

  it('mantiene el orden Inicio, Aprender, Fórmulas y GitHub', () => {
    const labels = [...navList.matchAll(/>(Inicio|Aprender|Fórmulas|GitHub)<\/a>/g)]
      .map((match) => match[1]);
    expect(labels).toEqual(['Inicio', 'Aprender', 'Fórmulas', 'GitHub']);
  });

  it('protege el enlace externo a GitHub', () => {
    expect(navList).toContain('https://github.com/Rxltv/TexDock');
    expect(navList).toContain('target="_blank"');
    expect(navList).toContain('rel="noopener noreferrer"');
  });
});
