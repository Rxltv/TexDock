import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  validateExercise,
  type ValidationRule,
} from '../lib/exercises/validateExercise';
import { parseSafeLatexPreview } from '../lib/latex/safeLatexPreview';

const contentRoot = resolve('src/content');

function names(directory: string, prefix: string, extension: string): string[] {
  return readdirSync(resolve(contentRoot, directory))
    .filter((name) => name.startsWith(prefix) && name.endsWith(extension))
    .sort();
}

function frontmatter(relativePath: string): Record<string, string | number> {
  const source = readFileSync(resolve(contentRoot, relativePath), 'utf8');
  const block = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const result: Record<string, string | number> = {};
  for (const line of block.split('\n')) {
    const match = line.match(/^([A-Za-z]+):\s*(?:"([^"]*)"|'([^']*)'|(\d+))$/);
    if (match) result[match[1]] = match[2] ?? match[3] ?? Number(match[4]);
  }
  return result;
}

interface Section14Exercise {
  id: string;
  pageId: string;
  status: string;
  initialCode: string;
  canonicalSolution: string;
  validationRules: ValidationRule[];
}

const lessonNames = names('lesson', '14-', '.md');
const pageNames = names('lesson-page', '14-', '.md');
const exerciseNames = names('exercise', '14-', '.json');
const lessons = lessonNames.map((name) => frontmatter(`lesson/${name}`));
const pages = pageNames.map((name) => frontmatter(`lesson-page/${name}`));
const exercises = exerciseNames.map((name) => (
  JSON.parse(readFileSync(resolve(contentRoot, 'exercise', name), 'utf8')) as Section14Exercise
));

describe('Sección 14: Bibliografía básica', () => {
  it('publica las seis subsecciones normativas en orden', () => {
    const section = JSON.parse(
      readFileSync(resolve(contentRoot, 'section/seccion-14.json'), 'utf8'),
    ) as { title: string; order: number };

    expect(section).toMatchObject({ title: 'Bibliografía básica', order: 14 });
    expect(lessons.map((lesson) => lesson.title)).toEqual([
      'El entorno thebibliography',
      'Entradas con \\bibitem',
      'Citas con \\cite',
      'Formato de referencias',
      'Citas y referencias internas',
      'Reto bibliográfico',
    ]);
    expect(lessons.every((lesson) => lesson.status === 'published')).toBe(true);
  });

  it('publica exactamente 21 páginas con títulos y distribución normativos', () => {
    expect(pageNames).toHaveLength(21);
    expect(lessons.map((lesson) => (
      pages.filter((page) => page.lessonId === lesson.id).length
    ))).toEqual([3, 4, 4, 4, 3, 3]);
    expect(pages.every((page) => page.status === 'published')).toBe(true);
    expect(pages.map((page) => page.title)).toEqual([
      'Bibliografía integrada',
      'El argumento de ancho',
      'Crear el entorno al final',
      'Clave y datos de la fuente',
      'Registrar un libro',
      'Registrar un artículo',
      'Elegir claves útiles',
      'Conectar texto y bibliografía',
      'Citar una fuente',
      'Citar varias fuentes',
      'Párrafo con dos citas',
      'Datos de un libro',
      'Datos de un artículo',
      'Caracteres especiales en referencias',
      'Unificar dos entradas',
      'Dos sistemas distintos',
      'Elegir \\ref o \\cite',
      'Párrafo académico combinado',
      'Bibliografía de dos fuentes',
      'Texto con citas',
      'Depuración bibliográfica',
    ]);
  });

  it('asocia ejercicios reales a las trece páginas de acción', () => {
    const actionPages = [
      '14-01-p03',
      '14-02-p02', '14-02-p03', '14-02-p04',
      '14-03-p02', '14-03-p04',
      '14-04-p03', '14-04-p04',
      '14-05-p02', '14-05-p03',
      '14-06-p01', '14-06-p02', '14-06-p03',
    ];

    expect(exercises).toHaveLength(13);
    expect(exercises.map((exercise) => exercise.pageId).sort()).toEqual(actionPages.sort());
    expect(exercises.every((exercise) => exercise.status === 'published')).toBe(true);
    expect(exercises.every((exercise) => exercise.initialCode.trim().length > 0)).toBe(true);
    expect(exercises.every((exercise) => exercise.canonicalSolution.trim().length > 0)).toBe(true);
  });

  it('hace fallar cada estado inicial y aprobar cada solución propuesta', () => {
    for (const exercise of exercises) {
      const initial = validateExercise(exercise.initialCode, exercise.validationRules);
      expect(initial.valid, exercise.id).toBe(false);

      const canonical = validateExercise(
        exercise.canonicalSolution,
        exercise.validationRules,
      );
      expect(canonical.unsupportedRules, exercise.id).toEqual([]);
      expect(canonical.failedRules, exercise.id).toEqual([]);
      expect(canonical.valid, exercise.id).toBe(true);
    }
  });

  it('representa de forma segura todas las soluciones canónicas', () => {
    for (const exercise of exercises) {
      const preview = parseSafeLatexPreview(exercise.canonicalSolution);
      const hasVisibleContent = preview.paragraphs.length > 0
        || (preview.previewBlocks?.length ?? 0) > 0
        || preview.references.length > 0
        || preview.hasBibliography
        || preview.citations.length > 0;

      expect(preview.errors, exercise.id).toEqual([]);
      expect(preview.unsupportedCommands, exercise.id).toEqual([]);
      expect(hasVisibleContent, exercise.id).toBe(true);
    }
  });

  it('cubre entornos, entradas, citas, formato y relación con referencias internas', () => {
    const source = [
      ...lessonNames.map((name) => readFileSync(resolve(contentRoot, 'lesson', name), 'utf8')),
      ...pageNames.map((name) => readFileSync(resolve(contentRoot, 'lesson-page', name), 'utf8')),
      ...exerciseNames.map((name) => readFileSync(resolve(contentRoot, 'exercise', name), 'utf8')),
    ].join('\n');

    for (const required of [
      '\\begin{thebibliography}{9}',
      '\\begin{thebibliography}{99}',
      '\\bibitem',
      '\\cite',
      '\\cite{torres-calculo,lopez-metodos}',
      '\\&',
      '\\ref',
      '\\eqref',
    ]) {
      expect(source, required).toContain(required);
    }
    expect(source).toMatch(/libro/i);
    expect(source).toMatch(/artículo/i);
    expect(source).toMatch(/fictici/i);
  });

  it('ejercita validación bibliográfica específica, no contenedores vacíos', () => {
    const ruleTypes = new Set(
      exercises.flatMap((exercise) => exercise.validationRules.map((rule) => rule.type)),
    );
    for (const ruleType of [
      'REQUIRE_VALID_BIBLIOGRAPHY',
      'REQUIRE_BIBITEM_COUNT',
      'REQUIRE_RESOLVED_CITATIONS',
      'REQUIRE_CITATION_COUNT',
      'REQUIRE_REFERENCE_COUNT',
      'REQUIRE_RESOLVED_REFERENCES',
    ]) {
      expect(ruleTypes.has(ruleType as ValidationRule['type']), ruleType).toBe(true);
    }
  });
});

