import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface SectionData {
  id: string;
  title: string;
  description: string;
  order: number;
  courseId: string;
}

interface LessonData {
  id: string;
  title: string;
  sectionId: string;
  order: number;
  status?: string;
}

interface LessonPageData {
  id: string;
  lessonId: string;
  slug: string;
  title: string;
  order: number;
  status: string;
}

interface ExampleData {
  id: string;
  pageId: string;
  order: number;
  title: string;
  description: string;
  editable: boolean;
  initialCode: string;
  renderMode: string;
  packages: string[];
  explanation: string;
  expectedPreview?: string;
  actions: string[];
  status: string;
}

interface ExerciseData {
  id: string;
  pageId: string;
  order: number;
  title: string;
  required: boolean;
  canonicalSolution?: string;
  validationRules: Array<{
    id: string;
    type: string;
    required: boolean;
    scope: string;
    feedback: string;
  }>;
  variants?: Array<{ id: string }>;
  status: string;
}

const VALID_RENDER_MODES = ['KATEX_MATH', 'SAFE_LATEX_PREVIEW'];
const VALID_ACTIONS = ['copy', 'clear', 'restore'];
const VALID_RULE_TYPES = [
  'REQUIRE_COMMAND', 'REQUIRE_ENVIRONMENT', 'REQUIRE_ARGUMENT', 'REQUIRE_NONEMPTY_ARGUMENT',
  'REQUIRE_TEXT', 'REQUIRE_COUNT', 'REQUIRE_PACKAGE', 'REQUIRE_MATH_STRUCTURE', 'REQUIRE_ORDER',
  'REQUIRE_FIRST_CONTENT', 'REQUIRE_SENTENCE_COUNT', 'REQUIRE_HEADING_STRUCTURE',
  'REQUIRE_TABLE_STRUCTURE', 'REQUIRE_FIGURE_STRUCTURE',
  'REQUIRE_VALID_FOOTNOTES', 'REQUIRE_FOOTNOTE_PAIR',
  'REQUIRE_UNIQUE_LABELS', 'REQUIRE_RESOLVED_REFERENCES',
  'REQUIRE_VALID_LABELS', 'REQUIRE_REFERENCE_PACKAGE_ORDER', 'REQUIRE_REFERENCE_COUNT',
  'REQUIRE_VALID_BIBLIOGRAPHY', 'REQUIRE_BIBITEM_COUNT',
  'REQUIRE_RESOLVED_CITATIONS', 'REQUIRE_CITATION_COUNT',
  'REQUIRE_VALID_DOCUMENT', 'REQUIRE_USED_PACKAGES', 'REQUIRE_PROJECT_REQUIREMENTS',
  'REQUIRE_PARAGRAPH_COUNT', 'REQUIRE_DISTINCT_LINES', 'REQUIRE_NESTED_ENVIRONMENT',
  'REQUIRE_MATCHING_ARGUMENTS', 'FORBID_ALTERNATIVE',
];
const VALID_SCOPES = ['PREAMBLE', 'BODY', 'MATH', 'FULL_DOCUMENT'];
const VALID_STATUSES = ['draft', 'published', 'archived'];

const knownLessonIds = [
  '01-01', '01-02', '01-03',
  '02-01', '02-02', '02-03', '02-04',
  '03-01', '03-02', '03-03', '03-04', '03-05',
  '04-01', '04-02', '04-03', '04-04', '04-05',
  ...Array.from({ length: 7 }, (_, i) => `${String(i + 5).padStart(2, '0')}-01`),
];

const knownPageIds = [
  '01-01-p01', '01-01-p02', '01-01-p03', '01-01-p04',
  '01-02-p01', '01-02-p02', '01-02-p03',
  '01-03-p01', '01-03-p02', '01-03-p03', '01-03-p04', '01-03-p05', '01-03-p06',
  '02-01-p01', '02-01-p02', '02-01-p03',
  '02-02-p01', '02-02-p02', '02-02-p03', '02-02-p04',
  '02-03-p01', '02-03-p02', '02-03-p03',
  '02-04-p01', '02-04-p02', '02-04-p03', '02-04-p04', '02-04-p05',
  '03-01-p01', '03-01-p02', '03-01-p03',
  '03-02-p01', '03-02-p02',
  '03-03-p01', '03-03-p02',
  '03-04-p01', '03-04-p02', '03-04-p03',
  '03-05-p01', '03-05-p02', '03-05-p03',
  '04-01-p01', '04-01-p02',
  '04-02-p01', '04-02-p02', '04-02-p03',
  '04-03-p01', '04-03-p02', '04-03-p03',
  '04-04-p01', '04-04-p02', '04-04-p03',
  '04-05-p01', '04-05-p02',
];

function isValidIntegerPositive(n: number): boolean {
  return Number.isInteger(n) && n > 0;
}

function isValidKebabCase(s: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
}

function hasUniqueIds(items: Array<{ id: string }>): boolean {
  const ids = items.map((i) => i.id);
  return new Set(ids).size === ids.length;
}

function hasValidExampleActions(example: ExampleData): boolean {
  const unique = new Set(example.actions);
  if (unique.size !== example.actions.length) return false;
  for (const a of example.actions) {
    if (!VALID_ACTIONS.includes(a)) return false;
  }
  if (example.editable) {
    const required = ['copy', 'clear', 'restore'];
    return required.every((a) => example.actions.includes(a));
  }
  return example.actions.every((a) => a === 'copy');
}

function hasValidVariants(exercise: ExerciseData): boolean {
  if (!exercise.variants) return true;
  if (exercise.variants.length > 5) return false;
  return hasUniqueIds(exercise.variants);
}

function hasValidCanonicalSolution(exercise: ExerciseData): boolean {
  if (exercise.status === 'published') {
    return !!exercise.canonicalSolution && exercise.canonicalSolution.trim().length > 0;
  }
  return true;
}

