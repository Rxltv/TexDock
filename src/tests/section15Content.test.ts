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

interface Section15Exercise {
  id: string;
  pageId: string;
  status: string;
  initialCode: string;
  canonicalSolution: string;
  validationRules: ValidationRule[];
}

const lessonNames = names('lesson', '15-', '.md');
const pageNames = names('lesson-page', '15-', '.md');
const exerciseNames = names('exercise', '15-', '.json');
const lessons = lessonNames.map((name) => frontmatter(`lesson/${name}`));
const pages = pageNames.map((name) => frontmatter(`lesson-page/${name}`));
const exercises = exerciseNames.map((name) => (
  JSON.parse(readFileSync(resolve(contentRoot, 'exercise', name), 'utf8')) as Section15Exercise
));

describe('Sección 15: Repaso', () => {
  it('usa el nombre visible exacto y publica las diez subsecciones normativas', () => {
    const section = JSON.parse(
      readFileSync(resolve(contentRoot, 'section/seccion-15.json'), 'utf8'),
    ) as { title: string; order: number };

    expect(section).toMatchObject({ title: 'Repaso', order: 15 });
    expect(lessons.map((lesson) => lesson.title)).toEqual([
      'Definir el producto final',
      'Seleccionar paquetes',
      'Construir la estructura',
      'Integrar matemáticas',
      'Integrar una tabla',
      'Integrar una figura',
      'Añadir notas y bibliografía',
      'Revisión por capas',
      'Depuración final',
      'Entrega',
    ]);
    expect(lessons.every((lesson) => lesson.status === 'published')).toBe(true);
  });

  it('publica exactamente 38 páginas con la distribución y títulos normativos', () => {
    expect(pageNames).toHaveLength(38);
    expect(lessons.map((lesson) => (
      pages.filter((page) => page.lessonId === lesson.id).length
    ))).toEqual([3, 4, 4, 4, 4, 4, 4, 4, 4, 3]);
    expect(pages.every((page) => page.status === 'published')).toBe(true);
    expect(new Set(pages.map((page) => page.id)).size).toBe(38);
    expect(pages.map((page) => page.title)).toEqual([
      'Requisitos mínimos',
      'Elegir un tema',
      'Crear un esquema',
      'Paquetes obligatorios por necesidad',
      'Construir el preámbulo',
      'Declaraciones propias',
      'Comprobar el preámbulo',
      'Título y resumen',
      'Índice y secciones',
      'Redacción principal',
      'Lista de objetivos o resultados',
      'Expresión en línea y fórmula en bloque',
      'Desarrollo matemático',
      'Ecuación numerada y referencia',
      'Elemento avanzado opcional',
      'Diseñar los datos',
      'Construir tabular',
      'Aplicar booktabs',
      'Convertirla en flotante',
      'Elegir y dimensionar el recurso',
      'Crear la figura',
      'Etiquetar y citar',
      'Panel opcional',
      'Nota pertinente',
      'Registrar dos fuentes',
      'Citar las fuentes',
      'Verificar claves',
      'Revisar estructura',
      'Revisar contenido',
      'Revisar automatizaciones',
      'Revisar paquetes',
      'Primer error de compilación',
      'Errores frecuentes',
      'Documento compila, pero no está listo',
      'Reto de reparación',
      'Archivos finales',
      'Comprobación autónoma',
      'Resultado esperado',
    ]);
  });

  it('ofrece 35 ejercicios interactivos con estado inicial y solución propuesta', () => {
    expect(exercises).toHaveLength(35);
    expect(exercises.every((exercise) => exercise.status === 'published')).toBe(true);
    expect(exercises.every((exercise) => exercise.initialCode.trim().length > 0)).toBe(true);
    expect(exercises.every((exercise) => exercise.canonicalSolution.trim().length > 0)).toBe(true);
    expect(exercises.every((exercise) => exercise.validationRules.length > 0)).toBe(true);
    expect(new Set(exercises.map((exercise) => exercise.pageId)).size).toBe(35);
  });

  it('hace fallar cada borrador inicial y aprobar cada solución propuesta', () => {
    for (const exercise of exercises) {
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

  it('representa de forma visible y segura cada solución propuesta', () => {
    for (const exercise of exercises) {
      const preview = parseSafeLatexPreview(exercise.canonicalSolution);
      const hasVisibleContent = preview.documentClass !== null
        || preview.paragraphs.length > 0
        || preview.abstractParagraphs.length > 0
        || preview.outline.length > 0
        || preview.formattingUses.length > 0
        || (preview.previewBlocks?.length ?? 0) > 0
        || preview.tables.length > 0
        || preview.figures.length > 0
        || preview.footnotes.length > 0
        || preview.bibliographyEntries.length > 0;

      expect(preview.errors, exercise.id).toEqual([]);
      expect(preview.unsupportedCommands, exercise.id).toEqual([]);
      expect(hasVisibleContent, exercise.id).toBe(true);
    }
  });

  it('cubre todos los requisitos acumulativos y la lista de entrega', () => {
    const source = [
      ...pageNames.map((name) => readFileSync(resolve(contentRoot, 'lesson-page', name), 'utf8')),
      ...exerciseNames.map((name) => readFileSync(resolve(contentRoot, 'exercise', name), 'utf8')),
    ].join('\n');

    for (const required of [
      '\\documentclass{article}',
      '\\usepackage[spanish]{babel}',
      '\\maketitle',
      '\\begin{abstract}',
      '\\tableofcontents',
      '\\subsection',
      '\\begin{align*}',
      '\\begin{equation}',
      '\\eqref',
      '\\usepackage{booktabs}',
      '\\begin{table}',
      '\\usepackage{graphicx}',
      '\\includegraphics',
      '\\begin{figure}',
      '\\footnote',
      '\\bibitem',
      '\\cite',
      '\\usepackage{hyperref}',
      '\\usepackage{cleveref}',
      'informe.tex',
      'PDF compilado',
    ]) {
      expect(source, required).toContain(required);
    }
    expect(source).toMatch(/ejemplo ficticio/i);
  });

  it('valida requisitos, documentos, paquetes y redes de claves de forma específica', () => {
    const ruleTypes = new Set(
      exercises.flatMap((exercise) => exercise.validationRules.map((rule) => rule.type)),
    );
    for (const ruleType of [
      'REQUIRE_VALID_DOCUMENT',
      'REQUIRE_USED_PACKAGES',
      'REQUIRE_PROJECT_REQUIREMENTS',
      'REQUIRE_VALID_LABELS',
      'REQUIRE_RESOLVED_REFERENCES',
      'REQUIRE_VALID_BIBLIOGRAPHY',
      'REQUIRE_RESOLVED_CITATIONS',
      'REQUIRE_REFERENCE_PACKAGE_ORDER',
    ]) {
      expect(ruleTypes.has(ruleType as ValidationRule['type']), ruleType).toBe(true);
    }
  });

  it('rechaza los cinco errores intencionales del reto final', () => {
    const challenge = exercises.find((exercise) => exercise.id === '15-09-04');
    expect(challenge).toBeDefined();
    const result = validateExercise(
      challenge?.initialCode ?? '',
      challenge?.validationRules ?? [],
    );
    expect(result.valid).toBe(false);
    expect(result.failedRules.map((failure) => failure.id)).toEqual(
      expect.arrayContaining([
        'vr-15-09-04-1',
        'vr-15-09-04-2',
        'vr-15-09-04-3',
        'vr-15-09-04-4',
        'vr-15-09-04-5',
      ]),
    );
  });

  it('publica las rutas 11–15 y mantiene quince secciones en navegación', () => {
    const config = readFileSync(resolve('src/content.config.ts'), 'utf8');
    for (const section of ['11', '12', '13', '14', '15']) {
      expect(config).toContain(`'${section}-*.md'`);
      expect(config).toContain(`'${section}-*.json'`);
      expect(names('lesson-page', `${section}-`, '.md').length).toBeGreaterThan(0);
    }
    expect(names('section', 'seccion-', '.json')).toHaveLength(15);

    const layout = readFileSync(resolve('src/layouts/CourseLayout.astro'), 'utf8');
    const header = readFileSync(resolve('src/components/navigation/ProgressHeader.astro'), 'utf8');
    const index = readFileSync(resolve('src/pages/aprender/index.astro'), 'utf8');
    expect(layout).toContain('const totalSections = sidebarSections.length');
    expect(header).toContain('Sección ${currentSectionOrder} de ${totalSections}');
    expect(index).toContain('las quince secciones');
  });
});

describe('regresión de contenido de las Secciones 1–14', () => {
  it('conserva exactamente el estado previo a publicar la Sección 15', () => {
    const selected: string[] = [];
    for (const directory of ['section', 'lesson', 'lesson-page', 'example', 'exercise']) {
      for (const name of readdirSync(resolve(contentRoot, directory)).sort()) {
        const belongs = directory === 'section'
          ? /^seccion-(?:0[1-9]|1[0-4])\.json$/.test(name)
          : /^(?:0[1-9]|1[0-4])-/.test(name);
        if (belongs) selected.push(`src/content/${directory}/${name}`);
      }
    }
    selected.sort();

    const digestLines = selected.map((relativePath) => {
      const fileDigest = createHash('sha256')
        .update(readFileSync(resolve(relativePath)))
        .digest('hex');
      return `${fileDigest}  ${relativePath}\n`;
    }).join('');

    expect(createHash('sha256').update(digestLines).digest('hex')).toBe(
      '683c947dfdf326c499683bd90ad42f98507529d7aa2209b57d61b011afb6139c',
    );
  });
});
