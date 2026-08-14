import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

describe('accesibilidad de la biblioteca', () => {
  it('usa un botón de copia y una región de estado accesible', () => {
    const button = source('../components/library/CopyCodeButton.tsx');
    expect(button).toContain('<button type="button" onClick={handleCopy}>Copiar</button>');
    expect(button).toContain('role="status"');
    expect(button).toContain('aria-live="polite"');
  });

  it('no vuelve a cargar el editor ni ofrece descarga de plantillas', () => {
    const page = source('../pages/biblioteca/index.astro');
    const card = source('../components/library/TemplateCard.astro');
    expect(page + card).not.toContain('download=');
    expect(page + card).not.toContain('LatexCodeEditor');
    expect(card).toContain('Código completo');
    expect(card).toContain('client:load');
  });
});
