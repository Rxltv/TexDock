import { describe, it, expect } from 'vitest';

const HEADER_HTML = `
<header class="site-header">
  <nav class="nav" aria-label="Navegación principal">
    <a href="/" class="logo">TexDock</a>
    <ul class="nav-links">
      <li><a href="/aprender">Aprender</a></li>
      <li><a href="/biblioteca">Biblioteca</a></li>
      <li><a href="/laboratorio">Práctica</a></li>
      <li><a href="https://github.com/Rxltv/TexDock" target="_blank" rel="noopener noreferrer">GitHub</a></li>
    </ul>
  </nav>
</header>
`;

describe('Header', () => {
  it('no contiene Acerca de', () => {
    expect(HEADER_HTML).not.toContain('Acerca de');
    expect(HEADER_HTML).not.toContain('/acerca');
  });

  it('GitHub utiliza https://github.com/Rxltv/TexDock', () => {
    expect(HEADER_HTML).toContain('https://github.com/Rxltv/TexDock');
  });

  it('el enlace incluye protección para nueva pestaña', () => {
    expect(HEADER_HTML).toContain('target="_blank"');
    expect(HEADER_HTML).toContain('rel="noopener noreferrer"');
  });

  it('no se alteran Aprender, Biblioteca o Práctica', () => {
    expect(HEADER_HTML).toContain('/aprender');
    expect(HEADER_HTML).toContain('/biblioteca');
    expect(HEADER_HTML).toContain('/laboratorio');
    expect(HEADER_HTML).toContain('Práctica');
  });
});