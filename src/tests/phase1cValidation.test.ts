import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateExercise, type ValidationRule } from '../lib/exercises/validateExercise';

interface Exercise {
  id: string;
  initialCode: string;
  canonicalSolution: string;
  validationRules: ValidationRule[];
}

function exercise(id: string): Exercise {
  return JSON.parse(
    readFileSync(resolve(`src/content/exercise/${id}.json`), 'utf8'),
  ) as Exercise;
}

function validate(id: string, code: string) {
  return validateExercise(code, exercise(id).validationRules);
}

describe('Fase 1C: bloqueantes y paquetes', () => {
  it.each(['03-05-01', '03-05-02', '13-06-02'])(
    'aprueba la solución canónica de %s',
    (id) => expect(validate(id, exercise(id).canonicalSolution).valid).toBe(true),
  );

  it('rechaza clase book, clase ausente, cuerpo vacío y cuerpo con solo comandos', () => {
    const canonical = exercise('03-05-02').canonicalSolution;
    expect(validate('03-05-02', canonical.replace('{article}', '{book}')).valid).toBe(false);
    expect(validate('03-05-02', canonical.replace('\\documentclass{article}\n\n', '')).valid).toBe(false);
    expect(validate('03-05-02', canonical.replace(
      'Este documento está configurado para escribir en español.',
      '',
    )).valid).toBe(false);
    expect(validate('03-05-02', canonical.replace(
      'Este documento está configurado para escribir en español.',
      '\\maketitle',
    )).valid).toBe(false);
    expect(validate('03-05-02', canonical.replace(
      'Este documento está configurado para escribir en español.',
      'Una redacción alternativa.',
    )).valid).toBe(true);
    expect(validate('03-05-02', canonical.replace(
      'Este documento está configurado para escribir en español.',
      '\\label{x}',
    )).valid).toBe(false);
    expect(validate('03-05-02', canonical.replace(
      '\\documentclass{article}',
      '\\documentclass{article}\n\\begin{document}\n\\documentclass{article}',
    )).valid).toBe(false);
    expect(validate('03-05-02', canonical.replace(
      'Este documento está configurado para escribir en español.',
      '\\foo{Hola}',
    )).valid).toBe(false);
  });

  it.each(['03-05-01', '03-05-02'])(
    'rechaza paquetes invertidos, opciones cruzadas, nombres sueltos y ausencias en %s',
    (id) => {
      const canonical = exercise(id).canonicalSolution;
      expect(validate(id, canonical.replace(
        '\\usepackage[T1]{fontenc}\n\\usepackage[utf8]{inputenc}',
        '\\usepackage[utf8]{inputenc}\n\\usepackage[T1]{fontenc}',
      )).valid).toBe(false);
      expect(validate(id, canonical
        .replace('[T1]{fontenc}', '[utf8]{fontenc}')
        .replace('[utf8]{inputenc}', '[T1]{inputenc}')).valid).toBe(false);
      expect(validate(id, canonical.replace('\\usepackage[T1]{fontenc}', 'fontenc T1')).valid).toBe(false);
      expect(validate(id, canonical.replace('\\usepackage[spanish]{babel}\n', '')).valid).toBe(false);
    },
  );
});

describe('Fase 1C: Sección 4', () => {
  it('exige una fecha fija no vacía distinta de today', () => {
    const canonical = exercise('04-02-02').canonicalSolution;
    expect(validate('04-02-02', canonical).valid).toBe(true);
    expect(validate('04-02-02', canonical.replace('21 de julio de 2026', 'Otra fecha fija')).valid).toBe(true);
    expect(validate('04-02-02', canonical.replace('21 de julio de 2026', '\\today')).valid).toBe(false);
    expect(validate('04-02-02', canonical.replace('21 de julio de 2026', '')).valid).toBe(false);
  });

  it('exige maketitle como primer contenido real', () => {
    const canonical = exercise('04-03-01').canonicalSolution;
    expect(validate('04-03-01', canonical).valid).toBe(true);
    expect(validate('04-03-01', canonical.replace('\\begin{document}\n', '\\begin{document}\n% comentario\n\n')).valid).toBe(true);
    expect(validate('04-03-01', canonical.replace('\\maketitle\nTexto', 'Antes.\n\\maketitle\nTexto')).valid).toBe(false);
    expect(validate('04-03-01', canonical.replace('\\maketitle\nTexto', '\\tableofcontents\n\\maketitle\nTexto')).valid).toBe(false);
  });

  it('acepta exactamente dos oraciones alternativas en abstract', () => {
    const canonical = exercise('04-04-02').canonicalSolution;
    expect(validate('04-04-02', canonical).valid).toBe(true);
    expect(validate('04-04-02', canonical.replace(
      'Este documento introduce el concepto de función matemática. El objetivo es comprender su definición y aplicaciones básicas.',
      'Se estudian funciones. Buscamos comprender sus aplicaciones.',
    )).valid).toBe(true);
    expect(validate('04-04-02', exercise('04-04-02').initialCode).valid).toBe(false);
    expect(validate('04-04-02', canonical.replace(
      'Este documento introduce el concepto de función matemática. El objetivo es comprender su definición y aplicaciones básicas.',
      '. .',
    )).valid).toBe(false);
  });

  it('rechaza metadatos y abstract duplicados o mal ubicados', () => {
    const canonical = exercise('04-05-02').canonicalSolution;
    expect(validate('04-05-02', canonical).valid).toBe(true);
    expect(validate('04-05-02', canonical.replace('\\author{Ana Torres}', '\\author{Ana Torres}\n\\author{Otra}')).valid).toBe(false);
    expect(validate('04-05-02', canonical.replace('\\date{21 de julio de 2026}', '\\date{21 de julio de 2026}\n\\date{Otra}')).valid).toBe(false);
    expect(validate('04-05-02', canonical.replace('\\begin{document}', '\\begin{abstract}Otro.\\end{abstract}\n\\begin{document}')).valid).toBe(false);
    expect(validate('04-05-02', exercise('04-05-02').initialCode).valid).toBe(false);
  });
});

