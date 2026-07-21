import { describe, it, expect } from 'vitest';
import { isVisible, prepareCourseRouteData, buildPageRouteData, buildPageSlug, getFirstPageHref } from '../lib/content/courseRouteData';

describe('isVisible', () => {
  it('dev: published y draft son visibles', () => {
    expect(isVisible({ status: 'published' }, true)).toBe(true);
    expect(isVisible({ status: 'draft' }, true)).toBe(true);
  });

  it('dev: archived NO es visible', () => {
    expect(isVisible({ status: 'archived' }, true)).toBe(false);
  });

  it('prod: solo published es visible', () => {
    expect(isVisible({ status: 'published' }, false)).toBe(true);
    expect(isVisible({ status: 'draft' }, false)).toBe(false);
    expect(isVisible({ status: 'archived' }, false)).toBe(false);
  });

  it('fail-closed: sin status no es visible', () => {
    expect(isVisible({}, true)).toBe(false);
    expect(isVisible({}, false)).toBe(false);
  });
});

describe('prepareCourseRouteData', () => {
  const sections = [
    { id: 's1', order: 1 },
    { id: 's2', order: 2 },
  ];
  const lessons = [
    { id: 'l1', sectionId: 's1', order: 1, status: 'published' },
    { id: 'l2', sectionId: 's2', order: 1, status: 'draft' },
  ];
  const pages = [
    { id: 'p1', lessonId: 'l1', slug: 'a', order: 1, status: 'published' },
    { id: 'p2', lessonId: 'l2', slug: 'b', order: 1, status: 'draft' },
  ];

  it('dev: incluye drafts en la secuencia', () => {
    const result = prepareCourseRouteData(sections, lessons, pages, true);
    expect(result.lessons).toHaveLength(2);
    expect(result.pages).toHaveLength(2);
    expect(result.sequence).toHaveLength(2);
  });

  it('prod: excluye drafts de la secuencia', () => {
    const result = prepareCourseRouteData(sections, lessons, pages, false);
    expect(result.lessons).toHaveLength(1);
    expect(result.pages).toHaveLength(1);
    expect(result.sequence).toHaveLength(1);
    expect(result.sequence[0].lessonId).toBe('l1');
  });

  it('no incluye páginas de lecciones no visibles', () => {
    const result = prepareCourseRouteData(sections, lessons, pages, false);
    const pageIds = result.sequence.map((e) => e.pageId);
    expect(pageIds).not.toContain('p2');
  });

  it('falla si una lección tiene sección inexistente', () => {
    const orphan = [{ id: 'orphan', sectionId: 'ghost', order: 1, status: 'published' }];
    expect(() =>
      prepareCourseRouteData(sections, orphan, [], true),
    ).toThrow(/ghost/);
  });

  it('falla si una página tiene lección inexistente', () => {
    const orphanPages = [{ id: 'ghost-page', lessonId: 'void', slug: 'x', order: 1, status: 'published' }];
    expect(() =>
      prepareCourseRouteData(sections, lessons, orphanPages, true),
    ).toThrow(/void/);
  });
});

