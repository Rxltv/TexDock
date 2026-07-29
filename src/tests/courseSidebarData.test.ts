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

  it('sección con páginas tiene href visible', () => {
    const data = buildSidebarData(sections, lessons, pages, null, null);
    const s1 = data.sections.find((s) => s.id === 's1')!;
    expect(s1.href).toMatch(/^\/aprender\//);
    expect(s1.hasVisiblePages).toBe(true);
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

  describe('CourseLayout call pattern (caller pre-filters by visibility)', () => {
    const allLessons = [
      { id: '01-01', sectionId: 'seccion-01', order: 1, title: '¿Qué es LaTeX?' },
      { id: '01-02', sectionId: 'seccion-01', order: 2, title: 'El flujo de trabajo' },
      { id: '01-03', sectionId: 'seccion-01', order: 3, title: 'Clases de documento' },
      { id: '02-01', sectionId: 'seccion-02', order: 1, title: 'Preámbulo y cuerpo' },
      { id: '02-02', sectionId: 'seccion-02', order: 2, title: 'Anatomía de un comando' },
      { id: '02-03', sectionId: 'seccion-02', order: 3, title: 'Entornos' },
      { id: '02-04', sectionId: 'seccion-02', order: 4, title: 'Espacios, saltos y párrafos' },
      { id: '03-01', sectionId: 'seccion-03', order: 1, title: 'Qué es un paquete' },
      { id: '03-02', sectionId: 'seccion-03', order: 2, title: 'Codificación de salida' },
      { id: '03-03', sectionId: 'seccion-03', order: 3, title: 'Entrada UTF-8' },
      { id: '03-04', sectionId: 'seccion-03', order: 4, title: 'Idioma del documento' },
      { id: '03-05', sectionId: 'seccion-03', order: 5, title: 'Plantilla base' },
      { id: '04-01', sectionId: 'seccion-04', order: 1, title: 'Título' },
      { id: '04-02', sectionId: 'seccion-04', order: 2, title: 'Autor y fecha' },
      { id: '04-03', sectionId: 'seccion-04', order: 3, title: 'Mostrar los datos' },
      { id: '04-04', sectionId: 'seccion-04', order: 4, title: 'Resumen' },
      { id: '04-05', sectionId: 'seccion-04', order: 5, title: 'Mini proyecto' },
    ];
    const allPages = [
      { id: '01-01-p01', lessonId: '01-01', slug: 'la-idea-principal', order: 1 },
      { id: '01-01-p02', lessonId: '01-01', slug: 'latex-vs-procesador-visual', order: 2 },
      { id: '01-01-p03', lessonId: '01-01', slug: 'ventajas-academicas', order: 3 },
      { id: '01-01-p04', lessonId: '01-01', slug: 'cuando-es-util', order: 4 },
      { id: '01-02-p01', lessonId: '01-02', slug: 'archivo-fuente-compilacion', order: 1 },
      { id: '01-02-p02', lessonId: '01-02', slug: 'compilar-no-es-terminar', order: 2 },
      { id: '01-02-p03', lessonId: '01-02', slug: 'errores-del-proceso', order: 3 },
      { id: '01-03-p01', lessonId: '01-03', slug: 'que-decide-una-clase', order: 1 },
      { id: '01-03-p02', lessonId: '01-03', slug: 'clase-article', order: 2 },
      { id: '01-03-p03', lessonId: '01-03', slug: 'clases-report-y-book', order: 3 },
      { id: '01-03-p04', lessonId: '01-03', slug: 'clase-beamer', order: 4 },
      { id: '01-03-p05', lessonId: '01-03', slug: 'elegir-una-clase', order: 5 },
      { id: '01-03-p06', lessonId: '01-03', slug: 'reto-de-decision', order: 6 },
      { id: '02-01-p01', lessonId: '02-01', slug: 'el-preambulo', order: 1 },
      { id: '02-01-p02', lessonId: '02-01', slug: 'el-cuerpo', order: 2 },
      { id: '02-01-p03', lessonId: '02-01', slug: 'clasificar-lineas', order: 3 },
      { id: '02-02-p01', lessonId: '02-02', slug: 'nombre-y-argumento', order: 1 },
      { id: '02-02-p02', lessonId: '02-02', slug: 'opciones-entre-corchetes', order: 2 },
      { id: '02-02-p03', lessonId: '02-02', slug: 'modificar-una-opcion', order: 3 },
      { id: '02-02-p04', lessonId: '02-02', slug: 'identificar-partes-de-un-comando', order: 4 },
      { id: '02-03-p01', lessonId: '02-03', slug: 'abrir-y-cerrar-un-entorno', order: 1 },
      { id: '02-03-p02', lessonId: '02-03', slug: 'error-por-cierre-incorrecto', order: 2 },
      { id: '02-03-p03', lessonId: '02-03', slug: 'buscar-una-pareja-faltante', order: 3 },
      { id: '02-04-p01', lessonId: '02-04', slug: 'espacios-consecutivos', order: 1 },
      { id: '02-04-p02', lessonId: '02-04', slug: 'un-salto-de-linea-no-crea-un-parrafo', order: 2 },
      { id: '02-04-p03', lessonId: '02-04', slug: 'una-linea-vacia-separa-parrafos', order: 3 },
      { id: '02-04-p04', lessonId: '02-04', slug: 'construir-tres-parrafos', order: 4 },
      { id: '02-04-p05', lessonId: '02-04', slug: 'reto-de-correccion', order: 5 },
      { id: '03-01-p01', lessonId: '03-01', slug: 'extender-la-clase', order: 1 },
      { id: '03-01-p02', lessonId: '03-01', slug: 'ubicacion-correcta', order: 2 },
      { id: '03-01-p03', lessonId: '03-01', slug: 'corregir-un-paquete-mal-colocado', order: 3 },
      { id: '03-02-p01', lessonId: '03-02', slug: 'fuentes-t1', order: 1 },
      { id: '03-02-p02', lessonId: '03-02', slug: 'anadir-fontenc', order: 2 },
      { id: '03-03-p01', lessonId: '03-03', slug: 'interpretar-los-caracteres-escritos', order: 1 },
      { id: '03-03-p02', lessonId: '03-03', slug: 'probar-tildes-y-la-letra-enie', order: 2 },
      { id: '03-04-p01', lessonId: '03-04', slug: 'configurar-el-espanol', order: 1 },
      { id: '03-04-p02', lessonId: '03-04', slug: 'anadir-babel', order: 2 },
      { id: '03-04-p03', lessonId: '03-04', slug: 'funciones-de-cada-paquete', order: 3 },
      { id: '03-05-p01', lessonId: '03-05', slug: 'construccion-acumulativa', order: 1 },
      { id: '03-05-p02', lessonId: '03-05', slug: 'completar-lineas-faltantes', order: 2 },
      { id: '03-05-p03', lessonId: '03-05', slug: 'reto-de-plantilla', order: 3 },
      { id: '04-01-p01', lessonId: '04-01', slug: 'declarar-el-titulo', order: 1 },
      { id: '04-01-p02', lessonId: '04-01', slug: 'anadir-un-titulo-propio', order: 2 },
      { id: '04-02-p01', lessonId: '04-02', slug: 'declarar-autor-y-fecha', order: 1 },
      { id: '04-02-p02', lessonId: '04-02', slug: 'completar-los-datos', order: 2 },
      { id: '04-02-p03', lessonId: '04-02', slug: 'fecha-automatica-o-fija', order: 3 },
      { id: '04-03-p01', lessonId: '04-03', slug: 'imprimir-el-encabezado', order: 1 },
      { id: '04-03-p02', lessonId: '04-03', slug: 'generar-el-titulo-visual', order: 2 },
      { id: '04-03-p03', lessonId: '04-03', slug: 'corregir-maketitle', order: 3 },
      { id: '04-04-p01', lessonId: '04-04', slug: 'funcion-del-resumen', order: 1 },
      { id: '04-04-p02', lessonId: '04-04', slug: 'anadir-un-resumen', order: 2 },
      { id: '04-04-p03', lessonId: '04-04', slug: 'mejorar-un-resumen', order: 3 },
      { id: '04-05-p01', lessonId: '04-05', slug: 'construir-el-bloque-inicial', order: 1 },
      { id: '04-05-p02', lessonId: '04-05', slug: 'corregir-datos-mal-ubicados', order: 2 },
    ];
    const courseLayoutSections = [
      { id: 'seccion-01', title: 'Introducción a LaTeX', order: 1 },
      { id: 'seccion-02', title: 'Estructura mínima de un documento', order: 2 },
      { id: 'seccion-03', title: 'Paquetes', order: 3 },
      { id: 'seccion-04', title: 'Datos y resumen', order: 4 },
    ];

    it('sección 1 tiene 3 subsecciones visibles en la sidebar', () => {
      const data = buildSidebarData(courseLayoutSections, allLessons, allPages, null, null);
      const s1Lessons = data.lessonsBySection['seccion-01'];
      expect(s1Lessons).toHaveLength(3);
      expect(s1Lessons[0].title).toBe('¿Qué es LaTeX?');
      expect(s1Lessons[1].title).toBe('El flujo de trabajo');
      expect(s1Lessons[2].title).toBe('Clases de documento');
    });

    it('ninguna página interna aparece como subsección en la sidebar', () => {
      const data = buildSidebarData(courseLayoutSections, allLessons, allPages, null, null);
      for (const sectionId of Object.keys(data.lessonsBySection)) {
        for (const lesson of data.lessonsBySection[sectionId]) {
          expect(lesson.id).not.toMatch(/p\d{2}$/);
        }
      }
    });

    it('subsección actual marcada correctamente', () => {
      const data = buildSidebarData(courseLayoutSections, allLessons, allPages, 'seccion-01', '01-02');
      expect(data.currentSectionId).toBe('seccion-01');
      expect(data.currentLessonId).toBe('01-02');
    });

    it('sección actual abierta inicialmente (currentSectionId seteado)', () => {
      const data = buildSidebarData(courseLayoutSections, allLessons, allPages, 'seccion-01', '01-01');
      expect(data.currentSectionId).toBe('seccion-01');
      expect(data.currentLessonId).toBe('01-01');
    });

    it('href de cada subsección apunta a su primera página', () => {
      const data = buildSidebarData(courseLayoutSections, allLessons, allPages, null, null);
      const s1 = data.lessonsBySection['seccion-01'];
      expect(s1[0].href).toContain('la-idea-principal');
      expect(s1[1].href).toContain('archivo-fuente-compilacion');
      expect(s1[2].href).toContain('que-decide-una-clase');
    });

    it('secciones 1, 2, 3, 4 tienen href cuando hay páginas visibles', () => {
      const data = buildSidebarData(courseLayoutSections, allLessons, allPages, 'seccion-01', '01-01');
      for (const section of data.sections) {
        expect(section.href).toBeTruthy();
        expect(section.hasVisiblePages).toBe(true);
      }
    });

    it('sección 3 tiene lecciones con href', () => {
      const data = buildSidebarData(courseLayoutSections, allLessons, allPages, null, null);
      const s3Lessons = data.lessonsBySection['seccion-03'];
      expect(s3Lessons).toHaveLength(5);
      expect(s3Lessons[0].title).toBe('Qué es un paquete');
      expect(s3Lessons[0].href).toContain('extender-la-clase');
      expect(s3Lessons[4].title).toBe('Plantilla base');
      expect(s3Lessons[4].href).toContain('construccion-acumulativa');
    });

    it('sección 4 tiene lecciones con href', () => {
      const data = buildSidebarData(courseLayoutSections, allLessons, allPages, null, null);
      const s4Lessons = data.lessonsBySection['seccion-04'];
      expect(s4Lessons).toHaveLength(5);
      expect(s4Lessons[0].title).toBe('Título');
      expect(s4Lessons[0].href).toContain('declarar-el-titulo');
      expect(s4Lessons[4].title).toBe('Mini proyecto');
      expect(s4Lessons[4].href).toContain('construir-el-bloque-inicial');
    });

    it('href de sección-01 apunta a primera página de primera subsección', () => {
      const data = buildSidebarData(courseLayoutSections, allLessons, allPages, null, null);
      const s1 = data.sections.find((s) => s.id === 'seccion-01')!;
      expect(s1.href).toContain('la-idea-principal');
    });

    it('href de sección-02 apunta a el-preambulo', () => {
      const data = buildSidebarData(courseLayoutSections, allLessons, allPages, null, null);
      const s2 = data.sections.find((s) => s.id === 'seccion-02')!;
      expect(s2.href).toContain('el-preambulo');
    });

    it('href de sección-03 apunta a extender-la-clase', () => {
      const data = buildSidebarData(courseLayoutSections, allLessons, allPages, null, null);
      const s3 = data.sections.find((s) => s.id === 'seccion-03')!;
      expect(s3.href).toContain('extender-la-clase');
    });

    it('href de sección-04 apunta a declarar-el-titulo', () => {
      const data = buildSidebarData(courseLayoutSections, allLessons, allPages, null, null);
      const s4 = data.sections.find((s) => s.id === 'seccion-04')!;
      expect(s4.href).toContain('declarar-el-titulo');
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
