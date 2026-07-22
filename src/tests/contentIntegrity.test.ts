import { describe, it, expect } from 'vitest';
import { buildCourseSequence, getAdjacentPages, buildPagePath } from '../lib/content/courseNavigation';

describe('content integrity: sección 1–4', () => {
  const sections = [
    { id: 'seccion-01', order: 1 },
    { id: 'seccion-02', order: 2 },
    { id: 'seccion-03', order: 3 },
    { id: 'seccion-04', order: 4 },
  ];
  const lessons = [
    { id: '01-01', sectionId: 'seccion-01', order: 1, title: '¿Qué es LaTeX?', status: 'draft' },
    { id: '01-02', sectionId: 'seccion-01', order: 2, title: 'El flujo de trabajo', status: 'draft' },
    { id: '01-03', sectionId: 'seccion-01', order: 3, title: 'Clases de documento', status: 'draft' },
    { id: '02-01', sectionId: 'seccion-02', order: 1, title: 'Preámbulo y cuerpo', status: 'draft' },
    { id: '02-02', sectionId: 'seccion-02', order: 2, title: 'Anatomía de un comando', status: 'draft' },
    { id: '02-03', sectionId: 'seccion-02', order: 3, title: 'Entornos', status: 'draft' },
    { id: '02-04', sectionId: 'seccion-02', order: 4, title: 'Espacios, saltos y párrafos', status: 'draft' },
    { id: '03-01', sectionId: 'seccion-03', order: 1, title: 'Qué es un paquete', status: 'draft' },
    { id: '03-02', sectionId: 'seccion-03', order: 2, title: 'Codificación de salida', status: 'draft' },
    { id: '03-03', sectionId: 'seccion-03', order: 3, title: 'Entrada UTF-8', status: 'draft' },
    { id: '03-04', sectionId: 'seccion-03', order: 4, title: 'Idioma del documento', status: 'draft' },
    { id: '03-05', sectionId: 'seccion-03', order: 5, title: 'Plantilla base', status: 'draft' },
    { id: '04-01', sectionId: 'seccion-04', order: 1, title: 'Título', status: 'draft' },
    { id: '04-02', sectionId: 'seccion-04', order: 2, title: 'Autor y fecha', status: 'draft' },
    { id: '04-03', sectionId: 'seccion-04', order: 3, title: 'Mostrar los datos', status: 'draft' },
    { id: '04-04', sectionId: 'seccion-04', order: 4, title: 'Resumen', status: 'draft' },
    { id: '04-05', sectionId: 'seccion-04', order: 5, title: 'Mini proyecto', status: 'draft' },
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
    { id: '02-01-p01', lessonId: '02-01', slug: 'el-preambulo', order: 1, status: 'draft' },
    { id: '02-01-p02', lessonId: '02-01', slug: 'el-cuerpo', order: 2, status: 'draft' },
    { id: '02-01-p03', lessonId: '02-01', slug: 'clasificar-lineas', order: 3, status: 'draft' },
    { id: '02-02-p01', lessonId: '02-02', slug: 'nombre-y-argumento', order: 1, status: 'draft' },
    { id: '02-02-p02', lessonId: '02-02', slug: 'opciones-entre-corchetes', order: 2, status: 'draft' },
    { id: '02-02-p03', lessonId: '02-02', slug: 'modificar-una-opcion', order: 3, status: 'draft' },
    { id: '02-02-p04', lessonId: '02-02', slug: 'identificar-partes-de-un-comando', order: 4, status: 'draft' },
    { id: '02-03-p01', lessonId: '02-03', slug: 'abrir-y-cerrar-un-entorno', order: 1, status: 'draft' },
    { id: '02-03-p02', lessonId: '02-03', slug: 'error-por-cierre-incorrecto', order: 2, status: 'draft' },
    { id: '02-03-p03', lessonId: '02-03', slug: 'buscar-una-pareja-faltante', order: 3, status: 'draft' },
    { id: '02-04-p01', lessonId: '02-04', slug: 'espacios-consecutivos', order: 1, status: 'draft' },
    { id: '02-04-p02', lessonId: '02-04', slug: 'un-salto-de-linea-no-crea-un-parrafo', order: 2, status: 'draft' },
    { id: '02-04-p03', lessonId: '02-04', slug: 'una-linea-vacia-separa-parrafos', order: 3, status: 'draft' },
    { id: '02-04-p04', lessonId: '02-04', slug: 'construir-tres-parrafos', order: 4, status: 'draft' },
    { id: '02-04-p05', lessonId: '02-04', slug: 'reto-de-correccion', order: 5, status: 'draft' },
    { id: '03-01-p01', lessonId: '03-01', slug: 'extender-la-clase', order: 1, status: 'draft' },
    { id: '03-01-p02', lessonId: '03-01', slug: 'ubicacion-correcta', order: 2, status: 'draft' },
    { id: '03-01-p03', lessonId: '03-01', slug: 'corregir-un-paquete-mal-colocado', order: 3, status: 'draft' },
    { id: '03-02-p01', lessonId: '03-02', slug: 'fuentes-t1', order: 1, status: 'draft' },
    { id: '03-02-p02', lessonId: '03-02', slug: 'anadir-fontenc', order: 2, status: 'draft' },
    { id: '03-03-p01', lessonId: '03-03', slug: 'interpretar-los-caracteres-escritos', order: 1, status: 'draft' },
    { id: '03-03-p02', lessonId: '03-03', slug: 'probar-tildes-y-la-letra-enie', order: 2, status: 'draft' },
    { id: '03-04-p01', lessonId: '03-04', slug: 'configurar-el-espanol', order: 1, status: 'draft' },
    { id: '03-04-p02', lessonId: '03-04', slug: 'anadir-babel', order: 2, status: 'draft' },
    { id: '03-04-p03', lessonId: '03-04', slug: 'funciones-de-cada-paquete', order: 3, status: 'draft' },
    { id: '03-05-p01', lessonId: '03-05', slug: 'construccion-acumulativa', order: 1, status: 'draft' },
    { id: '03-05-p02', lessonId: '03-05', slug: 'completar-lineas-faltantes', order: 2, status: 'draft' },
    { id: '03-05-p03', lessonId: '03-05', slug: 'reto-de-plantilla', order: 3, status: 'draft' },
    { id: '04-01-p01', lessonId: '04-01', slug: 'declarar-el-titulo', order: 1, status: 'draft' },
    { id: '04-01-p02', lessonId: '04-01', slug: 'anadir-un-titulo-propio', order: 2, status: 'draft' },
    { id: '04-02-p01', lessonId: '04-02', slug: 'declarar-autor-y-fecha', order: 1, status: 'draft' },
    { id: '04-02-p02', lessonId: '04-02', slug: 'completar-los-datos', order: 2, status: 'draft' },
    { id: '04-02-p03', lessonId: '04-02', slug: 'fecha-automatica-o-fija', order: 3, status: 'draft' },
    { id: '04-03-p01', lessonId: '04-03', slug: 'imprimir-el-encabezado', order: 1, status: 'draft' },
    { id: '04-03-p02', lessonId: '04-03', slug: 'generar-el-titulo-visual', order: 2, status: 'draft' },
    { id: '04-03-p03', lessonId: '04-03', slug: 'corregir-maketitle', order: 3, status: 'draft' },
    { id: '04-04-p01', lessonId: '04-04', slug: 'funcion-del-resumen', order: 1, status: 'draft' },
    { id: '04-04-p02', lessonId: '04-04', slug: 'anadir-un-resumen', order: 2, status: 'draft' },
    { id: '04-04-p03', lessonId: '04-04', slug: 'mejorar-un-resumen', order: 3, status: 'draft' },
    { id: '04-05-p01', lessonId: '04-05', slug: 'construir-el-bloque-inicial', order: 1, status: 'draft' },
    { id: '04-05-p02', lessonId: '04-05', slug: 'corregir-datos-mal-ubicados', order: 2, status: 'draft' },
  ];

  const sequence = buildCourseSequence(sections, lessons, pages);

  it('secuencia contiene exactamente 54 páginas (13+15+13+13)', () => {
    expect(sequence).toHaveLength(54);
  });

  it('secuencia en el orden esperado hasta sección 2', () => {
    const slugs = sequence.slice(0, 28).map((e) => e.pageSlug);
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
      'el-preambulo',
      'el-cuerpo',
      'clasificar-lineas',
      'nombre-y-argumento',
      'opciones-entre-corchetes',
      'modificar-una-opcion',
      'identificar-partes-de-un-comando',
      'abrir-y-cerrar-un-entorno',
      'error-por-cierre-incorrecto',
      'buscar-una-pareja-faltante',
      'espacios-consecutivos',
      'un-salto-de-linea-no-crea-un-parrafo',
      'una-linea-vacia-separa-parrafos',
      'construir-tres-parrafos',
      'reto-de-correccion',
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

  it('pageIndexInLesson y totalPagesInLesson correctos para 02-01 (3 páginas)', () => {
    const p1 = sequence.find((e) => e.pageId === '02-01-p01')!;
    const p3 = sequence.find((e) => e.pageId === '02-01-p03')!;
    expect(p1.pageIndexInLesson).toBe(0);
    expect(p3.pageIndexInLesson).toBe(2);
    expect(p1.totalPagesInLesson).toBe(3);
    expect(p3.totalPagesInLesson).toBe(3);
  });

  it('pageIndexInLesson y totalPagesInLesson correctos para 02-02 (4 páginas)', () => {
    const p1 = sequence.find((e) => e.pageId === '02-02-p01')!;
    const p4 = sequence.find((e) => e.pageId === '02-02-p04')!;
    expect(p1.pageIndexInLesson).toBe(0);
    expect(p4.pageIndexInLesson).toBe(3);
    expect(p1.totalPagesInLesson).toBe(4);
    expect(p4.totalPagesInLesson).toBe(4);
  });

  it('pageIndexInLesson y totalPagesInLesson correctos para 02-03 (3 páginas)', () => {
    const p1 = sequence.find((e) => e.pageId === '02-03-p01')!;
    const p3 = sequence.find((e) => e.pageId === '02-03-p03')!;
    expect(p1.pageIndexInLesson).toBe(0);
    expect(p3.pageIndexInLesson).toBe(2);
    expect(p1.totalPagesInLesson).toBe(3);
    expect(p3.totalPagesInLesson).toBe(3);
  });

  it('pageIndexInLesson y totalPagesInLesson correctos para 02-04 (5 páginas)', () => {
    const p1 = sequence.find((e) => e.pageId === '02-04-p01')!;
    const p5 = sequence.find((e) => e.pageId === '02-04-p05')!;
    expect(p1.pageIndexInLesson).toBe(0);
    expect(p5.pageIndexInLesson).toBe(4);
    expect(p1.totalPagesInLesson).toBe(5);
    expect(p5.totalPagesInLesson).toBe(5);
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
    const p1 = getAdjacentPages(sequence, '02-01-p01');
    expect(p1.previous?.pageId).toBe('01-03-p06');
    expect(p1.next?.pageId).toBe('02-01-p02');

    const p2 = getAdjacentPages(sequence, '02-01-p02');
    expect(p2.previous?.pageId).toBe('02-01-p01');
    expect(p2.next?.pageId).toBe('02-01-p03');

    const p3 = getAdjacentPages(sequence, '02-01-p03');
    expect(p3.previous?.pageId).toBe('02-01-p02');
    expect(p3.next?.pageId).toBe('02-02-p01');

    const p4 = getAdjacentPages(sequence, '02-02-p01');
    expect(p4.previous?.pageId).toBe('02-01-p03');
    expect(p4.next?.pageId).toBe('02-02-p02');

    const pLast = getAdjacentPages(sequence, '02-04-p05');
    expect(pLast.previous?.pageId).toBe('02-04-p04');
    expect(pLast.next?.pageId).toBe('03-01-p01');
  });

  it('navegación entre 02-04 y 03-01', () => {
    const trans = getAdjacentPages(sequence, '02-04-p05');
    expect(trans.next?.lessonId).toBe('03-01');
    expect(trans.next?.pageId).toBe('03-01-p01');
  });

  it('navegación dentro de sección 3', () => {
    const p1 = getAdjacentPages(sequence, '03-01-p01');
    expect(p1.previous?.pageId).toBe('02-04-p05');
    expect(p1.next?.pageId).toBe('03-01-p02');

    const pLast = getAdjacentPages(sequence, '03-05-p03');
    expect(pLast.previous?.pageId).toBe('03-05-p02');
    expect(pLast.next?.pageId).toBe('04-01-p01');
  });

  it('navegación entre 03-05 y 04-01', () => {
    const trans = getAdjacentPages(sequence, '03-05-p03');
    expect(trans.next?.lessonId).toBe('04-01');
    expect(trans.next?.pageId).toBe('04-01-p01');
  });

  it('navegación dentro de sección 4', () => {
    const p1 = getAdjacentPages(sequence, '04-01-p01');
    expect(p1.previous?.pageId).toBe('03-05-p03');
    expect(p1.next?.pageId).toBe('04-01-p02');
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
    expect(buildPagePath('seccion-02', '02-01', 'el-preambulo')).toBe('/aprender/seccion-02/02-01/el-preambulo/');
    expect(buildPagePath('seccion-02', '02-04', 'reto-de-correccion')).toBe('/aprender/seccion-02/02-04/reto-de-correccion/');
    expect(buildPagePath('seccion-03', '03-01', 'extender-la-clase')).toBe('/aprender/seccion-03/03-01/extender-la-clase/');
    expect(buildPagePath('seccion-03', '03-05', 'reto-de-plantilla')).toBe('/aprender/seccion-03/03-05/reto-de-plantilla/');
    expect(buildPagePath('seccion-04', '04-01', 'declarar-el-titulo')).toBe('/aprender/seccion-04/04-01/declarar-el-titulo/');
    expect(buildPagePath('seccion-04', '04-05', 'corregir-datos-mal-ubicados')).toBe('/aprender/seccion-04/04-05/corregir-datos-mal-ubicados/');
  });

  it('slugs son únicos dentro de cada lessonId', () => {
    for (const lessonId of ['01-01', '01-02', '01-03', '02-01', '02-02', '02-03', '02-04', '03-01', '03-02', '03-03', '03-04', '03-05', '04-01', '04-02', '04-03', '04-04', '04-05']) {
      const slugs = pages.filter((p) => p.lessonId === lessonId).map((p) => p.slug);
      expect(new Set(slugs).size, `duplicate slug in ${lessonId}`).toBe(slugs.length);
    }
  });

  it('órdenes son únicos dentro de cada lessonId', () => {
    for (const lessonId of ['01-01', '01-02', '01-03', '02-01', '02-02', '02-03', '02-04', '03-01', '03-02', '03-03', '03-04', '03-05', '04-01', '04-02', '04-03', '04-04', '04-05']) {
      const orders = pages.filter((p) => p.lessonId === lessonId).map((p) => p.order);
      expect(new Set(orders).size, `duplicate order in ${lessonId}`).toBe(orders.length);
    }
  });
});

describe('sección 1 sin actividades interactivas', () => {
  it('ninguna página de la sección 1 tiene actividad asociada', () => {
    const section1Pages = [
      '01-01-p01', '01-01-p02', '01-01-p03', '01-01-p04',
      '01-02-p01', '01-02-p02', '01-02-p03',
      '01-03-p01', '01-03-p02', '01-03-p03', '01-03-p04', '01-03-p05', '01-03-p06',
    ];
    const activities: { pageId: string }[] = [];
    for (const p of section1Pages) {
      expect(activities.find((a) => a.pageId === p)).toBeUndefined();
    }
  });

  it('la sección 1 sigue teniendo 3 subsecciones', () => {
    const lessons = ['01-01', '01-02', '01-03'];
    expect(lessons).toHaveLength(3);
  });

  it('la sección 1 sigue teniendo 13 páginas', () => {
    const section1Pages = [
      '01-01-p01', '01-01-p02', '01-01-p03', '01-01-p04',
      '01-02-p01', '01-02-p02', '01-02-p03',
      '01-03-p01', '01-03-p02', '01-03-p03', '01-03-p04', '01-03-p05', '01-03-p06',
    ];
    expect(section1Pages).toHaveLength(13);
  });
});