describe('Fase 1C: índice y jerarquía', () => {
  it.each(['05-04-01', '05-04-02', '05-04-03', '05-05-01', '05-05-02'])(
    'aprueba la solución canónica de %s',
    (id) => expect(validate(id, exercise(id).canonicalSolution).valid).toBe(true),
  );

  it('rechaza secciones antes del índice, eliminadas, reordenadas o duplicadas', () => {
    const toc = exercise('05-04-01').canonicalSolution;
    expect(validate('05-04-01', toc.replace('\\tableofcontents', '\\section{Previa}\n\\tableofcontents')).valid).toBe(false);
    const update = exercise('05-04-02').canonicalSolution;
    expect(validate('05-04-02', update.replace('\\section{Método}\nProcedimiento.\n\n', '')).valid).toBe(false);
    expect(validate('05-04-02', update.replace(
      '\\section{Introducción}\nPresentación.\n\n\\section{Método}\nProcedimiento.',
      '\\section{Método}\nProcedimiento.\n\n\\section{Introducción}\nPresentación.',
    )).valid).toBe(false);
    const thanks = exercise('05-04-03').canonicalSolution;
    expect(validate('05-04-03', thanks.replace('\\section*{Agradecimientos}', '\\section*{Agradecimientos}\n\\section{Agradecimientos}')).valid).toBe(false);
  });

  it('rechaza niveles secundarios fuera de su jerarquía', () => {
    const skeleton = exercise('05-05-01').canonicalSolution;
    expect(validate('05-05-01', skeleton
      .replace('\\section{Desarrollo}\n', '')
      .replace('\\section{Conclusiones}', '\\section{Desarrollo}\n\\section{Conclusiones}')).valid).toBe(false);
    expect(validate('05-05-01', skeleton.replace('\\subsection{Marco conceptual}\n', '')).valid).toBe(false);
    const flat = exercise('05-05-02').canonicalSolution;
    expect(validate('05-05-02', flat.replace('\\section{Introducción}\n', '')).valid).toBe(false);
    expect(validate('05-05-02', flat.replace('\\section{Conclusiones}', '\\section{Conclusiones}\n\\subsection{Objetivos}')).valid).toBe(false);
    expect(validate('05-05-02', flat.replace('\\subsection{Objetivos}', '\\section{Objetivos}')).valid).toBe(false);
  });
});

describe('Fase 1C: tablas', () => {
  const ids = ['10-01-01', '10-04-02', '10-05-02', '10-06-02', '10-07-01', '10-08-01'];

  it.each(ids)('aprueba la estructura canónica de %s', (id) => {
    expect(validate(id, exercise(id).canonicalSolution).valid).toBe(true);
  });

  it('rechaza columnas incorrectas, filas omitidas y datos fuera de tabular', () => {
    const basic = exercise('10-01-01').canonicalSolution;
    expect(validate('10-01-01', basic.replace('{lr}', '{lrr}')).valid).toBe(false);
    expect(validate('10-01-01', basic.replace('Ana & 18', '')).valid).toBe(false);
    expect(validate('10-01-01', basic.replace('Ana & 18\n\\end{tabular}', '\\end{tabular}\nAna & 18')).valid).toBe(false);
  });

  it('rechaza líneas verticales y filas incompletas de booktabs', () => {
    const publication = exercise('10-04-02').canonicalSolution;
    expect(validate('10-04-02', publication.replace('{lrr}', '{l|rr}')).valid).toBe(false);
    expect(validate('10-04-02', publication.replace('A & 14.2 & 1.1 \\\\\n', '')).valid).toBe(false);
  });

  it('rechaza encabezados incompletos, cmidrule incorrecta y multirow mal formado', () => {
    const grouped = exercise('10-05-02').canonicalSolution;
    expect(validate('10-05-02', grouped.replace('& Media & Varianza \\\\', '& Media \\\\')).valid).toBe(false);
    expect(validate('10-05-02', grouped.replace('{2-3}', '{1-3}')).valid).toBe(false);
    const multirow = exercise('10-06-02').canonicalSolution;
    expect(validate('10-06-02', multirow.replace('\\multirow{2}', '\\multirow{1}')).valid).toBe(false);
    expect(validate('10-06-02', multirow.replace('& 13 & 15', '& 13')).valid).toBe(false);
  });

  it('rechaza table vacío, centrado o caption fuera y una fila A ausente', () => {
    const floating = exercise('10-07-01').canonicalSolution;
    expect(validate('10-07-01', floating.replace('\\centering\n', '')).valid).toBe(false);
    expect(validate('10-07-01', floating.replace('\\caption{Resultados finales}\n', '')).valid).toBe(false);
    expect(validate('10-07-01', floating
      .replace('\\caption{Resultados finales}\n', '')
      .replace('\\begin{table}[htbp]', '\\caption{Resultados finales}\n\\begin{table}[htbp]')).valid).toBe(false);
    const complete = exercise('10-08-01').canonicalSolution;
    expect(validate('10-08-01', complete.replace('A & 14.2 & 1.21 \\\\\n', '')).valid).toBe(false);
  });
});

