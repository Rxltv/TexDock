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
});
