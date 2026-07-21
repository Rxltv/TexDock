import { describe, it, expect } from 'vitest';
import { buildCourseSequence, getAdjacentPages, buildPagePath } from '../lib/content/courseNavigation';

describe('content integrity: secciones 1 y 2', () => {
  const sections = [
    { id: 'seccion-01', order: 1 },
    { id: 'seccion-02', order: 2 },
  ];
  const lessons = [
    { id: '01-01', sectionId: 'seccion-01', order: 1, title: '¿Qué es LaTeX?', status: 'draft' },
    { id: '02-01', sectionId: 'seccion-02', order: 1, title: 'Estructura de un documento LaTeX', status: 'draft' },
  ];
  const pages = [
    { id: '01-01-p01', lessonId: '01-01', slug: 'que-es-latex', order: 1, status: 'draft' },
    { id: '02-01-p01', lessonId: '02-01', slug: 'clase-del-documento', order: 1, status: 'draft' },
    { id: '02-01-p02', lessonId: '02-01', slug: 'preambulo', order: 2, status: 'draft' },
    { id: '02-01-p03', lessonId: '02-01', slug: 'cuerpo-del-documento', order: 3, status: 'draft' },
    { id: '02-01-p04', lessonId: '02-01', slug: 'documento-minimo', order: 4, status: 'draft' },
  ];

  const sequence = buildCourseSequence(sections, lessons, pages);

  it('secuencia contiene exactamente 5 páginas', () => {
    expect(sequence).toHaveLength(5);
  });

  it('secuencia en el orden esperado', () => {
    const slugs = sequence.map((e) => e.pageSlug);
    expect(slugs).toEqual([
      'que-es-latex',
      'clase-del-documento',
      'preambulo',
      'cuerpo-del-documento',
      'documento-minimo',
    ]);
  });

  it('pageIndexInLesson y totalPagesInLesson correctos para sección 1', () => {
    const p1 = sequence.find((e) => e.pageId === '01-01-p01')!;
    expect(p1.pageIndexInLesson).toBe(0);
    expect(p1.totalPagesInLesson).toBe(1);
  });

  it('pageIndexInLesson y totalPagesInLesson correctos para sección 2', () => {
    const p1 = sequence.find((e) => e.pageId === '02-01-p01')!;
    const p2 = sequence.find((e) => e.pageId === '02-01-p02')!;
    const p3 = sequence.find((e) => e.pageId === '02-01-p03')!;
    const p4 = sequence.find((e) => e.pageId === '02-01-p04')!;

    expect(p1.pageIndexInLesson).toBe(0);
    expect(p2.pageIndexInLesson).toBe(1);
    expect(p3.pageIndexInLesson).toBe(2);
    expect(p4.pageIndexInLesson).toBe(3);
    expect(p1.totalPagesInLesson).toBe(4);
    expect(p2.totalPagesInLesson).toBe(4);
    expect(p3.totalPagesInLesson).toBe(4);
    expect(p4.totalPagesInLesson).toBe(4);
  });

  it('navegación Anterior/Continuar correcta', () => {
    const primeros = getAdjacentPages(sequence, '01-01-p01');
    expect(primeros.previous).toBeNull();
    expect(primeros.next?.pageId).toBe('02-01-p01');

    const clase = getAdjacentPages(sequence, '02-01-p01');
    expect(clase.previous?.pageId).toBe('01-01-p01');
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

  it('buildPagePath genera URLs correctas para todas las páginas', () => {
    expect(buildPagePath('seccion-01', '01-01', 'que-es-latex')).toBe('/aprender/seccion-01/01-01/que-es-latex/');
    expect(buildPagePath('seccion-02', '02-01', 'clase-del-documento')).toBe('/aprender/seccion-02/02-01/clase-del-documento/');
    expect(buildPagePath('seccion-02', '02-01', 'preambulo')).toBe('/aprender/seccion-02/02-01/preambulo/');
    expect(buildPagePath('seccion-02', '02-01', 'cuerpo-del-documento')).toBe('/aprender/seccion-02/02-01/cuerpo-del-documento/');
    expect(buildPagePath('seccion-02', '02-01', 'documento-minimo')).toBe('/aprender/seccion-02/02-01/documento-minimo/');
  });

  it('slugs son únicos dentro de 02-01', () => {
    const slugs = pages.filter((p) => p.lessonId === '02-01').map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('órdenes son únicos dentro de 02-01', () => {
    const orders = pages.filter((p) => p.lessonId === '02-01').map((p) => p.order);
    expect(new Set(orders).size).toBe(orders.length);
  });
});