describe('Fase 1C: figuras y bibliografía', () => {
  it.each(['15-06-04', '15-09-04', '15-10-02'])(
    'aprueba la solución canónica de %s',
    (id) => expect(validate(id, exercise(id).canonicalSolution).valid).toBe(true),
  );

  it('exige los captions dentro de sus subfiguras correspondientes', () => {
    const canonical = exercise('15-06-04').canonicalSolution;
    expect(validate('15-06-04', canonical.replace('\\caption{Antes}\n', '')).valid).toBe(false);
    expect(validate('15-06-04', canonical
      .replace('\\caption{Antes}', '\\caption{Temporal}')
      .replace('\\caption{Después}', '\\caption{Antes}')
      .replace('\\caption{Temporal}', '\\caption{Después}')).valid).toBe(false);
    expect(validate('15-06-04', canonical
      .replace('\\caption{Antes}\n', '')
      .replace('\\begin{subfigure}{0.45\\textwidth}', '\\caption{Antes}\n\\begin{subfigure}{0.45\\textwidth}')).valid).toBe(false);
    const swappedLabels = canonical
      .replace('\\label{fig:antes}', '\\label{fig:tmp}')
      .replace('\\label{fig:despues}', '\\label{fig:antes}')
      .replace('\\label{fig:tmp}', '\\label{fig:despues}');
    expect(validate('15-06-04', swappedLabels).valid).toBe(false);
  });

  it('exige la referencia concreta fig:resultado', () => {
    const canonical = exercise('15-09-04').canonicalSolution;
    expect(validate('15-09-04', canonical.replace('\\ref{fig:resultado}', '')).valid).toBe(false);
    expect(validate('15-09-04', canonical
      .replaceAll('fig:resultado', 'fig:renombrada')).valid).toBe(false);
    expect(validate('15-09-04', canonical.replace('\\ref{fig:resultado}', '\\ref{tab:media}')).valid).toBe(false);
    expect(validate('15-09-04', canonical.replace('\\ref{fig:resultado}', '\\reff{fig:resultado}')).valid).toBe(false);
    const captionOnly = canonical
      .replace('La figura \\ref{fig:resultado} muestra la distribución.', 'La figura muestra la distribución.')
      .replace('\\caption{Distribución}', '\\caption{Distribución \\ref{fig:resultado}}');
    expect(validate('15-09-04', captionOnly).valid).toBe(false);
  });

  it('exige dos fuentes distintas y que ambas estén citadas y resueltas', () => {
    const canonical = exercise('15-10-02').canonicalSolution;
    const withoutSecondEntry = canonical.replace(
      /\\bibitem\{articulo-final\}[^\n]*\n/,
      '',
    ).replace(',articulo-final', '');
    expect(validate('15-10-02', withoutSecondEntry).valid).toBe(false);
    expect(validate('15-10-02', canonical.replace(
      '\\bibitem{articulo-final}',
      '\\bibitem{libro-final}',
    )).valid).toBe(false);
    expect(validate('15-10-02', canonical.replace(',articulo-final', '')).valid).toBe(false);
    expect(validate('15-10-02', canonical.replace('articulo-final}', 'sin-entrada}')).valid).toBe(false);
    const emptySources = canonical.replace(
      /\\bibitem\{libro-final\}[^\n]*\n\\bibitem\{articulo-final\}[^\n]*/,
      '\\bibitem{a}\n\\bibitem{b}',
    ).replace('libro-final,articulo-final', 'a,b');
    expect(validate('15-10-02', emptySources).valid).toBe(false);
    const sameSources = canonical.replace(
      /\\bibitem\{articulo-final\}[^\n]*/,
      '\\bibitem{articulo-alterno} Ana Torres. Modelos para aprender. Editorial Aula, 2026. Ejemplo ficticio.',
    ).replace('articulo-final', 'articulo-alterno');
    expect(validate('15-10-02', sameSources).valid).toBe(false);
  });
});
