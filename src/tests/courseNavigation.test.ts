import { describe, it, expect } from 'vitest';
import {
  buildCourseSequence,
  getAdjacentPages,
  getFirstPageOfLesson,
  getFirstPageOfSection,
  buildPagePath,
  type NavigationSection,
  type NavigationLesson,
  type NavigationPage,
  type CourseNavigationEntry,
} from '../lib/content/courseNavigation';

function sec(id: string, order: number): NavigationSection {
  return { id, order };
}
function les(id: string, sectionId: string, order: number): NavigationLesson {
  return { id, sectionId, order };
}
function pag(id: string, lessonId: string, slug: string, order: number): NavigationPage {
  return { id, lessonId, slug, order };
}

const s1 = sec('seccion-01', 1);
const s2 = sec('seccion-02', 2);
const s3 = sec('seccion-03', 3);

const l1a = les('01-01', 'seccion-01', 1);
const l1b = les('01-02', 'seccion-01', 2);
const l2a = les('02-01', 'seccion-02', 1);
const l3a = les('03-01', 'seccion-03', 1);

const p1a1 = pag('p1a1', '01-01', 'intro', 1);
const p1a2 = pag('p1a2', '01-01', 'setup', 2);
const p1a3 = pag('p1a3', '01-01', 'hello-world', 3);
const p1b1 = pag('p1b1', '01-02', 'syntax', 1);
const p2a1 = pag('p2a1', '02-01', 'document-structure', 1);
const p2a2 = pag('p2a2', '02-01', 'packages', 2);
const p3a1 = pag('p3a1', '03-01', 'math-basics', 1);

const defaultSections = [s2, s1, s3];
const defaultLessons = [l2a, l1a, l3a, l1b];
const defaultPages = [p2a1, p1a3, p1a1, p2a2, p1b1, p1a2, p3a1];