describe('buildPageRouteData', () => {
  const sections = [
    { id: 's1', order: 1 },
    { id: 's2', order: 2 },
  ];
  const lessons = [
    { id: 'l1', sectionId: 's1', order: 1, status: 'published' },
    { id: 'l2', sectionId: 's1', order: 2, status: 'published' },
  ];
  const pages = [
    { id: 'p1', lessonId: 'l1', slug: 'first', order: 1, status: 'published' },
    { id: 'p2', lessonId: 'l1', slug: 'second', order: 2, status: 'published' },
    { id: 'p3', lessonId: 'l2', slug: 'third', order: 1, status: 'published' },
  ];
  const { sequence } = prepareCourseRouteData(sections, lessons, pages, true);

  it('previousHref y nextHref se construyen con buildPagePath', () => {
    const { previousHref, nextHref } = buildPageRouteData(sequence, 'p2');
    expect(previousHref).toMatch(/^\/aprender\//);
    expect(nextHref).toMatch(/^\/aprender\//);
    expect(previousHref).toContain('first');
    expect(nextHref).toContain('third');
  });

  it('página intermedia de la lección', () => {
    const result = buildPageRouteData(sequence, 'p2');
    expect(result.entry?.pageId).toBe('p2');
    expect(result.previous?.pageId).toBe('p1');
    expect(result.next?.pageId).toBe('p3');
  });

  it('primera página del curso', () => {
    const result = buildPageRouteData(sequence, 'p1');
    expect(result.previous).toBeNull();
    expect(result.previousHref).toBeNull();
    expect(result.next?.pageId).toBe('p2');
  });

  it('última página del curso', () => {
    const result = buildPageRouteData(sequence, 'p3');
    expect(result.next).toBeNull();
    expect(result.nextHref).toBeNull();
    expect(result.previous?.pageId).toBe('p2');
  });

  it('pageIndexInLesson y totalPagesInLesson correctos', () => {
    const r1 = buildPageRouteData(sequence, 'p1');
    expect(r1.entry?.pageIndexInLesson).toBe(0);
    expect(r1.entry?.totalPagesInLesson).toBe(2);

    const r2 = buildPageRouteData(sequence, 'p3');
    expect(r2.entry?.pageIndexInLesson).toBe(0);
    expect(r2.entry?.totalPagesInLesson).toBe(1);
  });

  it('ID inexistente: todo null', () => {
    const result = buildPageRouteData(sequence, 'ghost');
    expect(result.entry).toBeNull();
    expect(result.previous).toBeNull();
    expect(result.next).toBeNull();
    expect(result.previousHref).toBeNull();
    expect(result.nextHref).toBeNull();
  });

  it('previousHref y nextHref son rutas completas (con /aprender/)', () => {
    const { previousHref, nextHref } = buildPageRouteData(sequence, 'p2');
    expect(previousHref).toMatch(/^\/aprender\//);
    expect(nextHref).toMatch(/^\/aprender\//);
  });
});

describe('buildPageSlug', () => {
  it('retorna sectionId/lessonId/pageSlug sin prefijo /aprender/', () => {
    const entry: import('../lib/content/courseNavigation').CourseNavigationEntry = {
      sectionId: 'seccion-01',
      lessonId: '01-01',
      pageId: '01-01-p01',
      pageSlug: 'que-es-latex',
      sectionOrder: 1,
      lessonOrder: 1,
      pageOrder: 1,
      pageIndexInLesson: 0,
      totalPagesInLesson: 1,
    };
    expect(buildPageSlug(entry)).toBe('seccion-01/01-01/que-es-latex');
  });

  it('no incluye /aprender/ ni barras extra', () => {
    const entry: import('../lib/content/courseNavigation').CourseNavigationEntry = {
      sectionId: 'seccion-02',
      lessonId: '02-01',
      pageId: '02-01-p01',
      pageSlug: 'estructura-de-un-documento-latex',
      sectionOrder: 2,
      lessonOrder: 1,
      pageOrder: 1,
      pageIndexInLesson: 0,
      totalPagesInLesson: 1,
    };
    const slug = buildPageSlug(entry);
    expect(slug).not.toContain('/aprender/');
    expect(slug.startsWith('/')).toBe(false);
    expect(slug.endsWith('/')).toBe(false);
  });
});

describe('getFirstPageHref', () => {
  const sections = [
    { id: 's1', order: 1 },
    { id: 's2', order: 2 },
  ];
  const lessons = [
    { id: 'l1', sectionId: 's1', order: 1, status: 'published' },
    { id: 'l2', sectionId: 's2', order: 1, status: 'draft' },
  ];
  const pages = [
    { id: 'p1', lessonId: 'l1', slug: 'intro', order: 1, status: 'published' },
    { id: 'p2', lessonId: 'l2', slug: 'advanced', order: 1, status: 'draft' },
  ];

  it('dev: href apunta a la primera página visible con /aprender/', () => {
    const href = getFirstPageHref(sections, lessons, pages, true);
    expect(href).toMatch(/^\/aprender\//);
    expect(href).toContain('intro');
  });

  it('prod: href apunta a la primera página publicada con /aprender/', () => {
    const href = getFirstPageHref(sections, lessons, pages, false);
    expect(href).toMatch(/^\/aprender\//);
    expect(href).toContain('intro');
  });

  it('prod: null cuando no hay páginas publicadas', () => {
    const draftPages = [
      { id: 'p1', lessonId: 'l1', slug: 'draft-only', order: 1, status: 'draft' },
    ];
    const href = getFirstPageHref(sections, lessons, draftPages, false);
    expect(href).toBeNull();
  });

  it('null cuando no hay páginas visibles', () => {
    const archived = [
      { id: 'p1', lessonId: 'l1', slug: 'old', order: 1, status: 'archived' },
    ];
    const href = getFirstPageHref(sections, lessons, archived, false);
    expect(href).toBeNull();
  });

  it('dev: href apunta a draft cuando no hay publicadas', () => {
    const draftOnly = [
      { id: 'p1', lessonId: 'l1', slug: 'draft-page', order: 1, status: 'draft' },
    ];
    const href = getFirstPageHref(sections, lessons, draftOnly, true);
    expect(href).toContain('draft-page');
  });
});