describe('estructura general de quince secciones', () => {
  it('incluye y carga contenido de las secciones 14 y 15', () => {
    const config = readFileSync(resolve('src/content.config.ts'), 'utf8');
    expect(config).toContain("'seccion-1[0-5].json'");
    expect(config).toContain("'14-*.md'");
    expect(config).toContain("'14-*.json'");
    expect(config).toContain("'15-*.md'");
    expect(config).toContain("'15-*.json'");

    const manifests = names('section', 'seccion-', '.json');
    expect(manifests).toHaveLength(15);
  });

  it('publica la Sección 15 con su nombre definitivo', () => {
    const section15 = JSON.parse(
      readFileSync(resolve(contentRoot, 'section/seccion-15.json'), 'utf8'),
    ) as { title: string; description: string; order: number };
    expect(section15).toMatchObject({
      title: 'Repaso',
      order: 15,
    });
    expect(section15.description).toMatch(/tarea académica completa/i);
    expect(names('lesson-page', '15-', '.md')).toHaveLength(38);
    expect(names('exercise', '15-', '.json')).toHaveLength(35);

    const lesson15Sources = names('lesson', '15-', '.md')
      .map((name) => frontmatter(`lesson/${name}`));
    expect(lesson15Sources).toHaveLength(10);
    expect(lesson15Sources.every((lesson) => lesson.status === 'published')).toBe(true);
  });

  it('genera rutas para las secciones con páginas y anuncia quince secciones', () => {
    const route = readFileSync(resolve('src/pages/aprender/[...slug].astro'), 'utf8');
    const sidebar = readFileSync(resolve('src/components/navigation/Sidebar.astro'), 'utf8');
    const index = readFileSync(resolve('src/pages/aprender/index.astro'), 'utf8');

    expect(route).toContain('sectionsWithPages');
    expect(route).toContain('.filter((section) => sectionsWithPages.has(section.data.id))');
    expect(sidebar).toContain('hasVisiblePages');
    expect(index).toContain('quince secciones');
  });
});

describe('regresión de la Sección 13', () => {
  it('conserva exactamente los borradores verificados antes de publicar la 14', () => {
    const selected: string[] = [];
    for (const directory of ['lesson', 'lesson-page', 'exercise']) {
      for (const name of readdirSync(resolve(contentRoot, directory)).sort()) {
        if (/^13-/.test(name)) selected.push(`${directory}/${name}`);
      }
    }

    const digest = createHash('sha256');
    for (const relativePath of selected) {
      digest.update(readFileSync(resolve(contentRoot, relativePath)));
    }

    expect(selected).toHaveLength(68);
    expect(digest.digest('hex')).toBe(
      'db9c19f72f0503cd32ee0a836949fa2775041d7c842e8b0b3c3236dd41c65d4b',
    );
  });
});
