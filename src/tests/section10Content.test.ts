import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateExercise, type ValidationRule } from '../lib/exercises/validateExercise';
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
    const match = line.match(/^([A-Za-z]+):\s*(?:"([^"]*)"|(\d+))$/);
    if (match) result[match[1]] = match[2] ?? Number(match[3]);
  }
  return result;
}

interface Section10Exercise {
  id: string;
  pageId: string;
  status: string;
  initialCode: string;
  canonicalSolution: string;
  validationRules: ValidationRule[];
}

const lessonNames = names('lesson', '10-', '.md');
const pageNames = names('lesson-page', '10-', '.md');
const exerciseNames = names('exercise', '10-', '.json');
const lessons = lessonNames.map((name) => frontmatter(`lesson/${name}`));
const pages = pageNames.map((name) => frontmatter(`lesson-page/${name}`));
const exercises = exerciseNames.map((name) => (
  JSON.parse(readFileSync(resolve(contentRoot, 'exercise', name), 'utf8')) as Section10Exercise
));

describe('Sección 10: Tablas', () => {
  it('publica las ocho subsecciones normativas con el título general exacto', () => {
    const section = JSON.parse(
      readFileSync(resolve(contentRoot, 'section/seccion-10.json'), 'utf8'),
    ) as { title: string };
    expect(section.title).toBe('Tablas');
    expect(lessons.map((lesson) => lesson.title)).toEqual([
      'El entorno tabular',
      'Alineación de datos',
      'Bordes básicos',
      'Tablas académicas con booktabs',
      'Combinar columnas',
      'Combinar filas con multirow',
      'El entorno flotante table',
      'Reto integrador de tablas',
    ]);
    expect(lessons.every((lesson) => lesson.status === 'published')).toBe(true);
  });

  it('publica exactamente 31 páginas con la distribución 5,3,4,4,4,4,4,3', () => {
    expect(pageNames).toHaveLength(31);
    expect(lessons.map((lesson) => (
      pages.filter((page) => page.lessonId === lesson.id).length
    ))).toEqual([5, 3, 4, 4, 4, 4, 4, 3]);
    expect(pages.every((page) => page.status === 'published')).toBe(true);
    expect(new Set(pages.map((page) => page.id)).size).toBe(31);
    for (const lesson of lessons) {
      const lessonPages = pages.filter((page) => page.lessonId === lesson.id);
      expect(new Set(lessonPages.map((page) => page.order)).size).toBe(lessonPages.length);
      expect(new Set(lessonPages.map((page) => page.slug)).size).toBe(lessonPages.length);
    }
  });

  it('asocia un ejercicio interactivo a cada una de las 16 páginas de acción', () => {
    const actionPages = [
      '10-01-p04', '10-01-p05',
      '10-02-p02', '10-02-p03',
      '10-03-p03', '10-03-p04',
      '10-04-p03', '10-04-p04',
      '10-05-p02', '10-05-p04',
      '10-06-p03', '10-06-p04',
      '10-07-p04',
      '10-08-p01', '10-08-p02', '10-08-p03',
    ];
    expect(exercises).toHaveLength(16);
    expect(exercises.map((exercise) => exercise.pageId).sort()).toEqual(actionPages.sort());
    expect(exercises.every((exercise) => exercise.status === 'published')).toBe(true);
    expect(exercises.every((exercise) => exercise.initialCode.trim().length > 0)).toBe(true);
  });

  it('hace fallar cada estado inicial y valida cada solución propuesta', () => {
    for (const exercise of exercises) {
      expect(exercise.validationRules.length, exercise.id).toBeGreaterThan(0);
      expect(validateExercise(exercise.initialCode, exercise.validationRules).valid, exercise.id).toBe(false);
      const canonical = validateExercise(exercise.canonicalSolution, exercise.validationRules);
      expect(canonical.unsupportedRules, exercise.id).toEqual([]);
      expect(canonical.failedRules, exercise.id).toEqual([]);
      expect(canonical.valid, exercise.id).toBe(true);
    }
  });

  it('valida acciones específicas de tabular, booktabs, multicolumn y multirow', () => {
    const exercise = (id: string) => exercises.find((item) => item.id === id)!;
    expect(validateExercise(
      exercise('10-01-01').canonicalSolution,
      exercise('10-01-01').validationRules,
    ).valid).toBe(true);
    expect(validateExercise(
      exercise('10-04-01').canonicalSolution,
      exercise('10-04-01').validationRules,
    ).valid).toBe(true);
    expect(validateExercise(
      exercise('10-05-01').canonicalSolution,
      exercise('10-05-01').validationRules,
    ).valid).toBe(true);
    expect(validateExercise(
      exercise('10-06-01').canonicalSolution,
      exercise('10-06-01').validationRules,
    ).valid).toBe(true);
  });

  it('produce una vista previa segura y visible para todas las soluciones', () => {
    for (const exercise of exercises) {
      const preview = parseSafeLatexPreview(exercise.canonicalSolution);
      expect(preview.errors, exercise.id).toEqual([]);
      expect(preview.tables.length, exercise.id).toBeGreaterThan(0);
      expect(preview.unsupportedCommands, exercise.id).toEqual([]);
    }
  });

  it('introduce booktabs y multirow solamente desde sus subsecciones normativas', () => {
    const sourcesBeforeBooktabs = [
      ...lessonNames.filter((name) => name < '10-04').map((name) => `lesson/${name}`),
      ...pageNames.filter((name) => name < '10-04').map((name) => `lesson-page/${name}`),
      ...exerciseNames.filter((name) => name < '10-04').map((name) => `exercise/${name}`),
    ];
    const sourcesBeforeMultirow = [
      ...lessonNames.filter((name) => name < '10-06').map((name) => `lesson/${name}`),
      ...pageNames.filter((name) => name < '10-06').map((name) => `lesson-page/${name}`),
      ...exerciseNames.filter((name) => name < '10-06').map((name) => `exercise/${name}`),
    ];
    for (const source of sourcesBeforeBooktabs) {
      expect(readFileSync(resolve(contentRoot, source), 'utf8'), source).not.toContain('booktabs');
    }
    for (const source of sourcesBeforeMultirow) {
      expect(readFileSync(resolve(contentRoot, source), 'utf8'), source).not.toContain('multirow');
    }
  });

  it('no introduce referencias, imágenes, bibliografía, TikZ ni PGFPlots', () => {
    for (const relativePath of [
      ...lessonNames.map((name) => `lesson/${name}`),
      ...pageNames.map((name) => `lesson-page/${name}`),
      ...exerciseNames.map((name) => `exercise/${name}`),
    ]) {
      const source = readFileSync(resolve(contentRoot, relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(/\\(?:label|ref|includegraphics|bibliography|cite)\b/);
      expect(source, relativePath).not.toMatch(/\b(?:TikZ|PGFPlots)\b/i);
    }
  });

});

describe('regresión de contenido de las Secciones 1–9', () => {
  it('conserva exactamente el conjunto de archivos recibido antes de implementar la Sección 10', () => {
    const selected: string[] = [];
    for (const directory of ['section', 'lesson', 'lesson-page', 'example', 'exercise']) {
      for (const name of readdirSync(resolve(contentRoot, directory)).sort()) {
        const belongs = directory === 'section'
          ? /^seccion-0[1-9]\.json$/.test(name)
          : /^0[1-9]-/.test(name);
        if (belongs) selected.push(`${directory}/${name}`);
      }
    }
    const digest = createHash('sha256');
    for (const relativePath of selected) {
      digest.update(`${relativePath}\0`);
      digest.update(readFileSync(resolve(contentRoot, relativePath)));
      digest.update('\0');
    }
    expect(selected).toHaveLength(422);
    expect(digest.digest('hex')).toBe(
      'bd81d484b0ce5c20f01f72a38e63157268c0ce00690618f848f23930e89b529e',
    );
  });
});
