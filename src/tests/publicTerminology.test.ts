import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

const landing = source('../pages/index.astro');
const learn = source('../pages/aprender/index.astro');
const formulas = source('../pages/laboratorio.astro');
const playground = source('../components/playground/MathPlayground.tsx');
const header = source('../components/navigation/Header.astro');
const sidebar = source('../components/navigation/Sidebar.astro');
const progressHeader = source('../components/navigation/ProgressHeader.astro');

describe('terminología pública', () => {
  it('presenta la herramienta como Fórmulas y conserva /laboratorio/', () => {
    expect(header).toContain(">Fórmulas</a>");
    expect(header).toContain("url('/laboratorio')");
    expect(formulas).toContain('title="Fórmulas LaTeX — TexDock"');
    expect(playground).toContain('<h1>Fórmulas LaTeX</h1>');
    expect(playground).toContain('Escribe, visualiza y descarga fórmulas en SVG.');
  });

  it('usa CTA breves en la portada y en /aprender/', () => {
    expect(landing).toContain('class="btn btn--primary">Comenzar</a>');
    expect(landing).toContain('class="btn btn--secondary">Fórmulas</a>');
    expect(learn).toMatch(/class="btn btn--primary">\s*Comenzar\s*<\/a>/);
    expect(learn).toMatch(/class="btn btn--secondary">\s*Fórmulas\s*<\/a>/);
  });

  it('presenta un único Curso de LaTeX sin cambiar identificadores internos', () => {
    expect(learn).toContain('Curso de LaTeX');
    expect(sidebar).toContain('Curso de LaTeX');
    expect(progressHeader).toContain('Curso de LaTeX');
    for (const uiSource of [landing, learn, formulas, playground, header, sidebar, progressHeader]) {
      expect(uiSource).not.toMatch(/curso básico/i);
      expect(uiSource).not.toContain('Práctica LaTeX');
      expect(uiSource).not.toContain('Abrir laboratorio');
    }
  });

  it('construye todos los enlaces internos con la utilidad compatible con BASE_URL', () => {
    expect(landing).toContain("url('/aprender')");
    expect(landing).toContain("url('/laboratorio')");
    expect(learn).toContain("url('/laboratorio')");
    expect(header).toContain("url('/laboratorio')");
  });
});

describe('presentación de la portada', () => {
  it('reutiliza Header y no duplica el selector de tema', () => {
    expect(landing).not.toContain('hideHeader');
    expect(landing).not.toContain('ThemeToggle');
  });

  it('mantiene decoraciones sin hidratación y respeta movimiento reducido', () => {
    expect(landing).toContain('landing-fg');
    expect(landing).toContain('@media (prefers-reduced-motion: reduce)');
    expect(landing).not.toMatch(/client:(?:load|visible|idle|only)/);
    expect(landing).not.toContain('canvas');
  });

  it('permite scroll móvil y conserva decoraciones selectivas', () => {
    const globalCss = source('../styles/global.css');
    expect(globalCss).toMatch(
      /body\[data-page-layout="landing"\][^{]*\{[^}]*height:\s*auto;[^}]*overflow:\s*visible;/s,
    );
    expect(landing).toContain('.landing-fg .fg-sum,');
    expect(landing).toContain('.landing-fg .fg-frac');
  });
});
