import { describe, it, expect } from 'vitest';
import { buildSidebarData } from '../lib/content/courseSidebarData';

describe('buildSidebarData', () => {
  const sections = [
    { id: 's1', title: 'Section 1', order: 1 },
    { id: 's2', title: 'Section 2', order: 2 },
  ];
  const lessons = [
    { id: 'l1', sectionId: 's1', order: 1, title: 'Lesson 1' },
    { id: 'l2', sectionId: 's1', order: 2, title: 'Lesson 2' },
    { id: 'l3', sectionId: 's2', order: 1, title: 'Lesson 3' },
  ];
  const pages = [
    { id: 'p1', lessonId: 'l1', slug: 'intro', order: 1 },
    { id: 'p2', lessonId: 'l1', slug: 'advanced', order: 2 },
    { id: 'p3', lessonId: 'l2', slug: 'syntax', order: 1 },
    { id: 'p4', lessonId: 'l3', slug: 'conclusion', order: 1 },
  ];

  it('href apunta a la primera página visible con /aprender/', () => {
    const data = buildSidebarData(sections, lessons, pages, null, null);
    const s1Lessons = data.lessonsBySection['s1'];
    expect(s1Lessons[0].href).toMatch(/^\/aprender\//);
    expect(s1Lessons[0].href).toContain('intro');
    expect(s1Lessons[1].href).toContain('syntax');
  });

  it('no existe href hacia una ruta temporal de lección', () => {
    const data = buildSidebarData(sections, lessons, pages, null, null);
    for (const section of sections) {
      for (const lesson of data.lessonsBySection[section.id]) {
        if (lesson.href) {
          expect(lesson.href).toMatch(/\/aprender\/[^/]+\/[^/]+\/[^/]+\/$/);
          expect(lesson.href.match(/\//g)).toHaveLength(5);
        }
      }
    }
  });

  it('lecciones sin páginas tienen href null', () => {
    const emptyLessons = [
      { id: 'empty', sectionId: 's1', order: 99, title: 'Empty' },
    ];
    const data = buildSidebarData(sections, [...lessons, ...emptyLessons], pages, null, null);
    const empty = data.lessonsBySection['s1'].find((l) => l.id === 'empty');
    expect(empty?.href).toBeNull();
  });

  it('sección activa correcta', () => {
    const data = buildSidebarData(sections, lessons, pages, 's2', null);
    expect(data.currentSectionId).toBe('s2');
  });

  it('lección activa correcta', () => {
    const data = buildSidebarData(sections, lessons, pages, 's1', 'l2');
    expect(data.currentLessonId).toBe('l2');
  });

  it('lección activa puede ser null', () => {
    const data = buildSidebarData(sections, lessons, pages, null, null);
    expect(data.currentLessonId).toBeNull();
  });

  it('orden de secciones según order', () => {
    const reversed = [...sections].reverse();
    const data = buildSidebarData(reversed, lessons, pages, null, null);
    expect(data.sections[0].id).toBe('s1');
    expect(data.sections[1].id).toBe('s2');
  });

  it('orden de lecciones según order dentro de cada sección', () => {
    const data = buildSidebarData(sections, lessons, pages, null, null);
    const s1Ids = data.lessonsBySection['s1'].map((l) => l.id);
    expect(s1Ids).toEqual(['l1', 'l2']);
  });

  it('no muta los arrays de entrada', () => {
    const sCopy = [...sections];
    const lCopy = [...lessons];
    const pCopy = [...pages];
    buildSidebarData(sections, lessons, pages, null, null);
    expect(sections).toEqual(sCopy);
    expect(lessons).toEqual(lCopy);
    expect(pages).toEqual(pCopy);
  });

  it('incluye título de lección', () => {
    const data = buildSidebarData(sections, lessons, pages, null, null);
    expect(data.lessonsBySection['s1'][0].title).toBe('Lesson 1');
  });

  it('sección con páginas tiene href', () => {
    const data = buildSidebarData(sections, lessons, pages, null, null);
    expect(data.sections[0].href).toMatch(/^\/aprender\//);
    expect(data.sections[0].hasVisiblePages).toBe(true);
  });

  it('sección sin páginas tiene href null', () => {
    const emptySection = { id: 's3', title: 'Empty', order: 3 };
    const data = buildSidebarData([...sections, emptySection], lessons, pages, null, null);
    const s3 = data.sections.find((s) => s.id === 's3');
    expect(s3?.href).toBeNull();
    expect(s3?.hasVisiblePages).toBe(false);
  });

  it('sección sin páginas no tiene aria-current', () => {
    const emptySection = { id: 's3', title: 'Empty', order: 3 };
    const data = buildSidebarData([...sections, emptySection], lessons, pages, null, null);
    const s3 = data.sections.find((s) => s.id === 's3');
    expect(s3?.href).toBeNull();
  });

  it('href de sección apunta a primera página con /aprender/', () => {
    const data = buildSidebarData(sections, lessons, pages, null, null);
    expect(data.sections[0].href).toMatch(/\/aprender\/[^/]+\/[^/]+\/[^/]+\/$/);
  });

  describe('CourseLayout call pattern (caller pre-filters by visibility)', () => {
    const allLessons = [
      { id: '01-01', sectionId: 'seccion-01', order: 1, title: '¿Qué es LaTeX?' },
      { id: '02-01', sectionId: 'seccion-02', order: 1, title: 'Documento mínimo' },
    ];
    const allPages = [
      { id: '01-01-p01', lessonId: '01-01', slug: 'que-es-latex', order: 1 },
      { id: '02-01-p01', lessonId: '02-01', slug: 'clase-del-documento', order: 1 },
      { id: '02-01-p02', lessonId: '02-01', slug: 'preambulo', order: 2 },
      { id: '02-01-p03', lessonId: '02-01', slug: 'cuerpo-del-documento', order: 3 },
      { id: '02-01-p04', lessonId: '02-01', slug: 'documento-minimo', order: 4 },
    ];
    const courseLayoutSections = [
      { id: 'seccion-01', title: 'Introducción a LaTeX', order: 1 },
      { id: 'seccion-02', title: 'Estructura mínima de un documento', order: 2 },
      { id: 'seccion-03', title: 'Introducción a los paquetes', order: 3 },
    ];

    it('sección 1 y 2 tienen href cuando hay páginas visibles', () => {
      const data = buildSidebarData(courseLayoutSections, allLessons, allPages, 'seccion-02', '02-01');
      const s1 = data.sections.find((s) => s.id === 'seccion-01')!;
      const s2 = data.sections.find((s) => s.id === 'seccion-02')!;
      const s3 = data.sections.find((s) => s.id === 'seccion-03')!;
      expect(s1.href).toBeTruthy();
      expect(s2.href).toBeTruthy();
      expect(s3.href).toBeNull();
    });

    it('secciones 1 y 2 tienen hasVisiblePages=true', () => {
      const data = buildSidebarData(courseLayoutSections, allLessons, allPages, null, null);
      const s1 = data.sections.find((s) => s.id === 'seccion-01')!;
      const s2 = data.sections.find((s) => s.id === 'seccion-02')!;
      const s3 = data.sections.find((s) => s.id === 'seccion-03')!;
      expect(s1.hasVisiblePages).toBe(true);
      expect(s2.hasVisiblePages).toBe(true);
      expect(s3.hasVisiblePages).toBe(false);
    });

    it('sección-03 sin lecciones ni páginas tiene href null', () => {
      const data = buildSidebarData(courseLayoutSections, allLessons, allPages, null, null);
      const s3 = data.sections.find((s) => s.id === 'seccion-03')!;
      expect(s3.href).toBeNull();
      expect(s3.hasVisiblePages).toBe(false);
    });

    it('href de sección-01 apunta a que-es-latex', () => {
      const data = buildSidebarData(courseLayoutSections, allLessons, allPages, null, null);
      const s1 = data.sections.find((s) => s.id === 'seccion-01')!;
      expect(s1.href).toContain('que-es-latex');
    });

    it('href de sección-02 apunta a clase-del-documento', () => {
      const data = buildSidebarData(courseLayoutSections, allLessons, allPages, null, null);
      const s2 = data.sections.find((s) => s.id === 'seccion-02')!;
      expect(s2.href).toContain('clase-del-documento');
    });

    it('buildSidebarData rechaza lección sin sección existente', () => {
      const badLessons = [
        ...allLessons,
        { id: 'ghost', sectionId: 'seccion-99', order: 1, title: 'Ghost' },
      ];
      expect(() =>
        buildSidebarData(courseLayoutSections, badLessons, allPages, null, null),
      ).toThrow();
    });
  });
});