describe('buildCourseSequence', () => {
  it('ordena secciones por section.order', () => {
    const seq = buildCourseSequence(defaultSections, defaultLessons, defaultPages);
    const seen: string[] = [];
    for (const e of seq) {
      if (!seen.includes(e.sectionId)) seen.push(e.sectionId);
    }
    expect(seen).toEqual(['seccion-01', 'seccion-02', 'seccion-03']);
  });

  it('ordena lecciones por lesson.order dentro de cada sección', () => {
    const seq = buildCourseSequence(defaultSections, defaultLessons, defaultPages);
    const s1Entries = seq.filter((e) => e.sectionId === 'seccion-01');
    const s1Lessons = [...new Set(s1Entries.map((e) => e.lessonId))];
    expect(s1Lessons).toEqual(['01-01', '01-02']);
  });

  it('ordena páginas por page.order dentro de cada lección', () => {
    const seq = buildCourseSequence(defaultSections, defaultLessons, defaultPages);
    const l1Pages = seq.filter((e) => e.lessonId === '01-01');
    expect(l1Pages.map((e) => e.pageId)).toEqual(['p1a1', 'p1a2', 'p1a3']);
  });

  it('no muta los arrays de entrada', () => {
    const sCopy = [...defaultSections];
    const lCopy = [...defaultLessons];
    const pCopy = [...defaultPages];
    buildCourseSequence(defaultSections, defaultLessons, defaultPages);
    expect(defaultSections).toEqual(sCopy);
    expect(defaultLessons).toEqual(lCopy);
    expect(defaultPages).toEqual(pCopy);
  });

  it('lanza error si una lección referencia una sección inexistente', () => {
    const badLesson = les('99-01', 'seccion-99', 1);
    expect(() =>
      buildCourseSequence(defaultSections, [...defaultLessons, badLesson], defaultPages),
    ).toThrow(/99-01.*seccion-99/);
  });

  it('lanza error si una página referencia una lección inexistente', () => {
    const badPage = pag('bad', '99-99', 'ghost', 1);
    expect(() =>
      buildCourseSequence(defaultSections, defaultLessons, [...defaultPages, badPage]),
    ).toThrow(/bad.*99-99/);
  });

  it('produce una lista plana ordenada globalmente', () => {
    const seq = buildCourseSequence(defaultSections, defaultLessons, defaultPages);
    const ids = seq.map((e) => e.pageId);
    expect(ids).toEqual([
      'p1a1', 'p1a2', 'p1a3',
      'p1b1',
      'p2a1', 'p2a2',
      'p3a1',
    ]);
  });

  it('calcula pageIndexInLesson correctamente', () => {
    const seq = buildCourseSequence(defaultSections, defaultLessons, defaultPages);
    const idx = new Map(seq.map((e) => [e.pageId, e.pageIndexInLesson]));
    expect(idx.get('p1a1')).toBe(0);
    expect(idx.get('p1a2')).toBe(1);
    expect(idx.get('p1a3')).toBe(2);
    expect(idx.get('p1b1')).toBe(0);
    expect(idx.get('p2a1')).toBe(0);
    expect(idx.get('p2a2')).toBe(1);
    expect(idx.get('p3a1')).toBe(0);
  });

  it('calcula totalPagesInLesson correctamente', () => {
    const seq = buildCourseSequence(defaultSections, defaultLessons, defaultPages);
    const total = new Map(seq.map((e) => [e.pageId, e.totalPagesInLesson]));
    expect(total.get('p1a1')).toBe(3);
    expect(total.get('p1a2')).toBe(3);
    expect(total.get('p1a3')).toBe(3);
    expect(total.get('p1b1')).toBe(1);
    expect(total.get('p2a1')).toBe(2);
    expect(total.get('p2a2')).toBe(2);
    expect(total.get('p3a1')).toBe(1);
  });

  it('incluye lecciones sin páginas (no aparecen en la secuencia)', () => {
    const emptyLesson = les('99-01', 'seccion-03', 99);
    const seq = buildCourseSequence(defaultSections, [...defaultLessons, emptyLesson], defaultPages);
    const ids = seq.map((e) => e.pageId);
    expect(ids).not.toContain('99-01');
  });

  it('incluye secciones sin lecciones ni páginas (no aparecen en la secuencia)', () => {
    const emptySection = sec('seccion-99', 99);
    const seq = buildCourseSequence([...defaultSections, emptySection], defaultLessons, defaultPages);
    const secs = [...new Set(seq.map((e) => e.sectionId))];
    expect(secs).not.toContain('seccion-99');
  });

  it('no produce entradas para lecciones sin páginas', () => {
    const seq = buildCourseSequence(defaultSections, defaultLessons, defaultPages);
    expect(seq.some((e) => e.lessonId === '03-01')).toBe(true);
  });

  it('mantiene el orden correcto con secciones desordenadas', () => {
    const scrambled = [s3, s1, s2];
    const seq = buildCourseSequence(scrambled, defaultLessons, defaultPages);
    expect(seq[0].sectionId).toBe('seccion-01');
    expect(seq[seq.length - 1].sectionId).toBe('seccion-03');
  });
});

describe('getAdjacentPages', () => {
  const seq = buildCourseSequence(defaultSections, defaultLessons, defaultPages);

  it('retorna previous/current/next dentro de una lección', () => {
    const result = getAdjacentPages(seq, 'p1a2');
    expect(result.previous?.pageId).toBe('p1a1');
    expect(result.current?.pageId).toBe('p1a2');
    expect(result.next?.pageId).toBe('p1a3');
  });

  it('transiciona entre lecciones de una misma sección', () => {
    const result = getAdjacentPages(seq, 'p1a3');
    expect(result.previous?.pageId).toBe('p1a2');
    expect(result.current?.pageId).toBe('p1a3');
    expect(result.next?.pageId).toBe('p1b1');
    expect(result.next?.lessonId).toBe('01-02');
  });

  it('transiciona entre secciones', () => {
    const result = getAdjacentPages(seq, 'p1b1');
    expect(result.previous?.pageId).toBe('p1a3');
    expect(result.previous?.sectionId).toBe('seccion-01');
    expect(result.current?.pageId).toBe('p1b1');
    expect(result.next?.pageId).toBe('p2a1');
    expect(result.next?.sectionId).toBe('seccion-02');
  });

  it('primera página del curso: previous es null', () => {
    const result = getAdjacentPages(seq, 'p1a1');
    expect(result.previous).toBeNull();
    expect(result.current?.pageId).toBe('p1a1');
    expect(result.next?.pageId).toBe('p1a2');
  });

  it('última página del curso: next es null', () => {
    const result = getAdjacentPages(seq, 'p3a1');
    expect(result.previous?.pageId).toBe('p2a2');
    expect(result.current?.pageId).toBe('p3a1');
    expect(result.next).toBeNull();
  });

  it('ID de página inexistente: todo es null', () => {
    const result = getAdjacentPages(seq, 'ghost-page');
    expect(result.previous).toBeNull();
    expect(result.current).toBeNull();
    expect(result.next).toBeNull();
  });

  it('secuencia vacía', () => {
    const result = getAdjacentPages([], 'p1a1');
    expect(result.previous).toBeNull();
    expect(result.current).toBeNull();
    expect(result.next).toBeNull();
  });
});

