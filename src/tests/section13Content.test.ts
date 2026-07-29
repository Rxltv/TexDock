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

interface Section13Exercise {
  id: string;
  pageId: string;
  status: string;
  initialCode: string;
  canonicalSolution: string;
  validationRules: ValidationRule[];
}

const lessonNames = names('lesson', '13-', '.md');
const pageNames = names('lesson-page', '13-', '.md');
const exerciseNames = names('exercise', '13-', '.json');
const lessons = lessonNames.map((name) => frontmatter(`lesson/${name}`));
const pages = pageNames.map((name) => frontmatter(`lesson-page/${name}`));
const exercises = exerciseNames.map((name) => (
  JSON.parse(readFileSync(resolve(contentRoot, 'exercise', name), 'utf8')) as Section13Exercise
));

describe('Sección 13: Referencias internas y enlaces', () => {
  it('publica las diez subsecciones normativas en el orden exacto', () => {
    const section = JSON.parse(
      readFileSync(resolve(contentRoot, 'section/seccion-13.json'), 'utf8'),
    ) as { title: string };

    expect(section.title).toBe('Referencias internas y enlaces');
    expect(lessons.map((lesson) => lesson.title)).toEqual([
      'Etiquetas',
      'Referencias con \\ref',
      'Número de página',
      'Referencias a ecuaciones',
      'Referencias a tablas',
      'Referencias a figuras',
      'Reutilizar una nota mediante referencias',
      'Enlaces con hyperref',
      'Referencias inteligentes con cleveref',
      'Reto integrador de referencias',
    ]);
    expect(lessons.every((lesson) => lesson.status === 'published')).toBe(true);
  });

  it('publica exactamente 35 páginas con la distribución normativa', () => {
    expect(pageNames).toHaveLength(35);
    expect(lessons.map((lesson) => (
      pages.filter((page) => page.lessonId === lesson.id).length
    ))).toEqual([3, 4, 3, 4, 3, 3, 4, 4, 4, 3]);
    expect(pages.every((page) => page.status === 'published')).toBe(true);
    expect(new Set(pages.map((page) => page.id)).size).toBe(35);
    expect(pages.map((page) => page.title)).toEqual([
      '\\label',
      'Dónde colocar la etiqueta',
      'Etiquetar una sección',
      'Recuperar un número',
      'Citar una sección',
      'Cambiar el orden',
      'Resolver ??',
      '\\pageref',
      'Número y página',
      'Reto de navegación',
      '\\eqref',
      'Etiquetar una ecuación',
      'Citar la ecuación',
      'Renumeración automática',
      'Añadir una etiqueta después de caption',
      'Citar la tabla',
      'Reto de tabla y página',
      'Etiquetar una figura',
      'Citar una figura',
      'Referenciar una subfigura',
      'Etiquetar la nota original',
      'Mostrar la misma marca',
      'Método A y Método B',
      'Reto de nota reutilizada',
      'Incorporar hyperref',
      'Orden del paquete',
      'Probar enlaces internos',
      'Mantener la función sin decorar en exceso',
      'Incorporar cleveref',
      '\\cref y \\Cref',
      'Citar objetos diferentes',
      'Comparar ref y cref',
      'Red de referencias',
      'Cambiar el orden del documento',
      'Depuración de etiquetas',
    ]);

    for (const lesson of lessons) {
      const lessonPages = pages.filter((page) => page.lessonId === lesson.id);
      expect(new Set(lessonPages.map((page) => page.order)).size).toBe(lessonPages.length);
      expect(new Set(lessonPages.map((page) => page.slug)).size).toBe(lessonPages.length);
    }
  });

  it('asocia ejercicios a las 23 páginas de práctica, aplicación, reto o depuración', () => {
    const actionPages = [
      '13-01-p03',
      '13-02-p02', '13-02-p03', '13-02-p04',
      '13-03-p02', '13-03-p03',
      '13-04-p02', '13-04-p03', '13-04-p04',
      '13-05-p01', '13-05-p02', '13-05-p03',
      '13-06-p01', '13-06-p02', '13-06-p03',
      '13-07-p03', '13-07-p04',
      '13-08-p03',
      '13-09-p03', '13-09-p04',
      '13-10-p01', '13-10-p02', '13-10-p03',
    ];

    expect(exercises).toHaveLength(23);
    expect(exercises.map((exercise) => exercise.pageId).sort()).toEqual(actionPages.sort());
    expect(exercises.every((exercise) => exercise.status === 'published')).toBe(true);
    expect(exercises.every((exercise) => exercise.initialCode.trim().length > 0)).toBe(true);
    expect(exercises.every((exercise) => exercise.canonicalSolution.trim().length > 0)).toBe(true);
  });

  it('hace fallar cada estado inicial y valida cada solución propuesta', () => {
    for (const exercise of exercises) {
      expect(exercise.validationRules.length, exercise.id).toBeGreaterThan(0);
      expect(
        validateExercise(exercise.initialCode, exercise.validationRules).valid,
        exercise.id,
      ).toBe(false);

      const canonical = validateExercise(
        exercise.canonicalSolution,
        exercise.validationRules,
      );
      expect(canonical.unsupportedRules, exercise.id).toEqual([]);
      expect(canonical.failedRules, exercise.id).toEqual([]);
      expect(canonical.valid, exercise.id).toBe(true);
    }
  });

  it('genera una representación educativa visible y segura para cada solución', () => {
    for (const exercise of exercises) {
      const preview = parseSafeLatexPreview(exercise.canonicalSolution);
      const hasVisibleContent = preview.paragraphs.length > 0
        || (preview.previewBlocks?.length ?? 0) > 0
        || preview.tables.length > 0
        || preview.figures.length > 0
        || preview.footnotes.length > 0;

      expect(preview.errors, exercise.id).toEqual([]);
      expect(preview.unsupportedCommands, exercise.id).toEqual([]);
      expect(hasVisibleContent, exercise.id).toBe(true);
    }
  });

  it('cubre todos los comandos y convenciones obligatorios', () => {
    const source = [
      ...lessonNames.map((name) => readFileSync(resolve(contentRoot, 'lesson', name), 'utf8')),
      ...pageNames.map((name) => readFileSync(resolve(contentRoot, 'lesson-page', name), 'utf8')),
      ...exerciseNames.map((name) => readFileSync(resolve(contentRoot, 'exercise', name), 'utf8')),
    ].join('\n');

    for (const command of [
      '\\label',
      '\\ref',
      '\\pageref',
      '\\eqref',
      '\\textsuperscript',
      '\\usepackage{hyperref}',
      '\\usepackage{cleveref}',
      '\\cref',
      '\\Cref',
    ]) {
      expect(source, command).toContain(command);
    }
    for (const prefix of ['sec:', 'eq:', 'tab:', 'fig:', 'thm:', 'nota:']) {
      expect(source, prefix).toContain(prefix);
    }
  });

  it('mantiene bibliografía y cite fuera de esta sección', () => {
    for (const relativePath of [
      ...lessonNames.map((name) => `lesson/${name}`),
      ...pageNames.map((name) => `lesson-page/${name}`),
      ...exerciseNames.map((name) => `exercise/${name}`),
    ]) {
      const source = readFileSync(resolve(contentRoot, relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(/\\(?:cite|bibliography|bibliographystyle)\b/);
      expect(source, relativePath).not.toMatch(/\b(?:BibTeX|Biber)\b/i);
    }
  });

  it('conserva 13 al publicar las secciones 14 y 15', () => {
    const config = readFileSync(resolve('src/content.config.ts'), 'utf8');
    expect(config).toContain("'seccion-1[0-5].json'");
    expect(config).toContain("'13-*.md'");
    expect(config).toContain("'13-*.json'");
    expect(config).toContain("'14-*.md'");
    expect(config).toContain("'14-*.json'");
    expect(config).toContain("'15-*.md'");
    expect(config).toContain("'15-*.json'");
  });
});

describe('regresión de contenido de las Secciones 1–12', () => {
  it('conserva exactamente el conjunto verificado antes de publicar la Sección 13', () => {
    const selected: string[] = [];
    for (const directory of ['section', 'lesson', 'lesson-page', 'example', 'exercise']) {
      for (const name of readdirSync(resolve(contentRoot, directory)).sort()) {
        const belongs = directory === 'section'
          ? /^seccion-(?:0[1-9]|1[0-2])\.json$/.test(name)
          : /^(?:0[1-9]|1[0-2])-/.test(name);
        if (belongs) selected.push(`${directory}/${name}`);
      }
    }

    const digest = createHash('sha256');
    for (const relativePath of selected) {
      digest.update(`${relativePath}\0`);
      digest.update(readFileSync(resolve(contentRoot, relativePath)));
      digest.update('\0');
    }

    expect(selected).toHaveLength(555);
    expect(digest.digest('hex')).toBe(
      '45e62f0c8c706c76083625116bbdc3ffd190743b118477e2aa8ddf23990dc0a1',
    );
  });
});
