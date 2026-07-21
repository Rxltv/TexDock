import { describe, it, expect } from 'vitest';
import { buildCourseSequence, getAdjacentPages, buildPagePath } from '../lib/content/courseNavigation';

describe('content integrity: sección 1 (3 subsecciones, 13 páginas) y sección 2', () => {
  const sections = [
    { id: 'seccion-01', order: 1 },
    { id: 'seccion-02', order: 2 },
  ];
  const lessons = [
    { id: '01-01', sectionId: 'seccion-01', order: 1, title: '¿Qué es LaTeX?', status: 'draft' },
    { id: '01-02', sectionId: 'seccion-01', order: 2, title: 'El flujo de trabajo', status: 'draft' },
    { id: '01-03', sectionId: 'seccion-01', order: 3, title: 'Clases de documento', status: 'draft' },
    { id: '02-01', sectionId: 'seccion-02', order: 1, title: 'Estructura de un documento LaTeX', status: 'draft' },
  ];
  const pages = [
    { id: '01-01-p01', lessonId: '01-01', slug: 'la-idea-principal', order: 1, status: 'draft' },
    { id: '01-01-p02', lessonId: '01-01', slug: 'latex-vs-procesador-visual', order: 2, status: 'draft' },
    { id: '01-01-p03', lessonId: '01-01', slug: 'ventajas-academicas', order: 3, status: 'draft' },
    { id: '01-01-p04', lessonId: '01-01', slug: 'cuando-es-util', order: 4, status: 'draft' },
    { id: '01-02-p01', lessonId: '01-02', slug: 'archivo-fuente-compilacion', order: 1, status: 'draft' },
    { id: '01-02-p02', lessonId: '01-02', slug: 'compilar-no-es-terminar', order: 2, status: 'draft' },
    { id: '01-02-p03', lessonId: '01-02', slug: 'errores-del-proceso', order: 3, status: 'draft' },
    { id: '01-03-p01', lessonId: '01-03', slug: 'que-decide-una-clase', order: 1, status: 'draft' },
    { id: '01-03-p02', lessonId: '01-03', slug: 'clase-article', order: 2, status: 'draft' },
    { id: '01-03-p03', lessonId: '01-03', slug: 'clases-report-y-book', order: 3, status: 'draft' },
    { id: '01-03-p04', lessonId: '01-03', slug: 'clase-beamer', order: 4, status: 'draft' },
    { id: '01-03-p05', lessonId: '01-03', slug: 'elegir-una-clase', order: 5, status: 'draft' },
    { id: '01-03-p06', lessonId: '01-03', slug: 'reto-de-decision', order: 6, status: 'draft' },
    { id: '02-01-p01', lessonId: '02-01', slug: 'clase-del-documento', order: 1, status: 'draft' },
    { id: '02-01-p02', lessonId: '02-01', slug: 'preambulo', order: 2, status: 'draft' },
    { id: '02-01-p03', lessonId: '02-01', slug: 'cuerpo-del-documento', order: 3, status: 'draft' },
    { id: '02-01-p04', lessonId: '02-01', slug: 'documento-minimo', order: 4, status: 'draft' },
  ];

  const sequence = buildCourseSequence(sections, lessons, pages);

  it('secuencia contiene exactamente 17 páginas (13 de sección 1 + 4 de sección 2)', () => {
    expect(sequence).toHaveLength(17);
  });

  it('secuencia en el orden esperado', () => {
    const slugs = sequence.map((e) => e.pageSlug);
    expect(slugs).toEqual([
      'la-idea-principal',
      'latex-vs-procesador-visual',
      'ventajas-academicas',
      'cuando-es-util',
      'archivo-fuente-compilacion',
      'compilar-no-es-terminar',
      'errores-del-proceso',
      'que-decide-una-clase',
      'clase-article',
      'clases-report-y-book',
      'clase-beamer',
      'elegir-una-clase',
      'reto-de-decision',
      'clase-del-documento',
      'preambulo',
      'cuerpo-del-documento',
      'documento-minimo',
    ]);
  });

  it('pageIndexInLesson y totalPagesInLesson correctos para 01-01 (4 páginas)', () => {
    const p1 = sequence.find((e) => e.pageId === '01-01-p01')!;
    const p4 = sequence.find((e) => e.pageId === '01-01-p04')!;
    expect(p1.pageIndexInLesson).toBe(0);
    expect(p4.pageIndexInLesson).toBe(3);
    expect(p1.totalPagesInLesson).toBe(4);
    expect(p4.totalPagesInLesson).toBe(4);
  });

  it('pageIndexInLesson y totalPagesInLesson correctos para 01-02 (3 páginas)', () => {
    const p1 = sequence.find((e) => e.pageId === '01-02-p01')!;
    const p3 = sequence.find((e) => e.pageId === '01-02-p03')!;
    expect(p1.pageIndexInLesson).toBe(0);
    expect(p3.pageIndexInLesson).toBe(2);
    expect(p1.totalPagesInLesson).toBe(3);
    expect(p3.totalPagesInLesson).toBe(3);
  });

  it('pageIndexInLesson y totalPagesInLesson correctos para 01-03 (6 páginas)', () => {
    const p1 = sequence.find((e) => e.pageId === '01-03-p01')!;
    const p6 = sequence.find((e) => e.pageId === '01-03-p06')!;
    expect(p1.pageIndexInLesson).toBe(0);
    expect(p6.pageIndexInLesson).toBe(5);
    expect(p1.totalPagesInLesson).toBe(6);
    expect(p6.totalPagesInLesson).toBe(6);
  });

  it('pageIndexInLesson y totalPagesInLesson correctos para sección 2 (4 páginas)', () => {
    const p1 = sequence.find((e) => e.pageId === '02-01-p01')!;
    const p4 = sequence.find((e) => e.pageId === '02-01-p04')!;
    expect(p1.pageIndexInLesson).toBe(0);
    expect(p4.pageIndexInLesson).toBe(3);
    expect(p1.totalPagesInLesson).toBe(4);
    expect(p4.totalPagesInLesson).toBe(4);
  });

  it('navegación dentro de 01-01', () => {
    const p1 = getAdjacentPages(sequence, '01-01-p01');
    expect(p1.previous).toBeNull();
    expect(p1.next?.pageId).toBe('01-01-p02');

    const p2 = getAdjacentPages(sequence, '01-01-p02');
    expect(p2.previous?.pageId).toBe('01-01-p01');
    expect(p2.next?.pageId).toBe('01-01-p03');

    const p4 = getAdjacentPages(sequence, '01-01-p04');
    expect(p4.previous?.pageId).toBe('01-01-p03');
    expect(p4.next?.pageId).toBe('01-02-p01');
  });

  it('navegación entre 01-01 y 01-02', () => {
    const trans = getAdjacentPages(sequence, '01-01-p04');
    expect(trans.next?.lessonId).toBe('01-02');
    expect(trans.next?.pageId).toBe('01-02-p01');
  });

  it('navegación entre 01-02 y 01-03', () => {
    const trans = getAdjacentPages(sequence, '01-02-p03');
    expect(trans.next?.lessonId).toBe('01-03');
    expect(trans.next?.pageId).toBe('01-03-p01');
  });

  it('navegación entre 01-03 y 02-01', () => {
    const trans = getAdjacentPages(sequence, '01-03-p06');
    expect(trans.next?.lessonId).toBe('02-01');
    expect(trans.next?.pageId).toBe('02-01-p01');
  });

  it('navegación dentro de sección 2', () => {
    const clase = getAdjacentPages(sequence, '02-01-p01');
    expect(clase.previous?.pageId).toBe('01-03-p06');
    expect(clase.next?.pageId).toBe('02-01-p02');

    const preambulo = getAdjacentPages(sequence, '02-01-p02');
    expect(preambulo.previous?.pageId).toBe('02-01-p01');
    expect(preambulo.next?.pageId).toBe('02-01-p03');

    const cuerpo = getAdjacentPages(sequence, '02-01-p03');
    expect(cuerpo.previous?.pageId).toBe('02-01-p02');
    expect(cuerpo.next?.pageId).toBe('02-01-p04');

    const minimo = getAdjacentPages(sequence, '02-01-p04');
    expect(minimo.previous?.pageId).toBe('02-01-p03');
    expect(minimo.next).toBeNull();
  });

  it('no hay ruta falsa después de 02-01-p04', () => {
    const last = getAdjacentPages(sequence, '02-01-p04');
    expect(last.next).toBeNull();
  });

  it('no hay ruta falsa antes de 01-01-p01', () => {
    const first = getAdjacentPages(sequence, '01-01-p01');
    expect(first.previous).toBeNull();
  });

  it('buildPagePath genera URLs correctas para todas las páginas', () => {
    expect(buildPagePath('seccion-01', '01-01', 'la-idea-principal')).toBe('/aprender/seccion-01/01-01/la-idea-principal/');
    expect(buildPagePath('seccion-01', '01-01', 'cuando-es-util')).toBe('/aprender/seccion-01/01-01/cuando-es-util/');
    expect(buildPagePath('seccion-01', '01-02', 'archivo-fuente-compilacion')).toBe('/aprender/seccion-01/01-02/archivo-fuente-compilacion/');
    expect(buildPagePath('seccion-01', '01-02', 'errores-del-proceso')).toBe('/aprender/seccion-01/01-02/errores-del-proceso/');
    expect(buildPagePath('seccion-01', '01-03', 'que-decide-una-clase')).toBe('/aprender/seccion-01/01-03/que-decide-una-clase/');
    expect(buildPagePath('seccion-01', '01-03', 'reto-de-decision')).toBe('/aprender/seccion-01/01-03/reto-de-decision/');
    expect(buildPagePath('seccion-02', '02-01', 'clase-del-documento')).toBe('/aprender/seccion-02/02-01/clase-del-documento/');
    expect(buildPagePath('seccion-02', '02-01', 'documento-minimo')).toBe('/aprender/seccion-02/02-01/documento-minimo/');
  });

  it('slugs son únicos dentro de cada lessonId', () => {
    for (const lessonId of ['01-01', '01-02', '01-03', '02-01']) {
      const slugs = pages.filter((p) => p.lessonId === lessonId).map((p) => p.slug);
      expect(new Set(slugs).size, `duplicate slug in ${lessonId}`).toBe(slugs.length);
    }
  });

  it('órdenes son únicos dentro de cada lessonId', () => {
    for (const lessonId of ['01-01', '01-02', '01-03', '02-01']) {
      const orders = pages.filter((p) => p.lessonId === lessonId).map((p) => p.order);
      expect(new Set(orders).size, `duplicate order in ${lessonId}`).toBe(orders.length);
    }
  });
});