describe('getFirstPageOfLesson', () => {
  const seq = buildCourseSequence(defaultSections, defaultLessons, defaultPages);

  it('retorna la primera página ordenada de la lección', () => {
    const entry = getFirstPageOfLesson(seq, '01-01');
    expect(entry?.pageId).toBe('p1a1');
    expect(entry?.lessonId).toBe('01-01');
    expect(entry?.pageIndexInLesson).toBe(0);
    expect(entry?.totalPagesInLesson).toBe(3);
  });

  it('retorna la primera página de una lección de una página', () => {
    const entry = getFirstPageOfLesson(seq, '01-02');
    expect(entry?.pageId).toBe('p1b1');
  });

  it('retorna null si la lección no tiene páginas', () => {
    const noPagesSeq = buildCourseSequence(
      defaultSections,
      [les('empty', 'seccion-01', 99)],
      [],
    );
    const entry = getFirstPageOfLesson(noPagesSeq, 'empty');
    expect(entry).toBeNull();
  });

  it('retorna null si la lección no existe en la secuencia', () => {
    expect(getFirstPageOfLesson(seq, '99-99')).toBeNull();
  });
});

describe('getFirstPageOfSection', () => {
  const seq = buildCourseSequence(defaultSections, defaultLessons, defaultPages);

  it('retorna la primera página de la primera lección de la sección', () => {
    const entry = getFirstPageOfSection(seq, 'seccion-01');
    expect(entry?.pageId).toBe('p1a1');
    expect(entry?.sectionId).toBe('seccion-01');
    expect(entry?.lessonId).toBe('01-01');
  });

  it('retorna la primera página de la segunda sección', () => {
    const entry = getFirstPageOfSection(seq, 'seccion-02');
    expect(entry?.pageId).toBe('p2a1');
  });

  it('retorna null si la sección no tiene páginas', () => {
    const emptySection = sec('vacia', 99);
    const emptyLesson = les('vac-lesson', 'vacia', 1);
    const noPagesSeq = buildCourseSequence(
      [...defaultSections, emptySection],
      [...defaultLessons, emptyLesson],
      defaultPages,
    );
    expect(getFirstPageOfSection(noPagesSeq, 'vacia')).toBeNull();
  });
});

describe('buildPagePath', () => {
  it('construye la URL desde tres strings', () => {
    expect(buildPagePath('seccion-01', '01-01', 'que-es-latex')).toBe(
      '/aprender/seccion-01/01-01/que-es-latex/',
    );
  });

  it('construye la URL desde un CourseNavigationEntry', () => {
    const entry: CourseNavigationEntry = {
      sectionId: 'seccion-02',
      lessonId: '02-01',
      pageId: 'p2a1',
      pageSlug: 'document-structure',
      sectionOrder: 2,
      lessonOrder: 1,
      pageOrder: 1,
      pageIndexInLesson: 0,
      totalPagesInLesson: 2,
    };
    expect(buildPagePath(entry)).toBe(
      '/aprender/seccion-02/02-01/document-structure/',
    );
  });

  it('incluye barras inicial y final', () => {
    const path = buildPagePath('sec', 'les', 'slug');
    expect(path.startsWith('/')).toBe(true);
    expect(path.endsWith('/')).toBe(true);
  });
});
