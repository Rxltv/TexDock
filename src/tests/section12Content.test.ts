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
    const match = line.match(/^([A-Za-z]+):\s*(?:"([^"]*)"|(\d+))$/);
    if (match) result[match[1]] = match[2] ?? Number(match[3]);
  }
  return result;
}

interface Section12Exercise {
  id: string;
  pageId: string;
  status: string;
  initialCode: string;
  canonicalSolution: string;
  validationRules: ValidationRule[];
}

const lessonNames = names('lesson', '12-', '.md');
const pageNames = names('lesson-page', '12-', '.md');
const exerciseNames = names('exercise', '12-', '.json');
const lessons = lessonNames.map((name) => frontmatter(`lesson/${name}`));
const pages = pageNames.map((name) => frontmatter(`lesson-page/${name}`));
const exercises = exerciseNames.map((name) => (
  JSON.parse(readFileSync(resolve(contentRoot, 'exercise', name), 'utf8')) as Section12Exercise
));

describe('Sección 12: Notas al pie', () => {
  it('publica las cinco subsecciones normativas en el orden exacto', () => {
    const section = JSON.parse(
      readFileSync(resolve(contentRoot, 'section/seccion-12.json'), 'utf8'),
    ) as { title: string };

    expect(section.title).toBe('Notas al pie');
    expect(lessons.map((lesson) => lesson.title)).toEqual([
      'Nota básica',
      'Posición en la oración',
      'Varias notas en un mismo texto',
      'Notas dentro de tablas',
      'Reto de notas',
    ]);
    expect(lessons.every((lesson) => lesson.status === 'published')).toBe(true);
  });

  it('publica exactamente 15 páginas con la distribución 3,3,3,4,2', () => {
    expect(pageNames).toHaveLength(15);
    expect(lessons.map((lesson) => (
      pages.filter((page) => page.lessonId === lesson.id).length
    ))).toEqual([3, 3, 3, 4, 2]);
    expect(pages.every((page) => page.status === 'published')).toBe(true);
    expect(new Set(pages.map((page) => page.id)).size).toBe(15);

    for (const lesson of lessons) {
      const lessonPages = pages.filter((page) => page.lessonId === lesson.id);
      expect(new Set(lessonPages.map((page) => page.order)).size).toBe(lessonPages.length);
      expect(new Set(lessonPages.map((page) => page.slug)).size).toBe(lessonPages.length);
    }
  });

  it('asocia ejercicios a las ocho páginas de práctica o reto', () => {
    const actionPages = [
      '12-01-p02',
      '12-01-p03',
      '12-02-p03',
      '12-03-p02',
      '12-04-p03',
      '12-04-p04',
      '12-05-p01',
      '12-05-p02',
    ];

    expect(exercises).toHaveLength(8);
    expect(exercises.map((exercise) => exercise.pageId).sort()).toEqual(actionPages.sort());
    expect(exercises.every((exercise) => exercise.status === 'published')).toBe(true);
    expect(exercises.every((exercise) => exercise.initialCode.trim().length > 0)).toBe(true);
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

  it('muestra marcas y textos de notas sin comandos no soportados', () => {
    for (const exercise of exercises) {
      const preview = parseSafeLatexPreview(exercise.canonicalSolution);
      expect(preview.errors, exercise.id).toEqual([]);
      expect(preview.footnotes.length, exercise.id).toBeGreaterThan(0);
      expect(preview.unsupportedCommands, exercise.id).toEqual([]);
    }
  });

  it('conserva la Sección 12 al publicar las secciones 13–15', () => {
    const config = readFileSync(resolve('src/content.config.ts'), 'utf8');
    expect(config).toContain("'12-*.md'");
    expect(config).toContain("'12-*.json'");
    expect(config).toContain("'13-*.md'");
    expect(config).toContain("'13-*.json'");
    expect(config).toContain("'14-*.md'");
    expect(config).toContain("'14-*.json'");
    expect(config).toContain("'15-*.md'");
    expect(config).toContain("'15-*.json'");
  });

  it('no adelanta comandos de referencias, bibliografía, TikZ ni PGFPlots', () => {
    for (const relativePath of [
      ...lessonNames.map((name) => `lesson/${name}`),
      ...pageNames.map((name) => `lesson-page/${name}`),
      ...exerciseNames.map((name) => `exercise/${name}`),
    ]) {
      const source = readFileSync(resolve(contentRoot, relativePath), 'utf8');
      expect(source, relativePath).not.toContain('$$');
      expect(source, relativePath).not.toMatch(/\\(?:label|ref|pageref|cite|bibliography)\b/);
      expect(source, relativePath).not.toMatch(/\b(?:TikZ|PGFPlots)\b/i);
    }
  });
});

describe('regresión de contenido de las Secciones 1–11', () => {
  it('conserva exactamente el conjunto verificado antes de publicar la Sección 12', () => {
    const selected: string[] = [];
    for (const directory of ['section', 'lesson', 'lesson-page', 'example', 'exercise']) {
      for (const name of readdirSync(resolve(contentRoot, directory)).sort()) {
        const belongs = directory === 'section'
          ? /^seccion-(?:0[1-9]|1[01])\.json$/.test(name)
          : /^(?:0[1-9]|1[01])-/.test(name);
        if (belongs) selected.push(`${directory}/${name}`);
      }
    }

    const digest = createHash('sha256');
    for (const relativePath of selected) {
      digest.update(`${relativePath}\0`);
      digest.update(readFileSync(resolve(contentRoot, relativePath)));
      digest.update('\0');
    }

    expect(selected).toHaveLength(526);
    expect(digest.digest('hex')).toBe(
      '269afef38b375a182c6379c4cf131e4f66148304aec558461ffafcb22368fc16',
    );
  });
});
