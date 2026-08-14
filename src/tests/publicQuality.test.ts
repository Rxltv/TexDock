import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

const baseLayout = read('../layouts/BaseLayout.astro');
const courseLayout = read('../layouts/CourseLayout.astro');
const landing = read('../pages/index.astro');
const learnIndex = read('../pages/aprender/index.astro');
const lessonPage = read('../pages/aprender/[...slug].astro');
const laboratory = read('../pages/laboratorio.astro');

describe('metadatos públicos de Fase 1E', () => {
  it('define metadatos SEO completos y URLs absolutas desde el layout común', () => {
    expect(baseLayout).toContain('<html lang="es">');
    expect(baseLayout).toContain('<link rel="canonical" href={canonicalUrl} />');
    expect(baseLayout).toContain('property="og:title"');
    expect(baseLayout).toContain('property="og:description"');
    expect(baseLayout).toContain('property="og:url"');
    expect(baseLayout).toContain('property="og:type"');
    expect(baseLayout).toContain('property="og:image"');
    expect(baseLayout).toContain('name="twitter:card"');
    expect(baseLayout).toContain('name="twitter:title"');
    expect(baseLayout).toContain('name="twitter:description"');
    expect(baseLayout).toContain('name="twitter:image"');
    expect(baseLayout).toContain('const canonicalUrl = absoluteUrl(Astro.url.pathname);');
  });

  it('pasa títulos y descripciones específicos a portada, laboratorio e índice', () => {
    expect(landing).toContain('title="TexDock — Aprende LaTeX escribiendo"');
    expect(landing).toContain('description="Aprende LaTeX desde cero con teoría breve, ejemplos interactivos y ejercicios prácticos."');
    expect(laboratory).toContain('title="Fórmulas LaTeX — TexDock"');
    expect(laboratory).toContain('description="Escribe, visualiza y descarga fórmulas LaTeX en SVG y PNG."');
    expect(learnIndex).toContain('title="Aprender LaTeX — TexDock"');
    expect(learnIndex).toContain('description="Curso práctico de LaTeX desde cero con teoría breve, ejemplos interactivos y ejercicios."');
  });

  it('usa la descripción real de la sección o lección en rutas profundas', () => {
    expect(lessonPage).toContain('description = section.data.description;');
    expect(lessonPage).toContain('p.lessonPage.data.description');
    expect(lessonPage).toContain('p.lesson.data.description');
    expect(lessonPage).toContain('description={description}');
    expect(courseLayout).toContain('description: string;');
    expect(baseLayout).not.toContain("description = 'Aprende LaTeX escribiendo'");
  });

  it('publica robots y sitemap bajo GitHub Pages sin rutas retiradas ni localhost', () => {
    const robots = read('../../public/robots.txt');
    const sitemap = read('../../public/sitemap.xml');
    expect(robots).toContain('Sitemap: https://rxltv.github.io/TexDock/sitemap.xml');
    expect(robots).toContain('Disallow: /TexDock/biblioteca/');
    expect(robots).toContain('Disallow: /TexDock/acerca/');
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemap).toContain('https://rxltv.github.io/TexDock/');
    expect(sitemap).not.toMatch(/biblioteca|acerca|localhost|\/TexDock\/TexDock\//i);
  });
});

describe('landmarks y navegación por teclado de Fase 1E', () => {
  it('mantiene un único main por composición y un destino válido para el skip link', () => {
    expect(baseLayout).toContain('<a class="skip-link" href="#main-content">Saltar al contenido principal</a>');
    expect(baseLayout).toContain('class="skip-link"');
    expect(courseLayout.match(/<main\b/g)).toHaveLength(1);
    expect(landing.match(/<main\b/g)).toHaveLength(1);
    expect(laboratory.match(/<main\b/g)).toHaveLength(1);
    expect(learnIndex).not.toMatch(/<main\b/);
    expect(landing).toContain('<main class="landing" id="main-content">');
    expect(laboratory).toContain('<main class="practice-page" id="main-content">');
    expect(courseLayout).toContain('id="main-content"');
  });

  it('da al skip link un estado visible y enfocable', () => {
    const globalStyles = read('../styles/global.css');
    expect(baseLayout).toContain('.skip-link:focus-visible');
    expect(baseLayout).toContain('transform: translateY(0);');
    expect(globalStyles).toContain(':focus-visible');
  });
});

describe('tokens CSS', () => {
  it('no usa variables CSS sin definición en el código fuente', () => {
    const root = fileURLToPath(new URL('../', import.meta.url));
    const files: string[] = [];
    function collect(directory: string): void {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) collect(path);
        else if (/\.(astro|css|ts|tsx)$/.test(entry.name)) files.push(path);
      }
    }
    collect(root);

    const definitions = new Set<string>();
    const uses = new Set<string>();
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      for (const match of content.matchAll(/--([a-z0-9-]+)\s*:/gi)) definitions.add(match[1]);
      for (const match of content.matchAll(/var\(\s*--([a-z0-9-]+)/gi)) uses.add(match[1]);
    }

    expect([...uses].filter((token) => !definitions.has(token))).toEqual([]);
  });
});
