import { describe, it, expect } from 'vitest';

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
  'REQUIRE_COMMAND', 'REQUIRE_ENVIRONMENT', 'REQUIRE_ARGUMENT',
  'REQUIRE_TEXT', 'REQUIRE_MATH_STRUCTURE', 'REQUIRE_ORDER',
  'REQUIRE_MATCHING_ARGUMENTS', 'FORBID_ALTERNATIVE',
];
const VALID_SCOPES = ['PREAMBLE', 'BODY', 'MATH', 'FULL_DOCUMENT'];
const VALID_STATUSES = ['draft', 'published', 'archived'];

const knownLessonIds = Array.from({ length: 15 }, (_, i) =>
  `${String(i + 1).padStart(2, '0')}-01`
);

const knownPageIds = ['01-01-p01', '02-01-p01'];

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

  describe('Lesson structure', () => {
    const sectionIds: string[] = Array.from({ length: 15 }, (_, i) =>
      `seccion-${String(i + 1).padStart(2, '0')}`,
    );

    const lessons: LessonData[] = Array.from({ length: 15 }, (_, i) => {
      const num = i + 1;
      return {
        id: `${String(num).padStart(2, '0')}-01`,
        title: '',
        sectionId: `seccion-${String(num).padStart(2, '0')}`,
        order: 1,
        status: 'draft',
      };
    });

    it('has exactly 15 lessons', () => {
      expect(lessons).toHaveLength(15);
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

    it('has matching section references', () => {
      for (const lesson of lessons) {
        const sectionNum = lesson.sectionId.replace('seccion-', '');
        const lessonNum = lesson.id.split('-')[0];
        expect(sectionNum).toBe(lessonNum);
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
  });

  describe('LessonPage structure', () => {
    const parentLessons: LessonData[] = [
      { id: '01-01', title: '', sectionId: 'seccion-01', order: 1, status: 'draft' },
      { id: '02-01', title: '', sectionId: 'seccion-02', order: 1, status: 'draft' },
    ];

    const lessonPages: LessonPageData[] = [
      { id: '01-01-p01', lessonId: '01-01', slug: 'que-es-latex', title: '¿Qué es LaTeX?', order: 1, status: 'draft' },
      { id: '02-01-p01', lessonId: '02-01', slug: 'estructura-de-un-documento-latex', title: 'Estructura de un documento LaTeX', order: 1, status: 'draft' },
    ];

    it('has at least 2 pages', () => {
      expect(lessonPages.length).toBeGreaterThanOrEqual(2);
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
      { id: '02-01', title: '', sectionId: 'seccion-02', order: 1, status: 'draft' },
    ];

    const lessonPages: LessonPageData[] = [
      { id: '01-01-p01', lessonId: '01-01', slug: 'que-es-latex', title: '', order: 1, status: 'draft' },
      { id: '02-01-p01', lessonId: '02-01', slug: 'estructura', title: '', order: 1, status: 'draft' },
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
        id: '01-01-01',
        pageId: '01-01-p01',
        order: 1,
        title: 'Hola mundo en LaTeX',
        description: 'Un primer vistazo a cómo se escribe código LaTeX.',
        editable: true,
        initialCode: '\\documentclass{article}\n\\begin{document}\nHola, mundo.\n\\end{document}',
        renderMode: 'SAFE_LATEX_PREVIEW',
        packages: [],
        explanation: 'Este ejemplo muestra la estructura mínima.',
        expectedPreview: 'El texto aparece en el cuerpo.',
        actions: ['copy', 'clear', 'restore'],
        status: 'draft',
      },
    ];

    it('can be loaded', () => {
      expect(examples).toHaveLength(1);
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

    it('rejects order that is decimal or non-positive', () => {
      expect(isValidIntegerPositive(0)).toBe(false);
      expect(isValidIntegerPositive(-1)).toBe(false);
      expect(isValidIntegerPositive(1.5)).toBe(false);
      expect(isValidIntegerPositive(3)).toBe(true);
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

    it('rejects editable example missing required actions', () => {
      const bad: ExampleData = { ...examples[0], actions: ['copy'] };
      expect(hasValidExampleActions(bad)).toBe(false);
    });

    it('rejects non-editable example with clear or restore', () => {
      const bad: ExampleData = { ...examples[0], editable: false, actions: ['copy', 'clear'] };
      expect(hasValidExampleActions(bad)).toBe(false);
    });

    it('rejects duplicate actions', () => {
      const bad: ExampleData = { ...examples[0], actions: ['copy', 'copy', 'clear', 'restore'] };
      expect(hasValidExampleActions(bad)).toBe(false);
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
        id: '02-01-01',
        pageId: '02-01-p01',
        order: 1,
        title: 'Estructura mínima',
        required: true,
        canonicalSolution: '\\documentclass{article}\n\\begin{document}\nMi primer documento.\n\\end{document}',
        validationRules: [
          { id: 'vr-02-01-01-req-documentclass', type: 'REQUIRE_COMMAND', required: true, scope: 'FULL_DOCUMENT', feedback: 'Falta \\documentclass.' },
          { id: 'vr-02-01-01-req-begin-document', type: 'REQUIRE_COMMAND', required: true, scope: 'FULL_DOCUMENT', feedback: 'Falta \\begin{document}.' },
          { id: 'vr-02-01-01-req-end-document', type: 'REQUIRE_COMMAND', required: true, scope: 'FULL_DOCUMENT', feedback: 'Falta \\end{document}.' },
          { id: 'vr-02-01-01-req-text', type: 'REQUIRE_TEXT', required: true, scope: 'BODY', feedback: 'El cuerpo debe contener texto.' },
          { id: 'vr-02-01-01-req-article-arg', type: 'REQUIRE_ARGUMENT', required: true, scope: 'FULL_DOCUMENT', feedback: 'El argumento debe ser article.' },
        ],
        status: 'draft',
      },
    ];

    it('can be loaded', () => {
      expect(exercises).toHaveLength(1);
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
});
