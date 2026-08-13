import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateExercise, type ValidationRule } from '../lib/exercises/validateExercise';
import { parseSafeLatexPreview } from '../lib/latex/safeLatexPreview';

const contentRoot = resolve('src/content');

function files(directory: string, prefixes: string[], extension: string): string[] {
  return readdirSync(resolve(contentRoot, directory))
    .filter((name) => prefixes.some((prefix) => name.startsWith(prefix)) && name.endsWith(extension))
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

interface ExerciseFile {
  id: string;
  pageId: string;
  status: string;
  initialCode: string;
  canonicalSolution: string;
  validationRules: ValidationRule[];
  instructions: string;
  objective: string;
}

const prefixes = ['08-', '09-'];
const lessonFiles = files('lesson', prefixes, '.md');
const pageFiles = files('lesson-page', prefixes, '.md');
const exerciseFiles = files('exercise', prefixes, '.json');
const lessons = lessonFiles.map((name) => frontmatter(`lesson/${name}`));
const pages = pageFiles.map((name) => frontmatter(`lesson-page/${name}`));
const exercises = exerciseFiles.map((name) => (
  JSON.parse(readFileSync(resolve(contentRoot, 'exercise', name), 'utf8')) as ExerciseFile
));

describe('contenido publicado de las secciones 8 y 9', () => {
  it('usa los títulos definitivos y conserva Paquetes para la sección 3', () => {
    const section = (number: string) => JSON.parse(
      readFileSync(resolve(contentRoot, 'section', `seccion-${number}.json`), 'utf8'),
    ) as { title: string };
    expect(section('03').title).toBe('Paquetes');
    expect(section('08').title).toBe('Modo matemático');
    expect(section('09').title).toBe('Redacción matemática');
  });

  it('publica 22 y 7 subsecciones con sus títulos normativos', () => {
    const section8 = lessons.filter((lesson) => lesson.sectionId === 'seccion-08');
    const section9 = lessons.filter((lesson) => lesson.sectionId === 'seccion-09');
    expect(section8).toHaveLength(22);
    expect(section9).toHaveLength(7);
    expect(section8[0].title).toBe('Matemáticas en línea');
    expect(section8.at(-1)?.title).toBe('Reto integrador de notación');
    expect(section9[0].title).toBe('Estructura de un ejercicio resuelto');
    expect(section9.at(-1)?.title).toBe('Reto de redacción matemática');
    expect(lessons.every((lesson) => lesson.status === 'published')).toBe(true);
  });

  it('publica las 87 y 27 páginas definidas en la estructura normativa', () => {
    const section8Pages = pages.filter((page) => String(page.lessonId).startsWith('08-'));
    const section9Pages = pages.filter((page) => String(page.lessonId).startsWith('09-'));
    expect(section8Pages).toHaveLength(87);
    expect(section9Pages).toHaveLength(27);
    expect(pages.every((page) => page.status === 'published')).toBe(true);
    expect(new Set(pages.map((page) => page.id)).size).toBe(114);
  });

  it('mantiene orden y slug únicos dentro de cada subsección', () => {
    for (const lesson of lessons) {
      const lessonPages = pages.filter((page) => page.lessonId === lesson.id);
      expect(new Set(lessonPages.map((page) => page.order)).size).toBe(lessonPages.length);
      expect(new Set(lessonPages.map((page) => page.slug)).size).toBe(lessonPages.length);
    }
  });

  it('asocia editores a las 67 páginas prácticas, de depuración y reto', () => {
    expect(exercises).toHaveLength(67);
    expect(exercises.every((exercise) => exercise.status === 'published')).toBe(true);
    expect(exercises.every((exercise) => exercise.initialCode.trim().length > 0)).toBe(true);
    expect(new Set(exercises.map((exercise) => exercise.pageId)).size).toBe(67);
  });

  it('cada solución propuesta cumple reglas específicas y soportadas', () => {
    for (const exercise of exercises) {
      expect(exercise.validationRules.length, exercise.id).toBeGreaterThan(0);
      const initialValidation = validateExercise(exercise.initialCode, exercise.validationRules);
      expect(initialValidation.valid, `${exercise.id} no debe iniciar resuelto`).toBe(false);
      const validation = validateExercise(exercise.canonicalSolution, exercise.validationRules);
      expect(validation.unsupportedRules, exercise.id).toEqual([]);
      expect(validation.failedRules, exercise.id).toEqual([]);
      expect(validation.valid, exercise.id).toBe(true);
    }
  });

  it('cada solución propuesta obtiene una vista previa segura o parcial explicada', () => {
    for (const exercise of exercises) {
      const preview = parseSafeLatexPreview(exercise.canonicalSolution);
      expect(preview.errors, exercise.id).toEqual([]);
      expect(
        preview.paragraphs.length + (preview.previewBlocks?.length ?? 0),
        exercise.id,
      ).toBeGreaterThan(0);
    }
  });

  it('usa $...$ inline y \\[...\\] en display, sin formatos compatibles en contenido', () => {
    const sources = [
      ...pageFiles.map((name) => readFileSync(resolve(contentRoot, 'lesson-page', name), 'utf8')),
      ...exercises.flatMap((exercise) => [exercise.instructions, exercise.initialCode, exercise.canonicalSolution]),
    ];
    expect(sources.some((source) => source.includes('$x$'))).toBe(true);
    expect(sources.every((source) => !source.includes('\\(') && !source.includes('\\)'))).toBe(true);
    expect(sources.every((source) => !source.includes('$$'))).toBe(true);
    expect(sources.some((source) => source.includes('\\[') && source.includes('\\]'))).toBe(true);
  });

  it('da instrucciones verificables y un objetivo coherente a cada ejercicio', () => {
    for (const exercise of exercises) {
      expect(exercise.instructions.length, exercise.id).toBeGreaterThanOrEqual(120);
      expect(exercise.instructions, exercise.id).toMatch(/cuerpo|preámbulo|documento/i);
      expect(exercise.instructions, exercise.id).toMatch(/conserva|comprueba|verifica|resultado/i);
      expect(exercise.objective.length, exercise.id).toBeGreaterThanOrEqual(45);
    }
  });

  it('amplía superíndices y subíndices con agrupación, lectura y práctica', () => {
    const subsection = ['01', '02', '03', '04']
      .map((page) => readFileSync(resolve(contentRoot, 'lesson-page', `08-03-p${page}.md`), 'utf8'))
      .join('\n');
    for (const expected of [
      '$x^2$', '$x^{10}$', '$a_n$', '$a_{n+1}$',
      'superíndice', 'subíndice', 'llaves', 'Errores frecuentes',
      'Actividad de corrección y construcción',
    ]) {
      expect(subsection).toContain(expected);
    }
  });

  it('introduce cada subsección matemática antes del primer comando o reto', () => {
    const introductions = pageFiles
      .filter((name) => /^08-\d{2}-p01\.md$/.test(name))
      .map((name) => readFileSync(resolve(contentRoot, 'lesson-page', name), 'utf8')
        .replace(/^---\n[\s\S]*?\n---\n+/, '')
        .trim());
    expect(introductions).toHaveLength(22);
    for (const introduction of introductions) {
      expect(introduction).not.toMatch(/^(\*\*|```|`|\\)/);
      expect(introduction.split('\n')[0].length).toBeGreaterThan(75);
    }
    expect(new Set(introductions.map((introduction) => introduction.split('\n')[0])).size).toBe(22);
  });
});
