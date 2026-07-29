import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
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

interface Section11Exercise {
  id: string;
  pageId: string;
  status: string;
  initialCode: string;
  canonicalSolution: string;
  validationRules: ValidationRule[];
}

const lessonNames = names('lesson', '11-', '.md');
const pageNames = names('lesson-page', '11-', '.md');
const exerciseNames = names('exercise', '11-', '.json');
const lessons = lessonNames.map((name) => frontmatter(`lesson/${name}`));
const pages = pageNames.map((name) => frontmatter(`lesson-page/${name}`));
const exercises = exerciseNames.map((name) => (
  JSON.parse(readFileSync(resolve(contentRoot, 'exercise', name), 'utf8')) as Section11Exercise
));

describe('Sección 11: Imágenes y figuras', () => {
  it('publica las siete subsecciones normativas con el título general exacto', () => {
    const section = JSON.parse(
      readFileSync(resolve(contentRoot, 'section/seccion-11.json'), 'utf8'),
    ) as { title: string };
    expect(section.title).toBe('Imágenes y figuras');
    expect(lessons.map((lesson) => lesson.title)).toEqual([
      'Incorporar graphicx',
      'Control de tamaño',
      'Rotación y combinación de opciones',
      'El entorno figure',
      'Colocación de figuras',
      'Paneles con subcaption',
      'Reto integrador de figuras',
    ]);
    expect(lessons.every((lesson) => lesson.status === 'published')).toBe(true);
  });

  it('publica exactamente 25 páginas con la distribución 4,4,3,4,2,5,3', () => {
    expect(pageNames).toHaveLength(25);
    expect(lessons.map((lesson) => (
      pages.filter((page) => page.lessonId === lesson.id).length
    ))).toEqual([4, 4, 3, 4, 2, 5, 3]);
    expect(pages.every((page) => page.status === 'published')).toBe(true);
    expect(new Set(pages.map((page) => page.id)).size).toBe(25);
    for (const lesson of lessons) {
      const lessonPages = pages.filter((page) => page.lessonId === lesson.id);
      expect(new Set(lessonPages.map((page) => page.order)).size).toBe(lessonPages.length);
      expect(new Set(lessonPages.map((page) => page.slug)).size).toBe(lessonPages.length);
    }
  });

  it('asocia un ejercicio interactivo a cada una de las 15 páginas de acción', () => {
    const actionPages = [
      '11-01-p03', '11-01-p04',
      '11-02-p03', '11-02-p04',
      '11-03-p03',
      '11-04-p03', '11-04-p04',
      '11-05-p01', '11-05-p02',
      '11-06-p03', '11-06-p04', '11-06-p05',
      '11-07-p01', '11-07-p02', '11-07-p03',
    ];
    expect(exercises).toHaveLength(15);
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

  it('produce una vista previa segura y visible para todas las soluciones', () => {
    for (const exercise of exercises) {
      const preview = parseSafeLatexPreview(exercise.canonicalSolution);
      expect(preview.errors, exercise.id).toEqual([]);
      expect(preview.figures.length, exercise.id).toBeGreaterThan(0);
      expect(preview.unsupportedCommands, exercise.id).toEqual([]);
    }
  });

  it('limita la vista previa a los tres recursos PNG locales del curso', () => {
    const resourceRoot = resolve('public/imagenes/curso/seccion-11');
    const expectedResources = ['antes.png', 'despues.png', 'imagen.png'];
    expect(readdirSync(resourceRoot).sort()).toEqual(expectedResources);
    for (const resource of expectedResources) {
      const path = resolve(resourceRoot, resource);
      expect(existsSync(path), resource).toBe(true);
      expect(statSync(path).size, resource).toBeGreaterThan(0);
      expect(readFileSync(path).subarray(0, 8)).toEqual(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      );
    }
  });

  it('no adelanta referencias, notas, bibliografía, TikZ ni PGFPlots', () => {
    for (const relativePath of [
      ...lessonNames.map((name) => `lesson/${name}`),
      ...pageNames.map((name) => `lesson-page/${name}`),
      ...exerciseNames.map((name) => `exercise/${name}`),
    ]) {
      const source = readFileSync(resolve(contentRoot, relativePath), 'utf8');
      expect(source, relativePath).not.toContain('$$');
      expect(source, relativePath).not.toMatch(/\\(?:label|ref|footnote|bibliography|cite)\b/);
      expect(source, relativePath).not.toMatch(/\b(?:TikZ|PGFPlots)\b/i);
    }
  });
});

describe('regresión de contenido de las Secciones 1–10', () => {
  it('conserva exactamente el conjunto verificado antes de completar la Sección 11', () => {
    const selected: string[] = [];
    for (const directory of ['section', 'lesson', 'lesson-page', 'example', 'exercise']) {
      for (const name of readdirSync(resolve(contentRoot, directory)).sort()) {
        const belongs = directory === 'section'
          ? /^seccion-(?:0[1-9]|10)\.json$/.test(name)
          : /^(?:0[1-9]|10)-/.test(name);
        if (belongs) selected.push(`${directory}/${name}`);
      }
    }
    const digest = createHash('sha256');
    for (const relativePath of selected) {
      digest.update(`${relativePath}\0`);
      digest.update(readFileSync(resolve(contentRoot, relativePath)));
      digest.update('\0');
    }
    expect(selected).toHaveLength(478);
    expect(digest.digest('hex')).toBe(
      'c914b98d2565cc9718949fcc9bd40fbe4611243bb9457b71c2bf0902d04c8a14',
    );
  });
});
