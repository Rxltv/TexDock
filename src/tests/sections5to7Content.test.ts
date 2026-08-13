import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateExercise, type ValidationRule } from '../lib/exercises/validateExercise';

const contentRoot = resolve('src/content');

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(contentRoot, relativePath), 'utf-8')) as T;
}

function readFrontmatter(relativePath: string): Record<string, string | number> {
  const source = readFileSync(resolve(contentRoot, relativePath), 'utf-8');
  const block = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const data: Record<string, string | number> = {};

  for (const line of block.split('\n')) {
    const match = line.match(/^([a-zA-Z]+):\s*(?:"([^"]*)"|(\d+))$/);
    if (!match) continue;
    data[match[1]] = match[2] ?? Number(match[3]);
  }

  return data;
}

function filesWithPrefixes(directory: string, prefixes: string[], extension: string): string[] {
  return readdirSync(resolve(contentRoot, directory))
    .filter((name) => prefixes.some((prefix) => name.startsWith(prefix)) && name.endsWith(extension))
    .sort();
}

interface ExerciseFile {
  id: string;
  pageId: string;
  status: string;
  packages: string[];
  canonicalSolution: string;
  validationRules: ValidationRule[];
}

describe('contenido publicado de las secciones 5–7', () => {
  const prefixes = ['05-', '06-', '07-'];
  const lessonFiles = filesWithPrefixes('lesson', prefixes, '.md');
  const pageFiles = filesWithPrefixes('lesson-page', prefixes, '.md');
  const exerciseFiles = filesWithPrefixes('exercise', prefixes, '.json');
  const lessons = lessonFiles.map((file) => readFrontmatter(`lesson/${file}`));
  const pages = pageFiles.map((file) => readFrontmatter(`lesson-page/${file}`));
  const exercises = exerciseFiles.map((file) => readJson<ExerciseFile>(`exercise/${file}`));

  it('usa los nombres definitivos de las secciones 3, 5, 6 y 7', () => {
    expect(readJson<{ title: string }>('section/seccion-03.json').title).toBe('Paquetes');
    expect(readJson<{ title: string }>('section/seccion-05.json').title).toBe('Organización del contenido');
    expect(readJson<{ title: string }>('section/seccion-06.json').title).toBe('Escritura y formato de texto');
    expect(readJson<{ title: string }>('section/seccion-07.json').title).toBe('Listas');
  });

  it('publica 5, 8 y 5 subsecciones respectivamente', () => {
    expect(lessons.filter((lesson) => lesson.sectionId === 'seccion-05')).toHaveLength(5);
    expect(lessons.filter((lesson) => lesson.sectionId === 'seccion-06')).toHaveLength(8);
    expect(lessons.filter((lesson) => lesson.sectionId === 'seccion-07')).toHaveLength(5);
    expect(lessons.every((lesson) => lesson.status === 'published')).toBe(true);
  });

  it('publica 15, 25 y 14 páginas respectivamente', () => {
    expect(pages.filter((page) => String(page.lessonId).startsWith('05-'))).toHaveLength(15);
    expect(pages.filter((page) => String(page.lessonId).startsWith('06-'))).toHaveLength(25);
    expect(pages.filter((page) => String(page.lessonId).startsWith('07-'))).toHaveLength(14);
    expect(pages.every((page) => page.status === 'published')).toBe(true);
    expect(new Set(pages.map((page) => page.id)).size).toBe(54);
  });

  it('mantiene órdenes y slugs únicos dentro de cada subsección', () => {
    for (const lesson of lessons) {
      const lessonPages = pages.filter((page) => page.lessonId === lesson.id);
      expect(new Set(lessonPages.map((page) => page.order)).size).toBe(lessonPages.length);
      expect(new Set(lessonPages.map((page) => page.slug)).size).toBe(lessonPages.length);
    }
  });

  it('asocia una práctica publicada a cada página de acción', () => {
    const theoryPages = new Set([
      '05-01-p01', '05-02-p01', '05-03-p01', '05-04-p01',
      '06-01-p01', '06-02-p01', '06-03-p01', '06-04-p01',
      '06-05-p01', '06-06-p01', '06-07-p01',
      '07-01-p01', '07-02-p01', '07-03-p01', '07-04-p01',
    ]);
    const actionPageIds = pages
      .map((page) => String(page.id))
      .filter((pageId) => !theoryPages.has(pageId));

    expect(actionPageIds).toHaveLength(39);
    expect(exercises).toHaveLength(39);
    expect(exercises.every((exercise) => exercise.status === 'published')).toBe(true);
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(39);

    for (const pageId of actionPageIds) {
      expect(exercises.filter((exercise) => exercise.pageId === pageId)).toHaveLength(1);
    }
  });

  it('cada solución propuesta satisface reglas soportadas y específicas', () => {
    for (const exercise of exercises) {
      expect(exercise.packages).toEqual([]);
      expect(exercise.canonicalSolution.trim()).not.toBe('');
      expect(exercise.validationRules.length).toBeGreaterThan(0);

      const result = validateExercise(exercise.canonicalSolution, exercise.validationRules);
      expect(result.unsupportedRules, exercise.id).toEqual([]);
      expect(result.failedRules, exercise.id).toEqual([]);
      expect(result.valid, exercise.id).toBe(true);
    }
  });

  it('no usa delimitadores matemáticos $$ en el contenido nuevo', () => {
    for (const file of [...lessonFiles.map((name) => `lesson/${name}`), ...pageFiles.map((name) => `lesson-page/${name}`)]) {
      expect(readFileSync(resolve(contentRoot, file), 'utf-8')).not.toContain('$$');
      expect(readFileSync(resolve(contentRoot, file), 'utf-8')).not.toContain('\\(');
      expect(readFileSync(resolve(contentRoot, file), 'utf-8')).not.toContain('\\)');
    }
  });

  it('abre cada subsección de listas con una introducción pedagógica propia', () => {
    const introductions = pageFiles
      .filter((name) => /^07-\d{2}-p01\.md$/.test(name))
      .map((name) => readFileSync(resolve(contentRoot, 'lesson-page', name), 'utf8')
        .replace(/^---\n[\s\S]*?\n---\n+/, '')
        .trim());
    expect(introductions).toHaveLength(5);
    for (const introduction of introductions) {
      expect(introduction).not.toMatch(/^(\*\*|```|`|\\)/);
      expect(introduction.split('\n')[0].length).toBeGreaterThan(70);
    }
    expect(new Set(introductions.map((introduction) => introduction.split('\n')[0])).size).toBe(5);
  });
});
