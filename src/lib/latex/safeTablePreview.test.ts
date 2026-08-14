import { describe, expect, it } from 'vitest';
import { parseSafeLatexPreview } from './safeLatexPreview';
import { parseSafeTablePreview } from './safeTablePreview';

describe('vista previa segura de tablas', () => {
  it('representa tabular con alineaciones, barras, hline y celdas', () => {
    const result = parseSafeTablePreview(String.raw`
      \begin{tabular}{|l|c|r|}
      \hline
      Nombre & Grupo & Nota \\
      \hline
      Ana & A & 18 \\
      \hline
      \end{tabular}
    `, []);

    expect(result.errors).toEqual([]);
    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].columns).toEqual(['left', 'center', 'right']);
    expect(result.tables[0].verticalRules).toEqual([0, 1, 2, 3]);
    expect(result.tables[0].rows[0].cells.map((cell) => cell.text)).toEqual([
      'Nombre',
      'Grupo',
      'Nota',
    ]);
    expect(result.tables[0].headerRows).toEqual([0]);
  });

  it('representa booktabs, multicolumn, caption, centering y colocación', () => {
    const result = parseSafeLatexPreview(String.raw`
      \documentclass{article}
      \usepackage{booktabs}
      \begin{document}
      \begin{table}[htbp]
      \centering
      \caption{Resumen de resultados}
      \begin{tabular}{lrr}
      \toprule
      Grupo & \multicolumn{2}{c}{Resultados} \\
      \cmidrule(lr){2-3}
      & Media & Varianza \\
      \midrule
      A & 14.2 & 1.21 \\
      \bottomrule
      \end{tabular}
      \end{table}
      \end{document}
    `);

    expect(result.errors).toEqual([]);
    expect(result.tables).toHaveLength(1);
    expect(result.tables[0]).toMatchObject({
      caption: 'Resumen de resultados',
      centered: true,
      placement: 'htbp',
      usesBooktabs: true,
      headerRows: [0, 1],
    });
    expect(result.tables[0].rows[0].cells[1]).toMatchObject({
      text: 'Resultados',
      column: 1,
      colSpan: 2,
      alignment: 'center',
    });
    expect(result.paragraphs).toEqual([]);
    expect(result.unsupportedCommands).toEqual([]);
  });

  it('representa multirow y omite la celda ocupada en la fila siguiente', () => {
    const result = parseSafeLatexPreview(String.raw`
      \documentclass{article}
      \usepackage{multirow}
      \begin{document}
      \begin{tabular}{llr}
      \multirow{2}{*}{Control} & Inicial & 12 \\
      & Final & 15
      \end{tabular}
      \end{document}
    `);

    expect(result.errors).toEqual([]);
    const [first, second] = result.tables[0].rows;
    expect(first.cells[0]).toMatchObject({ text: 'Control', rowSpan: 2, column: 0 });
    expect(second.cells.map((cell) => cell.text)).toEqual(['Final', '15']);
    expect(second.cells.map((cell) => cell.column)).toEqual([1, 2]);
  });

  it('rechaza paquetes ausentes, especificaciones inseguras y filas incoherentes', () => {
    const result = parseSafeLatexPreview(String.raw`
      \documentclass{article}
      \begin{document}
      \begin{tabular}{lp{4cm}}
      \toprule
      A & B & C
      \end{tabular}
      \multirow{2}{*}{Dato}
      \end{document}
    `);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Especificación de columnas no soportada: {lp{4cm}}. Usa únicamente l, c, r y |.',
    );
    expect(result.errors).toContain('\\multirow requiere \\usepackage{multirow} en el preámbulo.');
  });

  it('no conserva tablas parciales cuando sobran o faltan celdas', () => {
    for (const source of [
      String.raw`\begin{tabular}{lr}A & B & C\\\end{tabular}`,
      String.raw`\begin{tabular}{lr}A\\\end{tabular}`,
      String.raw`\begin{tabular}{lrr}\multirow{2}{*}{Grupo} & A & 1\\13 & 15\\\end{tabular}`,
    ]) {
      const result = parseSafeTablePreview(source, ['multirow']);
      expect(result.errors.length, source).toBeGreaterThan(0);
      expect(result.tables).toHaveLength(0);
    }
  });

  it('conserva el rango exacto de cmidrule', () => {
    const result = parseSafeTablePreview(String.raw`\begin{tabular}{lrr}
Grupo & \multicolumn{2}{c}{Resultados}\\
\cmidrule(lr){2-3}
& Media & Varianza\\
\end{tabular}`, ['booktabs']);
    expect(result.errors).toEqual([]);
    expect(result.tables[0].partialRules).toEqual([{ start: 2, end: 3, trim: 'lr' }]);
  });

  it('no inventa encabezados cuando no hay una separación estructural', () => {
    const result = parseSafeTablePreview(String.raw`\begin{tabular}{lr}
Dato & 14.2\\
Otro dato & 15.1
\end{tabular}`, []);

    expect(result.errors).toEqual([]);
    expect(result.tables[0].headerRows).toEqual([]);
  });

  it('rechaza spans cero, negativos, fuera de rango y solapados', () => {
    const sources = [
      String.raw`\begin{tabular}{ll}\multicolumn{0}{c}{X} & Y\\\end{tabular}`,
      String.raw`\begin{tabular}{ll}\multicolumn{-1}{c}{X} & Y\\\end{tabular}`,
      String.raw`\begin{tabular}{ll}\multirow{0}{*}{X} & Y\\\end{tabular}`,
      String.raw`\begin{tabular}{ll}\multirow{-1}{*}{X} & Y\\\end{tabular}`,
      String.raw`\begin{tabular}{ll}\multicolumn{3}{c}{X}\\\end{tabular}`,
      String.raw`\begin{tabular}{ll}\multirow{2}{*}{X} & Y\\\multicolumn{2}{c}{Z}\\\end{tabular}`,
    ];
    for (const source of sources) {
      const result = parseSafeTablePreview(source, ['multirow']);
      expect(result.errors.length, source).toBeGreaterThan(0);
      expect(result.tables, source).toHaveLength(0);
    }
  });

  it('no confunde un tabular inválido con un tabular ausente', () => {
    const result = parseSafeTablePreview(
      String.raw`\begin{table}\begin{tabular}{ll}\multicolumn{0}{c}{X} & Y\\\end{tabular}\end{table}`,
      [],
    );
    expect(result.errors.some((error) => error.includes('span de columnas'))).toBe(true);
    expect(result.errors).not.toContain('El entorno table necesita un tabular para mostrar datos.');
  });
});