describe('Content structure', () => {
  describe('Section ordering', () => {
    const sections: SectionData[] = Array.from({ length: 15 }, (_, i) => ({
      id: `seccion-${String(i + 1).padStart(2, '0')}`,
      title: '',
      description: '',
      order: i + 1,
      courseId: 'basic',
    }));

    it('has exactly 15 sections', () => {
      expect(sections).toHaveLength(15);
    });

    it('has sequential order from 1 to 15', () => {
      const orders = sections.map((s) => s.order);
      expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    });

    it('has unique IDs', () => {
      const ids = sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('section.order is unique across sections', () => {
      const orders = sections.map((s) => s.order);
      expect(new Set(orders).size).toBe(orders.length);
    });

    it('every section has a valid courseId', () => {
      for (const section of sections) {
        expect(section.courseId).toBe('basic');
      }
    });
  });

  describe('Section 1 has exactly 3 subsections (lessons)', () => {
    const s1Lessons: LessonData[] = [
      { id: '01-01', title: '¿Qué es LaTeX?', sectionId: 'seccion-01', order: 1, status: 'draft' },
      { id: '01-02', title: 'El flujo de trabajo', sectionId: 'seccion-01', order: 2, status: 'draft' },
      { id: '01-03', title: 'Clases de documento', sectionId: 'seccion-01', order: 3, status: 'draft' },
    ];

    it('has exactly 3 lessons', () => {
      expect(s1Lessons).toHaveLength(3);
    });

    it('has IDs 01-01, 01-02, 01-03', () => {
      const ids = s1Lessons.map((l) => l.id);
      expect(ids).toEqual(['01-01', '01-02', '01-03']);
    });

    it('has orders 1, 2, 3', () => {
      const orders = s1Lessons.map((l) => l.order);
      expect(orders).toEqual([1, 2, 3]);
    });

    it('has unique IDs', () => {
      expect(hasUniqueIds(s1Lessons)).toBe(true);
    });
  });

  describe('Section 2 has exactly 4 subsections (lessons)', () => {
    const s2Lessons: LessonData[] = [
      { id: '02-01', title: 'Preámbulo y cuerpo', sectionId: 'seccion-02', order: 1, status: 'draft' },
      { id: '02-02', title: 'Anatomía de un comando', sectionId: 'seccion-02', order: 2, status: 'draft' },
      { id: '02-03', title: 'Entornos', sectionId: 'seccion-02', order: 3, status: 'draft' },
      { id: '02-04', title: 'Espacios, saltos y párrafos', sectionId: 'seccion-02', order: 4, status: 'draft' },
    ];

    it('has exactly 4 lessons', () => {
      expect(s2Lessons).toHaveLength(4);
    });

    it('has IDs 02-01 through 02-04', () => {
      const ids = s2Lessons.map((l) => l.id);
      expect(ids).toEqual(['02-01', '02-02', '02-03', '02-04']);
    });

    it('has orders 1 through 4', () => {
      const orders = s2Lessons.map((l) => l.order);
      expect(orders).toEqual([1, 2, 3, 4]);
    });

    it('has unique IDs', () => {
      expect(hasUniqueIds(s2Lessons)).toBe(true);
    });
  });

  describe('Lesson structure', () => {
    const sectionIds: string[] = Array.from({ length: 15 }, (_, i) =>
      `seccion-${String(i + 1).padStart(2, '0')}`,
    );

    const lessons: LessonData[] = [
      { id: '01-01', title: '', sectionId: 'seccion-01', order: 1, status: 'draft' },
      { id: '01-02', title: '', sectionId: 'seccion-01', order: 2, status: 'draft' },
      { id: '01-03', title: '', sectionId: 'seccion-01', order: 3, status: 'draft' },
      { id: '02-01', title: '', sectionId: 'seccion-02', order: 1, status: 'draft' },
      { id: '02-02', title: '', sectionId: 'seccion-02', order: 2, status: 'draft' },
      { id: '02-03', title: '', sectionId: 'seccion-02', order: 3, status: 'draft' },
      { id: '02-04', title: '', sectionId: 'seccion-02', order: 4, status: 'draft' },
      { id: '03-01', title: '', sectionId: 'seccion-03', order: 1, status: 'draft' },
      { id: '03-02', title: '', sectionId: 'seccion-03', order: 2, status: 'draft' },
      { id: '03-03', title: '', sectionId: 'seccion-03', order: 3, status: 'draft' },
      { id: '03-04', title: '', sectionId: 'seccion-03', order: 4, status: 'draft' },
      { id: '03-05', title: '', sectionId: 'seccion-03', order: 5, status: 'draft' },
      { id: '04-01', title: '', sectionId: 'seccion-04', order: 1, status: 'draft' },
      { id: '04-02', title: '', sectionId: 'seccion-04', order: 2, status: 'draft' },
      { id: '04-03', title: '', sectionId: 'seccion-04', order: 3, status: 'draft' },
      { id: '04-04', title: '', sectionId: 'seccion-04', order: 4, status: 'draft' },
      { id: '04-05', title: '', sectionId: 'seccion-04', order: 5, status: 'draft' },
      ...Array.from({ length: 11 }, (_, i) => {
        const num = i + 5;
        return {
          id: `${String(num).padStart(2, '0')}-01`,
          title: '',
          sectionId: `seccion-${String(num).padStart(2, '0')}`,
          order: 1,
          status: 'draft' as const,
        };
      }),
    ];

    it('has at least 20 lessons total', () => {
      expect(lessons.length).toBeGreaterThanOrEqual(20);
    });

    it('has unique lesson IDs', () => {
      expect(hasUniqueIds(lessons)).toBe(true);
    });

    it('every lesson references a valid section pattern', () => {
      for (const lesson of lessons) {
        expect(lesson.sectionId).toMatch(/^seccion-\d{2}$/);
      }
    });

    it('every lesson sectionId exists in the sections collection', () => {
      for (const lesson of lessons) {
        expect(sectionIds).toContain(lesson.sectionId);
      }
    });

    it('lesson.order is unique within each sectionId', () => {
      const groups = new Map<string, number[]>();
      for (const lesson of lessons) {
        const key = lesson.sectionId;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(lesson.order);
      }
      for (const [sectionId, orders] of groups) {
        expect(new Set(orders).size, `duplicate lesson.order in ${sectionId}`).toBe(orders.length);
      }
    });

    it('section-01 has orders 1, 2, 3', () => {
      const s1 = lessons.filter((l) => l.sectionId === 'seccion-01');
      const orders = s1.map((l) => l.order).sort();
      expect(orders).toEqual([1, 2, 3]);
    });

    it('section-02 has orders 1, 2, 3, 4', () => {
      const s2 = lessons.filter((l) => l.sectionId === 'seccion-02');
      const orders = s2.map((l) => l.order).sort();
      expect(orders).toEqual([1, 2, 3, 4]);
    });

    it('section-03 has orders 1, 2, 3, 4, 5', () => {
      const s3 = lessons.filter((l) => l.sectionId === 'seccion-03');
      const orders = s3.map((l) => l.order).sort();
      expect(orders).toEqual([1, 2, 3, 4, 5]);
    });

    it('section-04 has orders 1, 2, 3, 4, 5', () => {
      const s4 = lessons.filter((l) => l.sectionId === 'seccion-04');
      const orders = s4.map((l) => l.order).sort();
      expect(orders).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('LessonPage structure', () => {
    const parentLessons: LessonData[] = [
      { id: '01-01', title: '', sectionId: 'seccion-01', order: 1, status: 'draft' },
      { id: '01-02', title: '', sectionId: 'seccion-01', order: 2, status: 'draft' },
      { id: '01-03', title: '', sectionId: 'seccion-01', order: 3, status: 'draft' },
      { id: '02-01', title: '', sectionId: 'seccion-02', order: 1, status: 'draft' },
      { id: '02-02', title: '', sectionId: 'seccion-02', order: 2, status: 'draft' },
      { id: '02-03', title: '', sectionId: 'seccion-02', order: 3, status: 'draft' },
      { id: '02-04', title: '', sectionId: 'seccion-02', order: 4, status: 'draft' },
      { id: '03-01', title: '', sectionId: 'seccion-03', order: 1, status: 'draft' },
      { id: '03-02', title: '', sectionId: 'seccion-03', order: 2, status: 'draft' },
      { id: '03-03', title: '', sectionId: 'seccion-03', order: 3, status: 'draft' },
      { id: '03-04', title: '', sectionId: 'seccion-03', order: 4, status: 'draft' },
      { id: '03-05', title: '', sectionId: 'seccion-03', order: 5, status: 'draft' },
      { id: '04-01', title: '', sectionId: 'seccion-04', order: 1, status: 'draft' },
      { id: '04-02', title: '', sectionId: 'seccion-04', order: 2, status: 'draft' },
      { id: '04-03', title: '', sectionId: 'seccion-04', order: 3, status: 'draft' },
      { id: '04-04', title: '', sectionId: 'seccion-04', order: 4, status: 'draft' },
      { id: '04-05', title: '', sectionId: 'seccion-04', order: 5, status: 'draft' },
    ];

    const lessonPages: LessonPageData[] = [
      { id: '01-01-p01', lessonId: '01-01', slug: 'la-idea-principal', title: 'La idea principal', order: 1, status: 'draft' },
      { id: '01-01-p02', lessonId: '01-01', slug: 'latex-vs-procesador-visual', title: 'LaTeX y un procesador visual', order: 2, status: 'draft' },
      { id: '01-01-p03', lessonId: '01-01', slug: 'ventajas-academicas', title: 'Ventajas en documentos académicos', order: 3, status: 'draft' },
      { id: '01-01-p04', lessonId: '01-01', slug: 'cuando-es-util', title: 'Cuándo resulta especialmente útil', order: 4, status: 'draft' },
      { id: '01-02-p01', lessonId: '01-02', slug: 'archivo-fuente-compilacion', title: 'Archivo fuente, compilación y resultado', order: 1, status: 'draft' },
      { id: '01-02-p02', lessonId: '01-02', slug: 'compilar-no-es-terminar', title: 'Compilar no significa terminar', order: 2, status: 'draft' },
      { id: '01-02-p03', lessonId: '01-02', slug: 'errores-del-proceso', title: 'Errores como parte del proceso', order: 3, status: 'draft' },
      { id: '01-03-p01', lessonId: '01-03', slug: 'que-decide-una-clase', title: 'Qué decide una clase', order: 1, status: 'draft' },
      { id: '01-03-p02', lessonId: '01-03', slug: 'clase-article', title: 'article', order: 2, status: 'draft' },
      { id: '01-03-p03', lessonId: '01-03', slug: 'clases-report-y-book', title: 'report y book', order: 3, status: 'draft' },
      { id: '01-03-p04', lessonId: '01-03', slug: 'clase-beamer', title: 'beamer', order: 4, status: 'draft' },
      { id: '01-03-p05', lessonId: '01-03', slug: 'elegir-una-clase', title: 'Elegir una clase', order: 5, status: 'draft' },
      { id: '01-03-p06', lessonId: '01-03', slug: 'reto-de-decision', title: 'Reto de decisión', order: 6, status: 'draft' },
      { id: '02-01-p01', lessonId: '02-01', slug: 'el-preambulo', title: 'El preámbulo', order: 1, status: 'draft' },
      { id: '02-01-p02', lessonId: '02-01', slug: 'el-cuerpo', title: 'El cuerpo', order: 2, status: 'draft' },
      { id: '02-01-p03', lessonId: '02-01', slug: 'clasificar-lineas', title: 'Clasificar líneas', order: 3, status: 'draft' },
      { id: '02-02-p01', lessonId: '02-02', slug: 'nombre-y-argumento', title: 'Nombre y argumento', order: 1, status: 'draft' },
      { id: '02-02-p02', lessonId: '02-02', slug: 'opciones-entre-corchetes', title: 'Opciones entre corchetes', order: 2, status: 'draft' },
      { id: '02-02-p03', lessonId: '02-02', slug: 'modificar-una-opcion', title: 'Modificar una opción', order: 3, status: 'draft' },
      { id: '02-02-p04', lessonId: '02-02', slug: 'identificar-partes-de-un-comando', title: 'Identificar partes de un comando', order: 4, status: 'draft' },
      { id: '02-03-p01', lessonId: '02-03', slug: 'abrir-y-cerrar-un-entorno', title: 'Abrir y cerrar un entorno', order: 1, status: 'draft' },
      { id: '02-03-p02', lessonId: '02-03', slug: 'error-por-cierre-incorrecto', title: 'Error por cierre incorrecto', order: 2, status: 'draft' },
      { id: '02-03-p03', lessonId: '02-03', slug: 'buscar-una-pareja-faltante', title: 'Buscar una pareja faltante', order: 3, status: 'draft' },
      { id: '02-04-p01', lessonId: '02-04', slug: 'espacios-consecutivos', title: 'Espacios consecutivos', order: 1, status: 'draft' },
      { id: '02-04-p02', lessonId: '02-04', slug: 'un-salto-de-linea-no-crea-un-parrafo', title: 'Un salto de línea no crea un párrafo', order: 2, status: 'draft' },
      { id: '02-04-p03', lessonId: '02-04', slug: 'una-linea-vacia-separa-parrafos', title: 'Una línea vacía separa párrafos', order: 3, status: 'draft' },
      { id: '02-04-p04', lessonId: '02-04', slug: 'construir-tres-parrafos', title: 'Construir tres párrafos', order: 4, status: 'draft' },
      { id: '02-04-p05', lessonId: '02-04', slug: 'reto-de-correccion', title: 'Reto de corrección', order: 5, status: 'draft' },
      { id: '03-01-p01', lessonId: '03-01', slug: 'extender-la-clase', title: 'Extender la clase', order: 1, status: 'draft' },
      { id: '03-01-p02', lessonId: '03-01', slug: 'ubicacion-correcta', title: 'Ubicación correcta', order: 2, status: 'draft' },
      { id: '03-01-p03', lessonId: '03-01', slug: 'corregir-un-paquete-mal-colocado', title: 'Corregir un paquete mal colocado', order: 3, status: 'draft' },
      { id: '03-02-p01', lessonId: '03-02', slug: 'fuentes-t1', title: 'Fuentes T1', order: 1, status: 'draft' },
      { id: '03-02-p02', lessonId: '03-02', slug: 'anadir-fontenc', title: 'Añadir fontenc', order: 2, status: 'draft' },
      { id: '03-03-p01', lessonId: '03-03', slug: 'interpretar-los-caracteres-escritos', title: 'Interpretar los caracteres escritos', order: 1, status: 'draft' },
      { id: '03-03-p02', lessonId: '03-03', slug: 'probar-tildes-y-la-letra-enie', title: 'Probar tildes y la letra ñ', order: 2, status: 'draft' },
      { id: '03-04-p01', lessonId: '03-04', slug: 'configurar-el-espanol', title: 'Configurar el español', order: 1, status: 'draft' },
      { id: '03-04-p02', lessonId: '03-04', slug: 'anadir-babel', title: 'Añadir babel', order: 2, status: 'draft' },
      { id: '03-04-p03', lessonId: '03-04', slug: 'funciones-de-cada-paquete', title: 'Funciones de cada paquete', order: 3, status: 'draft' },
      { id: '03-05-p01', lessonId: '03-05', slug: 'construccion-acumulativa', title: 'Construcción acumulativa', order: 1, status: 'draft' },
      { id: '03-05-p02', lessonId: '03-05', slug: 'completar-lineas-faltantes', title: 'Completar líneas faltantes', order: 2, status: 'draft' },
      { id: '03-05-p03', lessonId: '03-05', slug: 'reto-de-plantilla', title: 'Reto de plantilla', order: 3, status: 'draft' },
      { id: '04-01-p01', lessonId: '04-01', slug: 'declarar-el-titulo', title: 'Declarar el título', order: 1, status: 'draft' },
      { id: '04-01-p02', lessonId: '04-01', slug: 'anadir-un-titulo-propio', title: 'Añadir un título propio', order: 2, status: 'draft' },
      { id: '04-02-p01', lessonId: '04-02', slug: 'declarar-autor-y-fecha', title: 'Declarar autor y fecha', order: 1, status: 'draft' },
      { id: '04-02-p02', lessonId: '04-02', slug: 'completar-los-datos', title: 'Completar los datos', order: 2, status: 'draft' },
      { id: '04-02-p03', lessonId: '04-02', slug: 'fecha-automatica-o-fija', title: 'Fecha automática o fija', order: 3, status: 'draft' },
      { id: '04-03-p01', lessonId: '04-03', slug: 'imprimir-el-encabezado', title: 'Imprimir el encabezado', order: 1, status: 'draft' },
      { id: '04-03-p02', lessonId: '04-03', slug: 'generar-el-titulo-visual', title: 'Generar el título visual', order: 2, status: 'draft' },
      { id: '04-03-p03', lessonId: '04-03', slug: 'corregir-maketitle', title: 'Corregir maketitle', order: 3, status: 'draft' },
      { id: '04-04-p01', lessonId: '04-04', slug: 'funcion-del-resumen', title: 'Función del resumen', order: 1, status: 'draft' },
      { id: '04-04-p02', lessonId: '04-04', slug: 'anadir-un-resumen', title: 'Añadir un resumen', order: 2, status: 'draft' },
      { id: '04-04-p03', lessonId: '04-04', slug: 'mejorar-un-resumen', title: 'Mejorar un resumen', order: 3, status: 'draft' },
      { id: '04-05-p01', lessonId: '04-05', slug: 'construir-el-bloque-inicial', title: 'Construir el bloque inicial', order: 1, status: 'draft' },
      { id: '04-05-p02', lessonId: '04-05', slug: 'corregir-datos-mal-ubicados', title: 'Corregir datos mal ubicados', order: 2, status: 'draft' },
    ];

    it('has exactly 54 pages', () => {
      expect(lessonPages).toHaveLength(54);
    });

    it('section 1 has exactly 13 pages (4+3+6)', () => {
      const s1Pages = lessonPages.filter((p) => {
        const lesson = parentLessons.find((l) => l.id === p.lessonId);
        return lesson && lesson.sectionId === 'seccion-01';
      });
      expect(s1Pages).toHaveLength(13);
    });

    it('section 2 has exactly 15 pages (3+4+3+5)', () => {
      const s2Pages = lessonPages.filter((p) => {
        const lesson = parentLessons.find((l) => l.id === p.lessonId);
        return lesson && lesson.sectionId === 'seccion-02';
      });
      expect(s2Pages).toHaveLength(15);
    });

    it('subsection 01-01 has exactly 4 pages', () => {
      const pages = lessonPages.filter((p) => p.lessonId === '01-01');
      expect(pages).toHaveLength(4);
    });

    it('subsection 01-02 has exactly 3 pages', () => {
      const pages = lessonPages.filter((p) => p.lessonId === '01-02');
      expect(pages).toHaveLength(3);
    });

    it('subsection 01-03 has exactly 6 pages', () => {
      const pages = lessonPages.filter((p) => p.lessonId === '01-03');
      expect(pages).toHaveLength(6);
    });

    it('subsection 02-01 has exactly 3 pages', () => {
      const pages = lessonPages.filter((p) => p.lessonId === '02-01');
      expect(pages).toHaveLength(3);
    });

    it('subsection 02-02 has exactly 4 pages', () => {
      const pages = lessonPages.filter((p) => p.lessonId === '02-02');
      expect(pages).toHaveLength(4);
    });

    it('subsection 02-03 has exactly 3 pages', () => {
      const pages = lessonPages.filter((p) => p.lessonId === '02-03');
      expect(pages).toHaveLength(3);
    });

    it('subsection 02-04 has exactly 5 pages', () => {
      const pages = lessonPages.filter((p) => p.lessonId === '02-04');
      expect(pages).toHaveLength(5);
    });

    it('section 3 has exactly 13 pages (3+2+2+3+3)', () => {
      const s3Pages = lessonPages.filter((p) => {
        const lesson = parentLessons.find((l) => l.id === p.lessonId);
        return lesson && lesson.sectionId === 'seccion-03';
      });
      expect(s3Pages).toHaveLength(13);
    });

    it('section 4 has exactly 13 pages (2+3+3+3+2)', () => {
      const s4Pages = lessonPages.filter((p) => {
        const lesson = parentLessons.find((l) => l.id === p.lessonId);
        return lesson && lesson.sectionId === 'seccion-04';
      });
      expect(s4Pages).toHaveLength(13);
    });

    it('has unique IDs', () => {
      expect(hasUniqueIds(lessonPages)).toBe(true);
    });

    it('every page references a known lesson', () => {
      for (const page of lessonPages) {
        expect(knownLessonIds).toContain(page.lessonId);
      }
    });

    it('order is a positive integer', () => {
      for (const page of lessonPages) {
        expect(isValidIntegerPositive(page.order)).toBe(true);
      }
    });

    it('order is unique within each lessonId', () => {
      const groups = new Map<string, number[]>();
      for (const page of lessonPages) {
        if (!groups.has(page.lessonId)) groups.set(page.lessonId, []);
        groups.get(page.lessonId)!.push(page.order);
      }
      for (const [lessonId, orders] of groups) {
        expect(new Set(orders).size, `duplicate page.order in ${lessonId}`).toBe(orders.length);
      }
    });

    it('slug is in valid kebab-case', () => {
      for (const page of lessonPages) {
        expect(isValidKebabCase(page.slug), `slug "${page.slug}" is not kebab-case`).toBe(true);
      }
    });

    it('slug is unique within each lessonId', () => {
      const groups = new Map<string, string[]>();
      for (const page of lessonPages) {
        if (!groups.has(page.lessonId)) groups.set(page.lessonId, []);
        groups.get(page.lessonId)!.push(page.slug);
      }
      for (const [lessonId, slugs] of groups) {
        expect(new Set(slugs).size, `duplicate slug in ${lessonId}`).toBe(slugs.length);
      }
    });

    it('has valid status', () => {
      for (const page of lessonPages) {
        expect(VALID_STATUSES).toContain(page.status);
      }
    });

    it('a published page must not belong to a draft or archived lesson', () => {
      for (const page of lessonPages) {
        const lesson = parentLessons.find((l) => l.id === page.lessonId);
        if (page.status === 'published' && lesson) {
          expect(lesson.status).not.toBe('draft');
          expect(lesson.status).not.toBe('archived');
        }
      }
    });
  });

  describe('Lesson published requires at least one published page', () => {
    const lessons: LessonData[] = [
      { id: '01-01', title: '', sectionId: 'seccion-01', order: 1, status: 'draft' },
      { id: '01-02', title: '', sectionId: 'seccion-01', order: 2, status: 'draft' },
      { id: '01-03', title: '', sectionId: 'seccion-01', order: 3, status: 'draft' },
      { id: '02-01', title: '', sectionId: 'seccion-02', order: 1, status: 'draft' },
      { id: '02-02', title: '', sectionId: 'seccion-02', order: 2, status: 'draft' },
      { id: '02-03', title: '', sectionId: 'seccion-02', order: 3, status: 'draft' },
      { id: '02-04', title: '', sectionId: 'seccion-02', order: 4, status: 'draft' },
    ];

    const lessonPages: LessonPageData[] = [
      { id: '01-01-p01', lessonId: '01-01', slug: 'la-idea-principal', title: '', order: 1, status: 'draft' },
      { id: '01-01-p02', lessonId: '01-01', slug: 'latex-vs-procesador', title: '', order: 2, status: 'draft' },
      { id: '01-02-p01', lessonId: '01-02', slug: 'archivo-fuente', title: '', order: 1, status: 'draft' },
      { id: '01-03-p01', lessonId: '01-03', slug: 'que-decide-clase', title: '', order: 1, status: 'draft' },
      { id: '02-01-p01', lessonId: '02-01', slug: 'el-preambulo', title: '', order: 1, status: 'draft' },
      { id: '02-02-p01', lessonId: '02-02', slug: 'nombre-argumento', title: '', order: 1, status: 'draft' },
      { id: '02-03-p01', lessonId: '02-03', slug: 'abrir-cerrar', title: '', order: 1, status: 'draft' },
      { id: '02-04-p01', lessonId: '02-04', slug: 'espacios', title: '', order: 1, status: 'draft' },
    ];

    it('every published lesson must have at least one published page', () => {
      for (const lesson of lessons) {
        if (lesson.status === 'published') {
          const publishedPages = lessonPages.filter(
            (p) => p.lessonId === lesson.id && p.status === 'published',
          );
          expect(publishedPages.length).toBeGreaterThanOrEqual(1);
        }
      }
    });
  });

  describe('Examples', () => {
    const examples: ExampleData[] = [
      {
        id: '02-02-01',
        pageId: '02-02-p03',
        order: 1,
        title: 'Documento con tamaño base 12pt',
        description: 'Ejemplo de cómo añadir una opción a la clase del documento.',
        editable: true,
        initialCode: '\\documentclass[12pt]{article}\n\\begin{document}\nEste documento usa tamaño de letra 12 puntos.\n\\end{document}',
        renderMode: 'SAFE_LATEX_PREVIEW',
        packages: [],
        explanation: 'El corchete [12pt] modifica el tamaño base del texto de forma global.',
        expectedPreview: 'El texto aparece con un tamaño de fuente ligeramente mayor.',
        actions: ['copy', 'clear', 'restore'],
        status: 'archived',
      },
      {
        id: '02-03-01',
        pageId: '02-03-p02',
        order: 1,
        title: 'Cierre incorrecto de entorno',
        description: 'Ejemplo con un error de cierre para practicar la corrección.',
        editable: true,
        initialCode: '\\documentclass{article}\n\\begin{document}\nTexto de prueba.\n\\end{article}',
        renderMode: 'SAFE_LATEX_PREVIEW',
        packages: [],
        explanation: 'El cierre debe coincidir con el entorno abierto.',
        expectedPreview: 'Tras corregir el cierre, el documento compila.',
        actions: ['copy', 'clear', 'restore'],
        status: 'archived',
      },
      {
        id: '02-04-01',
        pageId: '02-04-p03',
        order: 1,
        title: 'Separación de párrafos',
        description: 'Ejemplo que muestra cómo una línea vacía genera dos párrafos.',
        editable: true,
        initialCode: '\\documentclass{article}\n\\begin{document}\nPrimer párrafo.\n\nSegundo párrafo.\n\\end{document}',
        renderMode: 'SAFE_LATEX_PREVIEW',
        packages: [],
        explanation: 'La línea completamente vacía entre las dos oraciones indica párrafos distintos.',
        expectedPreview: 'El PDF muestra dos párrafos separados por espacio vertical.',
        actions: ['copy', 'clear', 'restore'],
        status: 'archived',
      },
    ];

    it('has exactly 3 examples (all archived)', () => {
      expect(examples).toHaveLength(3);
      expect(examples.every((e) => e.status === 'archived')).toBe(true);
    });

    it('has unique IDs', () => {
      expect(hasUniqueIds(examples)).toBe(true);
    });

    it('every example references a known page', () => {
      for (const ex of examples) {
        expect(knownPageIds).toContain(ex.pageId);
      }
    });

    it('order is a positive integer', () => {
      for (const ex of examples) {
        expect(isValidIntegerPositive(ex.order)).toBe(true);
      }
    });

    it('order is unique within each pageId', () => {
      const groups = new Map<string, number[]>();
      for (const ex of examples) {
        if (!groups.has(ex.pageId)) groups.set(ex.pageId, []);
        groups.get(ex.pageId)!.push(ex.order);
      }
      for (const [pageId, orders] of groups) {
        expect(new Set(orders).size, `duplicate example.order in ${pageId}`).toBe(orders.length);
      }
    });

    it('uses valid renderMode', () => {
      for (const ex of examples) {
        expect(VALID_RENDER_MODES).toContain(ex.renderMode);
      }
    });

    it('has valid actions coherent with editable state', () => {
      for (const ex of examples) {
        expect(hasValidExampleActions(ex)).toBe(true);
      }
    });

    it('has valid status', () => {
      for (const ex of examples) {
        expect(VALID_STATUSES).toContain(ex.status);
      }
    });
  });

  describe('Exercises', () => {
    const exercises: ExerciseData[] = [
      {
        id: '02-02-01',
        pageId: '02-02-p03',
        order: 1,
        title: 'Añadir una opción de tamaño',
        required: true,
        canonicalSolution: '\\documentclass[12pt]{article}\n\\begin{document}\nEste es un documento de prueba.\n\\end{document}',
        validationRules: [
          { id: 'vr-02-02-01-req-doc', type: 'REQUIRE_COMMAND', required: true, scope: 'FULL_DOCUMENT', feedback: 'Falta \\documentclass.' },
          { id: 'vr-02-02-01-req-arg', type: 'REQUIRE_ARGUMENT', required: true, scope: 'FULL_DOCUMENT', feedback: 'El argumento debe ser article.' },
          { id: 'vr-02-02-01-req-12pt', type: 'REQUIRE_TEXT', required: true, scope: 'FULL_DOCUMENT', feedback: 'Debe incluirse la opción 12pt.' },
          { id: 'vr-02-02-01-req-begin', type: 'REQUIRE_COMMAND', required: true, scope: 'FULL_DOCUMENT', feedback: 'Falta \\begin{document}.' },
          { id: 'vr-02-02-01-req-end', type: 'REQUIRE_COMMAND', required: true, scope: 'FULL_DOCUMENT', feedback: 'Falta \\end{document}.' },
        ],
        status: 'draft',
      },
      {
        id: '02-03-01',
        pageId: '02-03-p02',
        order: 1,
        title: 'Corregir el cierre de un entorno',
        required: true,
        canonicalSolution: '\\documentclass{article}\n\\begin{document}\nTexto de prueba.\n\\end{document}',
        validationRules: [
          { id: 'vr-02-03-01-req-env', type: 'REQUIRE_ENVIRONMENT', required: true, scope: 'FULL_DOCUMENT', feedback: 'El entorno document debe abrirse y cerrarse correctamente.' },
          { id: 'vr-02-03-01-req-text', type: 'REQUIRE_TEXT', required: true, scope: 'BODY', feedback: 'El cuerpo debe contener texto.' },
        ],
        status: 'draft',
      },
      {
        id: '02-04-01',
        pageId: '02-04-p03',
        order: 1,
        title: 'Separar párrafos con una línea vacía',
        required: true,
        canonicalSolution: '\\documentclass{article}\n\\begin{document}\nPrimera oración.\n\nSegunda oración.\n\\end{document}',
        validationRules: [
          { id: 'vr-02-04-01-req-doc', type: 'REQUIRE_COMMAND', required: true, scope: 'FULL_DOCUMENT', feedback: 'Falta \\documentclass.' },
          { id: 'vr-02-04-01-req-env', type: 'REQUIRE_ENVIRONMENT', required: true, scope: 'FULL_DOCUMENT', feedback: 'Falta el entorno document.' },
          { id: 'vr-02-04-01-req-text', type: 'REQUIRE_TEXT', required: true, scope: 'BODY', feedback: 'El cuerpo debe contener texto.' },
        ],
        status: 'draft',
      },
      {
        id: '02-04-02',
        pageId: '02-04-p04',
        order: 1,
        title: 'Construir tres párrafos',
        required: true,
        canonicalSolution: '\\documentclass{article}\n\\begin{document}\nLaTeX es un sistema de preparación de documentos.\n\nPermite escribir contenido estructurado de forma sencilla.\n\nEste documento muestra cómo separar párrafos correctamente.\n\\end{document}',
        validationRules: [
          { id: 'vr-02-04-02-req-doc', type: 'REQUIRE_COMMAND', required: true, scope: 'FULL_DOCUMENT', feedback: 'Falta \\documentclass.' },
          { id: 'vr-02-04-02-req-env', type: 'REQUIRE_ENVIRONMENT', required: true, scope: 'FULL_DOCUMENT', feedback: 'Falta el entorno document.' },
          { id: 'vr-02-04-02-req-text', type: 'REQUIRE_TEXT', required: true, scope: 'BODY', feedback: 'El cuerpo debe contener texto.' },
          { id: 'vr-02-04-02-forbid-bs', type: 'FORBID_ALTERNATIVE', required: true, scope: 'FULL_DOCUMENT', feedback: 'No uses \\\\ para forzar saltos de línea. Usa líneas vacías.' },
        ],
        status: 'draft',
      },
      {
        id: '02-04-03',
        pageId: '02-04-p05',
        order: 1,
        title: 'Corregir espacios y párrafos',
        required: true,
        canonicalSolution: '\\documentclass{article}\n\\begin{document}\nPrimera parte del texto. Segunda parte del texto.\n\nTercera parte.\n\\end{document}',
        validationRules: [
          { id: 'vr-02-04-03-req-doc', type: 'REQUIRE_COMMAND', required: true, scope: 'FULL_DOCUMENT', feedback: 'Falta \\documentclass.' },
          { id: 'vr-02-04-03-req-env', type: 'REQUIRE_ENVIRONMENT', required: true, scope: 'FULL_DOCUMENT', feedback: 'Falta el entorno document.' },
          { id: 'vr-02-04-03-req-text', type: 'REQUIRE_TEXT', required: true, scope: 'BODY', feedback: 'El cuerpo debe contener texto.' },
          { id: 'vr-02-04-03-forbid-bs', type: 'FORBID_ALTERNATIVE', required: true, scope: 'FULL_DOCUMENT', feedback: 'No uses \\\\ para forzar saltos de línea.' },
        ],
        status: 'draft',
      },
      // Sección 3 exercises
      {
        id: '03-01-01',
        pageId: '03-01-p03',
        order: 1,
        title: 'Corregir un paquete mal colocado',
        required: true,
        canonicalSolution: '',
        validationRules: [
          { id: 'vr-03-01-01-req-usepackage', type: 'REQUIRE_COMMAND', required: true, scope: 'PREAMBLE', feedback: '' },
        ],
        status: 'draft',
      },
      {
        id: '03-02-01',
        pageId: '03-02-p02',
        order: 1,
        title: 'Añadir fontenc',
        required: true,
        canonicalSolution: '',
        validationRules: [
          { id: 'vr-03-02-01-req-usepackage', type: 'REQUIRE_COMMAND', required: true, scope: 'PREAMBLE', feedback: '' },
        ],
        status: 'draft',
      },
      {
        id: '03-03-01',
        pageId: '03-03-p02',
        order: 1,
        title: 'Probar tildes y la letra ñ',
        required: true,
        canonicalSolution: '',
        validationRules: [
          { id: 'vr-03-03-01-req-inputenc', type: 'REQUIRE_TEXT', required: true, scope: 'PREAMBLE', feedback: '' },
        ],
        status: 'draft',
      },
      {
        id: '03-04-01',
        pageId: '03-04-p02',
        order: 1,
        title: 'Añadir babel',
        required: true,
        canonicalSolution: '',
        validationRules: [
          { id: 'vr-03-04-01-req-babel', type: 'REQUIRE_TEXT', required: true, scope: 'PREAMBLE', feedback: '' },
        ],
        status: 'draft',
      },
      {
        id: '03-05-01',
        pageId: '03-05-p02',
        order: 1,
        title: 'Completar líneas faltantes',
        required: true,
        canonicalSolution: '',
        validationRules: [
          { id: 'vr-03-05-01-req-fontenc', type: 'REQUIRE_TEXT', required: true, scope: 'PREAMBLE', feedback: '' },
        ],
        status: 'draft',
      },
      {
        id: '03-05-02',
        pageId: '03-05-p03',
        order: 1,
        title: 'Reto de plantilla',
        required: true,
        canonicalSolution: '',
        validationRules: [
          { id: 'vr-03-05-02-req-docclass', type: 'REQUIRE_COMMAND', required: true, scope: 'FULL_DOCUMENT', feedback: '' },
        ],
        status: 'draft',
      },
      // Sección 4 exercises
      {
        id: '04-01-01',
        pageId: '04-01-p02',
        order: 1,
        title: 'Añadir un título propio',
        required: true,
        canonicalSolution: '',
        validationRules: [
          { id: 'vr-04-01-01-req-title', type: 'REQUIRE_COMMAND', required: true, scope: 'PREAMBLE', feedback: '' },
        ],
        status: 'draft',
      },
      {
        id: '04-02-01',
        pageId: '04-02-p02',
        order: 1,
        title: 'Completar los datos',
        required: true,
        canonicalSolution: '',
        validationRules: [
          { id: 'vr-04-02-01-req-author', type: 'REQUIRE_COMMAND', required: true, scope: 'PREAMBLE', feedback: '' },
        ],
        status: 'draft',
      },
      {
        id: '04-02-02',
        pageId: '04-02-p03',
        order: 1,
        title: 'Fecha automática o fija',
        required: true,
        canonicalSolution: '',
        validationRules: [
          { id: 'vr-04-02-02-req-title', type: 'REQUIRE_COMMAND', required: true, scope: 'PREAMBLE', feedback: '' },
        ],
        status: 'draft',
      },
      {
        id: '04-03-01',
        pageId: '04-03-p02',
        order: 1,
        title: 'Generar el título visual',
        required: true,
        canonicalSolution: '',
        validationRules: [
          { id: 'vr-04-03-01-req-maketitle', type: 'REQUIRE_COMMAND', required: true, scope: 'BODY', feedback: '' },
        ],
        status: 'draft',
      },
      {
        id: '04-03-02',
        pageId: '04-03-p03',
        order: 1,
        title: 'Corregir maketitle',
        required: true,
        canonicalSolution: '',
        validationRules: [
          { id: 'vr-04-03-02-req-maketitle-body', type: 'REQUIRE_COMMAND', required: true, scope: 'BODY', feedback: '' },
        ],
        status: 'draft',
      },
      {
        id: '04-04-01',
        pageId: '04-04-p02',
        order: 1,
        title: 'Añadir un resumen',
        required: true,
        canonicalSolution: '',
        validationRules: [
          { id: 'vr-04-04-01-req-abstract', type: 'REQUIRE_ENVIRONMENT', required: true, scope: 'BODY', feedback: '' },
        ],
        status: 'draft',
      },
      {
        id: '04-04-02',
        pageId: '04-04-p03',
        order: 1,
        title: 'Mejorar un resumen',
        required: true,
        canonicalSolution: '',
        validationRules: [
          { id: 'vr-04-04-02-req-abstract', type: 'REQUIRE_ENVIRONMENT', required: true, scope: 'BODY', feedback: '' },
        ],
        status: 'draft',
      },
      {
        id: '04-05-01',
        pageId: '04-05-p01',
        order: 1,
        title: 'Construir el bloque inicial',
        required: true,
        canonicalSolution: '',
        validationRules: [
          { id: 'vr-04-05-01-req-title', type: 'REQUIRE_COMMAND', required: true, scope: 'PREAMBLE', feedback: '' },
        ],
        status: 'draft',
      },
      {
        id: '04-05-02',
        pageId: '04-05-p02',
        order: 1,
        title: 'Corregir datos mal ubicados',
        required: true,
        canonicalSolution: '',
        validationRules: [
          { id: 'vr-04-05-02-req-author-preamble', type: 'REQUIRE_COMMAND', required: true, scope: 'PREAMBLE', feedback: '' },
        ],
        status: 'draft',
      },
    ];

    it('has exactly 20 exercises', () => {
      expect(exercises).toHaveLength(20);
    });

    it('has unique IDs', () => {
      expect(hasUniqueIds(exercises)).toBe(true);
    });

    it('every exercise references a known page', () => {
      for (const ex of exercises) {
        expect(knownPageIds).toContain(ex.pageId);
      }
    });

    it('order is a positive integer', () => {
      for (const ex of exercises) {
        expect(isValidIntegerPositive(ex.order)).toBe(true);
      }
    });

    it('order is unique within each pageId', () => {
      const groups = new Map<string, number[]>();
      for (const ex of exercises) {
        if (!groups.has(ex.pageId)) groups.set(ex.pageId, []);
        groups.get(ex.pageId)!.push(ex.order);
      }
      for (const [pageId, orders] of groups) {
        expect(new Set(orders).size, `duplicate exercise.order in ${pageId}`).toBe(orders.length);
      }
    });

    it('rejects order that is decimal or non-positive', () => {
      expect(isValidIntegerPositive(0)).toBe(false);
      expect(isValidIntegerPositive(-1)).toBe(false);
      expect(isValidIntegerPositive(2.5)).toBe(false);
    });

    it('draft exercises may omit canonicalSolution', () => {
      const draftWithoutSol: ExerciseData = { ...exercises[0], canonicalSolution: undefined };
      expect(hasValidCanonicalSolution(draftWithoutSol)).toBe(true);
    });

    it('published exercises require non-empty canonicalSolution', () => {
      const pubWithoutSol: ExerciseData = { ...exercises[0], status: 'published', canonicalSolution: undefined };
      expect(hasValidCanonicalSolution(pubWithoutSol)).toBe(false);
    });

    it('published exercises reject empty canonicalSolution', () => {
      const pubEmptySol: ExerciseData = { ...exercises[0], status: 'published', canonicalSolution: '' };
      expect(hasValidCanonicalSolution(pubEmptySol)).toBe(false);
    });

    it('accepts published exercises with canonicalSolution', () => {
      const pubWithSol: ExerciseData = { ...exercises[0], status: 'published', canonicalSolution: '\\documentclass{article}' };
      expect(hasValidCanonicalSolution(pubWithSol)).toBe(true);
    });

    it('validationRules have unique IDs', () => {
      for (const ex of exercises) {
        expect(hasUniqueIds(ex.validationRules)).toBe(true);
      }
    });

    it('validationRules use valid types', () => {
      for (const ex of exercises) {
        for (const rule of ex.validationRules) {
          expect(VALID_RULE_TYPES).toContain(rule.type);
        }
      }
    });

    it('validationRules use valid scopes', () => {
      for (const ex of exercises) {
        for (const rule of ex.validationRules) {
          expect(VALID_SCOPES).toContain(rule.scope);
        }
      }
    });

    it('has valid status', () => {
      for (const ex of exercises) {
        expect(VALID_STATUSES).toContain(ex.status);
      }
    });

    it('rejects more than 5 variants', () => {
      const variants = Array.from({ length: 6 }, (_, i) => ({ id: `v${i + 1}` }));
      const tooMany: ExerciseData = { ...exercises[0], variants };
      expect(hasValidVariants(tooMany)).toBe(false);
    });

    it('accepts up to 5 variants', () => {
      const variants = Array.from({ length: 5 }, (_, i) => ({ id: `v${i + 1}` }));
      const max: ExerciseData = { ...exercises[0], variants };
      expect(hasValidVariants(max)).toBe(true);
    });

    it('rejects duplicate variant IDs', () => {
      const variants = [{ id: 'dup' }, { id: 'dup' }];
      const dup: ExerciseData = { ...exercises[0], variants };
      expect(hasValidVariants(dup)).toBe(false);
    });

    it('accepts empty variants', () => {
      const empty: ExerciseData = { ...exercises[0], variants: [] };
      expect(hasValidVariants(empty)).toBe(true);
    });

    it('accepts undefined variants', () => {
      expect(hasValidVariants(exercises[0])).toBe(true);
    });
  });

  describe('Resource assignment per page', () => {
    const examples: ExampleData[] = [
      { id: '02-02-01', pageId: '02-02-p03', order: 1, title: '', description: '', editable: true, initialCode: '', renderMode: 'SAFE_LATEX_PREVIEW', packages: [], explanation: '', actions: ['copy', 'clear', 'restore'], status: 'archived' },
      { id: '02-03-01', pageId: '02-03-p02', order: 1, title: '', description: '', editable: true, initialCode: '', renderMode: 'SAFE_LATEX_PREVIEW', packages: [], explanation: '', actions: ['copy', 'clear', 'restore'], status: 'archived' },
      { id: '02-04-01', pageId: '02-04-p03', order: 1, title: '', description: '', editable: true, initialCode: '', renderMode: 'SAFE_LATEX_PREVIEW', packages: [], explanation: '', actions: ['copy', 'clear', 'restore'], status: 'archived' },
    ];

    const exercises: ExerciseData[] = [
      { id: '02-02-01', pageId: '02-02-p03', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r1', type: 'REQUIRE_COMMAND', required: true, scope: 'FULL_DOCUMENT', feedback: '' }], status: 'draft' },
      { id: '02-03-01', pageId: '02-03-p02', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r2', type: 'REQUIRE_ENVIRONMENT', required: true, scope: 'FULL_DOCUMENT', feedback: '' }], status: 'draft' },
      { id: '02-04-01', pageId: '02-04-p03', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r3', type: 'REQUIRE_COMMAND', required: true, scope: 'FULL_DOCUMENT', feedback: '' }], status: 'draft' },
      { id: '02-04-02', pageId: '02-04-p04', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r4', type: 'REQUIRE_COMMAND', required: true, scope: 'FULL_DOCUMENT', feedback: '' }], status: 'draft' },
      { id: '02-04-03', pageId: '02-04-p05', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r5', type: 'REQUIRE_COMMAND', required: true, scope: 'FULL_DOCUMENT', feedback: '' }], status: 'draft' },
      { id: '03-01-01', pageId: '03-01-p03', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r6', type: 'REQUIRE_COMMAND', required: true, scope: 'PREAMBLE', feedback: '' }], status: 'draft' },
      { id: '03-02-01', pageId: '03-02-p02', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r7', type: 'REQUIRE_COMMAND', required: true, scope: 'PREAMBLE', feedback: '' }], status: 'draft' },
      { id: '03-03-01', pageId: '03-03-p02', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r8', type: 'REQUIRE_TEXT', required: true, scope: 'PREAMBLE', feedback: '' }], status: 'draft' },
      { id: '03-04-01', pageId: '03-04-p02', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r9', type: 'REQUIRE_TEXT', required: true, scope: 'PREAMBLE', feedback: '' }], status: 'draft' },
      { id: '03-05-01', pageId: '03-05-p02', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r10', type: 'REQUIRE_TEXT', required: true, scope: 'PREAMBLE', feedback: '' }], status: 'draft' },
      { id: '03-05-02', pageId: '03-05-p03', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r11', type: 'REQUIRE_COMMAND', required: true, scope: 'FULL_DOCUMENT', feedback: '' }], status: 'draft' },
      { id: '04-01-01', pageId: '04-01-p02', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r12', type: 'REQUIRE_COMMAND', required: true, scope: 'PREAMBLE', feedback: '' }], status: 'draft' },
      { id: '04-02-01', pageId: '04-02-p02', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r13', type: 'REQUIRE_COMMAND', required: true, scope: 'PREAMBLE', feedback: '' }], status: 'draft' },
      { id: '04-02-02', pageId: '04-02-p03', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r14', type: 'REQUIRE_COMMAND', required: true, scope: 'PREAMBLE', feedback: '' }], status: 'draft' },
      { id: '04-03-01', pageId: '04-03-p02', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r15', type: 'REQUIRE_COMMAND', required: true, scope: 'BODY', feedback: '' }], status: 'draft' },
      { id: '04-03-02', pageId: '04-03-p03', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r16', type: 'REQUIRE_COMMAND', required: true, scope: 'BODY', feedback: '' }], status: 'draft' },
      { id: '04-04-01', pageId: '04-04-p02', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r17', type: 'REQUIRE_ENVIRONMENT', required: true, scope: 'BODY', feedback: '' }], status: 'draft' },
      { id: '04-04-02', pageId: '04-04-p03', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r18', type: 'REQUIRE_ENVIRONMENT', required: true, scope: 'BODY', feedback: '' }], status: 'draft' },
      { id: '04-05-01', pageId: '04-05-p01', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r19', type: 'REQUIRE_COMMAND', required: true, scope: 'PREAMBLE', feedback: '' }], status: 'draft' },
      { id: '04-05-02', pageId: '04-05-p02', order: 1, title: '', required: true, canonicalSolution: '', validationRules: [{ id: 'r20', type: 'REQUIRE_COMMAND', required: true, scope: 'PREAMBLE', feedback: '' }], status: 'draft' },
    ];

    function getExamplesByPage(pageId: string) {
      return examples.filter((e) => e.pageId === pageId);
    }

    function getExercisesByPage(pageId: string) {
      return exercises.filter((e) => e.pageId === pageId);
    }

    it('02-01-p01 and 02-01-p02 have no resources (theory pages)', () => {
      expect(getExercisesByPage('02-01-p01')).toHaveLength(0);
      expect(getExercisesByPage('02-01-p02')).toHaveLength(0);
      expect(getExamplesByPage('02-01-p01').filter((e) => e.status !== 'archived')).toHaveLength(0);
      expect(getExamplesByPage('02-01-p02').filter((e) => e.status !== 'archived')).toHaveLength(0);
    });

    it('02-01-p03 has no resources (solved example page)', () => {
      expect(getExercisesByPage('02-01-p03')).toHaveLength(0);
      expect(getExamplesByPage('02-01-p03').filter((e) => e.status !== 'archived')).toHaveLength(0);
    });

    it('02-02-p01 and 02-02-p02 have no resources (theory pages)', () => {
      expect(getExercisesByPage('02-02-p01')).toHaveLength(0);
      expect(getExercisesByPage('02-02-p02')).toHaveLength(0);
      expect(getExamplesByPage('02-02-p01').filter((e) => e.status !== 'archived')).toHaveLength(0);
      expect(getExamplesByPage('02-02-p02').filter((e) => e.status !== 'archived')).toHaveLength(0);
    });

    it('02-02-p03 has exactly one exercise', () => {
      expect(getExercisesByPage('02-02-p03')).toHaveLength(1);
      expect(getExamplesByPage('02-02-p03').filter((e) => e.status !== 'archived')).toHaveLength(0);
    });

    it('02-02-p04 has no resources (solved example page)', () => {
      expect(getExercisesByPage('02-02-p04')).toHaveLength(0);
      expect(getExamplesByPage('02-02-p04').filter((e) => e.status !== 'archived')).toHaveLength(0);
    });

    it('02-03-p01 has no resources (theory page)', () => {
      expect(getExercisesByPage('02-03-p01')).toHaveLength(0);
      expect(getExamplesByPage('02-03-p01').filter((e) => e.status !== 'archived')).toHaveLength(0);
    });

    it('02-03-p02 has exactly one exercise', () => {
      expect(getExercisesByPage('02-03-p02')).toHaveLength(1);
      expect(getExamplesByPage('02-03-p02').filter((e) => e.status !== 'archived')).toHaveLength(0);
    });

    it('02-03-p03 has no resources (solved example page)', () => {
      expect(getExercisesByPage('02-03-p03')).toHaveLength(0);
      expect(getExamplesByPage('02-03-p03').filter((e) => e.status !== 'archived')).toHaveLength(0);
    });

    it('02-04-p01 and 02-04-p02 have no resources (theory pages)', () => {
      expect(getExercisesByPage('02-04-p01')).toHaveLength(0);
      expect(getExercisesByPage('02-04-p02')).toHaveLength(0);
      expect(getExamplesByPage('02-04-p01').filter((e) => e.status !== 'archived')).toHaveLength(0);
      expect(getExamplesByPage('02-04-p02').filter((e) => e.status !== 'archived')).toHaveLength(0);
    });

    it('02-04-p03, 02-04-p04 and 02-04-p05 each have exactly one exercise', () => {
      expect(getExercisesByPage('02-04-p03')).toHaveLength(1);
      expect(getExercisesByPage('02-04-p04')).toHaveLength(1);
      expect(getExercisesByPage('02-04-p05')).toHaveLength(1);
    });

    it('03-01-p01 and 03-01-p02 have no resources (theory/example pages)', () => {
      expect(getExercisesByPage('03-01-p01')).toHaveLength(0);
      expect(getExercisesByPage('03-01-p02')).toHaveLength(0);
    });

    it('03-01-p03 has exactly one exercise', () => {
      expect(getExercisesByPage('03-01-p03')).toHaveLength(1);
    });

    it('03-02-p01 has no resources (theory page)', () => {
      expect(getExercisesByPage('03-02-p01')).toHaveLength(0);
    });

    it('03-02-p02 has exactly one exercise', () => {
      expect(getExercisesByPage('03-02-p02')).toHaveLength(1);
    });

    it('03-03-p01 has no resources (theory page)', () => {
      expect(getExercisesByPage('03-03-p01')).toHaveLength(0);
    });

    it('03-03-p02 has exactly one exercise', () => {
      expect(getExercisesByPage('03-03-p02')).toHaveLength(1);
    });

    it('03-04-p01 has no resources (theory page)', () => {
      expect(getExercisesByPage('03-04-p01')).toHaveLength(0);
    });

    it('03-04-p02 has exactly one exercise', () => {
      expect(getExercisesByPage('03-04-p02')).toHaveLength(1);
    });

    it('03-04-p03 has no resources (example page)', () => {
      expect(getExercisesByPage('03-04-p03')).toHaveLength(0);
    });

    it('03-05-p01 has no resources (example page)', () => {
      expect(getExercisesByPage('03-05-p01')).toHaveLength(0);
    });

    it('03-05-p02 has exactly one exercise', () => {
      expect(getExercisesByPage('03-05-p02')).toHaveLength(1);
    });

    it('03-05-p03 has exactly one exercise', () => {
      expect(getExercisesByPage('03-05-p03')).toHaveLength(1);
    });

    it('04-01-p01 has no resources (theory page)', () => {
      expect(getExercisesByPage('04-01-p01')).toHaveLength(0);
    });

    it('04-01-p02 has exactly one exercise', () => {
      expect(getExercisesByPage('04-01-p02')).toHaveLength(1);
    });

    it('04-02-p01 has no resources (theory page)', () => {
      expect(getExercisesByPage('04-02-p01')).toHaveLength(0);
    });

    it('04-02-p02 has exactly one exercise', () => {
      expect(getExercisesByPage('04-02-p02')).toHaveLength(1);
    });

    it('04-02-p03 has exactly one exercise', () => {
      expect(getExercisesByPage('04-02-p03')).toHaveLength(1);
    });

    it('04-03-p01 has no resources (theory page)', () => {
      expect(getExercisesByPage('04-03-p01')).toHaveLength(0);
    });

    it('04-03-p02 has exactly one exercise', () => {
      expect(getExercisesByPage('04-03-p02')).toHaveLength(1);
    });

    it('04-03-p03 has exactly one exercise', () => {
      expect(getExercisesByPage('04-03-p03')).toHaveLength(1);
    });

    it('04-04-p01 has no resources (theory page)', () => {
      expect(getExercisesByPage('04-04-p01')).toHaveLength(0);
    });

    it('04-04-p02 has exactly one exercise', () => {
      expect(getExercisesByPage('04-04-p02')).toHaveLength(1);
    });

    it('04-04-p03 has exactly one exercise', () => {
      expect(getExercisesByPage('04-04-p03')).toHaveLength(1);
    });

    it('04-05-p01 has exactly one exercise', () => {
      expect(getExercisesByPage('04-05-p01')).toHaveLength(1);
    });

    it('04-05-p02 has exactly one exercise', () => {
      expect(getExercisesByPage('04-05-p02')).toHaveLength(1);
    });

    it('no page has both a visible example and an exercise simultaneously', () => {
      for (const pageId of knownPageIds) {
        const exs = getExamplesByPage(pageId).filter((e) => e.status !== 'archived');
        const exers = getExercisesByPage(pageId);
        expect(exs.length === 0 || exers.length === 0, `page ${pageId} has both example and exercise`).toBe(true);
      }
    });

    it('every resource points to a known page', () => {
      for (const ex of examples) {
        expect(knownPageIds).toContain(ex.pageId);
      }
      for (const ex of exercises) {
        expect(knownPageIds).toContain(ex.pageId);
      }
    });
  });
});

describe('Section 2 content rules', () => {
  function readPageContent(pageId: string): string {
    const path = resolve(`src/content/lesson-page/${pageId}.md`);
    return readFileSync(path, 'utf-8');
  }

  const theoryPages = ['02-01-p01', '02-01-p02', '02-02-p01', '02-02-p02', '02-03-p01', '02-04-p01', '02-04-p02'];
  const practicePages = ['02-02-p03', '02-03-p02', '02-04-p03', '02-04-p04', '02-04-p05'];
  const examplePages = ['02-01-p03', '02-02-p04', '02-03-p03'];

  it('theory pages do not contain instruction or success criteria blocks', () => {
    for (const pageId of theoryPages) {
      const content = readPageContent(pageId);
      expect(content, `${pageId} must not contain 'Instrucción:'`).not.toContain('**Instrucción:**');
      expect(content, `${pageId} must not contain 'Criterio de éxito:'`).not.toContain('**Criterio de éxito:**');
    }
  });

  it('practice pages do not contain success criteria or objective blocks in Markdown', () => {
    for (const pageId of practicePages) {
      const content = readPageContent(pageId);
      expect(content, `${pageId} must not contain 'Criterio de éxito'`).not.toContain('**Criterio de éxito:**');
      expect(content, `${pageId} must not contain 'Objetivo:'`).not.toContain('**Objetivo:**');
      expect(content, `${pageId} must not contain 'Limitación:'`).not.toContain('**Limitación:**');
    }
  });

  it('example pages use Ejemplo: not Ejemplo resuelto', () => {
    for (const pageId of examplePages) {
      const content = readPageContent(pageId);
      expect(content, `${pageId} must contain '**Ejemplo:**'`).toContain('**Ejemplo:**');
      expect(content, `${pageId} must not contain 'Ejemplo resuelto'`).not.toContain('Ejemplo resuelto');
    }
  });

  it('02-02-p04 does not use \\section or \\textbf', () => {
    const content = readPageContent('02-02-p04');
    expect(content).not.toContain('\\section');
    expect(content).not.toContain('\\textbf');
  });

  it('no section 2 page uses PDF terminology for preview', () => {
    for (const pageId of [...theoryPages, ...practicePages, ...examplePages]) {
      const content = readPageContent(pageId);
      expect(content, `${pageId} must not contain 'El PDF muestra'`).not.toContain('El PDF muestra');
    }
  });

  it('02-02-p03 does not contain the limitation note', () => {
    const content = readPageContent('02-02-p03');
    expect(content).not.toContain('vista previa educativa todavía no representa');
    expect(content).not.toContain('**Criterio de éxito:**');
  });

  it('no page contains literal End of file', () => {
    for (const pageId of [...theoryPages, ...practicePages, ...examplePages]) {
      const content = readPageContent(pageId);
      expect(content, `${pageId} must not contain 'End of file'`).not.toContain('End of file');
    }
  });

  it('non-interactive pages do not contain imperative orders to the student', () => {
    const nonInteractive = [...theoryPages, ...examplePages];
    for (const pageId of nonInteractive) {
      const content = readPageContent(pageId);
      const lower = content.toLowerCase();
      expect(lower, `${pageId} must not contain 'señala'`).not.toContain('señala');
      expect(lower, `${pageId} must not contain 'encuentra'`).not.toContain('encuentra');
      expect(lower, `${pageId} must not contain 'elige'`).not.toContain('elige');
    }
  });
});

describe('Section 3 content rules', () => {
  function readPageContent(pageId: string): string {
    const path = resolve(`src/content/lesson-page/${pageId}.md`);
    return readFileSync(path, 'utf-8');
  }

  const theoryPages = ['03-01-p01', '03-02-p01', '03-03-p01', '03-04-p01'];
  const practicePages = ['03-01-p03', '03-02-p02', '03-03-p02', '03-04-p02', '03-05-p02', '03-05-p03'];
  const examplePages = ['03-01-p02', '03-04-p03', '03-05-p01'];

  it('has exactly 5 subsections (lessons)', () => {
    const section3Lessons = ['03-01', '03-02', '03-03', '03-04', '03-05'];
    expect(section3Lessons).toHaveLength(5);
  });

  it('has exactly 13 pages (3+2+2+3+3)', () => {
    const pages = [...theoryPages, ...practicePages, ...examplePages];
    expect(pages).toHaveLength(13);
  });

  it('theory pages do not contain instruction or success criteria blocks', () => {
    for (const pageId of theoryPages) {
      const content = readPageContent(pageId);
      expect(content, `${pageId} must not contain 'Instrucción:'`).not.toContain('**Instrucción:**');
      expect(content, `${pageId} must not contain 'Criterio de éxito:'`).not.toContain('**Criterio de éxito:**');
    }
  });

  it('practice pages do not contain success criteria or objective blocks in Markdown', () => {
    for (const pageId of practicePages) {
      const content = readPageContent(pageId);
      expect(content, `${pageId} must not contain 'Criterio de éxito'`).not.toContain('**Criterio de éxito:**');
      expect(content, `${pageId} must not contain 'Objetivo:'`).not.toContain('**Objetivo:**');
      expect(content, `${pageId} must not contain 'Limitación:'`).not.toContain('**Limitación:**');
    }
  });

  it('example pages use Ejemplo: not Ejemplo resuelto', () => {
    for (const pageId of examplePages) {
      const content = readPageContent(pageId);
      expect(content, `${pageId} must not contain 'Ejemplo resuelto'`).not.toContain('Ejemplo resuelto');
    }
  });

  it('no page contains literal End of file', () => {
    for (const pageId of [...theoryPages, ...practicePages, ...examplePages]) {
      const content = readPageContent(pageId);
      expect(content, `${pageId} must not contain 'End of file'`).not.toContain('End of file');
    }
  });
});

describe('Section 4 content rules', () => {
  function readPageContent(pageId: string): string {
    const path = resolve(`src/content/lesson-page/${pageId}.md`);
    return readFileSync(path, 'utf-8');
  }

  const theoryPages = ['04-01-p01', '04-02-p01', '04-03-p01', '04-04-p01'];
  const practicePages = ['04-01-p02', '04-02-p02', '04-02-p03', '04-03-p02', '04-03-p03', '04-04-p02', '04-04-p03', '04-05-p01', '04-05-p02'];
  const examplePages: string[] = [];

  it('has exactly 5 subsections (lessons)', () => {
    const section4Lessons = ['04-01', '04-02', '04-03', '04-04', '04-05'];
    expect(section4Lessons).toHaveLength(5);
  });

  it('has exactly 13 pages (2+3+3+3+2)', () => {
    const pages = [...theoryPages, ...practicePages, ...examplePages];
    expect(pages).toHaveLength(13);
  });

  it('theory pages do not contain instruction or success criteria blocks', () => {
    for (const pageId of theoryPages) {
      const content = readPageContent(pageId);
      expect(content, `${pageId} must not contain 'Instrucción:'`).not.toContain('**Instrucción:**');
      expect(content, `${pageId} must not contain 'Criterio de éxito:'`).not.toContain('**Criterio de éxito:**');
    }
  });

  it('practice pages do not contain success criteria or objective blocks in Markdown', () => {
    for (const pageId of practicePages) {
      const content = readPageContent(pageId);
      expect(content, `${pageId} must not contain 'Criterio de éxito'`).not.toContain('**Criterio de éxito:**');
      expect(content, `${pageId} must not contain 'Objetivo:'`).not.toContain('**Objetivo:**');
      expect(content, `${pageId} must not contain 'Limitación:'`).not.toContain('**Limitación:**');
    }
  });

  it('no page contains literal End of file', () => {
    for (const pageId of [...theoryPages, ...practicePages, ...examplePages]) {
      const content = readPageContent(pageId);
      expect(content, `${pageId} must not contain 'End of file'`).not.toContain('End of file');
    }
  });

  it('practice pages do not contain duplicate instructions', () => {
    for (const pageId of practicePages) {
      const content = readPageContent(pageId);
      const lower = content.toLowerCase();
      expect(lower, `${pageId} must not contain 'añade \\maketitle' as imperative in markdown`).not.toContain('añade \\maketitle');
    }
  });
});
